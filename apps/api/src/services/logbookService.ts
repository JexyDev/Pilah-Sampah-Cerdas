/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Service Logbook KKN (Mahasiswa & DPL)
 * Mendukung validasi toleransi tanggal dinamis (H-1), approval 2-tingkat (Ketua -> DPL),
 * serta kalkulasi otomatis kepatuhan logbook untuk prasyarat nilai akhir KKN.
 */

import { prisma } from "../lib/prisma.js";
import { StatusLogbookKkn, TipeAktivitasKkn } from "@prisma/client";
import { getKelompokWhere } from "./dplService.js";
import { configService } from "./configService.js";
import { auditTrailService } from "./auditTrailService.js";

// Target standar logbook per kelompok selama KKN (misal: 6 hari/pekan x 4 pekan = 24 aktivitas)
const DEFAULT_LOGBOOK_TARGET = 24;

export class LogbookService {
  /**
   * Mengambil batas toleransi backdate (dalam hari) dari konfigurasi sistem (default 1 hari)
   */
  async getBackdateToleranceDays(): Promise<number> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: "logbook_backdate_tolerance_days" },
      });
      if (config && !isNaN(Number(config.value))) {
        return Math.max(0, parseInt(config.value, 10));
      }
    } catch {
      // fallback
    }
    return 90; // Default 90 hari toleransi backdate
  }

  /**
   * Validasi apakah tanggal kegiatan berada dalam rentang toleransi (maksimal H-toleransi)
   */
  async validateBackdate(activityDate: Date, userRole: string): Promise<void> {
    const isPrivileged = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH"].includes(userRole.toUpperCase());
    if (isPrivileged) return; // Privileged roles tidak dibatasi

    const toleranceDays = await this.getBackdateToleranceDays();
    
    // Normalisasi waktu ke awal hari (00:00:00) zona lokal
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const actDate = new Date(activityDate);
    const activityMidnight = new Date(actDate.getFullYear(), actDate.getMonth(), actDate.getDate()).getTime();

    // Tidak boleh masa depan
    if (activityMidnight > todayMidnight) {
      throw new Error("Tanggal kegiatan logbook tidak boleh berupa tanggal di masa depan.");
    }

    const diffDays = Math.floor((todayMidnight - activityMidnight) / (1000 * 60 * 60 * 24));

    if (diffDays > toleranceDays) {
      const dateFormatted = actDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      throw new Error(
        `Batas toleransi pengisian logbook adalah ${toleranceDays} hari sebelumnya (H-${toleranceDays}). Tanggal kegiatan '${dateFormatted}' melebihi batas waktu input yang diizinkan.`
      );
    }
  }

  /**
   * Helper menghitung pekan ke- (1, 2, 3, 4) berdasarkan tanggal kegiatan atau tanggal mulai kelompok
   */
  calculatePekanKe(tanggalKegiatan: Date, startDateRef?: Date | null): number {
    if (!startDateRef) {
      // Default: hitung berdasarkan tanggal 1-7, 8-14, 15-21, 22-31 dalam bulan berjalan
      const day = tanggalKegiatan.getDate();
      if (day <= 7) return 1;
      if (day <= 14) return 2;
      if (day <= 21) return 3;
      return 4;
    }
    const diffTime = tanggalKegiatan.getTime() - new Date(startDateRef).getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const week = Math.floor(diffDays / 7) + 1;
    return Math.min(4, Math.max(1, week));
  }

  /**
   * Mengambil daftar logbook mahasiswa/kelompok (Tabular)
   */
  async getMahasiswaLogbooks(
    userId: string,
    userRole: string,
    filters: {
      groupId?: string;
      pekanKe?: number;
      statusApproval?: string;
      tipeAktivitas?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole.toUpperCase());
    const isMhs = userRole.toUpperCase() === "MAHASISWA_KKN";

    const where: any = {};

    if (isDpl) {
      const allowedGroups = await prisma.kelompokKkn.findMany({
        where: await getKelompokWhere(userId, userRole),
        select: { id: true },
      });
      const dplGroupIds = allowedGroups.map((g) => g.id);

      if (filters.groupId && filters.groupId !== "ALL") {
        where.kelompokId = filters.groupId;
      } else if (dplGroupIds.length > 0) {
        where.kelompokId = { in: dplGroupIds };
      }
    } else if (isMhs) {
      const studentProfile = await prisma.studentKkn.findUnique({
        where: { userId },
      });
      if (studentProfile?.kelompokId) {
        where.kelompokId = studentProfile.kelompokId;
      } else {
        where.penulisId = userId;
      }
    } else if (filters.groupId && filters.groupId !== "ALL") {
      where.kelompokId = filters.groupId;
    }

    if (filters.pekanKe) {
      where.pekanKe = Number(filters.pekanKe);
    }

    if (filters.statusApproval && filters.statusApproval !== "ALL") {
      where.statusApproval = filters.statusApproval as StatusLogbookKkn;
    }

    if (filters.tipeAktivitas && filters.tipeAktivitas !== "ALL") {
      where.tipeAktivitas = filters.tipeAktivitas as TipeAktivitasKkn;
    }

    if (filters.startDate || filters.endDate) {
      where.tanggalKegiatan = {};
      if (filters.startDate) where.tanggalKegiatan.gte = new Date(filters.startDate);
      if (filters.endDate) where.tanggalKegiatan.lte = new Date(filters.endDate);
    }

    if (filters.search && filters.search.trim() !== "") {
      const q = filters.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { deskripsi: { contains: q, mode: "insensitive" } },
            { tempat: { contains: q, mode: "insensitive" } },
            { penulis: { name: { contains: q, mode: "insensitive" } } },
            { kelompok: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const logbooks = await prisma.logbookKkn.findMany({
      where,
      include: {
        penulis: {
          select: {
            id: true,
            name: true,
            phone: true,
            studentProfile: {
              select: {
                nim: true,
                jurusan: true,
                fakultas: true,
                isKetua: true,
              },
            },
          },
        },
        kelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            dpl: { select: { id: true, name: true, phone: true } },
            students: {
              select: {
                id: true,
                userId: true,
                nim: true,
                isKetua: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        programKerja: {
          select: {
            id: true,
            deskripsi: true,
            kategori: true,
            status: true,
          },
        },
        fasilitas: {
          select: {
            id: true,
            nama: true,
            jenis: true,
            alamat: true,
          },
        },
        disetujuiKetuaOleh: { select: { id: true, name: true } },
        diverifikasiDplOleh: { select: { id: true, name: true } },
      },
      orderBy: [
        { tanggalKegiatan: "desc" },
        { createdAt: "desc" },
      ],
    });

    return logbooks.map((item, index) => ({
      nomor: index + 1,
      id: item.id,
      kelompokId: item.kelompokId,
      kelompokNama: item.kelompok?.name || "Kelompok KKN",
      kelurahan: item.kelompok?.kelurahan || "-",
      penulisId: item.penulisId,
      penulisNama: item.penulis?.name || "Mahasiswa",
      penulisNim: item.penulis?.studentProfile?.nim || "-",
      isKetua: Boolean(item.penulis?.studentProfile?.isKetua),
      tanggalKegiatan: item.tanggalKegiatan ? item.tanggalKegiatan.toISOString().split("T")[0] : "-",
      waktuMulai: item.waktuMulai || "-",
      waktuSelesai: item.waktuSelesai || "-",
      waktuLengkap: item.waktuMulai ? `${item.waktuMulai}${item.waktuSelesai ? ` - ${item.waktuSelesai}` : ""}` : "-",
      tempat: item.tempat,
      deskripsi: item.deskripsi,
      fotoBuktiUrl: item.fotoBuktiUrl,
      tipeAktivitas: item.tipeAktivitas,
      pekanKe: item.pekanKe,
      statusApproval: item.statusApproval,
      programKerjaId: item.programKerjaId,
      programKerjaDeskripsi: item.programKerja?.deskripsi || null,
      programKerjaKategori: item.programKerja?.kategori || null,
      fasilitasId: item.fasilitasId,
      fasilitasNama: item.fasilitas?.nama || null,
      anggotaKelompok: item.kelompok?.students?.filter((s) => s.user).map((s) => ({
        id: s.id,
        userId: s.userId || s.user?.id,
        nim: s.nim || "-",
        name: s.user?.name || "Mahasiswa",
        isKetua: Boolean(s.isKetua),
      })) || [],
      disetujuiKetuaOleh: item.disetujuiKetuaOleh?.name || null,
      disetujuiKetuaPada: item.disetujuiKetuaPada,
      catatanKetua: item.catatanKetua,
      diverifikasiDplOleh: item.diverifikasiDplOleh?.name || null,
      diverifikasiDplPada: item.diverifikasiDplPada,
      catatanDpl: item.catatanDpl,
      createdAt: item.createdAt,
    }));
  }

  /**
   * Membuat logbook aktivitas baru oleh Mahasiswa / Perwakilan Kelompok / Developer
   */
  async createMahasiswaLogbook(
    userId: string,
    userRole: string,
    payload: {
      tanggalKegiatan: string;
      waktuMulai?: string;
      waktuSelesai?: string;
      tempat: string;
      deskripsi: string;
      fotoBuktiUrl?: string | null;
      attachmentUrls?: string[];
      platformOs?: string;
      tipeAktivitas?: TipeAktivitasKkn;
      programKerjaId?: string;
      fasilitasId?: string;
      pekanKe?: number;
      penulisId?: string;
      kelompokId?: string;
      statusApproval?: StatusLogbookKkn;
      catatanDpl?: string;
    }
  ) {
    if (!payload.tanggalKegiatan) throw new Error("Tanggal kegiatan wajib diisi");
    if (!payload.tempat || payload.tempat.trim() === "") throw new Error("Tempat kegiatan wajib diisi");
    if (!payload.deskripsi || payload.deskripsi.trim() === "") throw new Error("Deskripsi kegiatan wajib diisi");
    if (!payload.fotoBuktiUrl && (!payload.attachmentUrls || payload.attachmentUrls.length === 0)) {
      throw new Error("Foto / bukti dokumentasi kegiatan wajib dilampirkan (minimal 1 foto/dokumen).");
    }

    const activityDate = new Date(payload.tanggalKegiatan);
    if (isNaN(activityDate.getTime())) {
      throw new Error("Format tanggal kegiatan tidak valid");
    }

    const isDeveloper = userRole.toUpperCase() === "DEVELOPER" || userRole.toUpperCase() === "SUPER_USER";

    // 1. Validasi Batas Toleransi Input (Bypass jika Developer)
    await this.validateBackdate(activityDate, userRole);

    // 2. Ambil profil mahasiswa & kelompok
    const targetUserId = (isDeveloper && payload.penulisId) ? payload.penulisId : userId;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        studentProfile: {
          include: {
            kelompok: {
              include: {
                dpl: true,
                students: { include: { user: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new Error("Data mahasiswa tidak ditemukan.");
    const student = user.studentProfile;
    
    let targetKelompokId = payload.kelompokId || student?.kelompokId;
    let targetDplId = student?.kelompok?.dplId;
    let kelompokName = student?.kelompok?.name || "Kelompok KKN";

    if (payload.kelompokId && payload.kelompokId !== student?.kelompokId) {
      const specifiedKelompok = await prisma.kelompokKkn.findUnique({
        where: { id: payload.kelompokId },
        include: { dpl: true },
      });
      if (specifiedKelompok) {
        targetKelompokId = specifiedKelompok.id;
        targetDplId = specifiedKelompok.dplId;
        kelompokName = specifiedKelompok.name;
      }
    }

    if (!targetKelompokId) {
      throw new Error("Mahasiswa ini belum terdaftar dalam kelompok KKN. Silakan tentukan kelompok KKN.");
    }

    const pekanKe = payload.pekanKe && payload.pekanKe >= 1 && payload.pekanKe <= 4
      ? payload.pekanKe
      : this.calculatePekanKe(activityDate, student?.startDate);

    // 3. Status Approval
    // Jika developer menginput manual, default langsung DISETUJUI_DPL
    let statusApproval: StatusLogbookKkn = isDeveloper
      ? (payload.statusApproval || StatusLogbookKkn.DISETUJUI_DPL)
      : StatusLogbookKkn.MENUNGGU_VERIFIKASI_DPL;

    const isUserKetua = Boolean(student?.isKetua);
    const disetujuiKetuaOlehId: string | null = isUserKetua ? targetUserId : (isDeveloper ? userId : null);
    const disetujuiKetuaPada: Date | null = (isUserKetua || isDeveloper) ? new Date() : null;

    const diverifikasiDplOlehId: string | null = (statusApproval === StatusLogbookKkn.DISETUJUI_DPL)
      ? (targetDplId || (isDeveloper ? userId : null))
      : null;
    const diverifikasiDplPada: Date | null = (statusApproval === StatusLogbookKkn.DISETUJUI_DPL) ? new Date() : null;

    const logbook = await prisma.logbookKkn.create({
      data: {
        kelompokId: targetKelompokId,
        penulisId: targetUserId,
        tanggalKegiatan: activityDate,
        waktuMulai: payload.waktuMulai || null,
        waktuSelesai: payload.waktuSelesai || null,
        tempat: payload.tempat.trim(),
        deskripsi: payload.deskripsi.trim(),
        fotoBuktiUrl: payload.fotoBuktiUrl || null,
        attachmentUrls: payload.attachmentUrls || (payload.fotoBuktiUrl ? [payload.fotoBuktiUrl] : null),
        platformOs: payload.platformOs || (isDeveloper ? "DEVELOPER_OVERRIDE" : "ANDROID"),
        tipeAktivitas: payload.tipeAktivitas || TipeAktivitasKkn.KELOMPOK,
        programKerjaId: payload.programKerjaId || null,
        fasilitasId: payload.fasilitasId || null,
        pekanKe,
        statusApproval,
        disetujuiKetuaOlehId,
        disetujuiKetuaPada,
        diverifikasiDplOlehId,
        diverifikasiDplPada,
        catatanDpl: payload.catatanDpl || (isDeveloper ? "Diinput manual & disetujui langsung oleh Developer" : null),
      },
      include: {
        penulis: { select: { name: true } },
        kelompok: { select: { name: true } },
      },
    });

    // Berikan poin gamifikasi jika langsung disetujui DPL
    if (statusApproval === StatusLogbookKkn.DISETUJUI_DPL) {
      await prisma.pointHistory.create({
        data: {
          userId: targetUserId,
          points: 15,
          description: `Logbook Terverifikasi: Pekan ${pekanKe}`,
          kategori: "LOGBOOK_TERVERIFIKASI",
        },
      }).catch(() => {});
    }

    // 4. Notifikasi
    if (!isDeveloper && targetDplId) {
      await prisma.notification.create({
        data: {
          userId: targetDplId,
          title: "Logbook Aktivitas Baru — Perlu Verifikasi",
          message: `${user.name} (${kelompokName}) mengajukan logbook aktivitas untuk pekan ke-${pekanKe}: "${payload.deskripsi.slice(0, 60)}...". Silakan tinjau dan verifikasi.`,
          isRead: false,
        },
      }).catch(() => {});
    } else if (isDeveloper) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: "Logbook Aktivitas Telah Diinput oleh Tim Developer",
          message: `Logbook aktivitas Anda tanggal ${activityDate.toISOString().split("T")[0]} telah berhasil diinput dan disetujui oleh Developer.`,
          isRead: false,
        },
      }).catch(() => {});
    }

    // Record into system history / audit trail
    auditTrailService.recordLogbookSubmit({
      logbookId: logbook.id,
      studentId: targetUserId,
      studentName: user.name,
      nim: student?.nim,
      kelompokName,
      judulKegiatan: payload.deskripsi.slice(0, 80),
      tipeAktivitas: logbook.tipeAktivitas,
      pekanKe,
      tanggalKegiatan: activityDate.toISOString(),
      fotoUrl: logbook.fotoBuktiUrl,
    }).catch((err) => console.warn("[Audit] Logbook submit log error:", err));

    return logbook;
  }

  /**
   * Mengupdate / Mengoreksi logbook aktivitas mahasiswa (Khusus Developer / DPL / Penulis)
   */
  async updateMahasiswaLogbook(
    logbookId: string,
    userId: string,
    userRole: string,
    payload: {
      tanggalKegiatan?: string;
      waktuMulai?: string;
      waktuSelesai?: string;
      tempat?: string;
      deskripsi?: string;
      fotoBuktiUrl?: string | null;
      attachmentUrls?: string[];
      tipeAktivitas?: TipeAktivitasKkn;
      programKerjaId?: string | null;
      fasilitasId?: string | null;
      pekanKe?: number;
      statusApproval?: StatusLogbookKkn;
      penulisId?: string;
      kelompokId?: string;
      catatanKetua?: string | null;
      catatanDpl?: string | null;
    }
  ) {
    const existing = await prisma.logbookKkn.findUnique({
      where: { id: logbookId },
      include: { kelompok: true, penulis: true },
    });

    if (!existing) throw new Error("Logbook tidak ditemukan");

    const isDeveloper = userRole.toUpperCase() === "DEVELOPER" || userRole.toUpperCase() === "SUPER_USER";
    const isAssignedDpl = existing.kelompok.dplId === userId;
    const isAuthor = existing.penulisId === userId;

    if (!isDeveloper && !isAssignedDpl && !isAuthor) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengedit logbook ini.");
    }

    const updateData: any = {};
    if (payload.tanggalKegiatan) {
      const actDate = new Date(payload.tanggalKegiatan);
      if (!isNaN(actDate.getTime())) {
        updateData.tanggalKegiatan = actDate;
      }
    }
    if (payload.waktuMulai !== undefined) updateData.waktuMulai = payload.waktuMulai || null;
    if (payload.waktuSelesai !== undefined) updateData.waktuSelesai = payload.waktuSelesai || null;
    if (payload.tempat !== undefined) updateData.tempat = payload.tempat.trim();
    if (payload.deskripsi !== undefined) updateData.deskripsi = payload.deskripsi.trim();
    if (payload.fotoBuktiUrl !== undefined && payload.fotoBuktiUrl !== null && payload.fotoBuktiUrl !== "") {
      updateData.fotoBuktiUrl = payload.fotoBuktiUrl;
    }
    if (payload.attachmentUrls !== undefined && payload.attachmentUrls.length > 0) {
      updateData.attachmentUrls = payload.attachmentUrls;
    }
    if (payload.tipeAktivitas) updateData.tipeAktivitas = payload.tipeAktivitas;
    if (payload.pekanKe !== undefined) updateData.pekanKe = Number(payload.pekanKe);
    if (payload.statusApproval) {
      updateData.statusApproval = payload.statusApproval;
      if (payload.statusApproval === StatusLogbookKkn.DISETUJUI_DPL) {
        updateData.diverifikasiDplPada = new Date();
        if (!existing.diverifikasiDplOlehId) {
          updateData.diverifikasiDplOlehId = existing.kelompok.dplId || (isDeveloper ? userId : null);
        }
      }
    }
    if (payload.programKerjaId !== undefined) updateData.programKerjaId = payload.programKerjaId || null;
    if (payload.fasilitasId !== undefined) updateData.fasilitasId = payload.fasilitasId || null;
    if (payload.catatanKetua !== undefined) updateData.catatanKetua = payload.catatanKetua;
    if (payload.catatanDpl !== undefined) updateData.catatanDpl = payload.catatanDpl;
    
    // Khusus DEVELOPER: bisa memindahkan penulis atau kelompok jika salah input
    if (isDeveloper) {
      if (payload.penulisId) updateData.penulisId = payload.penulisId;
      if (payload.kelompokId) updateData.kelompokId = payload.kelompokId;
    }

    const updated = await prisma.logbookKkn.update({
      where: { id: logbookId },
      data: updateData,
      include: {
        penulis: { select: { name: true } },
        kelompok: { select: { name: true } },
      },
    });

    return updated;
  }

  /**
   * Persetujuan / Penolakan Logbook oleh Ketua Kelompok
   */
  async approveByKetua(
    logbookId: string,
    ketuaUserId: string,
    action: "APPROVE" | "REJECT",
    catatanKetua?: string
  ) {
    const logbook = await prisma.logbookKkn.findUnique({
      where: { id: logbookId },
      include: {
        kelompok: {
          include: {
            dpl: true,
            students: true,
          },
        },
        penulis: true,
      },
    });

    if (!logbook) throw new Error("Logbook tidak ditemukan");

    // Pastikan user adalah ketua di kelompok tersebut atau SUPER_USER
    const callerStudent = await prisma.studentKkn.findUnique({ where: { userId: ketuaUserId } });
    const isKetua = callerStudent?.isKetua && callerStudent.kelompokId === logbook.kelompokId;
    const isSuper = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH"].includes(
      String((await prisma.user.findUnique({ where: { id: ketuaUserId }, include: { role: true } }))?.role?.name || "").toUpperCase()
    );

    if (!isKetua && !isSuper) {
      throw new Error("Hanya Ketua Kelompok yang berhak menyetujui logbook anggota.");
    }

    const newStatus: StatusLogbookKkn =
      action === "APPROVE" ? StatusLogbookKkn.MENUNGGU_VERIFIKASI_DPL : StatusLogbookKkn.DITOLAK_KETUA;

    const updated = await prisma.logbookKkn.update({
      where: { id: logbookId },
      data: {
        statusApproval: newStatus,
        disetujuiKetuaOlehId: ketuaUserId,
        disetujuiKetuaPada: new Date(),
        catatanKetua: catatanKetua || undefined,
      },
    });

    // Notifikasi ke Penulis
    await prisma.notification.create({
      data: {
        userId: logbook.penulisId,
        title: action === "APPROVE" ? "Logbook Disetujui Ketua" : "Logbook Ditolak Ketua",
        message:
          action === "APPROVE"
            ? `Logbook aktivitas Anda telah disetujui Ketua Kelompok dan kini menunggu verifikasi DPL.`
            : `Logbook aktivitas Anda ditolak oleh Ketua Kelompok: ${catatanKetua || "Perbaiki isi/bukti kegiatan."}`,
        isRead: false,
      },
    }).catch(() => {});

    // Jika disetujui, teruskan notifikasi ke DPL
    if (action === "APPROVE" && logbook.kelompok.dplId) {
      await prisma.notification.create({
        data: {
          userId: logbook.kelompok.dplId,
          title: "Logbook Siap Diverifikasi",
          message: `Logbook aktivitas dari kelompok ${logbook.kelompok.name} telah disetujui Ketua dan siap untuk diverifikasi DPL.`,
          isRead: false,
        },
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Verifikasi & Feedback Logbook oleh DPL (Single)
   */
  async verifikasiByDpl(
    logbookId: string,
    dplUserId: string,
    userRole: string,
    action: "APPROVE" | "REVISI",
    catatanDpl?: string
  ) {
    const logbook = await prisma.logbookKkn.findUnique({
      where: { id: logbookId },
      include: {
        kelompok: true,
        penulis: true,
      },
    });

    if (!logbook) throw new Error("Logbook tidak ditemukan");

    const isSuper = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH"].includes(userRole.toUpperCase());
    const isAssignedDpl = logbook.kelompok.dplId === dplUserId;

    if (!isAssignedDpl && !isSuper) {
      throw new Error("Akses ditolak: Anda hanya berwenang memverifikasi logbook kelompok dampingan Anda.");
    }

    const newStatus: StatusLogbookKkn =
      action === "APPROVE" ? StatusLogbookKkn.DISETUJUI_DPL : StatusLogbookKkn.PERLU_REVISI_DPL;

    const updated = await prisma.logbookKkn.update({
      where: { id: logbookId },
      data: {
        statusApproval: newStatus,
        diverifikasiDplOlehId: dplUserId,
        diverifikasiDplPada: new Date(),
        catatanDpl: catatanDpl || undefined,
      },
    });

    // Berikan poin gamifikasi ke penulis jika disetujui DPL
    if (action === "APPROVE") {
      await prisma.pointHistory.create({
        data: {
          userId: logbook.penulisId,
          points: 15,
          description: `Logbook Terverifikasi DPL: Pekan ${logbook.pekanKe}`,
          kategori: "LOGBOOK_TERVERIFIKASI",
        },
      }).catch(() => {});
    }

    // Notifikasi ke Penulis
    await prisma.notification.create({
      data: {
        userId: logbook.penulisId,
        title: action === "APPROVE" ? "Logbook Disetujui DPL! 🎉" : "Logbook Perlu Revisi DPL",
        message:
          action === "APPROVE"
            ? `Logbook aktivitas Anda telah diverifikasi dan disetujui resmi oleh DPL.`
            : `Logbook aktivitas Anda memerlukan revisi dari DPL: ${catatanDpl || "Silakan cek catatan evaluasi DPL."}`,
        isRead: false,
      },
    }).catch(() => {});

    return updated;
  }

  /**
   * Batch Verifikasi Logbook oleh DPL (Banyak logbook sekaligus)
   */
  async batchVerifikasiByDpl(
    logbookIds: string[],
    dplUserId: string,
    userRole: string,
    action: "APPROVE" | "REVISI",
    catatanDpl?: string
  ) {
    if (!Array.isArray(logbookIds) || logbookIds.length === 0) {
      throw new Error("Daftar ID logbook tidak boleh kosong");
    }

    const results = [];
    for (const id of logbookIds) {
      try {
        const res = await this.verifikasiByDpl(id, dplUserId, userRole, action, catatanDpl);
        results.push({ id, success: true, data: res });
      } catch (err: any) {
        results.push({ id, success: false, message: err.message });
      }
    }

    return results;
  }

  /**
   * Mengambil Riwayat Logbook Monitoring Mingguan DPL
   */
  async getDplLogbooks(dplUserId: string, userRole: string, groupId?: string) {
    const isSuper = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "DLH", "PEMIMPIN", "PANITIA_TASKFORCE"].includes(userRole.toUpperCase());
    const where: any = {};

    if (!isSuper) {
      const allowedGroups = await prisma.kelompokKkn.findMany({
        where: await getKelompokWhere(dplUserId, userRole),
        select: { id: true },
      });
      const allowedGroupIds = allowedGroups.map((g) => g.id);

      where.OR = [
        { dplId: dplUserId },
        { kelompokId: { in: allowedGroupIds } },
        { kelompok: { dplId: dplUserId } },
      ];
    }

    if (groupId && groupId !== "ALL") {
      where.kelompokId = groupId;
    }

    const list = await prisma.logbookDpl.findMany({
      where,
      include: {
        kelompok: { select: { id: true, name: true, kelurahan: true } },
        dpl: { select: { id: true, name: true, nip: true } },
      },
      orderBy: [
        { pekanKe: "asc" },
        { tanggal: "desc" },
      ],
    });

    return list.map((item) => ({
      id: item.id,
      dplId: item.dplId,
      dplNama: item.dpl.name,
      kelompokId: item.kelompokId,
      kelompokNama: item.kelompok.name,
      kelurahan: item.kelompok.kelurahan || "-",
      pekanKe: item.pekanKe || 1,
      tanggal: item.tanggal.toISOString().split("T")[0],
      tempat: item.tempat,
      deskripsi: item.deskripsi,
      arahanEvaluasi: item.arahanEvaluasi || "-",
      fotoBuktiUrl: item.fotoBuktiUrl,
      createdAt: item.createdAt,
    }));
  }

  /**
   * Membuat Catatan Logbook Monitoring Mingguan DPL (Minimal 1x per pekan)
   */
  async createDplLogbook(
    dplUserId: string,
    userRole: string,
    payload: {
      kelompokId: string;
      tanggal: string;
      pekanKe: number;
      tempat: string;
      deskripsi: string;
      arahanEvaluasi?: string;
      fotoBuktiUrl?: string;
    }
  ) {
    if (!payload.kelompokId) throw new Error("Pilih kelompok KKN yang dimonitoring");
    if (!payload.tanggal) throw new Error("Tanggal monitoring wajib diisi");
    if (!payload.pekanKe || payload.pekanKe < 1 || payload.pekanKe > 4) {
      throw new Error("Pekan ke- wajib antara 1 s.d 4");
    }
    if (!payload.tempat || payload.tempat.trim() === "") throw new Error("Tempat monitoring wajib diisi");
    if (!payload.deskripsi || payload.deskripsi.trim() === "") throw new Error("Deskripsi kegiatan monitoring wajib diisi");

    const isSuper = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "DLH", "PEMIMPIN", "PANITIA_TASKFORCE"].includes(userRole.toUpperCase());
    const kelompok = await prisma.kelompokKkn.findUnique({
      where: { id: payload.kelompokId },
      include: { students: true },
    });

    if (!kelompok) throw new Error("Kelompok KKN tidak ditemukan");
    if (!isSuper) {
      const allowedGroups = await prisma.kelompokKkn.findMany({
        where: await getKelompokWhere(dplUserId, userRole),
        select: { id: true },
      });
      const allowedGroupIds = allowedGroups.map((g) => g.id);
      if (kelompok.dplId && kelompok.dplId !== dplUserId && !allowedGroupIds.includes(kelompok.id)) {
        throw new Error("Akses ditolak: Anda hanya dapat mengisi logbook untuk kelompok dampingan Anda.");
      }
    }

    // Auto-link kelompok if unlinked
    if (!kelompok.dplId) {
      await prisma.kelompokKkn.update({
        where: { id: kelompok.id },
        data: { dplId: dplUserId },
      });
    }

    const logbookDate = new Date(payload.tanggal);
    if (isNaN(logbookDate.getTime())) throw new Error("Format tanggal tidak valid");

    const created = await prisma.logbookDpl.create({
      data: {
        dplId: dplUserId,
        kelompokId: payload.kelompokId,
        tanggal: logbookDate,
        pekanKe: Number(payload.pekanKe || 1),
        tempat: payload.tempat.trim(),
        deskripsi: payload.deskripsi.trim(),
        arahanEvaluasi: payload.arahanEvaluasi?.trim() || null,
        fotoBuktiUrl: payload.fotoBuktiUrl || null,
      },
      include: {
        kelompok: { select: { name: true } },
      },
    });

    // Notifikasi ke seluruh anggota kelompok
    for (const st of kelompok.students) {
      await prisma.notification.create({
        data: {
          userId: st.userId,
          title: `Arahan Monitoring DPL - Pekan ${payload.pekanKe}`,
          message: `DPL telah mencatat hasil monitoring lapangan pekan ${payload.pekanKe}: "${payload.deskripsi.slice(0, 60)}..."`,
          isRead: false,
        },
      }).catch(() => {});
    }

    return created;
  }

  /**
   * Menghitung Statistik & Skor Kepatuhan Logbook Mahasiswa/Kelompok
   * Formula: (Total Disetujui / Target 24) x 100
   * Terintegrasi dengan modul Penilaian Akademik DPL (Bobot 20% DPL / 30% Nilai Akhir)
   */
  async getLogbookComplianceScore(kelompokId: string, targetCount?: number) {
    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const effectiveTarget = targetCount && targetCount > 0
      ? targetCount
      : (ruleConfigs?.logbookTargetKegiatan || DEFAULT_LOGBOOK_TARGET);
    const effectiveBobot = ruleConfigs?.logbookBobotPersen || 20;

    // Mode Agregat Seluruh Kelompok jika "ALL"
    if (!kelompokId || kelompokId === "ALL" || kelompokId.trim() === "") {
      const allGroups = await prisma.kelompokKkn.findMany({
        select: {
          id: true,
          name: true,
          kelurahan: true,
          dpl: { select: { name: true } },
          _count: { select: { students: true } },
        },
        orderBy: { name: "asc" },
      });

      const totalSubmitted = await prisma.logbookKkn.count();
      const approvedCount = await prisma.logbookKkn.count({
        where: { statusApproval: StatusLogbookKkn.DISETUJUI_DPL },
      });
      const pendingDplCount = await prisma.logbookKkn.count({
        where: { statusApproval: StatusLogbookKkn.MENUNGGU_VERIFIKASI_DPL },
      });
      const pendingKetuaCount = await prisma.logbookKkn.count({
        where: { statusApproval: StatusLogbookKkn.MENUNGGU_PERSETUJUAN_KETUA },
      });
      const revisiCount = await prisma.logbookKkn.count({
        where: {
          statusApproval: { in: [StatusLogbookKkn.PERLU_REVISI_DPL, StatusLogbookKkn.DITOLAK_KETUA] },
        },
      });

      // Hitung kepatuhan per kelompok
      const groupsSummary = await Promise.all(
        allGroups.map(async (g) => {
          const gApproved = await prisma.logbookKkn.count({
            where: {
              kelompokId: g.id,
              statusApproval: StatusLogbookKkn.DISETUJUI_DPL,
            },
          });
          const gTotal = await prisma.logbookKkn.count({
            where: { kelompokId: g.id },
          });
          const gRate = Math.min(100, Math.round((gApproved / effectiveTarget) * 100));
          return {
            id: g.id,
            name: g.name,
            kelurahan: g.kelurahan || "-",
            dplNama: g.dpl?.name || "-",
            studentCount: g._count.students,
            totalSubmitted: gTotal,
            approvedCount: gApproved,
            targetCount: effectiveTarget,
            complianceRate: gRate,
            isTargetMet: gApproved >= effectiveTarget,
          };
        })
      );

      const calculatedScore = effectiveTarget > 0 ? Math.min(100, Math.round((approvedCount / (effectiveTarget * Math.max(1, allGroups.length))) * 100)) : 0;

      return {
        isAggregate: true,
        kelompok: null,
        targetCount: effectiveTarget,
        totalSubmitted,
        approvedCount,
        pendingKetuaCount,
        pendingDplCount,
        revisiCount,
        complianceRate: calculatedScore,
        calculatedScore,
        isTargetMet: calculatedScore >= 100,
        shortageCount: Math.max(0, effectiveTarget - approvedCount),
        pekanBreakdown: {
          1: { total: 0, approved: 0, pending: 0, target: Math.ceil(effectiveTarget / 4), completionRate: 0, isMet: false },
          2: { total: 0, approved: 0, pending: 0, target: Math.ceil(effectiveTarget / 4), completionRate: 0, isMet: false },
          3: { total: 0, approved: 0, pending: 0, target: Math.ceil(effectiveTarget / 4), completionRate: 0, isMet: false },
          4: { total: 0, approved: 0, pending: 0, target: Math.ceil(effectiveTarget / 4), completionRate: 0, isMet: false },
        },
        studentsList: [],
        recentApprovedActivities: [],
        groupsSummary,
        gradingIntegration: {
          targetAktivitas: effectiveTarget,
          aktivitasTerverifikasi: approvedCount,
          skorDasarLogbook: calculatedScore,
          bobotDplPersen: effectiveBobot,
          kontribusiPoinDpl: Number(((calculatedScore * effectiveBobot) / 100).toFixed(1)),
          kontribusiNilaiAkhirKkn: Number((((calculatedScore * effectiveBobot) / 100) * 0.3).toFixed(2)),
          statusSyaratNilai: calculatedScore >= 100 ? "MEMENUHI_SYARAT" : "BELUM_MEMENUHI",
          statusLabel: calculatedScore >= 100 ? "Prasyarat Terpenuhi (Lolos)" : "Belum Mencapai Target Standar",
        },
      };
    }

    // Detail Kelompok Spesifik
    const kelompok = await prisma.kelompokKkn.findUnique({
      where: { id: kelompokId },
      include: {
        dpl: { select: { id: true, name: true, phone: true, nip: true } },
        students: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
          orderBy: [{ isKetua: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    const totalSubmitted = await prisma.logbookKkn.count({ where: { kelompokId } });
    const approvedCount = await prisma.logbookKkn.count({
      where: {
        kelompokId,
        statusApproval: StatusLogbookKkn.DISETUJUI_DPL,
      },
    });

    const pendingKetuaCount = await prisma.logbookKkn.count({
      where: {
        kelompokId,
        statusApproval: StatusLogbookKkn.MENUNGGU_PERSETUJUAN_KETUA,
      },
    });

    const pendingDplCount = await prisma.logbookKkn.count({
      where: {
        kelompokId,
        statusApproval: StatusLogbookKkn.MENUNGGU_VERIFIKASI_DPL,
      },
    });

    const revisiCount = await prisma.logbookKkn.count({
      where: {
        kelompokId,
        statusApproval: { in: [StatusLogbookKkn.PERLU_REVISI_DPL, StatusLogbookKkn.DITOLAK_KETUA] },
      },
    });

    // Breakdown per pekan (Pekan 1, 2, 3, 4)
    const weeklyLogs = await prisma.logbookKkn.groupBy({
      by: ["pekanKe", "statusApproval"],
      where: { kelompokId },
      _count: { id: true },
    });

    const targetPerWeek = Math.max(1, Math.ceil(effectiveTarget / 4)); // e.g. 6 aktivitas/pekan untuk target 24
    const pekanBreakdown: Record<number, {
      total: number;
      approved: number;
      pending: number;
      target: number;
      completionRate: number;
      isMet: boolean;
    }> = {
      1: { total: 0, approved: 0, pending: 0, target: targetPerWeek, completionRate: 0, isMet: false },
      2: { total: 0, approved: 0, pending: 0, target: targetPerWeek, completionRate: 0, isMet: false },
      3: { total: 0, approved: 0, pending: 0, target: targetPerWeek, completionRate: 0, isMet: false },
      4: { total: 0, approved: 0, pending: 0, target: targetPerWeek, completionRate: 0, isMet: false },
    };

    weeklyLogs.forEach((item) => {
      const p = Math.min(4, Math.max(1, item.pekanKe || 1));
      if (pekanBreakdown[p]) {
        pekanBreakdown[p].total += item._count.id;
        if (item.statusApproval === StatusLogbookKkn.DISETUJUI_DPL) {
          pekanBreakdown[p].approved += item._count.id;
        } else if (
          item.statusApproval === StatusLogbookKkn.MENUNGGU_VERIFIKASI_DPL ||
          item.statusApproval === StatusLogbookKkn.MENUNGGU_PERSETUJUAN_KETUA
        ) {
          pekanBreakdown[p].pending += item._count.id;
        }
      }
    });

    for (let p = 1; p <= 4; p++) {
      const pb = pekanBreakdown[p];
      pb.completionRate = Math.min(100, Math.round((pb.approved / pb.target) * 100));
      pb.isMet = pb.approved >= pb.target;
    }

    // Breakdown kontribusi individu per mahasiswa
    const studentsList = await Promise.all(
      (kelompok?.students || []).map(async (st) => {
        const userId = st.userId;
        const submitted = await prisma.logbookKkn.count({
          where: { kelompokId, penulisId: userId },
        });
        const approved = await prisma.logbookKkn.count({
          where: { kelompokId, penulisId: userId, statusApproval: StatusLogbookKkn.DISETUJUI_DPL },
        });

        const contrPct = approvedCount > 0 ? Math.round((approved / approvedCount) * 100) : 0;

        return {
          id: st.id,
          userId,
          name: st.user?.name || "Mahasiswa",
          nim: st.nim || "-",
          jurusan: st.jurusan || "-",
          fakultas: st.fakultas || "-",
          isKetua: Boolean(st.isKetua),
          submittedCount: submitted,
          approvedCount: approved,
          contributionPct: contrPct,
        };
      })
    );

    // Daftar aktivitas terverifikasi terakhir (Audit Trail)
    const recentApprovedRaw = await prisma.logbookKkn.findMany({
      where: { kelompokId, statusApproval: StatusLogbookKkn.DISETUJUI_DPL },
      include: {
        penulis: { select: { name: true, studentProfile: { select: { nim: true } } } },
        programKerja: { select: { deskripsi: true, kategori: true } },
      },
      orderBy: { tanggalKegiatan: "desc" },
      take: 8,
    });

    const recentApprovedActivities = recentApprovedRaw.map((log) => ({
      id: log.id,
      tanggalKegiatan: log.tanggalKegiatan ? log.tanggalKegiatan.toISOString().split("T")[0] : "-",
      penulisNama: log.penulis?.name || "Mahasiswa",
      penulisNim: log.penulis?.studentProfile?.nim || "-",
      tempat: log.tempat,
      deskripsi: log.deskripsi,
      pekanKe: log.pekanKe,
      kategori: log.programKerja?.kategori || "Aktivitas KKN",
      diverifikasiDplPada: log.diverifikasiDplPada ? log.diverifikasiDplPada.toISOString() : null,
      catatanDpl: log.catatanDpl || null,
    }));

    const calculatedScore = Math.min(100, Math.round((approvedCount / effectiveTarget) * 100));
    const isTargetMet = approvedCount >= effectiveTarget;
    const shortageCount = Math.max(0, effectiveTarget - approvedCount);

    const kontribusiPoinDpl = Number(((calculatedScore * effectiveBobot) / 100).toFixed(1)); // misal 0 - 20.0 poin
    const kontribusiNilaiAkhirKkn = Number((kontribusiPoinDpl * 0.3).toFixed(2)); // misal 0 - 6.00 poin

    const ketuaStudent = kelompok?.students.find((s) => s.isKetua);

    return {
      isAggregate: false,
      kelompok: kelompok
        ? {
            id: kelompok.id,
            name: kelompok.name,
            kelurahan: kelompok.kelurahan || "-",
            dplNama: kelompok.dpl?.name || "-",
            dplNip: kelompok.dpl?.nip || "-",
            dplPhone: kelompok.dpl?.phone || "-",
            ketuaNama: ketuaStudent?.user?.name || "-",
            ketuaNim: ketuaStudent?.nim || "-",
            studentCount: kelompok.students.length,
          }
        : null,
      targetCount: effectiveTarget,
      totalSubmitted,
      approvedCount,
      pendingKetuaCount,
      pendingDplCount,
      revisiCount,
      complianceRate: calculatedScore,
      calculatedScore,
      isTargetMet,
      shortageCount,
      pekanBreakdown,
      studentsList,
      recentApprovedActivities,
      gradingIntegration: {
        targetAktivitas: effectiveTarget,
        aktivitasTerverifikasi: approvedCount,
        skorDasarLogbook: calculatedScore,
        bobotDplPersen: effectiveBobot,
        kontribusiPoinDpl,
        kontribusiNilaiAkhirKkn,
        statusSyaratNilai: isTargetMet ? "MEMENUHI_SYARAT" : "BELUM_MEMENUHI",
        statusLabel: isTargetMet
          ? "Prasyarat Terpenuhi (Lolos Syarat Nilai Akhir)"
          : `Belum Mencapai Target (Kurang ${shortageCount} Aktivitas)`,
        rekomendasi: isTargetMet
          ? `Target ${effectiveTarget} logbook telah terpenuhi. Nilai kepatuhan 100% siap ditransfer ke form Penilaian KKN DPL.`
          : `Kelompok masih membutuhkan ${shortageCount} aktivitas yang diverifikasi DPL agar prasyarat kelulusan akademik terpenuhi.`,
      },
    };
  }

  /**
   * Menghapus logbook aktivitas mahasiswa (DPL, Super User, Penulis)
   */
  async deleteMahasiswaLogbook(
    logbookId: string,
    userId: string,
    userRole: string
  ) {
    const logbook = await prisma.logbookKkn.findUnique({
      where: { id: logbookId },
      include: {
        kelompok: true,
      },
    });

    if (!logbook) throw new Error("Logbook tidak ditemukan");

    const isSuper = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH"].includes(userRole.toUpperCase());
    const isAssignedDpl = logbook.kelompok.dplId === userId;
    const isAuthor = logbook.penulisId === userId;

    if (!isSuper && !isAssignedDpl && !isAuthor) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk menghapus logbook ini.");
    }

    await prisma.logbookKkn.delete({
      where: { id: logbookId },
    });

    return { success: true, message: "Logbook aktivitas berhasil dihapus" };
  }
}

export const logbookService = new LogbookService();
