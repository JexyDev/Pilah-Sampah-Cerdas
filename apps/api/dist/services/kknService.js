/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
const prisma = new PrismaClient();
export class KknService {
    async getDashboardStats(userId) {
        let student = await prisma.studentKkn.findUnique({
            where: { userId },
            include: { assignedPolygon: true },
        });
        if (!student) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                student = await prisma.studentKkn.create({
                    data: {
                        userId,
                        nim: "10123000",
                        jurusan: "Teknik Lingkungan",
                        fakultas: "FTSL",
                        noWa: user.phone || "-",
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        whitelistStatus: "APPROVED",
                    },
                    include: { assignedPolygon: true },
                });
            }
            else {
                throw new Error("STUDENT_NOT_FOUND");
            }
        }
        // Total registered bins from batches assigned to this KKN PIC
        const totalRegistered = await prisma.bin.count({
            where: {
                status: "ACTIVE_BOUND",
                qrBatch: {
                    assignedPicUserId: userId,
                },
            },
        });
        const maxLimitStr = await configService.getConfig("kkn_max_assignment_per_student");
        const maxLimit = maxLimitStr ? parseInt(maxLimitStr, 10) : 100;
        const remainingQuota = Math.max(0, maxLimit - totalRegistered);
        const progressPct = maxLimit > 0 ? parseFloat(((totalRegistered / maxLimit) * 100).toFixed(1)) : 0;
        // KKN Points Contribution
        const pointsSum = await prisma.pointHistory.aggregate({
            where: { userId },
            _sum: { points: true },
        });
        const contributionPoints = pointsSum._sum.points || 0;
        return {
            studentKkn: {
                nim: student.nim,
                jurusan: student.jurusan,
                fakultas: student.fakultas,
                whitelistStatus: student.whitelistStatus,
                endDate: student.endDate,
                assignedArea: student.assignedPolygon?.name || "Area KKN Dago",
            },
            stats: {
                totalRegistered: totalRegistered,
                remainingQuota,
                progressPct,
                contributionPoints,
                maxLimit,
            },
            // Backward compatibility aliases
            nim: student.nim,
            jurusan: student.jurusan,
            totalRegisteredBins: totalRegistered,
            remainingQuota,
            progressPct,
            contributionPoints,
            assignmentLimit: maxLimit,
        };
    }
    async getRegisteredWarga(kknUserId, filters) {
        // We get warga whose bins belong to batches assigned to this KKN PIC
        const bins = await prisma.bin.findMany({
            where: {
                status: {
                    in: ["ACTIVE_BOUND", "PENDING_APPROVAL"],
                },
                qrBatch: {
                    assignedPicUserId: kknUserId,
                },
            },
            include: {
                user: {
                    include: {
                        rtRw: true,
                        pointHistory: true,
                        wargaViolations: true,
                        setoranOtomatis: { take: 5, orderBy: { createdAt: "desc" } },
                    },
                },
            },
        });
        let list = bins.map((b) => {
            const u = b.user;
            if (!u)
                return null;
            const recentLogs = u.setoranOtomatis.map((log) => ({
                weightKg: Number(log.berat),
                category: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
                isCorrect: true, // Assuming AI overrides correctly for MVP or check logic if needed
            }));
            return {
                binId: b.qrCode,
                wargaName: u.name,
                address: u.address,
                isActivated: true,
                recentLogs,
                // for filters
                rtRwId: u.rtRwId,
                binCode: b.qrCode,
            };
        });
        // filter nulls
        let result = list.filter((item) => item !== null);
        // apply filters
        if (filters.rtRwId) {
            result = result.filter((item) => item.rtRwId === filters.rtRwId);
        }
        if (filters.search) {
            const s = filters.search.toLowerCase();
            result = result.filter((item) => item.wargaName.toLowerCase().includes(s) || item.binCode.toLowerCase().includes(s));
        }
        return result;
    }
    async getWargaDetail(kknUserId, wargaId) {
        const warga = (await prisma.user.findUnique({
            where: { id: wargaId },
            include: {
                rtRw: true,
                setoranOtomatis: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    include: { bin: true },
                },
                binOwnerships: {
                    include: {
                        bin: {
                            include: { category: true },
                        },
                    },
                },
            },
        }));
        if (!warga) {
            throw new Error("WARGA_NOT_FOUND");
        }
        // Verify data scoping (must belong to batches assigned to this KKN PIC)
        const binsRegisteredByPic = await prisma.bin.count({
            where: {
                userId: wargaId,
                qrBatch: {
                    assignedPicUserId: kknUserId,
                },
            },
        });
        if (binsRegisteredByPic === 0) {
            throw new Error("UNAUTHORIZED_ACCESS_SCOPE");
        }
        const defaultBin = warga.binOwnerships[0]?.bin;
        const recentLogs = warga.setoranOtomatis.map((log) => ({
            id: log.id,
            weightKg: Number(log.berat),
            volumeLiter: 0,
            category: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
            createdAt: log.createdAt,
        })) || [];
        return {
            wargaId: warga.id,
            name: warga.name,
            email: warga.email,
            phone: warga.phone,
            address: warga.address,
            rtRw: warga.rtRw?.name || "Belum diset",
            bin: defaultBin
                ? {
                    qrCode: defaultBin.qrCode,
                    category: defaultBin.category?.name || "UMUM",
                    capacity: `${defaultBin.currentVolumeLiter}L / ${defaultBin.maxCapacityLiter}L`,
                }
                : null,
            recentLogs,
        };
    }
    async getWargaList(kknUserId, filters) {
        const where = { role: { name: "WARGA" } };
        if (filters.status === "UNACTIVATED") {
            where.binOwnerships = { none: {} };
        }
        else if (filters.status === "ACTIVATED") {
            where.binOwnerships = { some: { bin: { status: "ACTIVE_BOUND" } } };
        }
        if (filters.kelurahan || filters.rtRwId) {
            where.households = { some: {} };
            if (filters.rtRwId)
                where.households.some.rtRwId = filters.rtRwId;
            if (filters.kelurahan)
                where.households.some.rtRw = { kelurahan: { name: filters.kelurahan } };
        }
        if (filters.search) {
            where.name = { contains: filters.search, mode: "insensitive" };
        }
        const warga = await prisma.user.findMany({
            where,
            include: {
                households: { include: { rtRw: { include: { kelurahan: true } } } },
                binOwnerships: { include: { bin: true } },
                setoranOtomatis: { take: 5, orderBy: { createdAt: "desc" } },
            },
        });
        return warga.map((w) => {
            const household = w.households?.[0];
            const primaryOwnership = w.binOwnerships?.[0];
            const recentLogs = w.setoranOtomatis.map((log) => ({
                weightKg: Number(log.berat),
                category: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
                isCorrect: true,
            }));
            return {
                binId: primaryOwnership?.bin?.qrCode || null,
                wargaId: w.id,
                id: w.id,
                wargaName: w.name,
                name: w.name,
                phone: w.phone,
                address: household?.address || w.address || "-",
                kelurahan: household?.rtRw?.kelurahan?.name || null,
                rtRw: household?.rtRw?.name || null,
                isActivated: w.binOwnerships?.some((bo) => bo.bin?.status === "ACTIVE_BOUND") || false,
                recentLogs,
            };
        });
    }
    async activateByScan(wargaId, qrCode, latitude, longitude, kknUserId) {
        return prisma.$transaction(async (tx) => {
            let bin = await tx.bin.findUnique({ where: { qrCode } });
            if (!bin) {
                let category = await tx.wasteCategory.findFirst({ where: { name: "ORGANIC" } });
                if (!category)
                    category = await tx.wasteCategory.findFirst();
                bin = await tx.bin.create({
                    data: {
                        qrCode,
                        status: "ACTIVE_BOUND",
                        categoryId: category?.id,
                        userId: wargaId,
                        registeredByStudentId: kknUserId,
                    },
                });
            }
            else {
                await tx.bin.update({
                    where: { id: bin.id },
                    data: {
                        userId: wargaId,
                        status: "ACTIVE_BOUND",
                        registeredByStudentId: kknUserId,
                    },
                });
            }
            const existingOwnership = await tx.binOwnership.findFirst({
                where: { binId: bin.id, userId: wargaId },
            });
            if (!existingOwnership) {
                await tx.binOwnership.create({
                    data: { userId: wargaId, binId: bin.id, type: "UTAMA" },
                });
            }
            if (latitude != null && longitude != null) {
                await tx.household.updateMany({
                    where: { userId: wargaId },
                    data: { latitude, longitude },
                });
            }
            if (kknUserId) {
                await tx.pointHistory.create({
                    data: {
                        userId: kknUserId,
                        points: 10,
                        description: `Aktivasi QR ${qrCode} Warga via Scan`,
                    },
                });
            }
            return bin;
        });
    }
    async activateWargaBin(wargaId, binOrganikId, binAnorganikId, latitude, longitude, kknUserId) {
        return prisma.$transaction(async (tx) => {
            const bins = await tx.bin.findMany({
                where: {
                    OR: [
                        { qrCode: { in: [binOrganikId, binAnorganikId] } },
                        { id: { in: [binOrganikId, binAnorganikId] } },
                    ],
                },
            });
            if (bins.length < 2) {
                const found = bins.map((b) => b.qrCode).concat(bins.map((b) => b.id));
                const missing = [binOrganikId, binAnorganikId].filter((x) => !found.includes(x));
                for (const mCode of missing) {
                    const lower = mCode.toLowerCase();
                    const isAnorg = lower.includes("anorganik") || lower.includes("anorg");
                    const isOrg = !isAnorg && (lower.includes("organik") || lower.includes("org"));
                    let category = await tx.wasteCategory.findFirst({
                        where: { name: isOrg ? "ORGANIC" : "NON_ORGANIC" },
                    });
                    if (!category)
                        category = await tx.wasteCategory.findFirst();
                    const newBin = await tx.bin.create({
                        data: {
                            qrCode: mCode.startsWith("TS-") ? mCode : `TS-${mCode}`,
                            status: "ACTIVE_BOUND",
                            categoryId: category?.id,
                            userId: wargaId,
                            registeredByStudentId: kknUserId,
                        },
                    });
                    bins.push(newBin);
                }
            }
            for (const bin of bins) {
                await tx.bin.update({
                    where: { id: bin.id },
                    data: { userId: wargaId, status: "ACTIVE_BOUND", registeredByStudentId: kknUserId },
                });
                const existingOwnership = await tx.binOwnership.findFirst({
                    where: { binId: bin.id, userId: wargaId },
                });
                if (!existingOwnership) {
                    await tx.binOwnership.create({
                        data: { userId: wargaId, binId: bin.id, type: "UTAMA" },
                    });
                }
            }
            if (latitude != null && longitude != null) {
                await tx.household.updateMany({
                    where: { userId: wargaId },
                    data: { latitude, longitude },
                });
            }
            if (kknUserId) {
                await tx.pointHistory.create({
                    data: {
                        userId: kknUserId,
                        points: 10,
                        description: "Aktivasi Bin Warga (Organik & Anorganik)",
                    },
                });
            }
            await tx.pointHistory.create({
                data: { userId: wargaId, points: 10, description: "Mendapatkan 2 Tong Sampah" },
            });
        });
    }
    async getActivityLog(kknUserId) {
        return prisma.auditTrail.findMany({
            where: {
                userId: kknUserId,
                action: "REQUEST_ACTIVATE_BIN",
            },
            orderBy: { timestamp: "desc" },
            take: 10,
        });
    }
    async handover(fromKknUserId, toKknUserId, rtRwId, notes) {
        return prisma.$transaction(async (tx) => {
            const batches = await tx.qrBatch.findMany({
                where: { assignedPicUserId: fromKknUserId },
            });
            for (const batch of batches) {
                await tx.qrBatch.update({
                    where: { id: batch.id },
                    data: { assignedPicUserId: toKknUserId },
                });
            }
            const handover = await tx.kknHandoverHistory.create({
                data: {
                    fromUserId: fromKknUserId,
                    toUserId: toKknUserId,
                    rtRwId,
                    notes,
                },
            });
            return handover;
        });
    }
    async bantuInputFasilitas(kknUserId, data) {
        const facility = await prisma.facility.create({
            data: {
                nama: data.nama,
                jenis: data.jenis,
                pic: data.userId, // Warga's name or ID
                latitude: data.latitude,
                longitude: data.longitude,
                rtRwId: data.rtRwId,
                foto: data.foto,
                statusApproval: "PENDING",
            },
        });
        await prisma.pointHistory.create({
            data: {
                userId: kknUserId,
                points: 5,
                description: `Bantu warga input fasilitas GIS: ${data.nama}`,
                kategori: "PARTISIPASI_STREAK",
            },
        });
        return facility;
    }
    async claimQr(kknUserId, qrCode, latitude, longitude) {
        let bin = await prisma.bin.findUnique({ where: { qrCode } });
        if (!bin) {
            let category = await prisma.wasteCategory.findFirst({ where: { name: "ORGANIC" } });
            if (!category)
                category = await prisma.wasteCategory.findFirst();
            bin = await prisma.bin.create({
                data: {
                    qrCode,
                    status: "ASSIGNED_TO_PIC",
                    categoryId: category?.id,
                    registeredByStudentId: kknUserId,
                },
            });
        }
        else {
            bin = await prisma.bin.update({
                where: { id: bin.id },
                data: {
                    status: "ASSIGNED_TO_PIC",
                    registeredByStudentId: kknUserId,
                },
            });
        }
        await prisma.auditTrail.create({
            data: {
                userId: kknUserId,
                action: "CLAIM_QR_BIN",
                details: `Scan & Klaim QR ${qrCode} at lat:${latitude}, lon:${longitude}`,
            },
        });
        return bin;
    }
    async registerWarga(kknUserId, data) {
        return prisma.$transaction(async (tx) => {
            let role = await tx.role.findFirst({ where: { name: "WARGA" } });
            let warga = await tx.user.findFirst({
                where: {
                    OR: [
                        { phone: data.phone || "non-existent-phone" },
                        { email: data.email || "non-existent-email" },
                    ],
                },
            });
            if (!warga) {
                warga = await tx.user.create({
                    data: {
                        name: data.name || data.wargaName || "Warga Binaan KKN",
                        phone: data.phone || `08${Math.floor(100000000 + Math.random() * 900000000)}`,
                        email: data.email || `warga_${Date.now()}@trashcare.id`,
                        address: data.address || "-",
                        rtRwId: data.rtRwId ? Number(data.rtRwId) : undefined,
                        roleId: role?.id,
                        status: "Aktif",
                    },
                });
            }
            const qrCodes = [data.binQrCode, data.binQrCodeOrganic, data.binQrCodeInorganic].filter(Boolean);
            for (const qr of qrCodes) {
                let bin = await tx.bin.findUnique({ where: { qrCode: qr } });
                const maxCapacityLiter = data.maxCapacityLiter ? Number(data.maxCapacityLiter) : 50;
                if (!bin) {
                    let category = await tx.wasteCategory.findFirst({ where: { name: "ORGANIC" } });
                    if (!category)
                        category = await tx.wasteCategory.findFirst();
                    bin = await tx.bin.create({
                        data: {
                            qrCode: qr,
                            status: "PENDING_APPROVAL",
                            categoryId: category?.id,
                            userId: warga.id,
                            maxCapacityLiter,
                            registeredByStudentId: kknUserId,
                        },
                    });
                }
                else {
                    bin = await tx.bin.update({
                        where: { id: bin.id },
                        data: {
                            userId: warga.id,
                            status: "PENDING_APPROVAL",
                            maxCapacityLiter,
                            registeredByStudentId: kknUserId,
                        },
                    });
                }
                const existingOwnership = await tx.binOwnership.findFirst({
                    where: { binId: bin.id, userId: warga.id },
                });
                if (!existingOwnership) {
                    await tx.binOwnership.create({
                        data: { userId: warga.id, binId: bin.id, type: "UTAMA" },
                    });
                }
            }
            await tx.pointHistory.create({
                data: {
                    userId: kknUserId,
                    points: 10,
                    description: `Pendampingan Registrasi Warga (${warga.name})`,
                },
            });
            return { warga, qrCodes };
        });
    }
}
export const kknService = new KknService();
