/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FileSpreadsheet, Upload, Download, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, X, Clock, Loader2, Eye } from "lucide-react";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

interface SheetSummary {
  name: string;
  rowCount: number;
  valid: boolean;
  data: Record<string, unknown>[];
}

interface ImportResult {
  importLogId: string;
  summary: Record<string, number>;
}

interface ImportHistoryItem {
  id: string;
  filename: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "PARTIAL";
  summary: Record<string, number> | null;
  errorMessages: string[] | null;
  rowsImported: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    role: { name: string };
  };
}

const REQUIRED_SHEETS = [
  "kelurahan",
  "karakteristik_wilayah",
  "pemilahan_sampah",
  "bank_sampah_pengolahan",
  "key_player",
  "volume_sampah",
  "catatan_kesimpulan",
];

const SHEET_DISPLAY_NAMES: Record<string, string> = {
  kelurahan: "Kelurahan",
  karakteristik_wilayah: "Karakteristik Wilayah",
  pemilahan_sampah: "Pemilahan Sampah",
  bank_sampah_pengolahan: "Bank Sampah & Pengolahan",
  key_player: "Key Player",
  volume_sampah: "Volume Sampah",
  catatan_kesimpulan: "Catatan & Kesimpulan",
};

const STATUS_BADGE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SUCCESS: { label: "Berhasil", color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 size={14} /> },
  FAILED: { label: "Gagal", color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle size={14} /> },
  PARTIAL: { label: "Sebagian", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <AlertTriangle size={14} /> },
  PENDING: { label: "Proses", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock size={14} /> },
};

// ────────────────────────────────────────────────
// StatusBadge Component
// ────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ────────────────────────────────────────────────
// SheetDetailModal Component
// ────────────────────────────────────────────────

const SheetDetailModal: React.FC<{
  sheetName: string;
  data: Record<string, unknown>[];
  onClose: () => void;
}> = ({ sheetName, data, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {SHEET_DISPLAY_NAMES[sheetName] || sheetName}
            </h3>
            <p className="text-sm text-gray-500">{data.length} baris data</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileSpreadsheet size={48} strokeWidth={1.5} />
              <p className="mt-3 text-sm">Sheet ini tidak memiliki data</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/60">
                    <th className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b">#</th>
                    {columns.map((col) => (
                      <th key={col} className="px-3 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {paginatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-2 text-gray-400 font-mono text-xs">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                      {columns.map((col) => (
                        <td key={col} className="px-3 py-2 text-gray-700 dark:text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                          {row[col] === null || row[col] === undefined ? (
                            <span className="text-gray-300 italic">null</span>
                          ) : typeof row[col] === "boolean" ? (
                            row[col] ? "✅" : "❌"
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer with Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 rounded-b-2xl">
            <p className="text-sm text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
// Main Page Component
// ────────────────────────────────────────────────

const ImportSurveiKkn: React.FC = () => {
  // Tab Mode: BASELINE vs ENDLINE
  const [activeSurveyType, setActiveSurveyType] = useState<"BASELINE" | "ENDLINE">("BASELINE");

  // File & Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview State (client-side parsing)
  const [sheetSummaries, setSheetSummaries] = useState<SheetSummary[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Import Result State
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  // History State
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal State
  const [detailSheet, setDetailSheet] = useState<SheetSummary | null>(null);

  // ─── Fetch Import History ────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/survei-kkn/import/history");
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (error) {
      console.error("Gagal memuat riwayat impor:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ─── File Handling ───────────────────────────
  const validateFile = (f: File): boolean => {
    if (!f.name.endsWith(".xlsx")) {
      toast.error("File harus berformat .xlsx");
      return false;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (f.size > maxSize) {
      toast.error("Ukuran file melebihi batas 10 MB");
      return false;
    }
    return true;
  };

  const parseFilePreview = async (f: File) => {
    setIsParsing(true);
    setParseError(null);
    setSheetSummaries([]);

    try {
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });

      const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
      if (missing.length) {
        setParseError(`Sheet tidak ditemukan: ${missing.join(", ")}`);
        setIsParsing(false);
        return;
      }

      const summaries: SheetSummary[] = REQUIRED_SHEETS.map((name) => {
        const ws = wb.Sheets[name];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: true });
        return {
          name,
          rowCount: data.length,
          valid: data.length > 0,
          data,
        };
      });

      setSheetSummaries(summaries);
    } catch (error: any) {
      setParseError(error.message || "Gagal membaca file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileSelect = (f: File) => {
    if (!validateFile(f)) return;
    setFile(f);
    setUploadStatus("idle");
    setImportResult(null);
    setImportErrors([]);
    parseFilePreview(f);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClearFile = () => {
    setFile(null);
    setSheetSummaries([]);
    setParseError(null);
    setImportResult(null);
    setImportErrors([]);
    setUploadStatus("idle");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Upload & Import ────────────────────────
  const handleImport = async () => {
    if (!file) return;
    setUploadStatus("uploading");
    setUploadProgress(0);
    setImportResult(null);
    setImportErrors([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/survei-kkn/import?type=${activeSurveyType}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });

      if (res.data.success) {
        setUploadStatus("success");
        setImportResult(res.data.data);
        toast.success("Impor data survei KKN berhasil!");
        fetchHistory();
      }
    } catch (error: any) {
      setUploadStatus("error");
      const errData = error.response?.data;
      if (errData?.errors) {
        setImportErrors(errData.errors);
      } else {
        setImportErrors([errData?.message || error.message || "Terjadi kesalahan saat impor"]);
      }
      toast.error(errData?.message || "Impor gagal");
    }
  };

  // ─── Template Download ──────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get("/survei-kkn/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_survei_kkn.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh template");
    }
  };

  // ─── Format Helpers ─────────────────────────
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ═══════ CARD 1: Header & Tab Switcher ═══════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#009966]/10 text-[#009966]">
              <FileSpreadsheet size={22} />
            </span>
            Impor Data Survei KKN
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">
            Upload file <code className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs font-mono">.xlsx</code> hasil survei lapangan KKN untuk diimpor ke database.
          </p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="btn-polish inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-sm shadow-sm hover:border-[#009966] hover:text-[#009966]"
        >
          <Download size={16} />
          Unduh Template
        </button>
      </div>

      {/* Tab Switcher: Tab 1 Baseline vs Tab 2 Endline */}
      <div className="flex bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setActiveSurveyType("BASELINE");
            handleClearFile();
          }}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSurveyType === "BASELINE"
              ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Tab 1: Impor Survei Baseline (Awal)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSurveyType("ENDLINE");
            handleClearFile();
          }}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSurveyType === "ENDLINE"
              ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Tab 2: Impor Survei Endline (Akhir)</span>
        </button>
      </div>

      {/* ═══════ CARD 2: Upload Drop-zone ═══════ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            Upload File
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop Zone */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center py-14 px-6 rounded-xl border-2 border-dashed cursor-pointer
                transition-all duration-200 ease-out group
                ${isDragging
                  ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10"
                  : "border-gray-200 bg-gray-50/50 dark:bg-slate-800/50 hover:border-primary/40 hover:bg-primary/[0.02]"
                }
              `}
            >
              <div className={`p-4 rounded-2xl mb-4 transition-colors ${isDragging ? "bg-primary/10" : "bg-gray-100 dark:bg-slate-800 group-hover:bg-primary/10"}`}>
                <Upload size={32} className={`transition-colors ${isDragging ? "text-primary" : "text-gray-400 group-hover:text-primary"}`} />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                Tarik file ke sini atau <span className="text-primary underline underline-offset-2">klik untuk memilih</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Hanya file .xlsx, maksimal 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          ) : (
            /* File Selected Preview */
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <FileSpreadsheet size={22} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={handleClearFile}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Ganti file"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {uploadStatus === "uploading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400 font-medium flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  Mengimpor ke database...
                </span>
                <span className="text-primary font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!file || uploadStatus === "uploading" || !!parseError}
            className={`
              btn-polish w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all
              ${!file || uploadStatus === "uploading" || parseError
                ? "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed"
                : "bg-primary text-white shadow-md hover:shadow-lg"
              }
            `}
          >
            {uploadStatus === "uploading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Mengimpor...
              </>
            ) : (
              <>
                <Upload size={16} />
                Impor ke Database
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══════ CARD 3: Preview Data ═══════ */}
      {(isParsing || sheetSummaries.length > 0 || parseError) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Eye size={18} className="text-primary" />
              Pratinjau Data
            </h2>
          </div>

          <div className="p-6">
            {isParsing && (
              <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm font-medium">Membaca file...</span>
              </div>
            )}

            {parseError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">File tidak valid</p>
                  <p className="text-sm text-red-600 mt-0.5">{parseError}</p>
                </div>
              </div>
            )}

            {!isParsing && !parseError && sheetSummaries.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/60">
                      <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b">Sheet</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b">Jumlah Baris</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b">Status</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {sheetSummaries.map((sheet) => (
                      <tr key={sheet.name} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                          {SHEET_DISPLAY_NAMES[sheet.name] || sheet.name}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-slate-300 font-mono">{sheet.rowCount}</td>
                        <td className="px-4 py-3 text-center">
                          {sheet.valid ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                              <CheckCircle2 size={14} /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-semibold">
                              <AlertTriangle size={14} /> Kosong
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDetailSheet(sheet)}
                            disabled={sheet.rowCount === 0}
                            className="inline-flex items-center gap-1 text-primary text-xs font-semibold hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed transition"
                          >
                            <Eye size={14} />
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/70 dark:bg-slate-800/70 font-semibold">
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300">Total</td>
                      <td className="px-4 py-3 text-center text-gray-900 dark:text-slate-100 font-mono">
                        {sheetSummaries.reduce((sum, s) => sum + s.rowCount, 0)}
                      </td>
                      <td className="px-4 py-3" colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ CARD 4: Hasil Impor ═══════ */}
      {(uploadStatus === "success" || uploadStatus === "error") && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              {uploadStatus === "success" ? (
                <CheckCircle2 size={18} className="text-green-500" />
              ) : (
                <XCircle size={18} className="text-red-500" />
              )}
              Hasil Impor
            </h2>
          </div>

          <div className="p-6">
            {/* Success Result */}
            {uploadStatus === "success" && importResult && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Impor berhasil!</p>
                    <p className="text-sm text-green-600 mt-0.5">Seluruh data telah dimasukkan ke database.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(importResult.summary).map(([sheet, count]) => (
                    <div key={sheet} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        {SHEET_DISPLAY_NAMES[sheet] || sheet}
                      </p>
                      <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100 mt-1">{count}</p>
                      <p className="text-[10px] text-gray-400">baris</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Result */}
            {uploadStatus === "error" && importErrors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Impor gagal</p>
                    <p className="text-sm text-red-600 mt-0.5">{importErrors.length} error ditemukan</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 transition-colors"
                >
                  {showErrors ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showErrors ? "Sembunyikan" : "Tampilkan"} detail error
                </button>

                {showErrors && (
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-red-100 bg-red-50/50 p-3 space-y-1.5">
                    {importErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="text-red-400 font-mono text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ CARD 5: Riwayat Impor ═══════ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            Riwayat Impor
          </h2>
        </div>

        <div className="p-6">
          {loadingHistory ? (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm font-medium">Memuat riwayat...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Clock size={40} strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium">Belum ada riwayat impor</p>
              <p className="text-xs text-gray-300 mt-0.5">Riwayat akan muncul setelah Anda mengimpor file pertama</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800/60 dark:bg-slate-800/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 flex-shrink-0">
                      <FileSpreadsheet size={18} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{item.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        oleh {item.user.name} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {item.rowsImported > 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        {item.rowsImported} baris
                      </span>
                    )}
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ Sheet Detail Modal ═══════ */}
      {detailSheet && (
        <SheetDetailModal
          sheetName={detailSheet.name}
          data={detailSheet.data}
          onClose={() => setDetailSheet(null)}
        />
      )}
    </div>
  );
};

export default ImportSurveiKkn;
