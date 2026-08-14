/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useState } from "react";
import {
  Info,
  BrainCircuit,
  Zap,
  Users,
  ShieldCheck,
  Server,
  Smartphone,
  Award,
  Sparkles,
  Cpu,
  BarChart3,
  MapPin,
  Globe,
  Lock,
  GraduationCap,
  Truck,
  Building2,
  Building,
  UserCheck,
  Shield,
  Briefcase
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";

const Informasi: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"EXECUTIVE" | "AI_MODEL" | "ROLES" | "TECH_STACK">("EXECUTIVE");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* 1. GLASSMORPHISM HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-900/20 border border-emerald-600/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-black backdrop-blur-md">
                <Sparkles size={14} className="animate-pulse" />
                Sistem Ekosistem TrashCare v{APP_CONFIG.version}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-extrabold backdrop-blur-md">
                <Globe size={13} /> Integrated Multi-Role Platform
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Informasi Sistem TrashCare
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-3xl font-medium leading-relaxed">
              Platform manajemen pemilahan sampah cerdas berbasis inferensi AI (<strong className="font-extrabold text-white">YOLOv8s-seg ONNX Engine</strong>), gamifikasi insentif poin warga, serta pemantauan telemetri real-time yang terintegrasi dari aplikasi mobile hingga dashboard eksekutif.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md text-center min-w-[140px]">
              <span className="text-[10px] font-black uppercase text-emerald-200 block">Status Platform</span>
              <span className="text-lg font-black text-white flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Aktif Stream
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE TAB NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab("EXECUTIVE")}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "EXECUTIVE"
              ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Info size={16} /> Ikhtisar Sistem &amp; Pilar Utama
        </button>

        <button
          onClick={() => setActiveTab("AI_MODEL")}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "AI_MODEL"
              ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <BrainCircuit size={16} /> Arsitektur Model AI ONNX
        </button>

        <button
          onClick={() => setActiveTab("ROLES")}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ROLES"
              ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Users size={16} /> Peran Pengguna (Mobile &amp; Web)
        </button>

        <button
          onClick={() => setActiveTab("TECH_STACK")}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "TECH_STACK"
              ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Cpu size={16} /> Arsitektur &amp; Teknologi System
        </button>
      </div>

      {/* 3. TAB CONTENT CARDS */}

      {/* TAB 1: EXECUTIVE & SYSTEM PILLARS */}
      {activeTab === "EXECUTIVE" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top 4 Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center shrink-0 font-bold">
                <BrainCircuit size={24} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Deteksi Sampah AI</span>
                <h3 className="text-xl font-black text-slate-800">2 Kelas Output</h3>
                <p className="text-[10.5px] font-bold text-emerald-600">Organik &amp; Anorganik</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold">
                <Award size={24} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Gamifikasi Insentif</span>
                <h3 className="text-xl font-black text-slate-800">Tabungan Poin</h3>
                <p className="text-[10.5px] font-bold text-sky-600">Reward Kepatuhan Warga</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                <MapPin size={24} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Hirarki Wilayah</span>
                <h3 className="text-xl font-black text-slate-800">5 Tingkatan</h3>
                <p className="text-[10.5px] font-bold text-indigo-600">Provinsi &rarr; Kota &rarr; RW</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                <Server size={24} />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Integritas Data</span>
                <h3 className="text-xl font-black text-slate-800">Real-Time Telemetri</h3>
                <p className="text-[10.5px] font-bold text-amber-600">Mobile &rarr; API &rarr; Dashboard</p>
              </div>
            </div>
          </div>

          {/* 4 Pilar Utama Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                <Zap size={20} />
              </div>
              <h3 className="text-base font-black text-slate-800">1. Smart Waste Classification (AI Engine)</h3>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Mengintegrasikan model instance segmentation YOLOv8 Small (<code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-800 border border-slate-200">yolov8s-seg</code>) berformat ONNX untuk mengklasifikasikan sampah menjadi dua kelompok utama (<strong className="font-extrabold text-emerald-700">Organik</strong> dan <strong className="font-extrabold text-amber-700">Anorganik</strong>) secara instan dari kamera ponsel warga.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Award size={20} />
              </div>
              <h3 className="text-base font-black text-slate-800">2. Gamifikasi &amp; Sistem Poin Warga</h3>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Setiap aktivitas pemilahan dan pengapalan sampah yang terekam pada wadah ber-QR Code akan dikonversi menjadi poin insentif, leaderboard lingkungan, serta riwayat partisipasi aktif warga.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <MapPin size={20} />
              </div>
              <h3 className="text-base font-black text-slate-800">3. Pemetaan Wilayah Terintegrasi</h3>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Manajemen data hierarki wilayah terstruktur mulai dari Provinsi, Kota/Kabupaten, Kecamatan, Kelurahan, hingga Rukun Warga (RW) untuk memastikan transparansi dan akurasi lokasi penugasan.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-black text-slate-800">4. Role-Based Access Control (RBAC)</h3>
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Sistem keamanan hak akses berlapis yang membedakan wewenang secara presisi antara Warga, Mahasiswa, DPL, Petugas Pemilah, Lurah, Camat, Pimpinan, Admin DLH, hingga Developer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI MODEL ARCHITECTURE */}
      {activeTab === "AI_MODEL" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                <BrainCircuit size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Model Spesifikasi AI TrashCare Engine</h3>
                <p className="text-xs font-semibold text-slate-400">YOLOv8 Small Instance Segmentation (yolov8s-seg.onnx)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Dimensi Input &amp; Format</span>
                <p className="text-lg font-black text-slate-800">640 x 640 RGB</p>
                <p className="text-xs text-slate-500 font-semibold">ONNX Runtime C++ CPU Engine</p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-700">mAP@50 Segmentation</span>
                <p className="text-lg font-black text-emerald-800">88.7% Score</p>
                <p className="text-xs text-emerald-600 font-semibold">Precision: 88.5% | Recall: 85.2%</p>
              </div>

              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase text-sky-700">Waktu Inferensi (Latency)</span>
                <p className="text-lg font-black text-sky-800">~150 ms / frame</p>
                <p className="text-xs text-sky-600 font-semibold">Optimized for Mobile Uploads</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Output Kelas AI (2 Kelas Utama)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-300">
                  <span className="font-black text-emerald-950 block">Kelas 0: ORGANIK</span>
                  Sisa makanan, dedaunan, buah-buahan, dan limbah hayati yang dapat diurai secara hayati (kompos/maggot BSF).
                </div>
                <div className="p-3 rounded-xl bg-amber-100/80 text-amber-900 font-bold border border-amber-300">
                  <span className="font-black text-amber-950 block">Kelas 1: ANORGANIK</span>
                  Plastik, kertas, botol sintetis, kaca, logam, serta material daur ulang dan residu non-organik.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER ROLES ECOSYSTEM (CATEGORIZED MOBILE VS WEB) */}
      {activeTab === "ROLES" && (
        <div className="space-y-8 animate-fade-in">
          {/* CATEGORY 1: PERAN APLIKASI MOBILE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#009966] flex items-center justify-center font-black text-sm">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">1. Peran Pengguna Aplikasi Mobile</h3>
                <p className="text-xs text-slate-400 font-semibold">Digunakan oleh Warga, Mahasiswa, dan Petugas Pemilah di lapangan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                  <Users size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Warga</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Mengunggah foto sampah, memindai QR Code wadah, memantau riwayat setoran, serta mengumpulkan poin insentif.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <GraduationCap size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Mahasiswa</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Melakukan pendampingan warga di lokasi penugasan RW, mendaftarkan akun warga, dan mengunggah log presisi.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Truck size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Petugas Pemilah</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Mencatat timbulan sampah fisik di lapangan dan mengonfirmasi kesesuaian antara fisik dan deteksi AI.
                </p>
              </div>
            </div>
          </div>

          {/* CATEGORY 2: PERAN WEB ADMIN DASHBOARD */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                <Server size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">2. Peran Pengguna Web Admin Dashboard</h3>
                <p className="text-xs text-slate-400 font-semibold">Digunakan untuk manajemen eksekutif, pengawasan wilayah, &amp; administrasi sistem</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#009966]/15 text-[#009966] flex items-center justify-center font-bold">
                  <Lock size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Developer</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Mengakses stream dataset audit read-only, memantau metrik kesehatan server VPS real-time, dan mengelola konfigurasi sistem.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Shield size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Super User</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Mengelola otentikasi akun, kontrol penuh RBAC (Role-Based Access Control), jejak audit log, dan administrasi platform.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Pimpinan</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Memantau dasbor eksekutif, rekapitulasi analitik kebersihan wilayah, serta evaluasi kebijakan strategis.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Briefcase size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Task Force</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Mengoordinasi tim lapangan, memantau penugasan lintas wilayah, dan mengawal indikator keberhasilan program.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Dosen Pembimbing Lapangan</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Memantau aktivitas mahasiswa, mengevaluasi laporan lapangan, dan mengonfirmasi verifikasi kegiatan.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#009966]/15 text-[#009966] flex items-center justify-center font-bold">
                  <BarChart3 size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Dinas Lingkungan Hidup</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Menganalisis statistik kebersihan wilayah kota/kabupaten, mengawasi pengangkutan residu, dan regulasi.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Building size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Camat</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Memantau rekapitulasi laporan kebersihan dan kepatuhan pemilahan di tingkat Kecamatan.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#009966]/15 text-[#009966] flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Lurah</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Memantau aktivitas pemilahan dan pengelolaan fasilitas kebersihan di tingkat Kelurahan.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-[#009966]/15 text-[#009966] flex items-center justify-center font-bold">
                  <MapPin size={18} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Rukun Warga</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Mengelola persetujuan aktivasi wadah sampah, pemetaan wilayah RW, serta koordinasi warga setempat.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TECH STACK ARCHITECTURE */}
      {activeTab === "TECH_STACK" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Cpu size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Arsitektur Teknologi TrashCare</h3>
              <p className="text-xs font-semibold text-slate-400">Teknologi Modern Terintegrasi End-to-End</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-700 block">Frontend Web</span>
              <p className="font-extrabold text-slate-800 text-sm">React + TypeScript</p>
              <p className="text-slate-500">Vite Build, Tailwind CSS Glassmorphism Design System, Lucide Icons</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase text-sky-700 block">Backend API</span>
              <p className="font-extrabold text-slate-800 text-sm">Node.js Express + Prisma</p>
              <p className="text-slate-500">PostgreSQL Database, Redis Cache Quota, JWT Auth &amp; Zod Validation</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-700 block">AI Microservice</span>
              <p className="font-extrabold text-slate-800 text-sm">Python FastAPI + ONNX</p>
              <p className="text-slate-500">YOLOv8s-seg ONNX Inference Engine, PIL &amp; NumPy Pipeline</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-black uppercase text-purple-700 block">Mobile App</span>
              <p className="font-extrabold text-slate-800 text-sm">Flutter Framework</p>
              <p className="text-slate-500">Dart, Camera Scan, QR Code Scanner, Secure Token Storage</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Informasi;
