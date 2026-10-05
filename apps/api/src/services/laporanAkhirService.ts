/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { prisma } from "../lib/prisma.js";
import { parseProkerDeskripsi } from "./dplService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

export class LaporanAkhirService {
  /**
   * Mengunggah / Memperbarui Laporan Akhir Individu oleh Mahasiswa
   */
  async submitLaporanAkhirIndividu(userId: string, payload: any, file?: any) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        kelompok: {
          include: { dpl: true },
        },
        user: true,
      },
    });

    if (!student || !student.kelompokId) {
      throw new Error("Mahasiswa belum terdaftar dalam kelompok KKN.");
    }

    const fileUrl = file ? `/uploads/${file.filename}` : payload.fileUrl;
    if (!fileUrl) {
      throw new Error("Berkas PDF Laporan Akhir wajib diunggah.");
    }

    const judulStr = (payload.judul || `Laporan Akhir KKN - ${student.user?.name || student.nim}`).trim();
    const deskripsiStr = (payload.deskripsi || "").trim();
    const formattedDeskripsi = `**${judulStr}**\n\n${deskripsiStr}`;

    // Cek apakah mahasiswa ini sudah pernah submit sebelumnya (Isolasi per studentId)
    const existing = await prisma.programKerjaKkn.findFirst({
      where: {
        studentId: student.id,
        kategori: "LAPORAN_AKHIR",
      },
    });

    let result;
    if (existing) {
      result = await prisma.programKerjaKkn.update({
        where: { id: existing.id },
        data: {
          deskripsi: formattedDeskripsi,
          attachmentFile: fileUrl,
          linkGoogleDrive: fileUrl,
          hasAttachment: true,
          statusUsulan: "MENUNGGU_TELAAH",
          status: "BELUM_DISETUJUI" as any,
          statusPenilaian: "BELUM_DINILAI",
          updatedAt: new Date(),
        },
      });
    } else {
      result = await prisma.programKerjaKkn.create({
        data: {
          kelompokId: student.kelompokId,
          studentId: student.id,
          kategori: "LAPORAN_AKHIR",
          deskripsi: formattedDeskripsi,
          attachmentFile: fileUrl,
          linkGoogleDrive: fileUrl,
          hasAttachment: true,
          statusUsulan: "MENUNGGU_TELAAH",
          status: "BELUM_DISETUJUI" as any,
          statusPenilaian: "BELUM_DINILAI",
          sumber: "MAHASISWA",
        },
      });
    }

    // Notifikasi Otomatis ke DPL Kelompok
    if (student.kelompok?.dplId) {
      try {
        await notificationIntegrationService.sendToUser({
          userId: student.kelompok.dplId,
          title: "Laporan Akhir Mahasiswa Masuk 📄",
          message: `${student.user?.name || "Mahasiswa"} (${student.kelompok.name}) telah mengunggah Laporan Akhir KKN. Silakan ditelaah.`,
          triggerType: "LAPORAN_AKHIR_SUBMITTED",
          dataPayload: {
            event: "REFRESH_LAPORAN_AKHIR_DPL",
            studentId: student.id,
            kelompokId: student.kelompokId,
            laporanId: result.id,
            click_action: "FLUTTER_NOTIFICATION_CLICK",
          },
        });
      } catch (notifErr: any) {
        console.warn("[LaporanAkhirService] Gagal mengirimkan notifikasi DPL:", notifErr?.message);
      }
    }

    return result;
  }

  /**
   * Mengambil Laporan Akhir Khusus Milik Mahasiswa yang Sedang Login (Per-Individu)
   */
  async getLaporanAkhirMe(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        kelompok: { include: { dpl: true } },
        user: { include: { penilaianKkn: true } },
      },
    });

    if (!student) {
      throw new Error("Mahasiswa tidak ditemukan");
    }

    // Filter murni berbasis studentId mahasiswa ini
    const laporan = await prisma.programKerjaKkn.findFirst({
      where: {
        studentId: student.id,
        kategori: "LAPORAN_AKHIR",
      },
      orderBy: { updatedAt: "desc" },
    });

    const dplInfo = student.kelompok?.dpl
      ? {
          id: student.kelompok.dpl.id,
          name: student.kelompok.dpl.name,
          phone: student.kelompok.dpl.phone || null,
        }
      : null;

    if (!laporan) {
      return {
        hasSubmitted: false,
        kelompokId: student.kelompokId,
        namaKelompok: student.kelompok?.name || null,
        dpl: dplInfo,
        data: null,
      };
    }

    const parsed = parseProkerDeskripsi(laporan.deskripsi);
    const fileUrl = laporan.attachmentFile || laporan.linkGoogleDrive || null;
    const scoreVal =
      laporan.skorPenilaian !== null && laporan.skorPenilaian !== undefined
        ? Number(laporan.skorPenilaian)
        : null;

    let statusTelaah = laporan.statusUsulan || "MENUNGGU_TELAAH";
    if (!fileUrl) {
      statusTelaah = "BELUM_UNGGAH";
    } else if (laporan.statusPenilaian === "DISETUJUI" || scoreVal !== null) {
      statusTelaah = "DISETUJUI";
    } else if (laporan.statusPenilaian === "PERLU_REVISI") {
      statusTelaah = "PERLU_REVISI";
    }

    let predikat = laporan.predikat || "Belum Dinilai";
    if (scoreVal !== null && (!laporan.predikat || laporan.predikat === "Belum Dinilai")) {
      if (scoreVal >= 85) predikat = "A (Sangat Baik)";
      else if (scoreVal >= 75) predikat = "B (Baik)";
      else if (scoreVal >= 65) predikat = "C (Cukup)";
      else predikat = "D (Kurang)";
    }

    const payloadDetail = {
      id: laporan.id,
      judul: parsed.judul || `Laporan Akhir KKN - ${student.user?.name || student.nim}`,
      deskripsi: parsed.deskripsi || laporan.deskripsi,
      fileUrl,
      fileName: fileUrl
        ? `Laporan_Akhir_${(student.user?.name || student.nim || "Mahasiswa").replace(/\s+/g, "_")}.pdf`
        : null,
      isGoogleDrive: Boolean(fileUrl && fileUrl.includes("drive.google.com")),
      statusTelaah,
      status: laporan.status || statusTelaah,
      nilaiAkhir: scoreVal,
      skorPenilaian: scoreVal,
      predikat,
      catatanDpl: laporan.catatanDpl || laporan.evaluasiDpl || "",
      catatanRevisi: laporan.catatanDpl || laporan.evaluasiDpl || "",
      aspekPenilaian: laporan.aspekPenilaian || null,
      submittedAt: laporan.createdAt.toISOString(),
      updatedAt: laporan.updatedAt.toISOString(),
    };

    return {
      hasSubmitted: true,
      id: laporan.id,
      kelompokId: student.kelompokId,
      namaKelompok: student.kelompok?.name || null,
      ...payloadDetail,
      dpl: dplInfo,
      laporan: payloadDetail,
      data: payloadDetail,
    };
  }

  /**
   * Mengambil Riwayat Pengajuan Laporan Akhir Mahasiswa (Version History)
   */
  async getLaporanAkhirHistory(userId: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
    });

    if (!student) return [];

    const list = await prisma.programKerjaKkn.findMany({
      where: {
        studentId: student.id,
        kategori: "LAPORAN_AKHIR",
      },
      orderBy: { createdAt: "desc" },
    });

    return list.map((item) => {
      const parsed = parseProkerDeskripsi(item.deskripsi);
      return {
        id: item.id,
        judul: parsed.judul,
        deskripsi: parsed.deskripsi,
        fileUrl: item.attachmentFile || item.linkGoogleDrive,
        statusTelaah: item.statusUsulan || "MENUNGGU_TELAAH",
        skorPenilaian: item.skorPenilaian ? Number(item.skorPenilaian) : null,
        predikat: item.predikat || "Belum Dinilai",
        catatanDpl: item.catatanDpl || item.evaluasiDpl || null,
        aspekPenilaian: item.aspekPenilaian,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }

  /**
   * Matriks Progres Laporan Akhir Seluruh Mahasiswa dalam Suatu Kelompok (Khusus DPL)
   */
  async getLaporanAkhirDplMatrix(kelompokId: string) {
    const kelompok = await prisma.kelompokKkn.findUnique({
      where: { id: kelompokId },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                fotoProfil: true,
              },
            },
          },
          orderBy: { nim: "asc" },
        },
      },
    });

    if (!kelompok) {
      throw new Error("Kelompok KKN tidak ditemukan.");
    }

    // Ambil seluruh proker berkategori LAPORAN_AKHIR di kelompok ini
    const laporans = await prisma.programKerjaKkn.findMany({
      where: {
        kelompokId,
        kategori: "LAPORAN_AKHIR",
      },
    });

    let totalSudahSubmit = 0;
    const mahasiswaList = kelompok.students.map((st) => {
      const laporan = laporans.find((l) => l.studentId === st.id);
      const hasSubmitted = Boolean(laporan && (laporan.attachmentFile || laporan.linkGoogleDrive));

      if (hasSubmitted) {
        totalSudahSubmit++;
      }

      const parsed = laporan ? parseProkerDeskripsi(laporan.deskripsi) : { judul: null, deskripsi: null };
      const fileUrl = laporan ? (laporan.attachmentFile || laporan.linkGoogleDrive || null) : null;
      const scoreVal = laporan?.skorPenilaian ? Number(laporan.skorPenilaian) : null;

      let statusTelaah = "BELUM_UNGGAH";
      if (hasSubmitted) {
        if (laporan?.statusPenilaian === "DISETUJUI" || scoreVal !== null) {
          statusTelaah = "DISETUJUI";
        } else if (laporan?.statusPenilaian === "PERLU_REVISI") {
          statusTelaah = "PERLU_REVISI";
        } else {
          statusTelaah = laporan?.statusUsulan || "MENUNGGU_TELAAH";
        }
      }

      return {
        studentId: st.id,
        userId: st.userId,
        nama: st.user?.name || "Mahasiswa KKN",
        nim: st.nim,
        jurusan: st.jurusan || null,
        fakultas: st.fakultas || null,
        isKetua: Boolean(st.isKetua),
        hasSubmitted,
        laporanId: laporan?.id || null,
        judulLaporan: parsed.judul || null,
        fileUrl,
        fileName: fileUrl ? `Laporan_Akhir_${(st.user?.name || st.nim).replace(/\s+/g, "_")}.pdf` : null,
        statusTelaah,
        nilaiAkhir: scoreVal,
        predikat: laporan?.predikat || (scoreVal !== null ? (scoreVal >= 85 ? "A" : "B") : "Belum Dinilai"),
        catatanDpl: laporan?.catatanDpl || laporan?.evaluasiDpl || null,
        aspekPenilaian: laporan?.aspekPenilaian || null,
        submittedAt: laporan?.createdAt || null,
        updatedAt: laporan?.updatedAt || null,
      };
    });

    return {
      success: true,
      kelompokId: kelompok.id,
      namaKelompok: kelompok.name,
      totalMahasiswa: kelompok.students.length,
      totalSudahSubmit,
      totalBelumSubmit: kelompok.students.length - totalSudahSubmit,
      mahasiswa: mahasiswaList,
    };
  }
}

export const laporanAkhirService = new LaporanAkhirService();
