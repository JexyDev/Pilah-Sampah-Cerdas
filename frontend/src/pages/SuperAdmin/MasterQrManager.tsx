import { QrCode, AlertTriangle, PlayCircle } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Badge } from "../../components/common/Badge";

interface BinQr {
  id: string;
  qrCode: string;
  status: string;
  createdAt: string;
  rtRw: { name: string; kelurahan: { name: string } };
  user: { name: string; email: string } | null;
  qrBatch: { batchCode: string } | null;
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
  const [qrs, setQrs] = useState<BinQr[]>([]);
  const [inactiveBins, setInactiveBins] = useState<InactiveBin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Approvals states
  const [activeTab, setActiveTab] = useState<"qrs" | "pending_bins" | "pending_petugas">("qrs");
  const [pendingBins, setPendingBins] = useState<any[]>([]);
  const [pendingPetugas, setPendingPetugas] = useState<any[]>([]);
  const [rejectBinId, setRejectBinId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Modal generate states
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [totalQr, setTotalQr] = useState<number>(10);
  const [categoryId, setCategoryId] = useState<string>("");
  const [rtRwId, setRtRwId] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [rtRwAreas, setRtRwAreas] = useState<any[]>([]);

  const fetchQrData = async () => {
    try {
      const [qrsRes, inactiveRes, pendingBinsRes, pendingPetugasRes] = await Promise.all([
        api.get("/super-admin/bins/qr-master", {
          params: { search: searchQuery || undefined, status: statusFilter || undefined },
        }),
        api.get("/super-admin/bins/inactive"),
        api.get("/super-admin/approvals/bins"),
        api.get("/super-admin/approvals/petugas"),
      ]);
      if (qrsRes.data.success) setQrs(qrsRes.data.data);
      if (inactiveRes.data.success) setInactiveBins(inactiveRes.data.data);
      if (pendingBinsRes.data.success) setPendingBins(pendingBinsRes.data.data);
      if (pendingPetugasRes.data.success) setPendingPetugas(pendingPetugasRes.data.data);
    } catch (e) {
      console.error("Gagal mengambil data QR & Persetujuan:", e);
      toast.error("Gagal memuat database QR");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMetadata = async () => {
    try {
      const catRes = await api.get("/categories");
      const locRes = await api.get("/areas/rt-rw");
      if (catRes.data.success) setCategories(catRes.data.data);
      if (locRes.data.success) setRtRwAreas(locRes.data.data);
    } catch (e) {
      console.error("Gagal memuat metadata lokasi/kategori:", e);
    }
  };

  useEffect(() => {
    fetchQrData();
    fetchFormMetadata();
  }, [searchQuery, statusFilter]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Kategori wajib dipilih");
      return;
    }

    try {
      const res = await api.post(
        "/super-admin/bins/generate-qr",
        {
          totalQr,
          categoryId,
          rtRwId: rtRwId ? parseInt(rtRwId, 10) : undefined,
        }
      );
      if (res.data.success) {
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
      const res = await api.put(
        `/super-admin/bins/${binId}/reactivate`,
        {}
      );
      if (res.data.success) {
        toast.success("Tempat sampah berhasil diaktifkan kembali!");
        fetchQrData();
      }
    } catch (e) {
      console.error("Gagal mengaktifkan kembali tempat sampah:", e);
      toast.error("Gagal memproses reaktivasi");
    }
  };

  const approveBin = async (id: string) => {
    try {
      await api.put(`/super-admin/approvals/bins/${id}/approve`);
      toast.success("QR Bin berhasil disetujui! Warga & Mahasiswa mendapat bonus poin.");
      fetchQrData();
    } catch (error) {
      console.error("Failed to approve bin", error);
      toast.error("Gagal menyetujui QR Bin");
    }
  };

  const rejectBin = async () => {
    if (!rejectBinId || !rejectReason) return;
    try {
      await api.put(`/super-admin/approvals/bins/${rejectBinId}/reject`, { reason: rejectReason });
      toast.success("Pengajuan QR Bin telah ditolak");
      setRejectBinId(null);
      setRejectReason("");
      fetchQrData();
    } catch (error) {
      console.error("Failed to reject bin", error);
      toast.error("Gagal menolak pengajuan");
    }
  };

  const verifyPetugas = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/super-admin/approvals/petugas/${id}/verify`, { action });
      toast.success(action === "APPROVED" ? "Petugas residu berhasil disetujui" : "Pendaftaran petugas residu ditolak");
      fetchQrData();
    } catch (error) {
      console.error("Failed to verify petugas", error);
      toast.error("Gagal memverifikasi petugas");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Database Master QR & Bin</h1>
          <p className="text-sm text-gray-500 mt-1">Registrasi QR Batch baru, status pencetakan, dan manajemen reaktivasi bin tidak aktif.</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm text-sm font-semibold hover:bg-primary-dark transition"
        >
          <QrCode className="text-white" size={20} />
          Generate QR Batch
        </button>
      </div>

      {/* Inactive Bins Section */}
      {inactiveBins.length > 0 && (
        <div className="bg-red-50/50 border border-red-200/60 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle size={24} />
            <h3 className="font-bold text-sm">Peringatan: Ada Tempat Sampah Berstatus TIDAK AKTIF</h3>
          </div>
          <div className="bg-white rounded-xl border border-red-100 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-red-50/30 text-[11px] font-bold text-red-800 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Kode QR</th>
                  <th className="px-6 py-3">Warga Pemilik</th>
                  <th className="px-6 py-3">Wilayah</th>
                  <th className="px-6 py-3">Aktivitas Terakhir</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 text-gray-700">
                {inactiveBins.map((b, idx) => (
                  <tr key={idx} className="hover:bg-red-50/10 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-red-900">{b.qrCode}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{b.owner}</div>
                      <div className="text-xs text-gray-400">{b.ownerEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">{b.wilayah}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(b.lastActivity).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleReactivate(b.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold shadow-sm transition inline-flex items-center gap-1"
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
      <div className="flex border-b border-gray-200 gap-4 mb-6">
        <button
          onClick={() => setActiveTab("qrs")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "qrs" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Semua QR & Bin ({qrs.length})
        </button>
        <button
          onClick={() => setActiveTab("pending_bins")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "pending_bins"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Persetujuan Bin Warga ({pendingBins.length})
        </button>
        <button
          onClick={() => setActiveTab("pending_petugas")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "pending_petugas"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Verifikasi Petugas Residu ({pendingPetugas.length})
        </button>
      </div>

      {activeTab === "qrs" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Daftar Status Master QR</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cari Kode QR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="">Semua Status</option>
                <option value="PRINTED">PRINTED</option>
                <option value="ASSIGNED_TO_PIC">ASSIGNED_TO_PIC</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="ACTIVE_BOUND">ACTIVE_BOUND</option>
                <option value="BROKEN">BROKEN</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Kode QR</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Batch Asal</th>
                  <th className="px-6 py-3">Wilayah Terdaftar</th>
                  <th className="px-6 py-3">Pemegang/Warga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {qrs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      Tidak ada QR Code ditemukan
                    </td>
                  </tr>
                ) : (
                  qrs.map((q, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1 bg-white p-2 rounded-xl border border-gray-200/60 w-fit shadow-sm">
                            <img
                              className="w-16 h-16"
                              alt="QR Code"
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(q.qrCode)}`}
                            />
                            <span className="text-[10px] font-mono font-bold text-primary tracking-wider">
                              {q.qrCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={q.status} />
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                          {q.qrBatch ? q.qrBatch.batchCode : "-"}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {q.rtRw ? `${q.rtRw.name} (Kel. ${q.rtRw.kelurahan.name})` : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {q.user ? (
                            <div>
                              <div className="font-semibold text-gray-900">{q.user.name}</div>
                              <div className="text-xs text-gray-400">{q.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "pending_bins" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm">Persetujuan Aktivasi QR Bin Warga (Global)</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            {pendingBins.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">Tidak ada pengajuan aktivasi QR Bin.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Warga & Lokasi</th>
                    <th className="px-6 py-3">QR Code & Kategori</th>
                    <th className="px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {pendingBins.map((bin) => (
                    <tr key={bin.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm text-gray-900">{bin.user?.name}</p>
                        <p className="text-xs text-gray-500">{bin.user?.address}</p>
                        {bin.qrBatch?.assignedPic && (
                          <p className="text-xs text-blue-600 mt-1">Pendamping: {bin.qrBatch.assignedPic.name}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm">{bin.qrCode}</p>
                        <Badge status={bin.category?.name || "PRINTED"} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveBin(bin.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => setRejectBinId(bin.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
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

      {activeTab === "pending_petugas" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm">Verifikasi Akun Petugas Residu (Global)</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            {pendingPetugas.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">Tidak ada pengajuan petugas residu baru.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Nama & Kontak</th>
                    <th className="px-6 py-3">Zona Tugas</th>
                    <th className="px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {pendingPetugas.map((petugas) => (
                    <tr key={petugas.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm text-gray-900">{petugas.nama}</p>
                        <p className="text-xs text-gray-500">{petugas.noWa}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        {petugas.assignedZone || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => verifyPetugas(petugas.id, "APPROVED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => verifyPetugas(petugas.id, "REJECTED")}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
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

      {rejectBinId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white p-6 rounded-2xl w-96 shadow-xl border border-gray-100 scale-95 hover:scale-100 transition-all duration-300">
            <h3 className="text-lg font-bold mb-2 text-gray-800">Tolak Pengajuan Bin</h3>
            <p className="text-xs text-gray-500 mb-4">Berikan alasan mengapa pengajuan bin ini ditolak.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl mb-4 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-150 text-sm"
              placeholder="Alasan penolakan..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectBinId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={rejectBin}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold btn-polish cursor-pointer shadow-md"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Batch Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleGenerate} className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-primary text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Generate QR Batch</h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="material-symbols-outlined text-white hover:text-gray-200"
              >
                close
              </button>
            </div>
            <div className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Kode Batch</label>
                <input
                  type="text"
                  value="Otomatis (Sistem)"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Jumlah QR Code</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={totalQr}
                  onChange={(e) => setTotalQr(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Kategori Jenis Tempat Sampah</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Wilayah RT / RW Penerima</label>
                <select
                  value={rtRwId}
                  onChange={(e) => setRtRwId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Umum (Tanpa Wilayah)</option>
                  {rtRwAreas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.kelurahan?.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark shadow-sm"
              >
                Generate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
