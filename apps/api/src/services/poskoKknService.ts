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
    return prisma.poskoKkn.delete({ where: { kelompokId } });
  }
}

export const poskoKknService = new PoskoKknService();
