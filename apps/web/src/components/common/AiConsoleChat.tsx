/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * AI Console Chat for System Analysis (Powered by Hugging Face)
 * Strict Filtering: Terikat ketat pada domain Kuliah Kerja Nyata dan Tata Kelola Sampah
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Minimize2,
  Maximize2,
} from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  isBlocked?: boolean;
  model?: string;
  timestamp: string;
}

interface AiConsoleChatProps {
  contextType: "kkn" | "tata-kelola";
  kelompokId?: string;
}

export const AiConsoleChat: React.FC<AiConsoleChatProps> = ({ contextType, kelompokId }) => {
  const { user } = useAuthStore();
  const userName = user?.name || "Pengguna";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text:
        contextType === "kkn"
          ? "Halo! Saya BERSEKA AI, asisten analisis cerdas sistem. Anda dapat menanyakan analisis mendalam seputar 5 Pilar Kuliah Kerja Nyata, seperti tingkat kehadiran mahasiswa, kepatuhan geofence, progres program kerja, atau peringkat kinerja posko."
          : "Halo! Saya BERSEKA AI, asisten analisis cerdas sistem. Anda dapat menanyakan analisis mendalam seputar 4 Pilar Tata Kelola Sampah, seperti latensi pengangkutan armada, tingkat kritis sensor tempat sampah, reduksi emisi CO₂e, atau neraca material sirkular.",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      model: "BERSEKA AI",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts =
    contextType === "kkn"
      ? [
          "Berapa rasio verifikasi buku harian saat ini?",
          "Bagaimana kepatuhan radius geofence posko mahasiswa?",
          "Siapa posko Kuliah Kerja Nyata dengan skor kinerja tertinggi?",
        ]
      : [
          "Berapa rata-rata latensi pengangkutan sampah saat ini?",
          "Bagaimana status tempat sampah yang berkategori kritis?",
          "Berapa estimasi reduksi emisi CO₂e yang berhasil dicapai?",
        ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

    try {
      const response = await api.post("/analisis-sistem/chat", {
        prompt: textToSend,
        contextType,
        kelompokId: kelompokId || undefined,
      });

      const resData = response.data?.data;
      const aiReply: Message = {
        id: String(Date.now() + 1),
        sender: "ai",
        text: resData?.reply || "Tidak ada tanggapan dari model.",
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
          "Gagal menghubungi server analitik AI. Pastikan jaringan stabil.",
        isBlocked: true,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: String(Date.now()),
        sender: "ai",
        text: "Percakapan telah diatur ulang. Silakan ajukan analisis sistem yang ingin Anda ketahui.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        model: "BERSEKA AI",
      },
    ]);
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden mt-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 flex items-center justify-center font-black shadow-2xs border border-[#009966]/20">
            <Terminal size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                BERSEKA AI
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-[#009966]/20 flex items-center gap-1">
                <Sparkles size={10} /> Analisis Cerdas
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Akses Langsung: {contextType === "kkn" ? "Ekosistem Kuliah Kerja Nyata" : "Tata Kelola Sampah Berseka"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            title="Atur Ulang Percakapan"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Ciutkan Panel" : "Bentangkan Panel"}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Message Stream */}
          <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto font-sans text-xs sm:text-sm bg-white dark:bg-slate-900">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "ai" && (
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                      m.isBlocked
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800/60"
                        : "bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-[#009966]/20"
                    }`}
                  >
                    {m.isBlocked ? <AlertTriangle size={14} /> : <Bot size={14} />}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-2xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#009966] text-white rounded-tr-xs"
                      : m.isBlocked
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 rounded-tl-xs"
                      : "bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div
                    className={`flex items-center justify-between gap-3 mt-2.5 pt-1.5 border-t text-[10px] ${
                      m.sender === "user"
                        ? "border-white/20 text-white/80"
                        : "border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    <span className="font-medium">
                      {m.sender === "user" ? userName : m.model || "BERSEKA AI"}
                    </span>
                    <span className="font-mono">{m.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-xl bg-[#e5f7ed] dark:bg-emerald-950/60 border border-[#009966]/20 text-[#009966] flex items-center justify-center shrink-0 animate-pulse shadow-2xs">
                  <Bot size={14} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-xs p-3.5 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#009966] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#009966] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-[#009966] animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-slate-400 font-medium">Menganalisis data pilar Berseka...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-6 py-3 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider shrink-0 flex items-center gap-1">
              <ShieldCheck size={11} className="text-[#009966]" /> Pertanyaan Contoh:
            </span>
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-[#e5f7ed] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-[#009966] border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                contextType === "kkn"
                  ? "Tanyakan metrik kehadiran, buku harian, atau program kerja Kuliah Kerja Nyata..."
                  : "Tanyakan latensi angkut, status tempat sampah, atau emisi CO₂e..."
              }
              disabled={loading}
              className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#009966] focus:ring-1 focus:ring-[#009966] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="px-5 py-2.5 rounded-xl bg-[#009966] hover:bg-[#008855] text-white font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={13} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </>
      )}
    </section>
  );
};

