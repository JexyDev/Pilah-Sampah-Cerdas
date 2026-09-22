/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Khusus Pengembang: Developer Settings & Debug Controls
 * Hak Akses: STRICTLY DEVELOPER ONLY (Dilarang untuk SUPER_USER, PIMPINAN, dll.)
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Radio,
  BookOpen,
  LayoutDashboard,
  Filter,
  Sliders,
  Check,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import {
  isCurrentUserDeveloper,
  shouldHideTestAccounts,
  setHideTestAccountsSetting,
  HIDE_TEST_ACCOUNTS_KEY,
  isActuallyTestUser,
  isActuallyTestStudent,
} from "../../utils/filterTestingUtils";

export const DeveloperSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isDev = isCurrentUserDeveloper();

  // State
  const [hideTestAccounts, setHideTestAccounts] = useState<boolean>(() => shouldHideTestAccounts());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [serverSynced, setServerSynced] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Tester playground state
  const [testInputName, setTestInputName] = useState<string>("");
  const [testInputNim, setTestInputNim] = useState<string>("");
  const [testInputPhone, setTestInputPhone] = useState<string>("");
  const [testerResult, setTesterResult] = useState<{ isTest: boolean; reason?: string } | null>(null);

  // Sync with server on initial mount
  useEffect(() => {
    if (!isDev) return;

    let isMounted = true;
    const fetchServerConfig = async () => {
      try {
        setIsSyncing(true);
        const res = await api.get("/configs");
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          const cfg = res.data.data.find((c: any) => c.key === "dev_hide_test_accounts");
          if (cfg && cfg.value !== undefined) {
            const serverValue = cfg.value !== "false";
            setHideTestAccounts(serverValue);
            setHideTestAccountsSetting(serverValue);
            setServerSynced(true);
            setLastSyncTime(new Date().toLocaleTimeString("id-ID"));
          }
        }
      } catch (err: any) {
        // Jika offline atau belum ada di database, gunakan local storage
        if (isMounted) {
          setServerSynced(false);
          setLastSyncTime(new Date().toLocaleTimeString("id-ID") + " (Lokal)");
        }
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    fetchServerConfig();
    return () => {
      isMounted = false;
    };
  }, [isDev]);

  // Handle toggle switch
  const handleToggle = async () => {
    if (!isDev) {
      toast.error("Akses ditolak: Hanya peran DEVELOPER yang diizinkan mengubah setelan ini.");
      return;
    }

    const nextVal = !hideTestAccounts;
    setHideTestAccounts(nextVal);
    setHideTestAccountsSetting(nextVal);

    if (nextVal) {
      toast.success("Akun pengujian disembunyikan. Data operasional 100% data riil.", {
        icon: "🛡️",
        duration: 4000,
      });
    } else {
      toast("Mode Debug Aktif: Akun pengujian disertakan dalam kueri data.", {
        icon: "⚠️",
        duration: 5000,
      });
    }

    // Persist to server config
    try {
      setIsSyncing(true);
      await api.post("/configs", {
        key: "dev_hide_test_accounts",
        value: nextVal ? "true" : "false",
      });
      setServerSynced(true);
      setLastSyncTime(new Date().toLocaleTimeString("id-ID"));
    } catch (err: any) {
      console.warn("[DeveloperSettings] Gagal sinkronisasi ke server:", err.message);
      setServerSynced(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Run tester playground
  const handleRunTest = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser = {
      name: testInputName.trim() || undefined,
      nim: testInputNim.trim() || undefined,
      phone: testInputPhone.trim() || undefined,
    };

    const isTestU = isActuallyTestUser(mockUser);
    const isTestS = isActuallyTestStudent(mockUser);
    const isTest = isTestU || isTestS;

    let reason = "Data lolos verifikasi (Kategori Akun Riil)";
    if (isTest) {
      if (testInputNim && ["111222333", "12345678", "123456789", "999999999", "000000000"].includes(testInputNim.trim())) {
        reason = "Terdeteksi NIM Pengujian Khusus";
      } else if (testInputPhone && (testInputPhone.includes("12345678900") || testInputPhone.includes("811111111"))) {
        reason = "Terdeteksi Pola Nomor Ponsel Dummy / Sandbox";
      } else {
        reason = "Mengandung kata kunci dummy / uji coba terlarang";
      }
    }

    setTesterResult({ isTest, reason });
  };

  // Strict guard for non-developer roles
  if (!isDev) {
    return (
      <div className="p-8 max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Akses Ditolak: Khusus Pengembang (DEVELOPER)
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md text-sm">
          Halaman dan kontrol Developer Settings dilindungi secara ketat dan hanya dapat diakses
          oleh akun dengan peran <strong>DEVELOPER</strong>. Pengguna dengan peran {user?.peran || "Lainnya"} tidak
          diizinkan mengonfigurasi fitur ini.
        </p>
        <Link
          to="/"
          className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-all shadow-sm"
        >
          Kembali ke Dasbor Utama
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Terminal size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Developer Settings & Debug Controls
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  DEVELOPER ONLY
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  QC ITEM #2
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Pusat kontrol lingkungan teknis dan tata kelola akun pengujian. Pengaturan di sini
                hanya berdampak pada sesi pengembang dan tidak dapat diakses oleh SUPER_USER atau peran lainnya.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => {
                const nextVal = !hideTestAccounts;
                setHideTestAccounts(nextVal);
                setHideTestAccountsSetting(nextVal);
                toast.success("Status toggle lokal diperbarui");
              }}
              title="Reset ke default bersih"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 border border-white/10"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* PRIMARY CONTROLS: TOGGLE SEMBUNYIKAN AKUN PENGUJIAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  hideTestAccounts
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                }`}
              >
                {hideTestAccounts ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Sembunyikan Akun Pengujian
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Filter otomatis data dummy / akun uji coba di seluruh dasbor dan pemantauan
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={hideTestAccounts}
              onClick={handleToggle}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                hideTestAccounts
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform flex items-center justify-center ${
                  hideTestAccounts ? "translate-x-9 text-emerald-600" : "translate-x-1 text-slate-400"
                }`}
              >
                {hideTestAccounts ? <Check size={14} strokeWidth={3} /> : null}
              </span>
            </button>
          </div>

          {/* Current Status Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              hideTestAccounts
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {hideTestAccounts ? (
                  <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {hideTestAccounts
                      ? "AKTIF: 100% DATA RIIL OPERASIONAL"
                      : "NONAKTIF: MODE DEBUG (AKUN PENGUJIAN MUNCUL)"}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      hideTestAccounts
                        ? "bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                        : "bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                    }`}
                  >
                    {hideTestAccounts ? "Produksi / Bersih" : "Uji Coba Lapangan"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {hideTestAccounts
                    ? "Seluruh akun uji coba (NIM pengujian, nomor kontak dummy, nama mengandung kata kunci 'test'/'dummy') dicegah muncul pada Dasbor Eksekutif, Laporan Presensi, dan Rekap Nilai KKN."
                    : "Akun pengujian akan disertakan dalam kueri data backend dan ditampilkan pada antarmuka pengguna untuk keperluan verifikasi fitur dan validasi end-to-end."}
                </p>
              </div>
            </div>
          </div>

          {/* Sync Status & Meta */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverSynced ? "bg-emerald-500" : serverSynced === false ? "bg-amber-500" : "bg-slate-400"
                }`}
              />
              <span>
                Sinkronisasi Server:{" "}
                <strong>{serverSynced ? "Tersinkron" : serverSynced === false ? "Lokal Saja" : "Menunggu"}</strong>
              </span>
              {lastSyncTime && <span className="text-slate-400">({lastSyncTime})</span>}
            </div>

            <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              key: {HIDE_TEST_ACCOUNTS_KEY}
            </div>
          </div>
        </div>

        {/* SIDEBAR SHORTCUTS & INFO */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sliders size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Tautan Verifikasi Cepat
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Uji tampilan data dengan toggle aktif vs nonaktif pada modul-modul berikut:
          </p>

          <div className="space-y-2">
            <Link
              to="/kkn/eksekutif"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-semibold group border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard size={16} />
                <span>Dasbor Eksekutif KKN</span>
              </div>
              <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
            </Link>

            <Link
              to="/monitoring-absen"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-semibold group border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Filter size={16} />
                <span>Monitoring Presensi KKN</span>
              </div>
              <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
            </Link>

            <Link
              to="/developer/kelola-logbook"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-semibold group border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} />
                <span>CRUD Logbook Mahasiswa</span>
              </div>
              <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
            </Link>

            <Link
              to="/developer/inspeksi-zona"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-semibold group border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <Radio size={16} />
                <span>Inspeksi Zona KKN</span>
              </div>
              <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
            </Link>
          </div>
        </div>
      </div>

      {/* FILTER SIGNATURE & TESTER PLAYGROUND */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filter Rules Catalog */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Katalog Filter Anti-Testing (Defense-in-Depth)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aturan penyaringan yang aktif di modul <code>filterTestingUtils.ts</code>:
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Kata Kunci Terlarang (Blacklist Keywords)
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  "test",
                  "dummy",
                  "testing",
                  "percobaan",
                  "sample",
                  "tester",
                  "dpl test",
                  "kelompok test",
                ].map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[11px]"
                  >
                    "{kw}"
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                NIM Dummy Khusus
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[11px]">
                {["111222333", "12345678", "123456789", "999999999", "000000000"].map((nim) => (
                  <span
                    key={nim}
                    className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    {nim}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Pola Telepon Dummy / Sandbox
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                +628111111111 s/d +628111111118, 08123456789xx, 08999999999
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Tester Playground */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Zap size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Tester Validator Real-Time
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ketik nama, NIM, atau nomor HP untuk menguji apakah entri tersebut akan terdeteksi sebagai akun pengujian:
          </p>

          <form onSubmit={handleRunTest} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Pengguna / Kelompok
              </label>
              <input
                type="text"
                placeholder="Contoh: Mahasiswa Testing 1"
                value={testInputName}
                onChange={(e) => setTestInputName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  NIM / NIP
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 111222333"
                  value={testInputNim}
                  onChange={(e) => setTestInputNim(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={testInputPhone}
                  onChange={(e) => setTestInputPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Uji Deteksi Filter
            </button>
          </form>

          {testerResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                testerResult.isTest
                  ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-850 text-rose-800 dark:text-rose-300"
                  : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-850 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              <div className="mt-0.5">
                {testerResult.isTest ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              </div>
              <div>
                <span className="font-bold block">
                  {testerResult.isTest
                    ? "STATUS: TERDETEKSI SEBAGAI AKUN PENGUJIAN"
                    : "STATUS: LOLOS VERIFIKASI (AKUN RIIL)"}
                </span>
                <span className="text-[11px] opacity-90 mt-0.5 block">{testerResult.reason}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperSettingsPage;
