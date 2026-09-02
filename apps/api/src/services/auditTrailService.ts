/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Centralized Audit Trail & Activity Logging Service
 * Menyediakan pencatatan jejak audit dengan SHA-256 hash chaining,
 * penyimpanan detail terstruktur aktivitas presensi & KKN, serta WebSocket real-time broadcast.
 */

import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { websocketService } from "./websocketService.js";

export interface CreateAuditParams {
  action: string;
  userId?: string | null;
  roleName?: string;
  featureCategory?: string;
  endpoint?: string;
  ipAddress?: string;
  oldValue?: any;
  newValue?: any;
}

export class AuditTrailService {
  /**
   * Catat entri audit log ke database dengan SHA-256 integrity hash chaining.
   * Aman dari error agar tidak menggagalkan alur transaksi utama.
   */
  async recordAudit(params: CreateAuditParams) {
    try {
      const {
        action,
        userId = null,
        roleName = "MAHASISWA_KKN",
        featureCategory = "Presensi KKN",
        endpoint = "/api/v1/kkn-attendance",
        ipAddress = "127.0.0.1",
        oldValue = null,
        newValue = null,
      } = params;

      if (!prisma?.auditTrail) {
        return null;
      }

      // Ambil audit log terakhir untuk rantai hash (previousHash)
      const lastLog = await prisma.auditTrail.findFirst({
        orderBy: { timestamp: "desc" },
        select: { hash: true },
      });

      const previousHash = lastLog?.hash || "GENESIS_HASH";

      const payloadString = JSON.stringify({
        action,
        userId,
        roleName,
        featureCategory,
        endpoint,
        ipAddress,
        oldValue,
        newValue,
        previousHash,
      });

      const hash = crypto.createHash("sha256").update(payloadString).digest("hex");

      const newLog = await prisma.auditTrail.create({
        data: {
          action,
          userId,
          roleName,
          featureCategory,
          endpoint,
          ipAddress,
          oldValue,
          newValue,
          hash,
          previousHash,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              fotoProfil: true,
              role: { select: { id: true, name: true } },
              studentProfile: {
                select: {
                  nim: true,
                  jurusan: true,
                  kelompok: { select: { id: true, name: true, kelurahan: true } },
                },
              },
            },
          },
        },
      });

      // Siarkan ke seluruh listener dashboard web secara real-time via WebSocket
      try {
        websocketService.broadcastAuditLog(newLog);
      } catch (_wsErr) {
        // Abaikan jika websocket error
      }

      return newLog;
    } catch (error) {
      console.error("[AuditTrailService] Gagal menyimpan log audit:", error);
      return null;
    }
  }

  /**
   * 1. Catat Presensi Masuk / Mulai Kegiatan KKN
   */
  async recordPresensiMasuk(params: {
    studentId: string;
    scheduleId: string;
    scheduleTitle?: string;
    kelompokName?: string;
    kelurahan?: string;
    latitude: number;
    longitude: number;
    method?: string;
    status?: string;
    deskripsiKegiatan?: string;
    fotoUrl?: string;
    ipAddress?: string;
    studentName?: string;
    nim?: string;
  }) {
    const {
      studentId,
      scheduleId,
      scheduleTitle = "Kegiatan KKN",
      kelompokName = "-",
      kelurahan = "-",
      latitude,
      longitude,
      method = "GPS_ACTIVITY",
      status = "BERLANGSUNG",
      deskripsiKegiatan,
      fotoUrl,
      ipAddress,
      studentName,
      nim,
    } = params;

    const nowIso = new Date().toISOString();
    const formattedWib = new Date(Date.now() + 7 * 3600 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    return this.recordAudit({
      action: "PRESENSI_MASUK_KKN",
      userId: studentId,
      roleName: "MAHASISWA_KKN",
      featureCategory: "Presensi KKN",
      endpoint: `/api/v1/kkn/kegiatan/${scheduleId}/mulai`,
      ipAddress,
      newValue: {
        tipe: "PRESENSI_MASUK",
        studentId,
        namaMahasiswa: studentName || "Mahasiswa KKN",
        nim: nim || "-",
        kelompok: kelompokName,
        kelurahan,
        scheduleId,
        namaKegiatan: scheduleTitle,
        jamMasuk: nowIso,
        jamMasukWib: `${formattedWib} WIB`,
        status,
        statusDisplay: "Sedang di Lapangan",
        koordinat: { latitude, longitude },
        metode: method,
        deskripsiKegiatan: deskripsiKegiatan || null,
        fotoUrl: fotoUrl || null,
        keterangan: `Mahasiswa ${studentName ? `${studentName} (${nim || "-"})` : ""} telah melakukan Presensi Masuk pada kegiatan "${scheduleTitle}" (${kelompokName}, Kel. ${kelurahan}).`,
      },
    });
  }

  /**
   * 2. Catat Presensi Pulang / Selesai Kegiatan KKN
   */
  async recordPresensiPulang(params: {
    studentId: string;
    scheduleId: string;
    scheduleTitle?: string;
    kelompokName?: string;
    kelurahan?: string;
    attendedAt?: Date | string | null;
    checkOutAt?: Date | string | null;
    durasiMenit: number;
    durasiTargetMenit?: number;
    isMemenuhiDurasi: boolean;
    status: string;
    statusDisplay: string;
    latitude?: number | null;
    longitude?: number | null;
    deskripsiKegiatan?: string | null;
    fotoUrl?: string | null;
    ipAddress?: string;
    studentName?: string;
    nim?: string;
  }) {
    const {
      studentId,
      scheduleId,
      scheduleTitle = "Kegiatan KKN",
      kelompokName = "-",
      kelurahan = "-",
      attendedAt,
      checkOutAt,
      durasiMenit,
      durasiTargetMenit = 240,
      isMemenuhiDurasi,
      status,
      statusDisplay,
      latitude,
      longitude,
      deskripsiKegiatan,
      fotoUrl,
      ipAddress,
      studentName,
      nim,
    } = params;

    const hours = Math.floor(durasiMenit / 60);
    const mins = durasiMenit % 60;
    const durasiFormatted =
      hours === 0 ? `${mins} Menit` : mins === 0 ? `${hours} Jam` : `${hours} Jam ${mins} Menit`;

    const formattedWib = new Date(Date.now() + 7 * 3600 * 1000)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    return this.recordAudit({
      action: "PRESENSI_PULANG_KKN",
      userId: studentId,
      roleName: "MAHASISWA_KKN",
      featureCategory: "Presensi KKN",
      endpoint: `/api/v1/kkn/kegiatan/${scheduleId}/selesai`,
      ipAddress,
      oldValue: {
        statusSebelumnya: "BERLANGSUNG",
        attendedAt: attendedAt ? new Date(attendedAt).toISOString() : null,
      },
      newValue: {
        tipe: "PRESENSI_PULANG",
        studentId,
        namaMahasiswa: studentName || "Mahasiswa KKN",
        nim: nim || "-",
        kelompok: kelompokName,
        kelurahan,
        scheduleId,
        namaKegiatan: scheduleTitle,
        jamMasuk: attendedAt ? new Date(attendedAt).toISOString() : null,
        jamPulang: checkOutAt ? new Date(checkOutAt).toISOString() : new Date().toISOString(),
        jamPulangWib: `${formattedWib} WIB`,
        durasiMenit,
        durasiFormatted,
        durasiTargetMenit,
        isMemenuhiDurasi,
        status,
        statusDisplay,
        koordinat: latitude && longitude ? { latitude, longitude } : null,
        deskripsiKegiatan: deskripsiKegiatan || null,
        fotoUrl: fotoUrl || null,
        keterangan: `Mahasiswa ${studentName ? `${studentName} (${nim || "-"})` : ""} telah melakukan Presensi Pulang pada kegiatan "${scheduleTitle}" (Durasi Terkumpul: ${durasiFormatted}, Status: ${statusDisplay}).`,
      },
    });
  }

  /**
   * 3. Catat Jeda Sesi Kegiatan KKN
   */
  async recordPresensiJeda(params: {
    studentId: string;
    scheduleId: string;
    scheduleTitle?: string;
    kelompokName?: string;
    alasan: string;
    durasiSebelumJedaMenit: number;
    waktuJeda: string;
    ipAddress?: string;
    studentName?: string;
    nim?: string;
  }) {
    const {
      studentId,
      scheduleId,
      scheduleTitle = "Kegiatan KKN",
      kelompokName = "-",
      alasan,
      durasiSebelumJedaMenit,
      waktuJeda,
      ipAddress,
      studentName,
      nim,
    } = params;

    return this.recordAudit({
      action: "PRESENSI_JEDA_KKN",
      userId: studentId,
      roleName: "MAHASISWA_KKN",
      featureCategory: "Presensi KKN",
      endpoint: `/api/v1/kkn/kegiatan/${scheduleId}/jeda`,
      ipAddress,
      newValue: {
        tipe: "PRESENSI_JEDA",
        studentId,
        namaMahasiswa: studentName || "Mahasiswa KKN",
        nim: nim || "-",
        kelompok: kelompokName,
        scheduleId,
        namaKegiatan: scheduleTitle,
        alasanJeda: alasan,
        durasiSebelumJedaMenit,
        waktuJeda,
        keterangan: `Mahasiswa ${studentName ? `${studentName} (${nim || "-"})` : ""} menjeda sesi kegiatan "${scheduleTitle}" dengan alasan: "${alasan}" (Durasi tersimpan: ${durasiSebelumJedaMenit} menit).`,
      },
    });
  }

  /**
   * 4. Catat Resume / Lanjut Sesi Kegiatan KKN
   */
  async recordPresensiLanjut(params: {
    studentId: string;
    scheduleId: string;
    scheduleTitle?: string;
    kelompokName?: string;
    durasiSebelumResumeMenit: number;
    waktuResume: string;
    ipAddress?: string;
    studentName?: string;
    nim?: string;
  }) {
    const {
      studentId,
      scheduleId,
      scheduleTitle = "Kegiatan KKN",
      kelompokName = "-",
      durasiSebelumResumeMenit,
      waktuResume,
      ipAddress,
      studentName,
      nim,
    } = params;

    return this.recordAudit({
      action: "PRESENSI_LANJUT_KKN",
      userId: studentId,
      roleName: "MAHASISWA_KKN",
      featureCategory: "Presensi KKN",
      endpoint: `/api/v1/kkn/kegiatan/${scheduleId}/mulai`,
      ipAddress,
      newValue: {
        tipe: "PRESENSI_LANJUT",
        studentId,
        namaMahasiswa: studentName || "Mahasiswa KKN",
        nim: nim || "-",
        kelompok: kelompokName,
        scheduleId,
        namaKegiatan: scheduleTitle,
        durasiSebelumResumeMenit,
        waktuResume,
        keterangan: `Mahasiswa ${studentName ? `${studentName} (${nim || "-"})` : ""} melanjutkan kembali (resume) sesi kegiatan "${scheduleTitle}".`,
      },
    });
  }

  /**
   * 5. Catat Presensi Mandiri - Check-In
   */
  async recordPresensiMandiriCheckIn(params: {
    presensiId: string;
    studentId: string;
    studentName?: string;
    nim?: string;
    kelompokName?: string;
    kelurahan?: string;
    latitude: number;
    longitude: number;
    deskripsiKegiatan: string;
    fotoUrl: string;
    platformOs?: string;
    checkInAt: string;
    ipAddress?: string;
  }) {
    const {
      presensiId,
      studentId,
      studentName,
      nim,
      kelompokName = "-",
      kelurahan = "-",
      latitude,
      longitude,
      deskripsiKegiatan,
      fotoUrl,
      platformOs = "ANDROID",
      checkInAt,
      ipAddress,
    } = params;

    return this.recordAudit({
      action: "PRESENSI_MANDIRI_CHECKIN",
      userId: studentId,
      roleName: "MAHASISWA_KKN",
      featureCategory: "Presensi KKN",
      endpoint: "/api/v1/presensi/mandiri/check-in",
      ipAddress,
      newValue: {
        tipe: "PRESENSI_MANDIRI_CHECKIN",
        presensiId,
        studentId,
        namaMahasiswa: studentName || "Mahasiswa KKN",
        nim: nim || "-",
        kelompok: kelompokName,
        kelurahan,
        deskripsiKegiatan,
        fotoUrl,
        platformOs,
        koordinat: { latitude, longitude },
        waktuCheckIn: checkInAt,
        keterangan: `Mahasiswa ${studentName ? `${studentName} (${nim || "-"})` : ""} melakukan Check-In Presensi Mandiri: "${deskripsiKegiatan}".`,
      },
    });
  }

  /**
   * 6. Catat Presensi Mandiri - Check-Out
   */
  async recordPresensiMandiriCheckOut(params: {
    presensiId: string;
    studentId: string;
    studentName?: string;
    nim?: string;
    kelompokName?: string;
    durasiMenit: number;
    checkInAt: string;
    checkOutAt: string;
    deskripsiKegiatan?: string;
    ipAddress?: string;
  }) {
    const {
      presensiId,
      studentId,
      studentName,
      nim,
      kelompokName = "-",
      durasiMenit,
      checkInAt,
      checkOutAt,
      deskripsiKegiatan,
      ipAddress,
    } = params;

    const hours = Math.floor(durasiMenit / 60);
    const mins = durasiMenit % 60;
    const durasiFormatted =
      hours === 0 ? `${mins} Menit` : mins === 0 ? `${hours} Jam` : `${hours} Jam ${mins} Menit`;

    return this.recordAudit({
      action: "PRESENSI_MANDIRI_CHECKOUT",
      userId: studentId,
      roleName: "MAHASISWA_KKN",
      featureCategory: "Presensi KKN",
      endpoint: `/api/v1/presensi/mandiri/${presensiId}/check-out`,
      ipAddress,
      newValue: {
        tipe: "PRESENSI_MANDIRI_CHECKOUT",
        presensiId,
        studentId,
        namaMahasiswa: studentName || "Mahasiswa KKN",
        nim: nim || "-",
        kelompok: kelompokName,
        durasiMenit,
        durasiFormatted,
        waktuCheckIn: checkInAt,
        waktuCheckOut: checkOutAt,
        deskripsiKegiatan: deskripsiKegiatan || null,
        keterangan: `Mahasiswa ${studentName ? `${studentName} (${nim || "-"})` : ""} menyelesaikan Presensi Mandiri (Total durasi pengerjaan: ${durasiFormatted}).`,
      },
    });
  }

  /**
   * 7. Catat Pelanggaran Keluar Zona Geofence
   */
  async recordPresensiPelanggaranZona(params: {
    studentId: string;
    scheduleId: string;
    scheduleTitle?: string;
    kelompokName?: string;
    outOfZoneMinutes: number;
    pointsDeducted: number;
    ipAddress?: string;
    studentName?: string;
    nim?: string;
  }) {
    const {
      studentId,
      scheduleId,
      scheduleTitle = "Kegiatan KKN",
      kelompokName = "-",
      outOfZoneMinutes,
      pointsDeducted,
      ipAddress,
      studentName,
      nim,
    } = params;

    return this.recordAudit({
      action: "PRESENSI_PELANGGARAN_ZONA",
      userId: studentId,
      roleName: "MAHASISWA_KKN",
      featureCategory: "Presensi KKN",
      endpoint: "/api/v1/kkn/out-of-zone-violation",
      ipAddress,
      newValue: {
        tipe: "PELANGGARAN_ZONA",
        studentId,
        namaMahasiswa: studentName || "Mahasiswa KKN",
        nim: nim || "-",
        kelompok: kelompokName,
        scheduleId,
        namaKegiatan: scheduleTitle,
        outOfZoneMinutes,
        pointsDeducted: -Math.abs(pointsDeducted),
        keterangan: `Terdeteksi pelanggaran keluar zona pada kegiatan "${scheduleTitle}" selama ${outOfZoneMinutes} menit. Pemotongan poin: -${Math.abs(pointsDeducted)} PTS.`,
      },
    });
  }

  /**
   * 8. Catat Pengisian Logbook Mahasiswa
   */
  async recordLogbookSubmit(params: {
    logbookId: string;
    studentId: string;
    studentName?: string;
    nim?: string;
    kelompokName?: string;
    judulKegiatan: string;
    tipeAktivitas: string;
    pekanKe: number;
    tanggalKegiatan: string;
    fotoUrl?: string | null;
    ipAddress?: string;
  }) {
    const {
      logbookId,
      studentId,
      studentName,
      nim,
      kelompokName = "-",
      judulKegiatan,
      tipeAktivitas,
      pekanKe,
      tanggalKegiatan,
      fotoUrl,
      ipAddress,
    } = params;

    return this.recordAudit({
      action: "LOGBOOK_MAHASISWA_SUBMIT",
      userId: studentId,
      roleName: "MAHASISWA_KKN",
      featureCategory: "Program KKN",
      endpoint: "/api/v1/logbook/mahasiswa",
      ipAddress,
      newValue: {
        tipe: "LOGBOOK_SUBMIT",
        logbookId,
        studentId,
        namaMahasiswa: studentName || "Mahasiswa KKN",
        nim: nim || "-",
        kelompok: kelompokName,
        judulKegiatan,
        tipeAktivitas,
        pekanKe,
        tanggalKegiatan,
        fotoUrl: fotoUrl || null,
        keterangan: `Mahasiswa ${studentName ? `${studentName} (${nim || "-"})` : ""} mengisi Logbook Kegiatan: "${judulKegiatan}" (Pekan ke-${pekanKe}, Kategori: ${tipeAktivitas}).`,
      },
    });
  }
}

export const auditTrailService = new AuditTrailService();
