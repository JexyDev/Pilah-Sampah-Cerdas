import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Monitoring from '../pages/Monitoring/Monitoring';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Halaman utama */}
        <Route index element={<Dashboard />} />
        
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="master-data" element={<div>Halaman Master Data</div>} />
        <Route path="peta" element={<div>Halaman Peta Wilayah</div>} />
        <Route path="warga-tong" element={<div>Halaman Data Warga & Tong</div>} />
        <Route path="leaderboard" element={<div>Halaman Leaderboard</div>} />
        <Route path="evaluasi-ai" element={<div>Halaman Evaluasi AI</div>} />
        <Route path="notifikasi" element={<div>Halaman Notifikasi</div>} />
        <Route path="lainnya" element={<div>Menu Lainnya (Mobile)</div>} />
        
        <Route path="*" element={<div>404 - Halaman tidak ditemukan</div>} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
