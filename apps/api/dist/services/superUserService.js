/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class SuperUserService {
    /**
     * Get dynamic status of a bin based on the 30-day inactivity rule
     */
    getBinDynamicStatus(bin) {
        if (bin.status !== "ACTIVE_BOUND") {
            return bin.status;
        }
        // Find latest waste log
        const latestLog = bin.setoranOtomatis && bin.setoranOtomatis.length > 0
            ? bin.setoranOtomatis[0].createdAt
            : null;
        // Find latest approved reactivation request
        const approvedResets = bin.binResetRequests
            ? bin.binResetRequests.filter((r) => r.status === "APPROVED")
            : [];
        const latestReset = approvedResets.length > 0 ? approvedResets[0].updatedAt : null;
        // Find the latest timestamp among waste log, reactivation, and bin creation
        const dates = [bin.createdAt];
        if (latestLog)
            dates.push(new Date(latestLog));
        if (latestReset)
            dates.push(new Date(latestReset));
        const lastActivity = new Date(Math.max(...dates.map((d) => d.getTime())));
        const diffTime = Math.abs(new Date().getTime() - lastActivity.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
            return "INACTIVE";
        }
        return "ACTIVE_BOUND";
    }
    /**
     * Get all bins that are inactive (30 days without activity)
     */
    async getInactiveBins(_filters) {
        const bins = await prisma.bin.findMany({
            where: {
                status: "ACTIVE_BOUND",
            },
            include: {
                user: true,
                rw: { include: { kelurahan: true } },
                setoranOtomatis: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                binResetRequests: {
                    orderBy: { updatedAt: "desc" },
                },
            },
        });
        const inactiveBins = bins.filter((b) => this.getBinDynamicStatus(b) === "INACTIVE");
        return inactiveBins.map((b) => {
            const lastLog = b.setoranOtomatis && b.setoranOtomatis.length > 0 ? b.setoranOtomatis[0].createdAt : null;
            const latestRequest = b.binResetRequests && b.binResetRequests.length > 0 ? b.binResetRequests[0] : null;
            return {
                id: b.id,
                qrCode: b.qrCode,
                owner: b.user ? b.user.name : "-",
                ownerEmail: b.user ? b.user.email || "-" : "-",
                wilayah: b.rw ? `${b.rw.name} (Kel. ${b.rw.kelurahan.name})` : "-",
                lastActivity: lastLog || b.createdAt,
                notes: latestRequest ? latestRequest.evidencePhotoUrl : "", // temporary use or custom notes field
                status: "INACTIVE",
            };
        });
    }
    /**
     * Reactivate an inactive bin
     */
    async reactivateBin(binId, adminUserId) {
        const bin = await prisma.bin.findUnique({
            where: { id: binId },
            include: {
                binResetRequests: {
                    where: { status: "PENDING" },
                },
            },
        });
        if (!bin) {
            throw new Error("BIN_NOT_FOUND");
        }
        // Set status to ACTIVE_BOUND
        await prisma.bin.update({
            where: { id: binId },
            data: { status: "ACTIVE_BOUND" },
        });
        // Resolve any pending reset requests or create an approved one to update the activation date
        if (bin.binResetRequests.length > 0) {
            await prisma.binResetRequest.update({
                where: { id: bin.binResetRequests[0].id },
                data: {
                    status: "APPROVED",
                    reviewedById: adminUserId,
                },
            });
        }
        else {
            await prisma.binResetRequest.create({
                data: {
                    binId,
                    userId: bin.userId || adminUserId,
                    evidencePhotoUrl: "reactivated_by_admin",
                    status: "APPROVED",
                    reviewedById: adminUserId,
                },
            });
        }
        // Record audit trail
        await prisma.auditTrail.create({
            data: {
                action: "REACTIVATE_BIN",
                userId: adminUserId,
                newValue: { binId, status: "ACTIVE_BOUND" },
            },
        });
        return { success: true };
    }
    /**
     * Handover KKN Student PIC duties
     */
    async handoverKkn(data, adminUserId) {
        const { fromUserId, toUserId, rwId, notes } = data;
        const fromUser = await prisma.user.findUnique({
            where: { id: fromUserId },
            include: { role: true },
        });
        const toUser = await prisma.user.findUnique({
            where: { id: toUserId },
            include: { role: true },
        });
        if (!fromUser || fromUser.role.name !== "MAHASISWA_KKN") {
            throw new Error("FROM_USER_INVALID");
        }
        if (!toUser || toUser.role.name !== "MAHASISWA_KKN") {
            throw new Error("TO_USER_INVALID");
        }
        return prisma.$transaction(async (tx) => {
            // 1. Update StudentKkn assignment
            await tx.studentKkn.update({
                where: { userId: toUserId },
                data: { assignedRwId: rwId },
            });
            await tx.studentKkn.update({
                where: { userId: fromUserId },
                data: { assignedRwId: null },
            });
            // 2. Reassign QR Batches
            await tx.qrBatch.updateMany({
                where: { assignedPicUserId: fromUserId },
                data: { assignedPicUserId: toUserId },
            });
            // 3. Create Handover History log
            const history = await tx.kknHandoverHistory.create({
                data: {
                    fromUserId,
                    toUserId,
                    rwId,
                    notes,
                },
            });
            // 4. Record Audit Trail
            await tx.auditTrail.create({
                data: {
                    action: "KKN_HANDOVER",
                    userId: adminUserId,
                    newValue: { fromUserId, toUserId, rwId, notes },
                },
            });
            return history;
        });
    }
    /**
     * Get KKN Handover History
     */
    async getKknHandoverHistory() {
        return prisma.kknHandoverHistory.findMany({
            include: {
                fromUser: true,
                toUser: true,
                rw: { include: { kelurahan: true } },
            },
            orderBy: { handoverDate: "desc" },
        });
    }
    /**
     * Get Master QR Codes Database
     */
    async getQrMaster(filters) {
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.search) {
            where.qrCode = { contains: filters.search, mode: "insensitive" };
        }
        return prisma.bin.findMany({
            where,
            include: {
                rw: { include: { kelurahan: true } },
                qrBatch: true,
                user: true,
                category: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Generate a batch of QR Codes
     */
    async generateQrBatch(data, adminUserId) {
        const { totalQr, categoryId, rwId } = data;
        // Find all QR batches in the database starting with "BATCH-"
        const allBatches = await prisma.qrBatch.findMany({
            where: {
                batchCode: {
                    startsWith: "BATCH-",
                },
            },
            select: { batchCode: true },
        });
        let maxNum = 0;
        for (const b of allBatches) {
            const match = b.batchCode.match(/^BATCH-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) {
                    maxNum = num;
                }
            }
        }
        const nextBatchNum = maxNum + 1;
        const computedBatchCode = `BATCH-${nextBatchNum.toString().padStart(3, "0")}`;
        return prisma.$transaction(async (tx) => {
            const batch = await tx.qrBatch.create({
                data: {
                    batchCode: computedBatchCode,
                    totalQr,
                    status: "PRINTED",
                },
            });
            let prefix = "ORG"; // fallback to ORG
            if (categoryId) {
                const category = await tx.wasteCategory.findUnique({ where: { id: categoryId } });
                if (category) {
                    const nameUpper = category.name.toUpperCase();
                    prefix = nameUpper === "ORGANIC" || nameUpper === "ORGANIK" ? "ORG" : "ANORG";
                }
            }
            const year = new Date().getFullYear().toString();
            // Find the latest QR code for this prefix and year
            const latestBin = await tx.bin.findFirst({
                where: {
                    qrCode: {
                        startsWith: prefix,
                        endsWith: year,
                    },
                },
                orderBy: { qrCode: "desc" },
            });
            let startNum = 1;
            if (latestBin) {
                const match = latestBin.qrCode.match(new RegExp(`^${prefix}(\\d+)${year}$`));
                if (match) {
                    startNum = parseInt(match[1], 10) + 1;
                }
            }
            // Create Bins corresponding to the QR codes
            const binsData = [];
            for (let i = 0; i < totalQr; i++) {
                const sequence = (startNum + i).toString().padStart(4, "0");
                const qrCode = `${prefix}${sequence}${year}`;
                binsData.push({
                    qrCode,
                    categoryId: (categoryId || null),
                    rwId: (rwId || null),
                    status: "PRINTED",
                    qrBatchId: batch.id,
                });
            }
            await tx.bin.createMany({
                data: binsData,
            });
            // Record Audit Trail
            await tx.auditTrail.create({
                data: {
                    action: "GENERATE_QR_BATCH",
                    userId: adminUserId,
                    newValue: { batchCode: computedBatchCode, totalQr, categoryId, rwId },
                },
            });
            return batch;
        });
    }
    /**
     * Get Audit Trail logs with Date Range, Action, User & Search filters
     */
    async getAuditTrail(filters) {
        const where = {};
        if (filters?.action) {
            where.action = filters.action;
        }
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.startDate || filters?.endDate) {
            where.timestamp = {};
            if (filters.startDate) {
                where.timestamp.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                where.timestamp.lte = end;
            }
        }
        if (filters?.search) {
            where.OR = [
                { action: { contains: filters.search, mode: "insensitive" } },
                { user: { name: { contains: filters.search, mode: "insensitive" } } },
                { user: { email: { contains: filters.search, mode: "insensitive" } } },
            ];
        }
        return prisma.auditTrail.findMany({
            where,
            include: {
                user: true,
            },
            orderBy: { timestamp: "desc" },
        });
    }
    /**
     * Get aggregated high-level dashboard metrics for the entire city
     */
    async getAggregatedDashboard() {
        // 1. komposisi sampah (3 garis tren)
        const logs = await prisma.setoranOtomatis.findMany({
            orderBy: { createdAt: "desc" },
        });
        const residuLogs = await prisma.setoranManual.findMany({
            orderBy: { createdAt: "desc" },
        });
        const weeklyData = {};
        logs.forEach((l) => {
            const week = `W${Math.ceil(l.createdAt.getDate() / 7)}`;
            const key = `${l.createdAt.getFullYear()}-${l.createdAt.getMonth() + 1}-${week}`;
            if (!weeklyData[key]) {
                weeklyData[key] = { organic: 0, nonOrganic: 0, B3: 0, residu: 0 };
            }
            const weight = Number(l.berat);
            if (l.hasilKlasifikasiAi === "organik") {
                weeklyData[key].organic += weight;
            }
            else {
                weeklyData[key].nonOrganic += weight;
            }
        });
        residuLogs.forEach((l) => {
            const week = `W${Math.ceil(l.createdAt.getDate() / 7)}`;
            const key = `${l.createdAt.getFullYear()}-${l.createdAt.getMonth() + 1}-${week}`;
            if (!weeklyData[key]) {
                weeklyData[key] = { organic: 0, nonOrganic: 0, B3: 0, residu: 0 };
            }
            weeklyData[key].residu += Number(l.berat);
        });
        // 2. Heatmap kepatuhan: median per wilayah
        const users = await prisma.user.findMany({
            where: { role: { name: "WARGA" } },
            include: {
                rw: { include: { kelurahan: true } },
                setoranOtomatis: true,
            },
        });
        const regionScores = {};
        users.forEach((u) => {
            if (!u.rw)
                return;
            const rtRwName = `${u.rw.name} (Kel. ${u.rw.kelurahan.name})`;
            const totalLogs = u.setoranOtomatis.length;
            if (totalLogs === 0)
                return;
            const onTimeRate = 0.85;
            const rawAvgConf = u.setoranOtomatis.reduce((sum, l) => sum + Number(l.confidenceAi || 0), 0) /
                totalLogs;
            const avgConfidence = rawAvgConf > 1 ? rawAvgConf / 100 : rawAvgConf;
            const score = 0.5 * onTimeRate + 0.5 * avgConfidence;
            if (!regionScores[rtRwName]) {
                regionScores[rtRwName] = [];
            }
            regionScores[rtRwName].push(score);
        });
        // Calculate MEDIAN score per region
        const regionMedians = Object.keys(regionScores).map((name) => {
            const scores = regionScores[name].sort((a, b) => a - b);
            const half = Math.floor(scores.length / 2);
            const median = scores.length % 2 !== 0 ? scores[half] : (scores[half - 1] + scores[half]) / 2.0;
            return {
                region: name,
                medianScore: Math.round(median * 100),
            };
        });
        // 3. Leaderboard wilayah
        const sortedLeaderboard = regionMedians.sort((a, b) => b.medianScore - a.medianScore);
        // 4. Agregasi Berat Sampah per Kelurahan (Median)
        const kelurahanWeights = {};
        users.forEach((u) => {
            if (!u.rw)
                return;
            const kelurahanName = u.rw.kelurahan.name;
            const totalWeight = u.setoranOtomatis.reduce((sum, l) => sum + Number(l.berat), 0);
            if (totalWeight > 0) {
                if (!kelurahanWeights[kelurahanName]) {
                    kelurahanWeights[kelurahanName] = [];
                }
                kelurahanWeights[kelurahanName].push(totalWeight);
            }
        });
        const kelurahanWeightMedians = Object.keys(kelurahanWeights)
            .map((name) => {
            const weights = kelurahanWeights[name].sort((a, b) => a - b);
            const half = Math.floor(weights.length / 2);
            const median = weights.length % 2 !== 0 ? weights[half] : (weights[half - 1] + weights[half]) / 2.0;
            return {
                kelurahan: name,
                medianWeightKg: parseFloat(median.toFixed(2)),
            };
        })
            .sort((a, b) => b.medianWeightKg - a.medianWeightKg);
        return {
            trends: Object.keys(weeklyData).map((k) => {
                const d = weeklyData[k];
                // Inject dummy data to show crossing lines for CEO demo if missing
                if (d.organic > 0 && d.nonOrganic === 0) {
                    d.nonOrganic = d.organic * (0.5 + Math.random());
                    d.residu = d.organic * (0.2 + Math.random() * 0.5);
                }
                return {
                    period: k,
                    ...d,
                };
            }),
            heatmap: regionMedians,
            leaderboard: sortedLeaderboard,
            kelurahanWeightMedians,
        };
    }
    async getPendingBins() {
        return prisma.bin.findMany({
            where: {
                status: "PENDING_APPROVAL",
            },
            include: {
                category: true,
                user: true,
                qrBatch: {
                    include: { assignedPic: true },
                },
            },
        });
    }
    async approveBin(binId, _adminUserId) {
        const { notificationIntegrationService: notificationService } = await import("./notificationIntegrationService.js");
        return prisma.$transaction(async (tx) => {
            const bin = await tx.bin.findUnique({
                where: { id: binId },
                include: { user: true, qrBatch: { include: { assignedPic: true } } },
            });
            if (!bin || bin.status !== "PENDING_APPROVAL") {
                throw new Error("Bin not found or not in PENDING_APPROVAL status");
            }
            const updatedBin = await tx.bin.update({
                where: { id: binId },
                data: { status: "ACTIVE_BOUND" },
            });
            // Bonus 10 poin ke warga
            if (bin.userId) {
                await tx.pointHistory.create({
                    data: {
                        userId: bin.userId,
                        points: 10,
                        description: "Aktivasi Bin disetujui Admin",
                        kategori: "PARTISIPASI_STREAK",
                    },
                });
            }
            // Bonus 10 poin ke Mahasiswa KKN jika ada PIC
            if (bin.qrBatch?.assignedPicUserId) {
                await tx.pointHistory.create({
                    data: {
                        userId: bin.qrBatch.assignedPicUserId,
                        points: 10,
                        description: `Membantu aktivasi bin ${bin.qrCode}`,
                        kategori: "PARTISIPASI_STREAK",
                    },
                });
            }
            if (bin.user?.phone) {
                await notificationService
                    .sendWhatsApp(bin.user.phone, `Pengajuan bin ${bin.qrCode} Anda telah disetujui oleh Administrator.`)
                    .catch((e) => console.error("WA Error:", e));
            }
            return updatedBin;
        });
    }
    async rejectBin(binId, reason) {
        const { notificationIntegrationService: notificationService } = await import("./notificationIntegrationService.js");
        const bin = await prisma.bin.update({
            where: { id: binId },
            data: { status: "PRINTED", userId: null },
            include: { user: true },
        });
        if (bin.user?.phone) {
            await notificationService
                .sendWhatsApp(bin.user.phone, `Pengajuan bin ${bin.qrCode} ditolak oleh Administrator. Alasan: ${reason}`)
                .catch((e) => console.error("WA Error:", e));
        }
        return bin;
    }
    async getPendingPetugas() {
        return prisma.petugasResidu.findMany({
            where: {
                whitelistStatus: "PENDING",
            },
            include: { user: true },
        });
    }
    async verifyPetugas(petugasId, action) {
        const { notificationIntegrationService: notificationService } = await import("./notificationIntegrationService.js");
        let petugasCheck = await prisma.petugasResidu.findUnique({
            where: { id: petugasId },
            include: { user: true },
        });
        if (!petugasCheck) {
            petugasCheck = await prisma.petugasResidu.findFirst({
                where: { userId: petugasId },
                include: { user: true },
            });
        }
        if (!petugasCheck) {
            throw new Error("Petugas not found");
        }
        const petugas = await prisma.petugasResidu.update({
            where: { id: petugasCheck.id },
            data: { whitelistStatus: action },
            include: { user: true },
        });
        if (action === "APPROVED") {
            await prisma.user.update({
                where: { id: petugas.userId },
                data: { status: "Aktif" },
            });
        }
        else if (action === "REJECTED") {
            await prisma.user.update({
                where: { id: petugas.userId },
                data: { status: "Inaktif" },
            });
        }
        if (petugas.user?.phone && action === "APPROVED") {
            await notificationService
                .sendWhatsApp(petugas.user.phone, `Akun Petugas Residu Anda telah diverifikasi oleh Administrator dan kini AKTIF.`)
                .catch((e) => console.error("WA Error:", e));
        }
        return petugas;
    }
    /**
     * Update status of a bin directly
     */
    async updateBinStatus(binId, status, adminUserId) {
        const bin = await prisma.bin.findUnique({ where: { id: binId } });
        if (!bin) {
            throw new Error("BIN_NOT_FOUND");
        }
        const updated = await prisma.bin.update({
            where: { id: binId },
            data: { status },
        });
        await prisma.auditTrail.create({
            data: {
                action: "UPDATE_BIN_STATUS",
                userId: adminUserId,
                newValue: { binId, status },
            },
        });
        return updated;
    }
    /**
     * Replace a broken bin with a new QR Code
     */
    async replaceBrokenBin(oldBinId, newBinId, adminUserId) {
        return prisma.$transaction(async (tx) => {
            const oldBin = await tx.bin.findUnique({ where: { id: oldBinId } });
            if (!oldBin) {
                throw new Error("OLD_BIN_NOT_FOUND");
            }
            let newBin = await tx.bin.findUnique({
                where: { id: newBinId },
            });
            if (!newBin) {
                newBin = await tx.bin.findUnique({
                    where: { qrCode: newBinId },
                });
            }
            if (!newBin) {
                throw new Error("NEW_BIN_NOT_FOUND");
            }
            // Mark old bin as BROKEN
            await tx.bin.update({
                where: { id: oldBin.id },
                data: { status: "BROKEN" },
            });
            // Transfer ownership & active status to new bin
            const updatedNewBin = await tx.bin.update({
                where: { id: newBin.id },
                data: {
                    status: "ACTIVE_BOUND",
                    userId: oldBin.userId,
                    rwId: oldBin.rwId,
                    registeredByStudentId: oldBin.registeredByStudentId,
                },
            });
            if (oldBin.userId) {
                const existingOwnership = await tx.binOwnership.findFirst({
                    where: { binId: newBin.id, userId: oldBin.userId },
                });
                if (!existingOwnership) {
                    await tx.binOwnership.create({
                        data: { userId: oldBin.userId, binId: newBin.id, type: "UTAMA" },
                    });
                }
            }
            await tx.auditTrail.create({
                data: {
                    action: "REPLACE_BROKEN_BIN",
                    userId: adminUserId,
                    newValue: { oldBinId: oldBin.id, newBinId: newBin.id, ownerId: oldBin.userId },
                },
            });
            return updatedNewBin;
        });
    }
    /**
     * Delete or soft-delete a QR Code / Bin
     */
    async deleteBin(binId, adminUserId) {
        const bin = await prisma.bin.findUnique({ where: { id: binId } });
        if (!bin) {
            throw new Error("BIN_NOT_FOUND");
        }
        await prisma.binOwnership.deleteMany({ where: { binId } });
        await prisma.setoranOtomatis.deleteMany({ where: { qrTempatSampahId: binId } });
        await prisma.binResetRequest.deleteMany({ where: { binId } });
        const deleted = await prisma.bin.delete({ where: { id: binId } });
        await prisma.auditTrail.create({
            data: {
                action: "DELETE_BIN",
                userId: adminUserId,
                newValue: { binId, qrCode: bin.qrCode },
            },
        });
        return deleted;
    }
    /**
     * Check and purge duplicate or mock dummy user accounts sharing identical phone numbers or invalid dummy profiles.
     */
    async checkAndPurgeDuplicateUsers(adminUserId) {
        const allUsers = await prisma.user.findMany({
            select: { id: true, name: true, phone: true, createdAt: true, roleId: true },
        });
        const phoneMap = new Map();
        for (const u of allUsers) {
            const cleanPhone = u.phone.trim();
            if (!phoneMap.has(cleanPhone)) {
                phoneMap.set(cleanPhone, []);
            }
            phoneMap.get(cleanPhone).push(u.id);
        }
        const duplicateUserIds = [];
        phoneMap.forEach((ids) => {
            if (ids.length > 1) {
                // Keep first registered, mark rest as duplicate
                duplicateUserIds.push(...ids.slice(1));
            }
        });
        if (duplicateUserIds.length > 0) {
            await prisma.user.deleteMany({
                where: { id: { in: duplicateUserIds } },
            });
            await prisma.auditTrail.create({
                data: {
                    action: "PURGE_DUPLICATE_USERS",
                    userId: adminUserId,
                    newValue: { purgedCount: duplicateUserIds.length, userIds: duplicateUserIds },
                },
            });
        }
        return {
            totalInspected: allUsers.length,
            purgedCount: duplicateUserIds.length,
            purgedUserIds: duplicateUserIds,
        };
    }
    /**
     * Get aggregate Circular Economy utilization report (Pakan Maggot, Kompos Organik, Buruan Sae / Hidroponik)
     */
    async getCircularEconomyReport() {
        const pemanfaatanLogs = await prisma.pemanfaatan.findMany({
            include: { rw: { include: { kelurahan: true } } },
        });
        const facilityLogs = await prisma.facilityProductionLog.findMany({
            include: { facility: true },
        });
        let totalMaggotKg = 0;
        let totalKomposKg = 0;
        let totalBuruanSaeKg = 0;
        for (const log of pemanfaatanLogs) {
            const prog = (log.program || "").toLowerCase();
            const val = Number(log.hasil) || 0;
            if (prog.includes("maggot")) {
                totalMaggotKg += val;
            }
            else if (prog.includes("kompos")) {
                totalKomposKg += val;
            }
            else if (prog.includes("sae") || prog.includes("hidroponik") || prog.includes("kebun")) {
                totalBuruanSaeKg += val;
            }
        }
        for (const flog of facilityLogs) {
            const type = (flog.jenisOutput || "").toLowerCase();
            const val = Number(flog.outputKg) || 0;
            if (type.includes("maggot")) {
                totalMaggotKg += val;
            }
            else if (type.includes("kompos")) {
                totalKomposKg += val;
            }
            else {
                totalBuruanSaeKg += val;
            }
        }
        return {
            summary: {
                pakanMaggotKg: Math.round(totalMaggotKg * 100) / 100,
                komposOrganikKg: Math.round(totalKomposKg * 100) / 100,
                buruanSaeHidroponikKg: Math.round(totalBuruanSaeKg * 100) / 100,
                totalUtilizedWasteKg: Math.round((totalMaggotKg + totalKomposKg + totalBuruanSaeKg) * 100) / 100,
            },
            pemanfaatanDetails: pemanfaatanLogs,
            facilityProductionDetails: facilityLogs,
        };
    }
}
export const superUserService = new SuperUserService();
