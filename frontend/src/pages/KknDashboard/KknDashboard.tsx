/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { 
  Users, Trash2, ShieldCheck, MapPin, Award, CheckCircle, 
  Search, Plus, Calendar, Compass, PhoneCall, RefreshCw, X, FileText, Sparkles, Upload
} from "lucide-react";
import api from "../../services/api";

const KknDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [unregisteredHouses, setUnregisteredHouses] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [rtRwAreas, setRtRwAreas] = useState<any[]>([]);

  // Loading & UI States
  const [isLoading, setIsLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);
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
    const matches = wargaList.filter(
      (w) => w.rtRw.toLowerCase().includes(areaName.toLowerCase())
    );
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
    const area = rtRwAreas.find((a) => (a.rw || a.name).toLowerCase().includes(areaName.toLowerCase()));
    if (area) {
      const newId = area.id.toString();
      setFilterRtRw(newId);
      api.get("/kkn/warga", {
        params: {
          rtRwId: area.id,
          search: filterSearch || undefined,
        },
      }).then((res) => {
        setWargaList(res.data?.data || []);
      });
    } else {
      toast.error(`Wilayah ${areaName} tidak ditemukan di database`);
    }
  };

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    nik: "",
    address: "",
    rtRwId: "",
    binQrCode: "",
    binCategoryId: "",
  });
  const [regPhoto, setRegPhoto] = useState<File | null>(null);
  const [regPhotoPreview, setRegPhotoPreview] = useState<string | null>(null);
  const [aiVolumeEstimate, setAiVolumeEstimate] = useState<number | null>(null);
  const [isAiEstimating, setIsAiEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Categories list (fetched from DB)
  const [categories, setCategories] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, wargaRes, housesRes, logsRes, areasRes, catsRes] = await Promise.all([
        api.get("/kkn/dashboard"),
        api.get("/kkn/warga"),
        api.get("/kkn/unregistered"),
        api.get("/kkn/activities"),
        api.get("/bins/locations"),
        api.get("/categories"),
      ]);

      setStats(statsRes.data?.data);
      setWargaList(wargaRes.data?.data || []);
      setUnregisteredHouses(housesRes.data?.data || []);
      setActivityLogs(logsRes.data?.data || []);
      setRtRwAreas(areasRes.data?.data || []);
      setCategories(catsRes.data?.data || []);
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRegPhoto(file);
      setRegPhotoPreview(URL.createObjectURL(file));

      // Trigger AI volume estimation
      try {
        setIsAiEstimating(true);
        const formData = new FormData();
        formData.append("image", file);
        const uploadRes = await api.post("/waste/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const imageUrl = uploadRes.data.data.imageUrl;

        const aiRes = await api.post("/waste/estimate-volume", { imageUrl });
        if (aiRes.data?.success) {
          setAiVolumeEstimate(aiRes.data.data.volumeLiters);
          toast.success(`AI Estimasi: ${aiRes.data.data.volumeLiters} Liter`);
        }
      } catch (err) {
        console.error("Gagal estimasi AI:", err);
        toast.error("Gagal mengestimasi volume dari foto (menggunakan default)");
      } finally {
        setIsAiEstimating(false);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.email || !regForm.binQrCode || !regForm.binCategoryId || !regForm.rtRwId) {
      toast.error("Mohon lengkapi semua bidang wajib!");
      return;
    }

    try {
      setIsSubmitting(true);

      let evidencePhotoUrl = "";
      if (regPhoto) {
        const formData = new FormData();
        formData.append("image", regPhoto);
        const uploadRes = await api.post("/waste/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        evidencePhotoUrl = uploadRes.data.data.imageUrl;
      }

      await api.post("/kkn/register-warga", {
        ...regForm,
        rtRwId: parseInt(regForm.rtRwId, 10),
        evidencePhotoUrl,
      });

      setShowSuccessOverlay(true);
      setTimeout(() => {
        setShowSuccessOverlay(false);
        setShowRegModal(false);
        // Reset form
        setRegForm({
          name: "",
          email: "",
          phone: "",
          nik: "",
          address: "",
          rtRwId: "",
          binQrCode: "",
          binCategoryId: "",
        });
        setRegPhoto(null);
        setRegPhotoPreview(null);
        setAiVolumeEstimate(null);
        fetchInitialData();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal meregistrasi warga");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6 pb-12">
      {/* SUCCESS OVERLAY */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-primary/95 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="text-center text-white space-y-4 max-w-sm px-6">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto animate-bounce border border-white/30">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Registrasi Sukses!</h2>
            <p className="text-sm text-green-100">
              Data warga dan tempat sampah cerdas telah berhasil didaftarkan di sistem wilayah.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-2">
            <Compass className="text-primary w-7 h-7" />
            Portal Pendampingan KKN
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            NIM: {studentKkn?.nim} • Jurusan: {studentKkn?.jurusan} • Wilayah Tugas: {studentKkn?.assignedArea}
          </p>
        </div>
        <button
          onClick={() => setShowRegModal(true)}
          className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrasi Warga Baru
        </button>
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
            <p className="text-[10px] text-on-surface-variant mt-0.5">Target: {kStats?.maxLimit} (Sisa Kuota: {kStats?.remainingQuota})</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div className="bg-primary h-full transition-all duration-500" style={{ width: `${kStats?.progressPct}%` }}></div>
          </div>
        </div>

        {/* whitelist status */}
        <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-bold">STATUS AKUN</span>
            <ShieldCheck className="text-indigo-600 w-5 h-5" />
          </div>
          <div>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${studentKkn?.whitelistStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
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
            <h3 className="text-2xl font-black text-yellow-600">+{kStats?.contributionPoints} Pts</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Diperoleh dari aktivitas lapangan</p>
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
            <p className="text-[10px] text-on-surface-variant mt-1">Status: Aktif Mendampingi Warga</p>
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
                  <option key={loc.id} value={loc.id}>{loc.rw || loc.name}</option>
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
                  <th className="pb-3 font-bold">Kode Bin</th>
                  <th className="pb-3 font-bold">Tanggal Reg</th>
                  <th className="pb-3 font-bold">Kepatuhan</th>
                  <th className="pb-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {wargaList.length > 0 ? wargaList.map((w) => (
                  <tr key={w.wargaId} className="border-b border-outline-variant/30 hover:bg-slate-50 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-on-surface">{w.name}</div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">{w.rtRw} • {w.address}</div>
                    </td>
                    <td className="py-3 font-mono font-bold text-primary">{w.binCode}</td>
                    <td className="py-3 text-on-surface-variant">
                      {new Date(w.registeredAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.complianceScore >= 80 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
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
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-on-surface-variant font-medium">
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
          {/* Simulated Geographic Heatmap Map */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
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
                          <text x="50" y="107" fill="#64748b" fontSize="7" fontWeight="bold" transform="rotate(2, 50, 107)">Jl. Dago Giri</text>
                          <text x="142" y="200" fill="#64748b" fontSize="7" fontWeight="bold" transform="rotate(-77, 142, 200)">Jl. Coblong Raya</text>
                        </>
                      )}

                      {/* Labels (If enabled) */}
                      {showLabels && (
                        <>
                          {/* Area A */}
                          <g transform="translate(80, 70)" className="pointer-events-none">
                            <text textAnchor="middle" fill={colorA.text} fontSize="9" fontWeight="bold">RW 06 Dago</text>
                            <text textAnchor="middle" y="11" fill={colorA.text} fontSize="8" fontWeight="bold">{scoreA}%</text>
                          </g>

                          {/* Area B */}
                          <g transform="translate(200, 70)" className="pointer-events-none">
                            <text textAnchor="middle" fill={colorB.text} fontSize="9" fontWeight="bold">RW 02 Cigadung</text>
                            <text textAnchor="middle" y="11" fill={colorB.text} fontSize="8" fontWeight="bold">{scoreB}%</text>
                          </g>

                          {/* Area C */}
                          <g transform="translate(170, 205)" className="pointer-events-none">
                            <text textAnchor="middle" fill={colorC.text} fontSize="9" fontWeight="bold">RW 01 Coblong</text>
                            <text textAnchor="middle" y="11" fill={colorC.text} fontSize="8" fontWeight="bold">{scoreC}%</text>
                          </g>

                          {/* Area D */}
                          <g transform="translate(60, 205)" className="pointer-events-none">
                            <text textAnchor="middle" fill={colorD.text} fontSize="9" fontWeight="bold">RW 03 Dago</text>
                            <text textAnchor="middle" y="11" fill={colorD.text} fontSize="8" fontWeight="bold">{scoreD}%</text>
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
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-emerald-600/30"></span> Tinggi (&ge; 80%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block border border-yellow-500/30"></span> Sedang (60-79%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-rose-600/30"></span> Rendah (&lt; 60%)
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
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {unregisteredHouses.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
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
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {activityLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs space-y-1">
                  <div className="font-semibold text-slate-700">{log.action === 'ACTIVATE_BIN' ? 'Aktivasi Bins' : log.action}</div>
                  <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString("id-ID")}</div>
                </div>
              ))}
              {activityLogs.length === 0 && (
                <p className="text-[11px] text-slate-500 text-center py-4">Belum ada riwayat aktivitas.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-outline-variant animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-on-surface">
                <Compass className="text-primary w-5 h-5" />
                Registrasi Warga & Aktivasi QR
              </h3>
              <button
                onClick={() => setShowRegModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Nama warga..."
                    className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Email Warga *</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">No WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="Contoh: 081234567..."
                    className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">NIK KTP</label>
                  <input
                    type="text"
                    value={regForm.nik}
                    onChange={(e) => setRegForm({ ...regForm, nik: e.target.value })}
                    placeholder="16 digit NIK..."
                    className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Wilayah (RT/RW) *</label>
                  <select
                    required
                    value={regForm.rtRwId}
                    onChange={(e) => setRegForm({ ...regForm, rtRwId: e.target.value })}
                    className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Pilih RT/RW...</option>
                    {rtRwAreas.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.rw || loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Alamat Fisik *</label>
                  <input
                    type="text"
                    required
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    placeholder="Nama jalan & No Rumah..."
                    className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">ID QR Tong Sampah *</label>
                  <input
                    type="text"
                    required
                    value={regForm.binQrCode}
                    onChange={(e) => setRegForm({ ...regForm, binQrCode: e.target.value })}
                    placeholder="Contoh: TS-COB-001..."
                    className="border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Kategori Tong *</label>
                  <select
                    required
                    value={regForm.binCategoryId}
                    onChange={(e) => setRegForm({ ...regForm, binCategoryId: e.target.value })}
                    className="border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Foto bukti & AI Volume */}
              <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Foto Fisik Tempat Sampah (Opsional)</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {regPhotoPreview && (
                  <div className="flex gap-4 items-center animate-in fade-in duration-200">
                    <img src={regPhotoPreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
                    {isAiEstimating ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <RefreshCw className="animate-spin w-4 h-4 text-primary" />
                        AI menganalisis volume tempat sampah...
                      </div>
                    ) : aiVolumeEstimate !== null ? (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Estimasi AI Volume: {aiVolumeEstimate} Liter
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin w-4 h-4" /> Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Simpan Registrasi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL WARGA DRAWER */}
      {selectedWarga && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-250">
            <div className="space-y-6 overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
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
                  <h4 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Nama Warga</h4>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedWarga.name}</p>
                </div>
                <div>
                  <h4 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Kontak & Alamat</h4>
                  <p className="text-xs text-slate-700 mt-0.5">{selectedWarga.phone} • {selectedWarga.email}</p>
                  <p className="text-xs text-slate-700 mt-1">{selectedWarga.rtRw} • {selectedWarga.address}</p>
                </div>
                {selectedWarga.bin && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <h4 className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-primary" />
                      ID Bin: <span className="font-mono text-primary font-bold">{selectedWarga.bin.qrCode}</span>
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
                <h4 className="font-extrabold text-sm border-b border-slate-100 pb-2">Riwayat Setoran Sampah</h4>
                <div className="space-y-2">
                  {selectedWarga.recentLogs && selectedWarga.recentLogs.length > 0 ? selectedWarga.recentLogs.map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                      <div>
                        <p className="font-bold text-slate-700">{log.category}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString("id-ID")}</p>
                      </div>
                      <span className="font-bold text-primary">
                        {log.weightKg} kg ({log.volumeLiter}L)
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-500 text-center py-4">Belum ada riwayat setoran.</p>
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
