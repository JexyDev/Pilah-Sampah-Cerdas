/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { prisma } from "../lib/prisma.js";

// Data acuan default 18 tahapan resmi KKN Coblong 2026
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
    tahapMinggu: "Pra-Kegiatan",
    tanggal: "12 Agustus 2026 (Rabu)",
    startDate: new Date("2026-08-12T00:00:00.000Z"),
    endDate: new Date("2026-08-12T23:59:59.000Z"),
    fase: "Pra-Kegiatan",
    kegiatanUtama: "Pelepasan Mahasiswa & Keberangkatan DPL ke lokasi",
    outputTarget: "Mahasiswa & DPL tiba dan mulai bertugas di 6 kelurahan - Minggu 1 dimulai",
    picKeterangan: "Seluruh mahasiswa peserta, DPL, Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Minggu 1",
    tanggal: "12 - 18 Agustus 2026",
    startDate: new Date("2026-08-12T00:00:00.000Z"),
    endDate: new Date("2026-08-18T23:59:59.000Z"),
    fase: "Fase 1 - Persiapan & Observasi",
    kegiatanUtama: "KICK OFF & Penerjunan: Pelepasan mahasiswa & keberangkatan DPL ke lokasi posko di 6 kelurahan; Koordinasi awal dengan RT/RW & verifikasi data baseline",
    outputTarget: "Posko terbentuk di 6 kelurahan; Mahasiswa & DPL siap di lokasi; Dokumen penerimaan resmi kelurahan",
    picKeterangan: "Kunjungan DPL & Pelepasan Tim KKN UNIKOM",
    statusPelaksanaan: "SELESAI",
  },
  {
    tahapMinggu: "Minggu 2",
    tanggal: "19 - 25 Agustus 2026",
    startDate: new Date("2026-08-19T00:00:00.000Z"),
    endDate: new Date("2026-08-25T23:59:59.000Z"),
    fase: "Fase 1 - Persiapan & Observasi",
    kegiatanUtama: "Observasi lapangan & pembuatan proposal/matrik program kerja; Identifikasi potensi-masalah sampah; Sosialisasi awal pemilahan & aplikasi BERSEKA",
    outputTarget: "Draft proposal & matrik program kerja tersusun; Warga RW binaan memahami pemilahan sampah",
    picKeterangan: "Monitoring DPL & Mahasiswa KKN",
    statusPelaksanaan: "SEDANG_BERJALAN",
  },
  {
    tahapMinggu: "Minggu 3",
    tanggal: "26 Agustus - 1 September 2026",
    startDate: new Date("2026-08-26T00:00:00.000Z"),
    endDate: new Date("2026-09-01T23:59:59.000Z"),
    fase: "Fase 2 - Pilot Project",
    kegiatanUtama: "Finalisasi & persetujuan matrik program kerja oleh DPL & Kelurahan; Persiapan sarana pemilahan (tempat sampah 3 kategori, QR Code, materi edukasi); Pemilihan RT percontohan",
    outputTarget: "Matrik program kerja disetujui; RT pilot ditentukan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 4",
    tanggal: "2 - 8 September 2026",
    startDate: new Date("2026-09-02T00:00:00.000Z"),
    endDate: new Date("2026-09-08T23:59:59.000Z"),
    fase: "Fase 2 - Pilot Project",
    kegiatanUtama: "Distribusi sarana & aktivasi QR Code di RT pilot; Uji coba awal aplikasi warga",
    outputTarget: "RT pilot aktif dengan sarana pemilahan",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 5",
    tanggal: "9 - 15 September 2026",
    startDate: new Date("2026-09-09T00:00:00.000Z"),
    endDate: new Date("2026-09-15T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Uji coba aplikasi warga (scan QR, setor sampah, verifikasi poin) & edukasi pemilahan door-to-door di RT pilot; Uji coba timbangan IoT & GPS; Uji coba dashboard monitoring kelurahan; Evaluasi hasil pilot & penyempurnaan sistem",
    outputTarget: "Warga RT pilot mulai menggunakan aplikasi; sistem IoT & dashboard berjalan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 6 dan 7",
    tanggal: "16 - 29 September 2026",
    startDate: new Date("2026-09-16T00:00:00.000Z"),
    endDate: new Date("2026-09-29T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Perluasan program ke seluruh RW; Aktivasi gamifikasi & leaderboard partisipasi warga; Pendampingan pembentukan/penguatan bank sampah per RW",
    outputTarget: "Seluruh RW terlibat; leaderboard aktif",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 8",
    tanggal: "30 September - 6 Oktober 2026",
    startDate: new Date("2026-09-30T00:00:00.000Z"),
    endDate: new Date("2026-10-06T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Pendampingan Pengangkutan sampah berbasis data (rute & jadwal via IoT/GPS); Pendampingan pengolahan organik: kompos, biopori, budidaya maggot BSF",
    outputTarget: "Rute pengangkutan optimal; unit pengomposan berjalan",
    picKeterangan: "Kunjungan DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 9",
    tanggal: "7 - 13 Oktober 2026",
    startDate: new Date("2026-10-07T00:00:00.000Z"),
    endDate: new Date("2026-10-13T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Operasional bank sampah: pencatatan transaksi & saldo nasabah; Produksi POC & pemanfaatan botol bekas (buruan SAE); Pembuatan konten edukasi digital dan pencarian link kerja sama untuk distribusi produksi maggot dan POC dan evaluasi tengah Periode (Kesadaran dan partisipasi warga)",
    outputTarget: "Bank sampah tercatat rapi; produk POC/buruan SAE mulai jalan; data komposisi sampah per wilayah",
    picKeterangan: "Monitoring DPL dan Kunjungan Ketua Pelaksana",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 10 dan 11",
    tanggal: "14 - 27 Oktober 2026",
    startDate: new Date("2026-10-14T00:00:00.000Z"),
    endDate: new Date("2026-10-27T23:59:59.000Z"),
    fase: "Fase 3 - Implementasi & Pendampingan",
    kegiatanUtama: "Mitigasi persoalan berdasarkan data evaluasi: Edukasi masyarakat, Penguatan kelembagaan bank sampah/TPS 3R & SOP pengelolaan; Optimalisasi rute pengangkutan berdasarkan data terkumpul",
    outputTarget: "Peningkatan warga memilah; SOP kelembagaan bank sampah tersusun",
    picKeterangan: "Monitoring DPL",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
  {
    tahapMinggu: "Minggu 12",
    tanggal: "28 - 31 Oktober 2026",
    startDate: new Date("2026-10-28T00:00:00.000Z"),
    endDate: new Date("2026-10-31T23:59:59.000Z"),
    fase: "Fase 4 - Evaluasi & Penutupan",
    kegiatanUtama: "Konsolidasi capaian program seluruh kelurahan; Pengukuran indikator keberhasilan (perilaku, operasional, ekonomi sirkular, sistem digital); Finalisasi laporan akhir, video report, dan artikel ilmiah; Persiapan materi seminar hasil & publikasi konten digital; Upacara penarikan mahasiswa di Kantor Kecamatan Coblong; Unggah laporan akhir ke sistem informasi KKN",
    outputTarget: "Laporan akhir final, seminar akhir, Mahasiswa ditarik; laporan terunggah; nilai akhir keluar",
    picKeterangan: "Penilaian akhir DPL & Kelurahan (50:50)",
    statusPelaksanaan: "BELUM_DIMULAI",
  },
];

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  ags: 7,
  agu: 7,
  agustus: 7,
  sep: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
};

export const parseIndonesianDateRange = (str: string): { start: Date | null; end: Date | null } => {
  if (!str) return { start: null, end: null };
  const clean = str.replace(/\(.*?\)/g, "").trim().toLowerCase();

  // Pola 1: "12 - 18 agustus 2026"
  const m1 = clean.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (m1) {
    const d1 = parseInt(m1[1], 10);
    const d2 = parseInt(m1[2], 10);
    const mon = MONTH_MAP[m1[3]];
    const yr = parseInt(m1[4], 10);
    if (mon !== undefined && !isNaN(yr)) {
      return {
        start: new Date(Date.UTC(yr, mon, d1, 0, 0, 0)),
        end: new Date(Date.UTC(yr, mon, d2, 23, 59, 59)),
      };
    }
  }

  // Pola 2: "26 agustus - 1 september 2026"
  const m2 = clean.match(/(\d{1,2})\s+([a-z]+)\s*[-–]\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (m2) {
    const d1 = parseInt(m2[1], 10);
    const mon1 = MONTH_MAP[m2[2]];
    const d2 = parseInt(m2[3], 10);
    const mon2 = MONTH_MAP[m2[4]];
    const yr = parseInt(m2[5], 10);
    if (mon1 !== undefined && mon2 !== undefined && !isNaN(yr)) {
      return {
        start: new Date(Date.UTC(yr, mon1, d1, 0, 0, 0)),
        end: new Date(Date.UTC(yr, mon2, d2, 23, 59, 59)),
      };
    }
  }

  // Pola 3: "1 juli 2026"
  const m3 = clean.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (m3) {
    const d1 = parseInt(m3[1], 10);
    const mon = MONTH_MAP[m3[2]];
    const yr = parseInt(m3[3], 10);
    if (mon !== undefined && !isNaN(yr)) {
      return {
        start: new Date(Date.UTC(yr, mon, d1, 0, 0, 0)),
        end: new Date(Date.UTC(yr, mon, d1, 23, 59, 59)),
      };
    }
  }

  return { start: null, end: null };
};

/**
 * Helper untuk menentukan status linimasa secara dinamis mengikuti kalender hari ini (real-time)
 */
export const computeTimelineStatus = (
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  tanggalStr?: string,
  currentStatus?: string
): "SELESAI" | "SEDANG_BERJALAN" | "BELUM_DIMULAI" => {
  const now = new Date();

  let start: Date | null = null;
  let end: Date | null = null;

  if (startDate) {
    const d = new Date(startDate);
    if (!isNaN(d.getTime())) start = d;
  }
  if (endDate) {
    const d = new Date(endDate);
    if (!isNaN(d.getTime())) end = d;
  }

  // Jika belum ada startDate / endDate, coba parse dari teks string tanggal
  if (!start || !end) {
    const parsed = parseIndonesianDateRange(tanggalStr || "");
    if (parsed.start) start = parsed.start;
    if (parsed.end) end = parsed.end;
  }

  if (!start || !end) {
    return (currentStatus as any) || "BELUM_DIMULAI";
  }

  const nowStr = now.toISOString().split("T")[0];
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  if (nowStr > endStr) {
    return "SELESAI";
  }
  if (nowStr >= startStr && nowStr <= endStr) {
    return "SEDANG_BERJALAN";
  }
  return "BELUM_DIMULAI";
};

export const inferBidangKegiatan = (kegiatanUtama: string = "", tahapMinggu: string = "", fase: string = ""): string => {
  const text = `${kegiatanUtama} ${tahapMinggu} ${fase}`.toLowerCase();
  if (text.includes("sosialisasi") || text.includes("edukasi") || text.includes("door-to-door") || text.includes("uji coba aplikasi")) {
    return "Edukasi Warga & Sosialisasi";
  }
  if (text.includes("bank sampah") || text.includes("maggot") || text.includes("poc") || text.includes("biopori") || text.includes("kompos") || text.includes("pengolahan")) {
    return "Pengolahan & Bank Sampah";
  }
  if (text.includes("pengangkutan") || text.includes("rute") || text.includes("logistik") || text.includes("tps")) {
    return "Pengangkutan & Logistik";
  }
  if (text.includes("pemilahan") || text.includes("sarana") || text.includes("pilot") || text.includes("tempat sampah") || text.includes("observasi")) {
    return "Pemilahan Sampah";
  }
  if (text.includes("evaluasi") || text.includes("laporan") || text.includes("seminar") || text.includes("penarikan") || text.includes("indikator")) {
    return "Evaluasi & Pelaporan";
  }
  return "Tata Kelola & Koordinasi";
};

export interface TimelineQueryParams {
  kelompokId?: string;
  kelurahan?: string;
  bidangKegiatan?: string;
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
    try {
      const count = await prisma.timelineKkn.count();
      if (count === 0) {
        await timelineKknService.seedDefaultCoblong();
      }
    } catch (e: any) {
      console.warn("[timelineKknService.getAll] auto-seed warning:", e?.message || e);
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

    const items = await prisma.timelineKkn.findMany({
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

    // Dinamisasi status secara real-time mengikuti kalender hari ini
    const resolvedItems = items.map((item) => {
      const dynamicStatus = computeTimelineStatus(
        item.startDate,
        item.endDate,
        item.tanggal,
        item.statusPelaksanaan
      );

      // Jika status database tidak sinkron dengan kalender hari ini, lakukan update
      if (item.statusPelaksanaan !== dynamicStatus) {
        prisma.timelineKkn
          .update({
            where: { id: item.id },
            data: { statusPelaksanaan: dynamicStatus },
          })
          .catch((err) => console.warn("[timelineKknService] auto-sync status warn:", err?.message));

        return { ...item, statusPelaksanaan: dynamicStatus };
      }

      return item;
    });

    let mapped = resolvedItems.map((item, idx) => {
      const bidang = (item as any).bidangKegiatan || inferBidangKegiatan(item.kegiatanUtama, item.tahapMinggu, item.fase);
      const kelurahan = item.kelompok?.kelurahan || (item as any).kelurahan || "Coblong (Semua Wilayah)";
      return {
        ...item,
        nomor: idx + 1,
        kelurahan,
        bidangKegiatan: bidang,
        kelompokNama: item.kelompok?.name || "Seluruh Kelompok KKN",
        urlGoogleDrive: (item as any).urlGoogleDrive || (item as any).linkGoogleDrive || "https://drive.google.com/drive/folders/kkn-coblong-2026",
      };
    });

    // Filter tambahan untuk kelurahan
    if (params.kelurahan && params.kelurahan !== "ALL") {
      const qKel = params.kelurahan.toLowerCase();
      mapped = mapped.filter((item) =>
        item.kelurahan.toLowerCase().includes(qKel) ||
        item.kegiatanUtama.toLowerCase().includes(qKel) ||
        item.kelurahan.toLowerCase().includes("semua") ||
        item.kelurahan.toLowerCase().includes("coblong")
      );
    }

    // Filter tambahan untuk bidang kegiatan
    if (params.bidangKegiatan && params.bidangKegiatan !== "ALL") {
      const qBid = params.bidangKegiatan.toLowerCase();
      mapped = mapped.filter((item) => item.bidangKegiatan.toLowerCase().includes(qBid));
    }

    return mapped;
  },

  /**
   * Mengambil item linimasa berdasarkan ID
   */
  getById: async (id: string) => {
    const item = await prisma.timelineKkn.findUnique({
      where: { id },
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });

    if (!item) return null;

    const dynamicStatus = computeTimelineStatus(
      item.startDate,
      item.endDate,
      item.tanggal,
      item.statusPelaksanaan
    );

    return {
      ...item,
      statusPelaksanaan: dynamicStatus,
      nomor: 1,
      kelurahan: item.kelompok?.kelurahan || "Coblong (Semua Wilayah)",
      kelompokNama: item.kelompok?.name || "Seluruh Kelompok KKN",
      urlGoogleDrive: (item as any).urlGoogleDrive || (item as any).linkGoogleDrive || "https://drive.google.com/drive/folders/kkn-coblong-2026",
    };
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
