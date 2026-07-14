import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../store/useAuthStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        toast.success(`Berhasil login!`);
        navigate('/');
      } else {
        toast.error('Gagal melakukan login. Periksa kembali email dan password Anda.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden flex flex-col p-8 gap-6 transform transition-all duration-300">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center gap-3">
          <img src="/logo.png" alt="Pilah Sampah Cerdas" className="h-24 w-auto object-contain" />
          <p className="text-[12px] text-on-surface-variant max-w-xs leading-relaxed">Masukkan email dan kata sandi Anda untuk masuk ke dalam sistem.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">person</span>
              <input 
                className="w-full pl-10 pr-4 h-11 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none" 
                placeholder="Contoh: user@email.com" 
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kata Sandi</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
              <input 
                className="w-full pl-10 pr-4 h-11 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all outline-none" 
                placeholder="Masukkan kata sandi..." 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2"
          >
            {loading ? (
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
