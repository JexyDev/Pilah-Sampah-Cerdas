/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Monitoring from '../pages/Monitoring/Monitoring';
import MasterData from '../pages/MasterData/MasterData';
import Leaderboard from '../pages/Leaderboard/Leaderboard';
import NotFound from '../pages/NotFound/NotFound';
import Login from '../pages/Login/Login';

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
import SetorSampah from '../pages/SetorSampah/SetorSampah';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../store/useAuthStore';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.peran)) {
    // Redirect role yang tidak diizinkan kembali ke dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

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
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="monitoring" element={<ProtectedRoute allowedRoles={['ADMIN']}><Monitoring /></ProtectedRoute>} />
        <Route path="master-data" element={<ProtectedRoute allowedRoles={['ADMIN', 'PETUGAS_KELURAHAN']}><MasterData /></ProtectedRoute>} />
        <Route path="warga-tong" element={<ProtectedRoute allowedRoles={['ADMIN', 'PETUGAS_KELURAHAN']}><MasterData /></ProtectedRoute>} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="manajemen-pengguna" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManajemenPengguna /></ProtectedRoute>} />
        <Route path="manajemen-tempat-sampah" element={<ProtectedRoute allowedRoles={['ADMIN', 'PETUGAS_KELURAHAN', 'PETUGAS_RW', 'PETUGAS_RT']}><ManajemenTempatSampah /></ProtectedRoute>} />
        <Route path="manajemen-lokasi" element={<ProtectedRoute allowedRoles={['ADMIN', 'PETUGAS_KELURAHAN']}><ManajemenLokasi /></ProtectedRoute>} />
        <Route path="jadwal-kegiatan" element={<JadwalKegiatan />} />
        <Route path="kategori-sampah" element={<ProtectedRoute allowedRoles={['ADMIN', 'PETUGAS_KELURAHAN']}><KategoriSampah /></ProtectedRoute>} />
        <Route path="rekap-setoran" element={<ProtectedRoute allowedRoles={['ADMIN', 'PETUGAS_KELURAHAN', 'PETUGAS_RW', 'PETUGAS_RT']}><RekapSetoran /></ProtectedRoute>} />
        <Route path="poin-warga" element={<PoinWarga />} />
        <Route path="laporan-analitik" element={<ProtectedRoute allowedRoles={['ADMIN']}><LaporanAnalitik /></ProtectedRoute>} />
        <Route path="notifikasi" element={<Notifikasi />} />
        <Route path="pengaturan" element={<ProtectedRoute allowedRoles={['ADMIN', 'PETUGAS_KELURAHAN', 'WARGA']}><Pengaturan /></ProtectedRoute>} />
        <Route path="peta" element={<PlaceholderPage title="Peta Wilayah" />} />
        <Route path="evaluasi-ai" element={<PlaceholderPage title="Evaluasi AI" />} />
        <Route path="lainnya" element={<PlaceholderPage title="Menu Lainnya" />} />
        <Route path="setor" element={<ProtectedRoute allowedRoles={['WARGA']}><SetorSampah /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
