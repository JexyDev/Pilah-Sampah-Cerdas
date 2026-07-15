import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: isStoreLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UX State
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const isBtnDisabled = isStoreLoading || isLocalLoading || showSuccessOverlay;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBtnDisabled) return;

    setIsLocalLoading(true);
    const startTime = Date.now();

    try {
      const success = await login(email, password);
      
      const elapsedTime = Date.now() - startTime;
      const minDelay = 1500; // 1.5 seconds minimum visual feedback
      const remainingTime = Math.max(0, minDelay - elapsedTime);

      setTimeout(() => {
        setIsLocalLoading(false);
        if (success) {
          setShowSuccessOverlay(true);
          // Wait another 1.5s for success transition screen before routing
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } else {
          setShowErrorModal(true);
        }
      }, remainingTime);
    } catch (err) {
      setIsLocalLoading(false);
      setShowErrorModal(true);
    }
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

      {/* ERROR MODAL POPUP */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 items-center text-center animate-in zoom-in-95 duration-200 border border-outline-variant/30">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[36px]">error</span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Akses Ditolak</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Email atau kata sandi salah. Silakan periksa kembali kredensial Anda dan coba lagi.
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors active:scale-95 transform shadow-md shadow-red-500/10 cursor-pointer"
            >
              Coba Lagi
            </button>
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
                className="w-full pl-10 pr-4 h-11 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                placeholder="Email atau 16 digit NIK..."
                type="text"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBtnDisabled}
              />
            </div>
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
                className="w-full pl-10 pr-10 h-11 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none"
                placeholder="Masukkan kata sandi..."
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBtnDisabled}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                disabled={isBtnDisabled}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isBtnDisabled}
            className="w-full h-11 bg-primary text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isBtnDisabled ? (
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
