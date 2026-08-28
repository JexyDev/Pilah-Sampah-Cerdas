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
  updatedAt?: string;
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
    // 12 Pekan Acuan Resmi KKN Coblong 2026 dengan rentang tanggal presisi
    const standardCalendar: Record<number, { tanggalRange: string; startDate: string; endDate: string; kegiatanUtama: string }> = {
      1: { tanggalRange: "12 - 18 Agustus 2026", startDate: "2026-08-12T00:00:00.000Z", endDate: "2026-08-18T23:59:59.000Z", kegiatanUtama: "Kick Off & Penerjunan Posko" },
      2: { tanggalRange: "19 - 25 Agustus 2026", startDate: "2026-08-19T00:00:00.000Z", endDate: "2026-08-25T23:59:59.000Z", kegiatanUtama: "Observasi Lapangan & Matrik Proker" },
      3: { tanggalRange: "26 Agustus - 1 September 2026", startDate: "2026-08-26T00:00:00.000Z", endDate: "2026-09-01T23:59:59.000Z", kegiatanUtama: "Finalisasi Matrik & Pilot RT Percontohan" },
      4: { tanggalRange: "2 - 8 September 2026", startDate: "2026-09-02T00:00:00.000Z", endDate: "2026-09-08T23:59:59.000Z", kegiatanUtama: "Distribusi Sarana & Aktivasi QR Code" },
      5: { tanggalRange: "9 - 15 September 2026", startDate: "2026-09-09T00:00:00.000Z", endDate: "2026-09-15T23:59:59.000Z", kegiatanUtama: "Uji Coba Aplikasi & Edukasi Warga Door-to-Door" },
      6: { tanggalRange: "16 - 22 September 2026", startDate: "2026-09-16T00:00:00.000Z", endDate: "2026-09-22T23:59:59.000Z", kegiatanUtama: "Perluasan Program ke Seluruh RW" },
      7: { tanggalRange: "23 - 29 September 2026", startDate: "2026-09-23T00:00:00.000Z", endDate: "2026-09-29T23:59:59.000Z", kegiatanUtama: "Aktivasi Leaderboard & Bank Sampah" },
      8: { tanggalRange: "30 September - 6 Oktober 2026", startDate: "2026-09-30T00:00:00.000Z", endDate: "2026-10-06T23:59:59.000Z", kegiatanUtama: "Pendampingan Pengangkutan IoT & Kompos" },
      9: { tanggalRange: "7 - 13 Oktober 2026", startDate: "2026-10-07T00:00:00.000Z", endDate: "2026-10-13T23:59:59.000Z", kegiatanUtama: "Operasional Bank Sampah & POC" },
      10: { tanggalRange: "14 - 20 Oktober 2026", startDate: "2026-10-14T00:00:00.000Z", endDate: "2026-10-20T23:59:59.000Z", kegiatanUtama: "Mitigasi & Penguatan Kelembagaan TPS 3R" },
      11: { tanggalRange: "21 - 27 Oktober 2026", startDate: "2026-10-21T00:00:00.000Z", endDate: "2026-10-27T23:59:59.000Z", kegiatanUtama: "Optimalisasi Rute & SOP Pengelolaan" },
      12: { tanggalRange: "28 - 31 Oktober 2026", startDate: "2026-10-28T00:00:00.000Z", endDate: "2026-10-31T23:59:59.000Z", kegiatanUtama: "Konsolidasi Capaian, Laporan Akhir & Penutupan" },
    };

    try {
      const res = await api.get("/timeline-kkn");
      const items = res.data?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        const weeksMap = new Map<number, DynamicWeekItem>();

        // Map items from database timeline to weeks
        items.forEach((it: any) => {
          const tm = (it.tahapMinggu || "").trim();
          
          // Pola: "Minggu 6 dan 7", "Minggu 10 dan 11"
          const matchDan = tm.match(/Minggu\s*(\d+)\s*dan\s*(\d+)/i);
          // Pola: "Minggu 3 - 4", "Minggu 5 - 8"
          const matchRange = tm.match(/Minggu\s*(\d+)\s*[-–]\s*(\d+)/i);
          // Pola: "Minggu 1", "Pekan 2"
          const matchSingle = tm.match(/Minggu\s*(\d+)/i) || tm.match(/Pekan\s*(\d+)/i);

          if (matchDan) {
            const w1 = parseInt(matchDan[1], 10);
            const w2 = parseInt(matchDan[2], 10);
            [w1, w2].forEach((w) => {
              const std = standardCalendar[w];
              weeksMap.set(w, {
                pekanKe: w,
                label: `Pekan ${w} - ${std?.tanggalRange || it.tanggal}`,
                tahapMinggu: `Minggu ${w}`,
                tanggalRange: std?.tanggalRange || it.tanggal,
                fase: it.fase,
                kegiatanUtama: it.kegiatanUtama || std?.kegiatanUtama,
                startDate: std?.startDate || it.startDate,
                endDate: std?.endDate || it.endDate,
              });
            });
          } else if (matchRange) {
            const startW = parseInt(matchRange[1], 10);
            const endW = parseInt(matchRange[2], 10);
            for (let w = startW; w <= endW; w++) {
              const std = standardCalendar[w];
              weeksMap.set(w, {
                pekanKe: w,
                label: `Pekan ${w} - ${std?.tanggalRange || it.tanggal}`,
                tahapMinggu: `Minggu ${w}`,
                tanggalRange: std?.tanggalRange || it.tanggal,
                fase: it.fase,
                kegiatanUtama: it.kegiatanUtama || std?.kegiatanUtama,
                startDate: std?.startDate || it.startDate,
                endDate: std?.endDate || it.endDate,
              });
            }
          } else if (matchSingle) {
            const w = parseInt(matchSingle[1], 10);
            const std = standardCalendar[w];
            weeksMap.set(w, {
              pekanKe: w,
              label: `Pekan ${w} - ${std?.tanggalRange || it.tanggal}`,
              tahapMinggu: `Minggu ${w}`,
              tanggalRange: std?.tanggalRange || it.tanggal,
              fase: it.fase,
              kegiatanUtama: it.kegiatanUtama || std?.kegiatanUtama,
              startDate: it.startDate || std?.startDate,
              endDate: it.endDate || std?.endDate,
            });
          }
        });

        // Pastikan seluruh 1-12 pekan terisi lengkap
        for (let w = 1; w <= 12; w++) {
          if (!weeksMap.has(w)) {
            const std = standardCalendar[w];
            weeksMap.set(w, {
              pekanKe: w,
              label: `Pekan ${w} - ${std.tanggalRange}`,
              tahapMinggu: `Minggu ${w}`,
              tanggalRange: std.tanggalRange,
              fase: "Pelaksanaan KKN",
              kegiatanUtama: std.kegiatanUtama,
              startDate: std.startDate,
              endDate: std.endDate,
            });
          }
        }

        return Array.from(weeksMap.values()).sort((a, b) => a.pekanKe - b.pekanKe);
      }
    } catch (err) {
      console.warn("Gagal mengambil timeline backend, menggunakan fallback acuan 12 pekan:", err);
    }

    // Fallback standard 1-12 pekan lengkap
    return Object.entries(standardCalendar).map(([key, val]) => {
      const w = parseInt(key, 10);
      return {
        pekanKe: w,
        label: `Pekan ${w} - ${val.tanggalRange}`,
        tahapMinggu: `Minggu ${w}`,
        tanggalRange: val.tanggalRange,
        fase: "Pelaksanaan KKN",
        kegiatanUtama: val.kegiatanUtama,
        startDate: val.startDate,
        endDate: val.endDate,
      };
    });
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
