'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/axios';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  improvements: string[];
  fixes: string[];
  patches: string[];
}

interface AppInfo {
  version: string;
  build: number;
  released_at: string;
  developer_note: string;
  size_bytes: number;
  size_label: string;
  available: boolean;
  platform: string;
  changelog: ChangelogEntry[];
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function formatDateID(s?: string): string {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const INSTALL_STEPS = [
  { title: 'Unduh berkas APK', desc: 'Tekan tombol unduh untuk menyimpan berkas pemasangan ke perangkat Android Anda.' },
  { title: 'Buka berkas APK', desc: 'Buka berkas pada folder unduhan, lalu ketuk untuk memulai pemasangan.' },
  { title: 'Izinkan sumber tidak dikenal', desc: 'Aktifkan izin pemasangan dari sumber tidak dikenal apabila diminta oleh sistem.' },
  { title: 'Masuk ke aplikasi', desc: 'Gunakan akun yang telah terdaftar pada sistem SESPIMMA untuk masuk.' },
];

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-sm">
      <span className="material-symbols-outlined text-[16px] text-primary dark:text-blue-400">{icon}</span>
      {label}
    </span>
  );
}

function ChangelogGroup({ label, tone, items }: { label: string; tone: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  const has = items.length > 0;
  return (
    <div className="border-t border-slate-200 dark:border-slate-800 first:border-t-0">
      <button
        type="button"
        onClick={() => has && setOpen((o) => !o)}
        disabled={!has}
        className="w-full flex items-center justify-between py-3 text-sm font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-default hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 -mx-2 rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full shadow-sm ${tone}`} />
          {label} <span className="text-slate-400 font-medium ml-1">({items.length})</span>
        </span>
        {has && <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>expand_more</span>}
      </button>
      {open && has && (
        <ul className="pb-4 px-2 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className={`mt-1.5 size-1.5 rounded-full shrink-0 ${tone} opacity-70`} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DownloadPage() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/app/info');
      setInfo(res.data);
    } catch {
      setInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInfo(); }, [fetchInfo]);

  const available = !!info?.available;
  const version = info?.version || '—';
  const sizeLabel = info?.size_label || '—';
  const changelog = info?.changelog ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex flex-col font-sans">
      {/* Background Decorators */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/20 rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-pulse pointer-events-none delay-1000" />
      <div className="fixed top-[40%] right-[10%] w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm hover:shadow transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Login
        </Link>
        <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-md">
          <div className="relative w-7 h-7 drop-shadow-md">
            <Image src="/logo_akpol.png" alt="SESPIMMA" fill className="object-contain" />
          </div>
          <span className="text-sm font-black tracking-widest text-slate-800 dark:text-slate-200 uppercase">SESPIMMA</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 py-10 md:py-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <span className="size-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary dark:border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Memuat informasi aplikasi...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Hero Section */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-blue-400 to-primary" />
              <div className="grid lg:grid-cols-[3fr_2fr] relative">
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-blue-500/20 text-primary dark:text-blue-400 text-xs font-bold tracking-widest uppercase w-max mb-6">
                    <span className="material-symbols-outlined text-[16px]">android</span>
                    Aplikasi Mobile
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    SESPIMMA
                  </h1>
                  <h2 className="mt-2 text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 dark:from-blue-400 dark:to-cyan-300 leading-snug">
                    Sistem Evaluasi dan Pengawasan Individu Membentuk Sumber Daya Manusia Maju
                  </h2>
                  <p className="mt-6 text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    Unduh aplikasi mobile resmi SESPIMMA untuk perangkat Android. Kelola absensi, lihat penilaian, laporkan aktivitas, dan pantau perkembangan secara langsung dan aman dari genggaman Anda.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Chip icon="android" label={info?.platform || 'Android 8.0+'} />
                    <Chip icon="sd_card" label={sizeLabel} />
                    <Chip icon="verified" label={`Versi ${version}`} />
                  </div>
                </div>

                <div className="bg-slate-100/50 dark:bg-slate-800/30 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-slate-800/80 p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute -right-20 -bottom-20 opacity-5">
                    <span className="material-symbols-outlined text-[300px]">android</span>
                  </div>
                  <div className="relative z-10 w-full max-w-[280px]">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Versi Rilis</p>
                    <p className="mt-2 text-5xl md:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter drop-shadow-sm">{version}</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <span className="material-symbols-outlined text-[18px] text-emerald-500">update</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {formatDateID(info?.released_at) || 'Terbaru'}
                      </span>
                    </div>

                    <div className="mt-8">
                      {available ? (
                        <a
                          href="/api/v1/app/download"
                          className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl font-bold text-white bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)] transition-all hover:-translate-y-1 active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-[24px]">download</span>
                          <span className="text-lg">Unduh APK</span>
                        </a>
                      ) : (
                        <div className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 cursor-not-allowed">
                          <span className="material-symbols-outlined">hourglass_empty</span>
                          Sedang Disiapkan
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Developer Note (If any) */}
            {info?.developer_note && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-md p-5 flex gap-4 items-start shadow-sm">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">lightbulb</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Informasi Developer</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200/80 mt-1 leading-relaxed">
                    {info.developer_note}
                  </p>
                </div>
              </div>
            )}

            {/* Two Column Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Petunjuk Pemasangan */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20 shadow-inner">
                    <span className="material-symbols-outlined text-[24px]">install_mobile</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cara Memasang</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Langkah instalasi di perangkat Android</p>
                  </div>
                </div>
                
                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8 pb-4">
                  {INSTALL_STEPS.map((s, i) => (
                    <div key={i} className="relative pl-8">
                      <span className="absolute -left-[17px] top-0.5 flex size-8 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-primary dark:border-blue-500 text-primary dark:text-blue-400 text-sm font-black shadow-sm">
                        {i + 1}
                      </span>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none pt-1">{s.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Changelog */}
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-8 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="size-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-500/20 shadow-inner">
                    <span className="material-symbols-outlined text-[24px]">history</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Riwayat Pembaruan</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Catatan perubahan dari versi-versi sebelumnya</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6 max-h-[450px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                  {changelog.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                      <span className="material-symbols-outlined text-4xl mb-3">auto_awesome</span>
                      <p className="text-sm font-medium">Belum ada catatan pembaruan</p>
                    </div>
                  ) : (
                    changelog.map((entry, idx) => (
                      <div key={idx} className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-3 gap-4">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{entry.title}</h4>
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2.5 py-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-md text-xs font-black text-slate-700 dark:text-slate-300">
                              v{entry.version}
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">{formatDateID(entry.date)}</p>
                          </div>
                        </div>
                        
                        {entry.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{entry.description}</p>
                        )}
                        
                        <div className="space-y-1">
                          <ChangelogGroup label="Peningkatan" tone="bg-blue-500" items={entry.improvements || []} />
                          <ChangelogGroup label="Perbaikan" tone="bg-amber-500" items={entry.fixes || []} />
                          <ChangelogGroup label="Patch Keamanan" tone="bg-purple-500" items={entry.patches || []} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center mt-auto">
        <p className="text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          © {new Date().getFullYear()} SESPIMMA LEMDIKLAT POLRI. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
