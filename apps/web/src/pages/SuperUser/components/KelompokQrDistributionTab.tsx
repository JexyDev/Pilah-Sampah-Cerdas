/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Modul Distribusi QR Kelompok KKN (Paket 10: 5 Organik + 5 Anorganik)
 * Khusus Developer / Super User
 */

import React, { useEffect, useState, useMemo } from "react";
import api from "../../../utils/api";
import toast from "react-hot-toast";
import {
  FolderArchive,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Printer,
  Sparkles,
  Link2,
  Edit2,
  Check,
  X,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  MapPin,
} from "lucide-react";
import { EmptyTableState } from "../../../components/common/EmptyTableState";
import { downloadKelompokZip, printQrStickers, type QrStickerItem } from "../../../utils/printQrStickers";

export interface KelompokDistributionItem {
  id: string;
  name: string;
  kelurahan: string | null;
  cakupanRw: any;
  dpl: { id: string; name: string; phone?: string } | null;
  dplNamaMentah: string | null;
  linkGoogleDrive: string | null;
  qrDownloadedAt: string | null;
  totalBins: number;
  organikCount: number;
  anorganikCount: number;
  statusDistribusi: "BELUM_GENERATE" | "SIAP_UNDUH" | "SUDAH_DIUNDUH" | "BELUM_LENGKAP" | string;
  bins: QrStickerItem[];
}

export const KelompokQrDistributionTab: React.FC = () => {
  const [data, setData] = useState<KelompokDistributionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("SEMUA");
  const [gdriveFilter, setGdriveFilter] = useState<string>("ALL");
  const [kelurahanFilter, setKelurahanFilter] = useState<string>("SEMUA");

  // Inline editing GDrive
  const [editingGdriveId, setEditingGdriveId] = useState<string | null>(null);
  const [gdriveInputVal, setGdriveInputVal] = useState<string>("");
  const [savingGdrive, setSavingGdrive] = useState<boolean>(false);

  // Generate Action Loading
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Download ZIP Progress
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);

  // Modal Detail QR
  const [selectedKelompokForModal, setSelectedKelompokForModal] =
    useState<KelompokDistributionItem | null>(null);

  const fetchDistributionData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/super-user/kelompok-qr/distribution", {
        params: {
          search: search || undefined,
          statusDistribusi: statusFilter !== "SEMUA" ? statusFilter : undefined,
          hasGdrive: gdriveFilter !== "ALL" ? gdriveFilter : undefined,
          kelurahan: kelurahanFilter !== "SEMUA" ? kelurahanFilter : undefined,
        },
      });

      if (res.data?.success || res.status === 200) {
        setData(res.data.data || []);
      }
    } catch (error: any) {
      console.error("Gagal mengambil data distribusi QR:", error);
      toast.error(error.response?.data?.message || "Gagal memuat data distribusi QR kelompok");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributionData();
  }, [statusFilter, gdriveFilter, kelurahanFilter]);

  // Handle Search Debounce / Trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDistributionData();
  };

  // Unique kelurahan list for dropdown
  const uniqueKelurahans = useMemo(() => {
    const setK = new Set<string>();
    data.forEach((k) => {
      if (k.kelurahan) setK.add(k.kelurahan);
    });
    return Array.from(setK).sort();
  }, [data]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = data.length;
    const siapUnduh = data.filter((k) => k.statusDistribusi === "SIAP_UNDUH").length;
    const sudahUnduh = data.filter((k) => k.statusDistribusi === "SUDAH_DIUNDUH").length;
    const belumGenerate = data.filter((k) => k.statusDistribusi === "BELUM_GENERATE").length;
    const tanpaGdrive = data.filter((k) => !k.linkGoogleDrive).length;

    return { total, siapUnduh, sudahUnduh, belumGenerate, tanpaGdrive };
  }, [data]);

  // Action: Generate 10 QR Bundle
  const handleGenerate10Qr = async (kelompok: KelompokDistributionItem) => {
    if (kelompok.totalBins >= 10) {
      toast.error(`Kelompok "${kelompok.name}" sudah memiliki kuota lengkap 10 QR Code.`);
      return;
    }

    const confirmMsg = `Generate 10 QR Code (5 Organik & 5 Anorganik) untuk ${kelompok.name}?\nKode QR akan terikat eksklusif ke kelompok ini sehingga tidak dapat tertukar atau duplikat.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setGeneratingId(kelompok.id);
      const res = await api.post(`/super-user/kelompok-qr/${kelompok.id}/generate`);
      if (res.data?.success || res.status === 200) {
        toast.success(res.data.message || `Paket 10 QR untuk ${kelompok.name} berhasil dibuat!`);
        fetchDistributionData();
      }
    } catch (error: any) {
      console.error("Gagal generate QR kelompok:", error);
      toast.error(error.response?.data?.message || "Gagal membuat paket QR kelompok");
    } finally {
      setGeneratingId(null);
    }
  };

  // Action: Save Inline Google Drive Link
  const handleSaveGdrive = async (kelompokId: string) => {
    try {
      setSavingGdrive(true);
      const res = await api.put(`/super-user/kelompok-qr/${kelompokId}/gdrive`, {
        linkGoogleDrive: gdriveInputVal,
      });

      if (res.data?.success || res.status === 200) {
        toast.success("Link Google Drive berhasil disimpan");
        setData((prev) =>
          prev.map((k) =>
            k.id === kelompokId ? { ...k, linkGoogleDrive: gdriveInputVal.trim() || null } : k
          )
        );
        setEditingGdriveId(null);
        setGdriveInputVal("");
      }
    } catch (error: any) {
      console.error("Gagal menyimpan link Google Drive:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan link");
    } finally {
      setSavingGdrive(false);
    }
  };

  // Action: Download ZIP (10 QR HD + Printable PDF + Panduan)
  const handleDownloadZip = async (kelompok: KelompokDistributionItem) => {
    if (!kelompok.bins || kelompok.bins.length === 0) {
      toast.error("Kelompok ini belum memiliki QR Code. Silakan klik 'Generate 10 QR' terlebih dahulu.");
      return;
    }

    try {
      setDownloadingZipId(kelompok.id);

      await downloadKelompokZip(kelompok.name, kelompok.bins);

      // Mark as downloaded in backend
      await api.put(`/super-user/kelompok-qr/${kelompok.id}/mark-downloaded`);
      setData((prev) =>
        prev.map((k) =>
          k.id === kelompok.id
            ? {
                ...k,
                qrDownloadedAt: new Date().toISOString(),
                statusDistribusi: "SUDAH_DIUNDUH",
              }
            : k
        )
      );
    } catch (error: any) {
      console.error("Gagal mendownload ZIP kelompok:", error);
      toast.error("Terjadi kendala saat membuat paket ZIP: " + (error.message || error));
    } finally {
      setDownloadingZipId(null);
    }
  };

  // Action: Cetak Stiker PDF langsung
  const handlePrintPdf = (kelompok: KelompokDistributionItem) => {
    if (!kelompok.bins || kelompok.bins.length === 0) {
      toast.error("Belum ada QR Code untuk dicetak");
      return;
    }
    printQrStickers(kelompok.bins, `Stiker QR 10x15cm - ${kelompok.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Kelompok
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-400">Kelompok KKN Terdaftar</span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Siap Diunduh
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-2">
            {stats.siapUnduh}
          </p>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
            10/10 QR Siap Dikirim
          </span>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Sudah Diunduh
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-2">
            {stats.sudahUnduh}
          </p>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
            Telah Diterima Tim
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Belum Generate
            </span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-2">
            {stats.belumGenerate}
          </p>
          <span className="text-[11px] text-slate-400">Perlu Dibuatkan Kuota</span>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              Drive Kosong
            </span>
            <Link2 className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-800 dark:text-rose-200 mt-2">
            {stats.tanpaGdrive}
          </p>
          <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
            Perlu Diinput Link GDrive
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Header & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Distribusi Paket QR Kelompok KKN (10 Stiker: 5 Organik & 5 Anorganik)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Alokasi terkunci anti-duplikasi: Unduh paket ZIP 10 file PNG resolusi tinggi + PDF cetak 10x15cm, lalu langsung buka Google Drive kelompok.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchDistributionData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-2xs cursor-pointer"
                title="Muat ulang data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Segarkan
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kelompok, kelurahan, DPL, QR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-emerald-500 focus:border-emerald-500"
              />
            </form>

            {/* Filter Status Distribusi */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs bg-transparent text-slate-700 dark:text-slate-200 outline-hidden font-medium cursor-pointer"
              >
                <option value="SEMUA">Semua Status Distribusi</option>
                <option value="SIAP_UNDUH">Siap Diunduh (10/10 QR)</option>
                <option value="SUDAH_DIUNDUH">Sudah Diunduh</option>
                <option value="BELUM_GENERATE">Belum Dibuat (0/10)</option>
              </select>
            </div>

            {/* Filter Google Drive Link */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={gdriveFilter}
                onChange={(e) => setGdriveFilter(e.target.value)}
                className="w-full text-xs bg-transparent text-slate-700 dark:text-slate-200 outline-hidden font-medium cursor-pointer"
              >
                <option value="ALL">Semua Google Drive</option>
                <option value="YES">Sudah Ada Link GDrive</option>
                <option value="NO">Belum Ada Link GDrive</option>
              </select>
            </div>

            {/* Filter Kelurahan */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={kelurahanFilter}
                onChange={(e) => setKelurahanFilter(e.target.value)}
                className="w-full text-xs bg-transparent text-slate-700 dark:text-slate-200 outline-hidden font-medium cursor-pointer"
              >
                <option value="SEMUA">Semua Kelurahan</option>
                {uniqueKelurahans.map((kel) => (
                  <option key={kel} value={kel}>
                    {kel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading && data.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Memuat data distribusi kelompok KKN...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-8">
              <EmptyTableState
                icon={<FolderArchive className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
                title="Tidak ada kelompok yang sesuai filter"
                description="Coba ubah kata kunci pencarian atau sesuaikan filter status di atas."
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[200px]">Kelompok & Wilayah</th>
                  <th className="py-3 px-4 min-w-[160px]">DPL / Pembimbing</th>
                  <th className="py-3 px-4 min-w-[180px]">Kuota QR (5 Org + 5 Anorg)</th>
                  <th className="py-3 px-4 min-w-[150px]">Status Distribusi</th>
                  <th className="py-3 px-4 min-w-[260px]">Google Drive Kelompok</th>
                  <th className="py-3 px-4 min-w-[240px] text-right">Aksi Developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal text-slate-700 dark:text-slate-300">
                {data.map((item, idx) => {
                  const isComplete = item.totalBins >= 10;
                  const isGenerating = generatingId === item.id;
                  const isDownloading = downloadingZipId === item.id;
                  const isEditingGdrive = editingGdriveId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>

                      {/* Kelompok & Wilayah */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                          <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{item.kelurahan || "Wilayah belum diset"}</span>
                          {item.cakupanRw && Array.isArray(item.cakupanRw) && item.cakupanRw.length > 0 && (
                            <span className="text-slate-400">
                              • RW {item.cakupanRw.join(", ")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* DPL */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {item.dpl?.name || item.dplNamaMentah || (
                            <span className="text-slate-400 italic">Belum ada DPL</span>
                          )}
                        </div>
                        {item.dpl?.phone && (
                          <div className="text-[11px] text-slate-500">{item.dpl.phone}</div>
                        )}
                      </td>

                      {/* Kuota QR (Anti Duplikasi) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                10/10 Lengkap
                              </span>
                            ) : item.totalBins > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3 h-3" />
                                {item.totalBins}/10 QR
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                0/10 Belum Dibuat
                              </span>
                            )}

                            {item.totalBins > 0 && (
                              <button
                                onClick={() => setSelectedKelompokForModal(item)}
                                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                                title="Lihat detail 10 QR kelompok"
                              >
                                <Eye className="w-3 h-3" />
                                Lihat
                              </button>
                            )}
                          </div>

                          {/* Detail Komposisi 5 Organik & 5 Anorganik */}
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              ● {item.organikCount} Organik
                            </span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              ● {item.anorganikCount} Anorganik
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Distribusi */}
                      <td className="py-3.5 px-4">
                        {item.statusDistribusi === "SUDAH_DIUNDUH" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" />
                              Sudah Diunduh
                            </span>
                            {item.qrDownloadedAt && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(item.qrDownloadedAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                          </div>
                        ) : item.statusDistribusi === "SIAP_UNDUH" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            Siap Diunduh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            Perlu Dibuat
                          </span>
                        )}
                      </td>

                      {/* Google Drive Link (Inline Editable) */}
                      <td className="py-3.5 px-4">
                        {isEditingGdrive ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              placeholder="https://drive.google.com/..."
                              value={gdriveInputVal}
                              onChange={(e) => setGdriveInputVal(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-emerald-500 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveGdrive(item.id)}
                              disabled={savingGdrive}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingGdriveId(null);
                                setGdriveInputVal("");
                              }}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            {item.linkGoogleDrive ? (
                              <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                                <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <a
                                  href={item.linkGoogleDrive}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 dark:text-emerald-400 hover:underline truncate font-medium"
                                  title={item.linkGoogleDrive}
                                >
                                  {item.linkGoogleDrive}
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Belum ada link GDrive
                              </span>
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingGdriveId(item.id);
                                  setGdriveInputVal(item.linkGoogleDrive || "");
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Edit Link Google Drive"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {item.linkGoogleDrive && (
                                <a
                                  href={item.linkGoogleDrive}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition text-[11px] font-bold"
                                  title="Buka Folder Google Drive Kelompok"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Buka
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Aksi Developer */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Generate 10 QR button */}
                          {!isComplete ? (
                            <button
                              onClick={() => handleGenerate10Qr(item)}
                              disabled={isGenerating}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {isGenerating ? "Membuat..." : "Generate 10 QR"}
                            </button>
                          ) : (
                            <>
                              {/* Download ZIP Package */}
                              <button
                                onClick={() => handleDownloadZip(item)}
                                disabled={isDownloading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
                                title="Unduh paket ZIP 10 PNG resolusi tinggi + PDF siap cetak"
                              >
                                <Download className="w-3.5 h-3.5" />
                                {isDownloading ? "Mengompres..." : "Unduh ZIP (10 QR)"}
                              </button>

                              {/* Cetak PDF 10x15cm */}
                              <button
                                onClick={() => handlePrintPdf(item)}
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                                title="Cetak / Simpan PDF Stiker 10x15cm"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Standar Stiker: <b>10 x 15 cm (2500 x 3808 px)</b>. Setiap kelompok mendapatkan tepat <b>5 Organik & 5 Anorganik</b>.
            </span>
          </div>
          <div>Menampilkan {data.length} kelompok</div>
        </div>
      </div>

      {/* Modal Detail 10 QR Kelompok */}
      {selectedKelompokForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-emerald-600" />
                  Rincian 10 QR Code: {selectedKelompokForModal.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Wilayah: {selectedKelompokForModal.kelurahan || "-"} • DPL: {selectedKelompokForModal.dpl?.name || selectedKelompokForModal.dplNamaMentah || "-"}
                </p>
              </div>
              <button
                onClick={() => setSelectedKelompokForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of 10 Stickers */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedKelompokForModal.bins.map((bin, i) => {
                  const cat = (bin.category?.name || "").toUpperCase();
                  const isAnorg =
                    cat.includes("ANORGANIK") ||
                    cat.includes("NON_ORGANIC") ||
                    cat.includes("AGN") ||
                    bin.qrCode.includes("-AGN-");

                  return (
                    <div
                      key={bin.id || i}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 transition ${
                        isAnorg
                          ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                          : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                      }`}
                    >
                      <div className="w-12 h-12 bg-white rounded-lg p-1 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(
                            bin.qrCode
                          )}`}
                          alt={bin.qrCode}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isAnorg
                                ? "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200"
                                : "bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200"
                            }`}
                          >
                            #{i + 1} {isAnorg ? "ANORGANIK" : "ORGANIK"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {bin.status || "PRINTED"}
                          </span>
                        </div>
                        <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100 mt-1 truncate">
                          {bin.qrCode}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total: {selectedKelompokForModal.bins.length} Stiker (5 Organik + 5 Anorganik)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handlePrintPdf(selectedKelompokForModal);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak PDF (10x15cm)
                </button>

                <button
                  onClick={() => {
                    handleDownloadZip(selectedKelompokForModal);
                    setSelectedKelompokForModal(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Paket ZIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
