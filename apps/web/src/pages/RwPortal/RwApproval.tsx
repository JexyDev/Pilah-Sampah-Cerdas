import { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { Badge } from "../../components/common/Badge";

export const RwApproval = () => {
    const [pendingPetugas, setPendingPetugas] = useState<any[]>([]);
  const [inactiveBins, setInactiveBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [petugasRes, inactiveRes] = await Promise.all([
        api.get("/rw/petugas/pending").catch(() => ({ data: { data: [] } })),
        api.get("/rw/bins/inactive").catch(() => ({ data: { data: [] } })),
      ]);

      setPendingPetugas(petugasRes.data?.data || petugasRes.data || []);
      setInactiveBins(inactiveRes.data?.data || inactiveRes.data || []);
    } catch (error) {
      console.error("Failed to fetch RW approval data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  
  
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
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-4 shadow-sm">
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
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">Verifikasi RW</h1>
      


      {/* Petugas Verification */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden card-polish">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Verifikasi Akun Petugas Residu</h3>
        </div>
        <div className="p-4">
          {pendingPetugas.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center">Tidak ada pengajuan petugas residu baru.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama & Kontak</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {pendingPetugas.map((petugas) => {
                  const targetId = petugas.id || petugas.userId;
                  const isApproved = petugas.whitelistStatus === "APPROVED" || petugas.user?.status === "Aktif";
                  return (
                    <tr key={targetId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <td className="px-4 py-2">
                        <p className="font-semibold text-sm">{petugas.nama || petugas.user?.name || "Petugas Residu"}</p>
                        <p className="text-xs text-gray-500">{petugas.noWa || petugas.user?.phone || "-"}</p>
                      </td>
                      <td className="px-4 py-2">
                        {isApproved ? (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800">AKTIF</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-100 text-amber-800">MENUNGGU ACC</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={() => verifyPetugas(targetId, "APPROVED")} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold btn-polish cursor-pointer shadow-sm">Setujui</button>
                          <button onClick={() => verifyPetugas(targetId, "REJECTED")} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold btn-polish cursor-pointer shadow-sm">Tolak</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inactive Bins */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden card-polish">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Daftar Tempat Sampah Tidak Aktif (30 Hari+)</h3>
        </div>
        <div className="p-4">
          {inactiveBins.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center">Tidak ada tempat sampah yang inaktif di wilayah ini.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pemilik</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tindakan Lapangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {inactiveBins.map((bin) => (
                  <tr key={bin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150">
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
