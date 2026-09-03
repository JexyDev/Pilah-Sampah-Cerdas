import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { User, RefreshToken, Role } from "@prisma/client";
import { DatabaseUnavailableError } from "../utils/errors.js";

function isDatabaseConnectionError(error: any): boolean {
  const code = error?.code;
  const message = error?.message || "";
  if (code && typeof code === "string" && code.startsWith("P10")) {
    return true;
  }
  if (
    message.includes("Can't reach database") ||
    message.includes("connection limit") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("socket hang up")
  ) {
    return true;
  }
  return false;
}

import { formatPhoneNumber } from "../utils/phoneUtils.js";
import { getRandomDefaultAvatar } from "../utils/avatarUtils.js";

export class AuthRepository {
  async findUserByPhone(
    phone: string
  ): Promise<(User & { role: Role; rw?: any; studentProfile?: any }) | null> {
    try {
      const raw = (phone || "").trim();
      if (!raw) return null;

      const formatted = formatPhoneNumber(raw);
      const cleaned = raw.replace(/[^\d+]/g, "");
      const digitsOnly = raw.replace(/\D/g, "");

      const candidatePhones = new Set<string>();
      if (raw) candidatePhones.add(raw);
      if (formatted) candidatePhones.add(formatted);
      if (cleaned) candidatePhones.add(cleaned);
      if (digitsOnly) {
        candidatePhones.add(digitsOnly);
        if (digitsOnly.startsWith("0")) {
          candidatePhones.add("+62" + digitsOnly.slice(1));
          candidatePhones.add("62" + digitsOnly.slice(1));
        } else if (digitsOnly.startsWith("62")) {
          candidatePhones.add("+" + digitsOnly);
          candidatePhones.add("0" + digitsOnly.slice(2));
        } else if (digitsOnly.startsWith("8")) {
          candidatePhones.add("+62" + digitsOnly);
          candidatePhones.add("0" + digitsOnly);
          candidatePhones.add("62" + digitsOnly);
        }
      }

      const phoneArray = Array.from(candidatePhones);

      // Cari user berdasarkan seluruh kemungkinan format nomor HP, NIM mahasiswa, atau NIP dosen
      const user = (await prisma.user.findFirst({
        where: {
          OR: [
            { phone: { in: phoneArray } },
            { studentProfile: { nim: { in: [raw, digitsOnly, cleaned] } } },
            { nip: { in: [raw, digitsOnly, cleaned] } },
          ],
        },
        include: {
          role: true,
          rw: {
            include: {
              kelurahan: {
                include: {
                  kecamatan: true,
                },
              },
            },
          },
          rt: true,
          studentProfile: {
            include: {
              assignedRw: {
                include: {
                  kelurahan: {
                    include: {
                      kecamatan: true,
                    },
                  },
                },
              },
              kelompok: {
                include: {
                  dpl: {
                    select: { id: true, name: true, phone: true },
                  },
                },
              },
            },
          },
          dplKelompok: {
            select: {
              id: true,
              name: true,
              kelurahan: true,
              cakupanRw: true,
            },
          },
          petugasProfile: true,
          households: {
            include: {
              rw: {
                include: {
                  kelurahan: true,
                },
              },
            },
          },
        },
      })) as
        | (User & {
            role: Role;
            rw?: any;
            studentProfile?: any;
            dplKelompok?: any;
            petugasProfile?: any;
            households?: any[];
          })
        | null;

      return user;
    } catch (error: any) {
      if (isDatabaseConnectionError(error)) {
        throw new DatabaseUnavailableError();
      }
      throw error;
    }
  }

  /**
   * Store a refresh token in the database.
   */
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Find a valid refresh token.
   */
  async findRefreshToken(
    token: string
  ): Promise<(RefreshToken & { user: User & { role: Role } }) | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: { role: true },
        },
      },
    });
  }

  /**
   * Delete a specific refresh token (used during logout or rotation).
   */
  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken
      .delete({
        where: { token },
      })
      .catch(() => {
        // Ignore if token doesn't exist
      });
  }

  async createOtp(phone: string, code: string, expiresAt: Date) {
    return prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });
  }

  async findOtp(phone: string, code: string) {
    return prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async markOtpUsed(id: string) {
    return prisma.otpCode.update({
      where: { id },
      data: { used: true },
    });
  }
  /**
   * Find a user by ID, including their role details.
   */
  async findUserById(id: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        rw: {
          include: {
            kelurahan: {
              include: {
                kecamatan: true,
              },
            },
          },
        },
        rt: true,
        studentProfile: {
          include: {
            assignedRw: {
              include: {
                kelurahan: {
                  include: {
                    kecamatan: true,
                  },
                },
              },
            },
            kelompok: {
              include: {
                dpl: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
          },
        },
        dplKelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            cakupanRw: true,
          },
        },
        petugasProfile: true,
        households: {
          include: {
            rw: {
              include: {
                kelurahan: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Cari data mahasiswa pendamping KKN untuk warga.
   * Prioritas 1: Dari Tempat Sampah (Bin) yang terdaftar/terkait ke warga
   * Prioritas 2: Dari Mahasiswa KKN aktif yang ditugaskan di RW warga
   */
  async findCitizenMentor(userId: string, rwId?: number | null) {
    const ownership = await prisma.binOwnership.findFirst({
      where: {
        userId,
        bin: {
          status: { in: ["ACTIVE_BOUND", "PENDING_APPROVAL"] },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        bin: {
          select: {
            id: true,
            registeredByStudent: {
              select: {
                id: true,
                name: true,
                phone: true,
                studentProfile: {
                  select: {
                    nim: true,
                    jurusan: true,
                    fakultas: true,
                    kelompok: {
                      select: {
                        id: true,
                        name: true,
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

    if (ownership?.bin?.registeredByStudent) {
      return ownership.bin.registeredByStudent;
    }

    // Cek juga dari Bin langsung jika userId terikat di tabel Bin
    const directBin = await prisma.bin.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE_BOUND", "PENDING_APPROVAL"] },
        registeredByStudentId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: {
        registeredByStudent: {
          select: {
            id: true,
            name: true,
            phone: true,
            studentProfile: {
              select: {
                nim: true,
                jurusan: true,
                fakultas: true,
                kelompok: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (directBin?.registeredByStudent) {
      return directBin.registeredByStudent;
    }

    if (rwId) {
      const activeStudent = await prisma.user.findFirst({
        where: {
          role: { name: "MAHASISWA_KKN" },
          studentProfile: {
            assignedRwId: rwId,
          },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          studentProfile: {
            select: {
              nim: true,
              jurusan: true,
              fakultas: true,
              kelompok: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      return activeStudent;
    }

    return null;
  }

  /**
   * Update a user's profile information.
   */
  async updateUser(
    id: string,
    data: {
      name?: string;
      phone?: string;
      address?: string;
      fotoProfil?: string;
      jumlahAnggotaKeluarga?: number | null;
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update a user's password.
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  /**
   * Find role by name
   */
  async findRoleByName(name: string): Promise<Role | null> {
    try {
      const normalizedMap: Record<string, string> = {
        Admin: "SUPER_USER",
        ADMIN: "SUPER_USER",
        "Super User": "SUPER_USER",
        "SUPER USER": "SUPER_USER",
        "Dinas Lingkungan Hidup": "ADMIN_DLH",
        Camat: "CAMAT",
        Lurah: "LURAH",
        "Rukun Warga": "RW",
        "Rukun Tetangga": "RT",
        "Dosen Pendamping Lapangan": "DPL",
        "Dosen Pembimbing Lapangan": "DPL",
        "Petugas Residu": "PETUGAS_RESIDU",
        Mahasiswa: "MAHASISWA_KKN",
        "Mahasiswa KKN": "MAHASISWA_KKN",
        Warga: "WARGA",
        Pimpinan: "PEMIMPIN",
        "Task Force": "PANITIA_TASKFORCE",
      };

      const searchName = normalizedMap[name] || name;
      let role = await prisma.role.findUnique({ where: { name: searchName } });
      if (!role) {
        role = await prisma.role.findFirst({
          where: { name: { equals: searchName, mode: "insensitive" } },
        });
      }
      return role;
    } catch (error: any) {
      if (isDatabaseConnectionError(error)) {
        throw new DatabaseUnavailableError();
      }
      throw error;
    }
  }

  /**
   * Register Warga Transaction
   */
  async registerWargaTx(
    userData: any,
    householdData: any,
    qrCode?: string | null,
    wargaSubtype?: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      let bin: any = null;
      if (qrCode) {
        // 1. Find Bin with row-level lock (FOR UPDATE)
        const bins = await tx.$queryRaw<any[]>`
          SELECT * FROM tempat_sampah WHERE kode_qr = ${qrCode} FOR UPDATE
        `;
        if (!bins || bins.length === 0) throw new Error("BIN_NOT_FOUND");
        bin = bins[0];

        // 2. Validate Bin status & ownership
        const existingUtama = await tx.binOwnership.findFirst({
          where: {
            binId: bin.id,
            type: "UTAMA",
          },
        });

        if (wargaSubtype === "UTAMA") {
          if (existingUtama) throw new Error("BIN_ALREADY_HAS_PRIMARY_OWNER");
          if (bin.status !== "PRINTED") {
            throw new Error("BIN_NOT_AVAILABLE_FOR_ACTIVATION");
          }
        } else {
          // TAMBAHAN
          if (bin.status !== "ACTIVE_BOUND") {
            throw new Error("BIN_NOT_ACTIVE_YET");
          }
        }
      }

      // 3. Create User
      const role = await tx.role.findUnique({ where: { name: "WARGA" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

      const formattedPhone = formatPhoneNumber(userData.phone);
      const user = await tx.user.create({
        data: {
          name: userData.name,
          password: userData.password,
          phone: formattedPhone,
          address: userData.address || null,
          fotoProfil:
            userData.fotoProfil && userData.fotoProfil.trim() !== "" ? userData.fotoProfil : null,
          rwId: userData.rwId !== undefined && userData.rwId !== null ? Number(userData.rwId) : null,
          rtId: userData.rtId !== undefined && userData.rtId !== null ? Number(userData.rtId) : null,
          email: userData.email || null,
          provinsi: userData.provinsi || null,
          kabupaten: userData.kabupaten || userData.kota || null,
          jumlahAnggotaKeluarga:
            userData.jumlahAnggotaKeluarga !== undefined && userData.jumlahAnggotaKeluarga !== null
              ? Number(userData.jumlahAnggotaKeluarga)
              : null,
          defaultPetugasId: userData.defaultPetugasId || null,
          nip: userData.nip || null,
          institusi: userData.institusi || null,
          jabatan: userData.jabatan || null,
          programStudi: userData.programStudi || null,
          jenjangPendidikan: userData.jenjangPendidikan || null,
          mustChangePassword: userData.mustChangePassword ?? false,
          roleId: role.id,
          status: userData.status || "Aktif",
          wargaSubtype: wargaSubtype || "UTAMA",
        },
      });

      // 4. Create Household
      await tx.household.create({
        data: {
          ...householdData,
          userId: user.id,
        },
      });

      // 5. Create Bin ownership & Update Bin status
      if (bin) {
        await tx.binOwnership.create({
          data: {
            binId: bin.id,
            userId: user.id,
            type: wargaSubtype === "UTAMA" ? "UTAMA" : "TAMBAHAN",
          },
        });

        if (wargaSubtype === "UTAMA") {
          const updatedBin = await tx.bin.update({
            where: { id: bin.id },
            data: {
              status: "ACTIVE_BOUND",
              userId: user.id,
              rwId: user.rwId ?? householdData.rwId,
              latitude: householdData.latitude,
              longitude: householdData.longitude,
            },
          });

          await tx.pointHistory.create({
            data: {
              userId: user.id,
              points: 10,
              description: `Aktivasi Bin ${bin.qrCode}`,
              kategori: "PARTISIPASI_STREAK",
            },
          });

          await tx.auditTrail.create({
            data: {
              action: "REQUEST_ACTIVATE_BIN",
              userId: user.id,
              oldValue: JSON.parse(JSON.stringify(bin)),
              newValue: JSON.parse(JSON.stringify(updatedBin)),
            },
          });
        }
      }

      return user;
    });
  }

  /**
   * Register Mahasiswa KKN Transaction
   */
  async registerKknTx(userData: any, kknData: any) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

      const formattedPhone = formatPhoneNumber(userData.phone);
      const user = await tx.user.create({
        data: {
          name: userData.name,
          password: userData.password,
          phone: formattedPhone,
          address: userData.address || null,
          fotoProfil:
            userData.fotoProfil && userData.fotoProfil.trim() !== "" ? userData.fotoProfil : null,
          rwId: userData.rwId !== undefined && userData.rwId !== null ? Number(userData.rwId) : null,
          rtId: userData.rtId !== undefined && userData.rtId !== null ? Number(userData.rtId) : null,
          email: userData.email || null,
          provinsi: userData.provinsi || null,
          kabupaten: userData.kabupaten || userData.kota || null,
          programStudi: userData.programStudi || userData.jurusan || null,
          jenjangPendidikan: userData.jenjangPendidikan || null,
          institusi: userData.institusi || userData.fakultas || null,
          roleId: role.id,
          status: userData.status || "Aktif",
        },
      });

      const student = await tx.studentKkn.create({
        data: {
          ...kknData,
          userId: user.id,
          whitelistStatus: "APPROVED",
        },
      });

      return { user, student };
    });
  }

  /**
   * Register Petugas Residu Transaction
   */
  async registerPetugasResiduTx(userData: any, petugasData: any) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

      const formattedPhone = formatPhoneNumber(userData.phone);
      const user = await tx.user.create({
        data: {
          name: userData.name,
          password: userData.password,
          phone: formattedPhone,
          address: userData.address || null,
          fotoProfil:
            userData.fotoProfil && userData.fotoProfil.trim() !== "" ? userData.fotoProfil : null,
          rwId: userData.rwId !== undefined && userData.rwId !== null ? Number(userData.rwId) : null,
          rtId: userData.rtId !== undefined && userData.rtId !== null ? Number(userData.rtId) : null,
          email: userData.email || null,
          provinsi: userData.provinsi || null,
          kabupaten: userData.kabupaten || userData.kota || null,
          roleId: role.id,
          status: userData.status || "Pending",
        },
      });

      const petugas = await tx.petugasResidu.create({
        data: {
          ...petugasData,
          userId: user.id,
          whitelistStatus: "PENDING",
        },
      });

      return { user, petugas };
    });
  }

  /**
   * Get Mahasiswa KKN pending list
   */
  async getKknPendingList() {
    return prisma.user.findMany({
      where: {
        role: { name: "MAHASISWA_KKN" },
        status: "Pending",
      },
      include: {
        studentProfile: true,
      },
    });
  }

  /**
   * Whitelist Mahasiswa KKN status
   */
  async updateKknWhitelistStatus(userId: string, status: string, adminUserId: string) {
    const userStatus = status === "APPROVED" ? "Aktif" : "Nonaktif";
    return prisma.$transaction(async (tx) => {
      const oldUser = await tx.user.findUnique({ where: { id: userId } });
      const user = await tx.user.update({
        where: { id: userId },
        data: { status: userStatus },
      });
      await tx.studentKkn.update({
        where: { userId },
        data: { whitelistStatus: status },
      });
      await tx.auditTrail.create({
        data: {
          action: `APPROVE_KKN_${status}`,
          userId: adminUserId,
          oldValue: oldUser ? JSON.parse(JSON.stringify(oldUser)) : null,
          newValue: JSON.parse(JSON.stringify(user)),
        },
      });
      return user;
    });
  }

  /**
   * Create staff/general user
   */
  async createUser(data: any): Promise<User> {
    const formattedPhone = formatPhoneNumber(data.phone);
    return prisma.user.create({
      data: {
        name: data.name,
        password: data.password,
        phone: formattedPhone,
        address: data.address || null,
        fotoProfil:
          data.fotoProfil && data.fotoProfil.trim() !== "" ? data.fotoProfil : null,
        rwId: data.rwId !== undefined && data.rwId !== null ? Number(data.rwId) : null,
        rtId: data.rtId !== undefined && data.rtId !== null ? Number(data.rtId) : null,
        email: data.email || null,
        nip: data.nip || null,
        institusi: data.institusi || null,
        jabatan: data.jabatan || null,
        programStudi: data.programStudi || null,
        jenjangPendidikan: data.jenjangPendidikan || null,
        provinsi: data.provinsi || null,
        kabupaten: data.kabupaten || data.kota || null,
        jumlahAnggotaKeluarga:
          data.jumlahAnggotaKeluarga !== undefined && data.jumlahAnggotaKeluarga !== null
            ? Number(data.jumlahAnggotaKeluarga)
            : null,
        defaultPetugasId: data.defaultPetugasId || null,
        mustChangePassword: data.mustChangePassword ?? false,
        roleId: data.roleId,
        status: data.status || "Aktif",
        wargaSubtype: data.wargaSubtype || null,
      },
    });
  }
}

export const authRepository = new AuthRepository();
