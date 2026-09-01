/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import {
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
  Bot,
  BookOpen,
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
  attendanceOutOfZonePenaltyPoints: number;
  attendanceOutOfZonePenaltyActive: boolean;
  kknTotalDays: number;
  kknStartDate: string;
  kknEndDate: string;
  kknAutoHolidayWeekends: boolean;
  kknHolidays: Array<{ date: string; description: string }>;
  logbookTargetKegiatan: number;
  logbookBackdateToleranceDays: number;
  logbookBobotPersen: number;
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
  attendanceOutOfZoneToleranceMinutes: 5,
  attendanceOutOfZonePenaltyPoints: 10,
  attendanceOutOfZonePenaltyActive: true,
  kknTotalDays: 50,
  kknStartDate: "2026-08-20",
  kknEndDate: "2026-10-20",
  kknAutoHolidayWeekends: true,
  kknHolidays: [
    { date: "2026-08-17", description: "HUT Kemerdekaan RI Ke-81" }
  ],
  logbookTargetKegiatan: 24,
  logbookBackdateToleranceDays: 1,
  logbookBobotPersen: 20,
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
      {/* 1. Header Navigation & Title (Matching Hasil Klasifikasi style) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#009966] flex items-center justify-center shrink-0 shadow-2xs">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              Peraturan
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola data peraturan terintegrasi secara real-time dengan backend.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={handleReset}
            disabled={loading || saving}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RotateCcw size={15} />
            <span>Reset Standar</span>
          </button>

          <button
            onClick={handleSave}
            disabled={loading || saving || !hasChanges}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 ${
              hasChanges
                ? "bg-[#009966] hover:bg-[#008855] text-white shadow-emerald-700/20"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
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
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#009966] flex items-center justify-center shrink-0 border border-emerald-200/60">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">Jadwal Pemilahan Warga</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              {config.reportingWindowMorningStart}-{config.reportingWindowMorningEnd} & {config.reportingWindowEveningStart}-{config.reportingWindowEveningEnd}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">Faktor Pengali Penalti Poin</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              {config.lateSubmissionPenaltyActive ? `${Math.round(config.lateSubmissionDiscount * 100)}% (${config.lateSubmissionDiscount}x)` : "Nonaktif (100%)"}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
            <Timer size={22} />
          </div>
          <div>
            <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">Waktu Minimal Presensi KKN</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              {String(config.attendanceMinDurationHours).padStart(2, "0")}J : {String(config.attendanceMinDurationMinutes).padStart(2, "0")}M : {String(config.attendanceMinDurationSeconds).padStart(2, "0")}D
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#009966] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-extrabold text-slate-500">Memuat data konfigurasi peraturan dari server VPS...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ========================================== */}
          {/* RULE 1: JADWAL PEMILAHAN SAMPAH WARGA */}
          {/* ========================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#009966] flex items-center justify-center border border-emerald-200/60 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Jadwal Pemilahan Sampah Warga</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Pengaturan Jadwal Sesi Pemilahan Pagi & Sore</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                  Aplikasi Seluler
                </span>
              </div>

              {/* Sesi Pemilahan: Sesi Pagi (Atas) & Sesi Sore (Bawah) */}
              <div className="space-y-3">
                {/* Sesi Pagi */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-[#009966] flex items-center justify-center shrink-0 border border-emerald-200/30">
                        <Calendar size={14} />
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Sesi Pagi</span>
                    </div>
                    <span className="text-[10.5px] font-black text-[#009966] bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {config.reportingWindowMorningStart} - {config.reportingWindowMorningEnd}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Mulai</span>
                      <input
                        type="time"
                        value={config.reportingWindowMorningStart}
                        onChange={(e) => handleChange("reportingWindowMorningStart", e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none p-0"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Selesai</span>
                      <input
                        type="time"
                        value={config.reportingWindowMorningEnd}
                        onChange={(e) => handleChange("reportingWindowMorningEnd", e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none p-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Sesi Sore */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-[#009966] flex items-center justify-center shrink-0 border border-emerald-200/30">
                        <Calendar size={14} />
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Sesi Sore</span>
                    </div>
                    <span className="text-[10.5px] font-black text-[#009966] bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {config.reportingWindowEveningStart} - {config.reportingWindowEveningEnd}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Mulai</span>
                      <input
                        type="time"
                        value={config.reportingWindowEveningStart}
                        onChange={(e) => handleChange("reportingWindowEveningStart", e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none p-0"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Selesai</span>
                      <input
                        type="time"
                        value={config.reportingWindowEveningEnd}
                        onChange={(e) => handleChange("reportingWindowEveningEnd", e.target.value)}
                        className="w-full bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none p-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sakelar Notifikasi Remind Mobile */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#009966] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <BellRing size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Notifikasi Pengingat Seluler Warga</span>
                    <span className="text-[11px] text-slate-500 font-medium">Kirim notifikasi pengingat otomatis ke handphone warga sebelum sesi pemilahan</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.wargaReminderNotificationEnabled}
                    onChange={(e) => handleChange("wargaReminderNotificationEnabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#009966]" />
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 font-bold">
              <CheckCircle2 size={14} className="text-[#009966]" />
              <span>Terintegrasi dengan sistem Notifikasi & Mobile API</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* RULE 2: PENGURANGAN POIN KETIDAKDISIPLINAN */}
          {/* ========================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Pengurangan Poin Ketidakdisiplinan</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Bobot Penalti Pemilahan di Luar Jam Sesi</p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                  Disiplin Poin
                </span>
              </div>

              {/* Toggle Penalti & Multiplier Slider */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">Status Penalti Keterlambatan</span>
                    <span className="text-[11px] text-slate-500 font-medium">Aktifkan pemotongan poin jika terlambat menyetor</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.lateSubmissionPenaltyActive}
                      onChange={(e) => handleChange("lateSubmissionPenaltyActive", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#009966]" />
                  </label>
                </div>

                <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                      Faktor Multiplier Poin Terlambat
                    </span>
                    <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
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

                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>10% (Penalti Berat)</span>
                    <span>50% (Standar 1/2 Poin)</span>
                    <span>100% (Tanpa Penalti)</span>
                  </div>
                </div>
              </div>

              {/* Formula & Live Simulation Box */}
              <div className="bg-[#f0faf4] p-3.5 rounded-2xl border border-[#009966]/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#009966]">
                  <Sparkles size={15} />
                  <span>Simulasi Perhitungan Poin Warga</span>
                </div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Setoran Sampah Tepat Waktu:</span>
                    <span className="font-extrabold text-emerald-700">+{basePoints} Poin (100%)</span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-200/60 pt-1">
                    <span>Setoran Terlambat (Di Luar Jadwal Sesi):</span>
                    <span className="font-extrabold text-amber-700">
                      +{penalizedPoints} Poin ({config.lateSubmissionPenaltyActive ? `${Math.round(config.lateSubmissionDiscount * 100)}%` : "Tanpa Penalti"})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 font-bold">
              <ShieldCheck size={14} className="text-amber-600" />
              <span>Otomatis mengkalkulasi poin saat transaksi QR discan</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* RULE 3: WAKTU MINIMAL DI LOKASI ABSEN KKN */}
          {/* ========================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Waktu Minimal di Lokasi Absen</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Aturan Presensi Geofence Mahasiswa KKN</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                  Presensi KKN
                </span>
              </div>

              <div className="space-y-4">
                {/* Input Jam, Menit, Detik */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer size={16} className="text-blue-600" /> Target Durasi Minimal Harian
                  </span>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Jam</label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={config.attendanceMinDurationHours}
                        onChange={(e) => handleChange("attendanceMinDurationHours", parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Menit</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={config.attendanceMinDurationMinutes}
                        onChange={(e) => handleChange("attendanceMinDurationMinutes", parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Detik</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={config.attendanceMinDurationSeconds}
                        onChange={(e) => handleChange("attendanceMinDurationSeconds", parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Input Toleransi & Penalti Keluar Zona */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <MapPin size={16} className="text-blue-600" /> Toleransi Keluar Zona Geofence
                    </label>
                    <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      {config.attendanceOutOfZoneToleranceMinutes} Menit
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={config.attendanceOutOfZoneToleranceMinutes}
                    onChange={(e) => handleChange("attendanceOutOfZoneToleranceMinutes", parseInt(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />

                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Sanksi Keluar Zona</span>
                        <span className="text-[10.5px] text-slate-500 font-medium">Potong poin jika keluar zona &gt; toleransi</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={config.attendanceOutOfZonePenaltyActive}
                          onChange={(e) => handleChange("attendanceOutOfZonePenaltyActive", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>

                    {config.attendanceOutOfZonePenaltyActive && (
                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Besar Potongan Poin:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={config.attendanceOutOfZonePenaltyPoints}
                            onChange={(e) => handleChange("attendanceOutOfZonePenaltyPoints", parseInt(e.target.value) || 0)}
                            className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-black text-rose-600 dark:text-rose-400 text-center focus:outline-none focus:border-rose-500"
                          />
                          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">PTS / Insiden</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 font-bold">
              <Info size={14} className="text-blue-600 shrink-0" />
              <span>Waktu di-freeze saat keluar zona dan di-resume saat masuk kembali</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* RULE 4: KALENDER KKN & HARI LIBUR ABSENSI */}
          {/* ========================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Kalender Periode KKN &amp; Hari Libur</h2>
                    <p className="text-[11px] font-semibold text-slate-500">Periode Aktif KKN &amp; Pengecualian Alfa</p>
                  </div>
                </div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                  Kalender &amp; Libur
                </span>
              </div>

              <div className="space-y-4">
                {/* Tanggal KKN & Toggle Weekend */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Mulai KKN</label>
                      <input
                        type="date"
                        value={config.kknStartDate || "2026-08-20"}
                        onChange={(e) => handleChange("kknStartDate", e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Selesai KKN</label>
                      <input
                        type="date"
                        value={config.kknEndDate || "2026-10-20"}
                        onChange={(e) => handleChange("kknEndDate", e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center justify-between cursor-pointer p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">Libur Akhir Pekan (Sabtu &amp; Minggu)</span>
                    <input
                      type="checkbox"
                      checked={config.kknAutoHolidayWeekends}
                      onChange={(e) => handleChange("kknAutoHolidayWeekends", e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                    />
                  </label>
                </div>

                {/* Form Tambah & Daftar Libur */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Daftar Hari Libur</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 bg-slate-200/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                      {(config.kknHolidays || []).length} Libur
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newHolidayDate}
                        onChange={(e) => setNewHolidayDate(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966]"
                      />
                      <input
                        type="text"
                        placeholder="Ket: HUT RI"
                        value={newHolidayDesc}
                        onChange={(e) => setNewHolidayDesc(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddHoliday}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus size={14} /> <span>Tambah Libur</span>
                    </button>
                  </div>

                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {(config.kknHolidays || []).map((h) => (
                      <div
                        key={h.date}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10.5px]">
                            {h.date}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{h.description}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHoliday(h.date)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 font-bold">
              <ShieldCheck size={14} className="text-[#009966] shrink-0" />
              <span>Jadwal pada hari libur tidak akan memotong persentase presensi mahasiswa KKN</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* RULE 5: STANDAR LOGBOOK & PRASYARAT NILAI DPL */}
          {/* ========================================== */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60 shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Standar Logbook KKN &amp; Prasyarat Nilai Akademik DPL</h2>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Konfigurasi Target Kelulusan Aktivitas, Toleransi Backdate (H-X), dan Bobot Penilaian DPL
                  </p>
                </div>
              </div>
              <span className="bg-teal-100 text-teal-800 border border-teal-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0">
                Logbook &amp; Prasyarat Nilai
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Target Aktivitas Logbook */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                    Target Aktivitas Logbook
                  </label>
                  <span className="text-xs font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                    {config.logbookTargetKegiatan} Aktivitas
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.logbookTargetKegiatan}
                  onChange={(e) => handleChange("logbookTargetKegiatan", parseInt(e.target.value) || 24)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 text-center"
                />
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Jumlah minimal aktivitas logbook terverifikasi DPL (rerata {Math.ceil((config.logbookTargetKegiatan || 24) / 4)} aktivitas/pekan selama 4 pekan).
                </p>
              </div>

              {/* Toleransi Input Backdate */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                    Toleransi Backdate (H-X)
                  </label>
                  <span className="text-xs font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                    H-{config.logbookBackdateToleranceDays} Hari
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={config.logbookBackdateToleranceDays}
                  onChange={(e) => handleChange("logbookBackdateToleranceDays", parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 text-center"
                />
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Batas waktu mundur pengisian tanggal kegiatan logbook mahasiswa dari hari ini (0 = hanya hari ini).
                </p>
              </div>

              {/* Bobot Nilai Logbook DPL */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                    Bobot Penilaian DPL
                  </label>
                  <span className="text-xs font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                    {config.logbookBobotPersen}% DPL
                  </span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={config.logbookBobotPersen}
                  onChange={(e) => handleChange("logbookBobotPersen", parseInt(e.target.value) || 20)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 text-center"
                />
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Persentase bobot aspek Logbook dalam penilaian akademik DPL ({config.logbookBobotPersen}% DPL = {((config.logbookBobotPersen * 0.3)).toFixed(1)} poin Nilai Akhir KKN).
                </p>
              </div>
            </div>

            <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 flex items-center justify-between text-xs font-medium text-teal-900 dark:text-teal-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-700 shrink-0" />
                <span>
                  Perubahan konfigurasi ini otomatis berlaku secara real-time pada kalkulasi Kepatuhan Logbook &amp; Form Penilaian Mahasiswa KKN.
                </span>
              </div>
              <span className="font-mono font-bold text-[11px] bg-white dark:bg-slate-900 px-2 py-1 rounded border border-teal-300 dark:border-teal-700 shrink-0">
                Formula: (Disetujui / {config.logbookTargetKegiatan}) × 100
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterRuleEngine;
