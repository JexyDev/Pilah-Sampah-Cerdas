/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Clock,
  AlertTriangle,
  Timer,
  Save,
  RotateCcw,
  BellRing,
  Calendar,
  Sparkles,
  MapPin,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";

export interface RuleEngineConfig {
  reportingWindowMorningStart: string;
  reportingWindowMorningEnd: string;
  reportingWindowEveningStart: string;
  reportingWindowEveningEnd: string;
  wargaReminderNotificationEnabled: boolean;
  lateSubmissionDiscount: number;
  lateSubmissionPenaltyActive: boolean;
  attendanceMinDurationHours: number;
  attendanceMinDurationMinutes: number;
  attendanceMinDurationSeconds: number;
  attendanceOutOfZoneToleranceMinutes: number;
  kknTotalDays: number;
  kknStartDate: string;
  kknEndDate: string;
  kknAutoHolidayWeekends: boolean;
  kknHolidays: Array<{ date: string; description: string }>;
}

const DEFAULT_CONFIG: RuleEngineConfig = {
  reportingWindowMorningStart: "06:00",
  reportingWindowMorningEnd: "08:00",
  reportingWindowEveningStart: "16:00",
  reportingWindowEveningEnd: "18:00",
  wargaReminderNotificationEnabled: true,
  lateSubmissionDiscount: 0.5,
  lateSubmissionPenaltyActive: true,
  attendanceMinDurationHours: 4,
  attendanceMinDurationMinutes: 0,
  attendanceMinDurationSeconds: 0,
  attendanceOutOfZoneToleranceMinutes: 15,
  kknTotalDays: 50,
  kknStartDate: "2026-08-20",
  kknEndDate: "2026-10-20",
  kknAutoHolidayWeekends: true,
  kknHolidays: [
    { date: "2026-08-17", description: "HUT Kemerdekaan RI Ke-81" }
  ],
};

const MasterRuleEngine: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [config, setConfig] = useState<RuleEngineConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Holiday helper state
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayDesc, setNewHolidayDesc] = useState("");

  const handleAddHoliday = () => {
    if (!newHolidayDate) {
      showToast.error("Pilih tanggal hari libur terlebih dahulu");
      return;
    }
    const exists = (config.kknHolidays || []).some((h) => h.date === newHolidayDate);
    if (exists) {
      showToast.error("Tanggal libur ini sudah ada di daftar");
      return;
    }
    const updated = [
      ...(config.kknHolidays || []),
      { date: newHolidayDate, description: newHolidayDesc || "Hari Libur Khusus / Nasional" },
    ].sort((a, b) => a.date.localeCompare(b.date));

    handleChange("kknHolidays", updated);
    setNewHolidayDate("");
    setNewHolidayDesc("");
    showToast.success("Hari libur berhasil ditambahkan ke daftar");
  };

  const handleRemoveHoliday = (dateToRemove: string) => {
    const updated = (config.kknHolidays || []).filter((h) => h.date !== dateToRemove);
    handleChange("kknHolidays", updated);
    showToast.info("Hari libur dihapus dari daftar");
  };

  const handleMarkTodayHoliday = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const exists = (config.kknHolidays || []).some((h) => h.date === todayStr);
    if (exists) {
      showToast.info("Hari ini sudah tercatat sebagai hari libur");
      return;
    }
    const updated = [
      ...(config.kknHolidays || []),
      { date: todayStr, description: "Dispensasi Libur Massal (Developer)" },
    ].sort((a, b) => a.date.localeCompare(b.date));

    handleChange("kknHolidays", updated);
    showToast.success("Hari ini berhasil ditandai sebagai Hari Libur Massal");
  };

  const fetchRuleEngine = async () => {
    try {
      setLoading(true);
      const res = await api.get("/configs/rule-engine");
      if (res.data?.success && res.data?.data) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...res.data.data,
        });
      }
    } catch (err: any) {
      console.error("Gagal mengambil data Rule Engine:", err);
      showToast.error("Gagal memuat aturan sistem dari server.");
    } finally {
      setLoading(false);
      setHasChanges(false);
    }
  };

  useEffect(() => {
    fetchRuleEngine();
  }, []);

  const handleChange = (key: keyof RuleEngineConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.post("/configs/rule-engine", config);
      if (res.data?.success) {
        showToast.success("Seluruh aturan Rule Engine berhasil diperbarui dan diselaraskan!");
        if (res.data.data) {
          setConfig({
            ...DEFAULT_CONFIG,
            ...res.data.data,
          });
        }
        setHasChanges(false);
      } else {
        showToast.error(res.data?.message || "Gagal memperbarui aturan.");
      }
    } catch (err: any) {
      console.error("Gagal menyimpan Rule Engine:", err);
      showToast.error("Terjadi kesalahan saat menyimpan aturan.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
    showToast.info("Formulir direset ke pengaturan standar awal.");
  };

  // Live simulation point calculation
  const basePoints = 100;
  const penalizedPoints = config.lateSubmissionPenaltyActive
    ? Math.round(basePoints * config.lateSubmissionDiscount)
    : basePoints;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#e5f7ed] text-[#009966] flex items-center justify-center shrink-0 border border-[#009966]/20 shadow-2xs">
            <Sliders size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Rule Engine
              </h1>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Master Data
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
              Kelola parameter jadwal pemilahan warga, bobot penalti poin keterlambatan, dan durasi minimal presensi mahasiswa KKN secara terstruktur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={handleReset}
            disabled={loading || saving}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={15} />
            <span>Reset Default</span>
          </button>

          <button
            onClick={handleSave}
            disabled={loading || saving || !hasChanges}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
              hasChanges
                ? "bg-[#009966] hover:bg-[#008855] text-white shadow-emerald-700/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Save size={16} />
            <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </div>

      {/* Top 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#009966] flex items-center justify-center shrink-0 border border-emerald-200/60">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">Jadwal Pemilahan Warga</span>
            <span className="text-xs font-black text-slate-800">
              {config.reportingWindowMorningStart}-{config.reportingWindowMorningEnd} & {config.reportingWindowEveningStart}-{config.reportingWindowEveningEnd} WIB
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">Multiplier Penalti Poin</span>
            <span className="text-xs font-black text-slate-800">
              {config.lateSubmissionPenaltyActive ? `${Math.round(config.lateSubmissionDiscount * 100)}% (${config.lateSubmissionDiscount}x)` : "Non-Aktif (100%)"}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
            <Timer size={22} />
          </div>
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">Waktu Minimal Presensi KKN</span>
            <span className="text-xs font-black text-slate-800">
              {String(config.attendanceMinDurationHours).padStart(2, "0")}J : {String(config.attendanceMinDurationMinutes).padStart(2, "0")}M : {String(config.attendanceMinDurationSeconds).padStart(2, "0")}D
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#009966] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-extrabold text-slate-500">Memuat konfigurasi Rule Engine dari server...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ========================================== */}
          {/* RULE 1: JADWAL PEMILAHAN SAMPAH WARGA */}
          {/* ========================================== */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#009966] flex items-center justify-center border border-emerald-200/60 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">1. Jadwal Pemilahan Sampah Warga</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Pengaturan Jendela Pemilahan Mobile Pagi & Sore</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                  Warga Mobile
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Atur jendela waktu pagi dan sore bagi Warga untuk menyetor sampah hasil pemilahan. Jendela ini menjadi acuan notifikasi pengingat otomatis di aplikasi mobile Warga.
              </p>

              {/* Grid 2 Sesi Pagi & Sore */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Sesi Pagi */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#009966]" /> Sesi Pagi
                    </span>
                    <span className="text-[10.5px] font-black text-[#009966] bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {config.reportingWindowMorningStart} - {config.reportingWindowMorningEnd} WIB
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        Jam Mulai
                      </label>
                      <input
                        type="time"
                        value={config.reportingWindowMorningStart}
                        onChange={(e) => handleChange("reportingWindowMorningStart", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        value={config.reportingWindowMorningEnd}
                        onChange={(e) => handleChange("reportingWindowMorningEnd", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sesi Sore */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#009966]" /> Sesi Sore
                    </span>
                    <span className="text-[10.5px] font-black text-[#009966] bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {config.reportingWindowEveningStart} - {config.reportingWindowEveningEnd} WIB
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        Jam Mulai
                      </label>
                      <input
                        type="time"
                        value={config.reportingWindowEveningStart}
                        onChange={(e) => handleChange("reportingWindowEveningStart", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        value={config.reportingWindowEveningEnd}
                        onChange={(e) => handleChange("reportingWindowEveningEnd", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sakelar Notifikasi Remind Mobile */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#009966] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <BellRing size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Notifikasi Pengingat Mobile Warga</span>
                    <span className="text-[11px] text-slate-500 font-medium">Kirim notifikasi pengingat otomatis ke HP Warga sebelum sesi pemilahan</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.wargaReminderNotificationEnabled}
                    onChange={(e) => handleChange("wargaReminderNotificationEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#009966]" />
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-bold">
              <CheckCircle2 size={14} className="text-[#009966]" />
              <span>Terintegrasi dengan sistem Notifikasi & Mobile API</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* RULE 2: PENGURANGAN POIN KETIDAKDISIPLINAN */}
          {/* ========================================== */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">2. Pengurangan Poin Ketidakdisiplinan</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Bobot Penalti Pemilahan di Luar Jam Sesi</p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                  Disiplin Poin
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Warga yang menyetor di luar jendela jam yang ditentukan tetap diizinkan menyetor, namun perolehan poinnya dipotong sesuai faktor penalti.
              </p>

              {/* Toggle Penalti & Multiplier Slider */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Status Penalti Keterlambatan</span>
                    <span className="text-[11px] text-slate-500 font-medium">Aktifkan pemotongan poin jika terlambat menyetor</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.lateSubmissionPenaltyActive}
                      onChange={(e) => handleChange("lateSubmissionPenaltyActive", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#009966]" />
                  </label>
                </div>

                <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      Faktor Multiplier Poin Terlambat
                    </span>
                    <span className="text-sm font-black text-amber-800 bg-amber-100 px-3 py-0.5 rounded-lg border border-amber-300">
                      {Math.round(config.lateSubmissionDiscount * 100)}% ({config.lateSubmissionDiscount}x)
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={config.lateSubmissionDiscount}
                    onChange={(e) => handleChange("lateSubmissionDiscount", parseFloat(e.target.value))}
                    className="w-full accent-[#009966] cursor-pointer"
                  />

                  <div className="flex justify-between text-[10.5px] font-bold text-slate-400">
                    <span>10% (Penalti Berat)</span>
                    <span>50% (Standar 1/2 Poin)</span>
                    <span>100% (Tanpa Penalti)</span>
                  </div>
                </div>
              </div>

              {/* Formula & Live Simulation Box */}
              <div className="bg-[#f0faf4] p-4.5 rounded-2xl border border-[#009966]/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#009966]">
                  <Sparkles size={16} />
                  <span>Simulasi Perhitungan Poin Warga</span>
                </div>
                <div className="text-xs font-medium text-slate-700 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Setoran Sampah Tepat Waktu:</span>
                    <span className="font-extrabold text-emerald-700">+{basePoints} Poin (100%)</span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-200/60 pt-1.5">
                    <span>Setoran Terlambat (Di Luar Jendela):</span>
                    <span className="font-extrabold text-amber-700">
                      +{penalizedPoints} Poin ({config.lateSubmissionPenaltyActive ? `${Math.round(config.lateSubmissionDiscount * 100)}%` : "Tanpa Penalti"})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-bold">
              <ShieldCheck size={14} className="text-amber-600" />
              <span>Otomatis mengkalkulasi poin saat transaksi QR discan</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* RULE 3: WAKTU MINIMAL DI LOKASI ABSEN KKN (FULL WIDTH BOTTOM) */}
          {/* ========================================== */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">3. Waktu Minimal di Lokasi Absen</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Aturan Presensi Geofence Mahasiswa di Posko / Wilayah RW</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                Presensi KKN
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Atur durasi minimal (Jam, Menit, Detik) yang wajib dipenuhi Mahasiswa KKN di lokasi presensi geofence agar status absensinya dinyatakan sah dan valid oleh sistem.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Input Jam, Menit, Detik */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer size={16} className="text-blue-600" /> Durasi Minimal Presensi Mahasiswa
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Jam
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={config.attendanceMinDurationHours}
                      onChange={(e) => handleChange("attendanceMinDurationHours", parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Menit
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={config.attendanceMinDurationMinutes}
                      onChange={(e) => handleChange("attendanceMinDurationMinutes", parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Detik
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={config.attendanceMinDurationSeconds}
                      onChange={(e) => handleChange("attendanceMinDurationSeconds", parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-500 text-center"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-center space-y-1">
                  <div className="text-xs font-black text-blue-900">
                    Target Minimal Harian: {String(config.attendanceMinDurationHours).padStart(2, "0")} Jam : {String(config.attendanceMinDurationMinutes).padStart(2, "0")} Menit : {String(config.attendanceMinDurationSeconds).padStart(2, "0")} Detik
                  </div>
                  <div className="text-[11px] font-bold text-blue-700">
                    Akumulasi Total: {(config.kknTotalDays || 50)} Hari × {(config.attendanceMinDurationHours || 4)} Jam/Hari = <span className="underline font-black">{(config.kknTotalDays || 50) * (config.attendanceMinDurationHours || 4)} Jam Target KKN</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Input Toleransi Keluar Zona */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <MapPin size={16} className="text-blue-600" /> Toleransi Keluar Zona Geofence
                    </label>
                    <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                      {config.attendanceOutOfZoneToleranceMinutes} Menit
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={config.attendanceOutOfZoneToleranceMinutes}
                    onChange={(e) => handleChange("attendanceOutOfZoneToleranceMinutes", parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Batas waktu toleransi jika Mahasiswa secara tidak sengaja keluar dari zona lokasi sementara (posko/RW) tanpa menghentikan akumulasi durasi presensi.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                  <Info size={14} className="text-blue-600 shrink-0" />
                  <span>Geofence menghitung lokasi secara otomatis sejak mahasiswa pertama kali check-in</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* RULE 4: KALENDER KKN & PENGATURAN HARI LIBUR ABSENSI (FULL WIDTH) */}
          {/* ========================================== */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">4. Kalender Periode KKN &amp; Hari Libur Absensi</h2>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Kontrol Periode Aktif KKN &amp; Pengecualian Hari Libur Nasional / Weekend dari Perhitungan Alfa
                  </p>
                </div>
              </div>
              <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                Kalender &amp; Libur
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Atur tanggal resmi mulai dan berakhirnya KKN serta daftar hari libur. Mahasiswa <strong>TIDAK AKAN</strong> dikenakan Alfa sebelum tanggal mulai KKN atau pada hari libur yang terdaftar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Periode Tanggal KKN & Toggle Weekend */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={16} className="text-emerald-700" /> Rentang Tanggal Resmi KKN
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Tanggal Mulai KKN
                    </label>
                    <input
                      type="date"
                      value={config.kknStartDate || "2026-08-20"}
                      onChange={(e) => handleChange("kknStartDate", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Tanggal Selesai KKN
                    </label>
                    <input
                      type="date"
                      value={config.kknEndDate || "2026-10-20"}
                      onChange={(e) => handleChange("kknEndDate", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966]"
                    />
                  </div>
                </div>

                {/* Weekend Auto-Holiday Toggle */}
                <div className="pt-2 border-t border-slate-200/60">
                  <label className="flex items-center justify-between cursor-pointer p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Libur Otomatis Akhir Pekan (Sabtu &amp; Minggu)</span>
                      <span className="text-[10.5px] text-slate-500 font-medium">Sabtu &amp; Minggu tidak dihitung kewajiban presensi mahasiswa</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.kknAutoHolidayWeekends}
                      onChange={(e) => handleChange("kknAutoHolidayWeekends", e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                    />
                  </label>
                </div>

                {/* Quick Action: Mark Today as Holiday */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleMarkTodayHoliday}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Calendar size={14} className="text-emerald-700" />
                    <span>Tandai Hari Ini ({new Date().toISOString().slice(0, 10)}) Sebagai Libur Massal</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Daftar Hari Libur Khusus / Nasional */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={16} className="text-emerald-700" /> Daftar Hari Libur Khusus &amp; Nasional
                    </span>
                    <span className="text-xs font-black text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded-md">
                      {(config.kknHolidays || []).length} Hari Libur
                    </span>
                  </div>

                  {/* Add New Holiday Form */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10.5px] font-black text-slate-700 block">Tambah Tanggal Libur Baru:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newHolidayDate}
                        onChange={(e) => setNewHolidayDate(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966]"
                      />
                      <input
                        type="text"
                        placeholder="Keterangan (misal: HUT RI)"
                        value={newHolidayDesc}
                        onChange={(e) => setNewHolidayDesc(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#009966]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddHoliday}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus size={14} /> <span>Tambah ke Daftar Libur</span>
                    </button>
                  </div>

                  {/* Holiday Items List */}
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {(config.kknHolidays || []).map((h) => (
                      <div
                        key={h.date}
                        className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 text-xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            {h.date}
                          </span>
                          <span className="font-bold text-slate-700">{h.description}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHoliday(h.date)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus hari libur"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    {(config.kknHolidays || []).length === 0 && (
                      <p className="text-center py-4 text-xs text-slate-400 italic">
                        Belum ada tanggal libur khusus yang didaftarkan.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                  <ShieldCheck size={14} className="text-purple-600 shrink-0" />
                  <span>Jadwal pada hari libur tidak akan memotong persentase presensi mahasiswa KKN</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default MasterRuleEngine;
