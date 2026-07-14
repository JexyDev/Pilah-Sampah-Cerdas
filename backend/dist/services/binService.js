import { v4 as uuidv4 } from "uuid";
import { binRepository } from "../repositories/binRepository.js";
import { getDistanceMeters } from "../utils/haversineUtils.js";
// Density configurations (Kg per Liter)
const DENSITY = {
    ORGANIC: 0.4, // Organic waste is denser
    NON_ORGANIC: 0.2 // Non-organic is lighter
};
export class BinService {
    /**
     * Get all bins
     */
    async getAllBins() {
        return binRepository.findAll();
    }
    /**
     * Process a QR scan transaction
     */
    async processScan(qrCode, userId, householdId, detectedType, estimatedVolume, userLat, userLng) {
        // 1. Find the Bin
        const bin = await binRepository.findByQrCode(qrCode);
        if (!bin) {
            throw new Error("BIN_NOT_FOUND");
        }
        // 2. Validate Geofencing (< 10m) if coordinates are provided
        if (userLat !== undefined && userLng !== undefined && bin.latitude !== null && bin.longitude !== null) {
            const distance = getDistanceMeters(userLat, userLng, Number(bin.latitude), Number(bin.longitude));
            if (distance > 10) {
                const error = new Error("LOCATION_OUT_OF_RANGE");
                error.distanceMeters = parseFloat(distance.toFixed(2));
                throw error;
            }
        }
        // 3. Validate trash type matching
        if (bin.category.name !== detectedType) {
            const error = new Error("BIN_TYPE_MISMATCH");
            error.binType = bin.category.name;
            throw error;
        }
        // 4. Check remaining capacity
        const current = Number(bin.currentVolumeLiter);
        const max = Number(bin.maxCapacityLiter);
        if (current + estimatedVolume > max) {
            // Create user notification for overflow async
            await binRepository.createOverflowNotification(userId, bin.qrCode).catch(() => { });
            throw new Error("BIN_OVERFLOW");
        }
        // 5. Update Bin current volume
        const newVolume = current + estimatedVolume;
        await binRepository.updateVolume(bin.id, newVolume);
        // 6. Convert liters to weight based on density
        // Use fixed multiplier for Organic vs Non-Organic for now (simplified)
        const isOrganic = bin.category.name === "ORGANIC";
        const factor = isOrganic ? DENSITY.ORGANIC : DENSITY.NON_ORGANIC;
        const weightKg = parseFloat((estimatedVolume * factor).toFixed(2));
        // 7. Calculate points
        // Fallback if pointsPerKg is 0 in DB
        const pointsPerKg = bin.category.pointsPerKg || (isOrganic ? 100 : 50);
        const calculatedPoints = Math.round(weightKg * pointsPerKg);
        // 8. Record transaction (WasteLog, PointHistory, Notification)
        const requestId = uuidv4();
        const result = await binRepository.recordScanTransaction(householdId, bin.id, bin.categoryId, weightKg, estimatedVolume, requestId, userId, calculatedPoints, bin.category.name);
        return {
            wasteLogId: result.wasteLog.id,
            weightKg,
            volumeLiter: estimatedVolume,
            pointsAwarded: calculatedPoints,
            newBinVolume: newVolume
        };
    }
    /**
     * Get bin status by ID
     */
    async getBinStatus(binId) {
        // Requires findById in repository
        const bin = await binRepository.findById(binId);
        if (!bin) {
            throw new Error("BIN_NOT_FOUND");
        }
        return bin;
    }
    /**
     * Empty bin
     */
    async emptyBin(binId) {
        const bin = await binRepository.findById(binId);
        if (!bin) {
            throw new Error("BIN_NOT_FOUND");
        }
        await binRepository.updateVolume(bin.id, 0);
    }
}
export const binService = new BinService();
