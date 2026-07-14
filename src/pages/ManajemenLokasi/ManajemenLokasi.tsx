import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ManajemenLokasi: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get('/bins');
        setLocations(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dari server.');
        toast.error('Gagal memuat data lokasi');
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const handleActionClick = (actionName: string) => {
    toast.success(`Aksi "${actionName}" disimulasikan!`);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 bg-surface-container">
      {/* Left Panel: Map Container */}
      <div className="flex-1 relative flex flex-col bg-surface-container-lowest border-r border-outline-variant/50">
        {/* Map Overlay / Tools */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md shadow-lg rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-3">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Status Tempat Sampah</p>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(0,109,55,0.4)]"></div>
              <span className="text-[12px] font-semibold text-on-surface">Organik Aktif</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,99,151,0.4)]"></div>
              <span className="text-[12px] font-semibold text-on-surface">Non-Organik Aktif</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(186,26,26,0.4)] animate-pulse"></div>
              <span className="text-[12px] font-semibold text-on-surface">Perlu Perhatian</span>
            </div>
          </div>
        </div>

        {/* Simulated Map Image */}
        <div className="w-full h-full relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757876800742!2d107.60946252981977!3d-6.880479133333333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6580f4f9f4d%3A0x6b30fef6a75f850e!2sCoblong%2C%20Bandung%20City%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1720800000000!5m2!1sen!2sid"
            className="w-full h-full border-0 grayscale opacity-85"
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* Right Panel: Data Sidebar */}
      <div className="w-[400px] bg-white border-l border-outline-variant/50 flex flex-col h-full z-20 shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
        {/* Panel Header */}
        <div className="p-5 border-b border-outline-variant/30 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[18px] font-bold text-on-surface">Daftar Lokasi (RW)</h3>
                <p className="text-[12px] text-on-surface-variant">6 Kelurahan, 76 RW, 469 RT</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleActionClick('Tambah Lokasi')}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-[11px] py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
                  Tambah
                </button>
                <button 
                  onClick={() => handleActionClick('Pemetaan Lokasi')}
                  className="bg-white hover:bg-surface-container-low border border-outline-variant/30 text-on-surface-variant font-bold text-[11px] py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  Peta
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 w-full">
              <div className="relative">
                <select className="appearance-none pl-3 pr-8 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-[13px] focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-on-surface-variant font-medium">
                  <option>Semua Kelurahan</option>
                  <option>Dago</option>
                  <option>Sekeloa</option>
                  <option>Sadang Serang</option>
                  <option>Lebak Gede</option>
                  <option>Lebak Siliwangi</option>
                  <option>Cipaganti</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
              </div>
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-[18px]">search</span>
                <input 
                  className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant/50 rounded-lg text-[13px] focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                  placeholder="Cari RW..." 
                  type="text" 
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* RW List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-surface-container-lowest">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
              <p>Memuat lokasi...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-error font-medium">{error}</div>
          ) : (
            locations.map((loc) => (
              <div key={loc.id} className="group bg-white border border-outline-variant/50 rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all duration-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface font-bold text-lg">{loc.rw}</div>
                    <div>
                      <h4 className="text-[18px] font-bold text-on-surface">RW {loc.rw}</h4>
                      <p className="text-[12px] font-medium text-on-surface-variant">{loc.rtCount} RT • {loc.titikCount} Titik Sampah</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 bg-green-50 text-primary text-[11px] rounded-full font-bold">{loc.patuh} Patuh</span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">expand_more</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManajemenLokasi;
