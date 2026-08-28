/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { prisma } from "../lib/prisma.js";

const MAX_DESKRIPSI_LENGTH = 500;

export class PresensiMandiriService {
  /**
   * Check-in presensi mandiri — berlaku TANPA jadwal aktif.
   * Foto bukti wajib. Deskripsi kegiatan wajib (max 500 karakter).
   */
  async checkIn(params: {
    studentId: string;
    latitude: number;
    longitude: number;
    deskripsiKegiatan: string;
    fotoUrl: string;
    platformOs?: string;
  }) {
    const { studentId, latitude, longitude, deskripsiKegiatan, fotoUrl, platformOs } = params;

    if (!deskripsiKegiatan || deskripsiKegiatan.trim().length === 0) {
      throw new Error("DESKRIPSI_REQUIRED");
    }
    if (deskripsiKegiatan.trim().length > MAX_DESKRIPSI_LENGTH) {
      throw new Error(`DESKRIPSI_TOO_LONG: Maksimal ${MAX_DESKRIPSI_LENGTH} karakter`);
    }

    const student = await prisma.studentKkn.findUnique({
      where: { userId: studentId },
      select: { kelompokId: true },
    });

    if (!student) throw new Error("STUDENT_PROFILE_INCOMPLETE");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const db = prisma as any;
    const existingToday = await db.presensiMandiri.findFirst({
      where: { studentId, status: "AKTIF", checkInAt: { gte: todayStart, lte: todayEnd } },
    });

    if (existingToday) throw new Error("ALREADY_CHECKED_IN_TODAY");

    const record = await db.presensiMandiri.create({
      data: {
        studentId,
        kelompokId: student.kelompokId ?? null,
        latitude,
        longitude,
        deskripsiKegiatan: deskripsiKegiatan.trim(),
        fotoUrl,
        platformOs: platformOs || "ANDROID",
        status: "AKTIF",
      },
      include: {
        student: { select: { id: true, name: true, studentProfile: { select: { nim: true } } } },
        kelompok: { select: { id: true, name: true, kelurahan: true } },
      },
    });

    return {
      presensiId: record.id,
      studentId: record.studentId,
      nim: record.student.studentProfile?.nim ?? null,
      namaLengkap: record.student.name,
      kelompok: record.kelompok ? { id: record.kelompok.id, nama: record.kelompok.name, kelurahan: record.kelompok.kelurahan } : null,
      latitude: Number(record.latitude),
      longitude: Number(record.longitude),
      deskripsiKegiatan: record.deskripsiKegiatan,
      fotoUrl: record.fotoUrl,
      status: record.status,
      checkInAt: record.checkInAt.toISOString(),
      checkOutAt: null,
      durasiMenit: null,
      canCheckOut: true,
    };
  }

  async checkOut(params: { presensiId: string; studentId: string; deskripsiKegiatan?: string }) {
    const { presensiId, studentId, deskripsiKegiatan } = params;
    const db = prisma as any;
    const record = await db.presensiMandiri.findFirst({ where: { id: presensiId, studentId } });
    if (!record) throw new Error("PRESENSI_NOT_FOUND");
    if (record.status === "SELESAI") throw new Error("ALREADY_CHECKED_OUT");

    const checkOutAt = new Date();
    const durasiMenit = Math.floor((checkOutAt.getTime() - record.checkInAt.getTime()) / 60000);

    const updateData: any = { status: "SELESAI", checkOutAt, durasiMenit };
    if (deskripsiKegiatan && deskripsiKegiatan.trim().length > 0) {
      if (deskripsiKegiatan.trim().length > MAX_DESKRIPSI_LENGTH) {
        throw new Error(`DESKRIPSI_TOO_LONG: Maksimal ${MAX_DESKRIPSI_LENGTH} karakter`);
      }
      updateData.deskripsiKegiatan = deskripsiKegiatan.trim();
    }

    const updated = await db.presensiMandiri.update({ where: { id: presensiId }, data: updateData });
    return {
      presensiId: updated.id,
      status: updated.status,
      checkInAt: updated.checkInAt.toISOString(),
      checkOutAt: updated.checkOutAt!.toISOString(),
      durasiMenit: updated.durasiMenit,
      deskripsiKegiatan: updated.deskripsiKegiatan,
    };
  }

  async updateDeskripsi(params: { presensiId: string; studentId: string; deskripsiKegiatan: string }) {
    const { presensiId, studentId, deskripsiKegiatan } = params;
    if (!deskripsiKegiatan || deskripsiKegiatan.trim().length === 0) throw new Error("DESKRIPSI_REQUIRED");
    if (deskripsiKegiatan.trim().length > MAX_DESKRIPSI_LENGTH) {
      throw new Error(`DESKRIPSI_TOO_LONG: Maksimal ${MAX_DESKRIPSI_LENGTH} karakter`);
    }
    const db = prisma as any;
    const record = await db.presensiMandiri.findFirst({ where: { id: presensiId, studentId } });
    if (!record) throw new Error("PRESENSI_NOT_FOUND");
    const updated = await db.presensiMandiri.update({
      where: { id: presensiId },
      data: { deskripsiKegiatan: deskripsiKegiatan.trim() },
    });
    return { presensiId: updated.id, deskripsiKegiatan: updated.deskripsiKegiatan, updatedAt: updated.updatedAt.toISOString() };
  }

  async getRiwayatSaya(studentId: string, params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 10));
    const skip = (page - 1) * limit;
    const db = prisma as any;
    const [total, items] = await Promise.all([
      db.presensiMandiri.count({ where: { studentId } }),
      db.presensiMandiri.findMany({
        where: { studentId },
        orderBy: { checkInAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, latitude: true, longitude: true, deskripsiKegiatan: true,
          fotoUrl: true, status: true, checkInAt: true, checkOutAt: true, durasiMenit: true,
          kelompok: { select: { id: true, name: true } },
        },
      }),
    ]);
    return {
      total, page, limit, totalPages: Math.ceil(total / limit),
      items: items.map((p: any) => ({
        presensiId: p.id, latitude: Number(p.latitude), longitude: Number(p.longitude),
        deskripsiKegiatan: p.deskripsiKegiatan, fotoUrl: p.fotoUrl, status: p.status,
        checkInAt: p.checkInAt.toISOString(), checkOutAt: p.checkOutAt?.toISOString() ?? null,
        durasiMenit: p.durasiMenit,
        kelompok: p.kelompok ? { id: p.kelompok.id, nama: p.kelompok.name } : null,
      })),
    };
  }

  async getLiveMap(params: { kelompokId?: string }) {
    const { kelompokId } = params;
    const db = prisma as any;
    const mandiriAktif = await db.presensiMandiri.findMany({
      where: { status: "AKTIF", ...(kelompokId ? { kelompokId } : {}) },
      include: {
        student: { select: { id: true, name: true, studentProfile: { select: { nim: true } }, locations: { orderBy: { recordedAt: "desc" }, take: 1, select: { latitude: true, longitude: true, recordedAt: true } } } },
        kelompok: { select: { id: true, name: true, kelurahan: true } },
      },
    });
    const resmiAktif = await prisma.activityAttendance.findMany({
      where: {
        status: "BERLANGSUNG",
        ...(kelompokId ? { student: { studentProfile: { kelompokId } } } : {}),
      },
      include: {
        student: { select: { id: true, name: true, studentProfile: { select: { nim: true, kelompokId: true } }, locations: { orderBy: { recordedAt: "desc" }, take: 1, select: { latitude: true, longitude: true, recordedAt: true } } } },
        schedule: { select: { title: true, kelompokId: true } },
      },
    });

    const byKelompokMap = new Map<string, any>();
    const addEntry = (kKey: string, kData: any, entry: any) => {
      if (!byKelompokMap.has(kKey)) {
        byKelompokMap.set(kKey, { kelompokId: kData.id, namaKelompok: kData.name ?? kData.nama, kelurahan: kData.kelurahan ?? null, mahasiswaAktif: [] });
      }
      byKelompokMap.get(kKey)!.mahasiswaAktif.push(entry);
    };

    for (const pm of mandiriAktif) {
      const lastLoc = pm.student.locations[0];
      const kId = pm.kelompok?.id ?? "TANPA_KELOMPOK";
      addEntry(kId, pm.kelompok ?? { id: "TANPA_KELOMPOK", name: "Tanpa Kelompok", kelurahan: null }, {
        userId: pm.student.id, nim: pm.student.studentProfile?.nim ?? null, namaLengkap: pm.student.name,
        latitude: lastLoc ? Number(lastLoc.latitude) : Number(pm.latitude),
        longitude: lastLoc ? Number(lastLoc.longitude) : Number(pm.longitude),
        lastSeen: lastLoc ? lastLoc.recordedAt.toISOString() : pm.checkInAt.toISOString(),
        statusPresensi: "MANDIRI", deskripsiKegiatan: pm.deskripsiKegiatan, fotoUrl: pm.fotoUrl,
        presensiId: pm.id, checkInAt: pm.checkInAt.toISOString(),
        durasiMenit: Math.floor((Date.now() - pm.checkInAt.getTime()) / 60000),
      });
    }

    for (const ra of resmiAktif) {
      const lastLoc = ra.student.locations[0];
      const kId = ra.student.studentProfile?.kelompokId ?? "TANPA_KELOMPOK";
      addEntry(kId, { id: kId, name: kId, kelurahan: null }, {
        userId: ra.student.id, nim: ra.student.studentProfile?.nim ?? null, namaLengkap: ra.student.name,
        latitude: lastLoc ? Number(lastLoc.latitude) : Number(ra.latitude),
        longitude: lastLoc ? Number(lastLoc.longitude) : Number(ra.longitude),
        lastSeen: lastLoc ? lastLoc.recordedAt.toISOString() : ra.attendedAt.toISOString(),
        statusPresensi: "RESMI", deskripsiKegiatan: (ra as any).deskripsiKegiatan ?? "Kegiatan Resmi",
        presensiId: ra.id, checkInAt: ra.attendedAt.toISOString(),
        durasiMenit: ra.actualInZoneMinutes ?? Math.floor((Date.now() - ra.attendedAt.getTime()) / 60000),
      });
    }

    const byKelompok = Array.from(byKelompokMap.values());
    return { totalAktif: byKelompok.reduce((s, k) => s + k.mahasiswaAktif.length, 0), byKelompok, timestamp: new Date().toISOString() };
  }

  async getAll(params: { kelompokId?: string; tanggalMulai?: string; tanggalAkhir?: string; status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (params.kelompokId) where.kelompokId = params.kelompokId;
    if (params.status) where.status = params.status;
    if (params.tanggalMulai || params.tanggalAkhir) {
      where.checkInAt = {};
      if (params.tanggalMulai) where.checkInAt.gte = new Date(params.tanggalMulai);
      if (params.tanggalAkhir) { const e = new Date(params.tanggalAkhir); e.setHours(23, 59, 59, 999); where.checkInAt.lte = e; }
    }
    const db = prisma as any;
    const [total, items] = await Promise.all([
      db.presensiMandiri.count({ where }),
      db.presensiMandiri.findMany({
        where, orderBy: { checkInAt: "desc" }, skip, take: limit,
        include: {
          student: { select: { id: true, name: true, studentProfile: { select: { nim: true } } } },
          kelompok: { select: { id: true, name: true, kelurahan: true } },
        },
      }),
    ]);
    return {
      total, page, limit, totalPages: Math.ceil(total / limit),
      items: items.map((p: any) => ({
        presensiId: p.id, studentId: p.studentId,
        nim: p.student.studentProfile?.nim ?? null, namaLengkap: p.student.name,
        kelompok: p.kelompok ? { id: p.kelompok.id, nama: p.kelompok.name, kelurahan: p.kelompok.kelurahan } : null,
        latitude: Number(p.latitude), longitude: Number(p.longitude),
        deskripsiKegiatan: p.deskripsiKegiatan, fotoUrl: p.fotoUrl, status: p.status,
        checkInAt: p.checkInAt.toISOString(), checkOutAt: p.checkOutAt?.toISOString() ?? null,
        durasiMenit: p.durasiMenit, createdAt: p.createdAt.toISOString(),
      })),
    };
  }
}

export const presensiMandiriService = new PresensiMandiriService();
