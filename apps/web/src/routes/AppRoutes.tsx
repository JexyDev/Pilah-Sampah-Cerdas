
/**
 * Project: BERSEKA
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
import MasterRuleEngine from "../pages/MasterRuleEngine/MasterRuleEngine";
import MasterProvinsi from "../pages/MasterProvinsi/MasterProvinsi";
import MasterKabupaten from "../pages/MasterKabupaten/MasterKabupaten";
import MasterKecamatan from "../pages/MasterKecamatan/MasterKecamatan";
import MasterKelurahan from "../pages/MasterKelurahan/MasterKelurahan";
import MasterRw from "../pages/MasterRw/MasterRw";
import JadwalKegiatan from "../pages/JadwalKegiatan/JadwalKegiatan";
import RekapSetoran from "../pages/RekapSetoran/RekapSetoran";
import PoinWarga from "../pages/PoinWarga/PoinWarga";
import MasterDatasetKlasifikasi from "../pages/MasterDatasetKlasifikasi/MasterDatasetKlasifikasi";
import Notifikasi from "../pages/Notifikasi/Notifikasi";
import Pengaturan from "../pages/Pengaturan/Pengaturan";
import SimulasiModelAI from "../pages/SimulasiModelAI/SimulasiModelAI";
import PenggunaOnline from "../pages/PenggunaOnline/PenggunaOnline";
import SetorSampah from "../pages/SetorSampah/SetorSampah";
import KknDashboard from "../pages/KknDashboard/KknDashboard";
import KknWargaMonitoring from "../pages/KknDashboard/KknWargaMonitoring";
import { useAuthStore, WEB_DISABLED_ROLES } from "../store/useAuthStore";
import type { UserRole } from "../store/useAuthStore";
import { AuditTrailList } from "../pages/SuperUser/AuditTrailList";
import MonitoringAbsen from "../pages/MonitoringAbsen/MonitoringAbsen";
import ManajemenPengangkutan from "../pages/ManajemenPengangkutan/ManajemenPengangkutan";
import ManajemenEkosistemKkn from "../pages/ManajemenEkosistemKkn/ManajemenEkosistemKkn";
import PemanfaatanSampah from "../pages/PemanfaatanSampah/PemanfaatanSampah";
import PoskoKknPage from "../pages/PoskoKkn/PoskoKknPage";
import HasilPemanfaatan from "../pages/HasilPemanfaatan/HasilPemanfaatan";
import { RwApproval } from "../pages/RwPortal/RwApproval";
import InputSetoranManual from "../pages/InputSetoranManual/InputSetoranManual";
import IdeDaurUlang from "../pages/IdeDaurUlang/IdeDaurUlang";
import TentangAplikasi from "../pages/TentangAplikasi/TentangAplikasi";
import PanduanPage from "../pages/Panduan/PanduanPage";
import DplDashboardPage from "../pages/dpl/DplDashboardPage";
import LandingPage from "../pages/LandingPage/LandingPage";
import ImportSurveiKkn from "../pages/SuperUser/ImportSurveiKkn";
import DataSurveiKkn from "../pages/SuperUser/DataSurveiKkn";
import DetailSurveiKkn from "../pages/SuperUser/DetailSurveiKkn";
import EditSurveiKkn from "../pages/SuperUser/EditSurveiKkn";
import ResiduDashboard from "../pages/ResiduDashboard/ResiduDashboard";
import DownloadPage from "../pages/Download/DownloadPage";
import EvaluasiDampakKkn from "../pages/EvaluasiDampak/EvaluasiDampakKkn";
import PemantauanDanRekapitulasi from "../pages/PemantauanDanRekapitulasi/PemantauanDanRekapitulasi";
import ProgramKerjaKkn from "../pages/ProgramKerjaKkn/ProgramKerjaKkn";
import PenilaianProkerPage from "../pages/PenilaianKkn/PenilaianProkerPage";
import RekapNilaiKknPage from "../pages/PenilaianKkn/RekapNilaiKknPage";
import PenilaianKknMahasiswaPage from "../pages/PenilaianKkn/PenilaianKknMahasiswaPage";
import PenilaianLaporanAkhirPage from "../pages/PenilaianKkn/PenilaianLaporanAkhirPage";
import MasterPanduanPage from "../pages/MasterData/MasterPanduanPage";
import MasterKegiatanSampahPage from "../pages/MasterData/MasterKegiatanSampahPage";
import { LogbookKknPage } from "../pages/dpl/LogbookKknPage";
import LogAktivitasDpl from "../pages/dpl/LogAktivitasDpl";

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

  if (
    allowedRoles &&
    user.peran !== "DEVELOPER" &&
    !allowedRoles.includes(user.peran)
  ) {
    // Redirect role yang tidak diizinkan kembali ke dashboard
    return <Navigate to="/dasbor" replace />;
  }

  return children;
};

// Placeholder page component
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-slate-800 dark:text-slate-100">
    <div className="bg-white/90 dark:bg-slate-900/90 p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center max-w-md">
      <span
        className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[64px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        construction
      </span>
      <h2 className="text-[22px] font-bold text-slate-900 dark:text-slate-100 mt-4">{title}</h2>
      <p className="text-[14px] text-slate-600 dark:text-slate-400 mt-2">
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
        <Route path="/dasbor" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/dasbor" replace />} />
        <Route path="/manajemen-lokasi" element={<Navigate to="/master-data/rukun-warga" replace />} />
        <Route path="/setor" element={<Navigate to="/penyetoran-sampah" replace />} />
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PETUGAS_RESIDU", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN", "WARGA", "DEVELOPER"]}>
              <Monitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-wilayah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PETUGAS_RESIDU", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN", "WARGA", "DEVELOPER"]}>
              <Monitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-absen"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING"]}>
              <MonitoringAbsen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-kegiatan/presensi"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING"]}>
              <MonitoringAbsen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-pemilahan/rekapitulasi-setoran"
          element={
            <ProtectedRoute allowedRoles={["LURAH", "CAMAT", "SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "RW", "PETUGAS_RESIDU", "MAHASISWA_KKN", "DPL"]}>
              <PemantauanDanRekapitulasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pemantauan-rekapitulasi"
          element={
            <ProtectedRoute allowedRoles={["LURAH", "CAMAT", "SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "RW", "PETUGAS_RESIDU", "MAHASISWA_KKN", "DPL"]}>
              <PemantauanDanRekapitulasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-pemilahan/pengangkutan-sampah"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "DEVELOPER",
              ]}
            >
              <ManajemenPengangkutan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pengangkutan-residu"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "DEVELOPER",
              ]}
            >
              <ManajemenPengangkutan />
            </ProtectedRoute>
          }
        />
        <Route path="/manajemen-pengangkutan" element={<Navigate to="/monitoring-pemilahan/pengangkutan-sampah" replace />} />
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
        <Route
          path="/monitoring-pemilahan/peringkat-warga"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "WARGA",
                "DEVELOPER",
              ]}
            >
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peringkat"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "WARGA",
                "DEVELOPER",
              ]}
            >
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route path="/leaderboard" element={<Navigate to="/monitoring-pemilahan/peringkat-warga" replace />} />
        <Route
          path="/pengguna"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "RW", "DEVELOPER"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route path="/master-pengguna" element={<Navigate to="/pengguna" replace />} />
        <Route
          path="/master-data-pengguna"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "RW", "DEVELOPER"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manajemen-pengguna"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "RW", "DEVELOPER"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "RW"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "RW"]}>
              <ManajemenPengguna />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-data/pengguna-online"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <PenggunaOnline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pengguna-online"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <PenggunaOnline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-data/manajemen-tempat-sampah"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DEVELOPER",
              ]}
            >
              <ManajemenTempatSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-pengelolaan/tempat-sampah"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DEVELOPER",
              ]}
            >
              <ManajemenTempatSampah />
            </ProtectedRoute>
          }
        />
        <Route path="/manajemen-tempat-sampah" element={<Navigate to="/monitoring-pengelolaan/tempat-sampah" replace />} />
        <Route
          path="/peraturan"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DEVELOPER",
              ]}
            >
              <MasterRuleEngine />
            </ProtectedRoute>
          }
        />
        <Route path="/dataset/peraturan" element={<Navigate to="/peraturan" replace />} />
        <Route path="/master-data/rule-engine" element={<Navigate to="/peraturan" replace />} />
        <Route path="/master-rule-engine" element={<Navigate to="/peraturan" replace />} />
        {/* Provinsi */}
        <Route
          path="/wilayah/provinsi"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DEVELOPER",
              ]}
            >
              <MasterProvinsi />
            </ProtectedRoute>
          }
        />
        <Route path="/master-data/provinsi" element={<Navigate to="/wilayah/provinsi" replace />} />
        <Route path="/master-provinsi" element={<Navigate to="/wilayah/provinsi" replace />} />

        {/* Kota / Kabupaten */}
        <Route
          path="/wilayah/kota-kabupaten"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DEVELOPER",
              ]}
            >
              <MasterKabupaten />
            </ProtectedRoute>
          }
        />
        <Route path="/master-data/kota-kabupaten" element={<Navigate to="/wilayah/kota-kabupaten" replace />} />
        <Route path="/master-kota-kabupaten" element={<Navigate to="/wilayah/kota-kabupaten" replace />} />
        <Route path="/master-kabupaten" element={<Navigate to="/wilayah/kota-kabupaten" replace />} />

        {/* Kecamatan */}
        <Route
          path="/wilayah/kecamatan"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DEVELOPER",
              ]}
            >
              <MasterKecamatan />
            </ProtectedRoute>
          }
        />
        <Route path="/master-data/kecamatan" element={<Navigate to="/wilayah/kecamatan" replace />} />
        <Route path="/master-kecamatan" element={<Navigate to="/wilayah/kecamatan" replace />} />
        <Route path="/master-data/kecematan" element={<Navigate to="/wilayah/kecamatan" replace />} />

        {/* Kelurahan */}
        <Route
          path="/wilayah/kelurahan"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DEVELOPER",
              ]}
            >
              <MasterKelurahan />
            </ProtectedRoute>
          }
        />
        <Route path="/master-data/kelurahan" element={<Navigate to="/wilayah/kelurahan" replace />} />
        <Route path="/master-kelurahan" element={<Navigate to="/wilayah/kelurahan" replace />} />

        {/* RW */}
        <Route
          path="/wilayah/rw"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DEVELOPER",
              ]}
            >
              <MasterRw />
            </ProtectedRoute>
          }
        />
        <Route path="/master-data/rukun-warga" element={<Navigate to="/wilayah/rw" replace />} />
        <Route path="/master-rw" element={<Navigate to="/wilayah/rw" replace />} />
        <Route path="/wilayah/rukun-warga" element={<Navigate to="/wilayah/rw" replace />} />
        <Route
          path="/dashboard-dpl"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <DplDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
              <KknDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulasi-model-ai"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]}>
              <SimulasiModelAI />
            </ProtectedRoute>
          }
        />
        <Route path="/panduan" element={<PanduanPage />} />
        <Route
          path="/manajemen-ekosistem-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING"]}>
              <ManajemenEkosistemKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pelaksanaan/kelompok"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING"]}>
              <ManajemenEkosistemKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/program-kerja-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN"]}>
              <ProgramKerjaKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pelaksanaan/program-kerja"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN"]}>
              <ProgramKerjaKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penilaian-kkn/individu"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "ADMIN_DLH", "LURAH", "CAMAT", "RW", "PANITIA_TASKFORCE", "PEMIMPIN"]}>
              <PenilaianKknMahasiswaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penilaian/mahasiswa"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "ADMIN_DLH", "LURAH", "CAMAT", "RW", "PANITIA_TASKFORCE", "PEMIMPIN"]}>
              <PenilaianKknMahasiswaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penilaian-kkn/mahasiswa"
          element={<Navigate to="/penilaian/mahasiswa" replace />}
        />
        <Route
          path="/penilaian-kkn/program-kerja"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "PANITIA_TASKFORCE"]}>
              <PenilaianProkerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penilaian/program-kerja"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "PANITIA_TASKFORCE"]}>
              <PenilaianProkerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penilaian-kkn/laporan-akhir"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"]}>
              <PenilaianLaporanAkhirPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penilaian/laporan-akhir"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"]}>
              <PenilaianLaporanAkhirPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penilaian-kkn/rekap"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "ADMIN_DLH", "LURAH", "CAMAT", "RW", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"]}>
              <RekapNilaiKknPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penilaian/rekapitulasi-nilai-akhir"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "ADMIN_DLH", "LURAH", "CAMAT", "RW", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"]}>
              <RekapNilaiKknPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-data/panduan"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]}>
              <MasterPanduanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-data/kegiatan-sampah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]}>
              <MasterKegiatanSampahPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ajuan-absensi"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN"]}>
              <DplDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-kegiatan/pengajuan-izin"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN"]}>
              <DplDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dpl/logbook"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN", "LURAH", "CAMAT", "RW"]}>
              <LogbookKknPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logbook-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN", "LURAH", "CAMAT", "RW"]}>
              <LogbookKknPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-aktivitas/mahasiswa"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN", "LURAH", "CAMAT", "RW"]}>
              <LogbookKknPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-aktivitas-dpl"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <LogAktivitasDpl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-aktivitas/dosen-pembimbing-lapangan"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <LogAktivitasDpl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catat-kegiatan-dpl"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <LogAktivitasDpl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dpl/log-aktivitas"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <LogAktivitasDpl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dpl/catat-kegiatan"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <LogAktivitasDpl />
            </ProtectedRoute>
          }
        />
        <Route path="/logbook" element={<Navigate to="/logbook-kkn" replace />} />
        <Route path="/fasilitas/logbook" element={<Navigate to="/logbook-kkn" replace />} />
        <Route path="/validasi-absensi" element={<Navigate to="/ajuan-absensi" replace />} />
        <Route path="/penilaian-kkn" element={<Navigate to="/penilaian-kkn/mahasiswa" replace />} />
        <Route path="/program-kerja" element={<Navigate to="/program-kerja-kkn" replace />} />
        <Route
          path="/pengelolaan-sampah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN", "WARGA", "PETUGAS_RESIDU"]}>
              <PemanfaatanSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring-pengelolaan/fasilitas"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN", "WARGA", "PETUGAS_RESIDU"]}>
              <PemanfaatanSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posko-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN", "WARGA"]}>
              <PoskoKknPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pelaksanaan/posko"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN", "WARGA"]}>
              <PoskoKknPage />
            </ProtectedRoute>
          }
        />
        <Route path="/posko" element={<Navigate to="/pelaksanaan/posko" replace />} />
        <Route path="/pemanfaatan-sampah" element={<Navigate to="/monitoring-pengelolaan/fasilitas" replace />} />
        <Route path="/fasilitas-posko" element={<Navigate to="/pelaksanaan/posko" replace />} />
        <Route path="/fasilitas-dan-posko" element={<Navigate to="/monitoring-pengelolaan/fasilitas" replace />} />
        <Route
          path="/monitoring-pemanfaatan"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN", "WARGA", "PETUGAS_RESIDU"]}>
              <HasilPemanfaatan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hasil-pemanfaatan"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PEMIMPIN", "PANITIA_TASKFORCE", "DEVELOPER", "MAHASISWA_KKN", "WARGA", "PETUGAS_RESIDU"]}>
              <HasilPemanfaatan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jadwal-kegiatan"
          element={<JadwalKegiatan />}
        />
        <Route
          path="/pelaksanaan/linimasa-kegiatan"
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
          element={<Navigate to="/master-data/manajemen-tempat-sampah?tab=kategori" replace />}
        />
        <Route
          path="/rekapitulasi-setoran"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "MAHASISWA_KKN",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "DPL",
                "DEVELOPER",
              ]}
            >
              <RekapSetoran />
            </ProtectedRoute>
          }
        />
        <Route path="/rekap-setoran" element={<Navigate to="/rekapitulasi-setoran" replace />} />
        <Route path="/poin-warga" element={<PoinWarga />} />
        <Route
          path="/dataset/hasil-klasifikasi"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER"]}>
              <MasterDatasetKlasifikasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-dataset-klasifikasi"
          element={
            <ProtectedRoute allowedRoles={["DEVELOPER"]}>
              <MasterDatasetKlasifikasi />
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
        <Route path="/peta" element={<Navigate to="/monitoring" replace />} />
        <Route path="/evaluasi-ai" element={<Navigate to="/superUser/discrepancies" replace />} />
        <Route path="/lainnya" element={<PlaceholderPage title="Menu Lainnya" />} />
        <Route
          path="/monitoring-pemilahan/penyetoran-sampah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PETUGAS_RESIDU", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN", "WARGA", "DEVELOPER"]}>
              <SetorSampah />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penyetoran-sampah"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PETUGAS_RESIDU", "PEMIMPIN", "PANITIA_TASKFORCE", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN", "WARGA", "DEVELOPER"]}>
              <SetorSampah />
            </ProtectedRoute>
          }
        />
        <Route path="/setor-sampah" element={<Navigate to="/monitoring-pemilahan/penyetoran-sampah" replace />} />
        <Route path="/setor" element={<Navigate to="/monitoring-pemilahan/penyetoran-sampah" replace />} />
        <Route
          path="/kkn-portal"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "MAHASISWA_KKN", "PEMIMPIN", "PANITIA_TASKFORCE"]}>
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
          element={<Navigate to="/peraturan" replace />}
        />
        <Route
          path="/master-data/histori-sistem"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER"]}>
              <AuditTrailList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log-aktivitas"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DEVELOPER"]}>
              <AuditTrailList />
            </ProtectedRoute>
          }
        />
        <Route path="/superUser/audit" element={<Navigate to="/master-data/histori-sistem" replace />} />
        <Route path="/audit-trail" element={<Navigate to="/master-data/histori-sistem" replace />} />
        <Route path="/audit-log" element={<Navigate to="/master-data/histori-sistem" replace />} />
        <Route path="/superUser/qr-master" element={<Navigate to="/monitoring-pengelolaan/tempat-sampah?tab=batch_qr" replace />} />
        <Route path="/superUser/master-qr" element={<Navigate to="/monitoring-pengelolaan/tempat-sampah?tab=batch_qr" replace />} />
        <Route path="/qr-master" element={<Navigate to="/monitoring-pengelolaan/tempat-sampah?tab=batch_qr" replace />} />
        <Route path="/superUser/discrepancies" element={<Navigate to="/monitoring-pengelolaan/tempat-sampah" replace />} />
        <Route path="/discrepancies" element={<Navigate to="/superUser/discrepancies" replace />} />
        <Route path="/diskrepansi" element={<Navigate to="/superUser/discrepancies" replace />} />
        <Route
          path="/superUser/import-survei-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <ImportSurveiKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hasil-survei/data-survei"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <ImportSurveiKkn />
            </ProtectedRoute>
          }
        />
        <Route path="/import-survei-kkn" element={<Navigate to="/hasil-survei/data-survei" replace />} />
        <Route path="/import-survei" element={<Navigate to="/hasil-survei/data-survei" replace />} />
        <Route
          path="/superUser/data-survei-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "ADMIN_DLH", "CAMAT", "LURAH", "DEVELOPER"]}>
              <DataSurveiKkn type="BASELINE" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/survei/baseline"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "ADMIN_DLH", "CAMAT", "LURAH", "DEVELOPER"]}>
              <DataSurveiKkn type="BASELINE" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hasil-survei/baseline"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "ADMIN_DLH", "CAMAT", "LURAH", "DEVELOPER"]}>
              <DataSurveiKkn type="BASELINE" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/survei/endline"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "ADMIN_DLH", "CAMAT", "LURAH", "DEVELOPER"]}>
              <DataSurveiKkn type="ENDLINE" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hasil-survei/endline"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "ADMIN_DLH", "CAMAT", "LURAH", "DEVELOPER"]}>
              <DataSurveiKkn type="ENDLINE" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/data-survei-baseline"
          element={<Navigate to="/hasil-survei/baseline" replace />}
        />
        <Route
          path="/superUser/data-survei-endline"
          element={<Navigate to="/hasil-survei/endline" replace />}
        />
        <Route path="/data-survei-baseline" element={<Navigate to="/hasil-survei/baseline" replace />} />
        <Route path="/survei-baseline" element={<Navigate to="/hasil-survei/baseline" replace />} />
        <Route path="/data-survei-endline" element={<Navigate to="/hasil-survei/endline" replace />} />
        <Route path="/survei-endline" element={<Navigate to="/hasil-survei/endline" replace />} />
        <Route path="/data-survei-kkn" element={<Navigate to="/hasil-survei/baseline" replace />} />
        <Route
          path="/evaluasi-dampak-kkn"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "ADMIN_DLH", "CAMAT", "LURAH", "DEVELOPER"]}>
              <EvaluasiDampakKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hasil-survei/evaluasi-dan-dampak"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "ADMIN_DLH", "CAMAT", "LURAH", "DEVELOPER"]}>
              <EvaluasiDampakKkn />
            </ProtectedRoute>
          }
        />
        <Route path="/evaluasi-dampak" element={<Navigate to="/evaluasi-dampak-kkn" replace />} />
        <Route path="/evaluasi-kkn" element={<Navigate to="/evaluasi-dampak-kkn" replace />} />
        <Route
          path="/superUser/data-survei-kkn/:id"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "ADMIN_DLH", "CAMAT", "LURAH", "DEVELOPER"]}>
              <DetailSurveiKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superUser/data-survei-kkn/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "PANITIA_TASKFORCE", "DEVELOPER"]}>
              <EditSurveiKkn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rw/approval"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "ADMIN_DLH", "RW", "DEVELOPER"]}>
              <RwApproval />
            </ProtectedRoute>
          }
        />
        <Route path="/rw/fasilitas" element={<Navigate to="/pengelolaan-sampah" replace />} />
        <Route
          path="/ide-daur-ulang"
          element={<IdeDaurUlang />}
        />
        <Route path="/informasi" element={<TentangAplikasi />} />
        <Route path="/tentang" element={<Navigate to="/informasi" replace />} />
        <Route path="/tentang-aplikasi" element={<Navigate to="/informasi" replace />} />
        <Route path="/panduan-aplikasi" element={<Navigate to="/informasi" replace />} />
        <Route path="/faq" element={<Navigate to="/informasi" replace />} />
        <Route path="/bantuan" element={<Navigate to="/informasi" replace />} />
        <Route path="/presensi" element={<Navigate to="/monitoring-absen" replace />} />
        <Route path="/presensi-mahasiswa" element={<Navigate to="/monitoring-absen" replace />} />
        <Route path="/ekosistem-dampingan" element={<Navigate to="/manajemen-ekosistem-kkn" replace />} />
        <Route path="/dpl-dashboard" element={<Navigate to="/dashboard-dpl" replace />} />
        <Route path="/kkn-dashboard" element={<Navigate to="/dashboard-kkn" replace />} />
        <Route
          path="/kkn/monitoring-warga"
          element={
            <ProtectedRoute allowedRoles={["SUPER_USER", "DPL", "MAHASISWA_KKN", "PANITIA_TASKFORCE", "PEMIMPIN", "DEVELOPER"]}>
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
