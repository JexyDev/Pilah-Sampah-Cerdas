import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout/MainLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import Monitoring from '../pages/Monitoring/Monitoring';
import MasterData from '../pages/MasterData/MasterData';
import Leaderboard from '../pages/Leaderboard/Leaderboard';
import NotFound from '../pages/NotFound/NotFound';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Halaman utama */}
        <Route index element={<Dashboard />} />
        
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="master-data" element={<MasterData />} />
        <Route path="peta" element={<div>Halaman Peta Wilayah</div>} />
        <Route path="warga-tong" element={<MasterData />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="evaluasi-ai" element={<div>Halaman Evaluasi AI</div>} />
        <Route path="notifikasi" element={<div>Halaman Notifikasi</div>} />
        <Route path="lainnya" element={<div>Menu Lainnya (Mobile)</div>} />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
