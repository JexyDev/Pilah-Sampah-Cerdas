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
  Award,
  Sparkles,
  Cpu,
  MapPin,
  Globe,
  GraduationCap,
  Truck,
  Building2,
  Building,
  UserCheck,
  Briefcase,
  HelpCircle,
  Clock,
  BookOpen,
  Layers,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Scale,
  Smile,
  BarChart3,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import { useAuthStore } from "../../store/useAuthStore";

const Informasi: React.FC = () => {
  const { user } = useAuthStore();
  const isTechnicalRole = user?.peran === "SUPER_USER" || user?.peran === "DEVELOPER";

  // Tab State
  const [techTab, setTechTab] = useState<"EXECUTIVE" | "AI_MODEL" | "ROLES" | "TECH_STACK">("EXECUTIVE");
  const [userTab, setUserTab] = useState<"ROLE_GUIDE" | "WORKFLOW" | "FAQ">("ROLE_GUIDE");

  // Get Friendly Role Title & Context
  const getRoleInfo = () => {
    switch (user?.peran) {
      case "DPL":
      case "DOSEN_PEMBIMBING":
        return {
          title: "Dosen Pembimbing Lapangan (DPL)",
          desc: "Panduan pembimbingan akademik, verifikasi logbook presensi, validasi pengajuan izin mahasiswa, dan penginputan nilai akhir program KKN.",
          icon: GraduationCap,
          color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "RW":
        return {
          title: "Pengurus Rukun Warga (RW)",
          desc: "Panduan verifikasi data warga, persetujuan Tempat Sampah fisik (QR Code), pemantauan kepatuhan pemilahan, dan validasi inovasi daur ulang.",
          icon: Building2,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "PETUGAS_RESIDU":
        return {
          title: "Petugas Pengangkutan Residu",
          desc: "Panduan klaim tugas pengangkutan, jadwal window penjemputan residu harian, serta pencatatan timbangan fisik industri.",
          icon: Truck,
          color: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "MAHASISWA_KKN":
        return {
          title: "Mahasiswa KKN UNIKOM",
          desc: "Panduan presensi GPS geofencing harian, pendampingan pendaftaran warga & aktivasi tempat sampah, serta pengisian instrumen survei.",
          icon: UserCheck,
          color: "bg-sky-50 text-sky-700 border-sky-200",
        };
      case "LURAH":
      case "CAMAT":
      case "PEMIMPIN":
        return {
          title: user?.peran === "CAMAT" ? "Pemerintah Kecamatan (Camat)" : "Pemerintah Kelurahan (Lurah)",
          desc: "Panduan pemantauan eksekutif wilayah, evaluasi indeks kepatuhan median warga, dan monitoring eskalasi layanan pengangkutan sampah.",
          icon: Building,
          color: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "PANITIA_TASKFORCE":
        return {
          title: "Panitia Task Force KKN",
          desc: "Panduan koordinasi satgas KKN lintas 6 kelurahan, alokasi kelompok bimbingan DPL, impor survei baseline/endline, dan eskalasi izin darurat.",
          icon: Briefcase,
          color: "bg-teal-50 text-teal-700 border-teal-200",
        };
      case "WARGA":
        return {
          title: "Masyarakat / Warga",
          desc: "Panduan pemilahan sampah organik & anorganik, penyetoran sampah ber-QR, tabungan poin reward, dan katalog ide daur ulang.",
          icon: Smile,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      default:
        return {
          title: "Pengguna Sistem TrashCare",
          desc: "Panduan umum operasional dan standar prosedur pemilahan sampah terpadu Kecamatan Coblong.",
          icon: Users,
          color: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in text-slate-800">
      {/* ---------------- 1. HEADER BANNER ---------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-900/20 border border-emerald-600/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-black backdrop-blur-md">
                <Sparkles size={14} className="animate-pulse" />
                {isTechnicalRole ? `Sistem TrashCare v${APP_CONFIG.version}` : "Pusat Panduan & SOP"}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-extrabold backdrop-blur-md">
                <Globe size={13} /> Kecamatan Coblong
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {isTechnicalRole ? "Informasi Sistem TrashCare" : "Pusat Panduan & Informasi Operasional"}
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-3xl font-medium leading-relaxed">
              {isTechnicalRole
                ? `Platform manajemen pemilahan sampah cerdas berbasis inferensi AI, gamifikasi insentif poin warga, serta pemantauan telemetri real-time yang terintegrasi dari aplikasi mobile hingga dashboard eksekutif.`
                : `Pedoman resmi tata kelola pemilahan sampah cerdas terpadu di Kecamatan Coblong. Pelajari alur operasional pemilahan, standar prosedur layanan, serta panduan fitur sesuai tugas peran Anda.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-md text-center min-w-[150px]">
              <span className="text-[10px] font-black uppercase text-emerald-200 block">Status Layanan</span>
              <span className="text-base font-black text-white flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Operasional Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 2. TAB NAVIGATION ---------------- */}
      {isTechnicalRole ? (
        /* Tabs for Developer & Super User */
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            onClick={() => setTechTab("EXECUTIVE")}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              techTab === "EXECUTIVE"
                ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Info size={16} /> Ikhtisar Sistem &amp; Pilar
          </button>

          <button
            onClick={() => setTechTab("ROLES")}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              techTab === "ROLES"
                ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Users size={16} /> Struktur Peran Pengguna
          </button>

          <button
            onClick={() => setTechTab("AI_MODEL")}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              techTab === "AI_MODEL"
                ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <BrainCircuit size={16} /> Arsitektur Model AI ONNX
          </button>

          <button
            onClick={() => setTechTab("TECH_STACK")}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              techTab === "TECH_STACK"
                ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Cpu size={16} /> Arsitektur &amp; Teknologi Sistem
          </button>
        </div>
      ) : (
        /* Tabs for Operational Roles (DPL, RW, Petugas, Lurah, Camat, Mahasiswa, Warga, Taskforce) */
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            onClick={() => setUserTab("ROLE_GUIDE")}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              userTab === "ROLE_GUIDE"
                ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <BookOpen size={16} /> Panduan Peran Anda ({roleInfo.title.split(" ")[0]})
          </button>

          <button
            onClick={() => setUserTab("WORKFLOW")}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              userTab === "WORKFLOW"
                ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Layers size={16} /> Alur Kerja &amp; SOP Pemilahan
          </button>

          <button
            onClick={() => setUserTab("FAQ")}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
              userTab === "FAQ"
                ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <HelpCircle size={16} /> Tanya Jawab &amp; Bantuan
          </button>
        </div>
      )}

      {/* ---------------- 3. NON-TECHNICAL ROLE VIEWS ---------------- */}
      {!isTechnicalRole && (
        <>
          {/* TAB: ROLE GUIDE */}
          {userTab === "ROLE_GUIDE" && (
            <div className="space-y-6 animate-fade-in">
              {/* Role Welcome Card */}
              <div className={`p-6 rounded-3xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${roleInfo.color}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 border border-current flex items-center justify-center shrink-0 shadow-2xs">
                    <RoleIcon size={28} />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block opacity-75">Peran Aktif Anda</span>
                    <h2 className="text-xl sm:text-2xl font-black">{roleInfo.title}</h2>
                    <p className="text-xs font-semibold mt-0.5 max-w-2xl">{roleInfo.desc}</p>
                  </div>
                </div>
              </div>

              {/* Specific Guide Details based on user role */}
              {(user?.peran === "DPL" || user?.peran === "DOSEN_PEMBIMBING") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <GraduationCap size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">1. Penilaian Kinerja Mahasiswa KKN</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Buka menu <strong>Dasbor DPL</strong> &rarr; Tab <strong>Mahasiswa &amp; Nilai</strong>. Anda dapat melihat kehadiran, partisipasi dampingan warga, dan memasukkan nilai akhir mahasiswa bimbingan secara langsung.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                        <FileCheck size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">2. Validasi Permohonan Izin &amp; Sakit</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pada Tab <strong>Validasi Ketidakhadiran</strong>, periksa surat keterangan dokter/bukti izin mahasiswa. Anda dapat menyetujui, menolak, atau mengeskalasi permohonan izin lebih dari 3 hari ke Panitia Taskforce.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Sparkles size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">3. Pemantauan Inovasi &amp; Daur Ulang</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pantau perkembangan program inovasi lingkungan dan bank sampah warga binaan mahasiswa pada Tab <strong>Inovasi &amp; Hasil</strong> untuk bahan evaluasi laporan akhir KKN.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        <Clock size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">4. Ekspor Laporan Akademik</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Gunakan tombol <strong>Ekspor CSV</strong> dengan memilih periode waktu untuk mengunduh rekap nilai dan logbook mahasiswa guna keperluan pelaporan resmi ke LPPM UNIKOM.
                    </p>
                  </div>
                </div>
              )}

              {user?.peran === "RW" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                        <QrCode size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">1. Persetujuan Tempat Sampah Ber-QR</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Setiap kali mahasiswa KKN membantu pendaftaran tempat sampah warga di wilayah RW Anda, verifikasi dan berikan persetujuan di menu <strong>Manajemen Tempat Sampah</strong> agar QR Code aktif.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Users size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">2. Pemantauan Partisipasi Warga</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pantau jumlah setoran sampah terpilah warga di menu <strong>Pemantauan &amp; Rekapitulasi</strong> untuk melihat indeks kepatuhan dan keaktifan warga di setiap RT.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Zap size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">3. Fasilitas Kompos &amp; Rumah Maggot</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Catat data fasilitas pengolahan sampah mandiri (Loseda, Bata Terawang, Maggot) pada menu <strong>Pengolahan &amp; Inovasi</strong> secara berkala.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Award size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">4. Validasi Ide Inovasi Daur Ulang</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Setujui usulan ide daur ulang warga dampingan untuk mempublikasikannya ke feed komunitas dan memberikan reward +50 poin kepada warga.
                    </p>
                  </div>
                </div>
              )}

              {user?.peran === "PETUGAS_RESIDU" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Truck size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">1. Jadwal Pengangkutan Harian</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Penjemputan residu sampah dilakukan 2 kali sehari pada pukul <strong>06:00 - 08:00 WIB</strong> (Pagi) dan <strong>16:00 - 18:00 WIB</strong> (Sore) sesuai rute penugasan wilayah.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Scale size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">2. Input Timbangan Fisik</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Timbang sampah residu menggunakan timbangan industri fisik di titik kumpul, kemudian catat bobot riil (Kg) pada menu <strong>Pengumpulan &amp; Pengangkutan</strong>.
                    </p>
                  </div>
                </div>
              )}

              {(user?.peran === "CAMAT" || user?.peran === "LURAH" || user?.peran === "PEMIMPIN") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Building size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">1. Monitoring Spasial &amp; Peta Wilayah</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pantau sebaran tempat sampah dan status pengangkutan residu secara real-time pada menu <strong>Peta Wilayah</strong> dengan batas administrasi kelurahan Anda.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                        <BarChart3 size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">2. Evaluasi Indeks Kepatuhan Wilayah</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Lihat perbandingan kepatuhan pemilahan antar-RW berbasis nilai median statistik pada menu <strong>Pemantauan &amp; Rekapitulasi</strong> untuk bahan kebijakan kelurahan.
                    </p>
                  </div>
                </div>
              )}

              {user?.peran === "PANITIA_TASKFORCE" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        <Users size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">1. Ekosistem &amp; Alokasi Kelompok</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Kelola kelompok KKN, penugasan DPL, dan alokasi ketua kelompok di menu <strong>Ekosistem Dampingan</strong> untuk 6 kelurahan di Kecamatan Coblong.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <AlertTriangle size={20} />
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900">2. Eskalasi Izin Mahasiswa</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Periksa dan putuskan pengajuan izin/sakit mahasiswa yang dieskalasi DPL langsung dari panel eskalasi di <strong>Dasbor KKN Taskforce</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: WORKFLOW & SOP */}
          {userTab === "WORKFLOW" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                    <Layers className="text-[#009966]" size={22} />
                    Standar Operasional Prosedur (SOP) Pemilahan Sampah
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Alur baku pemilahan sampah cerdas dari rumah tangga hingga fasilitas hilir
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#009966] text-white text-xs font-black flex items-center justify-center">1</span>
                    <h4 className="font-black text-sm text-slate-900">Pilah di Rumah Tangga</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Warga memisahkan sampah menjadi 2 wadah: <strong>Tempat Sampah Organik</strong> (sisa makanan/daun) dan <strong>Tempat Sampah Anorganik</strong> (plastik/kertas).
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#009966] text-white text-xs font-black flex items-center justify-center">2</span>
                    <h4 className="font-black text-sm text-slate-900">Foto &amp; Scan QR Code</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Buka aplikasi mobile, ambil foto sampah untuk verifikasi otomatis, lalu pindai QR Code pada tempat sampah fisik warga.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#009966] text-white text-xs font-black flex items-center justify-center">3</span>
                    <h4 className="font-black text-sm text-slate-900">Pengangkutan &amp; Poin</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Petugas mengangkut sampah residu sesuai jadwal, menimbang hasil, dan warga otomatis mendapatkan akumulasi poin reward.
                    </p>
                  </div>
                </div>

                {/* Important Rules Box */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-medium space-y-1.5">
                  <p className="font-black text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    Ketentuan Waktu Operasional &amp; Masa Aktif:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
                    <li>Jam Penjemputan Residu: <strong>06:00 - 08:00 WIB</strong> dan <strong>16:00 - 18:00 WIB</strong>.</li>
                    <li>Masa Aktif Tempat Sampah: <strong>30 hari</strong> (otomatis diperpanjang setiap ada setoran yang disetujui).</li>
                    <li>Tempat sampah non-aktif dapat diaktifkan kembali melalui permohonan ke pengurus RW setempat.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FAQ */}
          {userTab === "FAQ" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <HelpCircle className="text-[#009966]" size={22} />
                  Pertanyaan yang Sering Diajukan (FAQ)
                </h3>

                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-xs text-slate-900">Q: Bagaimana jika tempat sampah warga belum terpasang stiker QR Code?</h4>
                    <p className="text-xs text-slate-600">A: Mahasiswa KKN bersama pengurus RW akan membagikan stiker QR Code resmi dan membantu proses aktivasi awal di lokasi rumah warga.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-xs text-slate-900">Q: Apa yang harus dilakukan jika tempat sampah sudah penuh sebelum jadwal angkut?</h4>
                    <p className="text-xs text-slate-600">A: Warga dapat mengunggah foto tempat sampah penuh di aplikasi mobile untuk mengirimkan notifikasi prioritas penjemputan ke petugas residu terdekat.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <h4 className="font-bold text-xs text-slate-900">Q: Ke mana saya dapat menghubungi bantuan teknis jika terjadi kendala?</h4>
                    <p className="text-xs text-slate-600">A: Hubungi Tim Pendamping KKN UNIKOM di posko kelurahan masing-masing atau melalui kanal resmi Dinas Lingkungan Hidup.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------------- 4. TECHNICAL ROLE VIEWS (SUPER USER & DEVELOPER ONLY) ---------------- */}
      {isTechnicalRole && (
        <>
          {/* TAB: EXECUTIVE */}
          {techTab === "EXECUTIVE" && (
            <div className="space-y-6 animate-fade-in">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center font-bold">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-base font-black text-slate-800">1. Smart Waste Classification (AI Engine)</h3>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Mengintegrasikan model instance segmentation YOLOv8 Small berformat ONNX untuk mengklasifikasikan sampah menjadi dua kelompok utama (Organik dan Anorganik) secara instan dari kamera ponsel warga.
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Award size={20} />
                  </div>
                  <h3 className="text-base font-black text-slate-800">2. Gamifikasi &amp; Sistem Poin Warga</h3>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Setiap aktivitas pemilahan dan pengapalan sampah yang terekam pada Tempat Sampah ber-QR Code akan dikonversi menjadi poin insentif, leaderboard lingkungan, serta riwayat partisipasi aktif warga.
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

          {/* TAB: ROLES */}
          {techTab === "ROLES" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { role: "Warga", icon: Users, desc: "Akses Mobile: Foto sampah AI, scan QR Tempat Sampah, riwayat setoran, poin reward, dan ide daur ulang." },
                  { role: "Mahasiswa KKN", icon: GraduationCap, desc: "Akses Mobile & Web: Presensi GPS, pendampingan aktivasi QR warga, verifikasi tempat sampah, dan pengisian survei." },
                  { role: "Dosen Pembimbing (DPL)", icon: UserCheck, desc: "Akses Web Portal: Monitoring mahasiswa bimbingan, penilaian kinerja KKN, validasi permohonan izin/sakit." },
                  { role: "Petugas Residu", icon: Truck, desc: "Akses Mobile & Web: Jadwal pengangkutan, rute TPS, klaim tugas penjemputan, dan input timbangan fisik." },
                  { role: "Rukun Warga (RW)", icon: Building2, desc: "Akses Web: Persetujuan tempat sampah warga, monitoring kepatuhan RW, fasilitas pengolahan, dan ide inovasi." },
                  { role: "Lurah & Camat", icon: Building, desc: "Akses Web Read-Only: Monitoring spasial agregasi wilayah, statistik median kepatuhan, dan eskalasi layanan." },
                  { role: "Admin DLH & Super User", icon: ShieldCheck, desc: "Akses Web Penuh: Manajemen master data, approval diskrepansi AI, rule engine bobot, dan audit sistem." },
                  { role: "Developer", icon: Cpu, desc: "Akses Teknis: Monitoring log aktivitas sistem, dataset training AI, simulasi inferensi model, dan manajemen konfigurasi." },
                ].map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2.5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#009966] flex items-center justify-center font-bold">
                          <ItemIcon size={18} />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800">{item.role}</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: AI MODEL */}
          {techTab === "AI_MODEL" && (
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
              </div>
            </div>
          )}

          {/* TAB: TECH STACK */}
          {techTab === "TECH_STACK" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Server size={18} className="text-[#009966]" /> Backend &amp; Database Architecture
                  </h3>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>• Node.js &amp; Express.js (Clean Architecture Repository Pattern)</p>
                    <p>• PostgreSQL Relational Database with Prisma ORM</p>
                    <p>• JWT Authentication with Bcrypt Password Security</p>
                    <p>• Automated Deployment via GitHub Actions CI/CD to Ubuntu VPS</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Cpu size={18} className="text-sky-600" /> Frontend &amp; Mobile Architecture
                  </h3>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>• React 18, TypeScript, Tailwind CSS, Vite Build Engine</p>
                    <p>• Flutter Mobile Framework (GetX State Management, Camera, GPS)</p>
                    <p>• Leaflet GIS Interactive GeoJSON Polygons &amp; Bounding Boxes</p>
                    <p>• Recharts Reactive Real-Time Data Visualizations</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Informasi;

