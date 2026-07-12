import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Notifikasi: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dari server.');
        toast.error('Gagal memuat notifikasi');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleActionClick = (actionName: string) => {
    toast.success(`Aksi "${actionName}" disimulasikan!`);
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
              Semua (12)
            </button>
            <button className="px-4 py-1.5 rounded-full border border-outline-variant/50 text-on-surface-variant text-[12px] font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
              Critical (2)
            </button>
            <button className="px-4 py-1.5 rounded-full border border-outline-variant/50 text-on-surface-variant text-[12px] font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-yellow-500">warning</span>
              Warning (4)
            </button>
            <button className="px-4 py-1.5 rounded-full border border-outline-variant/50 text-on-surface-variant text-[12px] font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-blue-500">info</span>
              Info (6)
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleActionClick('Tandai semua dibaca')} className="px-4 py-2 text-[12px] font-bold text-primary hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Tandai Semua Dibaca
          </button>
          <button onClick={() => handleActionClick('Pengaturan Notifikasi')} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden flex flex-col p-4 gap-3">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
            <p>Memuat notifikasi...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error font-medium">{error}</div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`p-4 rounded-xl border ${notif.isRead ? 'bg-white border-outline-variant/30 opacity-70' : 'bg-green-50/30 border-primary/20 shadow-sm'} flex items-start gap-4 transition-colors hover:bg-surface-container-lowest cursor-pointer`}>
              <div className={`w-10 h-10 rounded-full ${notif.iconBg} ${notif.iconColor} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-[14px] ${notif.isRead ? 'font-medium' : 'font-bold'} text-on-surface`}>{notif.title}</h4>
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{notif.time}</span>
                </div>
                <p className="text-[14px] text-on-surface-variant line-clamp-2">{notif.desc}</p>
                {!notif.isRead && (
                  <div className="mt-3 flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); handleActionClick('Lihat Detail ' + notif.id) }} className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded hover:bg-primary/90 transition-colors uppercase tracking-wider">
                      Lihat Detail
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleActionClick('Tandai Dibaca ' + notif.id) }} className="px-3 py-1.5 border border-outline-variant text-on-surface text-[11px] font-bold rounded hover:bg-surface-container transition-colors uppercase tracking-wider">
                      Tandai Dibaca
                    </button>
                  </div>
                )}
              </div>
              {!notif.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifikasi;
