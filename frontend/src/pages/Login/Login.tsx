import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: isStoreLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UX State
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Validation States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Helper validation regex
  const isEmailValid = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || /^\d{16}$/.test(val);

  // Real-time Validation handlers
  const handleEmailBlur = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email atau NIK wajib diisi");
    } else if (!isEmailValid(trimmed)) {
      setEmailError("Format email atau 16 digit NIK tidak valid");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordBlur = () => {
    const trimmed = password.trim();
    if (!trimmed) {
      setPasswordError("Password wajib diisi");
    } else if (trimmed.length < 6) {
      setPasswordError("Password minimal 6 karakter");
    } else {
      setPasswordError("");
    }
  };

  const isFormInvalid =
    !email.trim() || !password.trim() || !!emailError || !!passwordError;
  const isBtnDisabled = isStoreLoading || isLocalLoading || showSuccessOverlay || isFormInvalid;

  // Custom Toast implementation following design guidelines
  const showToast = (
    message: string,
    type: "error" | "warning" | "server" | "network" = "error",
    retryAction?: () => void
  ) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
          } transform transition-all duration-300 max-w-sm w-full bg-white shadow-xl rounded-xl pointer-events-auto flex border border-outline-variant/30 p-4 gap-3 items-center`}
        >
          <div className="flex-shrink-0 flex items-center">
            {type === "error" && (
              <span className="material-symbols-outlined text-[24px] text-red-500">error</span>
            )}
            {type === "warning" && (
              <span className="material-symbols-outlined text-[24px] text-amber-500">warning</span>
            )}
            {type === "server" && (
              <span className="material-symbols-outlined text-[24px] text-red-500 animate-pulse">
                dns
              </span>
            )}
            {type === "network" && (
              <span className="material-symbols-outlined text-[24px] text-red-500 animate-pulse">
                wifi_off
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 leading-normal">{message}</p>
            {retryAction && (
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  retryAction();
                }}
                className="mt-2 text-[10px] text-primary hover:text-primary-dark font-bold underline cursor-pointer"
              >
                Coba Lagi
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ),
      {
        position: "top-right",
        duration: type === "server" || type === "network" ? 7000 : 4000,
      }
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStoreLoading || isLocalLoading || showSuccessOverlay) return;

    // Final check validation
    const emailVal = email.trim();
    const passVal = password.trim();

    let hasError = false;
    if (!emailVal) {
      setEmailError("Email atau NIK wajib diisi");
      hasError = true;
    } else if (!isEmailValid(emailVal)) {
      setEmailError("Format email atau 16 digit NIK tidak valid");
      hasError = true;
    }

    if (!passVal) {
      setPasswordError("Password wajib diisi");
      hasError = true;
    } else if (passVal.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      hasError = true;
    }

    if (hasError) return;

    setIsLocalLoading(true);
    const startTime = Date.now();

    const success = await login(emailVal, passVal);

    const elapsedTime = Date.now() - startTime;
    const minDelay = 1000; // minimum visual feedback
    const remainingTime = Math.max(0, minDelay - elapsedTime);

    setTimeout(() => {
      setIsLocalLoading(false);
      if (success) {
        setShowSuccessOverlay(true);
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        const storeErr = useAuthStore.getState().error;
        if (storeErr === "USER_NOT_FOUND") {
          setEmailError("User tidak ditemukan");
        } else if (storeErr === "WRONG_PASSWORD") {
          setPasswordError("Password salah");
          setPassword(""); // Clear password
          setTimeout(() => {
            passwordInputRef.current?.focus();
          }, 50);
        } else if (storeErr === "SERVICE_UNAVAILABLE") {
          showToast(
            "Server sedang bermasalah, silakan coba lagi dalam beberapa saat",
            "server",
            () => handleSubmit()
          );
        } else if (storeErr === "TOO_MANY_ATTEMPTS") {
          showToast("Terlalu banyak percobaan, silakan coba lagi dalam 1 menit", "warning");
        } else if (storeErr === "NETWORK_ERROR") {
          showToast(
            "Tidak dapat terhubung ke server, periksa koneksi internet Anda",
            "network",
            () => handleSubmit()
          );
        } else {
          showToast("Gagal masuk ke sistem. Silakan coba lagi.", "error");
        }
      }
    }, remainingTime);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6 relative overflow-hidden">
      {/* SUCCESS TRANSITION OVERLAY */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-600 to-emerald-800 flex flex-col items-center justify-center z-50 transition-all duration-500 animate-in fade-in">
          <div className="flex flex-col items-center gap-6 text-center text-white px-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center animate-bounce shadow-lg border border-white/30">
              <span className="material-symbols-outlined text-[64px] text-white">check_circle</span>
            </div>
            <div>
              <h2 className="text-[28px] font-bold tracking-tight mb-2">Login Berhasil!</h2>
              <p className="text-sm text-green-100 max-w-sm mx-auto leading-relaxed">
                Menghubungkan sesi Anda dengan aman. Mempersiapkan dashboard analisis sampah...
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-green-200">
              <span className="material-symbols-outlined animate-spin text-lg">autorenew</span>
              <span>Memuat Halaman...</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LOGIN CARD */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden flex flex-col p-8 gap-6 z-10 transition-all duration-300">
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center gap-3">
          <img src="/logo.png" alt="Pilah Sampah Cerdas" className="h-28 w-auto object-contain" />
          <p className="text-[12px] text-on-surface-variant max-w-xs leading-relaxed font-medium">
            Masukkan email dan kata sandi Anda untuk masuk ke sistem.
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[11px] text-blue-700 leading-relaxed shadow-sm">
          <p className="font-bold mb-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Akun Demo (password: <code>password123</code>):
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-blue-600/90 font-medium pl-4 list-disc">
            <p>• admin@psc.id (Admin)</p>
            <p>• kelurahan@psc.id (Kel.)</p>
            <p>• rw@psc.id (Petugas RW)</p>
            <p>• rt@psc.id (Petugas RT)</p>
            <p className="col-span-2">• warga@psc.id (Warga)</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Email atau NIK
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                person
              </span>
              <input
                className={`w-full pl-10 pr-4 h-11 bg-surface-container-low border ${
                  emailError ? "border-red-500 focus:ring-red-500" : "border-outline-variant/50 focus:border-primary focus:ring-primary"
                } rounded-lg text-sm focus:ring-1 focus:outline-none transition-all outline-none`}
                placeholder="Email atau 16 digit NIK..."
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value.trim()) setEmailError("");
                }}
                onBlur={handleEmailBlur}
                disabled={isStoreLoading || isLocalLoading || showSuccessOverlay}
                aria-describedby={emailError ? "email-error" : undefined}
              />
            </div>
            {emailError && (
              <p
                id="email-error"
                className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-0.5 animate-in fade-in slide-in-from-top-1"
              >
                <span className="material-symbols-outlined text-[12px]">warning</span>
                {emailError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Kata Sandi
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                lock
              </span>
              <input
                ref={passwordInputRef}
                className={`w-full pl-10 pr-10 h-11 bg-surface-container-low border ${
                  passwordError ? "border-red-500 focus:ring-red-500" : "border-outline-variant/50 focus:border-primary focus:ring-primary"
                } rounded-lg text-sm focus:ring-1 focus:outline-none transition-all outline-none`}
                placeholder="Masukkan kata sandi..."
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value.trim()) setPasswordError("");
                }}
                onBlur={handlePasswordBlur}
                disabled={isStoreLoading || isLocalLoading || showSuccessOverlay}
                aria-describedby={passwordError ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                disabled={isStoreLoading || isLocalLoading || showSuccessOverlay}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {passwordError && (
              <p
                id="password-error"
                className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-0.5 animate-in fade-in slide-in-from-top-1"
              >
                <span className="material-symbols-outlined text-[12px]">warning</span>
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isBtnDisabled}
            className="w-full h-11 bg-primary text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
          >
            {isLocalLoading || isStoreLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Masuk Sistem</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-on-surface-variant mt-2 border-t border-outline-variant/30 pt-4">
          <p>© 2026 Pilah Sampah Cerdas. Kecamatan Coblong, Kota Bandung.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
