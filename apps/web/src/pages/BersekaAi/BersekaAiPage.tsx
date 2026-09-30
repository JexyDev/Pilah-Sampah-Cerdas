/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Mandiri BERSEKA AI: Asisten Analisis Cerdas Sistem
 * Menghubungkan langsung ke data operasional riil (KKN & Tata Kelola Sampah).
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  Copy,
  Check,
  Users,
  Trash2,
  Filter,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Zap,
  GraduationCap,
  Recycle,
  Database,
  ArrowUpRight,
} from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import showToast from "../../utils/showToast";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  isBlocked?: boolean;
  model?: string;
  timestamp: string;
}

export const BersekaAiPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"kkn" | "tata-kelola">(
    activeTabParam === "tata-kelola" ? "tata-kelola" : "kkn"
  );

  const { user } = useAuthStore();
  const userName = user?.name || "Pengguna";

  // State untuk data filter KKN
  const [kelompokList, setKelompokList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("");

  // State chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sinkronisasi tab dari query parameter URL
  useEffect(() => {
    if (activeTabParam === "tata-kelola" && activeTab !== "tata-kelola") {
      setActiveTab("tata-kelola");
    } else if (activeTabParam === "kkn" && activeTab !== "kkn") {
      setActiveTab("kkn");
    }
  }, [activeTabParam]);

  // Set initial welcome message saat tab berganti
  useEffect(() => {
    const welcomeText =
      activeTab === "kkn"
        ? "Halo! Saya BERSEKA AI, asisten analisis cerdas sistem. Anda dapat menanyakan analisis mendalam seputar 5 Pilar Kuliah Kerja Nyata, seperti tingkat kehadiran mahasiswa, kepatuhan geofence, progres program kerja, status verifikasi buku harian, atau peringkat posko mahasiswa."
        : "Halo! Saya BERSEKA AI, asisten analisis cerdas sistem. Anda dapat menanyakan analisis mendalam seputar 4 Pilar Tata Kelola Sampah, seperti latensi pengangkutan armada, status tempat sampah kritis, reduksi emisi karbon CO₂e, atau neraca material sirkular.";

    setMessages([
      {
        id: `welcome-${activeTab}`,
        sender: "ai",
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        model: "BERSEKA AI Autonomous Engine",
      },
    ]);
  }, [activeTab]);

  // Fetch daftar kelompok KKN untuk opsi filter
  useEffect(() => {
    const fetchKelompokOptions = async () => {
      try {
        const res = await api.get("/kelompok?limit=0");
        const list = res.data?.data || res.data?.groups;
        if (Array.isArray(list)) {
          setKelompokList(list);
        }
      } catch {
        try {
          const fallbackRes = await api.get("/kelompok-kkn");
          const list = fallbackRes.data?.data || fallbackRes.data?.groups;
          if (Array.isArray(list)) {
            setKelompokList(list);
          }
        } catch {
          // Non-blocking fallback
        }
      }
    };

    fetchKelompokOptions();
  }, []);

  // Auto scroll ke pesan terbawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleTabChange = (tab: "kkn" | "tata-kelola") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: String(Date.now()),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setLoading(true);

    const chatHistory = messages
      .filter((m) => !m.id.startsWith("welcome") && !m.isBlocked && m.text)
      .slice(-8)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      const response = await api.post("/analisis-sistem/chat", {
        prompt: textToSend,
        contextType: activeTab,
        kelompokId: activeTab === "kkn" && selectedKelompokId ? selectedKelompokId : undefined,
        history: chatHistory,
      });

      const resData = response.data?.data;
      const aiReply: Message = {
        id: String(Date.now() + 1),
        sender: "ai",
        text: resData?.reply || "Tidak ada tanggapan dari model analitik.",
        isBlocked: resData?.isBlocked,
        model: resData?.model,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: String(Date.now() + 1),
        sender: "ai",
        text:
          err.response?.data?.message ||
          "Gagal menghubungi server analitik AI. Pastikan server aktif dan koneksi internet stabil.",
        isBlocked: true,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const welcomeText =
      activeTab === "kkn"
        ? "Halo! Saya BERSEKA AI, asisten analisis cerdas sistem. Anda dapat menanyakan analisis mendalam seputar 5 Pilar Kuliah Kerja Nyata, seperti tingkat kehadiran mahasiswa, kepatuhan geofence, progres program kerja, status verifikasi buku harian, atau peringkat posko mahasiswa."
        : "Halo! Saya BERSEKA AI, asisten analisis cerdas sistem. Anda dapat menanyakan analisis mendalam seputar 4 Pilar Tata Kelola Sampah, seperti latensi pengangkutan armada, status tempat sampah kritis, reduksi emisi karbon CO₂e, atau neraca material sirkular.";

    setMessages([
      {
        id: `welcome-${activeTab}-${Date.now()}`,
        sender: "ai",
        text: `Percakapan telah diatur ulang.\n\n${welcomeText}`,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        model: "BERSEKA AI Autonomous Engine",
      },
    ]);
    showToast.success("Percakapan telah diatur ulang");
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast.success("Respon berhasil disalin ke papan klip");
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const quickPrompts =
    activeTab === "kkn"
      ? [
          {
            title: "Verifikasi Logbook",
            prompt: "Berapa rasio verifikasi buku harian saat ini dan kelompok mana dengan logbook terbanyak?",
            icon: Zap,
          },
          {
            title: "Kepatuhan Geofence",
            prompt: "Bagaimana rasio kepatuhan radius geofence posko mahasiswa dan kehadiran tepat waktu?",
            icon: ShieldCheck,
          },
          {
            title: "Peringkat Posko",
            prompt: "Siapa posko Kuliah Kerja Nyata dengan skor kinerja tertinggi saat ini?",
            icon: Users,
          },
          {
            title: "Distribusi Nilai Mahasiswa",
            prompt: "Bagaimana distribusi nilai evaluasi DPL dan total mahasiswa yang sudah dinilai?",
            icon: GraduationCap,
          },
        ]
      : [
          {
            title: "Latensi Armada",
            prompt: "Berapa rata-rata latensi pengangkutan sampah dan performa armada saat ini?",
            icon: Zap,
          },
          {
            title: "Tempat Sampah Kritis",
            prompt: "Bagaimana status tempat sampah yang saat ini berkategori penuh atau kritis?",
            icon: AlertCircle,
          },
          {
            title: "Reduksi Emisi CO₂e",
            prompt: "Berapa estimasi reduksi emisi gas rumah kaca CO₂e yang berhasil dicegah sistem?",
            icon: Recycle,
          },
          {
            title: "Partisipasi Warga",
            prompt: "Bagaimana rasio keaktifan warga dalam memilah sampah di tiap kelurahan?",
            icon: Users,
          },
        ];

  // Helper untuk rendering teks berformat sederhana (bold, list, bullet)
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }

          // Format bullet list
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const content = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#009966] font-black text-sm leading-tight">•</span>
                <span className="flex-1">{formatInlineStyles(content)}</span>
              </div>
            );
          }

          // Format numbered list
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#009966] font-bold text-xs shrink-0 mt-0.5">{numMatch[1]}.</span>
                <span className="flex-1">{formatInlineStyles(numMatch[2])}</span>
              </div>
            );
          }

          // Heading ###
          if (line.trim().startsWith("### ")) {
            return (
              <h4 key={idx} className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1">
                {line.trim().substring(4)}
              </h4>
            );
          }

          return <p key={idx}>{formatInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  // Format inline bold `**text**` dan code ` `code` `
  const formatInlineStyles = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-black text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      {/* 1. Bar Tajuk Eksekutif BERSEKA AI */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e5f7ed] to-emerald-100/70 dark:from-emerald-950/70 dark:to-slate-900 text-[#009966] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#009966]/25 dark:border-emerald-700/40 shadow-xs">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                BERSEKA AI
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-[#009966]/20">
                <Bot size={13} /> Asisten Cerdas
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Database size={11} className="text-[#009966]" /> Data Riil Langsung
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Eksplorasi wawasan berbasis kecerdasan buatan terhubung langsung ke basis data operasional BERSEKA.
            </p>
          </div>
        </div>

        {/* Switcher Tab Ekosistem */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0 self-start md:self-center">
          <button
            onClick={() => handleTabChange("kkn")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "kkn"
                ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <GraduationCap size={15} />
            <span>Kuliah Kerja Nyata</span>
          </button>
          <button
            onClick={() => handleTabChange("tata-kelola")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "tata-kelola"
                ? "bg-white dark:bg-slate-900 text-[#009966] dark:text-emerald-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Recycle size={15} />
            <span>Tata Kelola Sampah</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Bar Filter Posko KKN (Jika tab KKN aktif) */}
      {activeTab === "kkn" && kelompokList.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/60 px-5 py-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
            <Filter size={14} className="text-[#009966]" />
            <span>Fokus Analisis Posko:</span>
            <span className="text-slate-400 font-normal">
              (Pilih posko untuk menyaring analisis spesifik ke kelompok tertentu)
            </span>
          </div>
          <div className="relative min-w-[260px]">
            <select
              value={selectedKelompokId}
              onChange={(e) => setSelectedKelompokId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#009966] outline-none cursor-pointer"
            >
              <option value="">Semua Kelompok Kuliah Kerja Nyata (33 Posko)</option>
              {kelompokList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. Panel Kartu Pertanyaan Rekomendasi (Quick Prompts) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lightbulb size={13} className="text-amber-500" /> Contoh Pertanyaan Analisis Cepat
          </span>
          <button
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw size={12} />
            <span>Atur Ulang Obrolan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={loading}
                className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-[#009966]/40 dark:hover:border-emerald-600/40 text-left transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-[#009966] dark:group-hover:text-emerald-400 transition-colors">
                    <Icon size={14} className="text-[#009966] dark:text-emerald-400 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <ArrowUpRight
                    size={13}
                    className="text-slate-300 group-hover:text-[#009966] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                  "{item.prompt}"
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Konsol Chat Interaktif Layar Penuh */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col min-h-[520px]">
        {/* Chat Stream Area */}
        <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[600px] bg-slate-50/40 dark:bg-slate-950/20 text-xs sm:text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "ai" && (
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                    m.isBlocked
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800"
                      : "bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-[#009966]/25"
                  }`}
                >
                  {m.isBlocked ? <AlertCircle size={18} /> : <Bot size={18} />}
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-5 shadow-2xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#009966] text-white rounded-tr-xs"
                    : m.isBlocked
                    ? "bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-tl-xs"
                    : "bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-slate-800 dark:text-slate-100 rounded-tl-xs"
                }`}
              >
                {/* Isi Pesan */}
                <div className="text-xs sm:text-[13px] leading-relaxed">
                  {m.sender === "ai" ? renderFormattedText(m.text) : <p className="whitespace-pre-wrap">{m.text}</p>}
                </div>

                {/* Footer Pesan: Pengirim, Jam, dan Tombol Salin */}
                <div
                  className={`flex items-center justify-between gap-3 mt-3 pt-2 border-t text-[10px] ${
                    m.sender === "user"
                      ? "border-white/20 text-white/80"
                      : "border-slate-100 dark:border-slate-700/60 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{m.sender === "user" ? userName : m.model || "BERSEKA AI"}</span>
                    <span>•</span>
                    <span className="font-mono font-normal">{m.timestamp}</span>
                  </div>

                  {m.sender === "ai" && !m.isBlocked && (
                    <button
                      onClick={() => handleCopyText(m.id, m.text)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Salin jawaban"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check size={11} className="text-[#009966]" />
                          <span className="text-[#009966] font-bold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Animasi Memuat Analisis */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 border border-[#009966]/25 text-[#009966] flex items-center justify-center shrink-0 animate-pulse shadow-2xs">
                <Bot size={18} />
              </div>
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-3xl rounded-tl-xs p-4 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#009966] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#009966] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-[#009966] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Mengkoneksikan ke basis data riil & mengekstrak analitik cerdas...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Form */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-[#009966] focus-within:border-transparent transition-all"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                activeTab === "kkn"
                  ? "Tanyakan metrik kehadiran, logbook, program kerja, atau posko Kuliah Kerja Nyata..."
                  : "Tanyakan armada pengangkutan, sensor tempat sampah, reduksi emisi gas rumah kaca..."
              }
              disabled={loading}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="px-5 py-2.5 bg-[#009966] hover:bg-[#008855] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Kirim</span>
              <Send size={13} />
            </button>
          </form>

          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-[#009966]" />
              BERSEKA AI mengekstrak data operasional langsung dari basis data tanpa mengubah data riil.
            </span>
            <span className="hidden sm:inline font-mono">
              Mode: {activeTab === "kkn" ? "Kuliah Kerja Nyata" : "Tata Kelola Sampah"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BersekaAiPage;
