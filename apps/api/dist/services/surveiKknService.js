/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import * as XLSX from "xlsx";
import { PrismaClient, ImportStatus } from "@prisma/client";
const prisma = new PrismaClient();
/** Nama sheet wajib ada di workbook */
const REQUIRED_SHEETS = [
    "kelurahan",
    "karakteristik_wilayah",
    "pemilahan_sampah",
    "bank_sampah_pengolahan",
    "key_player",
    "volume_sampah",
    "catatan_kesimpulan",
];
/** Kolom boolean per sheet — nilai 0/1 dari XLSX dikonversi ke boolean */
const BOOL_COLUMNS = {
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
function toBool(v) {
    if (v === null || v === undefined)
        return null;
    return v === 1 || v === true || v === "1";
}
/** Normalisasi kolom boolean pada baris data sheet tertentu */
function normalizeRows(sheet, rows) {
    const boolCols = BOOL_COLUMNS[sheet] || [];
    return rows.map((row) => {
        const clone = { ...row };
        boolCols.forEach((col) => {
            clone[col] = toBool(clone[col]);
        });
        return clone;
    });
}
/**
 * Parse buffer file XLSX menjadi JSON per sheet.
 * Memvalidasi bahwa semua 7 sheet wajib tersedia.
 *
 * @param buffer - Buffer file .xlsx dari multer memory storage
 * @returns Objek berisi array data per sheet
 * @throws Error jika sheet wajib tidak ditemukan
 */
export function parseWorkbook(buffer) {
    const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
    if (missing.length) {
        throw new Error(`Sheet tidak ditemukan: ${missing.join(", ")}`);
    }
    const result = {};
    for (const sheetName of REQUIRED_SHEETS) {
        const ws = wb.Sheets[sheetName];
        // defval: null → sel kosong jadi NULL, bukan hilang dari objek
        result[sheetName] = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
    }
    return result;
}
/**
 * Validasi data hasil parsing sebelum insert ke database.
 * Memeriksa kelurahan_id wajib ada, nama_kelurahan wajib ada,
 * dan foreign key integrity antar sheet.
 *
 * @param data - Data hasil parsing dari parseWorkbook
 * @returns Array pesan error (kosong jika valid)
 */
export function validateData(data) {
    const errors = [];
    data.kelurahan.forEach((row, i) => {
        if (!row.kelurahan_id)
            errors.push(`kelurahan baris ${i + 2}: kelurahan_id kosong`);
        if (!row.nama_kelurahan)
            errors.push(`kelurahan baris ${i + 2}: nama_kelurahan kosong`);
    });
    const validIds = new Set(data.kelurahan.map((r) => r.kelurahan_id));
    const childSheets = [
        "karakteristik_wilayah",
        "pemilahan_sampah",
        "bank_sampah_pengolahan",
        "key_player",
        "volume_sampah",
        "catatan_kesimpulan",
    ];
    childSheets.forEach((sheet) => {
        data[sheet].forEach((row, i) => {
            if (!validIds.has(row.kelurahan_id)) {
                errors.push(`${sheet} baris ${i + 2}: kelurahan_id ${row.kelurahan_id} tidak ada di sheet kelurahan`);
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
export async function importToDatabase(data, userId, filename) {
    const summary = {};
    // Buat import log awal dengan status PENDING
    const importLog = await prisma.importLog.create({
        data: {
            userId,
            filename,
            status: ImportStatus.PENDING,
        },
    });
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Upsert tabel induk: SurveiKelurahan
            for (const row of data.kelurahan) {
                await tx.surveiKelurahan.upsert({
                    where: { kelurahanId: row.kelurahan_id },
                    update: {
                        namaKelurahan: row.nama_kelurahan,
                        kecamatan: row.kecamatan || null,
                        jumlahRw: row.jumlah_rw || null,
                        jumlahRt: row.jumlah_rt || null,
                        tanggalSurvei: row.tanggal_survei ? new Date(row.tanggal_survei) : null,
                        jumlahKk: row.jumlah_kk || null,
                        jumlahRumahTotal: row.jumlah_rumah_total || null,
                        enumerator: row.enumerator || null,
                        titikKumpulMahasiswa: row.titik_kumpul_mahasiswa || null,
                        catatanData: row.catatan_data || null,
                    },
                    create: {
                        kelurahanId: row.kelurahan_id,
                        namaKelurahan: row.nama_kelurahan,
                        kecamatan: row.kecamatan || null,
                        jumlahRw: row.jumlah_rw || null,
                        jumlahRt: row.jumlah_rt || null,
                        tanggalSurvei: row.tanggal_survei ? new Date(row.tanggal_survei) : null,
                        jumlahKk: row.jumlah_kk || null,
                        jumlahRumahTotal: row.jumlah_rumah_total || null,
                        enumerator: row.enumerator || null,
                        titikKumpulMahasiswa: row.titik_kumpul_mahasiswa || null,
                        catatanData: row.catatan_data || null,
                    },
                });
            }
            summary["kelurahan"] = data.kelurahan.length;
            // 2. Child tables: hapus data lama, insert baru
            const kelurahanIds = data.kelurahan.map((r) => r.kelurahan_id);
            // karakteristik_wilayah (1:1)
            const karakteristikRows = normalizeRows("karakteristik_wilayah", data.karakteristik_wilayah);
            await tx.surveiKarakteristikWilayah.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
            for (const row of karakteristikRows) {
                await tx.surveiKarakteristikWilayah.create({
                    data: {
                        kelurahanId: row.kelurahan_id,
                        padatPenduduk: row.padat_penduduk,
                        banyakKosKontrakan: row.banyak_kos_kontrakan,
                        banyakUmkmWarungKafe: row.banyak_umkm_warung_kafe,
                        dekatKampusSekolah: row.dekat_kampus_sekolah,
                        pasar: row.pasar,
                        bantaranSungai: row.bantaran_sungai,
                        karakterLainnyaFlag: row.karakter_lainnya_flag,
                        karakterLainnyaKeterangan: row.karakter_lainnya_keterangan != null ? String(row.karakter_lainnya_keterangan) : null,
                        perkiraanJumlahKosKontrakan: row.perkiraan_jumlah_kos_kontrakan != null ? String(row.perkiraan_jumlah_kos_kontrakan) : null,
                        perkiraanJumlahUmkmWarungKafe: row.perkiraan_jumlah_umkm_warung_kafe != null ? String(row.perkiraan_jumlah_umkm_warung_kafe) : null,
                    },
                });
            }
            summary["karakteristik_wilayah"] = karakteristikRows.length;
            // pemilahan_sampah (1:1)
            await tx.surveiPemilahanSampah.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
            for (const row of data.pemilahan_sampah) {
                await tx.surveiPemilahanSampah.create({
                    data: {
                        kelurahanId: row.kelurahan_id,
                        jumlahRumahMemilah: row.jumlah_rumah_memilah || null,
                        totalJumlahRumahDiRw: row.total_jumlah_rumah_di_rw || null,
                        persentasePemilahan: row.persentase_pemilahan != null ? row.persentase_pemilahan : null,
                        tingkatPemilahan: row.tingkat_pemilahan || null,
                        catatan: row.catatan || null,
                    },
                });
            }
            summary["pemilahan_sampah"] = data.pemilahan_sampah.length;
            // bank_sampah_pengolahan (1:1)
            const bankSampahRows = normalizeRows("bank_sampah_pengolahan", data.bank_sampah_pengolahan);
            await tx.surveiBankSampahPengolahan.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
            for (const row of bankSampahRows) {
                await tx.surveiBankSampahPengolahan.create({
                    data: {
                        kelurahanId: row.kelurahan_id,
                        bankSampahAktif: row.bank_sampah_aktif || null,
                        bankSampahTidakAktif: row.bank_sampah_tidak_aktif || null,
                        jumlahUnitKomposter: row.jumlah_unit_komposter != null ? String(row.jumlah_unit_komposter) : null,
                        jumlahTitikMaggotBsf: row.jumlah_titik_maggot_bsf != null ? String(row.jumlah_titik_maggot_bsf) : null,
                        bioporiLoseda: row.biopori_loseda,
                        ecobrickKerajinanDaurUlang: row.ecobrick_kerajinan_daur_ulang,
                        buruanSae: row.buruan_sae,
                        pengepulMitraDaurUlang: row.pengepul_mitra_daur_ulang,
                        digitalisasiData: row.digitalisasi_data,
                        aktivitasLainnyaKeterangan: row.aktivitas_lainnya_keterangan || null,
                    },
                });
            }
            summary["bank_sampah_pengolahan"] = bankSampahRows.length;
            // key_player (1:N)
            await tx.surveiKeyPlayer.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
            for (const row of data.key_player) {
                await tx.surveiKeyPlayer.create({
                    data: {
                        kelurahanId: row.kelurahan_id,
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
                        kelurahanId: row.kelurahan_id,
                        organikKgPerHari: row.organik_kg_per_hari != null ? row.organik_kg_per_hari : null,
                        anorganikKgPerHari: row.anorganik_kg_per_hari != null ? row.anorganik_kg_per_hari : null,
                        residuKgPerHari: row.residu_kg_per_hari != null ? row.residu_kg_per_hari : null,
                        totalVolumeKgPerHari: row.total_volume_kg_per_hari != null ? row.total_volume_kg_per_hari : null,
                        catatan: row.catatan || null,
                    },
                });
            }
            summary["volume_sampah"] = data.volume_sampah.length;
            // catatan_kesimpulan (1:1)
            await tx.surveiCatatanKesimpulan.deleteMany({ where: { kelurahanId: { in: kelurahanIds } } });
            for (const row of data.catatan_kesimpulan) {
                await tx.surveiCatatanKesimpulan.create({
                    data: {
                        kelurahanId: row.kelurahan_id,
                        prioritasIntervensi: row.prioritas_intervensi || null,
                        catatanTambahanRisikoSosial: row.catatan_tambahan_risiko_sosial || null,
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
                summary: summary,
                rowsImported: totalRows,
            },
        });
        return { summary, importLogId: importLog.id };
    }
    catch (error) {
        // Update import log ke FAILED
        await prisma.importLog.update({
            where: { id: importLog.id },
            data: {
                status: ImportStatus.FAILED,
                errorMessages: [error.message],
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
export async function getImportHistory(limit = 20) {
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
export async function getAllSurveys(page = 1, limit = 10, search = "") {
    const skip = (page - 1) * limit;
    const where = search
        ? {
            namaKelurahan: { contains: search, mode: "insensitive" },
        }
        : {};
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
export async function getSurveyById(kelurahanId) {
    return prisma.surveiKelurahan.findUnique({
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
}
export const surveiKknService = {
    parseWorkbook,
    validateData,
    importToDatabase,
    getImportHistory,
    getAllSurveys,
    getSurveyById,
};
