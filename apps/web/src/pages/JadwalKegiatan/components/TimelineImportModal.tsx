/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  Layers,
  Info,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import api from "../../../services/api";

interface TimelineImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groups: any[];
  defaultKelompokId?: string;
}

interface ParsedTimelineRow {
  index: number;
  tahapMinggu: string;
  kelurahan: string;
  kelompokName: string;
  bidangKegiatan: string;
  tanggal: string;
  startDate: string | null;
  endDate: string | null;
  fase: string;
  kegiatanUtama: string;
  outputTarget: string;
  picKeterangan: string;
  linkGoogleDrive: string;
  statusPelaksanaan: "SELESAI" | "SEDANG_BERJALAN" | "BELUM_DIMULAI";
  isValid: boolean;
  validationError?: string;
}

export const TimelineImportModal: React.FC<TimelineImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  groups,
  defaultKelompokId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTimelineRow[]>([]);
  const [targetKelompokId, setTargetKelompokId] = useState<string>(defaultKelompokId || "GLOBAL");
  const [importMode, setImportMode] = useState<"APPEND" | "REPLACE">("APPEND");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper Download Template Excel Resmi Baku UNIKOM
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const headers = [
        "Tahap / Minggu",
        "Kelurahan",
        "Kelompok",
        "Tanggal Mulai (YYYY-MM-DD)",
        "Tanggal Selesai (YYYY-MM-DD)",
        "Tanggal Teks (Tampilan)",
        "Fase",
        "Bidang Kegiatan",
        "Kegiatan Utama",
        "Output / Target",
        "PIC / Penanggung Jawab",
        "URL Google Drive",
        "Status (SELESAI / SEDANG_BERJALAN / BELUM_DIMULAI)",
      ];

      const sampleData = [
        [
          "Pra-Kegiatan",
          "Semua Kelurahan",
          "Global",
          "2026-07-01",
          "2026-07-01",
          "1 Juli 2026",
          "Pra-Kegiatan",
          "Tata Kelola & Koordinasi",
          "Sosialisasi & Pembukaan Kegiatan KKN di Kampus",
          "Civitas akademika memahami program kerja & pembagian wilayah",
          "Wakil Rektor 1 UNIKOM",
          "https://drive.google.com/drive/folders/contoh-pra-kegiatan",
          "SELESAI",
        ],
        [
          "Minggu 1",
          "Dago",
          "Kelompok 1",
          "2026-08-12",
          "2026-08-18",
          "12 - 18 Agustus 2026",
          "Fase 1: Persiapan & Observasi",
          "Pemilahan Sampah",
          "Penerjunan Lapangan & Koordinasi Perangkat RW/RT",
          "Mahasiswa tiba di posko kelurahan & validasi data baseline sampah",
          "Mahasiswa KKN, DPL, Pengurus RW",
          "https://drive.google.com/drive/folders/contoh-minggu-1",
          "SEDANG_BERJALAN",
        ],
        [
          "Minggu 2",
          "Sekeloa",
          "Kelompok 2",
          "2026-08-19",
          "2026-08-25",
          "19 - 25 Agustus 2026",
          "Fase 1: Persiapan & Observasi",
          "Edukasi Warga & Sosialisasi",
          "Sosialisasi Pemilahan Sampah Organik & Anorganik",
          "Warga RW binaan memahami pemilahan sampah & sistem BERSEKA",
          "Mahasiswa KKN & Kader Lingkungan",
          "",
          "BELUM_DIMULAI",
        ],
        [
          "Minggu 3 - 4",
          "Sadang Serang",
          "Kelompok 3",
          "2026-08-26",
          "2026-09-08",
          "26 Agustus - 8 September 2026",
          "Fase 2: Pilot Project",
          "Pengangkutan & Logistik",
          "Uji Coba Pengangkutan Terjadwal & Operasional Bank Sampah Unit",
          "Alur penjemputan residu berjalan & timbangan tercatat ke sistem",
          "Petugas Residu & Tim Bank Sampah",
          "",
          "BELUM_DIMULAI",
        ],
      ];

      const wsData = [headers, ...sampleData];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws["!cols"] = [
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 30 },
        { wch: 25 },
        { wch: 45 },
        { wch: 45 },
        { wch: 30 },
        { wch: 40 },
        { wch: 35 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Template_Timeline");
      XLSX.writeFile(wb, "Template_Acuan_Timeline_KKN_BERSEKA_SIP.xlsx");
      toast.success("Template Excel berhasil diunduh!");
    } catch (err: any) {
      toast.error("Gagal mengunduh template: " + err.message);
    }
  };

  // Helper Parse File Excel / CSV
  const parseExcelFile = async (file: File) => {
    setSelectedFile(file);
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: "",
      });

      if (rawJson.length <= 1) {
        toast.error("File Excel kosong atau tidak memiliki baris data.");
        setParsedRows([]);
        setLoading(false);
        return;
      }

      // Identify column indices from header row
      const headers = rawJson[0].map((h: any) => String(h).trim().toLowerCase());

      const getColIndex = (keywords: string[]) => {
        return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
      };

      const idxTahap = getColIndex(["tahap", "minggu", "pekan"]);
      const idxKelurahan = getColIndex(["kelurahan", "desa", "wilayah"]);
      const idxKelompok = getColIndex(["kelompok", "group", "posko"]);
      const idxStart = getColIndex(["tanggal mulai", "start", "mulai", "tgl mulai"]);
      const idxEnd = getColIndex(["tanggal selesai", "end", "selesai", "tgl selesai"]);
      const idxTanggal = getColIndex(["tanggal teks", "tanggal", "tgl", "rentang", "waktu"]);
      const idxFase = getColIndex(["fase"]);
      const idxBidang = getColIndex(["bidang", "kategori", "lingkup"]);
      const idxKegiatan = getColIndex(["kegiatan", "aktivitas", "agenda", "program"]);
      const idxOutput = getColIndex(["output", "target", "capaian", "luaran"]);
      const idxPic = getColIndex(["pic", "penanggung", "keterangan", "mitra"]);
      const idxDrive = getColIndex(["google drive", "gdrive", "drive", "link drive", "url drive", "tautan"]);
      const idxStatus = getColIndex(["status"]);

      const rows: ParsedTimelineRow[] = [];

      for (let i = 1; i < rawJson.length; i++) {
        const row = rawJson[i];
        if (!row || row.every((c) => !c || String(c).trim() === "")) continue;

        const tahap = idxTahap !== -1 ? String(row[idxTahap] || "").trim() : `Tahap ${i}`;
        const kelurahan = idxKelurahan !== -1 ? String(row[idxKelurahan] || "").trim() : "Semua Kelurahan";
        const kelompok = idxKelompok !== -1 ? String(row[idxKelompok] || "").trim() : "Global";
        const bidang = idxBidang !== -1 ? String(row[idxBidang] || "").trim() : "Tata Kelola & Koordinasi";
        const startRaw = idxStart !== -1 ? String(row[idxStart] || "").trim() : "";
        const endRaw = idxEnd !== -1 ? String(row[idxEnd] || "").trim() : "";
        const tglText = idxTanggal !== -1 ? String(row[idxTanggal] || "").trim() : "";
        const faseRaw = idxFase !== -1 ? String(row[idxFase] || "").trim() : "Fase 1: Persiapan & Observasi";
        const kegiatan = idxKegiatan !== -1 ? String(row[idxKegiatan] || "").trim() : "";
        const output = idxOutput !== -1 ? String(row[idxOutput] || "").trim() : "-";
        const pic = idxPic !== -1 ? String(row[idxPic] || "").trim() : "-";
        const linkDrive = idxDrive !== -1 ? String(row[idxDrive] || "").trim() : "";
        const statusRaw = idxStatus !== -1 ? String(row[idxStatus] || "").trim().toUpperCase() : "BELUM_DIMULAI";

        let normalizedStatus: "SELESAI" | "SEDANG_BERJALAN" | "BELUM_DIMULAI" = "BELUM_DIMULAI";
        if (statusRaw.includes("SELESAI") || statusRaw.includes("DONE") || statusRaw.includes("FINISHED")) {
          normalizedStatus = "SELESAI";
        } else if (statusRaw.includes("JALAN") || statusRaw.includes("PROGRESS") || statusRaw.includes("BERJALAN") || statusRaw.includes("SEDANG") || statusRaw.includes("BERLANGSUNG")) {
          normalizedStatus = "SEDANG_BERJALAN";
        }

        // Format dates
        let parsedStart: string | null = null;
        let parsedEnd: string | null = null;

        if (startRaw) {
          const d = new Date(startRaw);
          if (!isNaN(d.getTime())) parsedStart = d.toISOString();
        }
        if (endRaw) {
          const d = new Date(endRaw);
          if (!isNaN(d.getTime())) parsedEnd = d.toISOString();
        }

        const isValid = kegiatan.length > 0;
        const validationError = !isValid ? "Kolom Kegiatan Utama wajib diisi" : undefined;

        rows.push({
          index: i,
          tahapMinggu: tahap || `Minggu ${i}`,
          kelurahan: kelurahan || "Semua Kelurahan",
          kelompokName: kelompok || "Global",
          bidangKegiatan: bidang || "Tata Kelola & Koordinasi",
          tanggal: tglText || (startRaw ? `${startRaw} ${endRaw ? "- " + endRaw : ""}` : "Sesuai Jadwal"),
          startDate: parsedStart,
          endDate: parsedEnd,
          fase: faseRaw || "Fase 1: Persiapan & Observasi",
          kegiatanUtama: kegiatan,
          outputTarget: output,
          picKeterangan: pic,
          linkGoogleDrive: linkDrive,
          statusPelaksanaan: normalizedStatus,
          isValid,
          validationError,
        });
      }

      setParsedRows(rows);
      toast.success(`Berhasil membaca ${rows.length} baris dari file.`);
    } catch (err: any) {
      toast.error("Gagal membaca file: " + err.message);
      setParsedRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseExcelFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Tidak ada baris data valid untuk diimpor!");
      return;
    }

    setLoading(true);
    try {
      const items = validRows.map((r) => ({
        tahapMinggu: r.tahapMinggu,
        kelurahan: r.kelurahan,
        bidangKegiatan: r.bidangKegiatan,
        tanggal: r.tanggal,
        startDate: r.startDate,
        endDate: r.endDate,
        fase: r.fase,
        kegiatanUtama: r.kegiatanUtama,
        outputTarget: r.outputTarget,
        picKeterangan: r.picKeterangan,
        linkGoogleDrive: r.linkGoogleDrive,
        statusPelaksanaan: r.statusPelaksanaan,
        kelompokId: targetKelompokId === "GLOBAL" ? null : targetKelompokId,
      }));

      const res = await api.post("/timeline-kkn/bulk-import", {
        items,
        mode: importMode,
        kelompokId: targetKelompokId === "GLOBAL" ? null : targetKelompokId,
      });

      toast.success(res.data?.message || `Berhasil mengimpor ${validRows.length} kegiatan!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal mengimpor data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 flex items-center justify-center">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Import Linimasa & Rencana Kerja KKN
              </h3>
              <p className="text-xs text-slate-500">
                Unggah file spreadsheet (.xlsx / .csv) untuk memasukkan agenda dan rencana kerja secara massal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Download Template Banner */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 rounded-xl shadow-2xs shrink-0">
                <Download size={18} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                  Unduh Format Template Excel Resmi
                </h4>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  Gunakan format kolom yang telah disesuaikan agar data tanggal dan fase terbaca sempurna.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
            >
              <Download size={13} />
              <span>Unduh Template (.xlsx)</span>
            </button>
          </div>

          {/* Scope Destination & Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-emerald-600" />
                Target Kelompok / Lingkup
              </label>
              <select
                value={targetKelompokId}
                onChange={(e) => setTargetKelompokId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
              >
                <option value="GLOBAL">🌐 Global / Acuan Semua Kelompok</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    👥 Kelompok: {g.name} {g.kelurahan ? `(${g.kelurahan})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Import Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" />
                Mode Penyimpanan
              </label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
              >
                <option value="APPEND">➕ Tambahkan ke data yang ada (Append)</option>
                <option value="REPLACE">⚠️ Ganti semua data pada scope terpilih (Replace)</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40"
                : "border-slate-200 dark:border-slate-800 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-800/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-emerald-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
              <Upload size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {selectedFile ? selectedFile.name : "Klik atau seret file spreadsheet ke sini"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mendukung format Microsoft Excel (.xlsx, .xls) atau Comma-Separated Values (.csv)
              </p>
            </div>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Pratinjau Data ({parsedRows.length} Baris)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      {invalidCount} Error
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-[10.5px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-28">Kelurahan</th>
                      <th className="py-2.5 px-3 w-28">Kelompok</th>
                      <th className="py-2.5 px-3 w-28">Tahap</th>
                      <th className="py-2.5 px-3 w-32">Tanggal</th>
                      <th className="py-2.5 px-3 w-32">Bidang</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Kegiatan Utama</th>
                      <th className="py-2.5 px-3 w-24">Google Drive</th>
                      <th className="py-2.5 px-3 w-28 text-center">Status</th>
                      <th className="py-2.5 px-3 w-16 text-center">Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {parsedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={!r.isValid ? "bg-rose-50/50 dark:bg-rose-950/20" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">{r.kelurahan}</td>
                        <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">{r.kelompokName}</td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{r.tahapMinggu}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.tanggal}</td>
                        <td className="py-2 px-3 font-medium text-slate-600 dark:text-slate-400">{r.bidangKegiatan}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{r.kegiatanUtama}</td>
                        <td className="py-2 px-3">
                          {r.linkGoogleDrive ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 truncate max-w-[100px]" title={r.linkGoogleDrive}>
                              🔗 Drive
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-[10.5px]">
                          {r.statusPelaksanaan === "SEDANG_BERJALAN" ? (
                            <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-full font-extrabold shadow-2xs">
                              Sedang Berlangsung
                            </span>
                          ) : r.statusPelaksanaan === "SELESAI" ? (
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-full">
                              Selesai
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                              Belum
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.isValid ? (
                            <CheckCircle2 size={15} className="text-emerald-600 inline" />
                          ) : (
                            <span title={r.validationError} className="cursor-help">
                              <AlertTriangle size={15} className="text-rose-500 inline" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info size={13} className="text-slate-400" />
              <span>Data yang diimpor akan langsung dapat difilter dan dikelola di tabel.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={loading || validCount === 0}
                onClick={handleExecuteImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>Import {validCount > 0 ? `${validCount} Baris Data` : ""}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
