import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const JadwalKegiatan: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await api.get('/schedules');
        setSchedules(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dari server.');
        toast.error('Gagal memuat jadwal kegiatan');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);


  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-surface-container">
      {/* Canvas */}
      <main className="flex-1 overflow-hidden flex bg-surface p-6 gap-6 relative">
        {/* Calendar Section */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-[20px] font-bold text-on-surface">Oktober 2026</h2>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="text-[12px] font-bold px-3 py-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors">
                  Hari Ini
                </button>
                <button className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors">
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
              <div className="py-2 text-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Senin</div>
              <div className="py-2 text-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Selasa</div>
              <div className="py-2 text-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Rabu</div>
              <div className="py-2 text-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kamis</div>
              <div className="py-2 text-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Jumat</div>
              <div className="py-2 text-center text-[11px] font-bold text-red-500 uppercase tracking-wider">Sabtu</div>
              <div className="py-2 text-center text-[11px] font-bold text-red-500 uppercase tracking-wider">Minggu</div>
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-outline-variant/30 gap-[1px]">
              {/* Row 1 */}
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface-variant mb-1">25</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface-variant mb-1">26</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface-variant mb-1">27</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface-variant mb-1">28</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface-variant mb-1">29</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-red-300 opacity-50 mb-1">30</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-red-300 opacity-50 mb-1">1</div>
                <div className="mt-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-1 rounded truncate w-full" title="Pengangkutan RW 06">Pengangkutan RW 06</div>
              </div>
              
              {/* Row 2 */}
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface mb-1">2</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface mb-1">3</div>
                <div className="mt-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-1 rounded truncate w-full" title="Workshop Kompos">Workshop Kompos</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface mb-1">4</div>
              </div>
              <div className="bg-white p-2 bg-blue-50/30 border-2 border-blue-500 cursor-pointer relative shadow-sm">
                <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-500 py-0.5"></div>
                <div className="text-right text-[12px] text-on-surface font-bold mb-1 py-0.5">5</div>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-1 rounded truncate w-full py-0.5">Pengangkutan RW 04</div>
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold px-1 rounded truncate w-full py-0.5">Sosialisasi Warga</div>
                </div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-on-surface mb-1">6</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-red-500 mb-1">7</div>
              </div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="text-right text-[12px] font-medium text-red-500 mb-1">8</div>
              </div>

              {/* Row 3 */}
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">9</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">10</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">11</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">12</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">13</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-red-500 mb-1">14</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-red-500 mb-1">15</div></div>
              
              {/* Row 4 */}
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">16</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">17</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">18</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">19</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">20</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-red-500 mb-1">21</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-red-500 mb-1">22</div></div>
              
              {/* Row 5 */}
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">23</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">24</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">25</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">26</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-on-surface mb-1">27</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-red-500 mb-1">28</div></div>
              <div className="bg-white p-2 hover:bg-surface-container-low transition-colors cursor-pointer group"><div className="text-right text-[12px] font-medium text-red-500 mb-1">29</div></div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Details */}
        <aside className="w-[320px] bg-white rounded-xl shadow-sm border border-outline-variant/50 flex flex-col shrink-0 overflow-hidden transition-all">
          <div className="p-5 border-b border-outline-variant/30 bg-surface-container-low/30">
            <h3 className="text-[18px] font-bold text-on-surface">Detail Kegiatan Hari Ini</h3>
            <p className="text-[11px] font-bold text-on-surface-variant mt-1 uppercase tracking-wider">Kamis, 5 Oktober 2026</p>
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
              schedules.map(schedule => (
                <div key={schedule.id} className="p-3 border border-outline-variant/50 rounded-lg bg-surface-container-lowest hover:border-primary transition-colors cursor-pointer group relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${schedule.color.split(' ')[0].replace('bg-', 'bg-').replace('100', '500')}`}></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <span className={`${schedule.color} text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold`}>{schedule.jenis}</span>
                    <span className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {schedule.waktu}</span>
                  </div>
                  <h4 className="text-[14px] font-bold text-on-surface mb-1 pl-2">{schedule.nama}</h4>
                  <p className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1 pl-2 mb-1"><span className="material-symbols-outlined text-[14px]">event</span> {schedule.tanggal}</p>
                  <p className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1 pl-2"><span className="material-symbols-outlined text-[14px]">location_on</span> {schedule.lokasi}</p>
                </div>
              ))
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
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Judul Kegiatan</label>
                  <input 
                    className="w-full border border-outline-variant/50 rounded-md px-3 py-2 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" 
                    placeholder="Contoh: Pengangkutan RW 01" 
                    type="text" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tanggal</label>
                    <input 
                      className="w-full border border-outline-variant/50 rounded-md px-3 py-2 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" 
                      type="date" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Waktu</label>
                    <input 
                      className="w-full border border-outline-variant/50 rounded-md px-3 py-2 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow" 
                      type="time" 
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kategori</label>
                  <select className="w-full border border-outline-variant/50 rounded-md px-3 py-2 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow bg-white">
                    <option>Pengangkutan</option>
                    <option>Sosialisasi</option>
                    <option>Workshop</option>
                    <option>Validasi Data</option>
                  </select>
                </div>
              </div>
              <div className="p-5 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-lowest">
                <button 
                  className="text-[12px] font-bold text-on-surface-variant px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button 
                  className="bg-primary text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  onClick={() => setIsModalOpen(false)}
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
