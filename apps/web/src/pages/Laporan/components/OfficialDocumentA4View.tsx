/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Komponen: Naskah Dinas Dokumen Resmi A4 (Tata Kelola Sampah Kedinasan)
 * Standar: Tata Naskah Dinas Pemerintah Daerah Kota Bandung & Dinas Lingkungan Hidup
 * Diformat khusus untuk Cetak A4 Portrait dan Ekspor PDF resmi dalam Bahasa Indonesia Baku.
 */

import React from "react";
import type { WasteReportData } from "../types";
import type { ReportCustomConfig } from "../../../components/laporan/PengaturanLaporanModal";

interface OfficialDocumentA4ViewProps {
  data: WasteReportData;
  customConfig?: ReportCustomConfig;
  orientation?: "portrait" | "landscape";
}

export const OfficialDocumentA4View: React.FC<OfficialDocumentA4ViewProps> = ({
  data,
  customConfig,
  orientation = "portrait",
}) => {
  const { metadata, kpiSummary, kelurahanAudit, fasilitasDetail, signatories } = data;

  const formatDateFormal = (dateStr: string | null) => {
    if (!dateStr) return "25 September 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const tanggalTerbitFormal = formatDateFormal(metadata.tanggalTerbit);
  const periodeTeks =
    metadata.periodeEvaluasi === "semua"
      ? "Seluruh Periode Operasional (Akumulatif)"
      : metadata.periodeEvaluasi === "harian"
      ? "Harian (24 Jam Terakhir)"
      : metadata.periodeEvaluasi === "mingguan"
      ? "Mingguan (7 Hari Terakhir)"
      : metadata.periodeEvaluasi === "bulanan"
      ? "Bulan Berjalan"
      : metadata.periodeEvaluasi === "tahunan"
      ? "Tahun Anggaran Berjalan"
      : metadata.tanggalMulai && metadata.tanggalSelesai
      ? `Rentang Khusus (${formatDateFormal(metadata.tanggalMulai)} s/d ${formatDateFormal(metadata.tanggalSelesai)})`
      : "Periode Berjalan";

  const nomorDok = customConfig?.nomorDokumen || metadata.nomorDokumen || "005/BERSEKA-DLH/EVAL/IX/2026";
  const sifatDok = customConfig?.sifatDokumen || "Penting / Kedinasan Terbuka";
  const lampiranDok = customConfig?.lampiranDokumen || "1 (Satu) Berkas Rekapitulasi Lengkap";
  const perihalDok = customConfig?.perihalDokumen || "Laporan Akuntabilitas dan Evaluasi Kinerja Tata Kelola Persampahan Berbasis Ekonomi Sirkular";
  const judulDok = customConfig?.judulLaporan || "LAPORAN EVALUASI & AKUNTABILITAS TATA KELOLA SAMPAH PERKOTAAN";
  const subjudulDok = customConfig?.subjudul || `WILAYAH: ${(customConfig?.wilayahCakupan || metadata.wilayahCakupan).toUpperCase()} • PERIODE EVALUASI: ${periodeTeks.toUpperCase()}`;
  const tglPengesahan = customConfig?.tanggalPengesahan || tanggalTerbitFormal;

  return (
    <article className={`official-document-sheet bg-white text-black font-serif leading-relaxed text-[11pt] w-full ${orientation === "landscape" ? "max-w-[297mm]" : "max-w-[210mm]"} mx-auto p-4 sm:p-8 md:p-[15mm] lg:p-[20mm] border border-slate-200 shadow-2xl rounded-sm print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:rounded-none`}>
      {/* ─────────────────────────────────────────────────────────────
          1. KOP SURAT KEDINASAN RESMI: LOGO UNIKOM KIRI, LOGO BERSEKA KANAN (TANPA LPPM)
      ───────────────────────────────────────────────────────────── */}
      <header className="avoid-break pb-2 mb-4 border-b-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 print:flex-row print:justify-between">
          {/* Logo UNIKOM di Kiri Sesuai Mandat Pengguna */}
          <div className="w-16 sm:w-20 md:w-24 shrink-0 flex items-center justify-center">
            <img
              src="/image/mitra/unikom.png"
              alt="Logo Universitas Komputer Indonesia (UNIKOM)"
              className="h-14 sm:h-16 md:h-20 w-auto object-contain"
            />
          </div>

          {/* Teks Lembaga & Kedinasan Berpusat (Bebas LPPM Sesuai Mandat) */}
          <div className="text-center flex-1 px-1 sm:px-2 space-y-0.5">
            <h3 className="text-[10pt] sm:text-[12pt] md:text-[13pt] print:text-[13pt] font-bold tracking-wide uppercase text-black leading-tight">
              UNIVERSITAS KOMPUTER INDONESIA (UNIKOM)
            </h3>
            <h2 className="text-[11pt] sm:text-[13pt] md:text-[14pt] print:text-[14pt] font-black tracking-wider uppercase text-black leading-tight">
              PEMERINTAH DAERAH KOTA BANDUNG &bull; DINAS LINGKUNGAN HIDUP
            </h2>
            <h4 className="text-[9.5pt] sm:text-[11pt] md:text-[12pt] print:text-[12pt] font-bold tracking-wide uppercase text-black leading-tight">
              KECAMATAN COBLONG
            </h4>
            <h1 className="text-[10.5pt] sm:text-[12pt] md:text-[13pt] print:text-[13pt] font-extrabold tracking-widest uppercase text-emerald-950 print:text-black leading-tight pt-0.5">
              TIM KOORDINASI PLATFORM CERDAS BERSEKA
            </h1>
            <p className="text-[7.5pt] sm:text-[8.5pt] md:text-[9pt] print:text-[9pt] font-normal text-slate-800 print:text-black leading-tight pt-1">
              Sekretariat Operasional: Jl. Dipati Ukur No. 112-116 &amp; Jl. Cigadung Raya Barat No. 28, Kota Bandung, Jawa Barat 40134
              <br />
              Laman Resmi: <span className="underline">https://berseka.bandung.go.id</span> &bull; Pos-el: <span className="underline">info@unikom.ac.id</span> / <span className="underline">sekretariat@berseka.id</span>
            </p>
          </div>

          {/* Logo Platform BERSEKA di Kanan Sesuai Mandat Pengguna */}
          <div className="w-16 sm:w-20 md:w-24 shrink-0 flex items-center justify-center">
            <img
              src="/image/berseka-logo-full.png"
              alt="Logo Resmi BERSEKA"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain"
            />
          </div>
        </div>

        {/* Garis Ganda Pembatas Kop Surat Kedinasan */}
        <div className="border-t-[3px] border-black mt-3 mb-[2px]" />
        <div className="border-t-[1px] border-black" />
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. IDENTITAS & NOMOR NASKAH DINAS (CRUD DINAMIS)
      ───────────────────────────────────────────────────────────── */}
      <section className="avoid-break mb-6 text-[10.5pt]">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-2 print:flex-row print:justify-between">
          <table className="w-auto border-none border-collapse text-left">
            <tbody>
              <tr>
                <td className="pr-3 py-0.5 font-bold align-top w-24 border-none p-0">Nomor</td>
                <td className="px-1 py-0.5 align-top border-none p-0">:</td>
                <td className="py-0.5 font-mono font-bold align-top border-none p-0">
                  {nomorDok}
                </td>
              </tr>
              <tr>
                <td className="pr-3 py-0.5 font-bold align-top border-none p-0">Sifat</td>
                <td className="px-1 py-0.5 align-top border-none p-0">:</td>
                <td className="py-0.5 align-top border-none p-0">{sifatDok}</td>
              </tr>
              <tr>
                <td className="pr-3 py-0.5 font-bold align-top border-none p-0">Lampiran</td>
                <td className="px-1 py-0.5 align-top border-none p-0">:</td>
                <td className="py-0.5 align-top border-none p-0">{lampiranDok}</td>
              </tr>
              <tr>
                <td className="pr-3 py-0.5 font-bold align-top border-none p-0">Perihal</td>
                <td className="px-1 py-0.5 align-top border-none p-0">:</td>
                <td className="py-0.5 font-bold align-top border-none p-0 leading-snug">
                  {perihalDok}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="text-right text-[10.5pt]">
            <p className="font-semibold">Bandung, {tglPengesahan}</p>
            <div className="mt-2 text-left inline-block">
              <p className="font-bold">Kepada Yth.</p>
              <ol className="list-decimal list-inside text-[10pt] space-y-0.5 font-medium pl-1">
                <li>Walikota Bandung</li>
                <li>Kepala Dinas Lingkungan Hidup Kota Bandung</li>
                <li>Camat Coblong Kota Bandung</li>
              </ol>
              <p className="mt-1 text-[10pt]">di &mdash;</p>
              <p className="font-bold tracking-wide text-[10pt] pl-4">TEMPAT</p>
            </div>
          </div>
        </div>

        {/* Judul Laporan Kedinasan Berpusat */}
        <div className="text-center my-6 py-2 border-y border-black/40">
          <h2 className="text-[13pt] font-black uppercase tracking-wider leading-snug">
            {judulDok}
          </h2>
          <h3 className="text-[11pt] font-bold uppercase tracking-wide text-slate-800 print:text-black">
            {subjudulDok}
          </h3>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BAB I: PENDAHULUAN & DASAR HUKUM
      ───────────────────────────────────────────────────────────── */}
      <section className="avoid-break mb-6 text-justify space-y-3">
        <h3 className="text-[11.5pt] font-bold uppercase tracking-wide border-b border-black/30 pb-0.5">
          BAB I. PENDAHULUAN DAN DASAR HUKUM
        </h3>

        <div className="space-y-2 text-[10.5pt]">
          <p className="indent-8 leading-relaxed">
            <strong>1.1 Latar Belakang.</strong> Pertumbuhan dinamika perkotaan dan konsentrasi aktivitas permukiman,
            komersial, serta pendidikan di kawasan Kecamatan Coblong berimplikasi langsung terhadap peningkatan laju
            timbulan sampah padat perkotaan. Menimbang keterbatasan daya tampung Tempat Pemrosesan Akhir (TPA) regional
            Sarimukti, Pemerintah Daerah Kota Bandung menetapkan langkah strategis berupa akselerasi desentralisasi
            pengolahan persampahan dari hulu ke hilir. Platform Tata Kelola Sampah Terpadu <em>BERSEKA</em> dioperasikan
            secara resmi sebagai instrumen digital pemantauan berbasis data riil (<em>real-time aggregation</em>) guna
            memastikan transparansi neraca massa, kepatuhan pemilahan sumber, serta hilirisasi produk biokonversi organik
            yang terukur dan dapat dipertanggungjawabkan secara kedinasan.
          </p>

          <p className="indent-8 leading-relaxed">
            <strong>1.2 Dasar Hukum Penyelenggaraan:</strong>
          </p>
          <ol className="list-decimal list-outside pl-12 space-y-1 text-[10pt] leading-normal">
            <li>
              Undang-Undang Republik Indonesia Nomor 18 Tahun 2008 tentang Pengelolaan Sampah;
            </li>
            <li>
              Peraturan Pemerintah Republik Indonesia Nomor 81 Tahun 2012 tentang Pengelolaan Sampah Rumah Tangga dan
              Sampah Sejenis Sampah Rumah Tangga;
            </li>
            <li>
              Peraturan Daerah Kota Bandung Nomor 9 Tahun 2018 tentang Pengelolaan Sampah;
            </li>
            <li>
              Peraturan Walikota Bandung Nomor 47 Tahun 2019 tentang Petunjuk Teknis Pelaksanaan Kawasan Bebas Sampah
              dan Gerakan Kurangi, Pisahkan, Manfaatkan Sampah (Kang Pisman);
            </li>
            <li>
              Keputusan Bersama Camat Coblong dan Dinas Lingkungan Hidup Kota Bandung tentang Standardisasi Operasional
              dan Digitalisasi Pencatatan Sirkularitas Persampahan Kecamatan Coblong Tahun Anggaran 2026.
            </li>
          </ol>

          <p className="indent-8 leading-relaxed">
            <strong>1.3 Maksud dan Tujuan.</strong> Penyusunan laporan ini ditujukan untuk memberikan gambaran komprehensif
            mengenai neraca massa sampah harian, tingkat reduksi sampah ke TPA Sarimukti, rasio kepatuhan pemilahan per
            kelurahan, keandalan sarana dan prasarana TPS3R serta Bank Sampah, sekaligus sebagai bahan pertimbangan
            pengambilan kebijakan strategis bagi jajaran pimpinan eksekutif Pemerintah Kota Bandung.
          </p>

          <p className="indent-8 leading-relaxed">
            <strong>1.4 Sumber dan Validitas Data.</strong> Seluruh data operasional, metrik timbulan, rasio pemilahan, dan rekapitulasi fasilitas dalam dokumen ini dihimpun secara otomatis dan terverifikasi secara langsung (<em>real-time database query</em>) dari sistem basis data operasional BERSEKA (PostgreSQL). Angka neraca massa dihitung dari pencatatan aktual setoran nasabah Bank Sampah, manifest logbook TPS/TPS3R, serta verifikasi tonase angkut DLH Kota Bandung tanpa estimasi fiktif.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BAB II: INDIKATOR KINERJA UTAMA & NERACA MASSA
      ───────────────────────────────────────────────────────────── */}
      <section className="avoid-break mb-6 text-justify space-y-3">
        <h3 className="text-[11.5pt] font-bold uppercase tracking-wide border-b border-black/30 pb-0.5">
          BAB II. INDIKATOR KINERJA UTAMA (IKU) DAN NERACA MASSA TIMBULAN SAMPAH
        </h3>

        <p className="indent-8 text-[10.5pt] leading-relaxed">
          Berdasarkan hasil konsolidasi data penimbangan terverifikasi pada seluruh Tempat Pengolahan Sampah Terpadu
          (TPS3R), Bank Sampah Unit (BSU), dan wadah sampah pintar (<em>IoT Smart Bins</em>), total akumulasi timbulan
          sampah yang tercatat di wilayah <strong>{metadata.wilayahCakupan}</strong> selama periode evaluasi ini mencapai{" "}
          <strong>{kpiSummary.dampakDanReduksi.totalTimbulanSampahKg.toLocaleString("id-ID")} Kilogram</strong> (setara
          dengan <strong>{kpiSummary.dampakDanReduksi.totalTimbulanSampahTon} Ton</strong>). Dari berat timbulan tersebut,
          pengolahan sumber berhasil mereduksi sampah ke TPA sebesar{" "}
          <strong>{kpiSummary.dampakDanReduksi.tonaseTereduksiDariTpaKg.toLocaleString("id-ID")} Kilogram</strong> (
          <strong>{kpiSummary.dampakDanReduksi.tonaseTereduksiDariTpaTon} Ton</strong>) atau mencapai tingkat efektivitas
          reduksi sebesar <strong>{kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen}%</strong>.
        </p>

        {/* Tabel 1: Neraca Massa dan Kinerja Pengurangan Sampah */}
        <div className="space-y-1 my-2 overflow-x-auto print:overflow-visible">
          <p className="text-[10pt] font-bold text-center">
            Tabel 1. Neraca Massa Timbulan dan Indikator Capaian Kinerja Pengurangan Sampah ke TPA
          </p>
          <table className="w-full border-collapse border border-black text-[9.5pt]">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-black px-2 py-1.5 text-center w-10">No</th>
                <th className="border border-black px-3 py-1.5 text-left">Parameter Indikator Kinerja</th>
                <th className="border border-black px-3 py-1.5 text-center w-24">Satuan</th>
                <th className="border border-black px-3 py-1.5 text-right w-36">Nilai Realisasi</th>
                <th className="border border-black px-3 py-1.5 text-left">Capaian Evaluasi / Standar Mutu</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-center">1</td>
                <td className="border border-black px-3 py-1 font-semibold">Total Estimasi Timbulan Sampah</td>
                <td className="border border-black px-3 py-1 text-center">Kg / Ton</td>
                <td className="border border-black px-3 py-1 text-right font-mono font-bold">
                  {kpiSummary.dampakDanReduksi.totalTimbulanSampahKg.toLocaleString("id-ID")} Kg ({kpiSummary.dampakDanReduksi.totalTimbulanSampahTon} T)
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Akumulasi timbulan terukur pada wilayah evaluasi
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">2</td>
                <td className="border border-black px-3 py-1 font-semibold">Tonase Berhasil Direduksi dari TPA</td>
                <td className="border border-black px-3 py-1 text-center">Kg / Ton</td>
                <td className="border border-black px-3 py-1 text-right font-mono font-bold text-emerald-800 print:text-black">
                  {kpiSummary.dampakDanReduksi.tonaseTereduksiDariTpaKg.toLocaleString("id-ID")} Kg ({kpiSummary.dampakDanReduksi.tonaseTereduksiDariTpaTon} T)
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Material tertahan di hulu melalui daur ulang &amp; komposting
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">3</td>
                <td className="border border-black px-3 py-1 font-semibold">Residu Terangkut ke TPA Sarimukti</td>
                <td className="border border-black px-3 py-1 text-center">Kg / Ton</td>
                <td className="border border-black px-3 py-1 text-right font-mono font-bold text-amber-800 print:text-black">
                  {kpiSummary.dampakDanReduksi.residuKeTpaKg.toLocaleString("id-ID")} Kg ({kpiSummary.dampakDanReduksi.residuKeTpaTon} T)
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Fraksi sampah yang tidak dapat diproses lokal
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">4</td>
                <td className="border border-black px-3 py-1 font-semibold">Rasio Efektivitas Reduksi ke TPA</td>
                <td className="border border-black px-3 py-1 text-center">Persen (%)</td>
                <td className="border border-black px-3 py-1 text-right font-mono font-bold">
                  {kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen}%
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  {kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen >= 50
                    ? "Target tercapai (Kategori: Sangat Baik / Mandiri)"
                    : "Perlu peningkatan intensifikasi pemilahan"}
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">5</td>
                <td className="border border-black px-3 py-1">Fraksi Terpilah Sampah Organik</td>
                <td className="border border-black px-3 py-1 text-center">Kg (%)</td>
                <td className="border border-black px-3 py-1 text-right font-mono">
                  {kpiSummary.dampakDanReduksi.rasioPemilahan.organikKg.toLocaleString("id-ID")} Kg ({kpiSummary.dampakDanReduksi.rasioPemilahan.organikPersen}%)
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Dialihkan ke biokonversi maggot &amp; komposter
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">6</td>
                <td className="border border-black px-3 py-1">Fraksi Terpilah Sampah Anorganik</td>
                <td className="border border-black px-3 py-1 text-center">Kg (%)</td>
                <td className="border border-black px-3 py-1 text-right font-mono">
                  {kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikKg.toLocaleString("id-ID")} Kg ({kpiSummary.dampakDanReduksi.rasioPemilahan.anorganikPersen}%)
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Tersalurkan ke jejaring Bank Sampah Unit &amp; daur ulang
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">7</td>
                <td className="border border-black px-3 py-1 font-semibold">Rata-Rata Indeks Kepatuhan Warga</td>
                <td className="border border-black px-3 py-1 text-center">Persen (%)</td>
                <td className="border border-black px-3 py-1 text-right font-mono font-bold">
                  {kpiSummary.dampakDanReduksi.rataRataKepatuhanPersen}%
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Tingkat kedisiplinan pemilahan sampah di tingkat rumah tangga
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">8</td>
                <td className="border border-black px-3 py-1">Akurasi Verifikasi Computer Vision (AI)</td>
                <td className="border border-black px-3 py-1 text-center">Persen (%)</td>
                <td className="border border-black px-3 py-1 text-right font-mono">
                  {kpiSummary.dampakDanReduksi.rataRataAkurasiAiPersen}%
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Tingkat keabsahan otomatisasi klasifikasi sampah cerdas
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">9</td>
                <td className="border border-black px-3 py-1 font-semibold">Estimasi Reduksi Emisi Gas Rumah Kaca</td>
                <td className="border border-black px-3 py-1 text-center">Kg CO₂e</td>
                <td className="border border-black px-3 py-1 text-right font-mono font-bold text-emerald-800 print:text-black">
                  {kpiSummary.dampakDanReduksi.reduksiEmisiCo2Kg.toLocaleString("id-ID")} Kg CO₂e
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Kontribusi terhadap target Net-Zero Emission Kota Bandung
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-center">10</td>
                <td className="border border-black px-3 py-1 font-semibold">Efektivitas Ritase Pengangkutan Armada</td>
                <td className="border border-black px-3 py-1 text-center">Persen (%)</td>
                <td className="border border-black px-3 py-1 text-right font-mono font-bold">
                  {kpiSummary.operasional.tingkatKeberhasilanRitase}%
                </td>
                <td className="border border-black px-3 py-1 text-slate-700 print:text-black">
                  Realisasi {kpiSummary.operasional.ritaseSelesai} rit selesai dari {kpiSummary.operasional.totalRitase} jadwal
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BAB III: NERACA SIRKULARITAS & HILIRISASI PRODUK ORGANIK
      ───────────────────────────────────────────────────────────── */}
      <section className="avoid-break mb-6 text-justify space-y-3">
        <h3 className="text-[11.5pt] font-bold uppercase tracking-wide border-b border-black/30 pb-0.5">
          BAB III. NERACA SIRKULARITAS DAN HILIRISASI SAMPAH ORGANIK
        </h3>

        <p className="indent-8 text-[10.5pt] leading-relaxed">
          Penerapan prinsip ekonomi sirkular pada sistem tata kelola persampahan BERSEKA menempatkan sampah organik
          sebagai sumber daya hayati bernilai ekonomis tinggi. Seluruh material organik yang dihimpun dari permukiman
          warga, pasar tradisional, dan kawasan pendidikan disalurkan menuju unit pengolahan komposter komunal serta
          fasilitas biokonversi larva lalat tentara hitam (<em>Black Soldier Fly / Hermetia illucens</em>).
        </p>

        <div className="bg-slate-50 print:bg-white border border-slate-300 print:border-black p-3.5 space-y-2 text-[10pt]">
          <p className="font-bold border-b border-slate-300 print:border-black pb-1">
            Rekapitulasi Konversi Produk Sirkularitas Hilir Periode {periodeTeks}:
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div>
              <span className="font-semibold text-slate-700 print:text-black">&bull; Total Input Bahan Baku Organik: </span>
              <span className="font-mono font-bold">
                {kpiSummary.operasional.materialOrganikMasukKg.toLocaleString("id-ID")} Kg
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 print:text-black">&bull; Output Pupuk Kompos Matang: </span>
              <span className="font-mono font-bold">
                {kpiSummary.operasional.outputKomposKg.toLocaleString("id-ID")} Kg
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 print:text-black">&bull; Output Biomassa Maggot Segar: </span>
              <span className="font-mono font-bold">
                {kpiSummary.operasional.outputMaggotKg.toLocaleString("id-ID")} Kg
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 print:text-black">&bull; Output Pupuk Organik Cair (POC): </span>
              <span className="font-mono font-bold">
                {kpiSummary.operasional.outputPocLiter.toLocaleString("id-ID")} Liter
              </span>
            </div>
          </div>
          <p className="text-[9pt] italic pt-1 border-t border-slate-200 print:border-black/40 text-slate-600 print:text-black">
            Catatan: Hasil produksi pupuk kompos dan cairan POC didistribusikan kepada kelompok tani perkotaan (Buruan Sae
            Kecamatan Coblong), sedangkan biomassa larva maggot diserap oleh peternak unggas dan perikanan air tawar lokal
            sebagai substitusi pakan protein mandiri.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BAB IV: AUDIT EVALUASI KINERJA 6 KELURAHAN (KOMPARASI BASELINE)
      ───────────────────────────────────────────────────────────── */}
      <section className="avoid-break mb-6 text-justify space-y-3">
        <h3 className="text-[11.5pt] font-bold uppercase tracking-wide border-b border-black/30 pb-0.5">
          BAB IV. AUDIT EVALUASI KINERJA KELURAHAN (KOMPARASI BASELINE)
        </h3>

        <p className="indent-8 text-[10.5pt] leading-relaxed">
          Dalam rangka pembinaan kewilayahan yang berkeadilan, audit kinerja berkala dilaksanakan terhadap 6 (enam)
          kelurahan di lingkungan Kecamatan Coblong. Evaluasi membandingkan capaian indeks kepatuhan berjalan terhadap
          target awal (<em>baseline</em>), berat material sampah yang terpilah, ketersediaan fasilitas aktif, serta
          status verifikasi lapangan sebagai dasar pemberian penghargaan (*reward*) atau pendampingan intensif.
        </p>

        {/* Tabel 2: Matriks Evaluasi Kinerja Per Kelurahan */}
        <div className="space-y-1 my-2 overflow-x-auto print:overflow-visible">
          <p className="text-[10pt] font-bold text-center">
            Tabel 2. Matriks Capaian Kinerja dan Audit Kepatuhan Pemilahan Sampah Per Kelurahan
          </p>
          <table className="w-full border-collapse border border-black text-[9pt]">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-black px-1.5 py-1 text-center w-8">No</th>
                <th className="border border-black px-2 py-1 text-left">Kelurahan</th>
                <th className="border border-black px-2 py-1 text-center">Baseline</th>
                <th className="border border-black px-2 py-1 text-center">Aktual</th>
                <th className="border border-black px-2 py-1 text-center">Deviasi</th>
                <th className="border border-black px-2 py-1 text-right">Terpilah (Kg)</th>
                <th className="border border-black px-2 py-1 text-right">Organik</th>
                <th className="border border-black px-2 py-1 text-right">Anorganik</th>
                <th className="border border-black px-2 py-1 text-right">Residu</th>
                <th className="border border-black px-2 py-1 text-center">Sarpras</th>
                <th className="border border-black px-2 py-1 text-center">Kategori</th>
                <th className="border border-black px-2 py-1 text-center">Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {kelurahanAudit && kelurahanAudit.length > 0 ? (
                kelurahanAudit.map((k, idx) => (
                  <tr key={k.kelurahan || idx}>
                    <td className="border border-black px-1.5 py-1 text-center">{idx + 1}</td>
                    <td className="border border-black px-2 py-1 font-bold">{k.kelurahan}</td>
                    <td className="border border-black px-2 py-1 text-center font-mono">{k.baselineRate}%</td>
                    <td className="border border-black px-2 py-1 text-center font-mono font-bold">
                      {k.currentComplianceRate}%
                    </td>
                    <td className="border border-black px-2 py-1 text-center font-mono font-bold">
                      {k.deltaPercent >= 0 ? `+${k.deltaPercent}%` : `${k.deltaPercent}%`}
                    </td>
                    <td className="border border-black px-2 py-1 text-right font-mono font-bold">
                      {k.totalTerpilahKg.toLocaleString("id-ID")}
                    </td>
                    <td className="border border-black px-2 py-1 text-right font-mono">
                      {k.organikKg.toLocaleString("id-ID")}
                    </td>
                    <td className="border border-black px-2 py-1 text-right font-mono">
                      {k.anorganikKg.toLocaleString("id-ID")}
                    </td>
                    <td className="border border-black px-2 py-1 text-right font-mono">
                      {k.residuKg.toLocaleString("id-ID")}
                    </td>
                    <td className="border border-black px-2 py-1 text-center">
                      {k.totalFacilities} Unit ({k.activeBinsCount} Bins)
                    </td>
                    <td className="border border-black px-2 py-1 text-center font-bold">
                      {k.complianceLevel}
                    </td>
                    <td className="border border-black px-2 py-1 text-center text-[8pt]">
                      {k.statusVerifikasi}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="border border-black px-4 py-3 text-center italic text-slate-500">
                    Tidak ada data audit kelurahan pada periode yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BAB V: INVENTARISASI SARANA, PRASARANA, DAN FASILITAS PENGOLAHAN
      ───────────────────────────────────────────────────────────── */}
      <section className="avoid-break mb-6 text-justify space-y-3">
        <h3 className="text-[11.5pt] font-bold uppercase tracking-wide border-b border-black/30 pb-0.5">
          BAB V. INVENTARISASI SARANA, PRASARANA, DAN FASILITAS PENGOLAHAN
        </h3>

        <p className="indent-8 text-[10.5pt] leading-relaxed">
          Ketersediaan infrastruktur aktif yang terintegrasi dalam sistem pemantauan BERSEKA di wilayah{" "}
          <strong>{metadata.wilayahCakupan}</strong> berjumlah{" "}
          <strong>{kpiSummary.infrastruktur.totalFasilitas} unit fasilitas</strong>, meliputi{" "}
          {kpiSummary.infrastruktur.tps3rCount} unit TPS3R, {kpiSummary.infrastruktur.bankSampahCount} unit Bank Sampah
          Unit (BSU), {kpiSummary.infrastruktur.rumahMaggotCount} unit instalasi budidaya Maggot BSF, dan{" "}
          {kpiSummary.infrastruktur.komposterCount} unit rumah komposter. Kinerja sarana prasarana tersebut diperkuat
          oleh sebaran <strong>{kpiSummary.infrastruktur.wadahSampahTotal} unit tempat sampah pintar IoT</strong> dengan
          kondisi terlaporkan normal dan terkendali.
        </p>

        {/* Tabel 3: Rekapitulasi Fasilitas Pengolahan Aktif */}
        <div className="space-y-1 my-2 overflow-x-auto print:overflow-visible">
          <p className="text-[10pt] font-bold text-center">
            Tabel 3. Rekapitulasi Inventaris Sarana dan Prasarana Pengolahan Sampah Aktif
          </p>
          <table className="w-full border-collapse border border-black text-[9pt]">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="border border-black px-1.5 py-1 text-center w-8">No</th>
                <th className="border border-black px-2 py-1 text-left">Nama Sarana / Prasarana</th>
                <th className="border border-black px-2 py-1 text-center">Klasifikasi Unit</th>
                <th className="border border-black px-2 py-1 text-left">Lokasi Wilayah</th>
                <th className="border border-black px-2 py-1 text-left">Penanggung Jawab (PIC)</th>
                <th className="border border-black px-2 py-1 text-right">Kapasitas (Kg/Hr)</th>
                <th className="border border-black px-2 py-1 text-center">Log Produksi</th>
                <th className="border border-black px-2 py-1 text-center">Status Operasional</th>
              </tr>
            </thead>
            <tbody>
              {fasilitasDetail && fasilitasDetail.length > 0 ? (
                fasilitasDetail.slice(0, 10).map((f, idx) => (
                  <tr key={f.id || idx}>
                    <td className="border border-black px-1.5 py-1 text-center">{idx + 1}</td>
                    <td className="border border-black px-2 py-1 font-semibold">{f.nama}</td>
                    <td className="border border-black px-2 py-1 text-center font-mono text-[8.5pt]">{f.jenis}</td>
                    <td className="border border-black px-2 py-1">
                      {f.kelurahan} (RW {f.rw})
                    </td>
                    <td className="border border-black px-2 py-1 text-[8.5pt]">
                      {f.pic} ({f.kontak})
                    </td>
                    <td className="border border-black px-2 py-1 text-right font-mono">
                      {f.kapasitasKg.toLocaleString("id-ID")}
                    </td>
                    <td className="border border-black px-2 py-1 text-center font-mono font-bold">
                      {f.totalLogProduksi}
                    </td>
                    <td className="border border-black px-2 py-1 text-center font-bold text-[8.5pt]">
                      {f.statusApproval}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="border border-black px-4 py-3 text-center italic text-slate-500">
                    Tidak ada catatan sarana prasarana pada wilayah yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {fasilitasDetail && fasilitasDetail.length > 10 && (
            <p className="text-[8pt] text-slate-600 print:text-black italic text-right">
              * Menampilkan 10 dari total {fasilitasDetail.length} sarana prasarana terdaftar. Data lengkap terlampir pada dokumen spreadsheet pendukung.
            </p>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BAB VI: KESIMPULAN & REKOMENDASI KEBIJAKAN STRATEGIS
      ───────────────────────────────────────────────────────────── */}
      <section className="avoid-break mb-8 text-justify space-y-3">
        <h3 className="text-[11.5pt] font-bold uppercase tracking-wide border-b border-black/30 pb-0.5">
          BAB VI. KESIMPULAN DAN REKOMENDASI KEBIJAKAN STRATEGIS
        </h3>

        <div className="space-y-2 text-[10.5pt]">
          <p className="indent-8 leading-relaxed">
            <strong>6.1 Kesimpulan Hasil Evaluasi:</strong>
          </p>
          <ol className="list-decimal list-outside pl-12 space-y-1 text-[10pt] leading-normal">
            <li>
              Penerapan paradigma desentralisasi tata kelola persampahan di wilayah Kecamatan Coblong berhasil menekan
              aliran pembuangan residu menuju TPA Sarimukti dengan rasio reduksi mencapai{" "}
              <strong>{kpiSummary.dampakDanReduksi.rasioReduksiTpaPersen}%</strong>, setara dengan penghematan biaya ritase
              pengangkutan dan pencegahan emisi karbon sebesar{" "}
              <strong>{kpiSummary.dampakDanReduksi.reduksiEmisiCo2Kg.toLocaleString("id-ID")} Kg CO₂e</strong>.
            </li>
            <li>
              Integrasi sistem sensor cerdas (IoT) dan verifikasi otomatisasi kecerdasan buatan (AI Vision) mampu
              meningkatkan akurasi klasifikasi material hingga{" "}
              <strong>{kpiSummary.dampakDanReduksi.rataRataAkurasiAiPersen}%</strong> serta menjamin transparansi data
              bagi seluruh aparat kelurahan dan masyarakat.
            </li>
            <li>
              Tingkat kepatuhan pemilahan masyarakat secara keseluruhan berada pada angka rata-rata{" "}
              <strong>{kpiSummary.dampakDanReduksi.rataRataKepatuhanPersen}%</strong>, namun masih memerlukan penguatan
              pembinaan pada kelurahan yang mencatatkan deviasi capaian negatif terhadap target baseline.
            </li>
          </ol>

          <p className="indent-8 leading-relaxed">
            <strong>6.2 Rekomendasi Kebijakan Tindak Lanjut:</strong>
          </p>
          <ol className="list-decimal list-outside pl-12 space-y-1 text-[10pt] leading-normal">
            <li>
              <strong>Bagi Dinas Lingkungan Hidup Kota Bandung:</strong> Mengalokasikan dukungan sarana timbangan digital
              terkalibrasi secara merata ke seluruh Bank Sampah Unit dan TPS3R, serta mempercepat penjadwalan ritase
              residu tanpa mencampur kembali material yang telah dipilah warga.
            </li>
            <li>
              <strong>Bagi Pemerintah Kecamatan dan Para Lurah:</strong> Mengoptimalkan fungsi Satgas Kang Pisman
              tingkat RW guna menggalakkan sosialisasi pintu ke pintu (<em>door-to-door education</em>) di wilayah RW
              berkategori kepatuhan rendah.
            </li>
            <li>
              <strong>Bagi Pengelola Platform BERSEKA:</strong> Mempertahankan keandalan sistem pelaporan real-time,
              menyempurnakan notifikasi peringatan dini kapasitas wadah sampah kritis, dan memperluas integrasi insentif
              ekonomi warga melalui modul tabungan sampah digital.
            </li>
          </ol>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. LEMBAR PENGESAHAN DOKUMEN RESMI (1 TTD TENGAH BAWAH)
      ───────────────────────────────────────────────────────────── */}
      <section className="avoid-break mt-10 pt-4 border-t border-black/40 text-[10.5pt]">
        <div className="text-center mb-6">
          <p className="font-bold uppercase tracking-wider text-[11pt]">
            LEMBAR PENGESAHAN LAPORAN KEDINASAN
          </p>
          <p className="text-[10pt] text-slate-700 print:text-black">
            Ditetapkan di Kota Bandung pada tanggal: <strong>{tglPengesahan}</strong>
          </p>
        </div>

        {/* 1 Penandatangan Tunggal di Tengah Bawah Sesuai Mandat */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex flex-col justify-between min-h-[170px] w-80 max-w-full">
            <div>
              <p className="font-bold text-slate-700 print:text-black">Mengetahui / Mengesahkan,</p>
              <p className="font-black uppercase tracking-tight text-[11pt] leading-tight mt-1">
                {customConfig?.penandatangan?.jabatan || signatories.pimpinan.jabatan}
              </p>
              <p className="text-[9.5pt] text-slate-600 print:text-black leading-tight mt-0.5">
                {customConfig?.penandatangan?.instansi || signatories.pimpinan.instansi}
              </p>
            </div>

            <div className="h-16 flex items-center justify-center">
              {/* Ruang TTD */}
              <div className="w-36 border-b border-dashed border-slate-300 print:border-transparent opacity-60"></div>
            </div>

            <div className="border-t border-black w-64 mx-auto pt-1">
              <p className="font-black text-[10.5pt] underline leading-tight">
                {customConfig?.penandatangan?.nama || signatories.pimpinan.nama}
              </p>
              <p className="text-[9pt] font-mono text-slate-700 print:text-black leading-tight mt-0.5">
                {customConfig?.penandatangan?.nip ? `NIP/NIDN. ${customConfig.penandatangan.nip}` : `ID. ${signatories.pimpinan.nip}`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Dokumen Resmi Kedinasan */}
        <footer className="mt-8 pt-2 border-t border-black/20 text-center text-[8pt] text-slate-500 print:text-black/70">
          Dokumen ini diterbitkan secara sah melalui modul pelaporan digital BERSEKA &bull; Divalidasi oleh Universitas Komputer Indonesia &amp; Pemerintah Kota Bandung &bull; Hak Cipta &copy; 2026 PT Makerindo.
        </footer>
      </section>
    </article>
  );
};

export default OfficialDocumentA4View;
