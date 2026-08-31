/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { prisma } from "../lib/prisma.js";

export class PoskoKknService {
  async upsertPosko(
    kelompokId: string,
    data: {
      nama: string;
      alamat: string;
      latitude: number;
      longitude: number;
      fotoUrl?: string;
      keterangan?: string;
    }
  ) {
    const posko = await prisma.poskoKkn.upsert({
      where: { kelompokId },
      update: {
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        fotoUrl: data.fotoUrl ?? undefined,
        keterangan: data.keterangan ?? undefined,
      },
      create: {
        kelompokId,
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        fotoUrl: data.fotoUrl ?? null,
        keterangan: data.keterangan ?? null,
      },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true, dpl: { select: { id: true, name: true } } },
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
      const { notificationIntegrationService } = await import("./notificationIntegrationService.js");
      const students = await prisma.studentKkn.findMany({
        where: { kelompokId },
        include: { user: true },
      });

      for (const s of students) {
        if (s.user?.fcmToken) {
          notificationIntegrationService.sendSilentDataPush(
            s.user.fcmToken,
            { event: "REFRESH_KEGIATAN_MAHASISWA" }
          ).catch(() => {});
        }
      }
    } catch (syncErr) {
      console.warn("[PoskoKknService.upsertPosko] Failed to cascade update schedules:", syncErr);
    }

    // Sync to facility table for legacy RW monitoring compatibility
    try {
      const existingFacility = await prisma.facility.findFirst({
        where: { kelompokId, jenis: "posko_kkn" },
      });
      if (existingFacility) {
        await prisma.facility.update({
          where: { id: existingFacility.id },
          data: {
            nama: data.nama,
            alamat: data.alamat,
            latitude: data.latitude,
            longitude: data.longitude,
            foto: data.fotoUrl,
            statusApproval: "APPROVED",
          },
        });
      } else {
        const student = await prisma.studentKkn.findFirst({
          where: { kelompokId, isKetua: true },
          include: { user: true },
        });
        await prisma.facility.create({
          data: {
            nama: data.nama,
            alamat: data.alamat,
            jenis: "posko_kkn",
            kelompokId,
            latitude: data.latitude,
            longitude: data.longitude,
            foto: data.fotoUrl || null,
            pic: student?.user?.name || "Ketua Kelompok",
            kontak: student?.user?.phone || student?.noWa || "-",
            statusApproval: "APPROVED",
          },
        });
      }
    } catch (facErr) {
      console.warn("[PoskoKknService.upsertPosko] Failed to sync facility:", facErr);
    }

    return posko;
  }

  async getAllPosko(userId?: string, role?: string) {
    let whereClause: any = {};
    if (userId && role) {
      const normalizedRole = role.toUpperCase();
      const isAdmin = ["DEVELOPER", "ADMIN_DLH", "DLH", "DLH_ADMIN", "SUPER_USER", "ADMIN", "PANITIA_TASKFORCE", "PEMIMPIN"].some(r => normalizedRole.includes(r));
      
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
            orConditions.push({ kelompok: { dplNamaMentah: { equals: userDpl.name.trim(), mode: "insensitive" } } });
            orConditions.push({ kelompok: { dpl: { name: { equals: userDpl.name.trim(), mode: "insensitive" } } } });
          }
          if (userDpl?.nip) {
            orConditions.push({ kelompok: { dpl: { nip: userDpl.nip } } });
          }
          whereClause = { OR: orConditions };
        } else if (normalizedRole.includes("RW")) {
          const userRw = await prisma.user.findUnique({ where: { id: userId }, select: { rwId: true } });
          if (userRw?.rwId) {
            const rwData = await prisma.rw.findUnique({ where: { id: userRw.rwId }, include: { kelurahan: true } });
            if (rwData?.kelurahan?.name) {
              whereClause = { kelompok: { kelurahan: { equals: rwData.kelurahan.name, mode: "insensitive" } } };
            } else {
              whereClause = { kelompokId: "NONE" };
            }
          } else {
            whereClause = { kelompokId: "NONE" };
          }
        }
      }
    }

    return prisma.poskoKkn.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            dpl: { select: { id: true, name: true } },
            students: {
              select: {
                id: true,
                isKetua: true,
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
    });
  }

  async getPoskoByKelompok(kelompokId: string) {
    return prisma.poskoKkn.findUnique({
      where: { kelompokId },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true, dpl: { select: { id: true, name: true } } },
        },
      },
    });
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
    try {
      await prisma.facility.deleteMany({
        where: { kelompokId, jenis: "posko_kkn" },
      });
    } catch (_) {}
    return prisma.poskoKkn.delete({ where: { kelompokId } });
  }

  // ─── Multi-Posko Methods ─────────────────────────────────────────────────────

  /**
   * Tambah posko tambahan untuk kelompok (multi-posko support).
   * Bisa dipanggil oleh Ketua / Admin.
   */
  async addMultiPosko(kelompokId: string, data: {
    nama: string;
    alamat: string;
    latitude: number;
    longitude: number;
    isUtama?: boolean;
    radius?: number;
    fotoUrl?: string;
    keterangan?: string;
  }) {
    const posko = await (prisma as any).poskoKknMulti.create({
      data: {
        kelompokId,
        nama: data.nama,
        alamat: data.alamat,
        latitude: data.latitude,
        longitude: data.longitude,
        isUtama: data.isUtama ?? false,
        radius: data.radius ?? 150,
        fotoUrl: data.fotoUrl ?? null,
        keterangan: data.keterangan ?? null,
      },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true, dpl: { select: { id: true, name: true } } },
        },
      },
    });

    // Trigger smart zone polygon update setelah posko baru didaftarkan
    try {
      const { smartZoneService } = await import("./smartZoneService.js");
      await smartZoneService.updateGroupAutoPolygon(kelompokId);
    } catch (_) {}

    // Kirim Silent Push ke seluruh mahasiswa kelompok agar mobile reload zona
    try {
      const { notificationIntegrationService } = await import("./notificationIntegrationService.js");
      const students = await prisma.studentKkn.findMany({ where: { kelompokId }, include: { user: true } });
      for (const s of students) {
        if (s.user?.fcmToken) {
          notificationIntegrationService.sendSilentDataPush(s.user.fcmToken, {
            event: "MULTI_POSKO_UPDATED",
            kelompokId,
          }).catch(() => {});
        }
      }
    } catch (_) {}

    return posko;
  }

  /**
   * Update data posko tambahan.
   */
  async updateMultiPosko(poskoId: string, data: {
    nama?: string;
    alamat?: string;
    latitude?: number;
    longitude?: number;
    isUtama?: boolean;
    radius?: number;
    fotoUrl?: string;
    keterangan?: string;
  }) {
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
    return posko;
  }

  /**
   * Hapus posko tambahan.
   */
  async deleteMultiPosko(poskoId: string) {
    const existing = await (prisma as any).poskoKknMulti.findUnique({ where: { id: poskoId }, select: { kelompokId: true } });
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
        select: { id: true, nama: true, alamat: true, latitude: true, longitude: true, fotoUrl: true, keterangan: true, createdAt: true },
      }),
      (prisma as any).poskoKknMulti.findMany({
        where: { kelompokId },
        orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }],
      }),
      (prisma as any).kelompokKkn.findUnique({
        where: { id: kelompokId },
        select: {
          id: true, name: true, kelurahan: true,
          autoPolygon: true, autoPolygonUpdatedAt: true, autoPolygonStudentCount: true,
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
        radius: 150,
        type: "POSKO_UTAMA",
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
        radius: p.radius,
        type: "POSKO_MULTI",
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
