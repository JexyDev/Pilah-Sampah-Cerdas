import React from "react";
import { BookOpen, FileText, Download, CheckCircle2, Shield, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

const PanduanPage: React.FC = () => {
  const handleDownloadPdf = () => {
    toast.success("Mengunduh Buku Panduan Trashcare (PDF)...");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-on-surface">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-8 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3">
            <BookOpen size={14} />
            Pusat Edukasi & Dokumentasi
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Buku Panduan & Operasional Trashcare</h1>
          <p className="text-emerald-100 text-sm mt-2 max-w-2xl">
            Panduan lengkap alur pemilahan sampah, aktivasi sticker QR tempat sampah, tata cara pendampingan KKN, serta SOP petugas residu Kecamatan Coblong.
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Download size={18} />
          Unduh PDF Panduan
        </button>
      </div>

      {/* Grid Panduan Per Peran */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Warga */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
            <UserCheck size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Panduan Warga</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Pisahkan sampah <strong>Organik</strong> (dapur, sisa makanan) dan <strong>Anorganik</strong> (plastik, kertas).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Tempel sticker QR resmi pada tempat sampah rumah tangga Anda.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Unggah foto setoran & pindai QR untuk mengaktifkan masa berlaku 30 hari.</span>
            </li>
          </ul>
        </div>

        {/* Mahasiswa KKN */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Panduan Mahasiswa KKN</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Lakukan pendampingan registrasi warga di wilayah tugas KKN.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Pindai QR sticker pertama kali untuk mengklaim lokasi & status PENDING_APPROVAL.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Portofolio aktivitas otomatis terekam pada dashboard pribadi mahasiswa.</span>
            </li>
          </ul>
        </div>

        {/* Petugas & Pengurus */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-bold">
            <Shield size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Panduan RW & Petugas Residu</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>RW melakukan persetujuan (approval) pendaftaran tempat sampah warga.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>Petugas Residu melakukan penimbangan fisik hilir pada jam operasional.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>Hasil timbangan diinput manual ke Web Monitoring dengan foto bukti.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PanduanPage;
