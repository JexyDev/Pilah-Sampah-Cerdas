import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import * as XLSX from "xlsx";

export enum ImportStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

/** Nama sheet wajib ada di workbook */
const REQUIRED_SHEETS = [
  "kelurahan",
  "karakteristik_wilayah",
  "pemilahan_sampah",
  "bank_sampah_pengolahan",
  "key_player",
  "volume_sampah",
  "catatan_kesimpulan",
] as const;

/** Kolom boolean per sheet — nilai 0/1 dari XLSX dikonversi ke boolean */
const BOOL_COLUMNS: Record<string, string[]> = {
  karakteristik_wilayah: [
    "padat_penduduk",
    "banyak_kos_kontrakan",
    "banyak_umkm_warung_kafe",
    "dekat_kampus_sekolah",
    "pasar",
    "bantaran_sungai",
    "karakter_lainnya_flag",
  ],
  bank_sampah_pengolahan: [
    "biopori_loseda",
    "ecobrick_kerajinan_daur_ulang",
    "buruan_sae",
    "pengepul_mitra_daur_ulang",
    "digitalisasi_data",
  ],
};

/**
 * Konversi nilai XLSX (0/1/true/false/null) ke boolean | null.
 * Mempertahankan NULL agar "data tidak diisi" tetap terbedakan dari false.
 */
function toBool(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  return v === 1 || v === true || v === "1";
}

/** Normalisasi kolom boolean pada baris data sheet tertentu */
function normalizeRows(sheet: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const boolCols = BOOL_COLUMNS[sheet] || [];
  return rows.map((row) => {
    const clone = { ...row };
    boolCols.forEach((col) => {
      clone[col] = toBool(clone[col]);
    });
    return clone;
  });
}

export interface ParsedWorkbookData {
  kelurahan: Record<string, unknown>[];
  karakteristik_wilayah: Record<string, unknown>[];
  pemilahan_sampah: Record<string, unknown>[];
  bank_sampah_pengolahan: Record<string, unknown>[];
  key_player: Record<string, unknown>[];
  volume_sampah: Record<string, unknown>[];
  catatan_kesimpulan: Record<string, unknown>[];
}

/**
 * Parse buffer file XLSX menjadi JSON per sheet.
 * Memvalidasi bahwa semua 7 sheet wajib tersedia.
 *
 * @param buffer - Buffer file .xlsx dari multer memory storage
 * @returns Objek berisi array data per sheet
 * @throws Error jika sheet wajib tidak ditemukan
 */
export function parseWorkbook(buffer: Buffer): ParsedWorkbookData {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });

  const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
  if (missing.length) {
    throw new Error(`Sheet tidak ditemukan: ${missing.join(", ")}`);
  }

  const result: Record<string, Record<string, unknown>[]> = {};
  for (const sheetName of REQUIRED_SHEETS) {
    const ws = wb.Sheets[sheetName];
    // defval: null → sel kosong jadi NULL, bukan hilang dari objek
    result[sheetName] = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
  }
  return result as unknown as ParsedWorkbookData;
}

/**
 * Validasi data hasil parsing sebelum insert ke database.
 * Memeriksa kelurahan_id wajib ada, nama_kelurahan wajib ada,
 * dan foreign key integrity antar sheet.
 *
 * @param data - Data hasil parsing dari parseWorkbook
 * @returns Array pesan error (kosong jika valid)
 */
export function validateData(data: ParsedWorkbookData): string[] {
  const errors: string[] = [];

  data.kelurahan.forEach((row, i) => {
    if (!row.kelurahan_id) errors.push(`kelurahan baris ${i + 2}: kelurahan_id kosong`);
    if (!row.nama_kelurahan) errors.push(`kelurahan baris ${i + 2}: nama_kelurahan kosong`);
  });

  const validIds = new Set(data.kelurahan.map((r) => r.kelurahan_id));
  const childSheets = [
    "karakteristik_wilayah",
    "pemilahan_sampah",
    "bank_sampah_pengolahan",
    "key_player",
    "volume_sampah",
    "catatan_kesimpulan",
  ] as const;

  childSheets.forEach((sheet) => {
    (data[sheet] as Record<string, unknown>[]).forEach((row, i) => {
      if (!validIds.has(row.kelurahan_id)) {
        errors.push(
          `${sheet} baris ${i + 2}: kelurahan_id ${row.kelurahan_id} tidak ada di sheet kelurahan`
        );
      }
    });
  });

  return errors;
}

/**
 * Impor data survei KKN ke database dalam satu transaksi Prisma.
 * Strategi re-import: hapus data lama berdasarkan kelurahanId yang diimpor, lalu insert ulang.
 *
 * @param data - Data hasil parsing & validasi
 * @param userId - ID user yang melakukan impor (untuk audit log)
 * @param filename - Nama file asli yang diupload
 * @returns Ringkasan jumlah baris per tabel yang berhasil diimpor
 */
export async function importToDatabase(
  data: ParsedWorkbookData,
  userId: string,
  filename: string,
  surveyType: string = "BASELINE"
): Promise<{ summary: Record<string, number>; importLogId: string }> {
  const summary: Record<string, number> = {};
  const isEndline = surveyType.toUpperCase() === "ENDLINE";

  // Buat import log awal dengan status PENDING
  const importLog = await prisma.importLog.create({
    data: {
      userId,
      filename: isEndline ? `[ENDLINE] ${filename}` : filename,
      status: ImportStatus.PENDING,
    },
  });

  try {
    await prisma.$transaction(async (tx) => {
      const kelurahanIds = data.kelurahan.map((r) => r.kelurahan_id as number);

      if (isEndline) {
        // 1. Induk: EndlineSurveiKelurahan
        for (const row of data.kelurahan) {
          await tx.endlineSurveiKelurahan.upsert({
            where: { kelurahanId: row.kelurahan_id as number },
            update: {
              namaKelurahan: row.nama_kelurahan as string,
              kecamatan: (row.kecamatan as string) || null,
              tanggalSurvei: row.tanggal_survei ? new Date(row.tanggal_survei as string) : null,
              enumerator: (row.enumerator as string) || null,
              catatanData: (row.catatan_data as string) || null,
            },
            create: {
              kelurahanId: row.kelurahan_id as number,
              namaKelurahan: row.nama_kelurahan as string,
              kecamatan: (row.kecamatan as string) || null,
              tanggalSurvei: row.tanggal_survei ? new Date(row.tanggal_survei as string) : null,
              enumerator: (row.enumerator as string) || null,
              catatanData: (row.catatan_data as string) || null,
            },
          });
        }
        summary["kelurahan"] = data.kelurahan.length;

        // pemilahan_sampah
        await tx.endlinePemilahanSampah.deleteMany({
          where: { kelurahanId: { in: kelurahanIds } },
        });
        for (const row of data.pemilahan_sampah) {
          await tx.endlinePemilahanSampah.create({
            data: {
              kelurahanId: row.kelurahan_id as number,
              jumlahRumahMemilah: (row.jumlah_rumah_memilah as number) || null,
              totalJumlahRumahDiRw: (row.total_jumlah_rumah_di_rw as number) || null,
              persentasePemilahan:
                row.persentase_pemilahan != null ? (row.persentase_pemilahan as number) : null,
              tingkatPemilahan: (row.tingkat_pemilahan as string) || null,
              catatan: (row.catatan as string) || null,
            },
          });
        }
        summary["pemilahan_sampah"] = data.pemilahan_sampah.length;

        // volume_sampah
        await tx.endlineVolumeSampah.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
        for (const row of data.volume_sampah) {
          await tx.endlineVolumeSampah.create({
            data: {
              kelurahanId: row.kelurahan_id as number,
              organikKgPerHari:
                row.organik_kg_per_hari != null ? (row.organik_kg_per_hari as number) : null,
              anorganikKgPerHari:
                row.anorganik_kg_per_hari != null ? (row.anorganik_kg_per_hari as number) : null,
              residuKgPerHari:
                row.residu_kg_per_hari != null ? (row.residu_kg_per_hari as number) : null,
              totalVolumeKgPerHari:
                row.total_volume_kg_per_hari != null
                  ? (row.total_volume_kg_per_hari as number)
                  : null,
              catatan: (row.catatan as string) || null,
            },
          });
        }
        summary["volume_sampah"] = data.volume_sampah.length;

        // bank_sampah_pengolahan
        const bankSampahRows = normalizeRows("bank_sampah_pengolahan", data.bank_sampah_pengolahan);
        await tx.endlineBankSampahPengolahan.deleteMany({
          where: { kelurahanId: { in: kelurahanIds } },
        });
        for (const row of bankSampahRows) {
          await tx.endlineBankSampahPengolahan.create({
            data: {
              kelurahanId: row.kelurahan_id as number,
              bankSampahAktif: (row.bank_sampah_aktif as number) || null,
              bankSampahTidakAktif: (row.bank_sampah_tidak_aktif as number) || null,
              bioporiLoseda: row.biopori_loseda as boolean | null,
              ecobrickKerajinanDaurUlang: row.ecobrick_kerajinan_daur_ulang as boolean | null,
              buruanSae: row.buruan_sae as boolean | null,
              pengepulMitraDaurUlang: row.pengepul_mitra_daur_ulang as boolean | null,
              digitalisasiData: row.digitalisasi_data as boolean | null,
              jumlahUnitKomposter:
                row.jumlah_unit_komposter != null ? String(row.jumlah_unit_komposter) : null,
              jumlahTitikMaggotBsf:
                row.jumlah_titik_maggot_bsf != null ? String(row.jumlah_titik_maggot_bsf) : null,
              aktivitasLainnyaKeterangan:
                (row.catatan as string) || (row.aktivitas_lainnya_keterangan as string) || null,
            },
          });
        }
        summary["bank_sampah_pengolahan"] = bankSampahRows.length;

        // catatan_kesimpulan
        await tx.endlineCatatanKesimpulan.deleteMany({
          where: { kelurahanId: { in: kelurahanIds } },
        });
        for (const row of data.catatan_kesimpulan) {
          await tx.endlineCatatanKesimpulan.create({
            data: {
              kelurahanId: row.kelurahan_id as number,
              prioritasIntervensi: (row.prioritas_intervensi as string) || null,
              catatanTambahanRisikoSosial: (row.catatan_tambahan_risiko_sosial as string) || null,
            },
          });
        }
        summary["catatan_kesimpulan"] = data.catatan_kesimpulan.length;
        return;
      }

      // 1. Upsert tabel induk: SurveiKelurahan (Baseline)
      for (const row of data.kelurahan) {
        await tx.surveiKelurahan.upsert({
          where: { kelurahanId: row.kelurahan_id as number },
          update: {
            namaKelurahan: row.nama_kelurahan as string,
            kecamatan: (row.kecamatan as string) || null,
            jumlahRw: (row.jumlah_rw as number) || null,
            jumlahRt: (row.jumlah_rt as number) || null,
            tanggalSurvei: row.tanggal_survei ? new Date(row.tanggal_survei as string) : null,
            jumlahKk: (row.jumlah_kk as number) || null,
            jumlahRumahTotal: (row.jumlah_rumah_total as number) || null,
            enumerator: (row.enumerator as string) || null,
            titikKumpulMahasiswa: (row.titik_kumpul_mahasiswa as string) || null,
            catatanData: (row.catatan_data as string) || null,
          },
          create: {
            kelurahanId: row.kelurahan_id as number,
            namaKelurahan: row.nama_kelurahan as string,
            kecamatan: (row.kecamatan as string) || null,
            jumlahRw: (row.jumlah_rw as number) || null,
            jumlahRt: (row.jumlah_rt as number) || null,
            tanggalSurvei: row.tanggal_survei ? new Date(row.tanggal_survei as string) : null,
            jumlahKk: (row.jumlah_kk as number) || null,
            jumlahRumahTotal: (row.jumlah_rumah_total as number) || null,
            enumerator: (row.enumerator as string) || null,
            titikKumpulMahasiswa: (row.titik_kumpul_mahasiswa as string) || null,
            catatanData: (row.catatan_data as string) || null,
          },
        });
      }
      summary["kelurahan"] = data.kelurahan.length;

      // 2. Child tables: hapus data lama, insert baru
      // (kelurahanIds sudah dideklarasikan di atas)

      // karakteristik_wilayah (1:1)
      const karakteristikRows = normalizeRows("karakteristik_wilayah", data.karakteristik_wilayah);
      await tx.surveiKarakteristikWilayah.deleteMany({
        where: { kelurahanId: { in: kelurahanIds } },
      });
      for (const row of karakteristikRows) {
        await tx.surveiKarakteristikWilayah.create({
          data: {
            kelurahanId: row.kelurahan_id as number,
            padatPenduduk: row.padat_penduduk as boolean | null,
            banyakKosKontrakan: row.banyak_kos_kontrakan as boolean | null,
            banyakUmkmWarungKafe: row.banyak_umkm_warung_kafe as boolean | null,
            dekatKampusSekolah: row.dekat_kampus_sekolah as boolean | null,
            pasar: row.pasar as boolean | null,
            bantaranSungai: row.bantaran_sungai as boolean | null,
            karakterLainnyaFlag: row.karakter_lainnya_flag as boolean | null,
            karakterLainnyaKeterangan:
              row.karakter_lainnya_keterangan != null
                ? String(row.karakter_lainnya_keterangan)
                : null,
            perkiraanJumlahKosKontrakan:
              row.perkiraan_jumlah_kos_kontrakan != null
                ? String(row.perkiraan_jumlah_kos_kontrakan)
                : null,
            perkiraanJumlahUmkmWarungKafe:
              row.perkiraan_jumlah_umkm_warung_kafe != null
                ? String(row.perkiraan_jumlah_umkm_warung_kafe)
                : null,
          },
        });
      }
      summary["karakteristik_wilayah"] = karakteristikRows.length;

      // pemilahan_sampah (1:1)
      await tx.surveiPemilahanSampah.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
      for (const row of data.pemilahan_sampah) {
        await tx.surveiPemilahanSampah.create({
          data: {
            kelurahanId: row.kelurahan_id as number,
            jumlahRumahMemilah: (row.jumlah_rumah_memilah as number) || null,
            totalJumlahRumahDiRw: (row.total_jumlah_rumah_di_rw as number) || null,
            persentasePemilahan:
              row.persentase_pemilahan != null ? (row.persentase_pemilahan as number) : null,
            tingkatPemilahan: (row.tingkat_pemilahan as string) || null,
            catatan: (row.catatan as string) || null,
          },
        });
      }
      summary["pemilahan_sampah"] = data.pemilahan_sampah.length;

      // bank_sampah_pengolahan (1:1)
      const bankSampahRows = normalizeRows("bank_sampah_pengolahan", data.bank_sampah_pengolahan);
      await tx.surveiBankSampahPengolahan.deleteMany({
        where: { kelurahanId: { in: kelurahanIds } },
      });
      for (const row of bankSampahRows) {
        await tx.surveiBankSampahPengolahan.create({
          data: {
            kelurahanId: row.kelurahan_id as number,
            bankSampahAktif: (row.bank_sampah_aktif as number) || null,
            bankSampahTidakAktif: (row.bank_sampah_tidak_aktif as number) || null,
            jumlahUnitKomposter:
              row.jumlah_unit_komposter != null ? String(row.jumlah_unit_komposter) : null,
            jumlahTitikMaggotBsf:
              row.jumlah_titik_maggot_bsf != null ? String(row.jumlah_titik_maggot_bsf) : null,
            bioporiLoseda: row.biopori_loseda as boolean | null,
            ecobrickKerajinanDaurUlang: row.ecobrick_kerajinan_daur_ulang as boolean | null,
            buruanSae: row.buruan_sae as boolean | null,
            pengepulMitraDaurUlang: row.pengepul_mitra_daur_ulang as boolean | null,
            digitalisasiData: row.digitalisasi_data as boolean | null,
            aktivitasLainnyaKeterangan: (row.aktivitas_lainnya_keterangan as string) || null,
          },
        });
      }
      summary["bank_sampah_pengolahan"] = bankSampahRows.length;

      // key_player (1:N)
      await tx.surveiKeyPlayer.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
      for (const row of data.key_player) {
        await tx.surveiKeyPlayer.create({
          data: {
            kelurahanId: row.kelurahan_id as number,
            jenisAktor: row.jenis_aktor != null ? String(row.jenis_aktor) : null,
            nama: row.nama != null ? String(row.nama) : null,
            kontak: row.kontak != null ? String(row.kontak) : null,
            peran: row.peran != null ? String(row.peran) : null,
          },
        });
      }
      summary["key_player"] = data.key_player.length;

      // volume_sampah (1:1)
      await tx.surveiVolumeSampah.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
      for (const row of data.volume_sampah) {
        await tx.surveiVolumeSampah.create({
          data: {
            kelurahanId: row.kelurahan_id as number,
            organikKgPerHari:
              row.organik_kg_per_hari != null ? (row.organik_kg_per_hari as number) : null,
            anorganikKgPerHari:
              row.anorganik_kg_per_hari != null ? (row.anorganik_kg_per_hari as number) : null,
            residuKgPerHari:
              row.residu_kg_per_hari != null ? (row.residu_kg_per_hari as number) : null,
            totalVolumeKgPerHari:
              row.total_volume_kg_per_hari != null
                ? (row.total_volume_kg_per_hari as number)
                : null,
            catatan: (row.catatan as string) || null,
          },
        });
      }
      summary["volume_sampah"] = data.volume_sampah.length;

      // catatan_kesimpulan (1:1)
      await tx.surveiCatatanKesimpulan.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
      for (const row of data.catatan_kesimpulan) {
        await tx.surveiCatatanKesimpulan.create({
          data: {
            kelurahanId: row.kelurahan_id as number,
            prioritasIntervensi: (row.prioritas_intervensi as string) || null,
            catatanTambahanRisikoSosial: (row.catatan_tambahan_risiko_sosial as string) || null,
          },
        });
      }
      summary["catatan_kesimpulan"] = data.catatan_kesimpulan.length;
    });

    // Update import log ke SUCCESS
    const totalRows = Object.values(summary).reduce((a, b) => a + b, 0);
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: ImportStatus.SUCCESS,
        summary: summary as any,
        rowsImported: totalRows,
      },
    });

    return { summary, importLogId: importLog.id };
  } catch (error: any) {
    // Update import log ke FAILED
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: ImportStatus.FAILED,
        errorMessages: [error.message] as any,
      },
    });
    throw error;
  }
}

/**
 * Ambil riwayat impor survei KKN, diurutkan dari yang terbaru.
 *
 * @param limit - Jumlah maksimum riwayat yang dikembalikan (default: 20)
 * @returns Array riwayat impor dengan data user
 */
export async function getImportHistory(limit: number = 20) {
  return prisma.importLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: { select: { name: true } },
        },
      },
    },
  });
}

/**
 * Ambil daftar semua survei kelurahan (dengan pagination & pencarian)
 */
export async function getAllSurveys(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  role?: string,
  userId?: string
) {
  const skip = (page - 1) * limit;
  let where: any = search
    ? {
        namaKelurahan: { contains: search, mode: "insensitive" as const },
      }
    : {};

  if (role === "DPL" && userId) {
    const kelompokKkn = await prisma.kelompokKkn.findMany({
      where: { dplId: userId },
      select: { kelurahan: true },
    });

    const kelurahanList = kelompokKkn
      .map((k) => k.kelurahan)
      .filter((k) => k !== null && k.trim() !== "") as string[];

    if (kelurahanList.length > 0) {
      where.namaKelurahan = {
        ...where.namaKelurahan,
        in: kelurahanList,
      };
    } else {
      // DPL has no kelurahan assigned, return empty list
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }
  }

  const [data, total] = await Promise.all([
    prisma.surveiKelurahan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { namaKelurahan: "asc" },
      include: {
        _count: {
          select: { keyPlayers: true },
        },
      },
    }),
    prisma.surveiKelurahan.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Ambil detail komprehensif survei berdasarkan kelurahanId
 */
export async function getSurveyById(kelurahanId: number, role?: string, userId?: string) {
  const survey = await prisma.surveiKelurahan.findUnique({
    where: { kelurahanId },
    include: {
      karakteristikWilayah: true,
      pemilahanSampah: true,
      bankSampahPengolahan: true,
      keyPlayers: true,
      volumeSampah: true,
      catatanKesimpulan: true, // fixed relation name
    },
  });

  if (!survey) return null;

  if (role === "DPL" && userId) {
    const kelompokKkn = await prisma.kelompokKkn.findMany({
      where: { dplId: userId },
      select: { kelurahan: true },
    });
    const kelurahanList = kelompokKkn
      .map((k) => k.kelurahan?.toLowerCase())
      .filter((k) => !!k) as string[];

    if (kelurahanList.length > 0 && !kelurahanList.includes(survey.namaKelurahan.toLowerCase())) {
      throw new Error("FORBIDDEN_SCOPE");
    }
  }

  return survey;
}

/**
 * Ambil data survei kelurahan berdasarkan penugasan Mahasiswa KKN
 */
export async function getMySurvey(userId: string) {
  const student = await prisma.studentKkn.findUnique({
    where: { userId },
    include: {
      kelompok: true,
      assignedRw: {
        include: { kelurahan: true },
      },
    },
  });

  if (!student) {
    throw new Error("Data mahasiswa tidak ditemukan");
  }

  let kelurahanName = student.kelompok?.kelurahan;

  if (!kelurahanName && student.assignedRw?.kelurahan?.name) {
    kelurahanName = student.assignedRw.kelurahan.name;
  }

  if (!kelurahanName) {
    return null;
  }

  return prisma.surveiKelurahan.findFirst({
    where: { namaKelurahan: kelurahanName },
    include: {
      karakteristikWilayah: true,
      pemilahanSampah: true,
      bankSampahPengolahan: true,
      keyPlayers: true,
      volumeSampah: true,
      catatanKesimpulan: true,
    },
  });
}

/**
 * Update data survei kelurahan beserta seluruh relasinya
 */
export async function updateSurvey(
  kelurahanId: number,
  payload: any,
  role?: string,
  userId?: string
) {
  // Validasi jika DPL, pastikan kelurahan ini masuk wilayah dampingannya
  if (role === "DPL" && userId) {
    const existing = await prisma.surveiKelurahan.findUnique({
      where: { kelurahanId },
    });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    const kelompokDpl = await prisma.kelompokKkn.findMany({
      where: { dplId: userId },
      select: { kelurahan: true },
    });
    const allowedKelurahans = kelompokDpl.map((k) => k.kelurahan).filter(Boolean);

    if (!allowedKelurahans.includes(existing.namaKelurahan)) {
      throw new Error("FORBIDDEN_SCOPE");
    }
  }

  const {
    namaKelurahan,
    kecamatan,
    jumlahRw,
    jumlahRt,
    jumlahKk,
    jumlahRumahTotal,
    tanggalSurvei,
    enumerator,
    titikKumpulMahasiswa,
    catatanData,
    karakteristikWilayah,
    pemilahanSampah,
    bankSampahPengolahan,
    volumeSampah,
    catatanKesimpulan,
    keyPlayers,
  } = payload;

  return await prisma.$transaction(async (tx) => {
    // 1. Update SurveiKelurahan
    await tx.surveiKelurahan.update({
      where: { kelurahanId },
      data: {
        namaKelurahan: namaKelurahan !== undefined ? String(namaKelurahan) : undefined,
        kecamatan: kecamatan !== undefined ? (kecamatan ? String(kecamatan) : null) : undefined,
        jumlahRw:
          jumlahRw !== undefined
            ? jumlahRw === "" || jumlahRw === null
              ? null
              : Number(jumlahRw)
            : undefined,
        jumlahRt:
          jumlahRt !== undefined
            ? jumlahRt === "" || jumlahRt === null
              ? null
              : Number(jumlahRt)
            : undefined,
        jumlahKk:
          jumlahKk !== undefined
            ? jumlahKk === "" || jumlahKk === null
              ? null
              : Number(jumlahKk)
            : undefined,
        jumlahRumahTotal:
          jumlahRumahTotal !== undefined
            ? jumlahRumahTotal === "" || jumlahRumahTotal === null
              ? null
              : Number(jumlahRumahTotal)
            : undefined,
        tanggalSurvei:
          tanggalSurvei !== undefined
            ? tanggalSurvei
              ? new Date(tanggalSurvei)
              : null
            : undefined,
        enumerator: enumerator !== undefined ? (enumerator ? String(enumerator) : null) : undefined,
        titikKumpulMahasiswa:
          titikKumpulMahasiswa !== undefined
            ? titikKumpulMahasiswa
              ? String(titikKumpulMahasiswa)
              : null
            : undefined,
        catatanData:
          catatanData !== undefined ? (catatanData ? String(catatanData) : null) : undefined,
      },
    });

    // 2. Karakteristik Wilayah
    if (karakteristikWilayah) {
      await tx.surveiKarakteristikWilayah.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          padatPenduduk: karakteristikWilayah.padatPenduduk ?? null,
          banyakKosKontrakan: karakteristikWilayah.banyakKosKontrakan ?? null,
          banyakUmkmWarungKafe: karakteristikWilayah.banyakUmkmWarungKafe ?? null,
          dekatKampusSekolah: karakteristikWilayah.dekatKampusSekolah ?? null,
          pasar: karakteristikWilayah.pasar ?? null,
          bantaranSungai: karakteristikWilayah.bantaranSungai ?? null,
          karakterLainnyaFlag: karakteristikWilayah.karakterLainnyaFlag ?? null,
          karakterLainnyaKeterangan: karakteristikWilayah.karakterLainnyaKeterangan ?? null,
          perkiraanJumlahKosKontrakan: karakteristikWilayah.perkiraanJumlahKosKontrakan ?? null,
          perkiraanJumlahUmkmWarungKafe: karakteristikWilayah.perkiraanJumlahUmkmWarungKafe ?? null,
        },
        update: {
          padatPenduduk: karakteristikWilayah.padatPenduduk ?? null,
          banyakKosKontrakan: karakteristikWilayah.banyakKosKontrakan ?? null,
          banyakUmkmWarungKafe: karakteristikWilayah.banyakUmkmWarungKafe ?? null,
          dekatKampusSekolah: karakteristikWilayah.dekatKampusSekolah ?? null,
          pasar: karakteristikWilayah.pasar ?? null,
          bantaranSungai: karakteristikWilayah.bantaranSungai ?? null,
          karakterLainnyaFlag: karakteristikWilayah.karakterLainnyaFlag ?? null,
          karakterLainnyaKeterangan: karakteristikWilayah.karakterLainnyaKeterangan ?? null,
          perkiraanJumlahKosKontrakan: karakteristikWilayah.perkiraanJumlahKosKontrakan ?? null,
          perkiraanJumlahUmkmWarungKafe: karakteristikWilayah.perkiraanJumlahUmkmWarungKafe ?? null,
        },
      });
    }

    // 3. Pemilahan Sampah
    if (pemilahanSampah) {
      const jmlMemilah =
        pemilahanSampah.jumlahRumahMemilah !== undefined &&
        pemilahanSampah.jumlahRumahMemilah !== "" &&
        pemilahanSampah.jumlahRumahMemilah !== null
          ? Number(pemilahanSampah.jumlahRumahMemilah)
          : null;
      const totalRumah =
        pemilahanSampah.totalJumlahRumahDiRw !== undefined &&
        pemilahanSampah.totalJumlahRumahDiRw !== "" &&
        pemilahanSampah.totalJumlahRumahDiRw !== null
          ? Number(pemilahanSampah.totalJumlahRumahDiRw)
          : null;
      const pctMemilah =
        pemilahanSampah.persentasePemilahan !== undefined &&
        pemilahanSampah.persentasePemilahan !== "" &&
        pemilahanSampah.persentasePemilahan !== null
          ? Number(pemilahanSampah.persentasePemilahan)
          : pemilahanSampah.persentaseRumahMemilah !== undefined &&
              pemilahanSampah.persentaseRumahMemilah !== "" &&
              pemilahanSampah.persentaseRumahMemilah !== null
            ? Number(pemilahanSampah.persentaseRumahMemilah)
            : null;

      await tx.surveiPemilahanSampah.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          jumlahRumahMemilah: jmlMemilah,
          totalJumlahRumahDiRw: totalRumah,
          persentasePemilahan: pctMemilah,
          tingkatPemilahan: pemilahanSampah.tingkatPemilahan ?? null,
          catatan: pemilahanSampah.catatan ?? pemilahanSampah.keteranganPemilahan ?? null,
        },
        update: {
          jumlahRumahMemilah: jmlMemilah,
          totalJumlahRumahDiRw: totalRumah,
          persentasePemilahan: pctMemilah,
          tingkatPemilahan: pemilahanSampah.tingkatPemilahan ?? null,
          catatan: pemilahanSampah.catatan ?? pemilahanSampah.keteranganPemilahan ?? null,
        },
      });
    }

    // 4. Bank Sampah & Pengolahan
    if (bankSampahPengolahan) {
      await tx.surveiBankSampahPengolahan.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          bankSampahAktif:
            bankSampahPengolahan.bankSampahAktif !== undefined &&
            bankSampahPengolahan.bankSampahAktif !== null &&
            bankSampahPengolahan.bankSampahAktif !== ""
              ? Number(bankSampahPengolahan.bankSampahAktif)
              : null,
          bankSampahTidakAktif:
            bankSampahPengolahan.bankSampahTidakAktif !== undefined &&
            bankSampahPengolahan.bankSampahTidakAktif !== null &&
            bankSampahPengolahan.bankSampahTidakAktif !== ""
              ? Number(bankSampahPengolahan.bankSampahTidakAktif)
              : null,
          jumlahUnitKomposter:
            bankSampahPengolahan.jumlahUnitKomposter != null
              ? String(bankSampahPengolahan.jumlahUnitKomposter)
              : null,
          jumlahTitikMaggotBsf:
            bankSampahPengolahan.jumlahTitikMaggotBsf != null
              ? String(bankSampahPengolahan.jumlahTitikMaggotBsf)
              : null,
          bioporiLoseda: bankSampahPengolahan.bioporiLoseda ?? bankSampahPengolahan.losida ?? null,
          ecobrickKerajinanDaurUlang: bankSampahPengolahan.ecobrickKerajinanDaurUlang ?? null,
          buruanSae: bankSampahPengolahan.buruanSae ?? null,
          pengepulMitraDaurUlang: bankSampahPengolahan.pengepulMitraDaurUlang ?? null,
          digitalisasiData: bankSampahPengolahan.digitalisasiData ?? null,
          aktivitasLainnyaKeterangan:
            bankSampahPengolahan.aktivitasLainnyaKeterangan ??
            bankSampahPengolahan.keteranganPengolahan ??
            null,
        },
        update: {
          bankSampahAktif:
            bankSampahPengolahan.bankSampahAktif !== undefined &&
            bankSampahPengolahan.bankSampahAktif !== null &&
            bankSampahPengolahan.bankSampahAktif !== ""
              ? Number(bankSampahPengolahan.bankSampahAktif)
              : null,
          bankSampahTidakAktif:
            bankSampahPengolahan.bankSampahTidakAktif !== undefined &&
            bankSampahPengolahan.bankSampahTidakAktif !== null &&
            bankSampahPengolahan.bankSampahTidakAktif !== ""
              ? Number(bankSampahPengolahan.bankSampahTidakAktif)
              : null,
          jumlahUnitKomposter:
            bankSampahPengolahan.jumlahUnitKomposter != null
              ? String(bankSampahPengolahan.jumlahUnitKomposter)
              : null,
          jumlahTitikMaggotBsf:
            bankSampahPengolahan.jumlahTitikMaggotBsf != null
              ? String(bankSampahPengolahan.jumlahTitikMaggotBsf)
              : null,
          bioporiLoseda: bankSampahPengolahan.bioporiLoseda ?? bankSampahPengolahan.losida ?? null,
          ecobrickKerajinanDaurUlang: bankSampahPengolahan.ecobrickKerajinanDaurUlang ?? null,
          buruanSae: bankSampahPengolahan.buruanSae ?? null,
          pengepulMitraDaurUlang: bankSampahPengolahan.pengepulMitraDaurUlang ?? null,
          digitalisasiData: bankSampahPengolahan.digitalisasiData ?? null,
          aktivitasLainnyaKeterangan:
            bankSampahPengolahan.aktivitasLainnyaKeterangan ??
            bankSampahPengolahan.keteranganPengolahan ??
            null,
        },
      });
    }

    // 5. Volume Sampah
    if (volumeSampah) {
      const volOrganik =
        volumeSampah.organikKgPerHari !== undefined &&
        volumeSampah.organikKgPerHari !== null &&
        volumeSampah.organikKgPerHari !== ""
          ? Number(volumeSampah.organikKgPerHari)
          : volumeSampah.estimasiVolumeOrganikKgHari !== undefined &&
              volumeSampah.estimasiVolumeOrganikKgHari !== null &&
              volumeSampah.estimasiVolumeOrganikKgHari !== ""
            ? Number(volumeSampah.estimasiVolumeOrganikKgHari)
            : null;
      const volAnorganik =
        volumeSampah.anorganikKgPerHari !== undefined &&
        volumeSampah.anorganikKgPerHari !== null &&
        volumeSampah.anorganikKgPerHari !== ""
          ? Number(volumeSampah.anorganikKgPerHari)
          : volumeSampah.estimasiVolumeAnorganikKgHari !== undefined &&
              volumeSampah.estimasiVolumeAnorganikKgHari !== null &&
              volumeSampah.estimasiVolumeAnorganikKgHari !== ""
            ? Number(volumeSampah.estimasiVolumeAnorganikKgHari)
            : null;
      const volResidu =
        volumeSampah.residuKgPerHari !== undefined &&
        volumeSampah.residuKgPerHari !== null &&
        volumeSampah.residuKgPerHari !== ""
          ? Number(volumeSampah.residuKgPerHari)
          : volumeSampah.estimasiVolumeResiduKgHari !== undefined &&
              volumeSampah.estimasiVolumeResiduKgHari !== null &&
              volumeSampah.estimasiVolumeResiduKgHari !== ""
            ? Number(volumeSampah.estimasiVolumeResiduKgHari)
            : null;
      const volTotal =
        volumeSampah.totalVolumeKgPerHari !== undefined &&
        volumeSampah.totalVolumeKgPerHari !== null &&
        volumeSampah.totalVolumeKgPerHari !== ""
          ? Number(volumeSampah.totalVolumeKgPerHari)
          : volumeSampah.estimasiTotalKgHari !== undefined &&
              volumeSampah.estimasiTotalKgHari !== null &&
              volumeSampah.estimasiTotalKgHari !== ""
            ? Number(volumeSampah.estimasiTotalKgHari)
            : null;

      await tx.surveiVolumeSampah.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          organikKgPerHari: volOrganik,
          anorganikKgPerHari: volAnorganik,
          residuKgPerHari: volResidu,
          totalVolumeKgPerHari: volTotal,
          catatan: volumeSampah.catatan ?? null,
        },
        update: {
          organikKgPerHari: volOrganik,
          anorganikKgPerHari: volAnorganik,
          residuKgPerHari: volResidu,
          totalVolumeKgPerHari: volTotal,
          catatan: volumeSampah.catatan ?? null,
        },
      });
    }

    // 6. Catatan Kesimpulan
    if (catatanKesimpulan) {
      await tx.surveiCatatanKesimpulan.upsert({
        where: { kelurahanId },
        create: {
          kelurahanId,
          prioritasIntervensi:
            catatanKesimpulan.prioritasIntervensi ?? catatanKesimpulan.rekomendasiProgram ?? null,
          catatanTambahanRisikoSosial:
            catatanKesimpulan.catatanTambahanRisikoSosial ?? catatanKesimpulan.isuKrusial ?? null,
        },
        update: {
          prioritasIntervensi:
            catatanKesimpulan.prioritasIntervensi ?? catatanKesimpulan.rekomendasiProgram ?? null,
          catatanTambahanRisikoSosial:
            catatanKesimpulan.catatanTambahanRisikoSosial ?? catatanKesimpulan.isuKrusial ?? null,
        },
      });
    }

    // 7. Key Players
    if (keyPlayers !== undefined) {
      await tx.surveiKeyPlayer.deleteMany({
        where: { kelurahanId },
      });

      if (Array.isArray(keyPlayers) && keyPlayers.length > 0) {
        const validKeyPlayers = keyPlayers.filter(
          (kp: any) => kp && (kp.nama || kp.peran || kp.kontak)
        );
        if (validKeyPlayers.length > 0) {
          await tx.surveiKeyPlayer.createMany({
            data: validKeyPlayers.map((kp: any) => ({
              kelurahanId,
              nama: kp.nama || null,
              kontak: kp.kontak || null,
              peran: kp.peran || null,
            })),
          });
        }
      }
    }

    return tx.surveiKelurahan.findUnique({
      where: { kelurahanId },
      include: {
        karakteristikWilayah: true,
        pemilahanSampah: true,
        bankSampahPengolahan: true,
        keyPlayers: true,
        volumeSampah: true,
        catatanKesimpulan: true,
      },
    });
  });
}

export const surveiKknService = {
  parseWorkbook,
  validateData,
  importToDatabase,
  getImportHistory,
  getAllSurveys,
  getSurveyById,
  getMySurvey,
  updateSurvey,
  updateSurveyById: updateSurvey,
};
