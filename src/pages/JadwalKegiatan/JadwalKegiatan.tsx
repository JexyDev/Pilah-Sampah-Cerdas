import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const JadwalKegiatan: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    category: 'Pengangkutan',
    location: ''
  });

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules');
      // Backend returns array under data.data
      const raw = response.data.data;
      setSchedules(Array.isArray(raw) ? raw : []);
    } catch (err) {
      setError('Gagal memuat data dari server.');
      toast.error('Gagal memuat jadwal kegiatan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Safe date formatter — returns fallback string instead of crashing
  const safeFormatDate = (dateStr: string | null | undefined, opts: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', opts);
  };

  const safeFormatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmit = async () => {
    // Validasi: title dan date wajib diisi
    if (!formData.title.trim()) {
      toast.error('Nama kegiatan wajib diisi');
      return;
    }
    if (!formData.date) {
      toast.error('Tanggal wajib diisi');
      return;
    }
    // Validasi format tanggal
    const testDate = new Date(formData.date);
    if (isNaN(testDate.getTime())) {
      toast.error('Format tanggal tidak valid');
      return;
    }
    try {
      await api.post('/schedules', {
        ...formData,
        date: new Date(formData.date).toISOString(), // kirim ISO 8601 ke backend
      });
      toast.success('Jadwal berhasil ditambahkan!');
      setIsModalOpen(false);
      fetchSchedules();
      setFormData({ title: '', date: '', time: '', category: 'Pengangkutan', location: '' });
    } catch (err) {
      toast.error('Gagal menambahkan jadwal');
    }
  };

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  const days = [];
  
  // Previous month trailing days
  for (let i = 0; i < startDay; i++) {
    days.push({
      day: prevMonthDays - startDay + i + 1,
      isCurrentMonth: false,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - startDay + i + 1)
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
    });
  }
  
  // Next month leading days (to fill 42 slots, 6 rows)
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
    });
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  // Match schedules to a calendar day using the `date` field (ISO 8601 from backend)
  const getSchedulesForDay = (date: Date) => {
    const target = date.toISOString().split('T')[0];
    return schedules.filter(s => {
      if (!s.date) return false;
      const sDate = new Date(s.date);
      if (isNaN(sDate.getTime())) return false;
      return sDate.toISOString().split('T')[0] === target;
    });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-surface-container">
      {/* Canvas */}
      <main className="flex-1 overflow-hidden flex bg-surface p-6 gap-6 relative">
        {/* Calendar Section */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-[20px] font-bold text-on-surface">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button onClick={goToToday} className="text-[12px] font-bold px-3 py-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors">
                  Hari Ini
                </button>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            <button 
              className="bg-primary text-white text-[12px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors active:scale-95 transform shadow-sm"
              onClick={() => setIsModalOpen(true)}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Buat Jadwal Baru
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-outline-variant/30 shrink-0 bg-surface-container-lowest">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d, i) => (
                <div key={d} className={`py-2 text-center text-[11px] font-bold ${i >= 5 ? 'text-red-500' : 'text-on-surface-variant'} uppercase tracking-wider`}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-outline-variant/30 gap-[1px]">
              {days.map((day, i) => {
                const daySchedules = getSchedulesForDay(day.date);
                const isToday = new Date().toDateString() === day.date.toDateString();
                
                return (
                  <div key={i} className={`bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group ${!day.isCurrentMonth ? 'opacity-50' : ''} ${isToday ? 'bg-blue-50/30 border-2 border-blue-500 relative' : ''}`}>
                    {isToday && <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-500 py-0.5"></div>}
                    <div className={`text-right text-[12px] font-medium mb-1 ${isToday ? 'text-on-surface font-bold' : ((i%7 >= 5) ? 'text-red-500' : 'text-on-surface')}`}>{day.day}</div>
                    
                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[80px]">
                      {daySchedules.map(s => {
                        let colorCls = 'bg-blue-50 border-blue-200 text-blue-700';
                        const titleLower = (s.title || '').toLowerCase();
                        const catLower = (s.category || '').toLowerCase();
                        if (catLower.includes('pengangkutan') || titleLower.includes('pengangkutan')) colorCls = 'bg-green-50 border-green-200 text-green-700';
                        if (catLower.includes('sosialisasi') || titleLower.includes('sosialisasi')) colorCls = 'bg-orange-50 border-orange-200 text-orange-700';
                        if (catLower.includes('rapat') || titleLower.includes('rapat')) colorCls = 'bg-purple-50 border-purple-200 text-purple-700';
                        
                        return (
                          <div key={s.id} className={`border text-[10px] font-bold px-1 rounded truncate w-full py-0.5 ${colorCls}`} title={s.title}>
                            {s.title || '(tanpa judul)'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Details */}
        <aside className="w-[320px] bg-white rounded-xl shadow-sm border border-outline-variant/50 flex flex-col shrink-0 overflow-hidden transition-all">
          <div className="p-5 border-b border-outline-variant/30 bg-surface-container-low/30">
            <h3 className="text-[18px] font-bold text-on-surface">Detail Kegiatan Hari Ini</h3>
            <p className="text-[11px] font-bold text-on-surface-variant mt-1 uppercase tracking-wider">{currentDate.toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {loading ? (
              <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
                <p>Memuat agenda...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-error font-medium">{error}</div>
            ) : schedules.length > 0 ? (
              schedules.slice(0, 5).map(schedule => {
                const catColor: Record<string, string> = {
                  'Pengangkutan': 'bg-green-500',
                  'Sosialisasi': 'bg-orange-500',
                  'Rapat': 'bg-purple-500',
                  'Lainnya': 'bg-blue-500',
                };
                const barColor = catColor[schedule.category] || 'bg-blue-500';
                const badgeColor: Record<string, string> = {
                  'Pengangkutan': 'bg-green-100 text-green-700',
                  'Sosialisasi': 'bg-orange-100 text-orange-700',
                  'Rapat': 'bg-purple-100 text-purple-700',
                  'Lainnya': 'bg-blue-100 text-blue-700',
                };
                const badge = badgeColor[schedule.category] || 'bg-blue-100 text-blue-700';
                return (
                <div key={schedule.id} className="p-3 border border-outline-variant/50 rounded-lg bg-surface-container-lowest hover:border-primary transition-colors cursor-pointer group relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`}></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <span className={`${badge} text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold`}>{schedule.category || 'Kegiatan'}</span>
                    <span className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {schedule.time || safeFormatTime(schedule.date)}
                    </span>
                  </div>
                  <h4 className="text-[14px] font-bold text-on-surface mb-1 pl-2">{schedule.title || '(tanpa judul)'}</h4>
                  <p className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1 pl-2 mb-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    {safeFormatDate(schedule.date, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1 pl-2">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {schedule.location || '-'}
                  </p>
                </div>
              )})
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-outline-variant/50 rounded-lg text-center opacity-70">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">event_available</span>
                <p className="text-[11px] font-medium text-on-surface-variant">Tidak ada kegiatan lain dijadwalkan.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Modal Overlay */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg w-[480px] max-w-[90%] overflow-hidden flex flex-col transform transition-all duration-200">
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
                <h3 className="text-[18px] font-bold text-on-surface">Buat Jadwal Baru</h3>
                <button 
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-on-surface-variant">Nama Kegiatan <span className="text-error">*</span></label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]" placeholder="Contoh: Sosialisasi Pengomposan" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-on-surface-variant">Tanggal <span className="text-error">*</span></label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">calendar_today</span>
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-on-surface-variant">Waktu <span className="text-error">*</span></label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">schedule</span>
                      <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-on-surface-variant">Kategori <span className="text-error">*</span></label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px] bg-white text-on-surface">
                    <option value="Pengangkutan">Pengangkutan</option>
                    <option value="Sosialisasi">Sosialisasi</option>
                    <option value="Rapat">Rapat</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-on-surface-variant">Lokasi (Opsional)</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="px-4 py-2 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-[14px]" placeholder="Contoh: Balai RW 06" />
                </div>
              </div>
              <div className="p-5 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  className="px-4 py-2 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button 
                  className="px-4 py-2 text-[14px] font-bold bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
                  onClick={handleSubmit}
                >
                  Simpan Jadwal
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JadwalKegiatan;
