/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Cylinder,
  Ruler,
  Calculator,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Search,
  RefreshCw,
  Sparkles,
  Smartphone,
  Code2,
  Layers,
  Sliders,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export interface PresetTabung {
  id: string;
  label: string;
  capacity: number;
  diameter: number;
  tinggi: number;
}

export interface PresetKotak {
  id: string;
  label: string;
  capacity: number;
  panjang: number;
  lebar: number;
  tinggi: number;
}

// Fallback data standar Indonesia jika offline/server error
const DEFAULT_PRESET_TABUNG: PresetTabung[] = [
  { id: "preset-t-1", label: "Kecil", capacity: 10.0, diameter: 23, tinggi: 24 },
  { id: "preset-t-2", label: "Sedang", capacity: 20.0, diameter: 29, tinggi: 30 },
  { id: "preset-t-3", label: "Besar", capacity: 40.0, diameter: 36, tinggi: 39 },
  { id: "preset-t-4", label: "Jumbo", capacity: 60.0, diameter: 40, tinggi: 48 },
];

const DEFAULT_PRESET_KOTAK: PresetKotak[] = [
  { id: "preset-k-1", label: "Kecil", capacity: 12.0, panjang: 25, lebar: 20, tinggi: 24 },
  { id: "preset-k-2", label: "Sedang", capacity: 25.0, panjang: 40, lebar: 25, tinggi: 25 },
  { id: "preset-k-3", label: "Besar", capacity: 50.0, panjang: 40, lebar: 35, tinggi: 36 },
  { id: "preset-k-4", label: "Jumbo", capacity: 70.0, panjang: 45, lebar: 35, tinggi: 45 },
];

const USE_CASE_TABUNG: Record<string, string> = {
  "preset-t-1": "Tempat sampah kamar tidur, meja kerja, toilet/kamar mandi (model injak/pedal kecil).",
  "preset-t-2": "Tempat sampah ruang keluarga, teras rumah warga, atau dapur standar keluarga.",
  "preset-t-3": "Tempat sampah drum plastik bertutup depan pagar rumah, warung, atau lorong gang.",
  "preset-t-4": "Drum plastik komunal RT/RW, fasilitas umum, atau tempat sampah titik kumpul warga.",
};

const USE_CASE_KOTAK: Record<string, string> = {
  "preset-k-1": "Tempat sampah slim kotak bawah meja kerja kantor, ruang belajar, atau samping wastafel.",
  "preset-k-2": "Tempat sampah pilah dapur rumah tangga atau tempat sampah gantung wastafel.",
  "preset-k-3": "Tempat sampah pilah 2-3 kompartemen di fasilitas umum, sekolah, atau balai RW.",
  "preset-k-4": "Tempat sampah roda outdoor balok komunal untuk pengangkutan residu berkala.",
};

export const MasterPresetTempatSampahPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tabung" | "kotak" | "kalkulator" | "api_docs">("tabung");
  const [tabungList, setTabungList] = useState<PresetTabung[]>(DEFAULT_PRESET_TABUNG);
  const [kotakList, setKotakList] = useState<PresetKotak[]>(DEFAULT_PRESET_KOTAK);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State untuk Live Simulator & Kalkulator
  const [calcShape, setCalcShape] = useState<"tabung" | "kotak">("tabung");
  const [calcDiameter, setCalcDiameter] = useState<number>(25);
  const [calcTinggiTabung, setCalcTinggiTabung] = useState<number>(30);
  const [calcPanjang, setCalcPanjang] = useState<number>(30);
  const [calcLebar, setCalcLebar] = useState<number>(20);
  const [calcTinggiKotak, setCalcTinggiKotak] = useState<number>(25);

  const fetchPresets = async () => {
    setLoading(true);
    try {
      const [resTabung, resKotak] = await Promise.allSettled([
        api.get("/bins/presets/tabung"),
        api.get("/bins/presets/kotak"),
      ]);

      if (resTabung.status === "fulfilled" && resTabung.value.data?.data) {
        setTabungList(resTabung.value.data.data);
      }
      if (resKotak.status === "fulfilled" && resKotak.value.data?.data) {
        setKotakList(resKotak.value.data.data);
      }
      toast.success("Preset ukuran tempat sampah berhasil disinkronkan");
    } catch (err) {
      console.warn("Gagal memuat preset ukuran dari API, menggunakan template default:", err);
      toast.error("Gagal sinkronisasi dengan server, menampilkan data standar lokal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleCopyJson = (data: any, identifier: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(identifier);
    toast.success("JSON preset berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered lists
  const filteredTabung = useMemo(() => {
    if (!searchTerm.trim()) return tabungList;
    const q = searchTerm.toLowerCase();
    return tabungList.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        String(item.capacity).includes(q)
    );
  }, [tabungList, searchTerm]);

  const filteredKotak = useMemo(() => {
    if (!searchTerm.trim()) return kotakList;
    const q = searchTerm.toLowerCase();
    return kotakList.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        String(item.capacity).includes(q)
    );
  }, [kotakList, searchTerm]);

  // Kalkulasi Simulator
  const calculatedVolume = useMemo(() => {
    if (calcShape === "tabung") {
      const r = (Number(calcDiameter) || 0) / 2;
      const t = Number(calcTinggiTabung) || 0;
      // V = pi * r^2 * t (cm3) / 1000 = Liter
      const vol = (Math.PI * r * r * t) / 1000;
      return Math.round(vol * 10) / 10;
    } else {
      const p = Number(calcPanjang) || 0;
      const l = Number(calcLebar) || 0;
      const t = Number(calcTinggiKotak) || 0;
      // V = p * l * t (cm3) / 1000 = Liter
      const vol = (p * l * t) / 1000;
      return Math.round(vol * 10) / 10;
    }
  }, [calcShape, calcDiameter, calcTinggiTabung, calcPanjang, calcLebar, calcTinggiKotak]);

  // Menentukan preset terdekat
  const closestPreset = useMemo(() => {
    const list = calcShape === "tabung" ? tabungList : kotakList;
    if (!list.length || calculatedVolume <= 0) return null;

    let closest = list[0];
    let minDiff = Math.abs(list[0].capacity - calculatedVolume);

    for (let i = 1; i < list.length; i++) {
      const diff = Math.abs(list[i].capacity - calculatedVolume);
      if (diff < minDiff) {
        minDiff = diff;
        closest = list[i];
      }
    }
    return { preset: closest, diff: Math.round(minDiff * 10) / 10 };
  }, [calculatedVolume, calcShape, tabungList, kotakList]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold mb-2">
            <Sparkles size={14} />
            Master Data & Standarisasi Ukuran
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Jenis & Preset Ukuran Tempat Sampah
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Katalog template ukuran standar tempat sampah yang umum digunakan di Indonesia (Tabung & Kotak).
            Data ini digunakan secara langsung oleh aplikasi mobile saat warga mendaftarkan dan mengkalibrasi tempat sampah mereka.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchPresets}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Muat ulang data dari API"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />
            <span>Sinkronkan Data</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigasi */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("tabung")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tabung"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Cylinder size={15} />
            <span>Preset Tabung (Silinder)</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              activeTab === "tabung" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {tabungList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("kotak")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "kotak"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Box size={15} />
            <span>Preset Kotak (Balok)</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              activeTab === "kotak" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {kotakList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("kalkulator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "kalkulator"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calculator size={15} />
            <span>Kalkulator & Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab("api_docs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "api_docs"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Code2 size={15} />
            <span>Panduan API Mobile</span>
          </button>
        </div>

        {(activeTab === "tabung" || activeTab === "kotak") && (
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari label / kapasitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Preset Tabung */}
      {activeTab === "tabung" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredTabung.map((preset) => {
              const radius = preset.diameter / 2;
              const luasAlas = Math.round(Math.PI * radius * radius * 10) / 10;
              const calculatedVol = Math.round(((Math.PI * radius * radius * preset.tinggi) / 1000) * 10) / 10;

              return (
                <div
                  key={preset.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header Card */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                          <Cylinder size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            {preset.id}
                          </span>
                          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                            Ukuran {preset.label}
                          </h3>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-black text-xs">
                        {preset.capacity} L
                      </span>
                    </div>

                    {/* Visual Tabung SVG Preview */}
                    <div className="h-28 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 flex items-center justify-center relative overflow-hidden border border-slate-100 dark:border-slate-800">
                      <svg width="100" height="90" viewBox="0 0 100 90" className="drop-shadow-xs">
                        {/* Tabung Badan */}
                        <path
                          d="M 25 25 L 25 70 A 25 10 0 0 0 75 70 L 75 25 Z"
                          className="fill-emerald-500/20 stroke-emerald-600 dark:stroke-emerald-400"
                          strokeWidth="2"
                        />
                        {/* Tabung Tutup Atas */}
                        <ellipse
                          cx="50"
                          cy="25"
                          rx="25"
                          ry="10"
                          className="fill-emerald-500/40 stroke-emerald-600 dark:stroke-emerald-400"
                          strokeWidth="2"
                        />
                        {/* Garis Ukuran Diameter */}
                        <line x1="25" y1="25" x2="75" y2="25" stroke="#059669" strokeWidth="1.5" strokeDasharray="2,2" />
                        {/* Label Diameter */}
                        <text x="50" y="22" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#047857">
                          Ø {preset.diameter} cm
                        </text>
                        {/* Label Tinggi */}
                        <text x="82" y="52" textAnchor="start" fontSize="8" fontWeight="bold" fill="#047857">
                          t {preset.tinggi}
                        </text>
                      </svg>
                    </div>

                    {/* Dimensi Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Diameter</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                          {preset.diameter} cm
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Tinggi</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                          {preset.tinggi} cm
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Luas Alas</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {luasAlas} cm²
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Volume Hitung</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {calculatedVol} L
                        </span>
                      </div>
                    </div>

                    {/* Rekomendasi Penggunaan */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100/80 dark:border-emerald-900/40 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong className="text-emerald-800 dark:text-emerald-300 block mb-0.5">Rekomendasi Umum di Indonesia:</strong>
                      {USE_CASE_TABUNG[preset.id] || "Tempat sampah rumah tangga atau perkantoran umum."}
                    </div>
                  </div>

                  {/* Copy Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Payload Mobile Spec</span>
                    <button
                      onClick={() => handleCopyJson(preset, preset.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {copiedId === preset.id ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Salin JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabel Perbandingan Tabung */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-emerald-600" />
                Tabel Rujukan Dimensi Tempat Sampah Tabung (Silinder)
              </h4>
              <span className="text-[11px] font-bold text-slate-400">Satuan: cm & Liter</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-4">ID Preset</th>
                    <th className="py-3 px-4">Nama Ukuran</th>
                    <th className="py-3 px-4 text-center">Kapasitas (L)</th>
                    <th className="py-3 px-4 text-center">Diameter (cm)</th>
                    <th className="py-3 px-4 text-center">Tinggi (cm)</th>
                    <th className="py-3 px-4">Karakteristik & Penggunaan</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {filteredTabung.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.id}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-100">{item.label}</td>
                      <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-slate-100">{item.capacity} L</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{item.diameter} cm</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{item.tinggi} cm</td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs">{USE_CASE_TABUNG[item.id]}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleCopyJson(item, `table-${item.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Salin JSON"
                        >
                          {copiedId === `table-${item.id}` ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Preset Kotak */}
      {activeTab === "kotak" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredKotak.map((preset) => {
              const luasAlas = preset.panjang * preset.lebar;
              const calculatedVol = Math.round(((preset.panjang * preset.lebar * preset.tinggi) / 1000) * 10) / 10;

              return (
                <div
                  key={preset.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header Card */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                          <Box size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            {preset.id}
                          </span>
                          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                            Ukuran {preset.label}
                          </h3>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-black text-xs">
                        {preset.capacity} L
                      </span>
                    </div>

                    {/* Visual Kotak SVG Preview */}
                    <div className="h-28 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 flex items-center justify-center relative overflow-hidden border border-slate-100 dark:border-slate-800">
                      <svg width="100" height="90" viewBox="0 0 100 90" className="drop-shadow-xs">
                        {/* Kotak 3D Isometrik Sederhana */}
                        <polygon points="25,35 60,20 85,32 50,47" className="fill-blue-500/40 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
                        <polygon points="25,35 50,47 50,80 25,68" className="fill-blue-500/25 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
                        <polygon points="50,47 85,32 85,65 50,80" className="fill-blue-500/30 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
                        {/* Label Dimensi */}
                        <text x="32" y="80" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#2563eb">
                          p {preset.panjang}
                        </text>
                        <text x="73" y="78" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#2563eb">
                          l {preset.lebar}
                        </text>
                        <text x="90" y="50" textAnchor="start" fontSize="7.5" fontWeight="bold" fill="#2563eb">
                          t {preset.tinggi}
                        </text>
                      </svg>
                    </div>

                    {/* Dimensi Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Panjang</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {preset.panjang} cm
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Lebar</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {preset.lebar} cm
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Tinggi</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {preset.tinggi} cm
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Luas Alas</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {luasAlas} cm²
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Volume Hitung</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {calculatedVol} L
                        </span>
                      </div>
                    </div>

                    {/* Rekomendasi Penggunaan */}
                    <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100/80 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong className="text-blue-800 dark:text-blue-300 block mb-0.5">Rekomendasi Umum di Indonesia:</strong>
                      {USE_CASE_KOTAK[preset.id] || "Tempat sampah kotak rumah tangga atau kantor."}
                    </div>
                  </div>

                  {/* Copy Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Payload Mobile Spec</span>
                    <button
                      onClick={() => handleCopyJson(preset, preset.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {copiedId === preset.id ? (
                        <>
                          <Check size={13} className="text-blue-600" />
                          <span className="text-blue-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Salin JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabel Perbandingan Kotak */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-blue-600" />
                Tabel Rujukan Dimensi Tempat Sampah Kotak (Balok)
              </h4>
              <span className="text-[11px] font-bold text-slate-400">Satuan: cm & Liter</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-4">ID Preset</th>
                    <th className="py-3 px-4">Nama Ukuran</th>
                    <th className="py-3 px-4 text-center">Kapasitas (L)</th>
                    <th className="py-3 px-4 text-center">Panjang (cm)</th>
                    <th className="py-3 px-4 text-center">Lebar (cm)</th>
                    <th className="py-3 px-4 text-center">Tinggi (cm)</th>
                    <th className="py-3 px-4">Karakteristik & Penggunaan</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  {filteredKotak.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{item.id}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-100">{item.label}</td>
                      <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-slate-100">{item.capacity} L</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{item.panjang} cm</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{item.lebar} cm</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{item.tinggi} cm</td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs">{USE_CASE_KOTAK[item.id]}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleCopyJson(item, `table-${item.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Salin JSON"
                        >
                          {copiedId === `table-${item.id}` ? <Check size={14} className="text-blue-600" /> : <Copy size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Kalkulator & Simulator */}
      {activeTab === "kalkulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold mb-2">
                <Sliders size={14} />
                Live Parameter Testing
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Kalkulator Estimasi Volume & Pencocokan Preset
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Uji coba input dimensi fisik tempat sampah untuk mengetahui volume riil dalam liter dan mencari preset standar Indonesia yang paling pas.
              </p>
            </div>

            {/* Shape Switcher */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setCalcShape("tabung")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  calcShape === "tabung"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Cylinder size={15} />
                <span>Bentuk Tabung (Silinder)</span>
              </button>
              <button
                type="button"
                onClick={() => setCalcShape("kotak")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  calcShape === "kotak"
                    ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Box size={15} />
                <span>Bentuk Kotak (Balok)</span>
              </button>
            </div>

            {/* Form Inputs */}
            {calcShape === "tabung" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Diameter Alas (cm):</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{calcDiameter} cm</span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="1"
                    value={calcDiameter}
                    onChange={(e) => setCalcDiameter(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>15 cm</span>
                    <span>30 cm</span>
                    <span>45 cm</span>
                    <span>60 cm</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Tinggi Tempat Sampah (cm):</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{calcTinggiTabung} cm</span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="80"
                    step="1"
                    value={calcTinggiTabung}
                    onChange={(e) => setCalcTinggiTabung(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>15 cm</span>
                    <span>40 cm</span>
                    <span>60 cm</span>
                    <span>80 cm</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-mono space-y-1">
                  <div>Rumus: V = π × r² × t ÷ 1000</div>
                  <div>V = 3.1416 × ({(calcDiameter / 2).toFixed(1)})² × {calcTinggiTabung} ÷ 1000 = <span className="font-bold text-emerald-600">{calculatedVolume} Liter</span></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Panjang (cm):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{calcPanjang} cm</span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="70"
                    step="1"
                    value={calcPanjang}
                    onChange={(e) => setCalcPanjang(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Lebar (cm):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{calcLebar} cm</span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="1"
                    value={calcLebar}
                    onChange={(e) => setCalcLebar(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Tinggi (cm):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold">{calcTinggiKotak} cm</span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="80"
                    step="1"
                    value={calcTinggiKotak}
                    onChange={(e) => setCalcTinggiKotak(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-mono space-y-1">
                  <div>Rumus: V = p × l × t ÷ 1000</div>
                  <div>V = {calcPanjang} × {calcLebar} × {calcTinggiKotak} ÷ 1000 = <span className="font-bold text-blue-600">{calculatedVolume} Liter</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Result Card */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Hasil Perhitungan & Rekomendasi Template
              </h4>

              <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-center space-y-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Estimasi Kapasitas
                </span>
                <div className="text-5xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight">
                  {calculatedVolume} <span className="text-2xl font-bold text-emerald-600">Liter</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Dihitung otomatis berdasarkan input dimensi fisik di sisi kiri.
                </p>
              </div>

              {closestPreset && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Preset Terdekat yang Cocok:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      Deviasi: ±{closestPreset.diff} L
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Preset {closestPreset.preset.label} ({closestPreset.preset.capacity} Liter)
                      </p>
                      <p className="text-xs font-mono text-slate-400">
                        ID: {closestPreset.preset.id}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                    Warga dapat langsung memilih opsi <strong>"{closestPreset.preset.label}"</strong> di aplikasi mobile tanpa perlu mengukur secara manual dengan penggaris.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tips Warga:</strong> Di Indonesia, mayoritas tempat sampah rumah tangga berukuran <strong>10L hingga 25L</strong>, sedangkan tempat sampah luar rumah/pinggir jalan adalah <strong>40L hingga 70L</strong>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Panduan Integrasi Mobile Developer */}
      {activeTab === "api_docs" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold mb-2">
                  <Smartphone size={14} />
                  Dokumentasi Teman Mobile Developer
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Spesifikasi Integrasi Endpoint Preset Tempat Sampah
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kedua endpoint ini siap dikonsumsi oleh aplikasi mobile Flutter / Kotlin / React Native untuk dropdown pendaftaran tempat sampah warga.
                </p>
              </div>
            </div>

            {/* Endpoint 1: Tabung */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs">
                    GET
                  </span>
                  <code className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    /api/v1/bins/presets/tabung
                  </code>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Auth Required: Bearer Token (Semua Role)
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Mengambil daftar template ukuran untuk tempat sampah berbentuk tabung (silinder) dengan parameter <code>diameter</code> dan <code>tinggi</code>.
              </p>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`// Response Payload (200 OK)
{
  "status": "success",
  "message": "Berhasil mengambil preset tempat sampah tabung",
  "data": [
    { "id": "preset-t-1", "label": "Kecil", "capacity": 10.0, "diameter": 23, "tinggi": 24 },
    { "id": "preset-t-2", "label": "Sedang", "capacity": 20.0, "diameter": 29, "tinggi": 30 },
    { "id": "preset-t-3", "label": "Besar", "capacity": 40.0, "diameter": 36, "tinggi": 39 },
    { "id": "preset-t-4", "label": "Jumbo", "capacity": 60.0, "diameter": 40, "tinggi": 48 }
  ]
}`}
                </pre>
                <button
                  onClick={() => handleCopyJson(tabungList, "docs-tabung")}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Salin JSON Contoh"
                >
                  {copiedId === "docs-tabung" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Endpoint 2: Kotak */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                    GET
                  </span>
                  <code className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    /api/v1/bins/presets/kotak
                  </code>
                </div>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                  Auth Required: Bearer Token (Semua Role)
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Mengambil daftar template ukuran untuk tempat sampah berbentuk kotak (balok) dengan parameter <code>panjang</code>, <code>lebar</code>, dan <code>tinggi</code>.
              </p>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`// Response Payload (200 OK)
{
  "status": "success",
  "message": "Berhasil mengambil preset tempat sampah kotak",
  "data": [
    { "id": "preset-k-1", "label": "Kecil", "capacity": 12.0, "panjang": 25, "lebar": 20, "tinggi": 24 },
    { "id": "preset-k-2", "label": "Sedang", "capacity": 25.0, "panjang": 40, "lebar": 25, "tinggi": 25 },
    { "id": "preset-k-3", "label": "Besar", "capacity": 50.0, "panjang": 40, "lebar": 35, "tinggi": 36 },
    { "id": "preset-k-4", "label": "Jumbo", "capacity": 70.0, "panjang": 45, "lebar": 35, "tinggi": 45 }
  ]
}`}
                </pre>
                <button
                  onClick={() => handleCopyJson(kotakList, "docs-kotak")}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Salin JSON Contoh"
                >
                  {copiedId === "docs-kotak" ? <Check size={14} className="text-blue-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Field Dictionary */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
              <h5 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <Ruler size={14} />
                Keterangan Standar Satuan & Field:
              </h5>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li><code>id</code> (String): Identifier unik untuk referensi payload aktivasi mobile.</li>
                <li><code>label</code> (String): Nama tampilan ukuran di UI mobile (Kecil, Sedang, Besar, Jumbo).</li>
                <li><code>capacity</code> (Float): Total volume / kapasitas tampung dalam satuan <strong>Liter</strong>.</li>
                <li><code>tinggi</code> (Float): Tinggi tempat sampah dalam satuan <strong>sentimeter (cm)</strong>.</li>
                <li><code>diameter</code> (Float): Khusus tabung, diameter alas tempat sampah dalam satuan <strong>sentimeter (cm)</strong>.</li>
                <li><code>panjang & lebar</code> (Float): Khusus kotak, dimensi alas tempat sampah dalam satuan <strong>sentimeter (cm)</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterPresetTempatSampahPage;
