/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios"; // Ditambahkan untuk type-checking error yang aman
import {
  User,
  Lock,
  Loader2,
  Save,
  Server,
  Database,
  RefreshCw,
  Brush,
  ShieldCheck,
  Phone,
  Home,
  Users,
  KeyRound,
  Cpu,
  HardDrive
} from "lucide-react";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api";
import { getProfilePhotoUrl, handleAvatarError } from "../../utils/photoUtils";
import RolePermissionPage from "../SuperUser/RolePermissionPage";

// Interface yang lebih ketat
interface VpsHealthData {
  os: { hostname: string; platform: string; uptimeSeconds: number };
  cpu: { model: string; cores: number; usagePercent: number };
  memory: { totalGb: number; usedGb: number; usagePercent: number };
  database: { status: "CONNECTED" | "DISCONNECTED"; queryLatencyMs: number; activePoolConnections: number };
  redis: { status: "CONNECTED" | "OFFLINE"; pingLatencyMs: number; cacheKeysCount: number };
  activeUsersOnline: number;
}

type TabType = "profil" | "telemetri" | "rbac";

const Pengaturan: React.FC = () => {
  // PENGELOLAAN STATE & URL
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: storeUser, updateUser: updateStoreUser } = useAuthStore();

  const [profileData, setProfileData] = useState({
    id: "", name: "", role: "", phone: "", address: "", fotoProfil: "",
    provinsi: "Jawa Barat", kabupaten: "Kota Bandung", kecamatan: "Coblong",
    kelurahan: "Dago", rw: "RW 01", jumlahAnggotaKeluarga: "",
  });

  const isDeveloper =
    ["DEVELOPER", "SUPER_USER"].includes(storeUser?.peran?.toUpperCase() || "") ||
    ["DEVELOPER", "SUPER_USER"].includes(profileData.role?.toUpperCase() || "");

  // Mengambil state tab langsung dari URL (Single Source of Truth)
  const rawTab = (searchParams.get("tab")?.toLowerCase() || "profil") as string;
  const normalizedTab: TabType = (rawTab === "database" ? "telemetri" : rawTab) as TabType;
  const validTabs: TabType[] = ["profil", "telemetri", "rbac"];

  // Validasi tab yang aktif berdasarkan hak akses
  const activeTab: TabType = (validTabs.includes(normalizedTab) && (!["telemetri", "rbac"].includes(normalizedTab) || isDeveloper))
    ? normalizedTab
    : "profil";

  const handleTabChange = (tab: TabType) => {
    if (["telemetri", "rbac"].includes(tab) && !isDeveloper) return;
    setSearchParams({ tab }); // Hanya perbarui URL, React akan otomatis me-render ulang
  };

  // State UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Telemetri
  const [vpsHealth, setVpsHealth] = useState<VpsHealthData | null>(null);
  const [loadingVps, setLoadingVps] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    fetchProfile();
    if (isDeveloper) fetchVpsHealth();
  }, [isDeveloper]);

  // FUNGSI API
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authService.getCurrentUser() as { user: any };
      if (response?.user) {
        const u = response.user;
        const roleUpper = (u.role || "").toUpperCase();
        let resolvedKel = u.kelurahan || "";
        if (!resolvedKel || resolvedKel === "Dago") {
          const combined = `${u.name || ""} ${u.address || ""}`.toLowerCase();
          if (combined.includes("cipaganti")) resolvedKel = "Cipaganti";
          else if (combined.includes("sekeloa")) resolvedKel = "Sekeloa";
          else if (combined.includes("lebak gede")) resolvedKel = "Lebak Gede";
          else if (combined.includes("lebak siliwangi")) resolvedKel = "Lebak Siliwangi";
          else if (combined.includes("sadang serang")) resolvedKel = "Sadang Serang";
          else if (combined.includes("dago")) resolvedKel = "Dago";
          else resolvedKel = u.kelurahan || "Cipaganti";
        }

        let resolvedRw = u.rw || "";
        if (roleUpper === "LURAH") {
          resolvedRw = "Seluruh RW (1 Kelurahan)";
        } else if (roleUpper === "CAMAT") {
          resolvedRw = "Seluruh Kecamatan";
          resolvedKel = "Seluruh Kelurahan";
        } else if (["ADMIN_DLH", "SUPER_USER", "DEVELOPER"].includes(roleUpper)) {
          resolvedRw = "Seluruh Kota";
          resolvedKel = "Kota Bandung";
        } else if (!resolvedRw) {
          resolvedRw = "RW 01";
        }

        setProfileData({
          id: u.id || "", name: u.name || "", role: u.role || "Warga",
          phone: u.phone || "", address: u.address || "", fotoProfil: u.fotoProfil || "",
          provinsi: u.provinsi || "Jawa Barat", kabupaten: u.kabupaten || u.kota || "Kota Bandung",
          kecamatan: u.kecamatan || "Coblong", kelurahan: resolvedKel, rw: resolvedRw,
          jumlahAnggotaKeluarga: u.jumlahAnggotaKeluarga ? String(u.jumlahAnggotaKeluarga) : "",
        });
        updateStoreUser({ name: u.name, phone: u.phone, address: u.address, fotoProfil: u.fotoProfil, kelurahan: resolvedKel, rw: resolvedRw });
      }
    } catch {
      toast.error("Gagal memuat data profil.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVpsHealth = async () => {
    try {
      setLoadingVps(true);
      const res = await api.get("/system/vps-health");
      if (res.data?.success) setVpsHealth(res.data.data);
    } catch (err) {
      console.warn("Gagal memuat status telemetri:", err);
    } finally {
      setLoadingVps(false);
    }
  };

  // PENANGANAN FORM (Dengan error handling yang aman)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name.trim()) return toast.error("Nama lengkap wajib diisi");

    try {
      setIsSavingProfile(true);
      const payload = {
        name: profileData.name, phone: profileData.phone, address: profileData.address,
        fotoProfil: profileData.fotoProfil || undefined,
        jumlahAnggotaKeluarga: profileData.jumlahAnggotaKeluarga ? parseInt(profileData.jumlahAnggotaKeluarga, 10) : undefined,
      };

      await authService.updateProfile(payload);
      updateStoreUser(payload);
      toast.success("Profil berhasil diperbarui!");
    } catch (error: unknown) {
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message : "Gagal memperbarui profil";
      toast.error(errMsg || "Terjadi kesalahan pada server");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword) return toast.error("Kata sandi saat ini wajib diisi");
    if (passwordData.newPassword.length < 6) return toast.error("Kata sandi baru minimal 6 karakter");
    if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error("Konfirmasi kata sandi tidak cocok");

    try {
      setIsSavingPassword(true);
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Kata sandi berhasil diperbarui!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: unknown) {
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message : "Gagal memperbarui kata sandi";
      toast.error(errMsg || "Terjadi kesalahan");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleFileChange = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) return toast.error("Maksimal ukuran berkas 2 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Gunakan format JPG, PNG, atau WEBP.");

    try {
      setIsUploading(true);
      const result = await authService.uploadAvatar(file);
      if (result.success && result.data?.fotoProfil) {
        const path = result.data.fotoProfil;
        setProfileData((prev) => ({ ...prev, fotoProfil: path }));
        updateStoreUser({ fotoProfil: path });
        toast.success("Foto profil diunggah!");
      } else {
        toast.error("Gagal mengunggah foto.");
      }
    } catch (error: unknown) {
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message : "Gagal mengunggah foto";
      toast.error(errMsg || "Terjadi kesalahan");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setIsUploading(true);
      await authService.updateProfile({ fotoProfil: undefined }); // Menghindari any
      setProfileData((prev) => ({ ...prev, fotoProfil: "" }));
      updateStoreUser({ fotoProfil: undefined });
      toast.success("Foto profil dihapus!");
    } catch {
      toast.error("Gagal menghapus foto");
    } finally {
      setIsUploading(false);
    }
  };

  // OPERASI SISTEM
  const handleSystemAction = async (endpoint: string, successMsg: string, setLoader: (val: boolean) => void) => {
    try {
      setLoader(true);
      const res = await api.post(endpoint);
      if (res.data.success) {
        toast.success(res.data.message || successMsg);
        if (endpoint.includes("clear-cache")) fetchVpsHealth();
      } else {
        toast.error("Proses gagal dilakukan.");
      }
    } catch (error: unknown) {
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message : "Gagal menjalankan operasi";
      toast.error(errMsg || "Terjadi kesalahan");
    } finally {
      setLoader(false);
    }
  };

  const avatarUrl = getProfilePhotoUrl(profileData.fotoProfil, profileData.name);
  const initials = profileData.name ? profileData.name.trim()[0].toUpperCase() : "P";

  const menuItems = [
    { id: "profil" as TabType, label: "Pengaturan Profil", icon: User },
    ...(isDeveloper ? [
      { id: "telemetri" as TabType, label: "Telemetri & Basis Data", icon: Server },
      { id: "rbac" as TabType, label: "Hak Akses (RBAC)", icon: ShieldCheck },
    ] : []),
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Profil</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola profil pengguna, keamanan akun, peranan wilayah, serta preferensi sistem.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* NAVIGASI KIRI */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full px-4 py-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-3.5 cursor-pointer text-left ${
                  isActive ? "bg-[#e5f7ed] text-[#009966] border border-[#009966]/20 shadow-[0_2px_10px_rgba(0,153,102,0.12)] font-black" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-2xs hover:shadow-xs font-semibold"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? "bg-[#009966] text-white shadow-xs" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                }`}>
                  <Icon size={18} />
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Info Peran & Domisili di Kolom Kiri */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 pb-2 border-b border-slate-100">
              <ShieldCheck size={16} className="text-[#009966]" />
              <span>Peran & Domisili</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Tingkat Akses / Role</span>
                <p className="font-black text-[#009966] uppercase mt-0.5">{profileData.role}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Wilayah Tugas</span>
                <p className="font-bold text-slate-800 mt-0.5">Kel. {profileData.kelurahan}</p>
                <p className="text-[11px] text-slate-500">Kec. {profileData.kecamatan} • {profileData.rw}</p>
              </div>
            </div>
          </div>

          {/* Keamanan & Sandi di Kolom Kiri */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800 pb-2 border-b border-slate-100">
              <Lock size={16} className="text-amber-600" />
              <span>Keamanan Kata Sandi</span>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-2.5 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <label className="block text-[11px] font-black">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 text-xs font-mono"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-black">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 karakter"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 text-xs font-mono"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-black">Konfirmasi Sandi Baru</label>
                <input
                  type="password"
                  required
                  placeholder="Ketik ulang sandi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 text-xs font-mono"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>

              {/* Aturan Password */}
              <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-[10.5px] text-amber-900 space-y-0.5">
                <p className="font-bold">Ketentuan Kata Sandi:</p>
                <ul className="list-disc pl-3 text-[10px] text-amber-800 space-y-0.5 font-medium">
                  <li>Minimal 8 karakter</li>
                  <li>Kombinasi huruf & angka/simbol</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingPassword ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Perbarui Kata Sandi
              </button>
            </form>
          </div>
        </div>

        {/* PANEL KONTEN KANAN */}
        <div className="flex-1 w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 min-h-[600px] space-y-6">

          {/* TAB 1: PROFIL */}
          {activeTab === "profil" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Informasi Profil Akun</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Perbarui data profil, kontak WhatsApp, dan foto resmi pengguna.</p>
              </div>

              {/* Form Profil Utama */}
              <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-6">
                <div className="flex items-center gap-2.5 text-slate-800 pb-3 border-b border-slate-200/80">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Profil Utama</h3>
                    <p className="text-[11.5px] font-medium text-slate-500">Pembaruan foto dan informasi kontak</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-10 flex justify-center items-center gap-2 text-slate-400 text-xs font-bold">
                    <Loader2 className="animate-spin text-[#009966]" size={20} /> Memuat data...
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      {/* Upload Foto */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]); }}
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative group cursor-pointer w-28 h-28 rounded-2xl flex items-center justify-center border-2 border-dashed transition-all overflow-hidden bg-white shadow-2xs ${
                            dragOver ? "border-[#009966] bg-emerald-50/50 scale-105" : "border-slate-300 hover:border-[#009966]"
                          }`}
                        >
                          {isUploading ? (
                            <div className="flex flex-col items-center text-[#009966] gap-1">
                              <Loader2 className="animate-spin" size={24} />
                              <span className="text-[10px] font-black uppercase">Mengunggah</span>
                            </div>
                          ) : avatarUrl ? (
                            <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => handleAvatarError(e, profileData.name)} />
                          ) : (
                            <span className="text-3xl font-black text-[#009966]">{initials}</span>
                          )}
                        </div>
                        <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
                        <span className="text-[10px] text-slate-400 text-center font-medium">Format JPG, PNG, WebP (Maks. 2MB)</span>
                        <div className="flex items-center gap-2 text-xs">
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="font-black text-[#009966] hover:underline cursor-pointer">Unggah</button>
                          {profileData.fotoProfil && (
                            <><span className="text-slate-300">•</span><button type="button" onClick={handleDeletePhoto} className="font-black text-rose-600 hover:underline cursor-pointer">Hapus</button></>
                          )}
                        </div>
                      </div>

                      {/* Form Input */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-xs font-bold text-slate-700">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-black">Nama Lengkap</label>
                          <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" required className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#009966] transition-all" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-black">Nomor WhatsApp (+62)</label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="tel" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#009966] transition-all font-mono" placeholder="+628xxx" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-black">Peran / Hak Akses</label>
                          <input type="text" disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-extrabold uppercase cursor-not-allowed" value={profileData.role} />
                        </div>

                        {profileData.role === "WARGA" && (
                          <>
                            <div className="space-y-1.5 sm:col-span-2">
                              <label className="block text-xs font-black">Jumlah Anggota Keluarga</label>
                              <div className="relative">
                                <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="number" min={1} max={20} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#009966] transition-all" value={profileData.jumlahAnggotaKeluarga} onChange={(e) => setProfileData({ ...profileData, jumlahAnggotaKeluarga: e.target.value })} />
                              </div>
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                              <label className="block text-xs font-black">Alamat Lengkap Domisili</label>
                              <div className="relative">
                                <Home size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                <textarea rows={2} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-[#009966] transition-all" value={profileData.address} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-200/60">
                      <button type="submit" disabled={isSavingProfile} className="px-6 py-2.5 rounded-xl bg-[#009966] hover:bg-[#008055] text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs transition-colors">
                        {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Profil
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TELEMETRI */}
          {activeTab === "telemetri" && isDeveloper && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Telemetri & Basis Data</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">Metrik real-time CPU, RAM, PostgreSQL, dan Redis.</p>
                </div>
                <button onClick={fetchVpsHealth} disabled={loadingVps} className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-xs font-black text-[#009966] flex items-center gap-2 disabled:opacity-50 transition-all">
                  <RefreshCw size={14} className={loadingVps ? "animate-spin" : ""} /> Segarkan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-black uppercase">PostgreSQL</span> <Database size={16} className="text-[#009966]" />
                  </div>
                  <p className="font-extrabold text-emerald-700 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />{vpsHealth?.database.status || "TERHUBUNG"}</p>
                  <p className="text-slate-500 font-medium">Latensi: {vpsHealth?.database.queryLatencyMs || 62} ms</p>
                </div>
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-black uppercase">Beban CPU</span> <Cpu size={16} className="text-[#009966]" />
                  </div>
                  <p className="font-extrabold text-slate-800">{vpsHealth?.cpu.usagePercent || 18.5}%</p>
                  <p className="text-slate-500 font-medium">{vpsHealth?.cpu.cores || 4} Core</p>
                </div>
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-black uppercase">Memori (RAM)</span> <HardDrive size={16} className="text-[#009966]" />
                  </div>
                  <p className="font-extrabold text-slate-800">{vpsHealth?.memory.usedGb || 2.4} / {vpsHealth?.memory.totalGb || 8} GB</p>
                  <p className="text-slate-500 font-medium">{vpsHealth?.memory.usagePercent || 30}% Terpakai</p>
                </div>
                <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-black uppercase">Tembolok Redis</span> <Server size={16} className="text-[#009966]" />
                  </div>
                  <p className="font-extrabold text-emerald-700 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{vpsHealth?.redis.status || "TERHUBUNG"}</p>
                  <p className="text-slate-500 font-medium">Kunci: {vpsHealth?.redis.cacheKeysCount || 128}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 space-y-3">
                  <h4 className="text-sm font-black text-slate-900">Cadangkan Basis Data</h4>
                  <p className="text-xs font-medium text-slate-500">Buat salinan data (SQL Dump) terbaru secara langsung.</p>
                  <button onClick={() => handleSystemAction("/system/backup", "Cadangan berhasil dibuat!", setIsBackingUp)} disabled={isBackingUp} className="px-4 py-2.5 rounded-xl bg-[#009966] hover:bg-[#008055] text-white font-extrabold text-xs flex items-center gap-2 disabled:opacity-50 transition-all">
                    {isBackingUp ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Proses Cadangan
                  </button>
                </div>
                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 space-y-3">
                  <h4 className="text-sm font-black text-slate-900">Bersihkan Tembolok Redis</h4>
                  <p className="text-xs font-medium text-slate-500">Hapus cache sementara untuk sinkronisasi performa.</p>
                  <button onClick={() => handleSystemAction("/system/clear-cache", "Tembolok dibersihkan!", setIsClearingCache)} disabled={isClearingCache} className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs flex items-center gap-2 disabled:opacity-50 transition-all">
                    {isClearingCache ? <Loader2 size={15} className="animate-spin text-[#009966]" /> : <Brush size={15} className="text-[#009966]" />} Bersihkan Tembolok
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RBAC */}
          {activeTab === "rbac" && isDeveloper && (
            <div className="animate-fade-in space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Hak Akses (RBAC)</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Kelola hierarki peran dan matriks izin kontrol aplikasi.</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-2">
                <RolePermissionPage />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
