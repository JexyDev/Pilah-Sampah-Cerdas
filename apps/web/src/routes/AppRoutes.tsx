
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Scroll Restoration Helper Component
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};
import MainLayout from "../components/layout/MainLayout/MainLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import Monitoring from "../pages/Monitoring/Monitoring";
import MasterData from "../pages/MasterData/MasterData";
import MasterWilayah from "../pages/MasterWilayah/MasterWilayah";
import Leaderboard from "../pages/Leaderboard/Leaderboard";
import NotFound from "../pages/NotFound/NotFound";
import Login from "../pages/Login/Login";
import MahasiswaRegistration from "../pages/Registration/MahasiswaRegistration";
import Register from "../pages/Registration/Register";

import ManajemenPengguna from "../pages/ManajemenPengguna/ManajemenPengguna";
import ManajemenTempatSampah from "../pages/ManajemenTempatSampah/ManajemenTempatSampah";
import ManajemenLokasi from "../pages/ManajemenLokasi/ManajemenLokasi";
import JadwalKegiatan from "../pages/JadwalKegiatan/JadwalKegiatan";
import KategoriSampah from "../pages/KategoriSampah/KategoriSampah";
import RekapSetoran from "../pages/RekapSetoran/RekapSetoran";
import PoinWarga from "../pages/PoinWarga/PoinWarga";
import LaporanAnalitik from "../pages/LaporanAnalitik/LaporanAnalitik";
import Notifikasi from "../pages/Notifikasi/Notifikasi";
import Pengaturan from "../pages/Pengaturan/Pengaturan";
import SimulasiModelAI from "../pages/SimulasiModelAI/SimulasiModelAI";
import PenggunaOnline from "../pages/PenggunaOnline/PenggunaOnline";
import SetorSampah from "../pages/SetorSampah/SetorSampah";
import KknDashboard from "../pages/KknDashboard/KknDashboard";
import KknWargaMonitoring from "../pages/KknDashboard/KknWargaMonitoring";
import { useAuthStore, WEB_DISABLED_ROLES } from "../store/useAuthStore";
import type { UserRole } from "../store/useAuthStore";
import { ManageConfigs } from "../pages/SuperUser/ManageConfigs";
import { AuditTrailList } from "../pages/SuperUser/AuditTrailList";
import { MasterQrManager } from "../pages/SuperUser/MasterQrManager";
import { ReviewDiscrepancy } from "../pages/SuperUser/ReviewDiscrepancy";
import AktivitasMonitoring from "../pages/SuperUser/AktivitasMonitoring";
import MonitoringAbsen from "../pages/MonitoringAbsen/MonitoringAbsen";
import ManajemenPengangkutan from "../pages/ManajemenPengangkutan/ManajemenPengangkutan";
import ManajemenEkosistemKkn from "../pages/ManajemenEkosistemKkn/ManajemenEkosistemKkn";
import PemanfaatanSampah from "../pages/PemanfaatanSampah/PemanfaatanSampah";
import HasilPemanfaatan from "../pages/HasilPemanfaatan/HasilPemanfaatan";
import { RwApproval } from "../pages/RwPortal/RwApproval";
import { RwFacilityInput } from "../pages/RwPortal/RwFacilityInput";
import InputSetoranManual from "../pages/InputSetoranManual/InputSetoranManual";
import IdeDaurUlang from "../pages/IdeDaurUlang/IdeDaurUlang";
import TentangAplikasi from "../pages/TentangAplikasi/TentangAplikasi";
import PanduanPage from "../pages/Panduan/PanduanPage";
import DplDashboardPage from "../pages/dpl/DplDashboardPage";
import LandingPage from "../pages/LandingPage/LandingPage";
import RolePermissionPage from "../pages/SuperUser/RolePermissionPage";
import ImportSurveiKkn from "../pages/SuperUser/ImportSurveiKkn";
import DataSurveiKkn from "../pages/SuperUser/DataSurveiKkn";
import DetailSurveiKkn from "../pages/SuperUser/DetailSurveiKkn";
import EditSurveiKkn from "../pages/SuperUser/EditSurveiKkn";
import ResiduDashboard from "../pages/ResiduDashboard/ResiduDashboard";
import DownloadPage from "../pages/Download/DownloadPage";
import EvaluasiDampakKkn from "../pages/EvaluasiDampak/EvaluasiDampakKkn";

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (WEB_DISABLED_ROLES.includes(user.peran)) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user.peran !== "DEVELOPER" && !allowedRoles.includes(user.peran)) {
    // Redirect role yang tidak diizinkan kembali ke dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Placeholder page component
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
    <div className="bg-white/90 p-12 rounded-2xl shadow-sm border border-outline-variant text-center max-w-md">
      <span
        className="material-symbols-outlined text-primary text-[64px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        construction
      </span>
      <h2 className="text-[22px] font-bold text-on-surface mt-4">{title}</h2>
      <p className="text-[14px] text-on-surface-variant mt-2">
        Halaman ini sedang dalam tahap pengembangan. Fitur akan segera tersedia.
      </p>
    </div>
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-mahasiswa" element={<MahasiswaRegistration />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT"]}>
              <Monitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-absen"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL"]}>
              <MonitoringAbsen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-aktivitas"
          element={
            <ProtectedRoute allowedRoles={["LURAH", "CAMAT", "SUPER_USER", "ADMIN_DLH"]}>
              <AktivitasMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manajemen-pengangkutan"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "PETUGAS_RESIDU",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
              ]}
            >
              <ManajemenPengangkutan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-qr"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH"]}>
              <MasterData />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-wilayah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <MasterWilayah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warga-tempat-sampah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH"]}>
              <MasterData />
            </ProtectedRoute>
          }
        />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route
          path="/master-pengguna"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-data-pengguna"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manajemen-pengguna"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pengguna-online"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <PenggunaOnline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manajemen-tempat-sampah"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "RT",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
              ]}
            >
              <ManajemenTempatSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manajemen-lokasi"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "RT",
                "MAHASISWA_KKN",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
              ]}
            >
              <ManajemenLokasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-dpl"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <DplDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <DplDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/role-permissions"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER"]}>
              <RolePermissionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulasi-model-ai"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH"]}>
              <SimulasiModelAI />
            </ProtectedRoute>
          }
        />
        <Route path="/panduan" element={<PanduanPage />} />
        <Route
          path="/manajemen-ekosistem-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH"]}>
              <ManajemenEkosistemKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pemanfaatan-sampah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <PemanfaatanSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hasil-pemanfaatan"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <HasilPemanfaatan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setor-sampah"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "RT",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DPL",
                "WARGA",
              ]}
            >
              <SetorSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jadwal-kegiatan"
          element={<JadwalKegiatan />}
        />
        
        <Route
          path="/input-manual"
          element={
            <ProtectedRoute allowedRoles={["PETUGAS_RESIDU", "SUPER_USER", "ADMIN_DLH"]}>
              <InputSetoranManual />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kategori-sampah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <KategoriSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rekap-setoran"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "RT",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DPL",
              ]}
            >
              <RekapSetoran />
            </ProtectedRoute>
          }
        />
        <Route path="/poin-warga" element={<PoinWarga />} />
        <Route
          path="/laporan-analitik"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <LaporanAnalitik />
            </ProtectedRoute>
          }
        />
        <Route path="/notifikasi" element={<Notifikasi />} />
        <Route
          path="/pengaturan"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "RT",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DPL",
                "WARGA",
              ]}
            >
              <Pengaturan />
            </ProtectedRoute>
          }
        />
        <Route path="/peta" element={<Navigate to="/manajemen-lokasi" replace />} />
        <Route path="/evaluasi-ai" element={<Navigate to="/superUser/discrepancies" replace />} />
        <Route path="/lainnya" element={<PlaceholderPage title="Menu Lainnya" />} />
        <Route
          path="/setor"
          element={
            <ProtectedRoute allowedRoles={["WARGA"]}>
              <SetorSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kkn-portal"
          element={
            <ProtectedRoute allowedRoles={["MAHASISWA_KKN"]}>
              <KknDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/residu-portal"
          element={
            <ProtectedRoute allowedRoles={["PETUGAS_RESIDU"]}>
              <ResiduDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/configs"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER"]}>
              <ManageConfigs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/audit"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER"]}>
              <AuditTrailList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/qr-master"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER"]}>
              <MasterQrManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/discrepancies"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <ReviewDiscrepancy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/import-survei-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER"]}>
              <ImportSurveiKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/data-survei-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "PANITIA_TASKFORCE"]}>
              <DataSurveiKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluasi-dampak-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "PANITIA_TASKFORCE", "PEMIMPIN"]}>
              <EvaluasiDampakKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/data-survei-kkn/:id"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "PANITIA_TASKFORCE"]}>
              <DetailSurveiKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/data-survei-kkn/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "PANITIA_TASKFORCE"]}>
              <EditSurveiKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rw/approval"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "RW", "RT"]}>
              <RwApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rw/fasilitas"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "RW", "RT"]}>
              <RwFacilityInput />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ide-daur-ulang"
          element={<IdeDaurUlang />}
        />
        <Route path="/tentang" element={<TentangAplikasi />} />
        <Route
          path="/kkn/monitoring-warga"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "MAHASISWA_KKN"]}>
              <KknWargaMonitoring />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </>
  );
};

export default AppRoutes;
