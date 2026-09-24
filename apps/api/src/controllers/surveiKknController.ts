/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { surveiKknService } from "../services/surveiKknService.js";

export class SurveiKknController {
  /**
   * POST /api/v1/survei-kkn/import
   * Upload dan impor file XLSX survei KKN ke database.
   */
  async importSurveiKkn(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "File tidak ditemukan. Silakan upload file .xlsx",
        });
        return;
      }

      // 1. Parse workbook
      const data = surveiKknService.parseWorkbook(req.file.buffer);

      // 2. Validasi data
      const errors = surveiKknService.validateData(data);
      if (errors.length) {
        res.status(422).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Validasi data gagal",
          errors,
        });
        return;
      }

      // 3. Import ke database
      const userId = req.user!.userId;
      const filename = req.file.originalname;
      const surveyType = ((req.query.type || req.query.tipe) as string) || "BASELINE";
      const result = await surveiKknService.importToDatabase(data, userId, filename, surveyType);

      res.status(200).json({
        success: true,
        message: `Impor data survei KKN (${surveyType}) berhasil`,
        data: {
          importLogId: result.importLogId,
          summary: result.summary,
        },
      });
    } catch (error: any) {
      console.error("[surveiKknController] importSurveiKkn error:", error);

      if (error.message?.includes("Sheet tidak ditemukan")) {
        res.status(422).json({
          success: false,
          error: "INVALID_FORMAT",
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mengimpor data survei KKN",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/import/history
   * Ambil riwayat impor survei KKN.
   */
  async getImportHistory(_req: Request, res: Response): Promise<void> {
    try {
      const history = await surveiKknService.getImportHistory();
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      console.error("[surveiKknController] getImportHistory error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat riwayat impor",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/template
   * Download file template XLSX survei KKN.
   */
  async downloadTemplate(_req: Request, res: Response): Promise<void> {
    try {
      // Cari template di beberapa lokasi yang mungkin
      const possiblePaths = [
        path.resolve("docs/raw_data_terbaru.xlsx"),
        path.resolve("../../docs/raw_data_terbaru.xlsx"),
        path.resolve("docs/raw_new_data.xlsx"),
        path.resolve("../../docs/raw_new_data.xlsx"),
      ];

      let templatePath: string | null = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }

      if (!templatePath) {
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();

        // 1. Sheet: kelurahan
        const kelurahanRows = [
          { kelurahan_id: 1, nama_kelurahan: "Cipaganti", kecamatan: "Coblong", tanggal_survei: "2026-07-15", enumerator: "Enumerator Cipaganti", jumlah_rw: 7, jumlah_rt: 52, jumlah_kk: 1200, jumlah_rumah_total: 1100, titik_kumpul_mahasiswa: "Kantor Kelurahan Cipaganti", catatan_data: "Baseline profil wilayah" },
          { kelurahan_id: 2, nama_kelurahan: "Dago", kecamatan: "Coblong", tanggal_survei: "2026-07-14", enumerator: "Taufik", jumlah_rw: 13, jumlah_rt: 105, jumlah_kk: 2500, jumlah_rumah_total: 2400, titik_kumpul_mahasiswa: "Posko KKN Dago", catatan_data: "" },
          { kelurahan_id: 3, nama_kelurahan: "Lebak Gede", kecamatan: "Coblong", tanggal_survei: "2026-07-15", enumerator: "Hardiansyah", jumlah_rw: 13, jumlah_rt: 64, jumlah_kk: 1800, jumlah_rumah_total: 1750, titik_kumpul_mahasiswa: "Posko KKN Lebak Gede", catatan_data: "" },
          { kelurahan_id: 4, nama_kelurahan: "Lebak Siliwangi", kecamatan: "Coblong", tanggal_survei: "2026-07-15", enumerator: "Setiadi", jumlah_rw: 6, jumlah_rt: 21, jumlah_kk: 900, jumlah_rumah_total: 850, titik_kumpul_mahasiswa: "Posko KKN Lebak Siliwangi", catatan_data: "" },
          { kelurahan_id: 5, nama_kelurahan: "Sadang Serang", kecamatan: "Coblong", tanggal_survei: "2026-07-01", enumerator: "Ayu Kusumawati", jumlah_rw: 21, jumlah_rt: 130, jumlah_kk: 3500, jumlah_rumah_total: 3400, titik_kumpul_mahasiswa: "Posko KKN Sadang Serang", catatan_data: "" },
          { kelurahan_id: 6, nama_kelurahan: "Sekeloa", kecamatan: "Coblong", tanggal_survei: "2026-07-13", enumerator: "Nugi", jumlah_rw: 16, jumlah_rt: 93, jumlah_kk: 2800, jumlah_rumah_total: 2700, titik_kumpul_mahasiswa: "Posko KKN Sekeloa", catatan_data: "" },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kelurahanRows), "kelurahan");

        // 2. Sheet: karakteristik_wilayah
        const karakteristikRows = [
          { kelurahan_id: 1, padat_penduduk: 1, banyak_kos_kontrakan: 1, banyak_umkm_warung_kafe: 1, dekat_kampus_sekolah: 1, pasar: 0, bantaran_sungai: 0, karakter_lainnya_flag: 0, karakter_lainnya_keterangan: "", perkiraan_jumlah_kos_kontrakan: "50-100", perkiraan_jumlah_umkm_warung_kafe: "30-50" },
          { kelurahan_id: 2, padat_penduduk: 1, banyak_kos_kontrakan: 1, banyak_umkm_warung_kafe: 1, dekat_kampus_sekolah: 1, pasar: 1, bantaran_sungai: 1, karakter_lainnya_flag: 0, karakter_lainnya_keterangan: "", perkiraan_jumlah_kos_kontrakan: "100+", perkiraan_jumlah_umkm_warung_kafe: "50+" },
          { kelurahan_id: 3, padat_penduduk: 1, banyak_kos_kontrakan: 1, banyak_umkm_warung_kafe: 0, dekat_kampus_sekolah: 1, pasar: 0, bantaran_sungai: 0, karakter_lainnya_flag: 0, karakter_lainnya_keterangan: "", perkiraan_jumlah_kos_kontrakan: "30-50", perkiraan_jumlah_umkm_warung_kafe: "10-20" },
          { kelurahan_id: 4, padat_penduduk: 0, banyak_kos_kontrakan: 0, banyak_umkm_warung_kafe: 1, dekat_kampus_sekolah: 1, pasar: 0, bantaran_sungai: 0, karakter_lainnya_flag: 0, karakter_lainnya_keterangan: "", perkiraan_jumlah_kos_kontrakan: "<20", perkiraan_jumlah_umkm_warung_kafe: "20-30" },
          { kelurahan_id: 5, padat_penduduk: 1, banyak_kos_kontrakan: 1, banyak_umkm_warung_kafe: 1, dekat_kampus_sekolah: 1, pasar: 1, bantaran_sungai: 1, karakter_lainnya_flag: 0, karakter_lainnya_keterangan: "", perkiraan_jumlah_kos_kontrakan: "100+", perkiraan_jumlah_umkm_warung_kafe: "50+" },
          { kelurahan_id: 6, padat_penduduk: 1, banyak_kos_kontrakan: 1, banyak_umkm_warung_kafe: 1, dekat_kampus_sekolah: 1, pasar: 1, bantaran_sungai: 1, karakter_lainnya_flag: 0, karakter_lainnya_keterangan: "", perkiraan_jumlah_kos_kontrakan: "100+", perkiraan_jumlah_umkm_warung_kafe: "50+" },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(karakteristikRows), "karakteristik_wilayah");

        // 3. Sheet: pemilahan_sampah
        const pemilahanRows = [
          { kelurahan_id: 1, jumlah_rumah_memilah: 150, total_jumlah_rumah_di_rw: 1100, persentase_pemilahan: 0.1367, tingkat_pemilahan: "Rendah", catatan: "Baseline pemilahan Cipaganti" },
          { kelurahan_id: 2, jumlah_rumah_memilah: 240, total_jumlah_rumah_di_rw: 2400, persentase_pemilahan: 0.1000, tingkat_pemilahan: "Rendah", catatan: "Survei Dago" },
          { kelurahan_id: 3, jumlah_rumah_memilah: 388, total_jumlah_rumah_di_rw: 1750, persentase_pemilahan: 0.2160, tingkat_pemilahan: "Sedang", catatan: "Survei Lebak Gede" },
          { kelurahan_id: 4, jumlah_rumah_memilah: 127, total_jumlah_rumah_di_rw: 850, persentase_pemilahan: 0.1500, tingkat_pemilahan: "Sedang", catatan: "Survei Lebak Siliwangi" },
          { kelurahan_id: 5, jumlah_rumah_memilah: 843, total_jumlah_rumah_di_rw: 3400, persentase_pemilahan: 0.2480, tingkat_pemilahan: "Sedang", catatan: "Survei Sadang Serang" },
          { kelurahan_id: 6, jumlah_rumah_memilah: 480, total_jumlah_rumah_di_rw: 2700, persentase_pemilahan: 0.1780, tingkat_pemilahan: "Sedang", catatan: "Survei Sekeloa" },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pemilahanRows), "pemilahan_sampah");

        // 4. Sheet: bank_sampah_pengolahan
        const bankSampahRows = [
          { kelurahan_id: 1, bank_sampah_aktif: 1, bank_sampah_tidak_aktif: 0, jumlah_unit_komposter: "2", jumlah_titik_maggot_bsf: "1", biopori_loseda: 1, ecobrick_kerajinan_daur_ulang: 0, buruan_sae: 1, pengepul_mitra_daur_ulang: 1, digitalisasi_data: 0, aktivitas_lainnya_keterangan: "" },
          { kelurahan_id: 2, bank_sampah_aktif: 2, bank_sampah_tidak_aktif: 1, jumlah_unit_komposter: "3", jumlah_titik_maggot_bsf: "0", biopori_loseda: 1, ecobrick_kerajinan_daur_ulang: 1, buruan_sae: 1, pengepul_mitra_daur_ulang: 1, digitalisasi_data: 1, aktivitas_lainnya_keterangan: "" },
          { kelurahan_id: 3, bank_sampah_aktif: 1, bank_sampah_tidak_aktif: 0, jumlah_unit_komposter: "1", jumlah_titik_maggot_bsf: "0", biopori_loseda: 1, ecobrick_kerajinan_daur_ulang: 0, buruan_sae: 0, pengepul_mitra_daur_ulang: 1, digitalisasi_data: 0, aktivitas_lainnya_keterangan: "" },
          { kelurahan_id: 4, bank_sampah_aktif: 1, bank_sampah_tidak_aktif: 0, jumlah_unit_komposter: "2", jumlah_titik_maggot_bsf: "1", biopori_loseda: 1, ecobrick_kerajinan_daur_ulang: 1, buruan_sae: 1, pengepul_mitra_daur_ulang: 1, digitalisasi_data: 0, aktivitas_lainnya_keterangan: "" },
          { kelurahan_id: 5, bank_sampah_aktif: 3, bank_sampah_tidak_aktif: 1, jumlah_unit_komposter: "5", jumlah_titik_maggot_bsf: "2", biopori_loseda: 1, ecobrick_kerajinan_daur_ulang: 1, buruan_sae: 1, pengepul_mitra_daur_ulang: 1, digitalisasi_data: 1, aktivitas_lainnya_keterangan: "" },
          { kelurahan_id: 6, bank_sampah_aktif: 2, bank_sampah_tidak_aktif: 0, jumlah_unit_komposter: "4", jumlah_titik_maggot_bsf: "1", biopori_loseda: 1, ecobrick_kerajinan_daur_ulang: 1, buruan_sae: 1, pengepul_mitra_daur_ulang: 1, digitalisasi_data: 1, aktivitas_lainnya_keterangan: "" },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bankSampahRows), "bank_sampah_pengolahan");

        // 5. Sheet: key_player
        const keyPlayerRows = [
          { kelurahan_id: 1, jenis_aktor: "Ketua RW", nama: "Bpk. Rahmat", kontak: "081234567890", peran: "Koordinator Lingkungan RW 03" },
          { kelurahan_id: 2, jenis_aktor: "Pengurus Bank Sampah", nama: "Ibu Siti", kontak: "081234567891", peran: "Ketua Bank Sampah Dago Mandiri" },
          { kelurahan_id: 3, jenis_aktor: "Kader PKK", nama: "Ibu Eni", kontak: "081234567892", peran: "Penggerak Pemilahan Dapur" },
          { kelurahan_id: 4, jenis_aktor: "Ketua RT", nama: "Bpk. Hendra", kontak: "081234567893", peran: "Edukasi Warga Kos" },
          { kelurahan_id: 5, jenis_aktor: "Pengepul", nama: "Bpk. Ujang", kontak: "081234567894", peran: "Mitra Penyerapan Anorganik" },
          { kelurahan_id: 6, jenis_aktor: "Koordinator Karang Taruna", nama: "Ahmad", kontak: "081234567895", peran: "Sosialisasi Pemuda" },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(keyPlayerRows), "key_player");

        // 6. Sheet: volume_sampah
        const volumeRows = [
          { kelurahan_id: 1, organik_kg_per_hari: 15.5, anorganik_kg_per_hari: 6.29, residu_kg_per_hari: 5.0, total_volume_kg_per_hari: 26.79, catatan: "Baseline estimasi harian" },
          { kelurahan_id: 2, organik_kg_per_hari: 350.0, anorganik_kg_per_hari: 150.0, residu_kg_per_hari: 100.0, total_volume_kg_per_hari: 600.0, catatan: "Baseline Dago" },
          { kelurahan_id: 3, organik_kg_per_hari: 175.0, anorganik_kg_per_hari: 75.0, residu_kg_per_hari: 50.0, total_volume_kg_per_hari: 300.0, catatan: "Baseline Lebak Gede" },
          { kelurahan_id: 4, organik_kg_per_hari: 7.0, anorganik_kg_per_hari: 3.0, residu_kg_per_hari: 2.0, total_volume_kg_per_hari: 12.0, catatan: "Baseline Lebak Siliwangi" },
          { kelurahan_id: 5, organik_kg_per_hari: 5100.0, anorganik_kg_per_hari: 2198.5, residu_kg_per_hari: 1500.0, total_volume_kg_per_hari: 8798.5, catatan: "Baseline Sadang Serang" },
          { kelurahan_id: 6, organik_kg_per_hari: 6800.0, anorganik_kg_per_hari: 2923.4, residu_kg_per_hari: 2000.0, total_volume_kg_per_hari: 11723.4, catatan: "Baseline Sekeloa" },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(volumeRows), "volume_sampah");

        // 7. Sheet: catatan_kesimpulan
        const kesimpulanRows = [
          { kelurahan_id: 1, potensi_masalah: "Kawasan padat hunian dan rumah kos", faktor_pendukung: "Antusiasme pengurus RW", rekomendasi_intervensi_kkn: "Sosialisasi door-to-door dan pendampingan biopori", rekomendasi_program_unggulan: "Edukasi Pemilahan Rumah Kos" },
          { kelurahan_id: 2, potensi_masalah: "Volume sampah kafe/kuliner tinggi", faktor_pendukung: "Bank sampah aktif", rekomendasi_intervensi_kkn: "Kerja sama pemilahan sisa makanan", rekomendasi_program_unggulan: "Optimalisasi Bank Sampah" },
          { kelurahan_id: 3, potensi_masalah: "Akses jalan sempit untuk gerobak", faktor_pendukung: "Loseda telah berjalan", rekomendasi_intervensi_kkn: "Perbanyakan titik loseda organik", rekomendasi_program_unggulan: "Gerakan Loseda Mandiri" },
          { kelurahan_id: 4, potensi_masalah: "Banyak kos mahasiswa pasif", faktor_pendukung: "Dukungan perangkat kelurahan", rekomendasi_intervensi_kkn: "Sticker edukasi di pintu kos", rekomendasi_program_unggulan: "Kos Sadar Sampah" },
          { kelurahan_id: 5, potensi_masalah: "Volume timbulan sampah sangat besar", faktor_pendukung: "Komposter dan maggot BSF tersedia", rekomendasi_intervensi_kkn: "Peningkatan kapasitas pengolahan organik", rekomendasi_program_unggulan: "Sentra Maggot Coblong" },
          { kelurahan_id: 6, potensi_masalah: "Bantaran sungai rawan pembuangan liar", faktor_pendukung: "Partisipasi pemuda aktif", rekomendasi_intervensi_kkn: "Pembersihan sungai dan penegakan jadwal buang", rekomendasi_program_unggulan: "Jaga Sungai Coblong" },
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kesimpulanRows), "catatan_kesimpulan");

        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="template_survei_kkn.xlsx"'
        );
        res.status(200).send(buf);
        return;
      }

      res.download(templatePath, "template_survei_kkn.xlsx", (err) => {
        if (err) {
          console.error("[surveiKknController] downloadTemplate error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: "INTERNAL_SERVER_ERROR",
              message: "Gagal mengunduh file template",
            });
          }
        }
      });
    } catch (error: any) {
      console.error("[surveiKknController] downloadTemplate error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mengunduh template",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/
   * Ambil daftar survei dengan paginasi dan pencarian.
   */
  async getAllSurveys(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const role = req.user?.role;
      const userId = req.user?.userId;

      const result = await surveiKknService.getAllSurveys(page, limit, search, role, userId);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      console.error("[surveiKknController] getAllSurveys error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat data survei",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/:id
   * Ambil detail survei beserta relasinya berdasarkan ID kelurahan.
   */
  async getSurveyById(req: Request, res: Response): Promise<void> {
    try {
      const kelurahanId = parseInt(req.params.id);
      if (isNaN(kelurahanId)) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kelurahan tidak valid",
        });
        return;
      }

      const role = (req as any).user?.role;
      const userId = (req as any).user?.userId || (req as any).user?.id;

      const survey = await surveiKknService.getSurveyById(kelurahanId, role, userId);

      if (!survey) {
        res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "Data survei tidak ditemukan",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: survey,
      });
    } catch (error: any) {
      console.error("[surveiKknController] getSurveyById error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message:
            "Anda tidak memiliki hak akses untuk melihat data survei kelurahan di luar wilayah binaan Anda",
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat detail survei",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/mahasiswa/my-survei
   * Ambil data survei kelurahan berdasarkan kelurahan yang di-assign ke Mahasiswa KKN.
   */
  async getMySurvey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Akses ditolak, user tidak valid",
        });
        return;
      }

      const survey = await surveiKknService.getMySurvey(userId);

      if (!survey) {
        res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "Data survei tidak ditemukan untuk wilayah penugasan Anda",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: survey,
      });
    } catch (error: any) {
      console.error("[surveiKknController] getMySurvey error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat detail survei mahasiswa",
      });
    }
  }

  /**
   * PUT /api/v1/survei-kkn/:id
   * Update data survei kelurahan beserta seluruh relasinya
   */
  async updateSurvey(req: Request, res: Response): Promise<void> {
    try {
      const kelurahanId = parseInt(req.params.id);
      if (isNaN(kelurahanId)) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kelurahan tidak valid",
        });
        return;
      }

      const role = req.user?.role;
      const userId = req.user?.userId;
      const payload = req.body;

      const updated = await surveiKknService.updateSurvey(kelurahanId, payload, role, userId);

      res.status(200).json({
        success: true,
        message: "Data survei berhasil diperbarui",
        data: updated,
      });
    } catch (error: any) {
      console.error("[surveiKknController] updateSurvey error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({
          success: false,
          message: "Akses ditolak: Survei ini bukan milik kelompok KKN Anda.",
        });
        return;
      }
      if (error.message === "NOT_FOUND") {
        res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "Data survei kelurahan tidak ditemukan",
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memperbarui data survei",
      });
    }
  }

  async updateSurveyById(req: Request, res: Response): Promise<void> {
    return this.updateSurvey(req, res);
  }
}

export const surveiKknController = new SurveiKknController();
