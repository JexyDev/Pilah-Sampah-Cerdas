/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: PemantauanDanRekapitulasi (Tata Kelola Sampah)
 * - Rekapitulasi Data Setoran Terpadu & Audit Pemilahan Sampah Wilayah
 * - Visualisasi Grafik Analitik & Data Tabel 100% Dinamis & Terverifikasi dari PostgreSQL
 */

import RekapSetoran from "../RekapSetoran/RekapSetoran";

export default function PemantauanDanRekapitulasi() {
  return (
    <div className="space-y-6">
      <RekapSetoran />
    </div>
  );
}
