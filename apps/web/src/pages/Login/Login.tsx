/**
 * Project: TrashCare Login Page (Modern Clean 2-Column Split Layout & HD Vector Logo)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  EyeOff,
  Eye,
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
  Download,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import api from "../../services/api";
import showToast from "../../utils/showToast";

// Hanya menerima format nomor telepon Indonesia: 08xxx, 628xxx, +628xxx, 8xxx
// Minimal 9 digit, maksimal 14 digit.
const PHONE_REGEX = /^\+628[0-9]\d{6,11}$/;

function normalizePhone(val: string): string {
  let t = val.trim();
  if (t.includes(".")) return t; // Return DPL NIP as is
  t = t.replace(/[\s\-().]/g, "");
  if (t.startsWith("08")) return "+62" + t.slice(1);
  if (t.startsWith("8")) return "+62" + t;
  if (t.startsWith("628") && !t.startsWith("+")) return "+" + t;
  return t;
}

function isPhoneValid(val: string): boolean {
  const t = val.trim();
  // If it's a DPL NIP (contains dot or starts with 4127)
  if (t.startsWith("4127") || t.includes(".")) {
    return true;
  }
  // Allow NIM
  if (/^\d{6,12}$/.test(t)) {
    return true;
  }
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
      setPhoneError("Format nomor HP tidak valid. Terima: 08xxx atau +628xxx (10-13 digit)");
      return;
    }
    setPhoneError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/request-otp", { phone: normalized });
      const data = res.data;
      // Di development, tampilkan OTP untuk testing
      if (data.devOtp) {
        showToast.success(`[DEV] Kode OTP: ${data.devOtp}`);
      } else {
        showToast.success("Kode OTP telah dikirim ke WhatsApp Anda!");
      }
      setStep("otp");
      startResendCooldown();
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("PHONE_NOT_REGISTERED") || msg.includes("tidak terdaftar")) {
        setPhoneError("Nomor HP ini tidak terdaftar di sistem BERSEKA");
      } else if (msg.includes("USER_INACTIVE") || msg.includes("tidak aktif")) {
        setPhoneError("Akun dengan nomor ini tidak aktif");
      } else {
        showToast.error("Gagal mengirim OTP. Silakan coba lagi.");
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
      showToast.success("Kata sandi berhasil diperbarui! Silakan masuk kembali.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner - Emerald Green #009966 */}
        <div className="bg-[#009966] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <KeyRound size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg text-white leading-tight">Lupa Kata Sandi</h2>
              <p className="text-emerald-100 text-[11px] font-semibold">
                {step === "phone" && "Langkah 1 dari 3 — Verifikasi Nomor HP"}
                {step === "otp" && "Langkah 2 dari 3 — Verifikasi Kode OTP"}
                {step === "new_password" && "Langkah 3 dari 3 — Buat Kata Sandi Baru"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3-Step Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-emerald-400 transition-all duration-500"
            style={{ width: step === "phone" ? "33%" : step === "otp" ? "66%" : "100%" }}
          />
        </div>

        <div className="p-6 space-y-5 text-left">

          {/* ── Step 1: Nomor HP ── */}
          {step === "phone" && (
            <>
              {/* Centered Circular WhatsApp Icon Badge */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#009966] border border-emerald-100/80 flex items-center justify-center mx-auto shadow-xs">
                  <MessageSquare size={26} />
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                  Masukkan nomor HP yang terdaftar. Kode OTP 6 digit akan dikirimkan ke WhatsApp Anda.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                  NOMOR HP TERDAFTAR
                </label>

                {/* Rules Guidance Card matching reference image 1:1 */}
                <div className="text-[11px] text-slate-500 font-medium bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 space-y-1.5">
                  <p className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <span className="text-emerald-600 font-extrabold">✓</span> Hanya angka — format nomor Indonesia (+62/08/628)
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <span className="text-emerald-600 font-extrabold">✓</span> Contoh: 08123456789 atau +6281234567890
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <span className="text-emerald-600 font-extrabold">✓</span> Panjang: 10–13 digit (setelah kode negara)
                  </p>
                </div>

                {/* Styled Phone Input */}
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <input
                    className={`w-full pl-11 pr-4 h-13 bg-white dark:bg-slate-800 border ${phoneError ? "border-rose-500 focus:ring-rose-500" : "border-slate-300 dark:border-slate-700 focus:border-[#009966] focus:ring-2 focus:ring-emerald-500/20"} rounded-2xl text-base font-bold text-slate-900 dark:text-slate-100 outline-none transition-all`}
                    placeholder="08123456789 atau +6281234567890"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d+\s]/g, "");
                      setPhone(val);
                      if (phoneError) setPhoneError("");
                    }}
                    onKeyDown={(e) => {
                      if (!/[\d+\s]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Enter"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => {
                      if (phone && !isPhoneValid(phone)) {
                        setPhoneError("Format nomor HP tidak valid. Terima: 08xxx atau +628xxx (10-13 digit)");
                      }
                    }}
                    disabled={loading}
                    autoFocus
                  />
                </div>

                {phoneError && (
                  <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1 pt-0.5">
                    <AlertTriangle size={12} />
                    {phoneError}
                  </p>
                )}
              </div>

              {/* WhatsApp Submit Button #009966 */}
              <button
                onClick={handleRequestOtp}
                disabled={loading || !phone.trim()}
                className="w-full h-13 bg-[#009966] hover:bg-emerald-700 text-white text-sm font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-emerald-700/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <><RefreshCcw className="animate-spin" size={17} /><span>Mengirim Kode OTP...</span></>
                ) : (
                  <><MessageSquare size={18} /><span>Kirim Kode OTP via WhatsApp</span></>
                )}
              </button>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#009966] border border-emerald-100/80 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck size={28} />
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                  Kode OTP 6 digit dikirim ke WhatsApp{" "}
                  <strong className="text-slate-900 font-bold">{normalizePhone(phone)}</strong>.
                </p>
                <p className="text-[11px] text-slate-400 font-medium">Periksa WhatsApp Anda. Kode berlaku 5 menit.</p>
              </div>

              {/* 6 Boxes OTP Input */}
              <div className="flex gap-2 justify-center py-1" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    className={`w-12 h-14 text-center text-2xl font-black border-2 ${otpError ? "border-rose-400" : "border-slate-200 dark:border-slate-700 focus:border-[#009966] focus:ring-2 focus:ring-emerald-500/20"} rounded-2xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-slate-100 outline-none transition-all shadow-2xs`}
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
                  <AlertTriangle size={12} />
                  {otpError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }}
                  className="flex-1 h-12 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={16} /> Kembali
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join("").length < 6}
                  className="flex-1 h-12 bg-[#009966] hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <><RefreshCcw className="animate-spin" size={16} /><span>Memverifikasi...</span></>
                  ) : (
                    <span>Verifikasi Kode OTP →</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                {resendCooldown > 0 ? (
                  <p className="text-[11px] text-slate-400 font-medium">
                    Kirim ulang kode dalam <strong className="text-[#009966] font-bold">{resendCooldown} detik</strong>
                  </p>
                ) : (
                  <button
                    onClick={() => { handleRequestOtp(); }}
                    disabled={loading}
                    className="text-[11px] text-[#009966] hover:text-emerald-700 font-extrabold cursor-pointer hover:underline"
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
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#009966] border border-emerald-100/80 flex items-center justify-center mx-auto shadow-xs">
                  <Lock size={26} />
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                  Buat kata sandi baru yang kuat untuk akun BERSEKA Anda.
                </p>
              </div>

              {/* Ketentuan password */}
              <div className="text-[11px] text-slate-500 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
                <p className="font-extrabold text-slate-800 uppercase tracking-wider mb-1">Ketentuan Kata Sandi:</p>
                <p className={newPassword.length >= PASSWORD_MIN_LEN ? "text-emerald-700 font-bold" : "text-slate-600 font-medium"}>
                  {newPassword.length >= PASSWORD_MIN_LEN ? "✓" : "○"} Minimal {PASSWORD_MIN_LEN} karakter
                </p>
                <p className={/[A-Za-z]/.test(newPassword) ? "text-emerald-700 font-bold" : "text-slate-600 font-medium"}>
                  {/[A-Za-z]/.test(newPassword) ? "✓" : "○"} Mengandung minimal 1 huruf (a–z atau A–Z)
                </p>
                <p className={/\d/.test(newPassword) ? "text-emerald-700 font-bold" : "text-slate-600 font-medium"}>
                  {/\d/.test(newPassword) ? "✓" : "○"} Mengandung minimal 1 angka (0–9)
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      className={`w-full pl-11 pr-11 h-12 bg-white dark:bg-slate-800 border ${pwError ? "border-rose-500" : "border-slate-300 dark:border-slate-700 focus:border-[#009966] focus:ring-2 focus:ring-emerald-500/20"} rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition-all`}
                      placeholder="Kata sandi baru (min. 8 karakter)"
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (pwError) setPwError(""); }}
                      disabled={loading}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 cursor-pointer">
                      {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Konfirmasi Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      className={`w-full pl-11 pr-11 h-12 bg-white dark:bg-slate-800 border ${(pwError && confirmPassword) ? "border-rose-500" : "border-slate-300 dark:border-slate-700 focus:border-[#009966] focus:ring-2 focus:ring-emerald-500/20"} rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none transition-all`}
                      placeholder="Ulangi kata sandi baru"
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (pwError) setPwError(""); }}
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 cursor-pointer">
                      {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {pwError && (
                <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {pwError}
                </p>
              )}

              <button
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full h-13 bg-[#009966] hover:bg-emerald-700 text-white text-sm font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <><RefreshCcw className="animate-spin" size={17} /><span>Menyimpan Kata Sandi...</span></>
                ) : (
                  <><CheckCircle2 size={19} /><span>Simpan Kata Sandi Baru</span></>
                )}
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
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Validation States
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Force light mode on login page unconditionally
  useEffect(() => {
    useThemeStore.getState().setInsideMainLayout(false);
    useThemeStore.getState().resetThemeToLight();
  }, []);

  const handleIdentifierBlur = () => {
    const normalized = normalizePhone(identifier);
    if (normalized !== identifier && normalized) setIdentifier(normalized);
    if (!normalized) {
      setIdentifierError("Nomor HP wajib diisi");
    } else if (!isPhoneValid(normalized)) {
      setIdentifierError("Format nomor HP tidak valid. Terima: 08xxx atau +628xxx (10-13 digit)");
    } else {
      setIdentifierError("");
    }
  };

  const handlePasswordBlur = () => {
    const trimmed = password.trim();
    if (!trimmed) { setPasswordError("Kata sandi wajib diisi"); return; }
    if (trimmed.length < 6) { setPasswordError("Kata sandi salah. Coba lagi atau gunakan 'Lupa Kata Sandi'."); return; }
    setPasswordError("");
  };

  const isFormInvalid = !identifier.trim() || !password.trim() || !!identifierError || !!passwordError;
  const isBtnDisabled = isStoreLoading || isLocalLoading || isFormInvalid;

  const triggerToast = (message: string, type: "error" | "warning" | "server" | "network" = "error") => {
    if (type === "warning") {
      showToast.warning(message);
    } else {
      showToast.error(message);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStoreLoading || isLocalLoading) return;

    const idVal = normalizePhone(identifier);
    if (idVal !== identifier) setIdentifier(idVal);
    const passVal = password.trim();
    let hasError = false;

    if (!idVal) {
      setIdentifierError("Nomor HP wajib diisi");
      hasError = true;
    } else if (!isPhoneValid(idVal)) {
      setIdentifierError("Format nomor HP tidak valid. Terima: 08xxx, +628xxx");
      hasError = true;
    }

    if (!passVal) { 
      setPasswordError("Kata sandi wajib diisi"); 
      hasError = true; 
    } else if (passVal.length < 6) {
      setPasswordError("Kata sandi salah. Coba lagi atau gunakan 'Lupa Kata Sandi'."); 
      hasError = true; 
    } else { 
      setPasswordError(""); 
    }

    if (hasError) return;

    setIsLocalLoading(true);
    const success = await login(idVal, passVal, rememberMe);
    setIsLocalLoading(false);

    if (success) {
      const user = useAuthStore.getState().user;
      const roleLabelMap: Record<string, string> = {
        DEVELOPER: "Developer",
        SUPER_USER: "Admin",
        ADMIN_DLH: "Admin DLH",
        CAMAT: "Camat",
        LURAH: "Lurah",
        RW: "Pengurus RW",
        RT: "Pengurus RT",
        DPL: "Dosen Pendamping Lapangan (DPL)",
        PEMIMPIN: "Pimpinan",
        PANITIA_TASKFORCE: "Task Force",
      };
      const displayRole = user?.peran ? (roleLabelMap[user.peran] || user.peran) : "Pengguna";
      const displayName = user?.name || displayRole;
      
      showToast.success(`Selamat datang kembali, ${displayName}!`);
      navigate("/dasbor");
    } else {
      const storeErr = useAuthStore.getState().error;
      if (storeErr === "USER_NOT_FOUND") {
        setIdentifierError("Nomor HP tidak terdaftar di sistem");
      } else if (storeErr === "WRONG_PASSWORD") {
        setPasswordError("Kata sandi salah. Coba lagi atau gunakan 'Lupa Kata Sandi'.");
        setPassword("");
        setTimeout(() => passwordInputRef.current?.focus(), 50);
      } else if (storeErr === "ROLE_NOT_ALLOWED_ON_WEB") {
        triggerToast("Akses Web khusus Admin, Rukun Warga, Dosen Pendamping Lapangan (DPL), dan Pimpinan. Warga, Mahasiswa, dan Petugas Residu hanya dapat menggunakan aplikasi Mobile.", "warning");
        setIdentifierError("Akses Web ditutup untuk peran ini (Gunakan Aplikasi Mobile)");
      } else if (storeErr === "USER_INACTIVE") {
        triggerToast("Akun Anda belum aktif atau telah dinonaktifkan.", "warning");
      } else if (storeErr === "USER_PENDING_APPROVAL") {
        triggerToast("Akun Anda belum disetujui oleh pengurus RW setempat.", "warning");
        setIdentifierError("Akun belum disetujui RW setempat");
      } else if (storeErr === "SERVICE_UNAVAILABLE") {
        triggerToast("Server sedang bermasalah, silakan coba lagi nanti", "server");
      } else if (storeErr === "TOO_MANY_ATTEMPTS") {
        triggerToast("Terlalu banyak percobaan, silakan coba lagi dalam 1 menit", "warning");
      } else if (storeErr === "NETWORK_ERROR") {
        triggerToast("Tidak dapat terhubung ke server, periksa koneksi internet Anda", "network");
      } else {
        triggerToast("Gagal masuk ke sistem. Silakan coba lagi.", "error");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-100 p-4 sm:p-8 relative overflow-hidden font-sans">

      {/* Background Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-emerald-300/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-sky-300/30 blur-3xl pointer-events-none"></div>

      {/* Forgot Password Modal */}
      {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}

      {/* Main Split Container Card */}
      <div className="w-full max-w-[1120px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-12 z-10 transition-all duration-500 animate-fade-in-up">

        {/* Left Side: Rich Eco Feature Panel (Desktop Eco-Monitoring Showcase) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#0f3d2e] via-[#14532d] to-[#064e3b] text-white p-8 sm:p-10 flex-col justify-between relative overflow-hidden">
          {/* Background Decorative Animated Element */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none animate-float" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: "2s" }} />

          <div className="relative z-10 space-y-6 my-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-emerald-300/30 text-white text-xs font-extrabold tracking-wide shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span>Web Monitoring BERSEKA</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white">
                Sampah Terdata,<br />Kampung Berseka.
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                Sistem pemantauan dan tata kelola sampah terpadu BERSEKA (Bersih, Sehat, Kampung Asri) dalam kerangka kegiatan KKN Berdampak UNIKOM dan Pemerintah Kecamatan Coblong.
              </p>
            </div>

            {/* Feature Highlights Showcase List */}
            <div className="pt-4 space-y-3 border-t border-white/15">
              <div className="flex items-start gap-3 text-xs text-emerald-100/90">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                  <span className="material-symbols-outlined text-sm">analytics</span>
                </div>
                <div>
                  <p className="font-extrabold text-white text-xs">Monitoring Real-Time</p>
                  <p className="text-[11px] text-emerald-200/80 font-medium">Pemantauan volume sampah organik &amp; anorganik.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-emerald-100/90">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                  <span className="material-symbols-outlined text-sm">stars</span>
                </div>
                <div>
                  <p className="font-extrabold text-white text-xs">Transparansi Audit Poin</p>
                  <p className="text-[11px] text-emerald-200/80 font-medium">Buku besar poin terpisah bagi insentif warga.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-emerald-100/90">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
                  <span className="material-symbols-outlined text-sm">handshake</span>
                </div>
                <div>
                  <p className="font-extrabold text-white text-xs">Sinergi Berkelanjutan</p>
                  <p className="text-[11px] text-emerald-200/80 font-medium">Kolaborasi pemerintah daerah, kampus &amp; warga.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 relative z-10 text-[10px] text-emerald-200/80 font-medium">
            © 2026 Universitas Komputer Indonesia. Hak Cipta Dilindungi.
          </div>
        </div>

        {/* Right Side: Clean Modern Login Form */}
        <div className="col-span-12 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white dark:bg-slate-900 space-y-6">

          <div className="space-y-5">

            {/* Header Brand Block */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Link to="/" className="flex items-center group">
                <img
                  src="/image/berseka-logo.png"
                  alt="BERSEKA - Bersih, Sehat, Kampung Asri"
                  className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
                />
              </Link>

              <Link to="/" className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 transition">
                Kembali ke Beranda →
              </Link>
            </div>

            <div className="space-y-2 text-left pt-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Masuk ke Akun</h1>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Silakan masukkan nomor HP terdaftar dan kata sandi akun Anda.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">

              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Nomor HP
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="login-phone"
                    autoFocus
                    className={`w-full pl-10 pr-4 h-12 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border ${identifierError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-emerald-600"} rounded-xl text-sm font-semibold focus:ring-1 outline-none transition-all shadow-2xs`}
                    placeholder="08123456789 atau +6281234567890"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d+]/g, "");
                      setIdentifier(val);
                      if (val.trim()) setIdentifierError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.ctrlKey || e.metaKey) return;
                      const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter", "Home", "End"];
                      if (!/^[0-9+]$/.test(e.key) && !allowed.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={handleIdentifierBlur}
                    disabled={isStoreLoading || isLocalLoading}
                  />
                  {identifierError && (
                    <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 absolute -bottom-[18px] left-0">
                      <AlertTriangle size={11} />
                      {identifierError}
                    </p>
                  )}
                </div>
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
                    className={`w-full pl-10 pr-11 h-12 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border ${passwordError ? "border-rose-500 focus:ring-rose-500" : "border-slate-200 dark:border-slate-700 focus:border-emerald-600"} rounded-xl text-sm font-semibold focus:ring-1 outline-none transition-all shadow-2xs`}
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

                {passwordError && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 pt-0.5">
                    <AlertTriangle size={11} />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Row: Ingat Saya (Kiri) & Lupa Kata Sandi? (Kanan) — 100% Sejajar Presisi */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                      rememberMe
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : "bg-white border-slate-300 hover:border-emerald-400"
                    }`}
                  >
                    {rememberMe && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <label
                    className="text-xs text-slate-600 font-bold select-none cursor-pointer flex items-center gap-1"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    <span>Ingat Saya</span>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">(Tetap masuk)</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold transition cursor-pointer hover:underline"
                >
                  Lupa Kata Sandi?
                </button>
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
                  <><LogIn size={18} /><span>Masuk</span></>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Floating Action Button: Download Aplikasi Mobile APK (Icon-Only Animated) */}
      <div className="fixed bottom-6 right-8 sm:right-10 z-50 group flex items-center justify-center p-2 overflow-visible">
        <div className="relative flex items-center justify-center">
          {/* Outer Animated Ping Ripple Effect */}
          <span className="absolute -inset-1 rounded-full bg-[#009966]/40 animate-ping opacity-75 pointer-events-none" />
          
          <Link
            to="/download"
            className="relative w-14 h-14 bg-gradient-to-r from-[#009966] to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-900/30 hover:scale-110 active:scale-95 transition-all duration-300 border border-white/40 cursor-pointer shrink-0"
            aria-label="Unduh Aplikasi Mobile BERSEKA (APK)"
          >
            <Download size={22} className="text-white group-hover:rotate-12 transition-transform" />
            
            {/* Tooltip on Hover */}
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 shadow-xl border border-slate-800">
              Unduh Aplikasi Mobile (APK)
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
