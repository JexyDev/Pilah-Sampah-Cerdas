/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { prisma } from "../lib/prisma.js";

export class PoskoKknService {
  /**
   * Auto-heal & synchronize photos from facility table to posko_kkn table
   */
  async syncPoskoPhotosWithFacilities(): Promise<number> {
    try {
      const facilities = await prisma.facility.findMany({
        where: { jenis: "posko_kkn", foto: { not: null } },
        select: { id: true, nama: true, foto: true, kelompokId: true },
      });

      const poskos = await prisma.poskoKkn.findMany({
        select: { id: true, kelompokId: true, nama: true, fotoUrl: true },
      });

      let updated = 0;
      for (const f of facilities) {
        if (!f.foto || f.foto.trim() === "") continue;

        let target = poskos.find((p) => f.kelompokId && p.kelompokId === f.kelompokId);
        if (!target) {
          const cleanFacName = f.nama
            .toLowerCase()
            .replace(/posko\s*(kkn)?\s*/i, "")
            .trim();
          target = poskos.find((p) => p.nama.toLowerCase().includes(cleanFacName));
        }

        if (target && !target.fotoUrl) {
          await prisma.poskoKkn.update({
            where: { id: target.id },
            data: { fotoUrl: f.foto },
          });
          target.fotoUrl = f.foto;
          updated++;
        }
      }

      // Also ensure facility table has foto if posko has fotoUrl
      for (const p of poskos) {
        if (p.fotoUrl && p.kelompokId) {
          const fac = await prisma.facility.findFirst({
            where: { kelompokId: p.kelompokId, jenis: "posko_kkn" },
          });
          if (fac && !fac.foto) {
            await prisma.facility.update({
              where: { id: fac.id },
              data: { foto: p.fotoUrl },
            });
          }
        }
      }

      if (updated > 0) {
        console.log(
          `[PoskoKknService] Auto-synchronized ${updated} posko photos from facility records.`
        );
      }
      return updated;
    } catch (err) {
      console.warn("[PoskoKknService] syncPoskoPhotosWithFacilities error:", err);
      return 0;
    }
  }

  async upsertPosko(
    kelompokId: string,
    data: {
      nama: string;
      alamat: string;
      latitude: number;
      longitude: number;
      radius?: number;
      fotoUrl?: string;
      keterangan?: string;
    }
  ) {
    const existingPosko = await prisma.poskoKkn.findUnique({
      where: { kelompokId },
      select: { fotoUrl: true },
    });

    const existingFacility = await prisma.facility.findFirst({
      where: { kelompokId, jenis: "posko_kkn" },
      select: { id: true, foto: true },
    });

    const isDataFotoProvided =
      typeof data.fotoUrl === "string" && data.fotoUrl.trim() !== "" && data.fotoUrl !== "null";
    const effectiveFotoUrl = isDataFotoProvided
      ? data.fotoUrl.trim()
      : existingPosko?.fotoUrl || existingFacility?.foto || undefined;

    const posko = await prisma.poskoKkn.upsert({
      where: { kelompokId },
      update: {
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        ...(data.radius !== undefined ? { radius: data.radius } : {}),
        ...(effectiveFotoUrl !== undefined ? { fotoUrl: effectiveFotoUrl } : {}),
        keterangan: data.keterangan ?? undefined,
      },
      create: {
        kelompokId,
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius ?? 500,
        fotoUrl: effectiveFotoUrl ?? null,
        keterangan: data.keterangan ?? null,
      },
      include: {
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            dpl: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Otomatis sinkronkan jadwal hari ini dan jadwal aktif kelompok dengan koordinat Posko baru
    try {
      const now = new Date();
      const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const dateStr = wibNow.toISOString().slice(0, 10);
      const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);

      // Update jadwal aktif untuk kelompok ini
      await prisma.schedule.updateMany({
        where: {
          kelompokId,
          isActive: true,
          date: { gte: startOfDay },
        },
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
          location: data.nama,
          title: `Kegiatan Harian ${data.nama}`,
        },
      });

      // Kirim Silent Push ke seluruh mahasiswa kelompok agar aplikasi mobile langsung reload zona
      const { notificationIntegrationService } =
        await import("./notificationIntegrationService.js");
      const students = await prisma.studentKkn.findMany({
        where: { kelompokId },
        include: { user: true },
      });

      for (const s of students) {
        if (s.user?.fcmToken) {
          notificationIntegrationService
            .sendSilentDataPush(s.user.fcmToken, { event: "REFRESH_KEGIATAN_MAHASISWA" })
            .catch(() => {});
        }
      }
    } catch (syncErr) {
      console.warn("[PoskoKknService.upsertPosko] Failed to cascade update schedules:", syncErr);
    }

    // ─── SINKRONISASI KE TABEL FACILITY (POSKO_KKN) UNTUK MENU POSKO WEB ───
    try {
      const kelompokData = await prisma.kelompokKkn.findUnique({
        where: { id: kelompokId },
        include: {
          students: { include: { user: true } },
          dpl: true,
        },
      });

      const ketua = kelompokData?.students.find((s) => s.isKetua) || kelompokData?.students[0];
      const pic = ketua?.user?.name || "Ketua Kelompok KKN";
      const kontak = ketua?.user?.phone || ketua?.noWa || "-";

      let targetRwId: number | undefined;
      if (kelompokData?.cakupanRw) {
        try {
          const parsed =
            typeof kelompokData.cakupanRw === "string"
              ? JSON.parse(kelompokData.cakupanRw)
              : kelompokData.cakupanRw;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const rwNum = Number(parsed[0]);
            if (!isNaN(rwNum) && kelompokData.kelurahan) {
              const rwStr = String(rwNum).padStart(2, "0");
              const matchedRw = await prisma.rw.findFirst({
                where: {
                  name: { contains: rwStr },
                  kelurahan: { name: { equals: kelompokData.kelurahan, mode: "insensitive" } },
                },
              });
              if (matchedRw) targetRwId = matchedRw.id;
            }
          }
        } catch (_) {}
      }

      if (!targetRwId) {
        const firstRw = await prisma.rw.findFirst();
        if (firstRw) targetRwId = firstRw.id;
      }

      const syncFoto = effectiveFotoUrl ?? posko.fotoUrl ?? existingFacility?.foto ?? null;

      if (existingFacility) {
        await prisma.facility.update({
          where: { id: existingFacility.id },
          data: {
            nama: data.nama,
            alamat: data.alamat,
            latitude: data.latitude,
            longitude: data.longitude,
            foto: syncFoto,
            statusApproval: "APPROVED",
          },
        });
      } else {
        await prisma.facility.create({
          data: {
            nama: data.nama,
            jenis: "posko_kkn",
            alamat: data.alamat || "-",
            rwId: targetRwId,
            kelompokId,
            latitude: data.latitude,
            longitude: data.longitude,
            foto: syncFoto,
            pic,
            kontak,
            statusApproval: "APPROVED",
          },
        });
      }
    } catch (facilitySyncErr) {
      console.warn(
        "[PoskoKknService.upsertPosko] Failed to sync Facility posko_kkn:",
        facilitySyncErr
      );
    }

    return posko;
  }

  async getAllPosko(userId?: string, role?: string) {
    let whereClause: any = {};
    if (userId && role) {
      const normalizedRole = role.toUpperCase();
      const isAdmin = [
        "DEVELOPER",
        "ADMIN_DLH",
        "DLH",
        "DLH_ADMIN",
        "SUPER_USER",
        "ADMIN",
        "PANITIA_TASKFORCE",
        "PEMIMPIN",
      ].some((r) => normalizedRole.includes(r));

      if (!isAdmin) {
        if (normalizedRole.includes("MAHASISWA")) {
          whereClause = { kelompok: { students: { some: { userId } } } };
        } else if (normalizedRole.includes("DPL") || normalizedRole.includes("DOSEN")) {
          const userDpl = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, nip: true },
          });
          const orConditions: any[] = [
            { kelompok: { dplId: userId } },
            { kelompok: { dpl: { id: userId } } },
          ];
          if (userDpl?.name) {
            orConditions.push({
              kelompok: { dplNamaMentah: { equals: userDpl.name.trim(), mode: "insensitive" } },
            });
            orConditions.push({
              kelompok: { dpl: { name: { equals: userDpl.name.trim(), mode: "insensitive" } } },
            });
          }
          if (userDpl?.nip) {
            orConditions.push({ kelompok: { dpl: { nip: userDpl.nip } } });
          }
          whereClause = { OR: orConditions };
        } else if (normalizedRole.includes("RW")) {
          const userRw = await prisma.user.findUnique({
            where: { id: userId },
            select: { rwId: true },
          });
          if (userRw?.rwId) {
            const rwData = await prisma.rw.findUnique({
              where: { id: userRw.rwId },
              include: { kelurahan: true },
            });
            if (rwData?.kelurahan?.name) {
              whereClause = {
                kelompok: { kelurahan: { equals: rwData.kelurahan.name, mode: "insensitive" } },
              };
            } else {
              whereClause = { kelompokId: "NONE" };
            }
          } else {
            whereClause = { kelompokId: "NONE" };
          }
        }
      }
    }

    const primaryPoskos = await prisma.poskoKkn.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            cakupanRw: true,
            dpl: { select: { id: true, name: true, phone: true } },
            dplNamaMentah: true,
            facilities: {
              where: { jenis: "posko_kkn" },
              select: { id: true, foto: true, pic: true, kontak: true, alamat: true },
            },
            students: {
              select: {
                id: true,
                isKetua: true,
                user: { select: { id: true, name: true, phone: true } },
                noWa: true,
              },
            },
          },
        },
      },
    });

    let whereClauseMulti: any = {};
    if (whereClause.kelompok) {
      whereClauseMulti = { kelompok: whereClause.kelompok };
    } else if (whereClause.OR) {
      whereClauseMulti = { OR: whereClause.OR };
    } else if (whereClause.kelompokId) {
      whereClauseMulti = { kelompokId: whereClause.kelompokId };
    }

    const multiPoskos = await (prisma as any).poskoKknMulti
      .findMany({
        where: whereClauseMulti,
        orderBy: { createdAt: "desc" },
        include: {
          kelompok: {
            select: {
              id: true,
              name: true,
              kelurahan: true,
              cakupanRw: true,
              dpl: { select: { id: true, name: true, phone: true } },
              dplNamaMentah: true,
              facilities: {
                where: { jenis: "posko_kkn" },
                select: { id: true, foto: true, pic: true, kontak: true, alamat: true },
              },
              students: {
                select: {
                  id: true,
                  isKetua: true,
                  user: { select: { id: true, name: true, phone: true } },
                  noWa: true,
                },
              },
            },
          },
        },
      })
      .catch(() => []);

    const allPoskos = [
      ...primaryPoskos.map((p) => {
        const ketua =
          p.kelompok?.students?.find((s: any) => s.isKetua) || p.kelompok?.students?.[0];
        const facilityPosko =
          p.kelompok?.facilities?.find((f: any) => f.foto) || p.kelompok?.facilities?.[0];
        const resolvedFoto = p.fotoUrl || facilityPosko?.foto || null;
        const rwName = (() => {
          if (p.kelompok?.cakupanRw) {
            try {
              const parsed =
                typeof p.kelompok.cakupanRw === "string"
                  ? JSON.parse(p.kelompok.cakupanRw)
                  : p.kelompok.cakupanRw;
              if (Array.isArray(parsed) && parsed.length > 0)
                return `RW ${String(parsed[0]).padStart(2, "0")}`;
            } catch (_) {}
          }
          return "RW 01";
        })();

        return {
          id: p.id,
          nama: p.nama,
          alamat: p.alamat || "-",
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          foto: resolvedFoto,
          fotoUrl: resolvedFoto,
          keterangan: p.keterangan || null,
          radius: Number((p as any).radius) || 500,
          isUtama: true,
          kelompokId: p.kelompokId,
          kelompokName: p.kelompok?.name || "Kelompok KKN",
          kelurahan: p.kelompok?.kelurahan || "Coblong",
          rwName,
          dplName: p.kelompok?.dpl?.name || p.kelompok?.dplNamaMentah || "DPL Belum Diset",
          pic: ketua?.user?.name || "Ketua Kelompok",
          kontak: ketua?.user?.phone || (ketua as any)?.noWa || "-",
          totalAnggota: p.kelompok?.students?.length || 0,
          statusApproval: "APPROVED",
          createdAt: p.createdAt,
          kelompok: p.kelompok,
        };
      }),
      ...multiPoskos.map((p: any) => {
        const ketua =
          p.kelompok?.students?.find((s: any) => s.isKetua) || p.kelompok?.students?.[0];
        const facilityPosko =
          p.kelompok?.facilities?.find((f: any) => f.foto) || p.kelompok?.facilities?.[0];
        const resolvedFoto = p.fotoUrl || facilityPosko?.foto || null;
        const rwName = (() => {
          if (p.kelompok?.cakupanRw) {
            try {
              const parsed =
                typeof p.kelompok.cakupanRw === "string"
                  ? JSON.parse(p.kelompok.cakupanRw)
                  : p.kelompok.cakupanRw;
              if (Array.isArray(parsed) && parsed.length > 0)
                return `RW ${String(parsed[0]).padStart(2, "0")}`;
            } catch (_) {}
          }
          return "RW 01";
        })();

        return {
          id: p.id,
          nama: p.nama,
          alamat: p.alamat || "-",
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          foto: resolvedFoto,
          fotoUrl: resolvedFoto,
          keterangan: p.keterangan || null,
          radius: p.radius || 500,
          isUtama: p.isUtama ?? false,
          kelompokId: p.kelompokId,
          kelompokName: p.kelompok?.name || "Kelompok KKN",
          kelurahan: p.kelompok?.kelurahan || "Coblong",
          rwName,
          dplName: p.kelompok?.dpl?.name || p.kelompok?.dplNamaMentah || "DPL Belum Diset",
          pic: ketua?.user?.name || "Ketua Kelompok",
          kontak: ketua?.user?.phone || (ketua as any)?.noWa || "-",
          totalAnggota: p.kelompok?.students?.length || 0,
          statusApproval: "APPROVED",
          createdAt: p.createdAt,
          kelompok: p.kelompok,
        };
      }),
    ];

    return allPoskos;
  }

  async getPoskoByKelompok(kelompokId: string) {
    const posko = await prisma.poskoKkn.findUnique({
      where: { kelompokId },
      include: {
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            dpl: { select: { id: true, name: true } },
            facilities: {
              where: { jenis: "posko_kkn" },
              select: { id: true, foto: true },
            },
          },
        },
      },
    });

    if (posko && !posko.fotoUrl) {
      const facilityPosko =
        (posko.kelompok as any)?.facilities?.find((f: any) => f.foto) ||
        (posko.kelompok as any)?.facilities?.[0];
      if (facilityPosko?.foto) {
        posko.fotoUrl = facilityPosko.foto;
      }
    }

    return posko;
  }

  async getPoskoByUserId(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      select: { kelompokId: true },
    });
    if (!student?.kelompokId) return null;
    return this.getPoskoByKelompok(student.kelompokId);
  }

  async deletePosko(kelompokId: string) {
    const res = await prisma.poskoKkn.delete({ where: { kelompokId } }).catch(() => null);
    try {
      await prisma.facility.deleteMany({
        where: { kelompokId, jenis: "posko_kkn" },
      });
    } catch (_) {}
    return res;
  }

  // ─── Multi-Posko Methods ─────────────────────────────────────────────────────

  /**
   * Tambah posko tambahan untuk kelompok (multi-posko support).
   * Bisa dipanggil oleh Ketua / Admin.
   */
  async addMultiPosko(
    kelompokId: string,
    data: {
      nama: string;
      alamat: string;
      latitude: number;
      longitude: number;
      isUtama?: boolean;
      radius?: number;
      fotoUrl?: string;
      keterangan?: string;
    }
  ) {
    const posko = await (prisma as any).poskoKknMulti.create({
      data: {
        kelompokId,
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        isUtama: data.isUtama ?? false,
        radius: data.radius ?? 500,
        fotoUrl: data.fotoUrl ?? null,
        keterangan: data.keterangan ?? null,
      },
      include: {
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            dpl: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Trigger smart zone polygon update setelah posko baru didaftarkan
    try {
      const { smartZoneService } = await import("./smartZoneService.js");
      await smartZoneService.updateGroupAutoPolygon(kelompokId);
    } catch (_) {}

    // Cascade update jadwal aktif jika posko utama belum ada atau isUtama true
    try {
      const now = new Date();
      const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const dateStr = wibNow.toISOString().slice(0, 10);
      const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);

      const hasPrimary = await prisma.poskoKkn.findUnique({ where: { kelompokId } });
      if (!hasPrimary || data.isUtama) {
        await prisma.schedule.updateMany({
          where: {
            kelompokId,
            isActive: true,
            date: { gte: startOfDay },
          },
          data: {
            latitude: data.latitude,
            longitude: data.longitude,
            location: data.nama,
            title: `Kegiatan Harian ${data.nama}`,
            radius: Math.max(150, data.radius ?? 200),
          },
        });
      }
    } catch (_) {}

    // Kirim Silent Push ke seluruh mahasiswa kelompok agar mobile reload zona
    try {
      const { notificationIntegrationService } =
        await import("./notificationIntegrationService.js");
      const students = await prisma.studentKkn.findMany({
        where: { kelompokId },
        include: { user: true },
      });
      for (const s of students) {
        if (s.user?.fcmToken) {
          notificationIntegrationService
            .sendSilentDataPush(s.user.fcmToken, {
              event: "MULTI_POSKO_UPDATED",
              kelompokId,
            })
            .catch(() => {});
        }
      }
    } catch (_) {}

    return posko;
  }

  /**
   * Update data posko tambahan.
   */
  async updateMultiPosko(
    poskoId: string,
    data: {
      nama?: string;
      alamat?: string;
      latitude?: number;
      longitude?: number;
      isUtama?: boolean;
      radius?: number;
      fotoUrl?: string;
      keterangan?: string;
    }
  ) {
    const posko = await (prisma as any).poskoKknMulti.update({
      where: { id: poskoId },
      data: {
        ...(data.nama !== undefined ? { nama: data.nama } : {}),
        ...(data.alamat !== undefined ? { alamat: data.alamat } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.isUtama !== undefined ? { isUtama: data.isUtama } : {}),
        ...(data.radius !== undefined ? { radius: data.radius } : {}),
        ...(data.fotoUrl !== undefined ? { fotoUrl: data.fotoUrl } : {}),
        ...(data.keterangan !== undefined ? { keterangan: data.keterangan } : {}),
      },
    });
    // Refresh auto-polygon
    try {
      const { smartZoneService } = await import("./smartZoneService.js");
      await smartZoneService.updateGroupAutoPolygon(posko.kelompokId);
    } catch (_) {}

    // Cascade update jadwal jika isUtama
    try {
      if (data.isUtama || data.latitude !== undefined || data.longitude !== undefined) {
        const now = new Date();
        const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const dateStr = wibNow.toISOString().slice(0, 10);
        const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);

        await prisma.schedule.updateMany({
          where: {
            kelompokId: posko.kelompokId,
            isActive: true,
            date: { gte: startOfDay },
          },
          data: {
            ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
            ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
            ...(data.nama !== undefined ? { location: data.nama, title: `Kegiatan Harian ${data.nama}` } : {}),
            ...(data.radius !== undefined ? { radius: Math.max(150, data.radius) } : {}),
          },
        });
      }
    } catch (_) {}

    return posko;
  }

  /**
   * Hapus posko tambahan.
   */
  async deleteMultiPosko(poskoId: string) {
    const existing = await (prisma as any).poskoKknMulti.findUnique({
      where: { id: poskoId },
      select: { kelompokId: true },
    });
    await (prisma as any).poskoKknMulti.delete({ where: { id: poskoId } });
    // Refresh auto-polygon
    if (existing?.kelompokId) {
      try {
        const { smartZoneService } = await import("./smartZoneService.js");
        await smartZoneService.updateGroupAutoPolygon(existing.kelompokId);
      } catch (_) {}
    }
    return { success: true };
  }

  /**
   * Get semua posko tambahan (multi) untuk kelompok.
   */
  async getMultiPoskos(kelompokId: string) {
    return (prisma as any).poskoKknMulti.findMany({
      where: { kelompokId },
      orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }],
    });
  }

  /**
   * Get semua posko kelompok (primary + multi) — endpoint utama mobile untuk sinkronisasi zona.
   * Digunakan mobile untuk menampilkan semua titik posko di peta dan menentukan zona kehadiran.
   */
  async getGroupAllPoskos(kelompokId: string) {
    const [primary, multi, kelompok] = await Promise.all([
      prisma.poskoKkn.findUnique({
        where: { kelompokId },
        select: {
          id: true,
          nama: true,
          alamat: true,
          latitude: true,
          longitude: true,
          fotoUrl: true,
          keterangan: true,
          createdAt: true,
          radius: true,
        } as any,
      }),
      (prisma as any).poskoKknMulti.findMany({
        where: { kelompokId },
        orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }],
      }),
      (prisma as any).kelompokKkn.findUnique({
        where: { id: kelompokId },
        select: {
          id: true,
          name: true,
          kelurahan: true,
          autoPolygon: true,
          autoPolygonUpdatedAt: true,
          autoPolygonStudentCount: true,
          dpl: { select: { id: true, name: true } },
        },
      }),
    ]);

    const allPoskos = [];
    if (primary) {
      allPoskos.push({
        id: primary.id,
        nama: primary.nama,
        alamat: primary.alamat,
        latitude: Number(primary.latitude),
        longitude: Number(primary.longitude),
        isUtama: true,
        radius: Number((primary as any).radius) || 500,
        type: "POSKO_UTAMA",
        foto: primary.fotoUrl ?? null,
        fotoUrl: primary.fotoUrl ?? null,
        keterangan: primary.keterangan ?? null,
      });
    }
    for (const p of multi) {
      allPoskos.push({
        id: p.id,
        nama: p.nama,
        alamat: p.alamat,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        isUtama: p.isUtama,
        radius: p.radius || 500,
        type: "POSKO_MULTI",
        foto: p.fotoUrl ?? null,
        fotoUrl: p.fotoUrl ?? null,
        keterangan: p.keterangan ?? null,
      });
    }

    // Parse auto-polygon for mobile map display
    let autoPolygon = null;
    if (kelompok?.autoPolygon && Array.isArray(kelompok.autoPolygon)) {
      autoPolygon = (kelompok.autoPolygon as any[]).map((p: any) => ({
        lat: Array.isArray(p) ? Number(p[0]) : Number(p.lat),
        lng: Array.isArray(p) ? Number(p[1]) : Number(p.lng),
      }));
    }

    return {
      kelompokId,
      kelompokName: kelompok?.name ?? "",
      kelurahan: kelompok?.kelurahan ?? "",
      dpl: kelompok?.dpl ?? null,
      totalPosko: allPoskos.length,
      poskoList: allPoskos,
      autoZone: {
        polygon: autoPolygon,
        updatedAt: kelompok?.autoPolygonUpdatedAt ?? null,
        studentCount: kelompok?.autoPolygonStudentCount ?? 0,
        isActive: autoPolygon !== null && autoPolygon.length >= 3,
      },
    };
  }
}

export const poskoKknService = new PoskoKknService();
