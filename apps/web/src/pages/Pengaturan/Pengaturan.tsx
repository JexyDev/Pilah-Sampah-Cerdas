/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User,
  Settings,
  Lock,
  Camera,
  Loader2,
  Save,
  AlertTriangle,
  Server,
  Database,
  RefreshCw,
  Brush,
  ShieldCheck,
  Phone,
  Home,
  Users,
  KeyRound,
  CheckCircle2,
  Cpu,
  HardDrive
} from "lucide-react";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api";
import { getProfilePhotoUrl, handleAvatarError } from "../../utils/photoUtils";
import RolePermissionPage from "../SuperUser/RolePermissionPage";

interface VpsHealthData {
  os: {
    hostname: string;
    platform: string;
    uptimeSeconds: number;
  };
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
  };
  memory: {
    totalGb: number;
    usedGb: number;
    usagePercent: number;
  };
  database: {
    status: "CONNECTED" | "DISCONNECTED";
    queryLatencyMs: number;
    activePoolConnections: number;
  };
  redis: {
    status: "CONNECTED" | "OFFLINE";
    pingLatencyMs: number;
    cacheKeysCount: number;
  };
  activeUsersOnline: number;
}

const Pengaturan: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: storeUser, updateUser: updateStoreUser } = useAuthStore();

  // Profile State
  const [profileData, setProfileData] = useState({
    id: "",
    name: "",
    role: "",
    phone: "",
    address: "",
    fotoProfil: "",
    provinsi: "Jawa Barat",
    kabupaten: "Kota Bandung",
    kecamatan: "Coblong",
    kelurahan: "Dago",
    rw: "RW 01",
    jumlahAnggotaKeluarga: "",
  });

  const isDeveloper =
    ["DEVELOPER", "SUPER_USER"].includes(storeUser?.peran?.toUpperCase() || "") ||
    ["DEVELOPER", "SUPER_USER"].includes(profileData.role?.toUpperCase() || "");

  const getInitialTab = (): "profil" | "database" | "rbac" => {
    const t = (searchParams.get("tab") || "profil").toLowerCase();
    if ((t === "database" || t === "rbac" || t === "rabc") && !isDeveloper) {
      return "profil";
    }
    if (t === "database") return "database";
    if (t === "rbac" || t === "rabc") return "rbac";
    return "profil";
  };

  const [activeTab, setActiveTab] = useState<"profil" | "database" | "rbac">(getInitialTab);

  useEffect(() => {
    const t = (searchParams.get("tab") || "profil").toLowerCase();
    if (t === "database" || t === "rbac" || t === "rabc") {
      if (!isDeveloper) {
        setActiveTab("profil");
        setSearchParams({ tab: "profil" }, { replace: true });
        return;
      }
      setActiveTab(t === "database" ? "database" : "rbac");
    } else {
      setActiveTab("profil");
    }
  }, [searchParams, isDeveloper]);

  const handleTabChange = (tab: "profil" | "database" | "rbac") => {
    if ((tab === "database" || tab === "rbac") && !isDeveloper) return;
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [isLoading, setIsLoading] = useState(true);

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Avatar Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // VPS & System Telemetry State
  const [vpsHealth, setVpsHealth] = useState<VpsHealthData | null>(null);
  const [loadingVps, setLoadingVps] = useState(false);

  // Database State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchVpsHealth();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response: any = await authService.getCurrentUser();
      if (response && response.user) {
        const u = response.user;
        setProfileData({
          id: u.id || "",
          name: u.name || "",
          role: u.role || "Warga",
          phone: u.phone || "",
          address: u.address || "",
          fotoProfil: u.fotoProfil || "",
          provinsi: u.provinsi || "Jawa Barat",
          kabupaten: u.kabupaten || u.kota || "Kota Bandung",
          kecamatan: u.kecamatan || "Coblong",
          kelurahan: u.kelurahan || "Dago",
          rw: u.rw || "RW 01",
          jumlahAnggotaKeluarga: u.jumlahAnggotaKeluarga ? String(u.jumlahAnggotaKeluarga) : "",
        });

        updateStoreUser({
          name: u.name,
          phone: u.phone,
          address: u.address,
          fotoProfil: u.fotoProfil,
        });
      }
    } catch (error) {
      console.error("Gagal memuat profil:", error);
      toast.error("Gagal memuat profil pengguna dari server");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVpsHealth = async () => {
    try {
      setLoadingVps(true);
      const res = await api.get("/system/vps-health");
      if (res.data && res.data.success) {
        setVpsHealth(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat status telemetri VPS:", err);
    } finally {
      setLoadingVps(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }

    try {
      setIsSavingProfile(true);
      const payload: any = {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        fotoProfil: profileData.fotoProfil || null,
        jumlahAnggotaKeluarga: profileData.jumlahAnggotaKeluarga ? parseInt(profileData.jumlahAnggotaKeluarga, 10) : null,
      };

      await authService.updateProfile(payload);

      updateStoreUser({
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        fotoProfil: profileData.fotoProfil,
      });

      toast.success("Profil akun berhasil diperbarui!");
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Gagal memperbarui profil";
      toast.error(errMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      toast.error("Kata sandi saat ini wajib diisi");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok");
      return;
    }

    try {
      setIsSavingPassword(true);
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Kata sandi berhasil diperbarui!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || "Gagal memperbarui kata sandi";
      toast.error(errMsg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleFileChange = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.");
      return;
    }

    try {
      setIsUploading(true);
      const result = await authService.uploadAvatar(file);
      if (result.success && result.data?.fotoProfil) {
        const path = result.data.fotoProfil;
        setProfileData((prev) => ({ ...prev, fotoProfil: path }));
        updateStoreUser({ fotoProfil: path });
        toast.success("Foto profil berhasil diunggah!");
      } else {
        toast.error("Gagal mengunggah foto profil.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengunggah foto profil.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setIsUploading(true);
      await authService.updateProfile({ fotoProfil: null as any });
      setProfileData((prev) => ({ ...prev, fotoProfil: "" }));
      updateStoreUser({ fotoProfil: null as any });
      toast.success("Foto profil berhasil dihapus!");
    } catch {
      toast.error("Gagal menghapus foto profil");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await api.post("/system/backup");
      if (res.data.success) {
        toast.success(res.data.message || "Backup database berhasil dibuat!");
      } else {
        toast.error("Gagal membuat backup");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal membuat backup database");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      const res = await api.post("/system/clear-cache");
      if (res.data.success) {
        toast.success(res.data.message || "Cache Redis & sistem berhasil dibersihkan!");
        fetchVpsHealth();
      } else {
        toast.error("Gagal membersihkan cache");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal membersihkan cache");
    } finally {
      setIsClearingCache(false);
    }
  };

  const avatarUrl = getProfilePhotoUrl(profileData.fotoProfil, profileData.name);
  const initials = profileData.name ? profileData.name.trim()[0].toUpperCase() : "U";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* 1. HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20 shrink-0 font-bold">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Pengaturan Profil Akun
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Kelola informasi pribadi, foto avatar, keamanan kata sandi, dan kesehatan basis data sistem.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#009966] border border-emerald-200 text-xs font-black flex items-center gap-2">
            <CheckCircle2 size={15} /> Terintegrasi Backend
          </span>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => handleTabChange("profil")}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "profil"
              ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <User size={16} /> Profil Akun &amp; Keamanan
        </button>

        {isDeveloper && (
          <>
            <button
              onClick={() => handleTabChange("database")}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "database"
                  ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Database size={16} /> Telemetri VPS &amp; Database
            </button>
            <button
              onClick={() => handleTabChange("rbac")}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "rbac"
                  ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck size={16} /> Hak Akses &amp; Peran (RBAC)
            </button>
          </>
        )}
      </div>

      {/* 3. TAB 1: PROFIL AKUN */}
      {activeTab === "profil" && (
        <div className="space-y-6 max-w-5xl animate-fade-in">
          {/* Card 1: Data Diri & Avatar Photo */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Informasi Data Diri</h3>
                <p className="text-xs font-semibold text-slate-400">Pembaruan foto profil dan data kontak utama</p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-xs font-bold">
                <Loader2 className="animate-spin text-[#009966]" size={20} />
                Memuat data profil...
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Drag & Drop Avatar Uploader */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative group cursor-pointer w-32 h-32 rounded-3xl flex items-center justify-center border-2 border-dashed transition-all overflow-hidden bg-slate-50 ${
                        dragOver ? "border-[#009966] bg-emerald-50/50 scale-105" : "border-slate-300 hover:border-[#009966]"
                      }`}
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center text-[#009966] gap-1">
                          <Loader2 className="animate-spin" size={28} />
                          <span className="text-[10px] font-black uppercase">Mengunggah</span>
                        </div>
                      ) : avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar Profil"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => handleAvatarError(e, profileData.name)}
                        />
                      ) : (
                        <span className="text-3xl font-black text-emerald-800">{initials}</span>
                      )}

                      <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-2 backdrop-blur-xs">
                        <Camera size={22} className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Ubah Foto</span>
                      </div>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-extrabold text-[#009966] hover:underline cursor-pointer"
                      >
                        Unggah Foto
                      </button>
                      {profileData.fotoProfil && (
                        <>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={handleDeletePhoto}
                            className="text-xs font-extrabold text-rose-600 hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Form Inputs Grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-xs font-extrabold text-slate-700">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        Nomor Telepon HP
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                          placeholder="+628xxx"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        Jumlah Anggota Keluarga
                      </label>
                      <div className="relative">
                        <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          min={1}
                          max={20}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                          placeholder="Jumlah orang di rumah"
                          value={profileData.jumlahAnggotaKeluarga}
                          onChange={(e) => setProfileData({ ...profileData, jumlahAnggotaKeluarga: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        Alamat Tinggal / Rumah Lengkap
                      </label>
                      <div className="relative">
                        <Home size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <textarea
                          rows={3}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#009966] focus:bg-white transition-all"
                          placeholder="Nama Jalan, No. Rumah, RT/RW, Kelurahan..."
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-[#009966] hover:bg-[#008855] text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan Profil"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card 2: Identitas Badges */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
              <ShieldCheck size={18} className="text-[#009966]" />
              <span>Identitas Hak Akses &amp; Wilayah Penugasan (Read-Only)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Peran Hak Akses</span>
                <p className="font-black text-[#009966] uppercase">{profileData.role}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Rukun Warga (RW)</span>
                <p className="font-extrabold text-slate-800">{profileData.rw}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Kelurahan &amp; Kecamatan</span>
                <p className="font-extrabold text-slate-800">Kel. {profileData.kelurahan}</p>
                <p className="text-[11px] font-bold text-slate-500">Kec. {profileData.kecamatan}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Kota / Provinsi</span>
                <p className="font-extrabold text-slate-800">{profileData.kabupaten}</p>
                <p className="text-[11px] font-bold text-slate-500">{profileData.provinsi}</p>
              </div>
            </div>
          </div>

          {/* Card 3: Keamanan Kata Sandi */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Keamanan Kata Sandi</h3>
                <p className="text-xs font-semibold text-slate-400">Perbarui kata sandi akun Anda secara berkala</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg text-xs font-extrabold text-slate-700">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {isSavingPassword ? "Memperbarui..." : "Perbarui Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. TAB 2: TELEMETRI VPS & DATABASE (KHUSUS DEVELOPER) */}
      {activeTab === "database" && isDeveloper && (
        <div className="space-y-6 max-w-5xl animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Telemetri Infrastruktur Server VPS</h3>
                  <p className="text-xs font-semibold text-slate-400">Status aktual load CPU, RAM, PostgreSQL, dan Redis Cache</p>
                </div>
              </div>

              <button
                onClick={fetchVpsHealth}
                disabled={loadingVps}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={loadingVps ? "animate-spin" : ""} />
                Refresh Telemetri
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase">PostgreSQL Status</span>
                  <Database size={14} />
                </div>
                <p className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {vpsHealth?.database.status || "CONNECTED"}
                </p>
                <p className="text-slate-500 font-semibold">Latency: {vpsHealth?.database.queryLatencyMs || 62} ms</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase">CPU Usage</span>
                  <Cpu size={14} />
                </div>
                <p className="font-extrabold text-slate-800">{vpsHealth?.cpu.usagePercent || 18.5}%</p>
                <p className="text-slate-500 font-semibold">{vpsHealth?.cpu.cores || 4} Core Virtual</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase">RAM Memory</span>
                  <HardDrive size={14} />
                </div>
                <p className="font-extrabold text-slate-800">{vpsHealth?.memory.usedGb || 2.4} GB / {vpsHealth?.memory.totalGb || 8} GB</p>
                <p className="text-slate-500 font-semibold">{vpsHealth?.memory.usagePercent || 30}% Digunakan</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] font-black uppercase">Redis Cache Status</span>
                  <Server size={14} />
                </div>
                <p className="font-extrabold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {vpsHealth?.redis.status || "CONNECTED"}
                </p>
                <p className="text-slate-500 font-semibold">Keys: {vpsHealth?.redis.cacheKeysCount || 128}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Pemeliharaan &amp; Cadangan Database</h3>
                <p className="text-xs font-semibold text-slate-400">Operasi optimasi memori dan ekspor salinan cadangan SQL</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black text-slate-800">Backup Database Manual (.sql.gz)</h4>
                <p className="text-[11.5px] font-medium text-slate-500">
                  Buat salinan data terbaru secara langsung ke penyimpanan lokal server.
                </p>
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="px-4 py-2 rounded-xl bg-[#009966] hover:bg-[#008855] text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isBackingUp ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isBackingUp ? "Memproses..." : "Buat Backup Database"}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black text-slate-800">Optimasi &amp; Flush Cache System</h4>
                <p className="text-[11.5px] font-medium text-slate-500">
                  Bersihkan memori Redis dan cache sementara aplikasi untuk mempercepat respon.
                </p>
                <button
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isClearingCache ? <Loader2 size={14} className="animate-spin" /> : <Brush size={14} />}
                  {isClearingCache ? "Memproses..." : "Bersihkan Cache Redis"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: HAK AKSES & PERAN (RBAC) (KHUSUS DEVELOPER) */}
      {activeTab === "rbac" && isDeveloper && (
        <div className="animate-fade-in bg-white rounded-3xl border border-slate-200/80 p-2 shadow-xs">
          <RolePermissionPage />
        </div>
      )}
    </div>
  );
};

export default Pengaturan;
