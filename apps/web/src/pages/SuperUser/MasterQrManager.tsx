import React, { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Badge } from "../../components/common/Badge";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { QrCode, AlertTriangle, PlayCircle, Download, RefreshCw, Trash2, Plus, Search, Filter, Printer, RotateCcw } from "lucide-react";
import { printQrStickers } from "../../utils/printQrStickers";

import { useAuthStore } from "../../store/useAuthStore";

interface BinQr {
  id: string;
  qrCode: string;
  status: string;
  createdAt: string;
  rtRw: { name: string; kelurahan: { name: string } } | null;
  user: { id: string; name: string; email: string; phone?: string } | null;
  qrBatch: { batchCode: string } | null;
  category: { id: string; name: string } | null;
}

interface InactiveBin {
  id: string;
  qrCode: string;
  owner: string;
  ownerEmail: string;
  wilayah: string;
  lastActivity: string;
  notes: string;
}

export const MasterQrManager: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["PANITIA_TASKFORCE", "PEMIMPIN", "DPL", "DOSEN_PEMBIMBING"].includes(user?.peran || "");
  const [qrs, setQrs] = useState<BinQr[]>([]);
  const [inactiveBins, setInactiveBins] = useState<InactiveBin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Approvals & Navigation states
  const [activeTab, setActiveTab] = useState<"qrs" | "pending_petugas">("qrs");
  const [pendingPetugas, setPendingPetugas] = useState<any[]>([]);

  // Modal generate states
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [totalQr, setTotalQr] = useState<number>(10);
  const [categoryId, setCategoryId] = useState<string>("");
  const [rtRwId, setRtRwId] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [rtRwAreas, setRtRwAreas] = useState<any[]>([]);

  // Replacement modal states
  const [showReplaceModal, setShowReplaceModal] = useState<boolean>(false);
  const [selectedOldBin, setSelectedOldBin] = useState<BinQr | null>(null);
  const [newQrInput, setNewQrInput] = useState<string>("");
  const [submittingReplace, setSubmittingReplace] = useState<boolean>(false);
  const [deleteQrModal, setDeleteQrModal] = useState<{ id: string; qrCode: string } | null>(null);
  const [isDeletingQr, setIsDeletingQr] = useState<boolean>(false);
  const [resetOwnershipModal, setResetOwnershipModal] = useState<{ id: string; qrCode: string } | null>(null);
  const [isResettingOwnership, setIsResettingOwnership] = useState<boolean>(false);

  const handleConfirmResetOwnership = async () => {
    if (!resetOwnershipModal) return;
    try {
      setIsResettingOwnership(true);
      const res = await api.post(`/bins/${resetOwnershipModal.id}/reset-ownership`);
      if (res.data?.success || res.data?.status === "success") {
        toast.success(`Kepemilikan QR Code ${resetOwnershipModal.qrCode} berhasil di-reset ke status PRINTED`);
        setResetOwnershipModal(null);
        fetchQrData();
      }
    } catch (e: any) {
      console.error("Gagal mereset kepemilikan QR Code:", e);
      toast.error(e.response?.data?.message || "Gagal mereset kepemilikan tempat sampah");
    } finally {
      setIsResettingOwnership(false);
    }
  };

  const fetchQrData = async () => {
    try {
      const [qrsRes, inactiveRes, pendingPetugasRes] = await Promise.all([
        api.get("/super-user/bins/qr-master", {
          params: { search: searchQuery || undefined, status: statusFilter || undefined },
        }),
        api.get("/super-user/bins/inactive"),
        api.get("/super-user/approvals/petugas"),
      ]);
      if (qrsRes.data?.success) setQrs(qrsRes.data.data || []);
      if (inactiveRes.data?.success) setInactiveBins(inactiveRes.data.data || []);
      if (pendingPetugasRes.data?.success) setPendingPetugas(pendingPetugasRes.data.data || []);
    } catch (e) {
      console.error("Gagal mengambil data QR & Persetujuan:", e);
      toast.error("Gagal memuat database QR");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMetadata = async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        api.get("/categories"),
        api.get("/areas/rt-rw"),
      ]);
      if (catRes.data?.success) setCategories(catRes.data.data || []);
      if (locRes.data?.success) setRtRwAreas(locRes.data.data || []);
    } catch (e) {
      console.error("Gagal memuat metadata lokasi/kategori:", e);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchQrData();
    fetchFormMetadata();
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(qrs.length / itemsPerPage) || 1;
  const paginatedQrs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return qrs.slice(start, start + itemsPerPage);
  }, [qrs, currentPage, itemsPerPage]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Kategori tempat sampah wajib dipilih");
      return;
    }

    try {
      const res = await api.post("/super-user/bins/generate-qr", {
        totalQr,
        categoryId,
        rtRwId: rtRwId ? parseInt(rtRwId, 10) : undefined,
      });
      if (res.data?.success) {
        toast.success("Batch QR Code berhasil diproduksi");
        setShowGenerateModal(false);
        fetchQrData();
      }
    } catch (error: any) {
      console.error("Gagal generate QR batch:", error);
      toast.error(error.response?.data?.message || "Gagal membuat batch");
    }
  };

  const handleReactivate = async (binId: string) => {
    try {
      const res = await api.put(`/super-user/bins/${binId}/reactivate`, {});
      if (res.data?.success) {
        toast.success("Tempat sampah berhasil diaktifkan kembali!");
        fetchQrData();
      }
    } catch (e: any) {
      console.error("Gagal mengaktifkan kembali tempat sampah:", e);
      toast.error(e.response?.data?.message || "Gagal memproses reaktivasi");
    }
  };

  const handleUpdateStatus = async (binId: string, newStatus: string) => {
    try {
      const res = await api.put(`/super-user/bins/${binId}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Status QR berhasil diubah menjadi ${newStatus}`);
        fetchQrData();
      }
    } catch (e: any) {
      console.error("Gagal memperbarui status QR:", e);
      toast.error(e.response?.data?.message || "Gagal memperbarui status");
    }
  };

  const handleOpenReplaceModal = (bin: BinQr) => {
    setSelectedOldBin(bin);
    setNewQrInput("");
    setShowReplaceModal(true);
  };

  const handleExecuteReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOldBin || !newQrInput) {
      toast.error("Pilih QR Code baru pengganti");
      return;
    }

    setSubmittingReplace(true);
    try {
      const res = await api.post(`/super-user/bins/${selectedOldBin.id}/replace`, {
        newBinId: newQrInput,
      });
      if (res.data?.success) {
        toast.success(`Penggantian QR ${selectedOldBin.qrCode} dengan ${newQrInput} berhasil!`);
        setShowReplaceModal(false);
        setSelectedOldBin(null);
        setNewQrInput("");
        fetchQrData();
      }
    } catch (e: any) {
      console.error("Gagal mengganti QR rusak:", e);
      toast.error(e.response?.data?.message || "Gagal mengganti tempat sampah rusak");
    } finally {
      setSubmittingReplace(false);
    }
  };

  const handleDeleteBin = (binId: string, qrCode: string) => {
    setDeleteQrModal({ id: binId, qrCode });
  };

  const handleConfirmDeleteBin = async () => {
    if (!deleteQrModal) return;
    try {
      setIsDeletingQr(true);
      const res = await api.delete(`/super-user/bins/${deleteQrModal.id}`);
      if (res.data?.success) {
        toast.success(`QR Code ${deleteQrModal.qrCode} berhasil dihapus dari database`);
        setDeleteQrModal(null);
        fetchQrData();
      }
    } catch (e: any) {
      console.error("Gagal menghapus QR Code:", e);
      toast.error(e.response?.data?.message || "Gagal menghapus QR Code");
    } finally {
      setIsDeletingQr(false);
    }
  };

  const verifyPetugas = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/super-user/approvals/petugas/${id}/verify`, { action });
      toast.success(action === "APPROVED" ? "Petugas residu berhasil disetujui" : "Pendaftaran petugas residu ditolak");
      fetchQrData();
    } catch (error) {
      console.error("Failed to verify petugas", error);
      toast.error("Gagal memverifikasi petugas");
    }
  };


  const handlePrintPdf = (itemsToPrint?: BinQr[]) => {
    const list = itemsToPrint && itemsToPrint.length > 0 ? itemsToPrint : qrs;
    if (!list || list.length === 0) {
      toast.error("Tidak ada data QR Code untuk dicetak.");
      return;
    }
    printQrStickers(
      list.map((item) => ({
        id: item.id,
        qrCode: item.qrCode,
        category: item.category,
        rtRw: item.rtRw,
        qrBatch: item.qrBatch,
        status: item.status,
      })),
      `Master_QR_BERSEKA_${new Date().toISOString().slice(0, 10)}`
    );
  };

  const handleExportCsv = () => {
    if (!qrs || qrs.length === 0) {
      toast.error("Tidak ada data Kode QR dalam tabel untuk diekspor.");
      return;
    }
    const headers = ["Kode QR", "Status", "Kategori", "Batch Asal", "Wilayah", "Pemegang Warga", "Email Pemegang", "Tanggal Dibuat"];
    const rows = qrs.map((q) => [
      `"${q.qrCode}"`,
      `"${q.status}"`,
      `"${q.category?.name || "-"}"`,
      `"${q.qrBatch?.batchCode || "-"}"`,
      `"${q.rtRw ? `${q.rtRw.name} - Kel. ${q.rtRw.kelurahan.name}` : "-"}"`,
      `"${q.user?.name || "-"}"`,
      `"${q.user?.email || "-"}"`,
      `"${new Date(q.createdAt).toLocaleString("id-ID")}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Master_QR_BERSEKA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("File CSV Master QR berhasil didownload!");
  };

  // Available unassigned PRINTED QRs for replacement modal
  const availablePrintedQrs = qrs.filter((q) => q.status === "PRINTED" || q.status === "BELUM_DIGUNAKAN");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <QrCode className="text-emerald-600 dark:text-emerald-400" size={28} />
            Master Database QR Code & Tempat Sampah
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manajemen penuh status QR Code, reaktivasi tempat sampah inaktif/rusak, dan produksi batch stiker fisik.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handlePrintPdf(qrs)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer size={15} className="text-emerald-400" />
            Cetak / Ekspor PDF
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Download size={15} className="text-emerald-600 dark:text-emerald-400" />
            Ekspor CSV
          </button>
          {!isReadOnly && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus size={16} />
              Generate Batch Baru
            </button>
          )}
        </div>
      </div>

      {/* Inactive & Broken Bins Alert Banner */}
      {inactiveBins.length > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 p-5 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-300 font-bold text-sm">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
              <span>Peringatan: {inactiveBins.length} Tempat Sampah Membutuhkan Tindakan (TIDAK AKTIF / RUSAK)</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200/60 dark:border-amber-800/50 overflow-hidden shadow-xs">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm text-left">
              <thead className="bg-amber-50/50 dark:bg-amber-950/50 text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Kode QR</th>
                  <th className="px-5 py-3">Warga Pemilik</th>
                  <th className="px-5 py-3">Wilayah</th>
                  <th className="px-5 py-3">Aktivitas Terakhir</th>
                  <th className="px-5 py-3 text-right">Aksi Reaktivasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {inactiveBins.map((b, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-amber-950 dark:text-amber-200">{b.qrCode}</td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{b.owner}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{b.ownerEmail}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">{b.wilayah}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(b.lastActivity).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleReactivate(b.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlayCircle size={14} />
                        Aktifkan Kembali
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("qrs")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "qrs" ? "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          Semua Master QR & Tempat Sampah ({qrs.length})
        </button>
        <button
          onClick={() => setActiveTab("pending_petugas")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "pending_petugas" ? "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          Verifikasi Petugas Residu ({pendingPetugas.length})
        </button>
      </div>

      {activeTab === "qrs" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Filters & Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 dark:bg-slate-800/50 flex flex-wrap gap-3 justify-between items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Cari Kode QR atau Pemilik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400 dark:text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="" className="dark:bg-slate-800">Semua Status Tempat Sampah</option>
                <option value="ACTIVE_BOUND" className="dark:bg-slate-800">ACTIVE_BOUND (Aktif)</option>
                <option value="PRINTED" className="dark:bg-slate-800">PRINTED (Belum Dipakai)</option>
                <option value="ASSIGNED_TO_PIC" className="dark:bg-slate-800">ASSIGNED_TO_PIC (Mahasiswa KKN)</option>
                <option value="INACTIVE" className="dark:bg-slate-800">INACTIVE (Tidak Aktif 30 Hari)</option>
                <option value="BROKEN" className="dark:bg-slate-800">BROKEN (Rusak Fisik)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Preview QR</th>
                  <th className="px-6 py-3.5">Status & Kategori</th>
                  <th className="px-6 py-3.5">Batch / Wilayah</th>
                  <th className="px-6 py-3.5">Pemilik Warga</th>
                  {!isReadOnly && <th className="px-6 py-3.5 text-center">Ubah Status</th>}
                  {!isReadOnly && <th className="px-6 py-3.5 text-right">Aksi Kelola</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedQrs.length === 0 ? (
                  <EmptyTableState
                    colSpan={isReadOnly ? 4 : 6}
                    entityName="QR Code Tempat Sampah"
                    isSearch={!!(searchQuery || statusFilter)}
                    searchQuery={searchQuery}
                    onResetSearch={() => {
                      setSearchQuery("");
                      setStatusFilter("");
                    }}
                  />
                ) : (
                  paginatedQrs.map((q) => {
                    const isBroken = q.status === "BROKEN";
                    const isInactive = q.status === "INACTIVE";

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 w-fit shadow-2xs">
                            <img
                              className="w-14 h-14 bg-white dark:bg-slate-900 p-1 rounded-lg"
                              alt="QR Code"
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(q.qrCode)}`}
                            />
                            <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                              {q.qrCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 space-y-1.5">
                          <Badge status={q.status} />
                          <div>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent dark:border-slate-700">
                              {q.category?.name || "UMUM"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{q.qrBatch ? q.qrBatch.batchCode : "-"}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">{q.rtRw ? `${q.rtRw.name} (Kel. ${q.rtRw.kelurahan.name})` : "-"}</div>
                        </td>
                        <td className="px-6 py-4">
                          {q.user ? (
                            <div>
                              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{q.user.name}</div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500">{q.user.phone || q.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Belum terikat Warga</span>
                          )}
                        </td>
                        {!isReadOnly && (
                          <td className="px-6 py-4 text-center">
                            <select
                              value={q.status}
                              onChange={(e) => handleUpdateStatus(q.id, e.target.value)}
                              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                            >
                              <option value="ACTIVE_BOUND" className="dark:bg-slate-800">ACTIVE_BOUND</option>
                              <option value="PRINTED" className="dark:bg-slate-800">PRINTED</option>
                              <option value="ASSIGNED_TO_PIC" className="dark:bg-slate-800">ASSIGNED_TO_PIC</option>
                              <option value="INACTIVE" className="dark:bg-slate-800">INACTIVE</option>
                              <option value="BROKEN" className="dark:bg-slate-800">BROKEN</option>
                            </select>
                          </td>
                        )}
                        {!isReadOnly && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handlePrintPdf([q])}
                                title="Cetak Poster Resmi QR Ini"
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer inline-flex items-center gap-1"
                              >
                                <Printer size={14} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="hidden xl:inline">Cetak Poster</span>
                              </button>

                              {(isBroken || isInactive) && (
                                <button
                                   onClick={() => handleReactivate(q.id)}
                                   title="Aktifkan Kembali"
                                   className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-bold transition-all border border-emerald-200 dark:border-emerald-800 cursor-pointer inline-flex items-center gap-1"
                                 >
                                   <PlayCircle size={14} />
                                   <span className="hidden sm:inline">Aktifkan</span>
                                 </button>
                              )}

                              {isBroken && (
                                <button
                                   onClick={() => handleOpenReplaceModal(q)}
                                   title="Ganti QR Code Rusak"
                                   className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-xs font-bold transition-all border border-blue-200 dark:border-blue-800 cursor-pointer inline-flex items-center gap-1"
                                 >
                                   <RefreshCw size={14} />
                                   <span className="hidden sm:inline">Ganti QR</span>
                                 </button>
                              )}

                              {q.user && (
                                <button
                                  onClick={() => setResetOwnershipModal({ id: q.id, qrCode: q.qrCode })}
                                  title="Reset Kepemilikan (Lepas dari Warga)"
                                  className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg text-xs font-bold transition-all border border-amber-200 dark:border-amber-800 cursor-pointer inline-flex items-center gap-1"
                                >
                                  <RotateCcw size={14} className="text-amber-600 dark:text-amber-400" />
                                  <span className="hidden sm:inline">Reset</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteBin(q.id, q.qrCode)}
                                title="Hapus QR Code"
                                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {qrs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={qrs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </div>
      )}

      {/* Petugas Verification Tab */}
      {activeTab === "pending_petugas" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Verifikasi Akun Petugas Residu (Global)</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            {pendingPetugas.length === 0 ? (
              <EmptyTableState
                entityName="Pengajuan Petugas Residu"
                description="Tidak ada pengajuan verifikasi akun petugas residu baru saat ini."
              />
            ) : (
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Nama & Kontak</th>
                    <th className="px-6 py-3">Zona Tugas</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {pendingPetugas.map((petugas) => (
                    <tr key={petugas.id} className="hover:bg-slate-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{petugas.nama}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{petugas.noWa}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {petugas.assignedZone || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => verifyPetugas(petugas.id, "APPROVED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => verifyPetugas(petugas.id, "REJECTED")}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Replace Broken Bin Modal */}
      {showReplaceModal && selectedOldBin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteReplace} className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <RefreshCw size={18} className="text-emerald-400" />
                Ganti Tempat Sampah Rusak (Replace QR)
              </h3>
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/80 p-4 rounded-xl space-y-1">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">QR Code Lama (Rusak)</div>
                <div className="font-mono font-bold text-rose-950 dark:text-rose-200 text-sm">{selectedOldBin.qrCode}</div>
                <div className="text-xs text-rose-700 dark:text-rose-300">
                  Pemilik: <span className="font-bold">{selectedOldBin.user?.name || "Tanpa Pemilik"}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pilih QR Code Baru Pengganti</label>
                {availablePrintedQrs.length === 0 ? (
                  <div className="p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
                    Tidak ada QR Code berstatus PRINTED yang tersedia. Silakan generate batch QR baru terlebih dahulu.
                  </div>
                ) : (
                  <select
                    value={newQrInput}
                    onChange={(e) => setNewQrInput(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="" className="dark:bg-slate-800">-- Pilih QR Code Pengganti --</option>
                    {availablePrintedQrs.map((item) => (
                      <option key={item.id} value={item.qrCode} className="dark:bg-slate-800">
                        {item.qrCode} ({item.category?.name || "UMUM"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Tindakan ini akan mengubah status QR lama ({selectedOldBin.qrCode}) menjadi BROKEN permanen dan mengalihkan kepemilikan Warga ke QR Code baru yang dipilih secara otomatis (`ACTIVE_BOUND`).
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingReplace || availablePrintedQrs.length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submittingReplace ? "Memproses..." : "Konfirmasi Penggantian"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Generate Batch Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
            <div className="px-6 py-4 bg-emerald-700 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Plus size={18} />
                Generate Batch QR Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-white/80 hover:text-white cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kode Batch</label>
                <input
                  type="text"
                  value="Otomatis Ditentukan Sistem"
                  disabled
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Jumlah Stiker QR Code</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={totalQr}
                  onChange={(e) => setTotalQr(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kategori Jenis Tempat Sampah</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  required
                >
                  <option value="" className="dark:bg-slate-800">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-slate-800">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Wilayah RT / RW Penerima</label>
                <select
                  value={rtRwId}
                  onChange={(e) => setRtRwId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="" className="dark:bg-slate-800">Umum (Tanpa Wilayah Spesifik)</option>
                  {rtRwAreas.map((item) => (
                    <option key={item.id} value={item.id} className="dark:bg-slate-800">
                      {item.name} ({item.kelurahan?.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Generate Batch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal Hapus Master QR */}
      <ConfirmModal
        isOpen={Boolean(deleteQrModal)}
        onClose={() => setDeleteQrModal(null)}
        onConfirm={handleConfirmDeleteBin}
        isLoading={isDeletingQr}
        title="Hapus Master QR Tempat Sampah"
        message={`Apakah Anda yakin ingin menghapus QR Code ${deleteQrModal?.qrCode || ""}? Tindakan ini permanen.`}
        confirmText="Ya, Hapus QR"
        type="danger"
      />

      {/* Confirmation Modal Reset Kepemilikan */}
      <ConfirmModal
        isOpen={Boolean(resetOwnershipModal)}
        onClose={() => setResetOwnershipModal(null)}
        onConfirm={handleConfirmResetOwnership}
        isLoading={isResettingOwnership}
        title="Reset Kepemilikan Tempat Sampah"
        message={`Apakah Anda yakin ingin melepas kepemilikan Warga dari QR Code ${resetOwnershipModal?.qrCode || ""}? Status tempat sampah akan di-reset kembali menjadi PRINTED (Belum Terikat).`}
        confirmText="Ya, Reset Kepemilikan"
        type="warning"
      />
    </div>
  );
};

export default MasterQrManager;
