import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/useAuthStore';
import api from '../../../services/api';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateWilayah } = useAuthStore();
  
  const getProfilePhotoUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const host = baseUrl.replace('/api/v1', '');
    return `${host}${path}`;
  };
  
  // Dropdown visibility states
  const [showLocation, setShowLocation] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Integrated Modal states
  const [showTukarPoin, setShowTukarPoin] = useState(false);
  const [tukarPoinAmount, setTukarPoinAmount] = useState('50000');
  const [ewalletType, setEwalletType] = useState('DANA');
  const [ewalletPhone, setEwalletPhone] = useState('');
  const [showBrosur, setShowBrosur] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);

  // Refs for closing on outside click
  const locRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const profRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await api.get('/dashboard/regions');
        if (response.data?.success) {
          setRegions(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch regions:', error);
      }
    };
    if (user) {
      fetchRegions();
    }
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setShowLocation(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) setShowApps(false);
      if (profRef.current && !profRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getHeaderInfo = (pathname: string) => {
    switch (pathname) {
      case '/': return { 
        title: `Selamat datang kembali, ${user?.name || 'Pengguna'} 👋`, 
        subtitle: user?.peran === 'WARGA' 
          ? 'Pantau poin Anda, temukan tong terdekat, dan mulai memilah sampah secara pintar.'
          : 'Kelola data, pantau aktivitas, dan wujudkan lingkungan yang lebih bersih.' 
      };
      case '/manajemen-pengguna': return { title: 'Manajemen Pengguna', subtitle: 'Kelola daftar akun, hak akses, dan data warga.' };
      case '/manajemen-tempat-sampah': return { title: 'Manajemen Tempat Sampah', subtitle: 'Pantau status kapasitas dan lokasi titik kumpul sampah.' };
      case '/manajemen-lokasi': return { title: 'Manajemen Lokasi', subtitle: 'Daftar wilayah dan RT/RW yang dilayani oleh sistem.' };
      case '/jadwal-kegiatan': return { title: 'Jadwal Kegiatan', subtitle: 'Agenda sosialisasi, pelatihan, dan pengangkutan sampah.' };
      case '/kategori-sampah': return { title: 'Kategori Sampah', subtitle: 'Pengaturan jenis dan nilai tukar sampah (poin/rupiah).' };
      case '/rekap-setoran': return { title: 'Rekap Setoran', subtitle: 'Laporan transaksi harian, bulanan, dan total penimbangan.' };
      case '/poin-warga': return { title: 'Poin Warga', subtitle: 'Kelola leaderboard poin warga.' };
      case '/laporan-analitik': return { title: 'Laporan & Analitik', subtitle: 'Visualisasi dan statistik progres pemilahan sampah.' };
      case '/notifikasi': return { title: 'Notifikasi', subtitle: 'Pusat pemberitahuan sistem dan pembaruan aplikasi.' };
      case '/pengaturan': return { title: 'Pengaturan', subtitle: 'Konfigurasi akun dan preferensi aplikasi.' };
      default: return { title: 'Dashboard', subtitle: '' };
    }
  };

  const headerInfo = getHeaderInfo(location.pathname);

  const handleSelectLocation = (loc: string) => {
    updateWilayah(loc);
    setShowLocation(false);
    toast.success(`Wilayah simulasi berhasil diubah ke ${loc}`);
  };

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar sistem');
    navigate('/login');
  };

  const handleTukarPoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ewalletPhone) {
      toast.error('Masukkan nomor telepon E-Wallet Anda!');
      return;
    }
    toast.success(`Permintaan penukaran Rp ${parseInt(tukarPoinAmount).toLocaleString()} ke ${ewalletType} (${ewalletPhone}) sedang diproses! Poin Anda akan berkurang.`);
    setShowTukarPoin(false);
    setEwalletPhone('');
  };

  const triggerCallOfficer = () => {
    toast.success('Menghubungi Ketua RT/RW (WhatsApp simulasi): "Halo Pak RT, saya ingin melaporkan tong sampah dekat rumah penuh..."');
    setShowApps(false);
  };

  const notifications = [
    { id: 1, title: 'Kapasitas Tong Kritis', desc: 'Tong Anorganik #2 - RT 02 terisi 88%. Harap setor ke titik lain.', time: '5 menit yang lalu', unread: true },
    { id: 2, title: 'Sukses Penimbangan', desc: 'Setoran Organik 1.5kg berhasil terdata. +15 Poin ditambahkan.', time: '2 jam yang lalu', unread: false },
    { id: 3, title: 'Agenda Esok Hari', desc: 'Sosialisasi pemilahan sampah mandiri Dago pukul 09.00 WIB.', time: '1 hari yang lalu', unread: false }
  ];

  const displayRegions = regions.length > 0 ? regions : [
    'RT 04 / RW 06',
    'RT 02 / RW 06',
    'RT 01 / RW 05',
    'Kecamatan Coblong'
  ];

  return (
    <header className="sticky top-0 h-[72px] bg-white border-b border-outline-variant px-container-margin flex items-center justify-between z-40">
      <div>
        <h2 className="font-headline-lg text-[20px] font-bold text-on-surface">{headerInfo.title}</h2>
        <p className="text-body-md text-[14px] text-on-surface-variant">{headerInfo.subtitle}</p>
      </div>
      <div className="flex items-center gap-gutter">
        
        {/* Location Picker Dropdown */}
        <div className="relative" ref={locRef}>
          <div 
            onClick={() => setShowLocation(!showLocation)}
            className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-lg cursor-pointer hover:bg-surface-container-high transition-all border border-outline-variant/30 select-none"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            <span className="text-label-md font-bold text-on-surface">{user?.wilayah || 'Kecamatan Coblong'}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">keyboard_arrow_down</span>
          </div>

          {showLocation && (
            <div className="absolute top-11 left-0 w-60 bg-white rounded-xl shadow-xl border border-outline-variant/50 p-2 flex flex-col gap-1 z-50">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase px-3 py-1.5 border-b border-outline-variant/20 tracking-wider">Pilih RT/RW Wilayah Warga</p>
              {displayRegions.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleSelectLocation(loc)}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-surface-container ${user?.wilayah === loc ? 'text-primary bg-primary/5' : 'text-on-surface'}`}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Icons */}
        <div className="flex items-center gap-3">
          
          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all border border-outline-variant/30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-4 h-4 bg-error text-white text-[9px] flex items-center justify-center rounded-full border border-white font-bold">3</span>
            </button>

            {showNotifications && (
              <div className="absolute top-11 right-0 w-80 bg-white rounded-xl shadow-xl border border-outline-variant/50 flex flex-col z-50 overflow-hidden">
                <div className="p-3 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface">Pemberitahuan Baru</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">3 Belum Dibaca</span>
                </div>
                <div className="divide-y divide-outline-variant/20 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 flex gap-2.5 transition-all hover:bg-surface-container-lowest ${n.unread ? 'bg-primary/5' : ''}`}>
                      <span className={`material-symbols-outlined text-[18px] ${n.title.includes('Kritis') ? 'text-error' : 'text-primary'} mt-0.5`}>
                        {n.title.includes('Kritis') ? 'warning' : 'info'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{n.title}</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">{n.desc}</p>
                        <p className="text-[9px] text-on-surface-variant mt-1 font-semibold">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => { setShowNotifications(false); navigate('/notifikasi'); }}
                  className="w-full text-center py-2.5 bg-slate-50 border-t border-outline-variant/30 text-xs font-bold text-primary hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Lihat Semua Notifikasi
                </button>
              </div>
            )}
          </div>
          
          {/* Apps 9-Dot Popover */}
          <div className="relative" ref={appsRef}>
            <button 
              onClick={() => setShowApps(!showApps)}
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all border border-outline-variant/30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">apps</span>
            </button>

            {showApps && (
              <div className="absolute top-11 right-0 w-72 bg-white rounded-xl shadow-xl border border-outline-variant/50 p-4 flex flex-col gap-3 z-50">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20 pb-2">Layanan Terintegrasi Warga</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { setShowTukarPoin(true); setShowApps(false); }}
                    className="flex flex-col items-center p-3 rounded-lg border border-outline-variant/40 hover:bg-primary/5 hover:border-primary transition-all text-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-primary text-[24px]">redeem</span>
                    <span className="text-[11px] font-bold text-on-surface">Tukar Poin</span>
                  </button>
                  <button 
                    onClick={triggerCallOfficer}
                    className="flex flex-col items-center p-3 rounded-lg border border-outline-variant/40 hover:bg-green-50 hover:border-green-600 transition-all text-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-green-600 text-[24px]">chat_bubble</span>
                    <span className="text-[11px] font-bold text-on-surface">Hubungi RT</span>
                  </button>
                  <button 
                    onClick={() => { setShowBrosur(true); setShowApps(false); }}
                    className="flex flex-col items-center p-3 rounded-lg border border-outline-variant/40 hover:bg-blue-50 hover:border-blue-600 transition-all text-center gap-1 cursor-pointer col-span-2"
                  >
                    <span className="material-symbols-outlined text-blue-600 text-[24px]">menu_book</span>
                    <span className="text-[11px] font-bold text-on-surface">Panduan Pemilahan Sampah</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Profile Avatar Clickable Dropdown */}
        <div className="relative" ref={profRef}>
          <div 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 ml-2 border-l border-outline-variant pl-4 cursor-pointer hover:opacity-90 select-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-label-md font-bold text-on-surface leading-tight">{user?.name || 'Pengguna'}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">{user?.peran?.replace('_', ' ') || 'WARGA'}</p>
            </div>
            <div className={`w-10 h-10 rounded-full ${user?.avatarBg || 'bg-blue-100'} ${user?.avatarColor || 'text-blue-700'} flex items-center justify-center font-bold text-xs shadow-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden`}>
              {user?.fotoProfil ? (
                <img src={getProfilePhotoUrl(user.fotoProfil) || undefined} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.avatar || 'U'
              )}
            </div>
          </div>

          {showProfile && (
            <div className="absolute top-12 right-0 w-48 bg-white rounded-xl shadow-xl border border-outline-variant/50 p-2 flex flex-col gap-1 z-50">
              <button 
                onClick={() => { setShowProfile(false); navigate('/pengaturan'); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container transition-all text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Profil & Pengaturan
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-red-50 transition-all text-left border-t border-outline-variant/20 mt-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Keluar Sistem
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tukar Poin Modal */}
      {showTukarPoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <form onSubmit={handleTukarPoinSubmit} className="bg-white rounded-2xl border border-outline-variant shadow-2xl p-6 max-w-sm w-full flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="text-[16px] font-bold text-on-surface">Tukar Poin Ke Saldo E-Wallet</h3>
              <button type="button" onClick={() => setShowTukarPoin(false)} className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary cursor-pointer">close</button>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase">Pilih Nominal Pencairan</label>
              <select 
                className="w-full h-10 px-3 bg-surface-container rounded-lg text-xs font-semibold text-on-surface"
                value={tukarPoinAmount}
                onChange={(e) => setTukarPoinAmount(e.target.value)}
              >
                <option value="50000">Rp 50.000 (Setara 500 Poin)</option>
                <option value="100000">Rp 100.000 (Setara 1.000 Poin)</option>
                <option value="250000">Rp 250.000 (Setara 2.500 Poin)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase">Pilih Jenis E-Wallet</label>
              <div className="grid grid-cols-3 gap-2">
                {['DANA', 'OVO', 'GOPAY'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEwalletType(type)}
                    className={`h-9 text-xs font-bold rounded-lg border transition-all cursor-pointer ${ewalletType === type ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase">Nomor HP E-Wallet</label>
              <input 
                type="text" 
                required
                className="w-full h-10 px-3 bg-surface-container border border-outline-variant/55 rounded-lg text-xs focus:outline-none focus:border-primary"
                placeholder="Contoh: 08123456789"
                value={ewalletPhone}
                onChange={(e) => setEwalletPhone(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full h-11 bg-primary text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-primary/10 mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              Proses Pencairan Poin
            </button>
          </form>
        </div>
      )}

      {/* Brosur Panduan Modal */}
      {showBrosur && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-2xl p-6 max-w-md w-full flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
                Panduan Klasifikasi Sampah Cerdas
              </h3>
              <button onClick={() => setShowBrosur(false)} className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary cursor-pointer">close</button>
            </div>
            
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
              {/* Organik */}
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">eco</span>
                  Sampah Organik (Hijau)
                </p>
                <p className="text-[11px] text-green-700 leading-relaxed mt-1">Sampah alami yang mudah membusuk dan dapat diolah menjadi kompos pupuk organik.</p>
                <ul className="text-[10px] text-green-800 list-disc list-inside mt-2 space-y-0.5 font-semibold">
                  <li>Sisa makanan & sayur dapur</li>
                  <li>Dedaunan kering & ranting</li>
                  <li>Kulit buah-buahan</li>
                  <li>Sisa tulang daging / ikan</li>
                </ul>
              </div>

              {/* Anorganik */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">local_drink</span>
                  Sampah Anorganik (Biru)
                </p>
                <p className="text-[11px] text-blue-700 leading-relaxed mt-1">Sampah buatan manusia yang sulit membusuk dan bernilai tinggi untuk proses daur ulang industri.</p>
                <ul className="text-[10px] text-blue-800 list-disc list-inside mt-2 space-y-0.5 font-semibold">
                  <li>Botol plastik PET & gelas air mineral</li>
                  <li>Kardus box & kertas koran bekas</li>
                  <li>Kaleng aluminium makanan / minuman</li>
                  <li>Plastik kantong bening bersih</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowBrosur(false)}
              className="w-full h-10 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Saya Paham
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
