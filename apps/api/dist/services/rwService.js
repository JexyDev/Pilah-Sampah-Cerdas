import { PrismaClient } from "@prisma/client";
import { notificationIntegrationService as notificationService } from "./notificationIntegrationService.js";
const prisma = new PrismaClient();
/**
 * Helper to retrieve all RtRwArea IDs under the same RW number and Kelurahan.
 */
async function getRwAreaIds(rwId, role) {
    if (role === "RT") {
        return [rwId];
    }
    const area = await prisma.rw.findUnique({ where: { id: rwId } });
    if (!area)
        return [rwId];
    const match = area.name.match(/RW\s*(\d+)/i);
    const rwNum = match ? match[1].padStart(2, "0") : null;
    const rawNum = match ? parseInt(match[1]).toString() : null;
    const matchingAreas = await prisma.rw.findMany({
        where: {
            kelurahanId: area.kelurahanId,
            OR: [
                { name: { contains: area.name, mode: "insensitive" } },
                ...(rwNum ? [{ name: { contains: `RW ${rwNum}`, mode: "insensitive" } }] : []),
                ...(rawNum ? [{ name: { contains: `RW ${rawNum}`, mode: "insensitive" } }] : []),
            ],
        },
        select: { id: true },
    });
    return matchingAreas.length > 0 ? matchingAreas.map((a) => a.id) : [rwId];
}
export const rwService = {
    getDashboard: async (rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        const bins = await prisma.bin.findMany({
            where: { rwId: { in: areaIds } },
            include: {
                category: true,
                user: { select: { name: true, address: true, phone: true } },
            },
        });
        const activeBins = bins.filter((b) => b.status === "ACTIVE_BOUND");
        const warningBins = activeBins.filter((b) => Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter) > 0.7);
        const fullBins = activeBins.filter((b) => Number(b.currentVolumeLiter) / Number(b.maxCapacityLiter) >= 0.9);
        const totalKapasitas = activeBins.reduce((sum, b) => sum + Number(b.maxCapacityLiter), 0);
        const totalVolume = activeBins.reduce((sum, b) => sum + Number(b.currentVolumeLiter), 0);
        return {
            totalBins: bins.length,
            activeBins: activeBins.length,
            warningBins: warningBins.length,
            fullBins: fullBins.length,
            totalCapacityLiter: totalKapasitas,
            currentVolumeLiter: totalVolume,
            binsMap: bins.map((b) => ({
                id: b.id,
                qrCode: b.qrCode,
                latitude: b.latitude,
                longitude: b.longitude,
                status: b.status,
                category: b.category,
                capacity: Number(b.maxCapacityLiter),
                volume: Number(b.currentVolumeLiter),
                user: b.user,
            })),
        };
    },
    getPendingBins: async (rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        return prisma.bin.findMany({
            where: {
                rwId: { in: areaIds },
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
    },
    approveBin: async (binId, rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        return prisma.$transaction(async (tx) => {
            const bin = await tx.bin.findUnique({
                where: { id: binId },
                include: { user: true, qrBatch: { include: { assignedPic: true } } },
            });
            if (!bin || bin.status !== "PENDING_APPROVAL") {
                throw new Error("Bin tidak ditemukan atau status bukan PENDING_APPROVAL");
            }
            if (!bin.rwId || !areaIds.includes(bin.rwId)) {
                throw new Error("Bin ini tidak berada di wilayah RW Anda");
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
                        description: "Aktivasi Bin disetujui RW",
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
                await notificationService.sendWhatsApp(bin.user.phone, `Pengajuan bin ${bin.qrCode} Anda telah disetujui oleh RW.`);
            }
            if (bin.qrBatch?.assignedPicUserId && bin.user) {
                const pic = await tx.user.findUnique({
                    where: { id: bin.qrBatch.assignedPicUserId },
                    select: { fcmToken: true },
                });
                if (pic?.fcmToken) {
                    const { notificationIntegrationService } = await import("./notificationIntegrationService.js");
                    await notificationIntegrationService
                        .sendPushNotification(pic.fcmToken, "Poin Bertambah!", `Registrasi ${bin.user.name} berhasil diaktivasi, kamu dapat +10 poin`)
                        .catch((e) => console.error("FCM Error in approveBin:", e));
                }
            }
            return updatedBin;
        });
    },
    rejectBin: async (binId, reason, rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        const binCheck = await prisma.bin.findUnique({ where: { id: binId } });
        if (!binCheck || !binCheck.rwId || !areaIds.includes(binCheck.rwId)) {
            throw new Error("Bin tidak ditemukan atau tidak berada di wilayah RW Anda");
        }
        const bin = await prisma.bin.update({
            where: { id: binId },
            data: { status: "PRINTED", userId: null }, // Reset to PRINTED
            include: { user: true },
        });
        if (bin.user?.phone) {
            await notificationService.sendWhatsApp(bin.user.phone, `Pengajuan bin ${bin.qrCode} ditolak oleh RW. Alasan: ${reason}`);
        }
        return bin;
    },
    getPendingPetugas: async (rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        return prisma.petugasResidu.findMany({
            where: {
                OR: [{ whitelistStatus: "PENDING" }, { user: { status: "Pending" } }],
                user: { rwId: { in: areaIds } },
            },
            include: { user: true },
        });
    },
    verifyPetugas: async (petugasId, action, rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
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
            throw new Error("Petugas tidak ditemukan");
        }
        if (!petugasCheck.user?.rwId || !areaIds.includes(petugasCheck.user.rwId)) {
            throw new Error("Petugas tidak terdaftar di wilayah RW Anda");
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
                .sendWhatsApp(petugas.user.phone, `Akun Petugas Residu Anda telah diverifikasi oleh RW dan kini AKTIF.`)
                .catch((e) => console.error("WhatsApp notification error:", e));
        }
        return petugas;
    },
    getInactiveBins: async (rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        return prisma.bin.findMany({
            where: { rwId: { in: areaIds }, status: "INACTIVE" },
            include: { user: true, category: true },
        });
    },
    markBinBroken: async (binId, userId, rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        const binCheck = await prisma.bin.findUnique({ where: { id: binId } });
        if (!binCheck || !binCheck.rwId || !areaIds.includes(binCheck.rwId)) {
            throw new Error("Bin tidak ditemukan atau tidak berada di wilayah RW Anda");
        }
        const bin = await prisma.bin.update({
            where: { id: binId },
            data: { status: "BROKEN" },
        });
        await prisma.auditTrail.create({
            data: {
                action: "MARK_BIN_BROKEN",
                userId,
                newValue: { binId, status: "BROKEN" },
            },
        });
        return bin;
    },
    getPendingIde: async (rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        return prisma.ideDaurUlang.findMany({
            where: {
                statusApproval: "PENDING",
                user: { rwId: { in: areaIds } },
            },
            include: { user: true },
        });
    },
    verifyIde: async (ideId, action, rwUserId, rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        return prisma.$transaction(async (tx) => {
            const ideCheck = await tx.ideDaurUlang.findUnique({
                where: { id: ideId },
                include: { user: true },
            });
            if (!ideCheck || !ideCheck.user.rwId || !areaIds.includes(ideCheck.user.rwId)) {
                throw new Error("Ide tidak ditemukan atau milik warga di luar wilayah RW Anda");
            }
            const ide = await tx.ideDaurUlang.update({
                where: { id: ideId },
                data: { statusApproval: action, approvedBy: rwUserId },
                include: { user: true },
            });
            if (action === "APPROVED") {
                await tx.pointHistory.create({
                    data: {
                        userId: ide.userId,
                        points: 50,
                        description: `Ide Daur Ulang '${ide.judul}' disetujui`,
                        kategori: "IDE_DAUR_ULANG",
                    },
                });
                await tx.socialFeed.create({
                    data: {
                        tipe: "RECYCLE_IDEA",
                        deskripsi: `${ide.user.name} mengajukan ide daur ulang cemerlang: ${ide.judul}`,
                        userId: ide.userId,
                        entityId: ide.id,
                    },
                });
            }
            return ide;
        });
    },
    getPendingFacilities: async (rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        return prisma.facility.findMany({
            where: { rwId: { in: areaIds }, statusApproval: "PENDING" },
        });
    },
    verifyFacility: async (facilityId, action, rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        const facilityCheck = await prisma.facility.findUnique({ where: { id: facilityId } });
        if (!facilityCheck || !facilityCheck.rwId || !areaIds.includes(facilityCheck.rwId)) {
            throw new Error("Fasilitas tidak ditemukan atau tidak berada di wilayah RW Anda");
        }
        return prisma.facility.update({
            where: { id: facilityId },
            data: { statusApproval: action },
        });
    },
    getFacilities: async (rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        return prisma.facility.findMany({
            where: { rwId: { in: areaIds }, statusApproval: "APPROVED" },
            include: { productionLogs: true },
        });
    },
    inputFacilityProduction: async (facilityId, materialMasukKg, outputKg, jenisOutput, periode, rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        const facilityCheck = await prisma.facility.findUnique({ where: { id: facilityId } });
        if (!facilityCheck || !facilityCheck.rwId || !areaIds.includes(facilityCheck.rwId)) {
            throw new Error("Fasilitas tidak ditemukan atau tidak berada di wilayah RW Anda");
        }
        return prisma.facilityProductionLog.create({
            data: {
                facilityId,
                materialMasukKg,
                outputKg,
                jenisOutput,
                periode,
            },
        });
    },
    getResiduMonitoring: async (rwId, userRole) => {
        const areaIds = await getRwAreaIds(rwId, userRole);
        // 1. Cari petugas residu yang ditugaskan / terdaftar di RW ini
        const petugasUser = await prisma.user.findFirst({
            where: {
                role: { name: "PETUGAS_RESIDU" },
                rwId: { in: areaIds },
            },
            include: { petugasProfile: true },
        });
        // 2. Ambil riwayat setoran manual residu hilir khusus wilayah RW ini
        const logs = await prisma.setoranManual.findMany({
            where: {
                OR: [
                    { rwId: { in: areaIds } },
                    { petugas: { rwId: { in: areaIds } } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                petugas: { select: { name: true, phone: true } },
            },
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const totalResiduKg = logs.reduce((sum, item) => sum + Number(item.berat), 0);
        const todayResiduKg = logs
            .filter((item) => new Date(item.createdAt) >= today)
            .reduce((sum, item) => sum + Number(item.berat), 0);
        return {
            petugas: petugasUser
                ? {
                    id: petugasUser.id,
                    nama: petugasUser.name,
                    phone: petugasUser.phone,
                    status: petugasUser.status,
                    whitelistStatus: petugasUser.petugasProfile?.whitelistStatus || "APPROVED",
                    kpiScore: Number(petugasUser.petugasProfile?.kpiScore || 100),
                }
                : null,
            stats: {
                totalResiduKg: Number(totalResiduKg.toFixed(1)),
                todayResiduKg: Number(todayResiduKg.toFixed(1)),
                totalPengangkutan: logs.length,
            },
            logs: logs.map((l) => ({
                id: l.id,
                diinputOleh: l.diinputOleh,
                petugasNama: l.petugas?.name || l.diinputOleh,
                petugasPhone: l.petugas?.phone || "-",
                beratKg: Number(l.berat),
                unit: l.unit,
                kategori: l.kategori,
                fotoResiduUrl: l.fotoResiduUrl,
                createdAt: l.createdAt.toISOString(),
            })),
        };
    },
};
