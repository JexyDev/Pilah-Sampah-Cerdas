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
      statusApproval?: string;
    }
  ) {
    const existingPosko = await prisma.poskoKkn.findUnique({
      where: { kelompokId },
      select: { fotoUrl: true, keterangan: true },
    });

    const existingFacility = await prisma.facility.findFirst({
      where: { kelompokId, jenis: "posko_kkn" },
      select: { id: true, foto: true, statusApproval: true },
    });

    const isDataFotoProvided =
      typeof data.fotoUrl === "string" && data.fotoUrl.trim() !== "" && data.fotoUrl !== "null";
    const effectiveFotoUrl = isDataFotoProvided
      ? data.fotoUrl.trim()
      : existingPosko?.fotoUrl || existingFacility?.foto || undefined;

    const effectiveStatus =
      data.statusApproval ||
      (data.keterangan === "PENDING" || data.keterangan === "REJECTED" ? data.keterangan : undefined) ||
      existingFacility?.statusApproval ||
      (existingPosko?.keterangan === "PENDING" || existingPosko?.keterangan === "REJECTED" ? existingPosko.keterangan : "APPROVED");

    const parsedRadius = data.radius !== undefined ? Math.max(50, Number(data.radius)) : 500;

    const posko = await prisma.poskoKkn.upsert({
      where: { kelompokId },
      update: {
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: parsedRadius,
        ...(effectiveFotoUrl !== undefined ? { fotoUrl: effectiveFotoUrl } : {}),
        keterangan: effectiveStatus,
      },
      create: {
        kelompokId,
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: parsedRadius,
        fotoUrl: effectiveFotoUrl ?? null,
        keterangan: effectiveStatus,
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

    // Otomatis cascade sinkronkan seluruh jadwal aktif kelompok (hari ini & masa depan) dengan koordinat dan radius Posko baru
    try {
      const now = new Date();
      const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const dateStr = wibNow.toISOString().slice(0, 10);
      const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);

      // Update seluruh jadwal aktif dari hari ini ke depan
      await prisma.schedule.updateMany({
        where: {
          kelompokId,
          isActive: true,
          date: { gte: startOfDay },
        },
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
          location: data.alamat,
          radius: parsedRadius,
        },
      });

      // Update juga jadwal akan datang yang lokasinya masih default / null
      await prisma.schedule.updateMany({
        where: {
          kelompokId,
          OR: [{ latitude: null }, { latitude: 0 }, { location: null }, { location: "-" }],
        },
        data: {
          latitude: data.latitude,
          longitude: data.longitude,
          location: data.alamat,
          radius: parsedRadius,
        },
      });
    } catch (syncErr) {
      console.warn("[PoskoKknService.upsertPosko] Failed to cascade update schedules:", syncErr);
    }

    // Refresh smart auto-polygon
    try {
      const { smartZoneService } = await import("./smartZoneService.js");
      await smartZoneService.updateGroupAutoPolygon(kelompokId);
    } catch (_) {}

    // Kirim Silent Push ke seluruh mahasiswa kelompok agar mobile reload zona secara real-time
    try {
      const { notificationIntegrationService } = await import("./notificationIntegrationService.js");
      const students = await prisma.studentKkn.findMany({
        where: { kelompokId },
        include: { user: true },
      });
      for (const s of students) {
        if (s.user?.fcmToken) {
          notificationIntegrationService
            .sendSilentDataPush(s.user.fcmToken, {
              event: "POSKO_UPDATED",
              kelompokId,
            })
            .catch(() => {});
        }
      }
    } catch (_) {}

    // ─── SINKRONISASI KE TABEL FACILITY (POSKO_KKN) UNTUK MENU POSKO WEB ───
    try {
      const kelompokWithMeta = await prisma.kelompokKkn.findUnique({
        where: { id: kelompokId },
        include: {
          students: {
            include: { user: { select: { name: true, phone: true } } },
          },
        },
      });

      const ketua =
        kelompokWithMeta?.students?.find((s) => s.isKetua) || kelompokWithMeta?.students?.[0];
      const pic = ketua?.user?.name || "Ketua Kelompok";
      const kontak = ketua?.user?.phone || (ketua as any)?.noWa || "-";

      let targetRwId: number | null = null;
      if (kelompokWithMeta?.kelurahan) {
        const firstRw = await prisma.rw.findFirst({
          where: { kelurahan: { name: { contains: kelompokWithMeta.kelurahan } } },
          select: { id: true },
        });
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
            statusApproval: effectiveStatus,
          },
        });
      } else {
        await prisma.facility.create({
          data: {
            nama: data.nama,
            jenis: "posko_kkn",
            alamat: data.alamat || "-",
            rwId: targetRwId ?? undefined,
            kelompokId,
            latitude: data.latitude,
            longitude: data.longitude,
            foto: syncFoto,
            pic,
            kontak,
            statusApproval: effectiveStatus,
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
              select: { id: true, foto: true, pic: true, kontak: true, alamat: true, statusApproval: true },
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
                select: { id: true, foto: true, pic: true, kontak: true, alamat: true, statusApproval: true },
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

        const rawStatus = (facilityPosko as any)?.statusApproval || p.keterangan;
        const statusApproval =
          rawStatus === "PENDING" || rawStatus === "REJECTED" ? rawStatus : "APPROVED";

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
          statusApproval,
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

        const rawStatus = (facilityPosko as any)?.statusApproval || p.keterangan;
        const statusApproval =
          rawStatus === "PENDING" || rawStatus === "REJECTED" ? rawStatus : "APPROVED";

        return {
          id: p.id,
          nama: p.nama,
          alamat: p.alamat || "-",
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          foto: resolvedFoto,
          fotoUrl: resolvedFoto,
          keterangan: p.keterangan || null,
          radius: Number(p.radius) || 500,
          isUtama: p.isUtama ?? false,
          kelompokId: p.kelompokId,
          kelompokName: p.kelompok?.name || "Kelompok KKN",
          kelurahan: p.kelompok?.kelurahan || "Coblong",
          rwName,
          dplName: p.kelompok?.dpl?.name || p.kelompok?.dplNamaMentah || "DPL Belum Diset",
          pic: ketua?.user?.name || "Ketua Kelompok",
          kontak: ketua?.user?.phone || (ketua as any)?.noWa || "-",
          totalAnggota: p.kelompok?.students?.length || 0,
          statusApproval,
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
        radius: data.radius ? Math.max(50, Number(data.radius)) : 500,
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
            radius: Math.max(50, data.radius ?? 500),
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
        ...(data.radius !== undefined ? { radius: Math.max(50, Number(data.radius)) } : {}),
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
            ...(data.radius !== undefined ? { radius: Math.max(50, Number(data.radius)) } : {}),
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
        radius: Number(p.radius) || 500,
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

  /**
   * UNIFIED MAP SERVICE (Single Source of Truth)
   * Menggabungkan seluruh data posko (Primary, Multi, Facility), jadwal aktif (termasuk polygon & radius),
   * auto-polygon smart zone, dan status mahasiswa dalam format terpadu untuk Web Inspeksi, Web Posko, dan Mobile.
   */
  async getUnifiedZones(query?: {
    kelompokId?: string;
    kelurahan?: string;
    userId?: string;
    role?: string;
  }) {
    let whereKelompok: any = {};
    if (query?.kelompokId) {
      whereKelompok.id = query.kelompokId;
    }
    if (query?.kelurahan && query.kelurahan !== "ALL") {
      whereKelompok.kelurahan = { equals: query.kelurahan, mode: "insensitive" };
    }

    // Role-based filtering if applicable
    if (query?.userId && query?.role) {
      const normalizedRole = query.role.toUpperCase();
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
          whereKelompok.students = { some: { userId: query.userId } };
        } else if (normalizedRole.includes("DPL") || normalizedRole.includes("DOSEN")) {
          const userDpl = await prisma.user.findUnique({
            where: { id: query.userId },
            select: { id: true, name: true, nip: true },
          });
          const orConds: any[] = [{ dplId: query.userId }, { dpl: { id: query.userId } }];
          if (userDpl?.name) {
            orConds.push({ dplNamaMentah: { equals: userDpl.name.trim(), mode: "insensitive" } });
            orConds.push({ dpl: { name: { equals: userDpl.name.trim(), mode: "insensitive" } } });
          }
          if (userDpl?.nip) {
            orConds.push({ dpl: { nip: userDpl.nip } });
          }
          whereKelompok.OR = orConds;
        }
      }
    }

    const groups = await prisma.kelompokKkn.findMany({
      where: whereKelompok,
      orderBy: { name: "asc" },
      include: {
        dpl: { select: { id: true, name: true, phone: true } },
        poskoKkn: true,
        poskoMulti: {
          orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }],
        },
        facilities: {
          where: { jenis: "posko_kkn" },
        },
        students: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    // Ambil jadwal aktif hari ini / terkini untuk setiap kelompok
    const now = new Date();
    const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const dateStr = wibNow.toISOString().slice(0, 10);
    const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59+07:00`);

    const groupIds = (groups as any[]).map((g: any) => g.id);
    const activeSchedules = await prisma.schedule.findMany({
      where: {
        kelompokId: { in: groupIds },
        isActive: true,
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { createdAt: "desc" },
    });

    const fallbackSchedules = await prisma.schedule.findMany({
      where: {
        kelompokId: { in: groupIds },
        isActive: true,
        date: { gt: endOfDay },
      },
      orderBy: { date: "asc" },
    });

    // Ambil lokasi aktif mahasiswa terkini (30 menit terakhir)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentLocations = await prisma.studentLocation.findMany({
      where: { recordedAt: { gte: thirtyMinsAgo } },
      orderBy: { recordedAt: "desc" },
    });

    const studentLocMap = new Map<string, any>();
    for (const loc of recentLocations) {
      if (!studentLocMap.has(loc.studentId)) {
        studentLocMap.set(loc.studentId, loc);
      }
    }

    const unifiedZones = (groups as any[]).map((g: any) => {
      const todaySched = activeSchedules.find((s) => s.kelompokId === g.id);
      const futureSched = fallbackSchedules.find((s) => s.kelompokId === g.id);
      const activeSchedule = todaySched || futureSched || null;

      // Compile all posko points
      const allPoskoList: Array<{
        id: string;
        nama: string;
        alamat: string;
        latitude: number;
        longitude: number;
        radius: number;
        isUtama: boolean;
        type: "POSKO_UTAMA" | "POSKO_MULTI";
        fotoUrl: string | null;
        keterangan: string | null;
        statusApproval: string;
      }> = [];

      const facPosko = g.facilities?.[0];
      if (g.poskoKkn && g.poskoKkn.latitude && g.poskoKkn.longitude) {
        const resolvedFoto = g.poskoKkn.fotoUrl || facPosko?.foto || null;
        const statusApproval =
          g.poskoKkn.keterangan === "PENDING" || g.poskoKkn.keterangan === "REJECTED"
            ? g.poskoKkn.keterangan
            : facPosko?.statusApproval || "APPROVED";

        allPoskoList.push({
          id: g.poskoKkn.id,
          nama: g.poskoKkn.nama,
          alamat: g.poskoKkn.alamat,
          latitude: Number(g.poskoKkn.latitude),
          longitude: Number(g.poskoKkn.longitude),
          radius: Number((g.poskoKkn as any).radius) || 500,
          isUtama: true,
          type: "POSKO_UTAMA",
          fotoUrl: resolvedFoto,
          keterangan: g.poskoKkn.keterangan,
          statusApproval,
        });
      }

      if (Array.isArray(g.poskoMulti)) {
        for (const m of g.poskoMulti) {
          if (m.latitude && m.longitude) {
            allPoskoList.push({
              id: m.id,
              nama: m.nama,
              alamat: m.alamat,
              latitude: Number(m.latitude),
              longitude: Number(m.longitude),
              radius: Number(m.radius) || 500,
              isUtama: m.isUtama,
              type: "POSKO_MULTI",
              fotoUrl: m.fotoUrl || null,
              keterangan: m.keterangan,
              statusApproval: "APPROVED",
            });
          }
        }
      }

      // Determine center coordinate & geofence source
      const primaryPosko = allPoskoList.find((p) => p.isUtama) || allPoskoList[0] || null;
      let centerLat = -6.8915; // default Coblong
      let centerLng = 107.6107;
      let geofenceSource: "POSKO_RESMI" | "JADWAL_KEGIATAN" | "ESTIMASI_KELURAHAN" | "DEFAULT_COBLONG" = "DEFAULT_COBLONG";
      let radius = 500;
      let schedulePolygon: any = null;

      if (primaryPosko) {
        centerLat = primaryPosko.latitude;
        centerLng = primaryPosko.longitude;
        radius = primaryPosko.radius || 500;
        geofenceSource = "POSKO_RESMI";
      } else if (activeSchedule && activeSchedule.latitude && activeSchedule.longitude) {
        centerLat = Number(activeSchedule.latitude);
        centerLng = Number(activeSchedule.longitude);
        radius = Number(activeSchedule.radius) || 500;
        geofenceSource = "JADWAL_KEGIATAN";
        if (activeSchedule.polygon) schedulePolygon = activeSchedule.polygon;
      }

      // Parse auto-polygon
      let autoPolygon: Array<{ lat: number; lng: number }> | null = null;
      if (g.autoPolygon && Array.isArray(g.autoPolygon)) {
        autoPolygon = (g.autoPolygon as any[]).map((p: any) => ({
          lat: Array.isArray(p) ? Number(p[0]) : Number(p.lat ?? p.latitude),
          lng: Array.isArray(p) ? Number(p[1]) : Number(p.lng ?? p.longitude),
        }));
      }

      // Compile detailed students
      const studentsDetailed = (g.students || []).map((st) => {
        const uId = st.userId;
        const loc = uId ? studentLocMap.get(uId) : null;
        return {
          id: st.id,
          userId: st.userId,
          name: st.user?.name || "Mahasiswa",
          phone: st.user?.phone || st.noWa || "-",
          isKetua: st.isKetua,
          location: loc
            ? {
                latitude: Number(loc.latitude),
                longitude: Number(loc.longitude),
                recordedAt: loc.recordedAt,
              }
            : null,
        };
      });

      const ketua = g.students?.find((s) => s.isKetua) || g.students?.[0];

      return {
        kelompokId: g.id,
        kelompokName: g.name,
        kelurahan: g.kelurahan || "Coblong",
        dpl: g.dpl
          ? { id: g.dpl.id, name: g.dpl.name, phone: g.dpl.phone }
          : { id: null, name: g.dplNamaMentah || "Belum Diset", phone: "-" },
        pic: ketua?.user?.name || "Ketua Kelompok",
        kontak: ketua?.user?.phone || (ketua as any)?.noWa || "-",
        center: { latitude: centerLat, longitude: centerLng },
        radius,
        geofenceSource,
        hasRegisteredPosko: allPoskoList.length > 0,
        primaryPosko,
        poskoList: allPoskoList,
        totalPosko: allPoskoList.length,
        activeSchedule: activeSchedule
          ? {
              id: activeSchedule.id,
              title: activeSchedule.title,
              date: activeSchedule.date,
              time: activeSchedule.time,
              category: activeSchedule.category,
              location: activeSchedule.location,
              latitude: activeSchedule.latitude ? Number(activeSchedule.latitude) : null,
              longitude: activeSchedule.longitude ? Number(activeSchedule.longitude) : null,
              radius: Number(activeSchedule.radius) || 500,
              polygon: activeSchedule.polygon,
            }
          : null,
        autoZone: {
          polygon: autoPolygon,
          updatedAt: g.autoPolygonUpdatedAt,
          studentCount: g.autoPolygonStudentCount ?? 0,
          isActive: autoPolygon !== null && autoPolygon.length >= 3,
        },
        students: studentsDetailed,
        totalStudents: studentsDetailed.length,
        activeGpsCount: studentsDetailed.filter((s) => s.location !== null).length,
      };
    });

    return unifiedZones;
  }
}

export const poskoKknService = new PoskoKknService();
