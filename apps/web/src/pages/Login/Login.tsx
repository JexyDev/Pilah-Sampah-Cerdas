/**
 * Project: TrashCare Login Page (Modern Clean 2-Column Split Layout & HD Vector Logo)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Server,
  WifiOff,
  Lock,
  EyeOff,
  Eye,
  AlertCircle,
  AlertTriangle,
  X,
  CheckCircle2,
  RefreshCcw,
  Phone,
  LogIn,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api";

// Exact Vector SVG Icon matching the TrashCare logo
const TrashCareLogoIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="-6 -8 112 116" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M 25 54 A 31 31 0 1 1 76 34" fill="none" stroke="#0284c7" strokeWidth="7.5" strokeLinecap="round" />
    <polygon points="76,20 88,36 68,36" fill="#0284c7" />
    <path d="M 76 46 A 31 31 0 0 1 25 64" fill="none" stroke="#16a34a" strokeWidth="7.5" strokeLinecap="round" />
    <rect x="36" y="27" width="28" height="6" rx="2" fill="#0284c7" />
    <path d="M43 27 C43 23 57 23 57 27 Z" fill="#0284c7" />
    <path d="M38 35 L41 68 C41 71 44 73 48 73 L52 73 L48 55 C48 45 58 40 62 35 Z" fill="#0284c7" />
    <path d="M 46 68 C 46 47 70 41 70 41 C 70 41 74 61 58 68 C 50 71 46 68 46 68 Z" fill="#16a34a" />
    <path d="M 48 66 Q 58 56 68 43" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// ─── Aturan validasi nomor HP ────────────────────────────────────────────────
// Hanya menerima format nomor telepon Indonesia: 08xxx, 628xxx, +628xxx, 8xxx
// Minimal 10 digit setelah kode negara, maksimal 13 digit.
const PHONE_REGEX = /^\+628[1-9]\d{7,11}$/;

function normalizePhone(val: string): string {
  let t = val.trim().replace(/[\s\-().]/g, "");
  if (t.startsWith("08")) return "+62" + t.slice(1);
  if (t.startsWith("8")) return "+62" + t;
  if (t.startsWith("628") && !t.startsWith("+")) return "+" + t;
  return t;
}

function isPhoneValid(val: string): boolean {
  return PHONE_REGEX.test(normalizePhone(val));
}

// ─── Aturan validasi password ────────────────────────────────────────────────
// Minimal 8 karakter, wajib mengandung huruf dan angka.
const PASSWORD_MIN_LEN = 8;
function isPasswordValid(pw: string): { ok: boolean; reason?: string } {
  if (pw.length < PASSWORD_MIN_LEN) return { ok: false, reason: `Kata sandi minimal ${PASSWORD_MIN_LEN} karakter` };
  if (!/[A-Za-z]/.test(pw)) return { ok: false, reason: "Kata sandi harus mengandung minimal 1 huruf" };
  if (!/\d/.test(pw)) return { ok: false, reason: "Kata sandi harus mengandung minimal 1 angka" };
  return { ok: true };
}

// ─── Lupa Password (3 langkah) ───────────────────────────────────────────────
type ForgotStep = "phone" | "otp" | "new_password";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<ForgotStep>("phone");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Langkah 1: Kirim OTP ──
  const handleRequestOtp = async () => {
    const normalized = normalizePhone(phone);
    if (!isPhoneValid(normalized)) {
      setPhoneError("Format nomor HP tidak valid. Contoh: 08123456789 atau +6281234567890");
      return;
    }
    setPhoneError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/request-otp", { phone: normalized });
      const data = res.data;
      // Di development, tampilkan OTP untuk testing
      if (data.devOtp) {
        toast.success(`[DEV] Kode OTP: ${data.devOtp}`, { duration: 15000 });
      } else {
        toast.success("Kode OTP telah dikirim ke WhatsApp Anda!");
      }
      setStep("otp");
      startResendCooldown();
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("PHONE_NOT_REGISTERED") || msg.includes("tidak terdaftar")) {
        setPhoneError("Nomor HP ini tidak terdaftar di sistem TrashCare");
      } else if (msg.includes("USER_INACTIVE") || msg.includes("tidak aktif")) {
        setPhoneError("Akun dengan nomor ini tidak aktif");
      } else {
        toast.error("Gagal mengirim OTP. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Langkah 2: Verifikasi OTP ──
  const handleVerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length < 6 || !/^\d{6}$/.test(otpStr)) {
      setOtpError("Masukkan 6 digit kode OTP yang dikirim via WhatsApp");
      return;
    }
    setOtpError("");
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const res = await api.post("/auth/verify-otp", { phone: normalized, otp: otpStr });
      const token = res.data?.data?.resetToken || res.data?.resetToken;
      if (!token) throw new Error("Token tidak ditemukan");
      setResetToken(token);
      setStep("new_password");
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("OTP_EXPIRED") || msg.includes("kedaluwarsa")) {
        setOtpError("Kode OTP telah kedaluwarsa. Minta ulang kode baru.");
      } else if (msg.includes("OTP_INVALID") || msg.includes("salah")) {
        setOtpError("Kode OTP tidak sesuai. Periksa kembali kode yang dikirimkan.");
      } else {
        setOtpError("Verifikasi gagal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Langkah 3: Set Password Baru ──
  const handleResetPassword = async () => {
    const validation = isPasswordValid(newPassword);
    if (!validation.ok) { setPwError(validation.reason!); return; }
    if (newPassword !== confirmPassword) { setPwError("Konfirmasi kata sandi tidak cocok"); return; }
    setPwError("");
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      await api.post("/auth/reset-password", {
        phone: normalized,
        resetToken,
        newPassword,
      });
      toast.success("Kata sandi berhasil diperbarui! Silakan masuk kembali.");
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("RESET_TOKEN_INVALID") || msg.includes("token")) {
        setPwError("Sesi reset telah kedaluwarsa. Mulai ulang proses lupa kata sandi.");
      } else {
        setPwError("Gagal memperbarui kata sandi. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Input handler (6 kotak) ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Hanya digit
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <KeyRound size={22} />
            <div>
              <h2 className="font-black text-base leading-tight">Lupa Kata Sandi</h2>
              <p className="text-emerald-100 text-[11px] font-medium">
                {step === "phone" && "Langkah 1 dari 3 — Verifikasi Nomor HP"}
                {step === "otp" && "Langkah 2 dari 3 — Masukkan Kode OTP"}
                {step === "new_password" && "Langkah 3 dari 3 — Buat Kata Sandi Baru"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: step === "phone" ? "33%" : step === "otp" ? "66%" : "100%" }}
          />
        </div>

        <div className="p-6 space-y-5">
          {/* ── Step 1: Nomor HP ── */}
          {step === "phone" && (
            <>
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <MessageSquare size={28} className="text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600 font-medium mt-3">
                  Masukkan nomor HP yang terdaftar. Kode OTP 6 digit akan dikirimkan ke WhatsApp Anda.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Nomor HP Terdaftar
                </label>
                {/* Aturan validasi yang ditampilkan */}
                <div className="text-[10px] text-slate-400 font-medium bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 space-y-0.5">
                  <p>✓ Hanya angka — format nomor Indonesia (+62/08/628)</p>
                  <p>✓ Contoh: 08123456789 atau +6281234567890</p>
                  <p>✓ Panjang: 10–13 digit (setelah kode negara)</p>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    className={`w-full pl-10 pr-4 h-12 bg-slate-50 border ${phoneError ? "border-rose-500" : "border-slate-200 focus:border-emerald-600"} rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all`}
                    placeholder="08123456789 atau +6281234567890"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      // Tolak karakter selain digit, +, spasi
                      const val = e.target.value.replace(/[^\d+\s]/g, "");
                      setPhone(val);
                      if (phoneError) setPhoneError("");
                    }}
                    onKeyDown={(e) => {
                      // Blokir huruf & simbol (izinkan: digit, +, backspace, arrow, tab)
                      if (!/[\d+\s]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Enter"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => {
                      if (phone && !isPhoneValid(phone)) {
                        setPhoneError("Format nomor HP tidak valid. Contoh: 08123456789");
                      }
                    }}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertTriangle size={11} />{phoneError}
                  </p>
                )}
              </div>

              <button
                onClick={handleRequestOtp}
                disabled={loading || !phone.trim()}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <><RefreshCcw className="animate-spin" size={16} /><span>Mengirim OTP...</span></> : <><MessageSquare size={16} /><span>Kirim Kode OTP via WhatsApp</span></>}
              </button>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <ShieldCheck size={28} className="text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600 font-medium mt-3">
                  Kode OTP 6 digit dikirim ke WhatsApp{" "}
                  <strong className="text-slate-800">{normalizePhone(phone)}</strong>.
                </p>
                <p className="text-[11px] text-slate-400">Periksa WhatsApp Anda. Kode berlaku 5 menit.</p>
              </div>

              {/* 6 kotak OTP */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    className={`w-11 h-14 text-center text-xl font-black border-2 ${otpError ? "border-rose-400" : "border-slate-200 focus:border-emerald-600"} rounded-xl bg-slate-50 outline-none transition-all`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {otpError && (
                <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1 justify-center">
                  <AlertTriangle size={12} />{otpError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }}
                  className="flex-1 h-11 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={15} /> Kembali
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join("").length < 6}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <><RefreshCcw className="animate-spin" size={15} /><span>Memverifikasi...</span></> : "Verifikasi OTP →"}
                </button>
              </div>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-[11px] text-slate-400 font-medium">
                    Kirim ulang kode dalam <strong className="text-emerald-600">{resendCooldown} detik</strong>
                  </p>
                ) : (
                  <button
                    onClick={() => { handleRequestOtp(); }}
                    disabled={loading}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                  >
                    Tidak menerima kode? Kirim ulang →
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Step 3: Password Baru ── */}
          {step === "new_password" && (
            <>
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <Lock size={28} className="text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600 font-medium mt-3">
                  Buat kata sandi baru yang kuat untuk akun Anda.
                </p>
              </div>

              {/* Aturan password */}
              <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 space-y-1">
                <p className="font-black text-slate-700 uppercase tracking-wider mb-1.5">Ketentuan Kata Sandi:</p>
                <p className={newPassword.length >= PASSWORD_MIN_LEN ? "text-emerald-600 font-bold" : ""}>
                  {newPassword.length >= PASSWORD_MIN_LEN ? "✓" : "○"} Minimal {PASSWORD_MIN_LEN} karakter
                </p>
                <p className={/[A-Za-z]/.test(newPassword) ? "text-emerald-600 font-bold" : ""}>
                  {/[A-Za-z]/.test(newPassword) ? "✓" : "○"} Mengandung minimal 1 huruf (a–z atau A–Z)
                </p>
                <p className={/\d/.test(newPassword) ? "text-emerald-600 font-bold" : ""}>
                  {/\d/.test(newPassword) ? "✓" : "○"} Mengandung minimal 1 angka (0–9)
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      className={`w-full pl-10 pr-10 h-12 bg-slate-50 border ${pwError ? "border-rose-500" : "border-slate-200 focus:border-emerald-600"} rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all`}
                      placeholder="Kata sandi baru (min. 8 karakter)"
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (pwError) setPwError(""); }}
                      disabled={loading}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 cursor-pointer">
                      {showNewPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Konfirmasi Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      className={`w-full pl-10 pr-10 h-12 bg-slate-50 border ${(pwError && confirmPassword) ? "border-rose-500" : "border-slate-200 focus:border-emerald-600"} rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all`}
                      placeholder="Ulangi kata sandi baru"
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (pwError) setPwError(""); }}
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 cursor-pointer">
                      {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              </div>

              {pwError && (
                <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                  <AlertTriangle size={12} />{pwError}
                </p>
              )}

              <button
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <><RefreshCcw className="animate-spin" size={16} /><span>Menyimpan...</span></> : <><CheckCircle2 size={18} /><span>Simpan Kata Sandi Baru</span></>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: isStoreLoading } = useAuthStore();

  // Login State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UX State
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Validation States
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleIdentifierBlur = () => {
    const normalized = normalizePhone(identifier);
    if (normalized !== identifier && normalized) setIdentifier(normalized);
    if (!normalized) {
      setIdentifierError("Nomor HP wajib diisi");
    } else if (!isPhoneValid(normalized)) {
      setIdentifierError("Format nomor HP tidak valid. Contoh: 08123456789");
    } else {
      setIdentifierError("");
    }
  };

  const handlePasswordBlur = () => {
    const trimmed = password.trim();
    if (!trimmed) { setPasswordError("Kata sandi wajib diisi"); return; }
    const v = isPasswordValid(trimmed);
    if (!v.ok) setPasswordError(v.reason!);
    else setPasswordError("");
  };

  const isFormInvalid = !identifier.trim() || !password.trim() || !!identifierError || !!passwordError;
  const isBtnDisabled = isStoreLoading || isLocalLoading || showSuccessOverlay || isFormInvalid;

  const showToast = (message: string, type: "error" | "warning" | "server" | "network" = "error", retryAction?: () => void) => {
    toast.custom(
      (t) => (
        <div className={`${t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"} transform transition-all duration-300 max-w-sm w-full bg-white shadow-xl rounded-xl pointer-events-auto flex border border-slate-200 p-4 gap-3 items-center`}>
          <div className="flex-shrink-0 flex items-center">
            {type === "error" && <AlertCircle className="text-red-500" size={24} />}
            {type === "warning" && <AlertTriangle className="text-amber-500" size={24} />}
            {type === "server" && <Server className="text-red-500 animate-pulse" size={24} />}
            {type === "network" && <WifiOff className="text-red-500 animate-pulse" size={24} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 leading-normal">{message}</p>
            {retryAction && (
              <button type="button" onClick={() => { toast.dismiss(t.id); retryAction(); }} className="mt-2 text-[10px] text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer">Coba Lagi</button>
            )}
          </div>
          <button type="button" onClick={() => toast.dismiss(t.id)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      ),
      { position: "top-right", duration: type === "server" || type === "network" ? 7000 : 4000 }
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStoreLoading || isLocalLoading || showSuccessOverlay) return;

    const idVal = normalizePhone(identifier);
    if (idVal !== identifier) setIdentifier(idVal);
    const passVal = password.trim();
    let hasError = false;

    if (!idVal) {
      setIdentifierError("Nomor HP wajib diisi");
      hasError = true;
    } else if (!isPhoneValid(idVal)) {
      setIdentifierError("Format nomor HP tidak valid. Contoh: 08123456789");
      hasError = true;
    }

    if (!passVal) { setPasswordError("Kata sandi wajib diisi"); hasError = true; }
    else {
      const v = isPasswordValid(passVal);
      if (!v.ok) { setPasswordError(v.reason!); hasError = true; }
    }

    if (hasError) return;

    setIsLocalLoading(true);
    const startTime = Date.now();
    const success = await login(idVal, passVal);

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 1000 - elapsed);

    setTimeout(() => {
      setIsLocalLoading(false);
      if (success) {
        setShowSuccessOverlay(true);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const storeErr = useAuthStore.getState().error;
        if (storeErr === "USER_NOT_FOUND") {
          setIdentifierError("Nomor HP tidak terdaftar di sistem");
        } else if (storeErr === "WRONG_PASSWORD") {
          setPasswordError("Kata sandi salah. Coba lagi atau gunakan 'Lupa Kata Sandi'.");
          setPassword("");
          setTimeout(() => passwordInputRef.current?.focus(), 50);
        } else if (storeErr === "ROLE_NOT_ALLOWED_ON_WEB") {
          showToast("Akses Web khusus Pengawas, Admin, RW, DPL, & Pimpinan. Warga, Mahasiswa, dan Petugas Residu hanya dapat menggunakan aplikasi Mobile.", "warning");
          setIdentifierError("Akses Web ditutup untuk peran ini (Gunakan Aplikasi Mobile)");
        } else if (storeErr === "USER_INACTIVE") {
          showToast("Akun Anda belum aktif atau telah dinonaktifkan.", "warning");
        } else if (storeErr === "USER_PENDING_APPROVAL") {
          showToast("Akun Anda belum disetujui oleh pengurus RW setempat.", "warning");
          setIdentifierError("Akun belum disetujui RW setempat");
        } else if (storeErr === "SERVICE_UNAVAILABLE") {
          showToast("Server sedang bermasalah, silakan coba lagi nanti", "server", handleSubmit);
        } else if (storeErr === "TOO_MANY_ATTEMPTS") {
          showToast("Terlalu banyak percobaan, silakan coba lagi dalam 1 menit", "warning");
        } else if (storeErr === "NETWORK_ERROR") {
          showToast("Tidak dapat terhubung ke server, periksa koneksi internet Anda", "network", handleSubmit);
        } else {
          showToast("Gagal masuk ke sistem. Silakan coba lagi.", "error");
        }
      }
    }, remaining);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-100 p-4 sm:p-8 relative overflow-hidden font-sans">

      {/* Background Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-emerald-300/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-sky-300/30 blur-3xl pointer-events-none"></div>

      {/* Forgot Password Modal */}
      {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}

      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 flex flex-col items-center justify-center z-50 transition-all duration-500 animate-in fade-in">
          <div className="flex flex-col items-center gap-6 text-center text-white px-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center animate-bounce shadow-lg border border-white/30">
              <CheckCircle2 className="text-white" size={64} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Login Berhasil!</h2>
              <p className="text-sm text-emerald-100 max-w-sm mx-auto leading-relaxed font-medium">
                Mempersiapkan dasbor pemilahan sampah...
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-bold text-emerald-200">
              <RefreshCcw className="animate-spin text-lg" />
              <span>Memuat Halaman...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Container Card */}
      <div className="w-full max-w-[880px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 z-10 transition-all duration-300">

        {/* Left Side: Rich Eco Feature Panel (Desktop) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-emerald-200/30 text-white text-xs font-extrabold tracking-wide shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>
              <span>Sistem Monitoring Web TrashCare</span>
            </div>
          </div>

          <div className="my-auto space-y-3 relative z-10 py-4">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-white">
              Sampah Terdata,<br />Lingkungan Tertata.
            </h2>
            <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
              Platform monitoring terintegrasi khusus Pengawas, RW, DPL, dan Pimpinan. Akses Warga, Mahasiswa KKN, &amp; Petugas Residu melalui Aplikasi Mobile.
            </p>
          </div>

          <div className="pt-8 border-t border-white/15 relative z-10 text-[11px] text-emerald-200/80 font-medium">
            © 2026 UNIVERSITAS KOMPUTER INDONESIA  ALL RIGHTS RESERVED.
          </div>
        </div>

        {/* Right Side: Clean Modern Login Form */}
        <div className="col-span-12 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white space-y-6">

          <div className="space-y-6">

            {/* Header Brand Block */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <TrashCareLogoIcon className="w-10 h-10 transition-transform group-hover:scale-105" />
                <div className="flex flex-col text-left">
                  <span className="text-xl font-black tracking-tight leading-none">
                    <span className="text-sky-600">Trash</span>
                    <span className="text-emerald-600">Care</span>
                  </span>
                </div>
              </Link>

              <Link to="/" className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 transition">
                Kembali ke Beranda →
              </Link>
            </div>

            <div className="space-y-1.5 text-left pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                <span>Portal Web Pengawas &amp; Pengurus</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Selamat Datang</h1>
              <p className="text-xs text-slate-500 font-medium">
                Masukkan nomor telepon terdaftar dan kata sandi Anda.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">

              {/* Phone Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Nomor HP
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Format: 08xxx / +628xxx
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="login-phone"
                    className={`w-full pl-10 pr-4 h-12 bg-slate-50 border ${identifierError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-emerald-600"} rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all`}
                    placeholder="08123456789 atau +6281234567890"
                    type="tel"
                    inputMode="numeric"
                    value={identifier}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d+]/g, "");
                      setIdentifier(val);
                      if (val.trim()) setIdentifierError("");
                    }}
                    onKeyDown={(e) => {
                      if (!/[\d+]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={handleIdentifierBlur}
                    disabled={isStoreLoading || isLocalLoading}
                    autoComplete="tel"
                  />
                </div>
                {identifierError && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {identifierError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="login-password"
                    ref={passwordInputRef}
                    className={`w-full pl-10 pr-11 h-12 bg-slate-50 border ${passwordError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 focus:border-emerald-600"} rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all`}
                    placeholder="Masukkan kata sandi akun"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (e.target.value.trim()) setPasswordError(""); }}
                    onBlur={handlePasswordBlur}
                    disabled={isStoreLoading || isLocalLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60 transition cursor-pointer"
                    disabled={isStoreLoading || isLocalLoading}
                    title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Sub-bar below Password Input: Error / Hint on Left, Forgot Password on Right */}
                <div className="flex items-center justify-between pt-1">
                  {passwordError ? (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {passwordError}
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Min. 8 karakter (huruf &amp; angka)
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-extrabold transition cursor-pointer ml-auto hover:underline"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isBtnDisabled}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
              >
                {isLocalLoading || isStoreLoading ? (
                  <><RefreshCcw className="animate-spin" size={16} /><span>Memproses...</span></>
                ) : (
                  <><LogIn size={18} /><span>Masuk Sistem Web</span></>
                )}
              </button>
            </form>
          </div>

          {/* Footer Area with Security Badge */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>SSL 256-bit Encrypted Connection</span>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                Belum memiliki akun?{" "}
                <Link to="/register" className="text-emerald-600 font-extrabold hover:underline">
                  Daftar Sekarang
                </Link>
              </p>
              <p className="font-medium text-[11px] text-slate-400">© 2026 UNIKOM. All rights reserved.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
