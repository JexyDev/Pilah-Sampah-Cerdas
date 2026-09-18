import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { householdRepository } from "../repositories/householdRepository.js";

export class HouseholdService {
  /**
   * Register a new household.
   */
  async registerHousehold(
    userId: string,
    address: string,
    rwId: number,
    latitude: number,
    longitude: number
  ) {
    // 1. Check if user already has a household in this specific RT/RW (to avoid duplicates)
    const existing = await householdRepository.findHouseholdByUserAndArea(userId, rwId);
    if (existing) {
      throw new Error("HOUSEHOLD_ALREADY_EXISTS");
    }

    // 2. Create the household with precise DECIMAL(11,8) GPS coordinates
    const household = await householdRepository.createHousehold({
      userId,
      address,
      rwId,
      latitude,
      longitude,
    });

    return household;
  }

  /**
   * Get households by user.
   */
  async getHouseholdsByUser(userId: string) {
    const households = await householdRepository.findHouseholdsByUserId(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { jumlahAnggotaKeluarga: true },
    });
    const defaultFamilySize = user?.jumlahAnggotaKeluarga || 1;

    return Promise.all(
      households.map(async (h: any) => {
        const headUserId = h.userId || h.user?.id || userId;

        const headBins = await prisma.binOwnership.findMany({
          where: { userId: headUserId, type: "UTAMA" },
          select: { binId: true },
        });

        let actualConnectedCount = 1;
        if (headBins.length > 0) {
          const distinctMembers = await prisma.binOwnership.findMany({
            where: { binId: { in: headBins.map((b) => b.binId) } },
            distinct: ["userId"],
            select: { userId: true },
          });
          actualConnectedCount = Math.max(1, distinctMembers.length);
        }

        const declaredFamilySize = h.user?.jumlahAnggotaKeluarga ?? defaultFamilySize;
        const fSize = Math.max(declaredFamilySize, actualConnectedCount);

        return {
          ...h,
          familySize: fSize,
          jumlahAnggotaKeluarga: fSize,
          user: h.user
            ? {
                ...h.user,
                familySize: fSize,
                jumlahAnggotaKeluarga: fSize,
              }
            : {
                familySize: fSize,
                jumlahAnggotaKeluarga: fSize,
              },
        };
      })
    );
  }

  /**
   * Get specific household details.
   */
  async getHouseholdById(id: string) {
    const household = await householdRepository.findHouseholdById(id);
    if (!household) {
      throw new Error("HOUSEHOLD_NOT_FOUND");
    }
    return household;
  }

  /**
   * Get all households in the system.
   */
  async getAllHouseholds() {
    return householdRepository.findAll();
  }

  /**
   * Get summary of user's full bins for Beranda Warga
   */
  async getBinsSummary(userId: string) {
    const userBins = await prisma.bin.findMany({
      where: {
        OR: [{ userId }, { binOwnerships: { some: { userId } } }],
        status: "ACTIVE_BOUND",
      },
      include: {
        category: true,
        rw: true,
      },
    });

    const binsWithFlag = userBins.map((bin) => {
      const current = Number(bin.currentVolumeLiter || 0);
      const max = Number(bin.maxCapacityLiter || 1);
      const percentage = max > 0 ? parseFloat(((current / max) * 100).toFixed(2)) : 0;
      const isCritical = percentage >= 80;

      return {
        id: bin.id,
        qrCode: bin.qrCode,
        category: bin.category?.name || "Umum",
        currentVolumeLiter: current,
        maxCapacityLiter: max,
        percentage,
        isCritical,
        status: bin.status,
      };
    });

    const criticalBins = binsWithFlag.filter((b) => b.isCritical);

    return {
      totalBins: binsWithFlag.length,
      fullBinsCount: criticalBins.length,
      hasCriticalBins: criticalBins.length > 0,
      criticalBins,
      bins: binsWithFlag,
    };
  }

  async joinHousehold(currentUserId: string, headPhoneInput: string) {
    // 1. Ambil data user yang sedang login
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        binOwnerships: true,
        rw: {
          include: {
            kelurahan: {
              include: {
                kecamatan: {
                  include: {
                    kabupaten: {
                      include: {
                        provinsi: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!currentUser) {
      const err: any = new Error("Pengguna tidak ditemukan");
      err.status = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    // 2. Normalisasi pencarian nomor telepon Kepala Keluarga
    const raw = headPhoneInput.replace(/\D/g, "");
    const candidatePhones = new Set<string>();
    candidatePhones.add(headPhoneInput);
    if (raw.startsWith("62")) {
      candidatePhones.add(`+${raw}`);
      candidatePhones.add(`0${raw.substring(2)}`);
      candidatePhones.add(raw);
    } else if (raw.startsWith("0")) {
      candidatePhones.add(`+62${raw.substring(1)}`);
      candidatePhones.add(`62${raw.substring(1)}`);
      candidatePhones.add(raw);
    }

    // Validasi agar tidak menggabungkan nomor sendiri
    if (candidatePhones.has(currentUser.phone)) {
      const err: any = new Error("Anda tidak dapat memasukkan nomor telepon Anda sendiri.");
      err.status = 400;
      err.code = "CANNOT_JOIN_SELF";
      throw err;
    }

    // Cek apakah user saat ini sudah memiliki tong sampah UTAMA
    const hasPrimaryBin = currentUser.binOwnerships.some((b) => b.type === "UTAMA");
    if (hasPrimaryBin) {
      const err: any = new Error("Akun Anda sudah memiliki Tempat Sampah aktif terdaftar.");
      err.status = 400;
      err.code = "ALREADY_FULLY_ACTIVE";
      throw err;
    }

    // 3. Cari Kepala Keluarga berdasarkan daftar format nomor
    const headUser = await prisma.user.findFirst({
      where: {
        phone: { in: Array.from(candidatePhones) },
      },
      include: {
        rw: {
          include: {
            kelurahan: {
              include: {
                kecamatan: {
                  include: {
                    kabupaten: {
                      include: {
                        provinsi: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        households: {
          include: {
            rw: {
              include: {
                kelurahan: {
                  include: {
                    kecamatan: {
                      include: {
                        kabupaten: {
                          include: {
                            provinsi: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          take: 1,
        },
        binOwnerships: {
          where: { type: "UTAMA" },
        },
      },
    });

    if (!headUser) {
      const err: any = new Error("Nomor HP Kepala Keluarga tidak terdaftar di Berseka.");
      err.status = 404;
      err.code = "HEAD_NOT_FOUND";
      throw err;
    }

    if (!headUser.binOwnerships || headUser.binOwnerships.length === 0) {
      const err: any = new Error("Kepala Keluarga belum mengaktifkan Tempat Sampah di rumah.");
      err.status = 400;
      err.code = "HEAD_HAS_NO_BIN";
      throw err;
    }

    const headHousehold = headUser.households[0];

    // 3b. Pastikan anggota memiliki komunitasId unik sendiri jika belum punya (atau masih format lama KOM-)
    let memberKomunitasId = currentUser.komunitasId;
    if (!memberKomunitasId || memberKomunitasId.startsWith("KOM-")) {
      const { generateUniqueWargaBersekaId } = await import("../utils/komunitasHelper.js");
      const targetRw = headUser.rw || headHousehold?.rw || (currentUser as any).rw;
      memberKomunitasId = await generateUniqueWargaBersekaId(prisma, currentUser.phone, targetRw);
    }

    // 4. Eksekusi database transaction untuk menghubungkan akun
    await prisma.$transaction(async (tx) => {
      // Hubungkan ke seluruh tong sampah milik Kepala Keluarga sebagai TAMBAHAN
      for (const ownership of headUser.binOwnerships) {
        await tx.binOwnership.upsert({
          where: {
            binId_userId: {
              binId: ownership.binId,
              userId: currentUserId,
            },
          },
          update: {
            type: "TAMBAHAN",
          },
          create: {
            binId: ownership.binId,
            userId: currentUserId,
            type: "TAMBAHAN",
          },
        });
      }

      // Update profil anggota keluarga
      await tx.user.update({
        where: { id: currentUserId },
        data: {
          address: headUser.address || headHousehold?.address || currentUser.address,
          rwId: headUser.rwId || headHousehold?.rwId || currentUser.rwId,
          rtId: headUser.rtId || currentUser.rtId,
          wargaSubtype: "ANGGOTA_KELUARGA",
          lifecycleState: "FULLY_ACTIVE",
          komunitasId: memberKomunitasId,
        },
      });

      // Hitung total akun terhubung ke bin Kepala Keluarga & auto-scale jika melebihi input awal
      const binIds = headUser.binOwnerships.map((o: any) => o.binId);
      if (binIds.length > 0) {
        const distinctMembers = await tx.binOwnership.findMany({
          where: { binId: { in: binIds } },
          distinct: ["userId"],
          select: { userId: true },
        });
        const totalConnected = distinctMembers.length;

        if (totalConnected > (headUser.jumlahAnggotaKeluarga || 0)) {
          await tx.user.update({
            where: { id: headUser.id },
            data: {
              jumlahAnggotaKeluarga: totalConnected,
            },
          });
        }
      }
    });

    return {
      household: {
        id: headHousehold?.id || "",
        address: headHousehold?.address || headUser.address || "",
        rw: headHousehold?.rw?.name || "",
        kelurahan: headHousehold?.rw?.kelurahan?.name || "",
        kecamatan: headHousehold?.rw?.kelurahan?.kecamatan?.name || "",
        headName: headUser.name,
        headPhone: headUser.phone,
      },
      user: {
        id: currentUserId,
        lifecycleState: "FULLY_ACTIVE",
        komunitasId: memberKomunitasId,
      },
    };
  }

  async getMyHouseholdDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        binOwnerships: {
          include: {
            bin: {
              include: {
                binOwnerships: {
                  include: {
                    user: {
                      select: { id: true, name: true, phone: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      const err: any = new Error("Pengguna tidak ditemukan");
      err.status = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    const primaryOwnership = user.binOwnerships.find((o) => o.type === "UTAMA");
    const isUtama = Boolean(primaryOwnership);

    let headName = user.name;
    let sharePhone = user.phone;
    const members: Array<{ id: string; name: string; phone: string; type: string }> = [];

    const activeBin = user.binOwnerships[0]?.bin;
    if (activeBin) {
      for (const o of activeBin.binOwnerships) {
        if (o.type === "UTAMA") {
          headName = o.user.name;
          sharePhone = o.user.phone;
        } else if (isUtama && o.userId !== userId) {
          members.push({
            id: o.user.id,
            name: o.user.name,
            phone: o.user.phone,
            type: o.type,
          });
        }
      }
    }

    return {
      myOwnershipType: isUtama ? "UTAMA" : "TAMBAHAN",
      headName,
      sharePhone,
      members: isUtama ? members : [],
    };
  }
}

export const householdService = new HouseholdService();
