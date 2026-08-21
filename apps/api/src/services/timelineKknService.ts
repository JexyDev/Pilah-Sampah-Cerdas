/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { prisma } from "../lib/prisma.js";

// Data acuan default 12 Pekan KKN Coblong 2026
export const DEFAULT_TIMELINE_COBLONG = [
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "1 Juli 2026",
    startDate: new Date("2026-07-01T00:00:00.000Z"),
    endDate: new Date("2026-07-01T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Sosialisasi & Pembukaan Kegiatan KKN di Lantai 17",
    outputTarget: "Civitas akademika memahami program & kegiatan resmi dibuka secara internal",
    picKeterangan: "Wakil Rektor 1 (WR 1) UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "6 Juli 2026",
    startDate: new Date("2026-07-06T00:00:00.000Z"),
    endDate: new Date("2026-07-06T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pertemuan koordinasi dengan Camat Coblong & Pemerintah Provinsi Jawa Barat",
    outputTarget: "Penyelarasan teknis kerja sama, penentuan wilayah & dukungan pemerintah daerah",
    picKeterangan: "Camat Coblong, Perwakilan Pemprov Jabar, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "7 - 10 Juli 2026",
    startDate: new Date("2026-07-07T00:00:00.000Z"),
    endDate: new Date("2026-07-10T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Koordinasi dengan Kepala Kelurahan & Dinas Lingkungan Hidup (DLH) untuk persiapan survey awal",
    outputTarget: "Kesepakatan teknis pelaksanaan survey lapangan & data awal persampahan dari DLH",
    picKeterangan: "Kepala Kelurahan (6 kelurahan), DLH, DPL, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "16 - 20 Juli 2026",
    startDate: new Date("2026-07-16T00:00:00.000Z"),
    endDate: new Date("2026-07-20T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Survey lapangan di 6 kelurahan (Lebak Siliwangi, Lebak Gede, Cipaganti, Sadang Serang, Sekeloa, Dago)",
    outputTarget: "Data kondisi eksisting persampahan per kelurahan (titik TPS/TPS 3R, bank sampah, volume sampah) sebagai bahan baseline & lokasi posko",
    picKeterangan: "Tim KKN UNIKOM, DPL, Kepala Kelurahan, DLH",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "25 Juli 2026",
    startDate: new Date("2026-07-25T00:00:00.000Z"),
    endDate: new Date("2026-07-25T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembukaan resmi Kegiatan KKN oleh Pemerintah Provinsi Jawa Barat",
    outputTarget: "Program KKN UNIKOM 2026 di Kecamatan Coblong resmi dibuka",
    picKeterangan: "Pemerintah Provinsi Jawa Barat, Rektorat UNIKOM, Camat Coblong",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "6 Agustus 2026 (Kamis)",
    startDate: new Date("2026-08-06T00:00:00.000Z"),
    endDate: new Date("2026-08-06T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembekalan DPL & Diskusi dengan Dinas Lingkungan Hidup (DLH)",
    outputTarget: "DPL memahami mekanisme KKN, tata tertib, fokus program sampah, dan kebijakan/data teknis persampahan dari DLH",
    picKeterangan: "Tim KKN UNIKOM, seluruh DPL, Perwakilan DLH",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "8 Agustus 2026 (Sabtu)",
    startDate: new Date("2026-08-08T00:00:00.000Z"),
    endDate: new Date("2026-08-08T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pembekalan Mahasiswa",
    outputTarget: "Mahasiswa memahami kode etik, tata tertib, kompetensi TIK & soft skills, dan profil wilayah Coblong",
    picKeterangan: "Tim KKN UNIKOM, DPL, narasumber Pemkot Bandung & mitra",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Minggu 1",
    tanggal: "12 - 18 Agustus 2026",
    startDate: new Date("2026-08-12T00:00:00.000Z"),
    endDate: new Date("2026-08-18T23:59:59.000Z"),
    fase: "Fase 1: Persiapan & Observasi",
    kegiatanUtama: "Penerjunan & Observasi Awal Lingkungan",
    outputTarget: "Mahasiswa tiba di posko kelurahan, koordinasi dengan RW/RT setempat, verifikasi data baseline sampah awal",
    picKeterangan: "Mahasiswa KKN, DPL, Lurah & Pengurus RW/RT",
    statusPelaksanaan: "SEDANG_BERJALAN",
  },
  {
    tahapMinggu: "Minggu 2",
    tanggal: "19 - 25 Agustus 2026",
    startDate: new Date("2026-08-19T00:00:00.000Z"),
    endDate: new Date("2026-08-25T23:59:59.000Z"),
    fase: "Fase 1: Persiapan & Observasi",
    kegiatanUtama: "Sosialisasi Pemilahan Sampah & Pengenalan Aplikasi BERSEKA",
    outputTarget: "Warga RW binaan memahami pemilahan sampah organik/anorganik dan teredukasi penggunaan sistem digital BERSEKA",
    picKeterangan: "Mahasiswa KKN, Kader Lingkungan, Pengurus RW",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 3 - 4",
    tanggal: "26 Agustus - 8 September 2026",
    startDate: new Date("2026-08-26T00:00:00.000Z"),
    endDate: new Date("2026-09-08T23:59:59.000Z"),
    fase: "Fase 2: Pilot Project",
    kegiatanUtama: "Uji Coba Pengangkutan Terjadwal & Pengoperasian Bank Sampah Unit",
    outputTarget: "Alur penjemputan sampah residu/organik berjalan, integrasi data timbangan masuk ke database BERSEKA",
    picKeterangan: "Mahasiswa KKN, Petugas Residu, Pengelola Bank Sampah, DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 5 - 8",
    tanggal: "9 September - 6 Oktober 2026",
    startDate: new Date("2026-09-09T00:00:00.000Z"),
    endDate: new Date("2026-10-06T23:59:59.000Z"),
    fase: "Fase 3: Implementasi & Pendampingan",
    kegiatanUtama: "Penerapan Penuh Program Inovasi & Edukasi Berkelanjutan",
    outputTarget: "Optimalisasi kompos organik/maggot BSF, stabilisasi reduksi sampah ke TPS, aktivasi reward poin warga",
    picKeterangan: "Seluruh Kelompok KKN, DLH Kota Bandung, Pengurus RW/RT",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 9 - 12",
    tanggal: "7 - 31 Oktober 2026",
    startDate: new Date("2026-10-07T00:00:00.000Z"),
    endDate: new Date("2026-10-31T23:59:59.000Z"),
    fase: "Fase 4: Evaluasi & Penutupan",
    kegiatanUtama: "Evaluasi Capaian Reduksi Sampah, Penyusunan Laporan Akhir & Expo Penutupan",
    outputTarget: "Laporan akhir program kerja disetujui DPL, serah terima sistem ke pengurus wilayah, penarikan resmi mahasiswa KKN",
    picKeterangan: "Rektorat UNIKOM, Panitia Taskforce, DLH, Camat Coblong, Seluruh Mahasiswa & DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
];

export interface TimelineQueryParams {
  kelompokId?: string;
  fase?: string;
  statusPelaksanaan?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const timelineKknService = {
  /**
   * Mengambil semua linimasa sesuai role, scope kelompok, dan filter
   */
  getAll: async (params: TimelineQueryParams, userId?: string, userRole?: string) => {
    const role = (userRole || "").toUpperCase();

    // Inisialisasi data bawaan jika database masih kosong sama sekali
    const count = await prisma.timelineKkn.count();
    if (count === 0) {
      await timelineKknService.seedDefaultCoblong();
    }

    let allowedKelompokIds: string[] | null = null; // null = dapat melihat semua kelompok

    if (role === "MAHASISWA_KKN" && userId) {
      const studentProfile = await prisma.studentKkn.findUnique({
        where: { userId },
        select: { kelompokId: true },
      });
      allowedKelompokIds = studentProfile?.kelompokId ? [studentProfile.kelompokId] : [];
    } else if (["DPL", "DOSEN_PEMBIMBING"].includes(role) && userId) {
      const kelompokBinaan = await prisma.kelompokKkn.findMany({
        where: {
          OR: [{ dplId: userId }, { dpl: { id: userId } }],
        },
        select: { id: true },
      });
      allowedKelompokIds = kelompokBinaan.map((k) => k.id);
    }

    const where: any = {};

    // Filter Scope Kelompok
    if (params.kelompokId) {
      if (params.kelompokId === "GLOBAL") {
        where.kelompokId = null;
      } else if (params.kelompokId !== "ALL") {
        where.kelompokId = params.kelompokId;
      }
    } else if (allowedKelompokIds !== null) {
      // Role dengan batas akses kelompok (Mahasiswa / DPL)
      if (allowedKelompokIds.length === 0) {
        where.kelompokId = null; // hanya bisa melihat timeline global
      } else {
        where.OR = [
          { kelompokId: { in: allowedKelompokIds } },
          { kelompokId: null }, // tetap bisa melihat acuan global
        ];
      }
    }

    // Filter Fase
    if (params.fase && params.fase !== "ALL") {
      where.fase = { contains: params.fase, mode: "insensitive" };
    }

    // Filter Status Pelaksanaan
    if (params.statusPelaksanaan && params.statusPelaksanaan !== "ALL") {
      where.statusPelaksanaan = params.statusPelaksanaan;
    }

    // Filter Pencarian Teks
    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { tahapMinggu: { contains: q, mode: "insensitive" } },
            { kegiatanUtama: { contains: q, mode: "insensitive" } },
            { outputTarget: { contains: q, mode: "insensitive" } },
            { picKeterangan: { contains: q, mode: "insensitive" } },
            { tanggal: { contains: q, mode: "insensitive" } },
            { fase: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Filter Rentang Tanggal
    if (params.startDate) {
      const start = new Date(params.startDate);
      if (!isNaN(start.getTime())) {
        where.endDate = { gte: start };
      }
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      if (!isNaN(end.getTime())) {
        where.startDate = { lte: end };
      }
    }

    return prisma.timelineKkn.findMany({
      where,
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
      orderBy: [
        { startDate: "asc" },
        { createdAt: "asc" },
      ],
    });
  },

  /**
   * Mengambil item linimasa berdasarkan ID
   */
  getById: async (id: string) => {
    return prisma.timelineKkn.findUnique({
      where: { id },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
  },

  /**
   * Membuat item linimasa baru
   */
  create: async (data: {
    tahapMinggu: string;
    tanggal: string;
    startDate?: Date | null;
    endDate?: Date | null;
    fase: string;
    kegiatanUtama: string;
    outputTarget: string;
    picKeterangan: string;
    statusPelaksanaan?: string;
    kelompokId?: string | null;
  }) => {
    return prisma.timelineKkn.create({
      data: {
        tahapMinggu: data.tahapMinggu.trim(),
        tanggal: data.tanggal.trim(),
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        fase: data.fase.trim(),
        kegiatanUtama: data.kegiatanUtama.trim(),
        outputTarget: data.outputTarget.trim(),
        picKeterangan: data.picKeterangan.trim(),
        statusPelaksanaan: data.statusPelaksanaan || "BELUM_DIMULAI",
        kelompokId: data.kelompokId && data.kelompokId !== "GLOBAL" ? data.kelompokId : null,
      },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
  },

  /**
   * Mengupdate item linimasa
   */
  update: async (
    id: string,
    data: Partial<{
      tahapMinggu: string;
      tanggal: string;
      startDate: Date | null;
      endDate: Date | null;
      fase: string;
      kegiatanUtama: string;
      outputTarget: string;
      picKeterangan: string;
      statusPelaksanaan: string;
      kelompokId: string | null;
    }>
  ) => {
    const payload: any = {};
    if (data.tahapMinggu !== undefined) payload.tahapMinggu = data.tahapMinggu.trim();
    if (data.tanggal !== undefined) payload.tanggal = data.tanggal.trim();
    if (data.startDate !== undefined) payload.startDate = data.startDate;
    if (data.endDate !== undefined) payload.endDate = data.endDate;
    if (data.fase !== undefined) payload.fase = data.fase.trim();
    if (data.kegiatanUtama !== undefined) payload.kegiatanUtama = data.kegiatanUtama.trim();
    if (data.outputTarget !== undefined) payload.outputTarget = data.outputTarget.trim();
    if (data.picKeterangan !== undefined) payload.picKeterangan = data.picKeterangan.trim();
    if (data.statusPelaksanaan !== undefined) payload.statusPelaksanaan = data.statusPelaksanaan;
    if (data.kelompokId !== undefined) {
      payload.kelompokId = data.kelompokId && data.kelompokId !== "GLOBAL" ? data.kelompokId : null;
    }

    return prisma.timelineKkn.update({
      where: { id },
      data: payload,
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
  },

  /**
   * Mengubah status pelaksanaan secara cepat
   */
  updateStatus: async (id: string, statusPelaksanaan: string) => {
    const validStatuses = ["BELUM_DIMULAI", "SEDANG_BERJALAN", "SELESAI"];
    if (!validStatuses.includes(statusPelaksanaan)) {
      throw new Error("Status pelaksanaan tidak valid. Harus BELUM_DIMULAI, SEDANG_BERJALAN, atau SELESAI");
    }

    return prisma.timelineKkn.update({
      where: { id },
      data: { statusPelaksanaan },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
  },

  /**
   * Menghapus item linimasa
   */
  delete: async (id: string) => {
    return prisma.timelineKkn.delete({
      where: { id },
    });
  },

  /**
   * Import batch dari array JSON / Excel yang sudah diparsing
   */
  bulkImport: async (
    items: Array<{
      tahapMinggu: string;
      tanggal: string;
      startDate?: string | Date | null;
      endDate?: string | Date | null;
      fase: string;
      kegiatanUtama: string;
      outputTarget: string;
      picKeterangan: string;
      statusPelaksanaan?: string;
      kelompokId?: string | null;
    }>,
    mode: "APPEND" | "REPLACE" = "APPEND",
    targetKelompokId?: string | null
  ) => {
    const resolvedKelompokId = targetKelompokId && targetKelompokId !== "GLOBAL" ? targetKelompokId : null;

    if (mode === "REPLACE") {
      // Hapus data lama pada scope kelompok tersebut
      await prisma.timelineKkn.deleteMany({
        where: {
          kelompokId: resolvedKelompokId,
        },
      });
    }

    const createdItems = [];
    for (const item of items) {
      if (!item.kegiatanUtama || !item.tahapMinggu) continue;

      let startD: Date | null = null;
      let endD: Date | null = null;

      if (item.startDate) {
        const d = new Date(item.startDate);
        if (!isNaN(d.getTime())) startD = d;
      }
      if (item.endDate) {
        const d = new Date(item.endDate);
        if (!isNaN(d.getTime())) endD = d;
      }

      const created = await prisma.timelineKkn.create({
        data: {
          tahapMinggu: String(item.tahapMinggu).trim(),
          tanggal: String(item.tanggal || "").trim() || "Sesuai Jadwal",
          startDate: startD,
          endDate: endD,
          fase: String(item.fase || "Fase 1: Persiapan").trim(),
          kegiatanUtama: String(item.kegiatanUtama).trim(),
          outputTarget: String(item.outputTarget || "-").trim(),
          picKeterangan: String(item.picKeterangan || "-").trim(),
          statusPelaksanaan: item.statusPelaksanaan || "BELUM_DIMULAI",
          kelompokId: item.kelompokId !== undefined ? (item.kelompokId && item.kelompokId !== "GLOBAL" ? item.kelompokId : null) : resolvedKelompokId,
        },
      });
      createdItems.push(created);
    }

    return {
      importedCount: createdItems.length,
      mode,
    };
  },

  /**
   * Seed acuan default Coblong jika diperlukan
   */
  seedDefaultCoblong: async (forceReplace = false) => {
    if (forceReplace) {
      await prisma.timelineKkn.deleteMany({
        where: { kelompokId: null },
      });
    }

    const creates = DEFAULT_TIMELINE_COBLONG.map((item) =>
      prisma.timelineKkn.create({
        data: {
          ...item,
          kelompokId: null,
        },
      })
    );

    return prisma.$transaction(creates);
  },
};
