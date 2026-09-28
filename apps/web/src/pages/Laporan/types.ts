/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Tipe Data Laporan Resmi Tata Kelola Sampah
 */

export interface WasteReportData {
  metadata: {
    nomorDokumen: string;
    judulLaporan: string;
    subjudul: string;
    tanggalTerbit: string;
    wilayahCakupan: string;
    periodeEvaluasi: string;
    tanggalMulai: string | null;
    tanggalSelesai: string | null;
  };
  kpiSummary: {
    infrastruktur: {
      totalFasilitas: number;
      tps3rCount: number;
      bankSampahCount: number;
      rumahMaggotCount: number;
      komposterCount: number;
      totalKapasitasKg: number;
      wadahSampahTotal: number;
      wadahSampahAktif: number;
      kapasitasWadahLiter: number;
      volumeTerisiLiter: number;
      wadahKritis: number;
      wadahWaspada: number;
      wadahNormal: number;
    };
    operasional: {
      totalRitase: number;
      ritaseSelesai: number;
      ritaseDalamProses: number;
      ritaseTertunda: number;
      tingkatKeberhasilanRitase: number;
      totalTransaksiSetoran: number;
      totalLogPemilahan: number;
      totalLogResidu: number;
      materialOrganikMasukKg: number;
      outputProdukOrganikKg: number;
      outputKomposKg: number;
      outputMaggotKg: number;
      outputPocLiter: number;
    };
    dampakDanReduksi: {
      totalSampahTerpilahKg: number;
      totalSampahTerpilahTon: number;
      tonaseTereduksiDariTpaKg: number;
      tonaseTereduksiDariTpaTon: number;
      residuKeTpaKg: number;
      residuKeTpaTon: number;
      totalTimbulanSampahKg: number;
      totalTimbulanSampahTon: number;
      rasioReduksiTpaPersen: number;
      rasioPemilahan: {
        organikKg: number;
        organikPersen: number;
        anorganikKg: number;
        anorganikPersen: number;
        residuKg: number;
        residuPersen: number;
      };
      rataRataKepatuhanPersen: number;
      rataRataAkurasiAiPersen: number;
      reduksiEmisiCo2Kg: number;
    };
  };
  kelurahanAudit: Array<{
    kelurahan: string;
    baselineRate: number;
    currentComplianceRate: number;
    deltaPercent: number;
    totalTerpilahKg: number;
    organikKg: number;
    anorganikKg: number;
    residuKg: number;
    totalFacilities: number;
    tps3rCount: number;
    bankSampahCount: number;
    activeBinsCount: number;
    complianceLevel: "TINGGI" | "SEDANG" | "RENDAH";
    statusVerifikasi: string;
  }>;
  trenBerkala: Array<{
    pekan: string;
    organikKg: number;
    anorganikKg: number;
    residuKg: number;
    kepatuhanPercent: number;
  }>;
  fasilitasDetail: Array<{
    id: string;
    nama: string;
    jenis: string;
    pic: string;
    kontak: string;
    kapasitasKg: number;
    kelurahan: string;
    rw: string;
    totalLogProduksi: number;
    statusApproval: string;
  }>;
  signatories: {
    camat: { jabatan: string; instansi: string; nama: string; nip: string };
    dlh: { jabatan: string; instansi: string; nama: string; nip: string };
    pimpinan: { jabatan: string; instansi: string; nama: string; nip: string };
  };
}
