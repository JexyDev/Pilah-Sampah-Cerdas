/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Frontend API Service for Log Aktivitas DPL
 */

import api from "./api";

export interface DplActivityLogItem {
  id: string;
  dplId: string;
  dplNama: string;
  kelompokId: string;
  kelompokNama: string;
  kelurahan: string;
  tanggal: string;
  tanggalFormatted: string;
  waktuMulai: string;
  waktuSelesai: string;
  waktuLengkap: string;
  kategori: string;
  lokasi: string;
  tempat: string;
  ringkasanAktivitas: string;
  deskripsi: string;
  hasilTindakLanjut: string;
  arahanEvaluasi: string;
  programKerjaId?: string | null;
  programKerjaDeskripsi?: string | null;
  durasiMenit: number;
  durasi: string;
  bukti: string;
  fotoBuktiUrl?: string | null;
  simpanLokasi: boolean;
  status: "DRAF" | "TERKIRIM" | "TERVERIFIKASI" | string;
  pekanKe: number;
  createdAt: string;
}

export interface DplActivityStats {
  totalAktivitas: number;
  bulanIni: number;
  totalDurasi: string;
  totalDurasiJam: number;
  belumDikirim: number;
}

export interface DplActivityLogsResponse {
  stats: DplActivityStats;
  items: DplActivityLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DynamicWeekItem {
  pekanKe: number;
  label: string;
  tahapMinggu: string;
  tanggalRange: string;
  fase?: string;
  kegiatanUtama?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export const dplActivityLogService = {
  /**
   * Mengambil riwayat log aktivitas DPL dengan statistik
   */
  getActivityLogs: async (params?: {
    search?: string;
    groupId?: string;
    kategori?: string;
    status?: string;
    pekanKe?: number;
    page?: number;
    limit?: number;
  }): Promise<DplActivityLogsResponse> => {
    const res = await api.get("/dpl/activity-logs", { params });
    return (
      res.data?.data || {
        stats: { totalAktivitas: 0, bulanIni: 0, totalDurasi: "0 jam", totalDurasiJam: 0, belumDikirim: 0 },
        items: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
      }
    );
  },

  /**
   * Mengambil daftar pekan dinamis (Pekan 1-12) dari relasi backend Timeline KKN
   */
  getTimelineWeeks: async (): Promise<DynamicWeekItem[]> => {
    try {
      const res = await api.get("/timeline-kkn");
      const items = res.data?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        const weeks: DynamicWeekItem[] = [];
        
        // Map items from timeline to weeks
        items.forEach((it: any) => {
          const tm = (it.tahapMinggu || "").trim();
          // Match "Minggu X" or "Pekan X" or "Minggu X dan Y"
          const matchSingle = tm.match(/Minggu\s*(\d+)/i) || tm.match(/Pekan\s*(\d+)/i);
          const matchMulti = tm.match(/Minggu\s*(\d+)\s*dan\s*(\d+)/i);

          if (matchMulti) {
            const w1 = parseInt(matchMulti[1], 10);
            const w2 = parseInt(matchMulti[2], 10);
            weeks.push({
              pekanKe: w1,
              label: `Pekan ${w1} (${it.tanggal || it.fase})`,
              tahapMinggu: it.tahapMinggu,
              tanggalRange: it.tanggal || "",
              fase: it.fase,
              kegiatanUtama: it.kegiatanUtama,
              startDate: it.startDate,
              endDate: it.endDate,
            });
            weeks.push({
              pekanKe: w2,
              label: `Pekan ${w2} (${it.tanggal || it.fase})`,
              tahapMinggu: it.tahapMinggu,
              tanggalRange: it.tanggal || "",
              fase: it.fase,
              kegiatanUtama: it.kegiatanUtama,
              startDate: it.startDate,
              endDate: it.endDate,
            });
          } else if (matchSingle) {
            const w = parseInt(matchSingle[1], 10);
            weeks.push({
              pekanKe: w,
              label: `Pekan ${w} (${it.tanggal || it.fase})`,
              tahapMinggu: it.tahapMinggu,
              tanggalRange: it.tanggal || "",
              fase: it.fase,
              kegiatanUtama: it.kegiatanUtama,
              startDate: it.startDate,
              endDate: it.endDate,
            });
          }
        });

        if (weeks.length > 0) {
          // Sort by pekanKe and deduplicate
          const uniqueMap = new Map<number, DynamicWeekItem>();
          weeks.forEach((w) => {
            if (!uniqueMap.has(w.pekanKe)) {
              uniqueMap.set(w.pekanKe, w);
            }
          });
          return Array.from(uniqueMap.values()).sort((a, b) => a.pekanKe - b.pekanKe);
        }
      }
    } catch (err) {
      console.warn("Gagal mengambil timeline backend, menggunakan fallback 12 pekan default:", err);
    }

    // Fallback standard 1-12 pekan jika backend offline/kosong
    const fallbackWeeks: DynamicWeekItem[] = [
      { pekanKe: 1, label: "Pekan 1 (12 - 18 Agustus 2026)", tahapMinggu: "Minggu 1", tanggalRange: "12 - 18 Agustus 2026", kegiatanUtama: "Kick Off & Penerjunan" },
      { pekanKe: 2, label: "Pekan 2 (19 - 25 Agustus 2026)", tahapMinggu: "Minggu 2", tanggalRange: "19 - 25 Agustus 2026", kegiatanUtama: "Observasi & Pembuatan Proposal" },
      { pekanKe: 3, label: "Pekan 3 (26 Agustus - 1 September 2026)", tahapMinggu: "Minggu 3", tanggalRange: "26 Agustus - 1 September 2026", kegiatanUtama: "Finalisasi Matrik & Pilot Project" },
      { pekanKe: 4, label: "Pekan 4 (2 - 8 September 2026)", tahapMinggu: "Minggu 4", tanggalRange: "2 - 8 September 2026", kegiatanUtama: "Distribusi Sarana & Aktivasi QR" },
      { pekanKe: 5, label: "Pekan 5 (9 - 15 September 2026)", tahapMinggu: "Minggu 5", tanggalRange: "9 - 15 September 2026", kegiatanUtama: "Uji Coba Aplikasi & Edukasi Warga" },
      { pekanKe: 6, label: "Pekan 6 (16 - 22 September 2026)", tahapMinggu: "Minggu 6", tanggalRange: "16 - 22 September 2026", kegiatanUtama: "Perluasan Program ke Seluruh RW" },
      { pekanKe: 7, label: "Pekan 7 (23 - 29 September 2026)", tahapMinggu: "Minggu 7", tanggalRange: "23 - 29 September 2026", kegiatanUtama: "Aktivasi Leaderboard & Bank Sampah" },
      { pekanKe: 8, label: "Pekan 8 (30 September - 6 Oktober 2026)", tahapMinggu: "Minggu 8", tanggalRange: "30 September - 6 Oktober 2026", kegiatanUtama: "Pendampingan Pengangkutan IoT & Kompos" },
      { pekanKe: 9, label: "Pekan 9 (7 - 13 Oktober 2026)", tahapMinggu: "Minggu 9", tanggalRange: "7 - 13 Oktober 2026", kegiatanUtama: "Operasional Bank Sampah & POC" },
      { pekanKe: 10, label: "Pekan 10 (14 - 20 Oktober 2026)", tahapMinggu: "Minggu 10", tanggalRange: "14 - 20 Oktober 2026", kegiatanUtama: "Mitigasi & Edukasi Lanjutan" },
      { pekanKe: 11, label: "Pekan 11 (21 - 27 Oktober 2026)", tahapMinggu: "Minggu 11", tanggalRange: "21 - 27 Oktober 2026", kegiatanUtama: "Optimalisasi Rute & SOP Kelembagaan" },
      { pekanKe: 12, label: "Pekan 12 (28 - 31 Oktober 2026)", tahapMinggu: "Minggu 12", tanggalRange: "28 - 31 Oktober 2026", kegiatanUtama: "Evaluasi, Laporan Akhir & Penutupan" },
    ];
    return fallbackWeeks;
  },

  /**
   * Menyimpan aktivitas DPL baru (Draf atau Terkirim)
   */
  createActivityLog: async (data: FormData | Record<string, any>) => {
    const res = await api.post("/dpl/activity-logs", data);
    return res.data;
  },

  /**
   * Memperbarui aktivitas DPL (Edit Draf atau Kirim)
   */
  updateActivityLog: async (id: string, data: FormData | Record<string, any>) => {
    const res = await api.put(`/dpl/activity-logs/${id}`, data);
    return res.data;
  },

  /**
   * Menghapus aktivitas DPL
   */
  deleteActivityLog: async (id: string) => {
    const res = await api.delete(`/dpl/activity-logs/${id}`);
    return res.data;
  },
};
