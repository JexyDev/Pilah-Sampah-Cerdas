import React, { useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";

export const KknQrClaim = ({ onClaimSuccess }: { onClaimSuccess: () => void }) => {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Simulasi mengambil GPS
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await api.post("/kkn/qr/claim", { qrCode, latitude, longitude });
            toast.success("QR berhasil diklaim (ASSIGNED_TO_PIC)!");
            setQrCode("");
            onClaimSuccess();
          } catch (err: any) {
            setError(err.response?.data?.message || "Gagal mengklaim QR.");
          }
          setLoading(false);
        },
        () => {
          setError("Gagal mendapatkan lokasi GPS. Pastikan GPS aktif.");
          setLoading(false);
        }
      );
    } catch (err) {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
      <h3 className="font-bold text-lg mb-4">Langkah 1: Scan & Klaim QR Tempat Sampah Baru</h3>
      <p className="text-sm text-gray-500 mb-4">Wajib memindai QR fisik dan mendapatkan koordinat GPS sebelum dapat meregistrasikan warga.</p>
      
      <form onSubmit={handleClaim} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            required
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Kode QR (Contoh: BINA001)"
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !qrCode}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-icons-outlined text-lg">qr_code_scanner</span>
          {loading ? "Menyimpan..." : "Klaim QR"}
        </button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};
