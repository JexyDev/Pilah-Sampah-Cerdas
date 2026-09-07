/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile Home View for Mahasiswa KKN (iOS Safari Optimized)
 */

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Calendar,
  Target,
  PlusCircle,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../utils/api";
import { logbookApiService, type LogbookMahasiswaItem } from "../../services/logbookService";
import { safeFormatDateShort } from "../../utils/safeDateUtils";

interface MahasiswaMobileHomeProps {
  onNavigateTab: (tab: "beranda" | "presensi" | "logbook" | "proker" | "profil") => void;
  onOpenLogbookModal: () => void;
  refreshTrigger?: number;
}

export const MahasiswaMobileHome: React.FC<MahasiswaMobileHomeProps> = ({
  onNavigateTab,
  onOpenLogbookModal,
  refreshTrigger,
}) => {
  const { user } = useAuthStore();

  const [recentLogbooks, setRecentLogbooks] = useState<LogbookMahasiswaItem[]>([]);
  const [activeAttendance, setActiveAttendance] = useState<any | null>(null);
  const [todayAttendanceState, setTodayAttendanceState] = useState<{
    status: "SELESAI" | "AKTIF" | "TERJEDA" | "BELUM_ABSEN";
    label: string;
    description: string;
    actionText: string;
  }>({
    status: "BELUM_ABSEN",
    label: "Belum Absen",
    description: "Kamera iPhone & GPS Otomatis",
    actionText: "Lakukan Presensi Mandiri Sekarang",
  });
  const [stats, setStats] = useState({
    totalLogbooks: 0,
    approvedLogbooks: 0,
    totalProker: 0,
    totalAttendedDays: 0,
  });
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const [logbooks, presensiRes, prokerRes, kegiatanRes, timesheetRes] = await Promise.allSettled([
        logbookApiService.getMahasiswaLogbooks(),
        api.get("/presensi/mandiri/saya"),
        api.get("/kkn/program-kerja"),
        api.get("/kkn/kegiatan-aktif"),
        api.get("/timesheet/summary"),
      ]);

      let logsList: LogbookMahasiswaItem[] = [];
      if (logbooks.status === "fulfilled") {
        logsList = logbooks.value || [];
        setRecentLogbooks(logsList.slice(0, 3));
      }

      let presensiList: any[] = [];
      if (presensiRes.status === "fulfilled") {
        const presensiData = presensiRes.value.data?.data;
        presensiList = Array.isArray(presensiData)
          ? presensiData
          : Array.isArray(presensiData?.items)
          ? presensiData.items
          : [];
      }

      // Check kegiatan aktif resmi hari ini
      let primaryKegiatan: any = null;
      if (kegiatanRes.status === "fulfilled") {
        const kegiatanData = kegiatanRes.value.data?.data;
        if (Array.isArray(kegiatanData) && kegiatanData.length > 0) {
          primaryKegiatan = kegiatanData[0];
        }
      }

      // Check timesheet summary untuk kalkulasi sesi hadir akurat
      let tsSummary: any = null;
      if (timesheetRes.status === "fulfilled") {
        const tsData = timesheetRes.value.data?.data;
        tsSummary = Array.isArray(tsData) ? tsData[0] : (tsData?.students?.[0] || tsData);
      }

      // Hitung sesi hadir yang valid/memenuhi target
      let attendedCount = 0;
      if (tsSummary && typeof tsSummary.fulfilledTargetDays === "number" && tsSummary.fulfilledTargetDays > 0) {
        attendedCount = tsSummary.fulfilledTargetDays;
      } else if (tsSummary && typeof tsSummary.totalDaysAttended === "number" && tsSummary.totalDaysAttended > 0) {
        attendedCount = tsSummary.totalDaysAttended;
      } else {
        const fulfilledFromList = presensiList.filter(
          (p: any) =>
            p.status === "HADIR_MEMENUHI" ||
            p.statusPresensi === "HADIR_MEMENUHI" ||
            (typeof p.durasiMenit === "number" && p.durasiMenit >= 240)
        ).length;
        attendedCount = fulfilledFromList > 0 ? fulfilledFromList : presensiList.length;
      }

      // Cek apakah ada sesi yang SEDANG AKTIF
      const active = presensiList.find(
        (p: any) =>
          p.status === "AKTIF" ||
          p.statusPresensi === "AKTIF" ||
          (!p.checkOutAt && !p.jamPulang && (p.status === "BERLANGSUNG" || p.status === "DI_ZONA"))
      );
      setActiveAttendance(active || null);

      // Cek apakah hari ini SUDAH SELESAI ABSEN
      const isKegiatanCompleted =
        primaryKegiatan?.statusKehadiran === "HADIR_MEMENUHI" ||
        primaryKegiatan?.statusKehadiran === "HADIR" ||
        primaryKegiatan?.statusKehadiran === "SELESAI" ||
        primaryKegiatan?.statusKehadiran === "HADIR_TIDAK_MEMENUHI" ||
        Boolean(primaryKegiatan?.checkOutAt);

      const todayDateStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const todayHistoryItem = presensiList.find((p: any) => {
        const rawDate = p.checkInAt || p.waktuCheckin || p.jamMasuk || p.waktuAbsen;
        if (!rawDate) return false;
        const itemWib = new Date(new Date(rawDate).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        return itemWib === todayDateStr && (
          Boolean(p.checkOutAt) ||
          Boolean(p.waktuCheckout) ||
          Boolean(p.jamPulang) ||
          p.status === "HADIR_MEMENUHI" ||
          p.status === "SELESAI" ||
          p.status === "HADIR"
        );
      });

      if (isKegiatanCompleted || todayHistoryItem) {
        const durasi = primaryKegiatan?.actualInZoneMinutes || todayHistoryItem?.durasiMenit || 0;
        const isMemenuhi =
          primaryKegiatan?.statusKehadiran === "HADIR_MEMENUHI" ||
          todayHistoryItem?.status === "HADIR_MEMENUHI" ||
          durasi >= 240;
        setTodayAttendanceState({
          status: "SELESAI",
          label: isMemenuhi ? "Hadir & Memenuhi" : "Presensi Selesai",
          description: `Total ${durasi} Menit${isMemenuhi ? " • Memenuhi Target" : ""}`,
          actionText: "Presensi Hari Ini Selesai • Lihat Detail",
        });
      } else if (
        primaryKegiatan?.statusKehadiran === "BERLANGSUNG" ||
        primaryKegiatan?.statusKehadiran === "DI_ZONA" ||
        active
      ) {
        setTodayAttendanceState({
          status: "AKTIF",
          label: "Sedang Aktif",
          description: "Kamera iPhone & GPS Otomatis",
          actionText: "Lihat Sesi Presensi / Check-Out",
        });
      } else if (primaryKegiatan?.statusKehadiran === "TERJEDA") {
        setTodayAttendanceState({
          status: "TERJEDA",
          label: "Terjeda",
          description: "Sesi Di Luar Posko / GPS Terputus",
          actionText: "Lanjutkan Presensi Lapangan",
        });
      } else {
        setTodayAttendanceState({
          status: "BELUM_ABSEN",
          label: "Belum Absen",
          description: "Kamera iPhone & GPS Otomatis",
          actionText: "Lakukan Presensi Mandiri Sekarang",
        });
      }

      let prokerCount = 0;
      if (prokerRes.status === "fulfilled") {
        const prokerList = prokerRes.value.data?.data || [];
        prokerCount = Array.isArray(prokerList) ? prokerList.length : 0;
      }

      setStats({
        totalLogbooks: logsList.length,
        approvedLogbooks: logsList.filter((l) => l.statusApproval === "DISETUJUI_DPL").length,
        totalProker: prokerCount,
        totalAttendedDays: attendedCount,
      });
    } catch (err) {
      console.error("Gagal memuat data dashboard mobile", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Identity Greeting Banner */}
      <div className="bg-gradient-to-br from-[#035941] via-[#024633] to-[#013325] text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Glow orb background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-emerald-200 border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#58A621] animate-pulse" />
              Mahasiswa KKN Terdaftar
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-200/80">
              {new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>

          <div className="space-y-0.5">
            <h2 className="text-xl font-black tracking-tight text-white">
              Halo, {user?.name?.split(" ")[0] || "Mahasiswa"} 👋
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium">
              {user?.wilayah || user?.kelurahan || "Wilayah Dampingan"} • Posko KKN
            </p>
          </div>

          {/* Quick Group & DPL Info */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-200/90 font-medium">
            <span>📚 Program KKN Berdampak</span>
            <span className="font-bold text-white">UNIKOM 2026</span>
          </div>
        </div>
      </div>

      {/* 2. Today's Attendance Highlight Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                todayAttendanceState.status === "SELESAI" || todayAttendanceState.status === "AKTIF"
                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                  : todayAttendanceState.status === "TERJEDA"
                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Status Presensi Hari Ini</p>
              <p className="text-[10px] text-slate-400">Verifikasi GPS Geofencing</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              todayAttendanceState.status === "SELESAI"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : todayAttendanceState.status === "AKTIF"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse"
                : todayAttendanceState.status === "TERJEDA"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {todayAttendanceState.label}
          </span>
        </div>

        <button
          onClick={() => onNavigateTab("presensi")}
          className="w-full py-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between px-4 transition cursor-pointer group"
        >
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
              {todayAttendanceState.actionText}
            </p>
            <p className="text-[10px] text-slate-400">{todayAttendanceState.description}</p>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3. Quick Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Action 1: Catat Logbook */}
        <button
          onClick={onOpenLogbookModal}
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs hover:border-emerald-500 hover:shadow-xs transition text-left space-y-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
            <PlusCircle size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
              + Catat Logbook
            </h4>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Input aktivitas &amp; foto kegiatan harian</p>
          </div>
        </button>

        {/* Action 2: Program Kerja */}
        <button
          onClick={() => onNavigateTab("proker")}
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs hover:border-emerald-500 hover:shadow-xs transition text-left space-y-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Target size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400">
              Program Kerja
            </h4>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Pantau status usulan &amp; capaian proker</p>
          </div>
        </button>
      </div>

      {/* 4. KKN Statistics Summary Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight uppercase">
          Ringkasan Kemajuan KKN
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Stat 1: Logbook */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalLogbooks}</p>
            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Logbook</p>
          </div>

          {/* Stat 2: Disetujui DPL */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{stats.approvedLogbooks}</p>
            <p className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">Valid DPL</p>
          </div>

          {/* Stat 3: Kehadiran */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalAttendedDays}</p>
            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Sesi Hadir</p>
          </div>
        </div>
      </div>

      {/* 5. Recent Logbook Submissions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-black text-slate-900 dark:text-white">Logbook Terbaru</h3>
          <button
            onClick={() => onNavigateTab("logbook")}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Lihat Semua ({stats.totalLogbooks})
          </button>
        </div>

        {recentLogbooks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 space-y-2">
            <p>Belum ada catatan logbook yang dikirim.</p>
            <button
              onClick={onOpenLogbookModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Buat Logbook Pertama</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentLogbooks.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {log.deskripsi}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {safeFormatDateShort(log.tanggalKegiatan)}
                    <span>• {log.waktuMulai} - {log.waktuSelesai}</span>
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                    log.statusApproval === "DISETUJUI_DPL"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : log.statusApproval === "PERLU_REVISI_DPL"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {log.statusApproval === "DISETUJUI_DPL"
                    ? "Disetujui"
                    : log.statusApproval === "PERLU_REVISI_DPL"
                    ? "Revisi"
                    : "Menunggu"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
