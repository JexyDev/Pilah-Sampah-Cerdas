import { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Badge } from "../../components/common/Badge";

export const RwApproval = () => {
  const [pendingBins, setPendingBins] = useState<any[]>([]);
  const [pendingPetugas, setPendingPetugas] = useState<any[]>([]);
  const [inactiveBins, setInactiveBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBinId, setRejectBinId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [binsRes, petugasRes, inactiveRes] = await Promise.all([
        api.get("/rw/bins/pending"),
        api.get("/rw/petugas/pending"),
        api.get("/rw/bins/inactive")
      ]);
      setPendingBins(binsRes.data);
      setPendingPetugas(petugasRes.data);
      setInactiveBins(inactiveRes.data);
    } catch (error) {
      console.error("Failed to fetch RW approval data", error);
      toast.error("Gagal memuat data persetujuan");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveBin = async (id: string) => {
    try {
      await api.put(`/rw/bins/${id}/approve`);
      toast.success("QR Bin berhasil disetujui! Poin ditambahkan.");
      fetchData();
    } catch (error) {
      console.error("Failed to approve bin", error);
      toast.error("Gagal menyetujui QR Bin");
    }
  };

  const rejectBin = async () => {
    if (!rejectBinId || !rejectReason) return;
    try {
      await api.put(`/rw/bins/${rejectBinId}/reject`, { reason: rejectReason });
      toast.success("Pengajuan QR Bin telah ditolak");
      setRejectBinId(null);
      setRejectReason("");
      fetchData();
    } catch (error) {
      console.error("Failed to reject bin", error);
      toast.error("Gagal menolak pengajuan");
    }
  };

  const markBinBroken = async (id: string) => {
    if (confirm("Tandai bin ini rusak permanen?")) {
      try {
        await api.put(`/rw/bins/${id}/broken`);
        toast.success("Status tempat sampah diubah menjadi RUSAK (BROKEN)");
        fetchData();
      } catch (error) {
        console.error("Failed to mark bin broken", error);
        toast.error("Gagal memperbarui status");
      }
    }
  };

  const verifyPetugas = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      await api.put(`/rw/petugas/${id}/verify`, { action });
      toast.success(action === "APPROVED" ? "Petugas residu berhasil disetujui" : "Pendaftaran petugas residu ditolak");
      fetchData();
    } catch (error) {
      console.error("Failed to verify petugas", error);
      toast.error("Gagal memverifikasi petugas");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-9 w-64 skeleton-loading rounded-lg mb-8"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <div className="h-6 w-48 skeleton-loading rounded-md"></div>
            <div className="space-y-3">
              <div className="h-12 w-full skeleton-loading rounded-lg"></div>
              <div className="h-12 w-full skeleton-loading rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portal Approval RW</h1>
      
      {/* Bin Approval */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-polish">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-sm">Persetujuan Aktivasi QR Bin Warga</h3>
        </div>
        <div className="p-4">
          {pendingBins.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center">Tidak ada pengajuan aktivasi QR Bin.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warga & Lokasi</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">QR Code & Kategori</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingBins.map((bin) => (
                  <tr key={bin.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-4 py-2">
                      <p className="font-semibold text-sm">{bin.user?.name}</p>
                      <p className="text-xs text-gray-500">{bin.user?.address}</p>
                      {bin.qrBatch?.assignedPic && <p className="text-xs text-blue-600 mt-1">Pendamping: {bin.qrBatch.assignedPic.name}</p>}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-semibold text-sm">{bin.qrCode}</p>
                      <Badge status={bin.category?.name || "PRINTED"} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => approveBin(bin.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold btn-polish cursor-pointer shadow-sm">Setujui</button>
                        <button onClick={() => setRejectBinId(bin.id)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold btn-polish cursor-pointer shadow-sm">Tolak</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {rejectBinId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white p-6 rounded-2xl w-96 shadow-xl border border-gray-100 scale-95 hover:scale-100 transition-all duration-300">
            <h3 className="text-lg font-bold mb-2 text-gray-800">Tolak Pengajuan Bin</h3>
            <p className="text-xs text-gray-500 mb-4">Berikan alasan mengapa pengajuan bin ini ditolak.</p>
            <textarea 
              value={rejectReason} 
              onChange={e => setRejectReason(e.target.value)} 
              className="w-full border border-gray-200 p-3 rounded-xl mb-4 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all duration-150 text-sm" 
              placeholder="Alasan penolakan..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectBinId(null)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">Batal</button>
              <button onClick={rejectBin} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold btn-polish cursor-pointer shadow-md">Kirim Penolakan</button>
            </div>
          </div>
        </div>
      )}

      {/* Petugas Verification */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-polish">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-sm">Verifikasi Akun Petugas Residu</h3>
        </div>
        <div className="p-4">
          {pendingPetugas.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center">Tidak ada pengajuan petugas residu baru.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama & Kontak</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingPetugas.map((petugas) => (
                  <tr key={petugas.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-4 py-2">
                      <p className="font-semibold text-sm">{petugas.nama}</p>
                      <p className="text-xs text-gray-500">{petugas.noWa}</p>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => verifyPetugas(petugas.id, "APPROVED")} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold btn-polish cursor-pointer shadow-sm">Setujui</button>
                        <button onClick={() => verifyPetugas(petugas.id, "REJECTED")} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold btn-polish cursor-pointer shadow-sm">Tolak</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inactive Bins */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-polish">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-sm">Daftar Tempat Sampah Tidak Aktif (30 Hari+)</h3>
        </div>
        <div className="p-4">
          {inactiveBins.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center">Tidak ada tong sampah yang inaktif di wilayah ini.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pemilik</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tindakan Lapangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inactiveBins.map((bin) => (
                  <tr key={bin.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-4 py-2 font-medium text-sm">{bin.user?.name}</td>
                    <td className="px-4 py-2 font-mono text-sm">{bin.qrCode}</td>
                    <td className="px-4 py-2">
                      <Badge status="INACTIVE" />
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => markBinBroken(bin.id)} className="text-rose-600 hover:text-rose-800 text-xs font-bold btn-polish cursor-pointer underline">Lapor Rusak Fisik (BROKEN)</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
