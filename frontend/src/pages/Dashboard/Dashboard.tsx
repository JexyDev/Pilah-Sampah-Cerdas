/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

// ========== Warga Dashboard Component ==========
const WargaDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Summary State
  const [poin, setPoin] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [organik, setOrganik] = useState(0);
  const [anorganik, setAnorganik] = useState(0);
  const [quotaRemaining, setQuotaRemaining] = useState(50);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  // Detail Lists
  const [myBins, setMyBins] = useState<any[]>([]);
  const [isLoadingBins, setIsLoadingBins] = useState(true);

  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Modals visibility
  const [showPoinModal, setShowPoinModal] = useState(false);
  const [showSaldoModal, setShowSaldoModal] = useState(false);
  const [showSetoranModal, setShowSetoranModal] = useState(false);

  // Conversion Form State
  const [tukarPoinAmount, setTukarPoinAmount] = useState('500');
  const [ewalletType, setEwalletType] = useState('DANA');
  const [ewalletPhone, setEwalletPhone] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // Waste logs filter state
  const [filterWasteType, setFilterWasteType] = useState('ALL');

  useEffect(() => {
    fetchSummary();
    fetchMyBins();
    fetchNotifications();
    fetchWasteLogs();
    fetchPoints();
  }, []);

  const fetchSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const res = await api.get('/dashboard/summary');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setPoin(d.poin || 0);
        setSaldo(d.saldo || 0);
        setOrganik(d.organik || 0);
        setAnorganik(d.anorganik || 0);
        setQuotaRemaining(d.quotaRemaining !== undefined ? d.quotaRemaining : 50);
      }
    } catch (err) {
      console.error('Gagal memuat summary dashboard', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchMyBins = async () => {
    try {
      setIsLoadingBins(true);
      const res = await api.get('/bins/my-bins');
      if (res.data?.success) {
        setMyBins(res.data.data);
      }
    } catch (err) {
      console.error('Gagal memuat kapasitas tong sampah', err);
    } finally {
      setIsLoadingBins(false);
    }
  };

  const fetchPoints = async () => {
    try {
      setIsLoadingPoints(true);
      const res = await api.get('/points/me');
      if (res.data?.success) {
        setPointHistory(res.data.data.history || []);
      }
    } catch (err) {
      console.error('Gagal memuat riwayat poin', err);
    } finally {
      setIsLoadingPoints(false);
    }
  };

  const fetchWasteLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await api.get('/transactions/my-deposits');
      if (res.data?.success) {
        setWasteLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat riwayat setoran', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const res = await api.get('/notifications');
      if (res.data?.status === 'success') {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat notifikasi', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleTukarPoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pointsToRedeem = parseInt(tukarPoinAmount);
    if (!ewalletPhone.trim()) {
      toast.error('Masukkan nomor HP E-Wallet!');
      return;
    }
    if (poin < pointsToRedeem) {
      toast.error('Poin Anda tidak mencukupi!');
      return;
    }

    try {
      setIsConverting(true);
      const res = await api.post('/points/convert', {
        points: pointsToRedeem,
        ewalletType,
        phone: ewalletPhone
      });

      if (res.data?.success) {
        toast.success(`Berhasil mencairkan Rp ${(pointsToRedeem * 100).toLocaleString('id-ID')} ke ${ewalletType}!`);
        setEwalletPhone('');
        setShowSaldoModal(false);
        // Refresh summary, points, and notifications
        fetchSummary();
        fetchPoints();
        fetchNotifications();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal melakukan penukaran poin');
    } finally {
      setIsConverting(false);
    }
  };

  // Helper for profile picture path
  const getProfilePhotoUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const host = baseUrl.replace('/api/v1', '');
    return `${host}${path}`;
  };

  // Point calculations
  const totalPointsEarned = pointHistory
    .filter(p => p.points > 0)
    .reduce((sum, p) => sum + p.points, 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const pointsEarnedToday = pointHistory
    .filter(p => p.points > 0 && new Date(p.createdAt) >= startOfToday)
    .reduce((sum, p) => sum + p.points, 0);

  const filteredLogs = wasteLogs.filter(log => {
    if (filterWasteType === 'ALL') return true;
    return log.jenis === filterWasteType;
  });

  return (
    <div className="space-y-gutter pb-12">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white/90 p-6 rounded-xl border border-outline-variant/30 flex flex-col gap-3 shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          <>
            {/* Card Poin */}
            <div
              onClick={() => setShowPoinModal(true)}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant font-bold tracking-wide">Poin Saya</p>
                <h3 className="text-[24px] font-extrabold text-on-surface leading-tight mt-1">{poin.toLocaleString('id-ID')} Poin</h3>
                <p className="text-[10px] text-primary font-bold mt-2 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">trending_up</span>
                  +{pointsEarnedToday} Poin hari ini
                </p>
              </div>
            </div>

            {/* Card Saldo */}
            <div
              onClick={() => setShowSaldoModal(true)}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant font-bold tracking-wide">Saldo Rupiah</p>
                <h3 className="text-[24px] font-extrabold text-on-surface leading-tight mt-1">Rp {saldo.toLocaleString('id-ID')}</h3>
                <p className="text-[10px] text-on-surface-variant font-medium mt-2 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">account_balance_wallet</span>
                  Cairkan Poin ke E-Wallet Anda
                </p>
              </div>
            </div>

            {/* Card Organik */}
            <div
              onClick={() => setShowSetoranModal(true)}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant font-bold tracking-wide">Total Setoran Organik</p>
                <h3 className="text-[24px] font-extrabold text-on-surface leading-tight mt-1">{organik} Kg</h3>
                <p className="text-[10px] text-emerald-700 font-bold mt-2">Komposisi pemilahan aktif</p>
              </div>
            </div>

            {/* Card Anorganik */}
            <div
              onClick={() => setShowSetoranModal(true)}
              className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
            >
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_drink</span>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant font-bold tracking-wide">Total Setoran Anorganik</p>
                <h3 className="text-[24px] font-extrabold text-on-surface leading-tight mt-1">{anorganik} Kg</h3>
                <p className="text-[10px] text-blue-700 font-bold mt-2">Penyumbang daur ulang aktif</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        {/* Left Column (CTA, Profile, Notifications) */}
        <div className="xl:col-span-8 space-y-gutter">
          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left z-10">
              <h4 className="text-[22px] font-bold tracking-tight">Setorkan Sampah, Jaga Lingkungan!</h4>
              <p className="text-xs text-green-100 max-w-md leading-relaxed">
                Gunakan kamera ponsel Anda untuk memindai sampah menggunakan kecerdasan buatan (AI) dan setorkan ke smart bin terdekat untuk hadiah instan.
              </p>
              <div className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-full px-3 py-1 mt-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                Kuota AI Hari Ini: {quotaRemaining} / 50 Request
              </div>
            </div>
            <button
              onClick={() => navigate('/setor')}
              className="bg-white hover:bg-slate-50 text-emerald-800 font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer z-10"
            >
              Mulai Setor Sekarang
            </button>
            <div className="absolute right-[-20px] bottom-[-40px] opacity-10 text-[180px] pointer-events-none select-none">eco</div>
          </div>

          {/* Profile Card */}
          <div className="bg-white/95 backdrop-blur-sm border border-outline-variant/40 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-primary/10 text-primary">
              {user?.fotoProfil ? (
                <img src={getProfilePhotoUrl(user.fotoProfil) || undefined} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name.substring(0, 2).toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h4 className="font-extrabold text-[18px] text-on-surface">{user?.name}</h4>
                <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider w-fit mx-auto sm:mx-0">WARGA PSC</span>
              </div>
              <p className="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1 font-medium">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">home</span>
                {user?.address || 'Alamat Belum Dikonfigurasi'}
              </p>
              <p className="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1 font-medium">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">location_on</span>
                Wilayah Tugas: <strong className="text-primary">{user?.wilayah || '-'}</strong>
              </p>
            </div>
            <button
              onClick={() => navigate('/pengaturan')}
              className="px-4 py-2 border border-outline-variant/50 text-on-surface-variant hover:text-on-surface hover:bg-slate-50 transition-colors text-[11px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Profil
            </button>
          </div>

          {/* Notifications Card */}
          <div className="bg-white/95 backdrop-blur-sm border border-outline-variant/40 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h5 className="font-bold text-[15px] text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">notifications</span>
                Notifikasi Terbaru
              </h5>
              <button
                onClick={fetchNotifications}
                className="text-primary hover:underline text-[11px] font-bold uppercase tracking-wider flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">sync</span>
                Refresh
              </button>
            </div>

            {isLoadingNotifications ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant/75 text-xs">
                <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">campaign</span>
                Belum ada notifikasi baru untuk Anda.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notif) => (
                  <div key={notif.id} className="flex gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container transition-colors">
                    <div className={`w-8 h-8 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-[18px]">{notif.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-on-surface truncate">{notif.title}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{notif.desc}</p>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Bins Capacity, Recent Activity) */}
        <div className="xl:col-span-4 space-y-gutter">
          {/* Bin Capacity */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h5 className="font-bold text-[15px] text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">delete_sweep</span>
                Tong Sampah RT/RW Saya
              </h5>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{user?.wilayah || 'Umum'}</span>
            </div>

            {isLoadingBins ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-100 rounded"></div>
                <div className="h-6 bg-slate-100 rounded"></div>
              </div>
            ) : myBins.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant/75 text-xs">
                <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">warning</span>
                Tidak ada tong sampah terdaftar di RT/RW Anda.
              </div>
            ) : (
              <div className="space-y-4">
                {myBins.map((bin) => (
                  <div key={bin.id} className="space-y-1.5 p-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest">
                    <div className="flex justify-between text-[11px] font-bold text-on-surface">
                      <span className="flex items-center gap-1">
                        <span className={`material-symbols-outlined text-[16px] ${bin.category === 'ORGANIC' ? 'text-primary' : 'text-blue-500'}`}>
                          {bin.category === 'ORGANIC' ? 'eco' : 'recycling'}
                        </span>
                        Tong {bin.category === 'ORGANIC' ? 'Organik' : 'Anorganik'} ({bin.qrCode})
                      </span>
                      <span className={bin.kapasitas > 80 ? 'text-red-600' : 'text-on-surface-variant'}>{bin.kapasitas}% Terisi</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${bin.kapasitas >= 80 ? 'bg-red-500' : bin.kapasitas >= 50 ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${bin.kapasitas}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-on-surface-variant/80 text-right font-semibold">
                      {bin.currentVolumeLiter} L / {bin.maxCapacityLiter} L Kapasitas
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h5 className="font-bold text-[15px] text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary">history</span>
                Setoran Terakhir
              </h5>
              <button
                onClick={() => setShowSetoranModal(true)}
                className="text-primary hover:underline text-[11px] font-bold uppercase tracking-wider"
              >
                Lihat Semua
              </button>
            </div>

            {isLoadingLogs ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-slate-100 rounded"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
              </div>
            ) : wasteLogs.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant/75 text-xs">
                <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">archive</span>
                Belum ada riwayat setoran sampah.
              </div>
            ) : (
              <div className="space-y-3">
                {wasteLogs.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container transition-all">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold">{new Date(item.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[12px] font-bold text-on-surface mt-0.5">{item.jenis === 'ORGANIC' ? '🌱 Organik' : '♻️ Anorganik'} ({item.berat} Kg)</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{item.lokasi} • {item.volume}</p>
                    </div>
                    <span className="text-[12px] font-extrabold text-primary">+{item.poin} Pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. POIN MODAL */}
      {showPoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[18px] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500">stars</span>
                Riwayat & Detail Poin
              </h3>
              <button onClick={() => setShowPoinModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Total Poin Diperoleh</p>
                  <p className="text-xl font-bold text-primary mt-1">+{totalPointsEarned} Pts</p>
                </div>
                <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Target Rank Selanjutnya</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">Silver Rank</p>
                </div>
              </div>

              {/* Progress Bar target */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-on-surface">
                  <span>Progres Tingkat</span>
                  <span>{poin} / 1000 Poin</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (poin / 1000) * 100)}%` }}></div>
                </div>
              </div>

              {/* Point Log List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Breakdown Aktivitas Poin</h4>
                {isLoadingPoints ? (
                  <p className="text-xs text-center py-4 text-on-surface-variant">Memuat data...</p>
                ) : pointHistory.length === 0 ? (
                  <p className="text-xs text-center py-4 text-on-surface-variant/80">Belum ada transaksi poin.</p>
                ) : (
                  <div className="divide-y divide-outline-variant/20 max-h-[250px] overflow-y-auto">
                    {pointHistory.map((historyItem) => (
                      <div key={historyItem.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-on-surface">{historyItem.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(historyItem.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                        <span className={`font-extrabold text-sm ${historyItem.points > 0 ? 'text-primary' : 'text-red-500'}`}>
                          {historyItem.points > 0 ? `+${historyItem.points}` : historyItem.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-outline-variant flex justify-end">
              <button onClick={() => setShowPoinModal(false)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-on-surface-variant transition-colors cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALDO MODAL */}
      {showSaldoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[18px] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600">payments</span>
                Cairkan Saldo E-Wallet
              </h3>
              <button onClick={() => setShowSaldoModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Balance Summary */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <p className="text-[11px] text-green-700 font-extrabold uppercase tracking-wider">Sisa Saldo Dapat Dicairkan</p>
                <p className="text-3xl font-extrabold text-green-800 mt-1">Rp {saldo.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-green-600/90 mt-1">Dihitung otomatis: Poin ({poin}) x Rp 100</p>
              </div>

              {/* Conversion Form */}
              <form onSubmit={handleTukarPoin} className="space-y-4">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Form Penukaran Saldo</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Poin Ditukar</label>
                    <select
                      className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
                      value={tukarPoinAmount}
                      onChange={(e) => setTukarPoinAmount(e.target.value)}
                    >
                      <option value="500">500 Poin (Rp 50.000)</option>
                      <option value="1000">1000 Poin (Rp 100.000)</option>
                      <option value="2000">2000 Poin (Rp 200.000)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Metode E-Wallet</label>
                    <select
                      className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
                      value={ewalletType}
                      onChange={(e) => setEwalletType(e.target.value)}
                    >
                      <option value="DANA">DANA</option>
                      <option value="OVO">OVO</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase">Nomor HP Terdaftar</label>
                  <input
                    type="tel"
                    placeholder="contoh: 08123456789"
                    className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:border-primary focus:outline-none"
                    value={ewalletPhone}
                    onChange={(e) => setEwalletPhone(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConverting || poin < parseInt(tukarPoinAmount)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-green-600/10"
                >
                  {isConverting ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">account_balance</span>
                      <span>Konversi Sekarang</span>
                    </>
                  )}
                </button>
              </form>

              {/* Conversion History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Riwayat Pencairan Terakhir</h4>
                <div className="divide-y divide-outline-variant/20 max-h-[180px] overflow-y-auto">
                  {pointHistory.filter(p => p.points < 0).length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Belum ada riwayat pencairan saldo.</p>
                  ) : (
                    pointHistory.filter(p => p.points < 0).map((historyItem) => (
                      <div key={historyItem.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-on-surface">{historyItem.description.replace("Konversi ", "")}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(historyItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <span className="font-bold text-red-500">
                          -Rp {Math.abs(historyItem.points * 100).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-outline-variant flex justify-end">
              <button onClick={() => setShowSaldoModal(false)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-on-surface-variant transition-colors cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SETORAN MODAL */}
      {showSetoranModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-[18px] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">recycling</span>
                Semua Riwayat Setoran Sampah
              </h3>
              <button onClick={() => setShowSetoranModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Category Filter */}
              <div className="flex gap-2">
                {['ALL', 'ORGANIC', 'NON_ORGANIC'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterWasteType(type)}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border ${filterWasteType === type
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-outline-variant hover:bg-slate-50 text-on-surface-variant'
                      }`}
                  >
                    {type === 'ALL' ? 'Semua' : type === 'ORGANIC' ? 'Organik' : 'Anorganik'}
                  </button>
                ))}
              </div>

              {/* Transactions table/list */}
              {isLoadingLogs ? (
                <p className="text-xs text-center py-6">Memuat...</p>
              ) : filteredLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Tidak ada data setoran.</p>
              ) : (
                <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-inner bg-slate-50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-on-surface-variant border-b border-outline-variant/40">
                          <th className="p-3 font-bold">Tanggal</th>
                          <th className="p-3 font-bold">Kategori</th>
                          <th className="p-3 font-bold">Berat</th>
                          <th className="p-3 font-bold">Estimasi Vol</th>
                          <th className="p-3 font-bold">Poin</th>
                          <th className="p-3 font-bold">Titik Tong</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 bg-white">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium">
                              {new Date(log.waktu).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${log.jenis === 'ORGANIC' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                {log.jenis === 'ORGANIC' ? 'Organik' : 'Anorganik'}
                              </span>
                            </td>
                            <td className="p-3 font-bold">{log.berat} Kg</td>
                            <td className="p-3 font-medium text-slate-500">{log.volume}</td>
                            <td className="p-3 font-extrabold text-primary">+{log.poin} Pts</td>
                            <td className="p-3 font-mono font-bold text-slate-600">{log.lokasi.replace("Tong: ", "")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-outline-variant flex justify-end">
              <button onClick={() => setShowSetoranModal(false)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-on-surface-variant transition-colors cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ========== KPI Card Component ==========
interface KpiCardProps {
  iconName: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: string | number;
  trendLabel?: string;
  trendUp?: boolean;
  linkTo?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ iconName, iconBg, iconColor, label, value, trend, trendLabel, trendUp, linkTo }) => {
  const content = (
    <div className={`bg-white/95 backdrop-blur-sm shadow-sm rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-3 h-full ${linkTo ? 'cursor-pointer hover:bg-surface-container-low transition-all duration-150' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
        </div>
        <div className="flex-1">
          <p className="text-[12px] text-on-surface-variant font-bold">{label}</p>
          <h4 className="text-[20px] font-extrabold text-on-surface leading-tight">{value !== undefined ? value : '-'}</h4>
        </div>
      </div>
      {(trend || trendLabel) && (
        <div className="flex items-center gap-1.5 mt-1 border-t border-outline-variant/30 pt-2">
          {trendUp !== undefined && (
            <span className={`material-symbols-outlined text-[14px] ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? 'trending_up' : 'trending_down'}
            </span>
          )}
          <span className={`text-[11px] font-bold ${trendUp === true ? 'text-green-600' : trendUp === false ? 'text-red-600' : 'text-on-surface-variant'}`}>
            {trend} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block h-full">{content}</Link>;
  }
  return content;
};

// ========== Main Dashboard ==========
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recentBins, setRecentBins] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentSchedules, setRecentSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dynamic features states
  const [trendData, setTrendData] = useState<any[]>([]);
  const [weeks, setWeeks] = useState(8);
  const [locations, setLocations] = useState<any[]>([]);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [selectedBinForDetail, setSelectedBinForDetail] = useState<any | null>(null);

  const handleUserDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      try {
        await api.delete(`/users/${id}`);
        toast.success("Pengguna berhasil dihapus");
        window.location.reload();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Gagal menghapus pengguna");
      }
    }
  };

  const handleBinDelete = async (qrCode: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus tempat sampah ini?")) {
      try {
        await api.delete(`/bins/${qrCode}`);
        toast.success("Tempat sampah berhasil dihapus");
        window.location.reload();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Gagal menghapus tempat sampah");
      }
    }
  };

  useEffect(() => {
    // Skip API load for WARGA
    if (user?.peran === 'WARGA') {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setError('');
        const response = await api.get('/dashboard/kpi', {
          params: { wilayah: user?.wilayah }
        });
        const kpi = response.data?.data ?? response.data;
        if (!kpi) {
          throw new Error('KPI kosong');
        }

        // Menghitung persentase
        const organikKg = Number(kpi.komposisiSampah?.organikKg ?? 0);
        const anorganikKg = Number(kpi.komposisiSampah?.anorganikKg ?? 0);
        const totalBerat = organikKg + anorganikKg;
        const pctOrganik = totalBerat > 0 ? Math.round((organikKg / totalBerat) * 100) : 0;
        const pctAnorganik = totalBerat > 0 ? 100 - pctOrganik : 0;

        // Memetakan data riil dari backend ke UI
        setStats({
          totalPengguna: { value: kpi.totalWarga ?? 0, trend: '+0', trendLabel: 'Bulan ini', trendUp: true },
          tempatSampahAktif: {
            value: kpi.tempatSampahAktif ?? 0,
            trend: (kpi.alertTongPenuh ?? 0) > 0 ? `${kpi.alertTongPenuh} Penuh` : 'Aman',
            trendLabel: '',
            trendUp: (kpi.alertTongPenuh ?? 0) === 0,
          },
          lokasiTerdaftar: { value: kpi.lokasiTerdaftar ?? 0, trend: '+0', trendLabel: 'Bulan ini', trendUp: true },
          setoranHariIni: {
            value: `${Number(kpi.setoranHariIniKg ?? 0).toFixed(1)} Kg`,
            trend: 'Hari ini',
            trendLabel: '',
            trendUp: true,
          },
          totalPoin: {
            value:
              (kpi.totalPoin ?? 0) > 1000
                ? `${((kpi.totalPoin ?? 0) / 1000).toFixed(1)}K`
                : Number(kpi.totalPoin ?? 0).toLocaleString(),
            trend: '+0',
            trendLabel: 'Bulan ini',
            trendUp: true,
          },
          jadwalMingguIni: { value: 8, trend: '2', trendLabel: 'Selesai', trendUp: true },
          komposisiSampah: {
            organik: { berat: `${organikKg.toFixed(1)} Kg`, persentase: `${pctOrganik}%` },
            anorganik: { berat: `${anorganikKg.toFixed(1)} Kg`, persentase: `${pctAnorganik}%` },
            pctOrganik,
            pctAnorganik
          },
        });

        // Secondary data: jangan gagalkan seluruh dashboard jika salah satu endpoint error
        const [binsSettled, usersSettled, schedSettled, trendSettled, locSettled] = await Promise.allSettled([
          api.get('/bins'),
          api.get('/users'),
          api.get('/schedules'),
          api.get('/dashboard/trend', { params: { weeks, wilayah: user?.wilayah } }),
          api.get('/bins/locations'),
        ]);

        const hasWilayah = user?.wilayah && user?.wilayah !== 'Kecamatan Coblong' && user?.wilayah !== 'Sistem Pusat';

        if (binsSettled.status === 'fulfilled') {
          let binsData = binsSettled.value.data?.data ?? binsSettled.value.data ?? [];
          if (hasWilayah) {
            binsData = binsData.filter((b: any) => {
              const binRtRwName = typeof b.rtRw === 'string' ? b.rtRw : (b.rtRw?.name || '');
              return binRtRwName === user?.wilayah;
            });
          }
          setRecentBins(Array.isArray(binsData) ? binsData.slice(0, 3) : []);
        } else {
          setRecentBins([]);
        }

        if (usersSettled.status === 'fulfilled') {
          let usersData = usersSettled.value.data?.data ?? usersSettled.value.data ?? [];
          if (hasWilayah) {
            usersData = usersData.filter((u: any) => u.wilayah === user?.wilayah);
          }
          setRecentUsers(Array.isArray(usersData) ? usersData.slice(0, 3) : []);
        } else {
          setRecentUsers([]);
        }

        if (schedSettled.status === 'fulfilled') {
          let schedData = schedSettled.value.data?.data ?? schedSettled.value.data ?? [];
          if (hasWilayah) {
            schedData = schedData.filter((s: any) => s.location?.includes(user?.wilayah) || s.lokasi?.includes(user?.wilayah));
          }
          setRecentSchedules(Array.isArray(schedData) ? schedData.slice(0, 3) : []);
        } else {
          setRecentSchedules([]);
        }

        if (trendSettled.status === 'fulfilled' && trendSettled.value.data?.success) {
          setTrendData(trendSettled.value.data.data);
        }

        if (locSettled.status === 'fulfilled' && locSettled.value.data?.success) {
          setLocations(locSettled.value.data.data);
        }
      } catch (err) {
        console.error('Dashboard KPI error', err);
        setError('Gagal memuat data dashboard dari server.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, weeks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>autorenew</span>
          <p className="text-on-surface-variant font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px]">error</span>
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Render WARGA Dashboard
  if (user?.peran === 'WARGA') {
    return <WargaDashboard />;
  }

  // Scaling factors for Trend SVG
  const maxWeightTrend = Math.max(...trendData.map(d => d.weight || 0), 10);
  const trendPoints = trendData.map((d, i) => {
    const x = trendData.length > 1 ? (i / (trendData.length - 1)) * 700 : 350;
    const y = 170 - ((d.weight || 0) / maxWeightTrend) * 140;
    return { x, y, label: d.label, weight: d.weight };
  });

  const trendLinePath = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const trendAreaPath = trendPoints.length > 0
    ? `${trendLinePath} L${trendPoints[trendPoints.length - 1].x},200 L${trendPoints[0].x},200 Z`
    : '';

  // Get active bin for QR Code card
  const activeBin = recentBins[0] || {
    qrCode: 'TS-COB-001',
    maxCapacityLiter: 25,
    currentVolumeLiter: 5,
    status: 'Normal',
  };
  const activeVol = Number(activeBin.currentVolumeLiter || 0);
  const activeMax = Number(activeBin.maxCapacityLiter || 25);
  const activeCapPct = activeMax > 0 ? Math.round((activeVol / activeMax) * 100) : 0;

  return (
    <div className="space-y-gutter pb-12">

      {/* === KPI Section (6 Cards) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter">
        <KpiCard iconName="group" iconBg="bg-blue-100" iconColor="text-blue-600" label="Total Pengguna" value={stats?.totalPengguna?.value} trend={stats?.totalPengguna?.trend} trendLabel={stats?.totalPengguna?.trendLabel} trendUp={stats?.totalPengguna?.trendUp} linkTo="/manajemen-pengguna" />
        <KpiCard iconName="delete" iconBg="bg-green-100" iconColor="text-green-600" label="Tempat Sampah Aktif" value={stats?.tempatSampahAktif?.value} trend={stats?.tempatSampahAktif?.trend} trendLabel={stats?.tempatSampahAktif?.trendLabel} trendUp={stats?.tempatSampahAktif?.trendUp} linkTo="/manajemen-tempat-sampah" />
        <KpiCard iconName="location_on" iconBg="bg-indigo-100" iconColor="text-indigo-600" label="Lokasi Terdaftar" value={stats?.lokasiTerdaftar?.value} trend={stats?.lokasiTerdaftar?.trend} trendLabel={stats?.lokasiTerdaftar?.trendLabel} trendUp={stats?.lokasiTerdaftar?.trendUp} linkTo="/manajemen-lokasi" />
        <KpiCard iconName="shopping_bag" iconBg="bg-amber-100" iconColor="text-amber-600" label="Setoran Hari Ini" value={stats?.setoranHariIni?.value} trend={stats?.setoranHariIni?.trend} trendLabel={stats?.setoranHariIni?.trendLabel} trendUp={stats?.setoranHariIni?.trendUp} />
        <KpiCard iconName="stars" iconBg="bg-yellow-100" iconColor="text-yellow-600" label="Total Poin" value={stats?.totalPoin?.value} trend={stats?.totalPoin?.trend} trendLabel={stats?.totalPoin?.trendLabel} trendUp={stats?.totalPoin?.trendUp} linkTo="/poin-warga" />
        <KpiCard iconName="calendar_month" iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Jadwal Minggu Ini" value={stats?.jadwalMingguIni?.value} trend={stats?.jadwalMingguIni?.trend} trendLabel={stats?.jadwalMingguIni?.trendLabel} trendUp={stats?.jadwalMingguIni?.trendUp} linkTo="/jadwal-kegiatan" />
      </div>

      {/* === Charts Grid === */}
      <div className="flex gap-gutter h-[340px]">
        {/* Line Chart — Trend Setoran */}
        <div className="w-1/2 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-[18px] text-on-surface">Trend Setoran Sampah per Minggu <span className="text-[12px] text-on-surface-variant font-normal">(kg)</span></h4>
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              className="bg-surface-container px-3 py-1.5 rounded-lg text-[12px] border border-outline-variant/30 text-on-surface focus:outline-none cursor-pointer font-bold"
            >
              <option value={4}>4 Minggu Terakhir</option>
              <option value={8}>8 Minggu Terakhir</option>
              <option value={12}>12 Minggu Terakhir</option>
            </select>
          </div>
          {/* SVG Line Chart */}
          <div className="h-[220px] w-full relative">
            {trendPoints.length > 0 ? (
              <>
                <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#006d37" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#006d37" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  {[0, 50, 100, 150, 200].map(y => (
                    <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#f0f2f5" strokeWidth="1" />
                  ))}
                  {/* Area Fill */}
                  <path d={trendAreaPath} fill="url(#lineGrad)" />
                  {/* Line */}
                  <path d={trendLinePath} fill="none" stroke="#006d37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dots */}
                  {trendPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="5" fill="#006d37" stroke="white" strokeWidth="2" />
                  ))}
                </svg>
                {/* X-axis labels */}
                <div className="absolute bottom-[-4px] left-0 right-0 flex justify-between px-1">
                  {trendPoints.map((p, i) => (
                    <span key={i} className="text-[10px] text-on-surface-variant font-bold">{p.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
                Tidak ada data setoran untuk periode ini
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart — Komposisi Sampah */}
        <div className="w-1/4 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6 flex flex-col">
          <h4 className="font-bold text-[18px] text-on-surface mb-4">Komposisi Sampah</h4>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="w-32 h-32 relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (stats?.komposisiSampah?.pctOrganik ?? 0) / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-[22px] font-bold text-on-surface leading-none">{stats?.komposisiSampah?.pctOrganik ?? 0}%</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Organik</span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2">
              <div className="flex justify-between items-center text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                  <span className="text-on-surface">Organik</span>
                </div>
                <span className="text-on-surface font-bold">{stats?.komposisiSampah?.organik?.berat} ({stats?.komposisiSampah?.organik?.persentase})</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <span className="text-on-surface">Anorganik</span>
                </div>
                <span className="text-on-surface font-bold">{stats?.komposisiSampah?.anorganik?.berat} ({stats?.komposisiSampah?.anorganik?.persentase})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Widget */}
        <div
          onClick={() => setShowComplianceModal(true)}
          className="w-1/4 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden relative border border-outline-variant/30 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-outline-variant/30 shadow-sm">
            <h4 className="font-bold text-[14px] text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
              Kepatuhan RT/RW
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </h4>
          </div>
          <div className="w-full h-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757876800742!2d107.60946252981977!3d-6.880479133333333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6580f4f9f4d%3A0x6b30fef6a75f850e!2sCoblong%2C%20Bandung%20City%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1720800000000!5m2!1sen!2sid"
              className="w-full h-full border-0 grayscale opacity-85 pointer-events-none"
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-outline-variant shadow-sm z-10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Rata-rata Kepatuhan</p>
                <p className="text-[12px] font-bold text-primary">
                  {locations.length > 0
                    ? `${Math.round(locations.reduce((sum, loc) => sum + (loc.patuh || 0), 0) / locations.length)}% Patuh`
                    : '75% Patuh'}
                </p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white border-2 border-white">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white border-2 border-white font-bold text-[10px]">
                  {locations.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === Tables + Activity Grid === */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Data Tempat Sampah Terbaru */}
        <div className="col-span-5 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Data Tempat Sampah Terbaru</h4>
            <Link to="/manajemen-tempat-sampah" className="text-primary text-[12px] font-bold hover:underline">Lihat Semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[12px] text-on-surface-variant border-b border-outline-variant">
                  <th className="pb-3 font-bold">ID & Jenis</th>
                  <th className="pb-3 font-bold">Lokasi</th>
                  <th className="pb-3 font-bold">Kapasitas</th>
                  <th className="pb-3 font-bold">Poin/Kg</th>
                  <th className="pb-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {recentBins.map((bin, i) => {
                  const cap = Math.round(bin.kapasitas || (Number(bin.currentVolumeLiter) / Number(bin.maxCapacityLiter) * 100));
                  return (
                    <tr key={bin.id || bin.kode || i} className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold">{bin.qrCode || bin.kode || (bin.id ? bin.id.substring(0, 8) : 'BIN')}</span>
                          <span className={`text-[10px] ${(bin.category?.name || bin.categoryId) === 'ORGANIK' ? 'text-primary' : 'text-secondary'} flex items-center gap-1`}>
                            <span className="material-symbols-outlined text-[14px]">{(bin.category?.name || bin.categoryId) === 'ORGANIK' ? 'recycling' : 'delete'}</span> {bin.category?.name || bin.categoryId || 'UMUM'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span>{bin.rtRw?.kelurahan?.name || 'Kelurahan'}</span>
                          <span className="text-[10px] text-on-surface-variant">{typeof bin.rtRw === 'string' ? bin.rtRw : (bin.rtRw?.name || '-')}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`${cap > 90 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} px-2 py-0.5 rounded text-[10px] font-bold`}>{cap}% {cap > 90 ? 'Penuh' : 'Normal'}</span>
                      </td>
                      <td className="py-3 font-bold text-yellow-600">
                        {bin.category?.pointsPerKg || 100}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelectedBinForDetail(bin)}
                            className="p-1 hover:text-primary text-gray-400 rounded hover:bg-surface-container-high transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                          <button
                            onClick={() => navigate('/manajemen-tempat-sampah', { state: { editBinId: bin.id || bin.kode } })}
                            className="p-1 hover:text-primary text-gray-400 rounded hover:bg-surface-container-high transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleBinDelete(bin.qrCode || bin.kode)}
                            className="p-1 hover:text-red-600 text-gray-400 rounded hover:bg-surface-container-high transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manajemen Pengguna */}
        <div className="col-span-4 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Manajemen Pengguna</h4>
            <Link to="/manajemen-pengguna" className="text-primary text-[12px] font-bold hover:underline">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors cursor-pointer relative group">
                <div className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container-high flex items-center justify-center text-primary font-bold">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-on-surface leading-none">{u.name}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1">{u.role} • {u.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">{u.wilayah}</span>
                    {u.role === 'WARGA' && (
                      <span className="text-[9px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.2 rounded font-semibold">{u.totalPoin ?? 0} Poin</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${u.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status || 'Aktif'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/manajemen-pengguna', { state: { editUserId: u.id } }); }}
                      className="p-1 hover:text-primary text-gray-400 rounded hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUserDelete(u.id); }}
                      className="p-1 hover:text-red-600 text-gray-400 rounded hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jadwal Kegiatan */}
        <div className="col-span-3 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Jadwal Kegiatan</h4>
            <Link to="/jadwal-kegiatan" className="w-8 h-8 flex items-center justify-center bg-surface-container rounded-lg text-primary hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
            </Link>
          </div>
          <div className="space-y-4">
            {recentSchedules.length > 0 ? recentSchedules.map((item: any) => {
              const date = new Date(item.date || item.waktu || Date.now());
              const dayNames = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
              return (
                <div key={item.id} className="flex gap-4">
                  <div className={`flex flex-col items-center bg-primary-container/10 rounded-lg px-2 py-1 min-w-[50px] h-fit`}>
                    <span className={`text-[10px] font-bold text-primary uppercase`}>{dayNames[date.getDay()]}</span>
                    <span className="text-[18px] font-bold text-primary leading-none mt-0.5">{date.getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-[14px] text-on-surface leading-tight">{item.title || item.nama_kegiatan}</h5>
                    <p className="text-[11px] text-on-surface-variant">{item.location || item.lokasi} • {item.time || date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    <span className={`inline-block mt-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase`}>{item.category || item.status || 'Jadwal'}</span>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-gray-500 text-center py-4">Belum ada jadwal</p>
            )}
          </div>
        </div>
      </div>

      {/* === Bottom Operational Widgets === */}
      <div className="grid grid-cols-4 gap-gutter">
        {/* Poin Warga Top 5 */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Poin Warga - Top 5</h4>
            <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          </div>
          <div className="space-y-4">
            {[
              { name: '1. Dewi Lestari (RW 06)', points: '12.350 Poin', pct: '95%', bold: true },
              { name: '2. Budi Hartono (RW 02)', points: '9.870 Poin', pct: '78%', bold: true },
              { name: '3. Siti Aminah (RW 01)', points: '8.420 Poin', pct: '65%', bold: true },
              { name: '4. Rizky Maulana (RW 03)', points: '7.560 Poin', pct: '55%', bold: false },
            ].map(item => (
              <div key={item.name} className={`space-y-1 ${!item.bold ? 'opacity-60' : ''}`}>
                <div className="flex justify-between text-[12px]">
                  <span className={`${item.bold ? 'font-bold' : ''} text-on-surface`}><Link to="/poin-warga" className="hover:underline">{item.name}</Link></span>
                  <span className="text-primary font-bold">{item.points}</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: item.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tempat Sampah QR */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6 bg-gradient-to-br from-white to-surface-container-low">
          <h4 className="font-bold text-[18px] text-on-surface mb-6">Tempat Sampah (QR)</h4>
          <div className="flex gap-4">
            <div className="w-1/2 p-3 bg-white rounded-xl border-2 border-outline-variant flex items-center justify-center">
              <img className="w-full aspect-square opacity-80" alt="QR Code Bin" src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(activeBin.qrCode)}`} />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">ID BIN</p>
                <p className="text-[12px] font-bold text-primary">{activeBin.qrCode}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">Kapasitas</p>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-on-surface">{activeCapPct}% Full</span>
                  <span className={`material-symbols-outlined ${activeCapPct > 90 ? 'text-error animate-pulse' : 'text-primary'} text-[14px]`}>sensors</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setSelectedBinForDetail(activeBin)}
                  className="w-full py-2 bg-primary text-white rounded-lg text-[12px] font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Detail Bin
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <Link to="/rekap-setoran" className="block">
          <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6 h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-[18px] text-on-surface">Aktivitas Terbaru</h4>
              <span className="material-symbols-outlined text-primary">history</span>
            </div>
            <div className="space-y-4">
              {[
                { iconBg: 'bg-green-100', iconColor: 'text-green-700', icon: 'add', title: 'Setoran 18 kg Organik', sub: 'Dewi Lestari • 09:30' },
                { iconBg: 'bg-blue-100', iconColor: 'text-blue-700', icon: 'local_shipping', title: 'Pengangkutan Selesai', sub: 'Dago Giri • 08:15' },
                { iconBg: 'bg-amber-100', iconColor: 'text-amber-700', icon: 'warning', title: 'Bin Hampir Penuh', sub: 'RW 01 Dago • 07:45' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-6 h-6 rounded-full ${item.iconBg} flex items-center justify-center z-10 border-2 border-white flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-[14px] ${item.iconColor}`}>{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.title}</p>
                    <p className="text-[10px] text-on-surface-variant">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>

        {/* Notifikasi Sistem */}
        <Link to="/notifikasi" className="block">
          <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6 h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-[18px] text-on-surface">Notifikasi Sistem</h4>
              <span className="material-symbols-outlined text-error">campaign</span>
            </div>
            <div className="space-y-4">
              {[
                { icon: 'error_outline', iconColor: 'text-error', title: 'Sensor Offline (TS-00321)', sub: 'Baterai lemah terdeteksi' },
                { icon: 'verified_user', iconColor: 'text-primary', title: 'Target Harian Tercapai', sub: 'Capaian 105% hari ini' },
              ].map((notif, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                  <span className={`material-symbols-outlined ${notif.iconColor} text-[20px] mt-0.5`}>{notif.icon}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{notif.title}</p>
                    <p className="text-[9px] text-on-surface-variant">{notif.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>
      </div>

      {/* === Peringkat Komunitas Lestari === */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h4 className="text-[22px] font-bold text-on-surface">Peringkat Komunitas Lestari</h4>
            <p className="text-[14px] text-on-surface-variant">Statistik keaktifan pemilahan sampah di Kelurahan, RW, dan RT wilayah Kecamatan Coblong.</p>
          </div>
          <button className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
            <span className="material-symbols-outlined">download</span>
            <span>Unduh Laporan Lengkap</span>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-gutter">
          {/* Top Warga */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <h5 className="font-bold text-[18px]">Top 10 Warga</h5>
            </div>
            <div className="space-y-3">
              {[
                { rank: '1', name: 'Dewi Lestari', sub: 'RW 06 Dago', val: '12.3k Poin', rankCls: 'bg-yellow-400 text-white' },
                { rank: '2', name: 'Budi Hartono', sub: 'RW 02 Cigadung', val: '9.8k Poin', rankCls: 'bg-slate-300 text-on-surface' },
                { rank: '3', name: 'Siti Aminah', sub: 'RW 01 Coblong', val: '8.4k Poin', rankCls: 'bg-amber-600 text-white' },
                { rank: '4', name: 'Rizky Maulana', sub: 'RW 03 Lebak Gede', val: '7.5k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '5', name: 'Hani Fitriani', sub: 'RW 04 Sekeloa', val: '7.1k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '6', name: 'Ahmad Wijaya', sub: 'RW 02 Coblong', val: '6.8k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '7', name: 'Rudi Hermawan', sub: 'RW 03 Sekeloa', val: '6.5k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '8', name: 'Siti Rahmawati', sub: 'RW 05 Dago', val: '6.2k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '9', name: 'Reza Herdian', sub: 'RW 01 Lebak Siliwangi', val: '5.9k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '10', name: 'Adi Nugroho', sub: 'RW 04 Cigadung', val: '5.5k Poin', rankCls: 'bg-surface-variant text-on-surface' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'bg-white shadow-sm' : 'bg-white/60'} p-2 rounded-xl border border-outline-variant/30`}>
                  <span className={`w-6 h-6 flex items-center justify-center ${item.rankCls} font-bold rounded-full text-[10px]`}>{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="text-primary font-bold text-[12px]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top RT */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <h5 className="font-bold text-[18px]">Top 10 RT</h5>
            </div>
            <div className="space-y-3">
              {[
                { rank: '1', name: 'RT 04 / RW 06', sub: 'Kel. Dago', val: '850 kg', rankCls: 'bg-yellow-400 text-white' },
                { rank: '2', name: 'RT 01 / RW 02', sub: 'Kel. Cigadung', val: '720 kg', rankCls: 'bg-slate-300 text-on-surface' },
                { rank: '3', name: 'RT 03 / RW 04', sub: 'Kel. Sekeloa', val: '680 kg', rankCls: 'bg-amber-600 text-white' },
                { rank: '4', name: 'RT 02 / RW 03', sub: 'Kel. Sadang Serang', val: '610 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '5', name: 'RT 05 / RW 01', sub: 'Kel. Dago', val: '590 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '6', name: 'RT 01 / RW 05', sub: 'Kel. Lebak Siliwangi', val: '550 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '7', name: 'RT 03 / RW 02', sub: 'Kel. Sekeloa', val: '520 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '8', name: 'RT 02 / RW 04', sub: 'Kel. Cigadung', val: '490 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '9', name: 'RT 04 / RW 03', sub: 'Kel. Sadang Serang', val: '460 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '10', name: 'RT 01 / RW 06', sub: 'Kel. Lebak Gede', val: '430 kg', rankCls: 'bg-surface-variant text-on-surface' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'bg-white shadow-sm' : 'bg-white/60'} p-2 rounded-xl border border-outline-variant/30`}>
                  <span className={`w-6 h-6 flex items-center justify-center ${item.rankCls} font-bold rounded-full text-[10px]`}>{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="text-secondary font-bold text-[12px]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top RW */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              <h5 className="font-bold text-[18px]">Top 10 RW</h5>
            </div>
            <div className="space-y-3">
              {[
                { rank: '1', name: 'RW 06 Dago', sub: '48 KK Aktif', val: '2.4 ton', rankCls: 'bg-yellow-400 text-white' },
                { rank: '2', name: 'RW 02 Cigadung', sub: '42 KK Aktif', val: '2.1 ton', rankCls: 'bg-slate-300 text-on-surface' },
                { rank: '3', name: 'RW 04 Sekeloa', sub: '38 KK Aktif', val: '1.9 ton', rankCls: 'bg-amber-600 text-white' },
                { rank: '4', name: 'RW 01 Coblong', sub: '35 KK Aktif', val: '1.7 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '5', name: 'RW 03 Lebak Gede', sub: '31 KK Aktif', val: '1.5 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '6', name: 'RW 05 Sadang Serang', sub: '29 KK Aktif', val: '1.4 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '7', name: 'RW 03 Sekeloa', sub: '27 KK Aktif', val: '1.2 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '8', name: 'RW 01 Lebak Siliwangi', sub: '25 KK Aktif', val: '1.1 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '9', name: 'RW 02 Coblong', sub: '22 KK Aktif', val: '0.9 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '10', name: 'RW 04 Cigadung', sub: '20 KK Aktif', val: '0.8 ton', rankCls: 'bg-surface-variant text-on-surface' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'bg-white shadow-sm' : 'bg-white/60'} p-2 rounded-xl border border-outline-variant/30`}>
                  <span className={`w-6 h-6 flex items-center justify-center ${item.rankCls} font-bold rounded-full text-[10px]`}>{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="text-amber-700 font-bold text-[12px]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Kelurahan */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
              <h5 className="font-bold text-[18px]">Top 6 Kelurahan</h5>
            </div>
            <div className="space-y-3">
              {[
                { rank: '1', name: 'Kel. Dago', sub: 'Efisiensi 94%', val: '12.5 ton', rankCls: 'bg-yellow-400 text-white' },
                { rank: '2', name: 'Kel. Cigadung', sub: 'Efisiensi 89%', val: '9.2 ton', rankCls: 'bg-slate-300 text-on-surface' },
                { rank: '3', name: 'Kel. Sadang Serang', sub: 'Efisiensi 85%', val: '8.4 ton', rankCls: 'bg-amber-600 text-white' },
                { rank: '4', name: 'Kel. Sekeloa', sub: 'Efisiensi 82%', val: '7.8 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '5', name: 'Kel. Lebak Gede', sub: 'Efisiensi 79%', val: '6.5 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '6', name: 'Kel. Lebak Siliwangi', sub: 'Efisiensi 75%', val: '5.2 ton', rankCls: 'bg-surface-variant text-on-surface' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'bg-white shadow-sm' : 'bg-white/60'} p-2 rounded-xl border border-outline-variant/30`}>
                  <span className={`w-6 h-6 flex items-center justify-center ${item.rankCls} font-bold rounded-full text-[10px]`}>{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="text-indigo-700 font-bold text-[12px]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === Footer === */}
      <footer className="flex justify-between items-center pt-4 pb-4">
        <p className="text-[12px] text-on-surface-variant">© 2026 Pilah Sampah Cerdas. Sampah Terdata, Lingkungan Tertata.</p>
        <div className="flex gap-gutter">
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">Kebijakan Privasi</a>
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">Syarat & Ketentuan</a>
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">Bantuan</a>
        </div>
      </footer>

      {/* Compliance Modal */}
      {showComplianceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-bold text-[20px] text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Kepatuhan Partisipasi RT/RW
              </h3>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              <p className="text-xs text-on-surface-variant">
                Persentase rumah tangga yang aktif menyetorkan sampah dibanding total rumah tangga terdaftar pada masing-masing RW di wilayah Kecamatan Coblong.
              </p>
              <div className="space-y-3">
                {locations.map((loc) => (
                  <div key={loc.id} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">{loc.rw} ({loc.kelurahan})</h4>
                        <p className="text-[10px] text-on-surface-variant">{loc.rtCount} RT • {loc.titikCount} Titik Tong Sampah</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${loc.patuh >= 85 ? 'bg-green-100 text-green-700' : (loc.patuh >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                        }`}>
                        {loc.patuh}% Patuh
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${loc.patuh >= 85 ? 'bg-primary' : (loc.patuh >= 60 ? 'bg-yellow-500' : 'bg-red-500')
                          }`}
                        style={{ width: `${loc.patuh}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Bin Modal */}
      {selectedBinForDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-outline-variant animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-bold text-[18px] text-on-surface">Detail Tempat Sampah Cerdas</h3>
              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-outline-variant/60 shadow-inner flex flex-col items-center gap-2">
                  <img
                    className="w-40 h-40"
                    alt="QR Code"
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBinForDetail.qrCode || selectedBinForDetail.kode)}`}
                  />
                  <span className="text-[14px] font-mono font-bold text-primary tracking-widest">{selectedBinForDetail.qrCode || selectedBinForDetail.kode}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/20 text-sm">
                  <span className="text-on-surface-variant">Kategori Sampah</span>
                  <span className={`font-bold uppercase ${(selectedBinForDetail.category?.name || selectedBinForDetail.categoryId || '').toUpperCase().includes('ORGANIK') ? 'text-primary' : 'text-secondary'
                    }`}>
                    {selectedBinForDetail.category?.name || selectedBinForDetail.categoryId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/20 text-sm">
                  <span className="text-on-surface-variant">Wilayah (RT/RW)</span>
                  <span className="font-semibold text-on-surface">
                    {typeof selectedBinForDetail.rtRw === 'string' ? selectedBinForDetail.rtRw : (selectedBinForDetail.rtRw?.name || '-')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/20 text-sm">
                  <span className="text-on-surface-variant">Status Kapasitas</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${(selectedBinForDetail.kapasitas || (Number(selectedBinForDetail.currentVolumeLiter) / Number(selectedBinForDetail.maxCapacityLiter) * 100)) > 90
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                    }`}>
                    {selectedBinForDetail.currentVolumeLiter}L / {selectedBinForDetail.maxCapacityLiter}L ({
                      Math.round(selectedBinForDetail.kapasitas || (Number(selectedBinForDetail.currentVolumeLiter) / Number(selectedBinForDetail.maxCapacityLiter) * 100))
                    }%)
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-on-surface-variant">Poin Setoran</span>
                  <span className="font-bold text-yellow-600">
                    {selectedBinForDetail.category?.pointsPerKg || 100} Poin / Kg
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBinForDetail(null)}
                className="w-full py-3 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold text-on-surface transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

