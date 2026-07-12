import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Monitoring from '../pages/Monitoring/Monitoring';
import MasterData from '../pages/MasterData/MasterData';
import Leaderboard from '../pages/Leaderboard/Leaderboard';
import NotFound from '../pages/NotFound/NotFound';

import ManajemenPengguna from '../pages/ManajemenPengguna/ManajemenPengguna';
import ManajemenTempatSampah from '../pages/ManajemenTempatSampah/ManajemenTempatSampah';
import ManajemenLokasi from '../pages/ManajemenLokasi/ManajemenLokasi';
import JadwalKegiatan from '../pages/JadwalKegiatan/JadwalKegiatan';
import KategoriSampah from '../pages/KategoriSampah/KategoriSampah';
import RekapSetoran from '../pages/RekapSetoran/RekapSetoran';
import PoinWarga from '../pages/PoinWarga/PoinWarga';
import LaporanAnalitik from '../pages/LaporanAnalitik/LaporanAnalitik';
import Notifikasi from '../pages/Notifikasi/Notifikasi';
import Pengaturan from '../pages/Pengaturan/Pengaturan';

// Placeholder page component
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
    <div className="bg-white/90 p-12 rounded-2xl shadow-sm border border-outline-variant text-center max-w-md">
      <span className="material-symbols-outlined text-primary text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
      <h2 className="text-[22px] font-bold text-on-surface mt-4">{title}</h2>
      <p className="text-[14px] text-on-surface-variant mt-2">Halaman ini sedang dalam tahap pengembangan. Fitur akan segera tersedia.</p>
    </div>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="master-data" element={<MasterData />} />
        <Route path="warga-tong" element={<MasterData />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="manajemen-pengguna" element={<ManajemenPengguna />} />
        <Route path="manajemen-tempat-sampah" element={<ManajemenTempatSampah />} />
        <Route path="manajemen-lokasi" element={<ManajemenLokasi />} />
        <Route path="jadwal-kegiatan" element={<JadwalKegiatan />} />
        <Route path="kategori-sampah" element={<KategoriSampah />} />
        <Route path="rekap-setoran" element={<RekapSetoran />} />
        <Route path="poin-warga" element={<PoinWarga />} />
        <Route path="laporan-analitik" element={<LaporanAnalitik />} />
        <Route path="notifikasi" element={<Notifikasi />} />
        <Route path="pengaturan" element={<Pengaturan />} />
        <Route path="peta" element={<PlaceholderPage title="Peta Wilayah" />} />
        <Route path="evaluasi-ai" element={<PlaceholderPage title="Evaluasi AI" />} />
        <Route path="lainnya" element={<PlaceholderPage title="Menu Lainnya" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
