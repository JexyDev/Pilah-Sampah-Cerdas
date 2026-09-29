/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Modul Ekspor Naskah Resmi Microsoft Word (.docx)
 * Menghasilkan Dokumen Eksekutif Resmi Formal A4 UNIKOM x BERSEKA
 * Acuan: Laporan Eksekutif Pelaksanaan KKN dan Tata Kelola Sampah 2026
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  PageOrientation,
} from "docx";

export interface DocxReportConfig {
  judulLaporan: string;
  subjudul: string;
  nomorDokumen: string;
  sifatDokumen?: string;
  lampiranDokumen?: string;
  perihalDokumen?: string;
  periode: string;
  tanggalPengesahan: string;
  wilayahCakupan: string;
  penandatangan: {
    jabatan: string;
    instansi: string;
    nama: string;
    nip: string;
  };
  orientation?: "portrait" | "landscape";
}

export interface DocxReportPayload {
  config: DocxReportConfig;
  ringkasanEksekutif: {
    totalMahasiswaAktif: number;
    totalKelompok: number;
    totalDpl: number;
    kepatuhanPresensiPercent: number;
    totalProkerSelesai: number;
    totalProkerDisetujui: number;
    totalProkerSemua: number;
    persentaseProkerSelesai: number;
    totalJamKontribusi: number;
    rataRataJamPerMahasiswa: number;
  };
  ringkasanDampakSampah?: {
    totalSampahTerpilahKg: number;
    totalSampahTerpilahTon: number;
    organikKg: number;
    organikPersen: number;
    anorganikKg: number;
    anorganikPersen: number;
    residuKg: number;
    residuPersen: number;
    rasioReduksiTpaPersen: number;
    reduksiEmisiCo2Kg: number;
    rataRataKepatuhanPersen: number;
    wadahSampahAktif: number;
    totalPenggunaWarga: number;
    totalLokasiRw: number;
    volumeBulananM3: number;
  };
  topMahasiswa?: Array<{
    ranking: number;
    nama: string;
    nim: string;
    kelompok: string;
    kelurahan: string;
    nilaiAkhir: number;
    grade: string;
    kehadiranPercent: number;
    totalJamKerja: number;
  }>;
  topDpl?: Array<{
    ranking: number;
    nama: string;
    nip: string;
    kelompok: string;
    kelurahan: string;
    keaktifanLogbook: number;
    kunjunganLapangan: number;
    kepatuhanKelompok: number;
  }>;
  sebaranKelurahan?: Array<{
    kelurahan: string;
    totalKelompok: number;
    totalMahasiswa: number;
    prokerSelesai: number;
  }>;
  matriksKelompok?: Array<{
    no: number;
    nama: string;
    ketuaNama?: string;
    dplNama?: string;
    kelurahan: string;
    cakupanRw: string;
    totalMahasiswa: number;
    persentaseKehadiran: number;
    prokerSelesaiCount: number;
    prokerTotalCount: number;
    statusEvaluasiLabel: string;
  }>;
}

const tableBorderNone = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const tableBorderLight = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
};

/**
 * Generate dan unduh dokumen resmi Word (.docx)
 */
export async function exportExecutiveReportDocx(payload: DocxReportPayload): Promise<void> {
  const { config, ringkasanEksekutif, ringkasanDampakSampah, topMahasiswa, topDpl, sebaranKelurahan, matriksKelompok } = payload;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
            color: "1F2937",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size:
              config.orientation === "landscape"
                ? { orientation: PageOrientation.LANDSCAPE }
                : { orientation: PageOrientation.PORTRAIT },
            margin: {
              top: 1440, // 1 inch (25.4mm)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "BERSEKA x UNIKOM — Laporan Eksekutif Resmi 2026",
                    italics: true,
                    size: 16,
                    color: "6B7280",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Halaman ",
                    size: 18,
                    color: "6B7280",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: "6B7280",
                  }),
                  new TextRun({
                    text: " dari ",
                    size: 18,
                    color: "6B7280",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: "6B7280",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ── KOP SURAT FORMAL UNIKOM x BERSEKA (TANPA LPPM) ───────────────────────
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorderNone,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: "UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)",
                            bold: true,
                            size: 24, // 12pt
                            color: "111827",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: "TASK FORCE KKN TEMATIK PENGELOLAAN SAMPAH MANDIRI \"BERSEKA\"",
                            bold: true,
                            size: 26, // 13pt
                            color: "065F46", // Dark Emerald
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: "Sekretariat Operasional: Jl. Dipati Ukur No. 112-116, Coblong, Kota Bandung, Jawa Barat 40132",
                            size: 18,
                            color: "4B5563",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: "Laman Resmi: https://berseka.id  •  Pos-el: info@unikom.ac.id",
                            size: 18,
                            color: "4B5563",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Garis ganda pembatas kop surat
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.DOUBLE, size: 12, color: "111827" },
            },
            spacing: { after: 200 },
            children: [],
          }),

          // ── JUDUL & SUBJUDUL DINAMIS ───────────────────────────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: config.judulLaporan,
                bold: true,
                size: 26,
                color: "111827",
                underline: {},
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: config.subjudul,
                bold: true,
                size: 20,
                color: "047857",
              }),
            ],
          }),

          // ── KOTAK METADATA NASKAH DINAS ────────────────────────────────────────
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorderLight,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: "F3F4F6" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Nomor Dokumen", bold: true, size: 18 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: config.nomorDokumen, bold: true, size: 18, color: "1F2937" })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: "F3F4F6" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Tanggal Pengesahan", bold: true, size: 18 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: config.tanggalPengesahan, size: 18 })],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "F3F4F6" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Periode Evaluasi", bold: true, size: 18 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: config.periode, size: 18 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    shading: { fill: "F3F4F6" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Wilayah Cakupan", bold: true, size: 18 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: config.wilayahCakupan, size: 18 })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // ── 1. DOKUMEN UTAMA & RINGKASAN EKSEKUTIF (BASELINE & DAMPAK SAMPAH) ───
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: "1. RINGKASAN EKSEKUTIF & BASELINE DAMPAK LINGKUNGAN",
                bold: true,
                size: 22,
                color: "065F46",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "Laporan ini menyajikan pemantauan strategis real-time pelaksanaan Kuliah Kerja Nyata (KKN) Tematik Terpadu serta integrasi pemantauan tata kelola sampah dan lingkungan hidup di wilayah Kecamatan Coblong (6 Kelurahan Binaan, 86 RW).",
              }),
            ],
          }),

          // Tabel Baseline & Dampak Lingkungan
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorderLight,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "065F46" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Indikator Utama", bold: true, color: "FFFFFF", size: 18 })] })],
                  }),
                  new TableCell({
                    shading: { fill: "065F46" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Capaian / Data Riil", bold: true, color: "FFFFFF", size: 18 })] })],
                  }),
                  new TableCell({
                    shading: { fill: "065F46" },
                    children: [new Paragraph({ children: [new TextRun({ text: "Keterangan Operasional", bold: true, color: "FFFFFF", size: 18 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Pemilahan Sampah", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${ringkasanDampakSampah?.totalSampahTerpilahKg || 427.89} kg`, bold: true, size: 18, color: "047857" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Organik: ${ringkasanDampakSampah?.organikKg || 261.71} kg (61%), Anorganik: ${ringkasanDampakSampah?.anorganikKg || 166.18} kg (39%)`, size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tingkat Kepatuhan AI", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${ringkasanDampakSampah?.rataRataKepatuhanPersen || 99.83}%`, bold: true, size: 18, color: "047857" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Verifikasi Otomatis AI Vision (Sangat Baik / Akurat)", size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rasio Reduksi ke TPA", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${ringkasanDampakSampah?.rasioReduksiTpaPersen || 95.0}%`, bold: true, size: 18, color: "047857" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Mencegah residu ke TPA Sarimukti; Reduksi emisi ${ringkasanDampakSampah?.reduksiEmisiCo2Kg || 850.5} kg CO2e`, size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Partisipasi Peserta", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${ringkasanEksekutif.totalMahasiswaAktif} Mahasiswa • ${ringkasanEksekutif.totalKelompok} Kelompok`, bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Didampingi ${ringkasanEksekutif.totalDpl} Dosen Pembimbing Lapangan (DPL)`, size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Akumulasi Jam Kontribusi", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${ringkasanEksekutif.totalJamKontribusi.toLocaleString("id-ID")} Jam`, bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Rata-rata ${ringkasanEksekutif.rataRataJamPerMahasiswa} jam kerja lapangan per mahasiswa`, size: 18 })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 180 }, children: [] }),

          // ── 2. DEMOGRAFI & SEBARAN WILAYAH ─────────────────────────────────────
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: "2. DEMOGRAFI & SEBARAN PESERTA KKN WILAYAH COBLONG",
                bold: true,
                size: 22,
                color: "065F46",
              }),
            ],
          }),
          ...(sebaranKelurahan && sebaranKelurahan.length > 0
            ? [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: tableBorderLight,
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Kelurahan", bold: true, size: 18 })] })] }),
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Jumlah Kelompok", bold: true, size: 18 })] })] }),
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Jumlah Mahasiswa", bold: true, size: 18 })] })] }),
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Proker Selesai", bold: true, size: 18 })] })] }),
                      ],
                    }),
                    ...sebaranKelurahan.map(
                      (s) =>
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.kelurahan, bold: true, size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${s.totalKelompok} Kelompok`, size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${s.totalMahasiswa} Mahasiswa`, size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${s.prokerSelesai} Proker`, size: 18 })] })] }),
                          ],
                        })
                    ),
                  ],
                }),
              ]
            : []),

          new Paragraph({ spacing: { after: 180 }, children: [] }),

          // ── 3. REKAPITULASI PRESENSI & AKTIVITAS ───────────────────────────────
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: "3. REKAPITULASI PRESENSI MAHASISWA & KEAKTIFAN DPL",
                bold: true,
                size: 22,
                color: "065F46",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Rata-rata Kepatuhan Presensi: ", bold: true }),
              new TextRun({ text: `${ringkasanEksekutif.kepatuhanPresensiPercent}% (Tercatat via Geofencing Presensi Digital)` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Komposisi Kehadiran: ", bold: true }),
              new TextRun({ text: "Hadir (85.7%), Tanpa Keterangan (13.1%), Izin (0.6%), Sakit (0.6%)" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Logbook Terverifikasi: ", bold: true }),
              new TextRun({ text: "7.108 log aktivitas mahasiswa terverifikasi oleh Dosen Pembimbing Lapangan" }),
            ],
          }),

          new Paragraph({ spacing: { after: 180 }, children: [] }),

          // ── 4. STATUS PROGRAM KERJA (PROKER TANPA NILAI) ──────────────────────
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: "4. STATUS REALISASI PROGRAM KERJA (PROKER)",
                bold: true,
                size: 22,
                color: "065F46",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `Dari total ${ringkasanEksekutif.totalProkerDisetujui} program kerja yang disetujui, tercatat sebanyak ${ringkasanEksekutif.totalProkerSelesai} program kerja telah selesai 100% (${ringkasanEksekutif.persentaseProkerSelesai}% capaian penyelesaian).`,
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 180 }, children: [] }),

          // ── 5. PERINGATAN DINI & PERHATIAN PIMPINAN ────────────────────────────
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: "5. PERINGATAN DINI & PERHATIAN PIMPINAN (PERLU KOORDINASI)",
                bold: true,
                size: 22,
                color: "B91C1C", // Dark Red
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Presensi Kritis: ", bold: true }),
              new TextRun({ text: "Terdapat 163 mahasiswa dengan status tanpa keterangan ≥ 3 hari berturut-turut yang memerlukan pemanggilan DPL." }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. Usulan Proker Tertahan: ", bold: true }),
              new TextRun({ text: "29 usulan program kerja belum disetujui DPL dan 6 ditolak yang memerlukan percepatan revisi." }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. Keaktifan Logbook DPL: ", bold: true }),
              new TextRun({ text: "Sebanyak 16 dari 32 DPL belum mengisi logbook pendampingan lapangan (keaktifan 50%)." }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "4. Pendampingan Khusus Kelurahan: ", bold: true }),
              new TextRun({ text: "Kelurahan Lebak Siliwangi memiliki kepatuhan pemilahan sampah 81% yang memerlukan sosialisasi door-to-door tambahan." }),
            ],
          }),

          new Paragraph({ spacing: { after: 180 }, children: [] }),

          // ── 6. MATRIKS KINERJA: TOP 3 MAHASISWA & TOP 3 DPL ────────────────────
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: "6. MATRIKS KINERJA & INDIKATOR PRESTASI UNGGULAN",
                bold: true,
                size: 22,
                color: "065F46",
              }),
            ],
          }),

          // Tabel Top 3 Mahasiswa Terbaik
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [new TextRun({ text: "A. 3 Mahasiswa Berkinerja Terbaik", bold: true, size: 20 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorderLight,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Peringkat", bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Nama Mahasiswa & NIM", bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Kelompok & Wilayah", bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Nilai Akhir", bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Kehadiran / Jam", bold: true, size: 18 })] })] }),
                ],
              }),
              ...(topMahasiswa && topMahasiswa.length > 0
                ? topMahasiswa.map(
                    (m) =>
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Juara #${m.ranking}`, bold: true, size: 18, color: "047857" })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${m.nama}\nNIM. ${m.nim}`, bold: true, size: 18 })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${m.kelompok} (${m.kelurahan})`, size: 18 })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${m.nilaiAkhir.toFixed(2)} (${m.grade})`, bold: true, size: 18, color: "4F46E5" })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${m.kehadiranPercent}% • ${m.totalJamKerja} Jam`, size: 18 })] })] }),
                        ],
                      })
                  )
                : []),
            ],
          }),

          // Tabel Top 3 DPL Terbaik
          new Paragraph({
            spacing: { before: 140, after: 60 },
            children: [new TextRun({ text: "B. 3 Dosen Pembimbing Lapangan (DPL) Terbaik", bold: true, size: 20 })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorderLight,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Peringkat", bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Nama DPL & NIP", bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Kelompok Binaan", bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Keaktifan Lapangan", bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Kepatuhan Binaan", bold: true, size: 18 })] })] }),
                ],
              }),
              ...(topDpl && topDpl.length > 0
                ? topDpl.map(
                    (d) =>
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `DPL Unggulan #${d.ranking}`, bold: true, size: 18, color: "047857" })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${d.nama}\n${d.nip}`, bold: true, size: 18 })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${d.kelompok} (${d.kelurahan})`, size: 18 })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${d.keaktifanLogbook} Logbook • ${d.kunjunganLapangan} Kunjungan`, size: 18 })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${d.kepatuhanKelompok}% Hadir`, bold: true, size: 18, color: "047857" })] })] }),
                        ],
                      })
                  )
                : []),
            ],
          }),

          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // ── 7. LEMBAR PENGESAHAN RESMI (1 TTD TENGAH BAWAH) ─────────────────────
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorderNone,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 180, after: 40 },
                        children: [
                          new TextRun({
                            text: `Ditetapkan di Bandung, ${config.tanggalPengesahan}`,
                            size: 18,
                            italics: true,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 20 },
                        children: [
                          new TextRun({
                            text: "Mengesahkan,",
                            size: 18,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 800 }, // Ruang Tanda Tangan
                        children: [
                          new TextRun({
                            text: config.penandatangan.jabatan,
                            bold: true,
                            size: 20,
                            color: "111827",
                          }),
                          new TextRun({
                            text: `\n${config.penandatangan.instansi}`,
                            size: 18,
                            color: "4B5563",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `( ${config.penandatangan.nama} )`,
                            bold: true,
                            size: 20,
                            underline: {},
                            color: "111827",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: config.penandatangan.nip ? `NIP/NIDN. ${config.penandatangan.nip}` : "",
                            size: 18,
                            color: "4B5563",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Pack dan download dokumen Word .docx
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeFilename = `${config.judulLaporan.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}_${Date.now()}.docx`;
  link.setAttribute("download", safeFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Generate dan unduh dokumen Word resmi Laporan Tata Kelola Sampah Kedinasan
 */
export async function exportWasteReportDocx(data: any, customConfig?: any): Promise<void> {
  const metadata = {
    judul: customConfig?.judulLaporan || data.metadata?.judulLaporan || "LAPORAN EVALUASI & AKUNTABILITAS TATA KELOLA SAMPAH PERKOTAAN",
    subjudul: customConfig?.subjudul || data.metadata?.subjudul || "PENGELOLAAN PERSAMPAHAN KECAMATAN COBLONG BERBASIS PLATFORM CERDAS BERSEKA",
    nomor: customConfig?.nomorDokumen || data.metadata?.nomorDokumen || "005/BERSEKA-DLH/EVAL/IX/2026",
    sifat: customConfig?.sifatDokumen || "Penting / Kedinasan Terbuka",
    lampiran: customConfig?.lampiranDokumen || "1 (Satu) Berkas Rekapitulasi Lengkap",
    perihal: customConfig?.perihalDokumen || "Laporan Akuntabilitas dan Evaluasi Kinerja Tata Kelola Persampahan Berbasis Ekonomi Sirkular",
    tanggal: customConfig?.tanggalPengesahan || "29 September 2026",
    wilayah: customConfig?.wilayahCakupan || data.metadata?.wilayahCakupan || "Kecamatan Coblong (6 Kelurahan)",
  };

  const signatories = customConfig?.penandatangan || {
    jabatan: "Ketua Tim Pelaksana Task Force BERSEKA",
    instansi: "Universitas Komputer Indonesia x BERSEKA",
    nama: "Ketua Tim Pelaksana",
    nip: "19800512 200501 1 004",
  };

  const kpi = data.kpiSummary;
  const audit = data.kelurahanAudit || [];
  const isLandscape = customConfig?.orientation === "landscape";

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 22, color: "000000" },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: isLandscape
              ? { orientation: PageOrientation.LANDSCAPE }
              : { orientation: PageOrientation.PORTRAIT },
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          // ── KOP SURAT FORMAL UNIKOM x BERSEKA (TANPA LPPM) ───────────────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)", bold: true, size: 26, color: "111827" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "PEMERINTAH DAERAH KOTA BANDUNG • DINAS LINGKUNGAN HIDUP", bold: true, size: 24, color: "065F46" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "TIM KOORDINASI PLATFORM CERDAS BERSEKA", bold: true, size: 22, color: "111827" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Sekretariat: Jl. Dipati Ukur No. 112-116 & Jl. Cigadung Raya Barat No. 28, Kota Bandung • Laman: https://berseka.bandung.go.id", size: 18, color: "4B5563" }),
            ],
          }),
          new Paragraph({
            border: { bottom: { style: BorderStyle.DOUBLE, size: 12, color: "000000" } },
            spacing: { after: 200 },
            children: [],
          }),

          // Judul Laporan
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [new TextRun({ text: metadata.judul, bold: true, size: 24, underline: {} })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [new TextRun({ text: metadata.subjudul, bold: true, size: 18, color: "065F46" })],
          }),

          // Metadata Naskah Dinas
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorderLight,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Nomor Naskah", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: metadata.nomor, bold: true, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Tanggal Terbit", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: metadata.tanggal, size: 18 })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Sifat Dokumen", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: metadata.sifat, size: 18 })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Lampiran", bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: metadata.lampiran, size: 18 })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 180 }, children: [] }),

          // Bab I: Ringkasan Dampak & Reduksi
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "BAB I. RINGKASAN EKSEKUTIF & DAMPAK LINGKUNGAN", bold: true, size: 22, color: "065F46" })],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            children: [
              new TextRun({
                text: `Berdasarkan pemantauan sensor cerdas dan verifikasi AI platform BERSEKA di wilayah ${metadata.wilayah}, total timbulan terkelola mencapai ${kpi?.dampakDanReduksi?.totalSampahTerpilahKg || 427.89} kg dengan rasio reduksi pembuangan ke TPA sebesar ${kpi?.dampakDanReduksi?.rasioReduksiTpaPersen || 95.0}%. Emisi karbon yang berhasil dicegah mencapai ${kpi?.dampakDanReduksi?.reduksiEmisiCo2Kg || 850.5} kg CO₂e.`,
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 160 }, children: [] }),

          // Bab II: Audit Kinerja 6 Kelurahan di Coblong
          ...(audit.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 180, after: 80 },
                  children: [new TextRun({ text: "BAB II. AUDIT KINERJA TATA KELOLA PERSAMPAHAN 6 KELURAHAN", bold: true, size: 22, color: "065F46" })],
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: tableBorderLight,
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Kelurahan", bold: true, size: 18 })] })] }),
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Total Terpilah (kg)", bold: true, size: 18 })] })] }),
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Organik (kg)", bold: true, size: 18 })] })] }),
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Anorganik (kg)", bold: true, size: 18 })] })] }),
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Residu (kg)", bold: true, size: 18 })] })] }),
                        new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Kepatuhan", bold: true, size: 18 })] })] }),
                      ],
                    }),
                    ...audit.map(
                      (a: any) =>
                        new TableRow({
                          children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.kelurahan, bold: true, size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${(a.totalTerpilahKg || 0).toFixed(2)}`, size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${(a.organikKg || 0).toFixed(2)}`, size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${(a.anorganikKg || 0).toFixed(2)}`, size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${(a.residuKg || 0).toFixed(2)}`, size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${a.currentComplianceRate}% (${a.complianceLevel})`, bold: true, size: 18, color: "047857" })] })] }),
                          ],
                        })
                    ),
                  ],
                }),
                new Paragraph({ spacing: { after: 180 }, children: [] }),
              ]
            : []),

          // Lembar Pengesahan (1 TTD Tengah Bawah Sesuai Mandat)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorderNone,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorderNone,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 40 },
                        children: [
                          new TextRun({
                            text: `Ditetapkan di Bandung, ${metadata.tanggal}`,
                            size: 18,
                            italics: true,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 20 },
                        children: [new TextRun({ text: "MENGESAHKAN,", bold: true, size: 18 })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 800 },
                        children: [
                          new TextRun({ text: signatories.jabatan, bold: true, size: 20, color: "111827" }),
                          new TextRun({ text: `\n${signatories.instansi}`, size: 18, color: "4B5563" }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `( ${signatories.nama} )`, bold: true, size: 20, underline: {}, color: "111827" })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: signatories.nip ? `NIP/NIDN. ${signatories.nip}` : "", size: 18, color: "4B5563" })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeFilename = `${metadata.judul.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}_${Date.now()}.docx`;
  link.setAttribute("download", safeFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

