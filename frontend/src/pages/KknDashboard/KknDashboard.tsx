/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import LeaderboardWidget from "../../components/LeaderboardWidget";
import {
  Users,
  Trash2,
  ShieldCheck,
  MapPin,
  Award,
  Search,
  Calendar,
  Compass,
  PhoneCall,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";
import { KknQrClaim } from "./KknQrClaim";
import { WargaRegistrationWizard } from "./WargaRegistrationWizard";
import { HandoverForm } from "./HandoverForm";
import { BantuFasilitasForm } from "./BantuFasilitasForm";
import { BantuPetugasForm } from "./BantuPetugasForm";
import api from "../../services/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const KknDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [unregisteredHouses, setUnregisteredHouses] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [rtRwAreas, setRtRwAreas] = useState<any[]>([]);

  // Loading & UI States
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWarga, setSelectedWarga] = useState<any | null>(null);

  // Filters
  const [filterRtRw, setFilterRtRw] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Map Layer & Tooltip States
  const [showRoads, setShowRoads] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Dynamically calculate compliance for each RT/RW
  const getZoneCompliance = (areaName: string) => {
    const matches = wargaList.filter((w) => w.rtRw.toLowerCase().includes(areaName.toLowerCase()));
    if (matches.length === 0) {
      if (areaName.includes("06")) return 87;
      if (areaName.includes("02")) return 73;
      if (areaName.includes("01")) return 49;
      return 75;
    }
    const sum = matches.reduce((acc, curr) => acc + curr.complianceScore, 0);
    return Math.round(sum / matches.length);
  };

  const getZoneColor = (score: number) => {
    if (score >= 80) return { fill: "#e2f5e9", stroke: "#10b981", text: "#047857" };
    if (score >= 60) return { fill: "#fef9c3", stroke: "#eab308", text: "#a16207" };
    return { fill: "#fee2e2", stroke: "#ef4444", text: "#b91c1c" };
  };

  const handleZoneClick = (areaName: string) => {
    const area = rtRwAreas.find((a) =>
      (a.rw || a.name).toLowerCase().includes(areaName.toLowerCase())
    );
    if (area) {
      const newId = area.id.toString();
      setFilterRtRw(newId);
      api
        .get("/kkn/warga", {
          params: {
            rtRwId: area.id,
            search: filterSearch || undefined,
          },
        })
        .then((res) => {
          setWargaList(res.data?.data || []);
        });
    } else {
      toast.error(`Wilayah ${areaName} tidak ditemukan di database`);
    }
  };



  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, wargaRes, housesRes, logsRes, areasRes] = await Promise.all([
        api.get("/kkn/dashboard"),
        api.get("/kkn/warga"),
        api.get("/kkn/unregistered"),
        api.get("/kkn/activities"),
        api.get("/bins/locations"),
      ]);

      setStats(statsRes.data?.data);
      setWargaList(wargaRes.data?.data || []);
      setUnregisteredHouses(housesRes.data?.data || []);
      setActivityLogs(logsRes.data?.data || []);
      setRtRwAreas(areasRes.data?.data || []);
      setRtRwAreas(areasRes.data?.data || []);
    } catch (err: any) {
      console.error("Gagal memuat data portal KKN:", err);
      toast.error(err.response?.data?.message || "Gagal memuat data portal KKN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterSubmit = async () => {
    try {
      const res = await api.get("/kkn/warga", {
        params: {
          rtRwId: filterRtRw ? parseInt(filterRtRw, 10) : undefined,
          search: filterSearch || undefined,
        },
      });
      setWargaList(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyaring data");
    }
  };



  const handleWargaClick = async (wargaId: string) => {
    try {
      const res = await api.get(`/kkn/warga/${wargaId}`);
      setSelectedWarga(res.data?.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal memuat detail warga");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshCw className="animate-spin text-primary w-12 h-12" />
        <p className="text-on-surface-variant font-medium">Memuat Portal Mahasiswa KKN...</p>
      </div>
    );
  }

  const { studentKkn, stats: kStats } = stats || {};

  // 1. Process Registration Trend Data
  const regTrendMap: { [key: string]: number } = {};
  wargaList.forEach((w) => {
    try {
      const dateStr = new Date(w.registeredAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      regTrendMap[dateStr] = (regTrendMap[dateStr] || 0) + 1;
    } catch (_) {}
  });

  const registrationTrendData = Object.keys(regTrendMap).map((date) => ({
    tanggal: date,
    warga: regTrendMap[date],
  })).slice(-7);

  // 2. Process Compliance Data
  const complianceData = wargaList.map((w) => ({
    nama: w.name.split(" ")[0],
    skor: w.complianceScore,
  })).slice(0, 10);

  return (
    <div className="space-y-6 pb-12">


      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-2">
            <Compass className="text-primary w-7 h-7" />
            Portal Pendampingan KKN
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            NIM: {studentKkn?.nim} • Jurusan: {studentKkn?.jurusan} • Wilayah Tugas:{" "}
            {studentKkn?.assignedArea}
          </p>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress Card */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">PROGRES PENDAMPINGAN</span>
            <Users className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black">{kStats?.totalRegistered} Bins</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              Target: {kStats?.maxLimit} (Sisa Kuota: {kStats?.remainingQuota})
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${kStats?.progressPct}%` }}
            ></div>
          </div>
        </div>

        {/* whitelist status */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">STATUS AKUN</span>
            <ShieldCheck className="text-indigo-600 w-5 h-5" />
          </div>
          <div>
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${studentKkn?.whitelistStatus === "APPROVED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
            >
              Whitelist: {studentKkn?.whitelistStatus}
            </span>
            <p className="text-[10px] text-on-surface-variant mt-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Selesai KKN: {new Date(studentKkn?.endDate).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>

        {/* contribution points */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">POIN KONTRIBUSI</span>
            <Award className="text-yellow-600 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-yellow-600">
              +{kStats?.contributionPoints} Pts
            </h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              Diperoleh dari aktivitas lapangan
            </p>
          </div>
        </div>

        {/* assigned area summary */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">WILAYAH TUGAS</span>
            <MapPin className="text-emerald-600 w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-on-surface">{studentKkn?.assignedArea}</h4>
            <p className="text-[10px] text-on-surface-variant mt-1">
              Status: Aktif Mendampingi Warga
            </p>
          </div>
        </div>
      </div>

      {/* Monitoring & Analitik Pendampingan (Line & Bar Charts) */}
      <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-6">
        <div>
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Compass className="text-primary w-5 h-5" />
            Grafik Analitik Pendampingan KKN
          </h3>
          <p className="text-xs text-on-surface-variant">
            Visualisasi tren pendaftaran warga dampingan dan skor kepatuhan daur ulang
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Registration Trend */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-700 text-center">Tren Registrasi Warga (7 Tanggal Terakhir)</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrationTrendData}>
                  <defs>
                    <linearGradient id="colorWarga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="tanggal" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="warga" name="Jumlah Warga" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWarga)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Compliance Score per citizen */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-700 text-center">Skor Kepatuhan per Warga Dampingan (Top 10)</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nama" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="skor" name="Skor Kepatuhan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: List + Peta & Checklist */}
      <div className="grid grid-cols-12 gap-6">
        {/* Citizens list */}
        <div className="col-span-8 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-lg">Daftar Warga Dampingan</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari nama / kode bin..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-primary w-44"
              />
              <select
                value={filterRtRw}
                onChange={(e) => setFilterRtRw(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-primary cursor-pointer"
              >
                <option value="">Semua RT/RW</option>
                {rtRwAreas.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.rw || loc.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleFilterSubmit}
                className="bg-primary text-white p-1.5 rounded-lg hover:scale-105 transition-transform cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-on-surface-variant border-b border-outline-variant/60 pb-3">
                  <th className="pb-3 font-bold">Nama & Alamat</th>
                  <th className="pb-3 text-left font-bold text-on-surface-variant">ID Tong</th>
                  <th className="pb-3 text-left font-bold text-on-surface-variant">Terdaftar</th>
                  <th className="pb-3 text-left font-bold text-on-surface-variant">Status</th>
                  <th className="pb-3 text-left font-bold text-on-surface-variant">Skor Kepatuhan</th>
                  <th className="pb-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {wargaList.length > 0 ? (
                  wargaList.map((w) => (
                    <tr
                      key={w.wargaId}
                      className="border-b border-outline-variant/30 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-bold text-on-surface">{w.name}</div>
                        <div className="text-[10px] text-on-surface-variant mt-0.5">
                          {w.rtRw} • {w.address}
                        </div>
                      </td>
                      <td className="py-3 font-mono font-bold text-primary">{w.binCode}</td>
                      <td className="py-3 text-on-surface-variant">
                        {new Date(w.registeredAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3">
                        {w.binStatus === "PENDING_APPROVAL" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Menunggu RW</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">Aktif</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.complianceScore >= 80 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                        >
                          {w.complianceScore} pts
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleWargaClick(w.wargaId)}
                          className="bg-slate-100 hover:bg-primary hover:text-white px-2.5 py-1 rounded-md font-bold transition-all text-[11px] cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-on-surface-variant font-medium"
                    >
                      Belum ada warga dampingan terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Map & Checklist */}
        <div className="col-span-4 space-y-6">
          <LeaderboardWidget />
          
          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-on-surface">
              <MapPin className="text-primary w-4.5 h-4.5" />
              Peta Sebaran Dampingan
            </h4>
            <div className="w-full relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200/80 shadow-inner p-1">
              {/* Layer / Filter Control in Top-Right */}
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs p-2 rounded-lg border border-slate-200 shadow-xs z-10 flex flex-col gap-1.5 text-[9px] font-bold text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRoads}
                    onChange={(e) => setShowRoads(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-3 h-3"
                  />
                  Tampilkan Jalan
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-3 h-3"
                  />
                  Tampilkan Label
                </label>
              </div>

              {/* Vector SVG Map Layer */}
              <svg viewBox="0 0 400 300" className="w-full h-auto bg-slate-50 rounded-lg">
                {/* Gridlines for texture */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="400" height="300" fill="url(#grid)" />

                {/* Polygons (Zones) */}
                {(() => {
                  const scoreA = getZoneCompliance("RW 06");
                  const scoreB = getZoneCompliance("RW 02");
                  const scoreC = getZoneCompliance("RW 01");
                  const scoreD = getZoneCompliance("RW 03");

                  const colorA = getZoneColor(scoreA);
                  const colorB = getZoneColor(scoreB);
                  const colorC = getZoneColor(scoreC);
                  const colorD = getZoneColor(scoreD);

                  return (
                    <>
                      {/* Zone A (RW 06 Dago) */}
                      <polygon
                        points="15,15 155,15 125,145 15,145"
                        fill={colorA.fill}
                        stroke={hoveredZone === "RW 06" ? "#047857" : colorA.stroke}
                        strokeWidth={hoveredZone === "RW 06" ? "3" : "1.5"}
                        className="transition-all cursor-pointer opacity-90 hover:opacity-100"
                        onMouseEnter={() => setHoveredZone("RW 06")}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleZoneClick("RW 06")}
                      />

                      {/* Zone B (RW 02 Cigadung) */}
                      <polygon
                        points="155,15 285,15 255,145 125,145"
                        fill={colorB.fill}
                        stroke={hoveredZone === "RW 02" ? "#a16207" : colorB.stroke}
                        strokeWidth={hoveredZone === "RW 02" ? "3" : "1.5"}
                        className="transition-all cursor-pointer opacity-90 hover:opacity-100"
                        onMouseEnter={() => setHoveredZone("RW 02")}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleZoneClick("RW 02")}
                      />

                      {/* Zone C (RW 01 Coblong) */}
                      <polygon
                        points="125,145 255,145 225,285 95,285"
                        fill={colorC.fill}
                        stroke={hoveredZone === "RW 01" ? "#b91c1c" : colorC.stroke}
                        strokeWidth={hoveredZone === "RW 01" ? "3" : "1.5"}
                        className="transition-all cursor-pointer opacity-90 hover:opacity-100"
                        onMouseEnter={() => setHoveredZone("RW 01")}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleZoneClick("RW 01")}
                      />

                      {/* Zone D (RW 03 Dago) */}
                      <polygon
                        points="15,145 125,145 95,285 15,285"
                        fill={colorD.fill}
                        stroke={hoveredZone === "RW 03" ? "#047857" : colorD.stroke}
                        strokeWidth={hoveredZone === "RW 03" ? "3" : "1.5"}
                        className="transition-all cursor-pointer opacity-90 hover:opacity-100"
                        onMouseEnter={() => setHoveredZone("RW 03")}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => handleZoneClick("RW 03")}
                      />

                      {/* Roads Overlay (If enabled) */}
                      {showRoads && (
                        <>
                          <path
                            d="M 10,95 Q 200,85 390,100"
                            stroke="#cbd5e1"
                            strokeWidth="14"
                            fill="none"
                            strokeLinecap="round"
                            opacity="0.8"
                          />
                          <path
                            d="M 185,10 Q 175,150 155,290"
                            stroke="#cbd5e1"
                            strokeWidth="14"
                            fill="none"
                            strokeLinecap="round"
                            opacity="0.8"
                          />

                          {/* Inner dashed line to look like a real road */}
                          <path
                            d="M 10,95 Q 200,85 390,100"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                            fill="none"
                            opacity="0.9"
                          />
                          <path
                            d="M 185,10 Q 175,150 155,290"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                            fill="none"
                            opacity="0.9"
                          />

                          {/* Road Names */}
                          <text
                            x="50"
                            y="107"
                            fill="#64748b"
                            fontSize="7"
                            fontWeight="bold"
                            transform="rotate(2, 50, 107)"
                          >
                            Jl. Dago Giri
                          </text>
                          <text
                            x="142"
                            y="200"
                            fill="#64748b"
                            fontSize="7"
                            fontWeight="bold"
                            transform="rotate(-77, 142, 200)"
                          >
                            Jl. Coblong Raya
                          </text>
                        </>
                      )}

                      {/* Labels (If enabled) */}
                      {showLabels && (
                        <>
                          {/* Area A */}
                          <g transform="translate(80, 70)" className="pointer-events-none">
                            <text
                              textAnchor="middle"
                              fill={colorA.text}
                              fontSize="9"
                              fontWeight="bold"
                            >
                              RW 06 Dago
                            </text>
                            <text
                              textAnchor="middle"
                              y="11"
                              fill={colorA.text}
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {scoreA}%
                            </text>
                          </g>

                          {/* Area B */}
                          <g transform="translate(200, 70)" className="pointer-events-none">
                            <text
                              textAnchor="middle"
                              fill={colorB.text}
                              fontSize="9"
                              fontWeight="bold"
                            >
                              RW 02 Cigadung
                            </text>
                            <text
                              textAnchor="middle"
                              y="11"
                              fill={colorB.text}
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {scoreB}%
                            </text>
                          </g>

                          {/* Area C */}
                          <g transform="translate(170, 205)" className="pointer-events-none">
                            <text
                              textAnchor="middle"
                              fill={colorC.text}
                              fontSize="9"
                              fontWeight="bold"
                            >
                              RW 01 Coblong
                            </text>
                            <text
                              textAnchor="middle"
                              y="11"
                              fill={colorC.text}
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {scoreC}%
                            </text>
                          </g>

                          {/* Area D */}
                          <g transform="translate(60, 205)" className="pointer-events-none">
                            <text
                              textAnchor="middle"
                              fill={colorD.text}
                              fontSize="9"
                              fontWeight="bold"
                            >
                              RW 03 Dago
                            </text>
                            <text
                              textAnchor="middle"
                              y="11"
                              fill={colorD.text}
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {scoreD}%
                            </text>
                          </g>
                        </>
                      )}
                    </>
                  );
                })()}
              </svg>

              {/* Legend Box in Bottom-Right */}
              <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs p-2 rounded-lg border border-slate-200/80 text-[8px] flex flex-col gap-1 shadow-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-emerald-600/30"></span>{" "}
                  Tinggi (&ge; 80%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block border border-yellow-500/30"></span>{" "}
                  Sedang (60-79%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-rose-600/30"></span>{" "}
                  Rendah (&lt; 60%)
                </span>
              </div>
            </div>
          </div>

          {/* Checklist Warga Belum Registrasi */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm flex items-center gap-1.5">
              <FileText className="text-indigo-600 w-4.5 h-4.5" />
              Checklist Target Lapangan
            </h4>
            <div
              className="space-y-2 max-h-[220px] overflow-y-auto pr-1"
              style={{ scrollbarWidth: "thin" }}
            >
              {unregisteredHouses.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">{h.address}</span>
                  </div>
                  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200/80 px-1.5 py-0.5 rounded font-bold">
                    Target
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Riwayat Aktivitas Mahasiswa */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm flex items-center gap-1.5">
              <Calendar className="text-primary w-4.5 h-4.5" />
              Riwayat Aktivitas KKN
            </h4>
            <div
              className="space-y-3 max-h-[220px] overflow-y-auto pr-1"
              style={{ scrollbarWidth: "thin" }}
            >
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs space-y-1"
                >
                  <div className="font-semibold text-slate-700">
                    {log.action === "ACTIVATE_BIN" ? "Aktivasi Bins" : log.action}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleString("id-ID")}
                  </div>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-[11px] text-slate-500 text-center py-4">
                  Belum ada riwayat aktivitas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Aksi Mahasiswa KKN Forms */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        <h2 className="text-xl font-bold border-b pb-2">Aksi Mahasiswa KKN</h2>
        {kStats && kStats.remainingQuota <= 0 ? (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">notifications_active</span>
            </div>
            <h3 className="font-extrabold text-base text-amber-800">Target Registrasi Tercapai!</h3>
            <p className="text-xs text-amber-700 max-w-lg mx-auto">
              Progres pendaftaran warga Anda telah mencapai 100% dari threshold yang ditentukan.
              Fitur pendaftaran warga baru dinonaktifkan. Silakan fokus melakukan pendampingan, edukasi, 
              serta pemantauan terhadap warga dampingan Anda.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Mode Pengingat & Notifikasi Aktif
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <KknQrClaim onClaimSuccess={fetchInitialData} />
              <WargaRegistrationWizard 
                onSuccess={() => {
                  fetchInitialData();
                  toast.success("Silahkan kembali ke menu utama.");
                }} 
                onCancel={() => {
                  toast("Registrasi dibatalkan.", { icon: "ℹ️" });
                }} 
              />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <h3 className="font-extrabold text-lg text-slate-800">Bantuan Fasilitas</h3>
              <p className="text-xs text-slate-500 mt-2">Daftarkan RT/RW untuk fasilitas daur ulang / Bank Sampah</p>
              <BantuFasilitasForm onSuccess={fetchInitialData} />
              
              <div className="w-full border-t border-slate-100 my-6"></div>
              
              <h3 className="font-extrabold text-lg text-slate-800">Daftar Petugas</h3>
              <p className="text-xs text-slate-500 mt-2">Daftarkan Petugas Residu untuk operasional penjemputan</p>
              <BantuPetugasForm onSuccess={fetchInitialData} />

              <div className="w-full border-t border-slate-100 my-6"></div>
              <HandoverForm onSuccess={fetchInitialData} />
            </div>
          </div>
        )}
      </div>

      {/* DETAIL WARGA DRAWER */}
      {selectedWarga && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-250">
            <div
              className="space-y-6 overflow-y-auto flex-1 pr-1"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-lg text-on-surface flex items-center gap-2">
                  <Users className="text-primary w-5 h-5" /> Detail Warga Dampingan
                </h3>
                <button
                  onClick={() => setSelectedWarga(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warga profile detail */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                    Nama Warga
                  </h4>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">
                    {selectedWarga.name}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                    Kontak & Alamat
                  </h4>
                  <p className="text-xs text-slate-700 mt-0.5">
                    {selectedWarga.phone} • {selectedWarga.email}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    {selectedWarga.rtRw} • {selectedWarga.address}
                  </p>
                </div>
                {selectedWarga.bin && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <h4 className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-primary" />
                      ID Bin:{" "}
                      <span className="font-mono text-primary font-bold">
                        {selectedWarga.bin.qrCode}
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Kategori</p>
                        <p className="font-bold text-slate-700">{selectedWarga.bin.category}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Kapasitas</p>
                        <p className="font-bold text-slate-700">{selectedWarga.bin.capacity}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Deposit History */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm border-b border-slate-100 pb-2">
                  Riwayat Setoran Sampah
                </h4>
                <div className="space-y-2">
                  {selectedWarga.recentLogs && selectedWarga.recentLogs.length > 0 ? (
                    selectedWarga.recentLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-700">{log.category}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(log.createdAt).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <span className="font-bold text-primary">
                          {log.weightKg} kg ({log.volumeLiter}L)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Belum ada riwayat setoran.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-slate-100 pt-4 mt-6">
              <a
                href={`https://wa.me/${selectedWarga.phone?.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 hover:scale-[1.01] transition-all cursor-pointer text-xs"
              >
                <PhoneCall className="w-4 h-4" />
                Hubungi via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KknDashboard;
