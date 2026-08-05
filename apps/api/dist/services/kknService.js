/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
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
        const poskoLat = student.assignedPolygon?.latitude
            ? Number(student.assignedPolygon.latitude)
            : -6.975412;
        const poskoLng = student.assignedPolygon?.longitude
            ? Number(student.assignedPolygon.longitude)
            : 107.632145;
        return {
            studentKkn: {
                nim: student.nim,
                jurusan: student.jurusan,
                fakultas: student.fakultas,
                whitelistStatus: student.whitelistStatus,
                endDate: student.endDate,
                assignedArea: student.assignedPolygon?.name || "Area KKN Bojongsoang",
                latitude: poskoLat,
                longitude: poskoLng,
                radiusMeter: 5000,
            },
            poskoLocation: {
                name: student.assignedPolygon?.name || "Kel. Bojongsoang RT 03 / RW 08",
                latitude: poskoLat,
                longitude: poskoLng,
                radiusMeter: 5000,
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
            latitude: poskoLat,
            longitude: poskoLng,
            radiusMeter: 5000,
        };
    }
    async getRegisteredWarga(kknUserId, filters) {
        // We get warga whose bins belong to batches assigned to this KKN PIC
        const bins = await prisma.bin.findMany({
            where: {
                status: "ACTIVE_BOUND",
                qrBatch: {
                    assignedPicUserId: kknUserId,
                },
            },
            include: {
                user: {
                    include: {
                        rtRw: true,
                        households: true,
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
            const household = u.households?.[0];
            const lat = b.latitude
                ? Number(b.latitude)
                : household?.latitude
                    ? Number(household.latitude)
                    : u.rtRw?.latitude
                        ? Number(u.rtRw.latitude)
                        : -6.891234;
            const lng = b.longitude
                ? Number(b.longitude)
                : household?.longitude
                    ? Number(household.longitude)
                    : u.rtRw?.longitude
                        ? Number(u.rtRw.longitude)
                        : 107.610123;
            const recentLogs = u.setoranOtomatis.map((log) => ({
                weightKg: Number(log.berat),
                category: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
                isCorrect: true, // Assuming AI overrides correctly for MVP or check logic if needed
            }));
            return {
                id: u.id,
                wargaId: u.id,
                binId: b.qrCode,
                binCode: b.qrCode,
                wargaName: u.name,
                name: u.name,
                phone: u.phone,
                address: u.address || (u.rtRw?.name ? `RT ${u.rtRw.name}` : "Alamat belum diisi"),
                latitude: lat,
                longitude: lng,
                lat: lat,
                lng: lng,
                isActivated: true,
                recentLogs,
                // for filters
                rtRwId: u.rtRwId,
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
        const household = warga.households?.[0];
        const defaultBin = warga.binOwnerships[0]?.bin;
        const lat = household?.latitude
            ? Number(household.latitude)
            : defaultBin?.latitude
                ? Number(defaultBin.latitude)
                : warga.rtRw?.latitude
                    ? Number(warga.rtRw.latitude)
                    : -6.891234;
        const lng = household?.longitude
            ? Number(household.longitude)
            : defaultBin?.longitude
                ? Number(defaultBin.longitude)
                : warga.rtRw?.longitude
                    ? Number(warga.rtRw.longitude)
                    : 107.610123;
        const recentLogs = warga.setoranOtomatis.map((log) => ({
            id: log.id,
            weightKg: Number(log.berat),
            volumeLiter: 0,
            category: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
            createdAt: log.createdAt,
        })) || [];
        return {
            wargaId: warga.id,
            id: warga.id,
            name: warga.name,
            wargaName: warga.name,
            email: warga.email,
            phone: warga.phone,
            address: household?.address || warga.address || "Alamat belum diisi",
            rtRw: warga.rtRw?.name || "Belum diset",
            latitude: lat,
            longitude: lng,
            lat: lat,
            lng: lng,
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
        let studentRtRwId = filters.rtRwId;
        let studentKelurahanName = filters.kelurahan;
        if (!studentRtRwId && !studentKelurahanName) {
            const student = await prisma.studentKkn.findUnique({
                where: { userId: kknUserId },
                include: {
                    assignedPolygon: {
                        include: { kelurahan: true },
                    },
                    user: true,
                },
            });
            if (student?.assignedPolygon) {
                studentRtRwId = student.assignedPolygon.id;
                studentKelurahanName = student.assignedPolygon.kelurahan?.name;
            }
            else if (student?.user?.rtRwId) {
                studentRtRwId = student.user.rtRwId;
            }
        }
        const where = { role: { name: "WARGA" } };
        if (studentRtRwId || studentKelurahanName) {
            const orConditions = [];
            if (studentRtRwId) {
                orConditions.push({ rtRwId: studentRtRwId });
                orConditions.push({ households: { some: { rtRwId: studentRtRwId } } });
            }
            if (studentKelurahanName) {
                orConditions.push({
                    households: { some: { rtRw: { kelurahan: { name: studentKelurahanName } } } },
                });
                orConditions.push({
                    rtRw: { kelurahan: { name: studentKelurahanName } },
                });
            }
            orConditions.push({ registeredBins: { some: { registeredByStudentId: kknUserId } } });
            where.OR = orConditions;
        }
        if (filters.status === "UNACTIVATED") {
            where.binOwnerships = { none: {} };
        }
        else if (filters.status === "ACTIVATED") {
            where.binOwnerships = { some: { bin: { status: "ACTIVE_BOUND" } } };
        }
        if (filters.search) {
            where.name = { contains: filters.search, mode: "insensitive" };
        }
        const warga = await prisma.user.findMany({
            where,
            include: {
                rtRw: { include: { kelurahan: true } },
                households: { include: { rtRw: { include: { kelurahan: true } } } },
                binOwnerships: { include: { bin: { include: { category: true, qrBatch: true } } } },
                setoranOtomatis: { take: 5, orderBy: { createdAt: "desc" } },
            },
        });
        return warga.map((w) => {
            const household = w.households?.[0];
            const kelName = w.rtRw?.kelurahan?.name || household?.rtRw?.kelurahan?.name || filters.kelurahan || "";
            const rtRwName = w.rtRw?.name || household?.rtRw?.name || filters.rtRw || "";
            const binOrganik = w.binOwnerships?.find((bo) => bo.bin?.category?.name === "ORGANIC" ||
                bo.bin?.qrCode?.toLowerCase().includes("org") ||
                bo.bin?.qrCode?.toLowerCase().includes("1"))?.bin;
            const binAnorganik = w.binOwnerships?.find((bo) => bo.bin?.category?.name === "NON_ORGANIC" ||
                bo.bin?.qrCode?.toLowerCase().includes("anorg") ||
                bo.bin?.qrCode?.toLowerCase().includes("2"))?.bin;
            const primaryBin = w.binOwnerships?.[0]?.bin;
            const isActivated = w.binOwnerships?.some((bo) => bo.bin?.status === "ACTIVE_BOUND" || bo.bin?.status === "PENDING_APPROVAL") || false;
            const registeredStudentId = primaryBin?.registeredByStudentId ||
                primaryBin?.qrBatch?.assignedPicUserId ||
                binOrganik?.registeredByStudentId ||
                binAnorganik?.registeredByStudentId ||
                null;
            const recentLogs = w.setoranOtomatis.map((log) => ({
                date: new Date(log.createdAt).toISOString().split("T")[0],
                wasteType: log.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
                weightKg: Number(log.berat),
            }));
            const lat = household?.latitude
                ? Number(household.latitude)
                : primaryBin?.latitude
                    ? Number(primaryBin.latitude)
                    : w.rtRw?.latitude
                        ? Number(w.rtRw.latitude)
                        : -6.891234;
            const lng = household?.longitude
                ? Number(household.longitude)
                : primaryBin?.longitude
                    ? Number(primaryBin.longitude)
                    : w.rtRw?.longitude
                        ? Number(w.rtRw.longitude)
                        : 107.610123;
            return {
                id: w.id,
                wargaId: w.id,
                name: w.name,
                wargaName: w.name,
                phone: w.phone,
                address: household?.address ||
                    w.address ||
                    (rtRwName ? `RT ${rtRwName}, Kel. ${kelName}` : "Alamat belum diisi"),
                kelurahan: kelName,
                rtRw: rtRwName,
                role: "WARGA",
                latitude: lat,
                longitude: lng,
                lat: lat,
                lng: lng,
                isActivated,
                mahasiswaId: registeredStudentId,
                binOrganikId: binOrganik?.qrCode ||
                    (primaryBin?.category?.name === "ORGANIC" ? primaryBin.qrCode : null),
                binAnorganikId: binAnorganik?.qrCode ||
                    (primaryBin?.category?.name === "NON_ORGANIC" ? primaryBin.qrCode : null),
                needsReeducation: false,
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
                newValue: { details: `Scan & Klaim QR ${qrCode} at lat:${latitude}, lon:${longitude}` },
            },
        });
        return bin;
    }
    async registerWarga(kknUserId, data) {
        return prisma.$transaction(async (tx) => {
            let role = await tx.role.findFirst({ where: { name: "WARGA" } });
            let warga = await tx.user.findFirst({
                where: {
                    phone: data.phone || "non-existent-phone",
                },
            });
            // Auto-resolve rtRwId from input RW string or KKN student's assigned area
            let resolvedRtRwId = data.rtRwId ? Number(data.rtRwId) : undefined;
            if (!resolvedRtRwId && (data.rw || data.rwNumber || data.lokasiRw)) {
                const rawRwStr = String(data.rw || data.rwNumber || data.lokasiRw);
                const rwDigits = rawRwStr.match(/\d+/);
                if (rwDigits) {
                    const rwPadded = rwDigits[0].padStart(2, "0");
                    const matchedArea = await tx.rtRwArea.findFirst({
                        where: {
                            name: { contains: rwPadded },
                        },
                    });
                    if (matchedArea) {
                        resolvedRtRwId = matchedArea.id;
                    }
                }
            }
            if (!resolvedRtRwId && kknUserId) {
                const student = await tx.studentKkn.findUnique({
                    where: { userId: kknUserId },
                    include: { user: true },
                });
                resolvedRtRwId = student?.assignedPolygonId || student?.user?.rtRwId || undefined;
            }
            if (!warga) {
                warga = await tx.user.create({
                    data: {
                        name: data.name || data.wargaName || "Warga Binaan KKN",
                        phone: data.phone || `08${Math.floor(100000000 + Math.random() * 900000000)}`,
                        password: data.password || "password123",
                        address: data.address || "-",
                        rtRwId: resolvedRtRwId,
                        roleId: role ? role.id : 1,
                        status: "Aktif",
                    },
                });
            }
            else if (resolvedRtRwId && !warga.rtRwId) {
                warga = await tx.user.update({
                    where: { id: warga.id },
                    data: { rtRwId: resolvedRtRwId },
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
                            rtRwId: resolvedRtRwId,
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
                            rtRwId: resolvedRtRwId,
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
    async getMyGroup(userId) {
        const student = await prisma.studentKkn.findUnique({
            where: { userId },
            include: {
                assignedPolygon: true,
                kelompok: {
                    include: {
                        dpl: true,
                        students: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
        if (!student || !student.kelompok) {
            return null;
        }
        const group = student.kelompok;
        const memberUserIds = group.students.map((s) => s.userId);
        const pointsAgg = await prisma.pointHistory.groupBy({
            by: ["userId"],
            where: { userId: { in: memberUserIds } },
            _sum: { points: true },
        });
        const pointsMap = new Map();
        pointsAgg.forEach((item) => {
            pointsMap.set(item.userId, item._sum.points || 0);
        });
        const members = group.students.map((s) => {
            const p = pointsMap.get(s.userId) || 0;
            return {
                userId: s.userId,
                nim: s.nim || "1301210000",
                name: s.user?.name || "Mahasiswa KKN",
                jurusan: s.jurusan || "Teknik Informatika",
                fakultas: s.fakultas || "Informatika",
                individualPoints: p,
                isLeader: Boolean(s.isKetua || s.userId === userId),
            };
        });
        const totalGroupPoints = members.reduce((sum, m) => sum + m.individualPoints, 0);
        const poskoLat = student.assignedPolygon?.latitude
            ? Number(student.assignedPolygon.latitude)
            : -6.975412;
        const poskoLng = student.assignedPolygon?.longitude
            ? Number(student.assignedPolygon.longitude)
            : 107.632145;
        return {
            groupId: group.id,
            groupName: group.name,
            dosenPembimbing: group.dpl?.name || "Dr. Ir. Ahmad Sudrajat, M.T.",
            poskoLocation: student.assignedPolygon?.name || "Kel. Bojongsoang RT 03 / RW 08",
            latitude: poskoLat,
            longitude: poskoLng,
            poskoLatitude: poskoLat,
            poskoLongitude: poskoLng,
            radiusMeter: 100,
            totalGroupPoints,
            members,
        };
    }
    async createLeaveRequest(studentId, payload) {
        const startDate = payload.tanggalKegiatanTerkait
            ? new Date(payload.tanggalKegiatanTerkait)
            : new Date();
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        const leave = await prisma.studentLeaveRequest.create({
            data: {
                studentId,
                type: payload.kategori || "Izin",
                reason: payload.deskripsi || "Berhalangan hadir kegiatan KKN",
                evidenceUrl: payload.fotoBuktiUrl || null,
                startDate,
                endDate,
                status: "PENDING",
            },
        });
        return {
            izinId: leave.id,
            status: leave.status,
        };
    }
    async createPemanfaatanSampah(userId, payload) {
        const { jenisPemanfaatan = "Kompos Organik", kategoriSampah = "Organik", jumlah = 10, satuan = "Kg", deskripsi = "", } = payload;
        const student = await prisma.studentKkn.findUnique({
            where: { userId },
            include: { user: true },
        });
        const userRtRw = student?.user?.rtRwId;
        let targetRwId = userRtRw;
        if (!targetRwId) {
            const firstRw = await prisma.rtRwArea.findFirst();
            targetRwId = firstRw ? firstRw.id : 1;
        }
        const uniqueNo = `PEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const report = await prisma.pemanfaatan.create({
            data: {
                rwId: targetRwId,
                nomorCaraPemanfaatan: uniqueNo,
                program: jenisPemanfaatan,
                teknologi: kategoriSampah,
                bahanBaku: deskripsi || jenisPemanfaatan,
                volumeBahanBaku: jumlah,
                unitBahanBaku: satuan,
                hasil: jumlah,
                unitHasil: satuan,
                fotoDokumentasiUrl: "/uploads/default-pemanfaatan.jpg",
                tanggalPencatatan: payload.timestamp ? new Date(payload.timestamp) : new Date(),
            },
        });
        // Award +25 points to student for waste utilization report
        const earnedPoints = 25;
        await prisma.pointHistory.create({
            data: {
                userId,
                points: earnedPoints,
                description: `Laporan Pemanfaatan Sampah: ${jenisPemanfaatan} (${jumlah} ${satuan})`,
                kategori: "SETORAN_BEBAS_PENUH",
                redeemable: false,
            },
        });
        return {
            reportId: report.id,
            earnedPoints,
        };
    }
    async notifyWargaStatus(kknUserId, wargaId, statusBimbingan) {
        const warga = await prisma.user.findUnique({ where: { id: wargaId } });
        if (!warga) {
            throw new Error("WARGA_NOT_FOUND");
        }
        const isTerbina = statusBimbingan.toUpperCase() === "TERBINA";
        const title = isTerbina
            ? "Status Pendampingan KKN: Terbina"
            : "Status Pendampingan KKN: Perlu Evaluasi";
        const message = isTerbina
            ? "Selamat! Rumah tangga Anda telah dinilai Terbina dalam pemilahan sampah oleh Mahasiswa KKN."
            : "Rumah tangga Anda saat ini memerlukan peningkatan konsistensi dalam pemilahan sampah.";
        await prisma.notification.create({
            data: {
                userId: wargaId,
                title,
                message,
            },
        });
        if (warga.fcmToken) {
            try {
                await notificationIntegrationService.sendPushNotification(warga.fcmToken, title, message, "KKN_STATUS_NOTIFICATION");
            }
            catch (err) {
                console.error("[KknService] FCM send push error:", err);
            }
        }
        return { wargaId, statusBimbingan, notifiedAt: new Date() };
    }
    async getActiveZone(userId) {
        const student = await prisma.studentKkn.findUnique({
            where: { userId },
            include: {
                assignedPolygon: {
                    include: { kelurahan: true },
                },
                user: {
                    include: {
                        rtRw: {
                            include: { kelurahan: true },
                        },
                    },
                },
            },
        });
        const activeArea = student?.assignedPolygon || student?.user?.rtRw;
        if (!activeArea) {
            return {
                hasActiveZone: false,
                message: "Wilayah penugasan KKN belum ditentukan oleh Admin.",
                zoneName: null,
                kelurahan: null,
                latitude: null,
                longitude: null,
                radiusMeter: 100,
                polygonPoints: [],
            };
        }
        const lat = activeArea.latitude ? Number(activeArea.latitude) : null;
        const lng = activeArea.longitude ? Number(activeArea.longitude) : null;
        return {
            hasActiveZone: true,
            zoneName: activeArea.name || "Wilayah Dampingan KKN",
            kelurahan: activeArea.kelurahan?.name || "Coblong",
            latitude: lat,
            longitude: lng,
            radiusMeter: 100,
            polygonPoints: lat && lng
                ? [
                    [lat + 0.002, lng - 0.002],
                    [lat + 0.002, lng + 0.002],
                    [lat - 0.002, lng + 0.002],
                    [lat - 0.002, lng - 0.002],
                ]
                : [],
        };
    }
}
export const kknService = new KknService();
