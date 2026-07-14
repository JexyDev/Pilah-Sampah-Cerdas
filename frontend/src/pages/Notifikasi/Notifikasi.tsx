import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Camera, X, CheckCircle, Upload, AlertTriangle, Star } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const NotificationModal = ({ notif, onClose, onSubmitEmpty }: { notif: any, onClose: () => void, onSubmitEmpty: () => void }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!notif) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhoto(url);
    }
  };

  const renderContent = () => {
    if (notif.type === 'TONG_PENUH') {
      return (
        <div className="mt-4 flex flex-col gap-4">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Aksi Diperlukan</p>
              <p>Tong sampah Anda telah mencapai kapasitas kritis. Silakan ambil foto bukti kondisi tong yang penuh untuk mengajukan pengosongan ke petugas RT/RW.</p>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50">
            {photo ? (
              <div className="relative w-full">
                <img src={photo} alt="Bukti tong penuh" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white shadow-sm transition-colors">
                  <X size={16} className="text-gray-700" />
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                  <Camera size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">Unggah Foto Bukti</p>
                <p className="text-xs text-gray-500 mb-4">Format JPG, PNG max 2MB</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Upload size={16} /> Buka Kamera
                </button>
              </>
            )}
          </div>

          <button 
            disabled={!photo}
            onClick={onSubmitEmpty}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
              photo 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Ajukan Pengosongan
          </button>
        </div>
      );
    }

    if (notif.type === 'PENGAJUAN_DISETUJUI') {
      return (
        <div className="mt-4 bg-green-50 p-5 rounded-xl border border-green-100 flex flex-col items-center text-center">
          <div className="bg-green-100 p-3 rounded-full mb-3">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h4 className="font-bold text-green-800 mb-1">Pengosongan Disetujui</h4>
          <p className="text-sm text-green-700">Petugas telah memverifikasi foto bukti Anda dan mereset kapasitas tong menjadi 0%. Terima kasih atas partisipasi Anda.</p>
        </div>
      );
    }

    if (notif.type === 'POIN_BERTAMBAH') {
      return (
        <div className="mt-4 bg-yellow-50 p-5 rounded-xl border border-yellow-100 flex flex-col items-center text-center">
          <div className="bg-yellow-100 p-3 rounded-full mb-3">
            <Star size={32} className="text-yellow-600" />
          </div>
          <h4 className="font-bold text-yellow-800 mb-1">Poin Bertambah!</h4>
          <p className="text-sm text-yellow-700">Selamat! Anda mendapatkan tambahan +150 poin dari transaksi terakhir Anda. Kumpulkan terus poin untuk mendapatkan *reward* menarik dari Kelurahan.</p>
        </div>
      );
    }

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600">
        {notif.desc}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Detail Notifikasi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="flex items-start gap-4 mb-2">
            <div className={`w-12 h-12 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center shrink-0 shadow-sm border border-white`}>
              <span className="material-symbols-outlined text-[24px]">{notif.icon}</span>
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-gray-800 leading-tight mb-1">{notif.title}</h4>
              <p className="text-xs text-gray-500 font-medium">{notif.time}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-3">{notif.desc}</p>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const Notifikasi: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  
  const { user } = useAuthStore();
  const role = user?.peran || 'WARGA';

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get(`/notifications?role=${role}`);
        setNotifications(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dari server.');
        toast.error('Gagal memuat notifikasi');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [role]);

  const handleActionClick = (actionName: string) => {
    toast.success(`Aksi "${actionName}" disimulasikan!`);
  };

  const handleViewDetail = (notif: any) => {
    // Mark as read locally
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setSelectedNotif(notif);
  };

  const handleSubmitEmpty = () => {
    toast.success('Pengajuan pengosongan berhasil dikirim ke petugas RT/RW!');
    setSelectedNotif(null);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      {/* Header Actions & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-xl shadow-sm border border-outline-variant/50 gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <h3 className="text-[18px] font-bold text-on-surface whitespace-nowrap">Log Notifikasi</h3>
          <div className="hidden md:block h-6 w-px bg-outline-variant/50"></div>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-1.5 rounded-full border border-primary text-primary text-[12px] font-bold uppercase tracking-wider bg-green-50 hover:bg-green-100 transition-colors">
              Semua ({notifications.length})
            </button>
            <button className="px-4 py-1.5 rounded-full border border-outline-variant/50 text-on-surface-variant text-[12px] font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
              Critical (1)
            </button>
            <button className="px-4 py-1.5 rounded-full border border-outline-variant/50 text-on-surface-variant text-[12px] font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-blue-500">info</span>
              Info ({notifications.length - 1})
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('Semua notifikasi ditandai dibaca');
          }} className="px-4 py-2 text-[12px] font-bold text-primary hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Tandai Semua Dibaca
          </button>
          <button onClick={() => handleActionClick('Pengaturan Notifikasi')} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden flex flex-col p-4 gap-3 min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3 h-full">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
            <p>Memuat notifikasi...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error font-medium h-full flex items-center justify-center">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-medium h-full flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-4xl">notifications_off</span>
            <p>Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => handleViewDetail(notif)}
              className={`p-4 rounded-xl border ${notif.isRead ? 'bg-white border-outline-variant/30 opacity-80' : 'bg-green-50/40 border-primary/20 shadow-sm'} flex items-start gap-4 transition-all hover:bg-surface-container cursor-pointer group`}
            >
              <div className={`w-11 h-11 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                <span className="material-symbols-outlined text-[22px]">{notif.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className={`text-[15px] truncate ${notif.isRead ? 'font-medium' : 'font-bold'} text-gray-800`}>{notif.title}</h4>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap shrink-0">{notif.time}</span>
                </div>
                <p className="text-[13px] text-gray-500 line-clamp-2 pr-4">{notif.desc}</p>
                {!notif.isRead && (
                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-1.5 bg-green-600 text-white text-[11px] font-bold rounded-lg hover:bg-green-700 transition-colors uppercase tracking-wider shadow-sm">
                      Lihat Detail
                    </button>
                  </div>
                )}
              </div>
              {!notif.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 mt-2 shadow-sm"></div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedNotif && (
        <NotificationModal 
          notif={selectedNotif} 
          onClose={() => setSelectedNotif(null)} 
          onSubmitEmpty={handleSubmitEmpty}
        />
      )}
    </div>
  );
};

export default Notifikasi;
