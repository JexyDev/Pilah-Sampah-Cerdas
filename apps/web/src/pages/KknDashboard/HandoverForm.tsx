import React, { useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { ConfirmModal } from "../../components/common/ConfirmModal";

export const HandoverForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [toKknUserId, setToKknUserId] = useState("");
  const [rtRwId, setRtRwId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toKknUserId.trim() || !rtRwId.trim()) {
      toast.error("Lengkapi ID Mahasiswa Penerus dan ID RT/RW");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleExecuteHandover = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/kkn/handover", {
        toKknUserId,
        rtRwId: Number(rtRwId),
        notes,
      });
      toast.success("Proses Serah Terima (Handover) Berhasil!");
      setIsConfirmOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal melakukan handover.");
      toast.error(err.response?.data?.message || "Gagal melakukan handover.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 mt-6">
      <h3 className="font-bold text-lg mb-2 text-amber-600 dark:text-amber-400">Serah Terima PIC (Handover Batch Baru)</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Fitur ini memindahkan semua QR Batch dan warga dampingan Anda ke Mahasiswa KKN penerus.</p>
      
      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">User ID Mahasiswa Penerus</label>
          <input type="text" required value={toKknUserId} onChange={e => setToKknUserId(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100" placeholder="Cth: cld...xyz" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">ID Wilayah RT/RW</label>
          <input type="number" required value={rtRwId} onChange={e => setRtRwId(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100" placeholder="Cth: 1" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Catatan Khusus Serah Terima</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-900 dark:text-slate-100" placeholder="Kondisi lapangan, kendala warga, dll..." rows={3} />
        </div>
        <div className="md:col-span-2">
          {error && <p className="text-red-500 dark:text-red-400 text-sm mb-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg disabled:opacity-50 font-bold cursor-pointer transition-colors">
            {loading ? "Memproses..." : "Lakukan Handover Permanen"}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteHandover}
        isLoading={loading}
        title="Konfirmasi Serah Terima Wilayah KKN"
        message="Apakah Anda yakin ingin memindahkan seluruh data warga dampingan dan QR batch aktif ke mahasiswa penerus ini? Tindakan ini permanen dan dicatat dalam riwayat audit."
        confirmText="Ya, Pindahkan Data"
        type="warning"
      />
    </div>
  );
};
