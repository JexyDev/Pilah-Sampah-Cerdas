/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import api from "../../utils/api";

/** Shape fasilitas yang dikembalikan oleh backend gisEksekutifService */
export interface GisFacilityDto {
  id: string;
  nama: string;
  tipe: string;
  lat: number;
  lng: number;
  kel: string;
  rw: string;
  pic?: string | null;
  foto?: string | null;
  kontak?: string | null;
  kapasitas?: number | null;
  alamat?: string | null;
  statusApproval?: string;
}

/** Shape sensor CH₄ yang dikembalikan oleh backend gisEksekutifService */
export interface GisSensorDto {
  id: string;
  label: string;
  lokasi: string;
  kel: string;
  rw: string;
  lat: number;
  lng: number;
  ch4Ppm: number | null;
  status: "Online" | "Offline";
  updatedAt: string;
  keterangan: string;
}

export interface GisOverviewApiResponse {
  success: boolean;
  meta: {
    wilayah: string;
    periode: string;
    kelurahanFilter: string;
    rwFilter: string;
    timestamp: string;
  };
  filterOptions: {
    kelurahans: string[];
    rws: string[];
    periodes: string[];
    tipeFasilitas: string[];
  };
  kpi: {
    fasilitasTerdata: number;
    fasilitasSubtext: string;
    volumeTotal: number;
    volumeGrowthPercent: number;
    volumeUnit: string;
    kepatuhanPemilahan: number;
    kepatuhanDeltaPoin: number;
    sensorCh4OnlineCount: number;
    sensorCh4TotalCount: number;
    sensorCh4Text: string;
  };
  komposisiVolume: {
    organik: { persen: number; volumeM3: number };
    anorganik: { persen: number; volumeM3: number };
    residu: { persen: number; volumeM3: number };
    totalM3: number;
  };
  trenBulanan: Array<{ bulan: string; volume: number }>;
  kepatuhanPerKelurahan: Array<{
    nama: string;
    kepatuhan: number;
    volume: number;
    totalFasilitas: number;
    color: string;
  }>;
  pemantauanCh4: {
    rentangText: string;
    titikPengukuranCount: number;
    titikPengukuranText: string;
    sensors: GisSensorDto[];
  };
  titikFasilitas: GisFacilityDto[];
  poligonKelurahan: Array<{
    nama: string;
    coordinates: [number, number][];
    kepatuhan: number;
    volume: number;
    totalFasilitas: number;
    color: string;
  }>;
}

export const gisEksekutifApi = {
  /**
   * Mengambil data overview lengkap GIS Eksekutif dari Database
   */
  async getOverview(params: {
    kelurahan?: string;
    rw?: string;
    periode?: string;
    jenisFasilitas?: string;
    search?: string;
  }): Promise<GisOverviewApiResponse> {
    const queryParams = new URLSearchParams();
    if (params.kelurahan && params.kelurahan !== "Semua") {
      queryParams.set("kelurahan", params.kelurahan);
    }
    if (params.rw && params.rw !== "Semua") {
      queryParams.set("rw", params.rw);
    }
    if (params.periode) {
      queryParams.set("periode", params.periode);
    }
    if (params.jenisFasilitas && params.jenisFasilitas !== "Semua") {
      queryParams.set("jenisFasilitas", params.jenisFasilitas);
    }
    if (params.search) {
      queryParams.set("search", params.search);
    }

    const res = await api.get<{ success: boolean; data: GisOverviewApiResponse }>(
      `/gis-eksekutif/overview?${queryParams.toString()}`
    );
    return res.data.data;
  },

  /**
   * Mengunduh ekspor CSV dinamis langsung dari backend API
   */
  async downloadCsv(type: "kelurahan" | "fasilitas", params: {
    kelurahan?: string;
    rw?: string;
    periode?: string;
  }): Promise<void> {
    const queryParams = new URLSearchParams({ type });
    if (params.kelurahan && params.kelurahan !== "Semua") {
      queryParams.set("kelurahan", params.kelurahan);
    }
    if (params.rw && params.rw !== "Semua") {
      queryParams.set("rw", params.rw);
    }
    if (params.periode) {
      queryParams.set("periode", params.periode);
    }

    const res = await api.get(`/gis-eksekutif/export?${queryParams.toString()}`, {
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      type === "fasilitas"
        ? `fasilitas-coblong-${Date.now()}.csv`
        : `ringkasan-kepatuhan-coblong-${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
