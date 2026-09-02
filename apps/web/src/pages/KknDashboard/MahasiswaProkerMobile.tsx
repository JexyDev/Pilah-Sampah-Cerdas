/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile Program Kerja & Posko View for Mahasiswa KKN
 */

import React, { useState, useEffect } from "react";
import {
  Target,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  RefreshCw,
  Trash2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import api from "../../utils/api";
import showToast from "../../utils/showToast";

export const MahasiswaProkerMobile: React.FC = () => {
  const [prokerList, setProkerList] = useState<any[]>([]);
  const [poskoList, setPoskoList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"proker" | "posko">("proker");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prokerRes, poskoRes] = await Promise.allSettled([
        api.get("/dpl/program-kerja"),
        api.get("/areas/posko"),
      ]);

      if (prokerRes.status === "fulfilled") {
        setProkerList(prokerRes.value.data?.data || []);
      }
      if (poskoRes.status === "fulfilled") {
        setPoskoList(poskoRes.value.data?.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat proker & posko", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Segmented Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Program Kerja &amp; Posko</h2>
            <p className="text-[11px] text-slate-500">Aktivitas ekosistem KKN lapangan</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("proker")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "proker"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Target size={14} />
            <span>Program Kerja ({prokerList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("posko")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "posko"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 size={14} />
            <span>Posko Wilayah ({poskoList.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Content List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw size={24} className="animate-spin text-emerald-600" />
          <span>Memuat data...</span>
        </div>
      ) : activeTab === "proker" ? (
        <div className="space-y-3">
          {prokerList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
              <Target size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold">Belum ada Program Kerja</p>
              <p className="text-[11px]">Daftar program kerja kelompok akan tampil di sini.</p>
            </div>
          ) : (
            prokerList.map((proker) => (
              <div
                key={proker.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {proker.kategori || "Program Utama"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      proker.status === "DISETUJUI" || proker.statusUsulan === "DISETUJUI"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : proker.status === "DITOLAK"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {proker.status || proker.statusUsulan || "Diusulkan"}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {proker.judul || proker.deskripsi?.slice(0, 50)}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proker.deskripsi}
                  </p>
                </div>

                {proker.waktuPelaksanaan && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Calendar size={11} />
                    <span>Jadwal: {proker.waktuPelaksanaan}</span>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {poskoList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
              <Building2 size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold">Belum ada Posko Terdaftar</p>
            </div>
          ) : (
            poskoList.map((posko) => (
              <div
                key={posko.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {posko.nama || posko.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">{posko.kelurahan ? `Kel. ${posko.kelurahan}` : "Wilayah Dampingan"}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  📍 {posko.alamat || "Alamat Posko KKN"}
                </p>
                {posko.latitude && posko.longitude && (
                  <p className="text-[10px] font-mono text-slate-400">
                    GPS: {Number(posko.latitude).toFixed(5)}, {Number(posko.longitude).toFixed(5)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
