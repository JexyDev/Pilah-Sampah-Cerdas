import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PoinWarga: React.FC = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const response = await api.get('/transactions/leaderboard');
        setLeaders(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dari server.');
        toast.error('Gagal memuat leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  const handleActionClick = (actionName: string) => {
    toast.success(`Aksi "${actionName}" disimulasikan!`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Poin Warga</h2>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Pantau leaderboard dan peringkat setoran poin warga.
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Leaderboard Section */}
        <section className="bg-white rounded-xl shadow-sm p-5 flex flex-col h-full border border-outline-variant/50 xl:col-span-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-outline-variant/30 gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary bg-green-50 p-1.5 rounded-lg">leaderboard</span>
              <h3 className="text-[20px] font-bold text-on-surface">Leaderboard Warga</h3>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="Cari Nama atau NIK..." 
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-[12px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none" 
                />
              </div>
              <button className="text-primary text-[12px] font-bold hover:underline whitespace-nowrap">
                Lihat Semua
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
                <p>Memuat leaderboard...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-error font-medium">{error}</div>
            ) : (
              leaders.map(leader => (
                <div key={leader.rank} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg ${leader.rank === 1 ? 'bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container' : 'bg-white hover:bg-surface-container-lowest border-b border-outline-variant/30'} transition-colors gap-4`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full ${leader.bg || 'bg-surface-container'} ${leader.color || 'text-on-surface'} flex items-center justify-center font-bold text-sm`}>{leader.rank}</div>
                    <div>
                      <p className="text-[14px] font-bold text-on-surface">{leader.nama}</p>
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">{leader.rtRw || 'RT/RW'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 self-end sm:self-auto">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${leader.rank <= 3 ? 'text-primary' : 'text-on-surface'}`}>{leader.poin}</p>
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Poin</p>
                    </div>
                    <button onClick={() => handleActionClick('Detail Profil ' + leader.nama)} className={`px-4 py-1.5 rounded-lg border ${leader.rank === 1 ? 'border-primary text-primary hover:bg-green-50' : 'border-outline-variant text-on-surface hover:bg-surface-container'} text-[11px] font-bold uppercase tracking-wider transition-colors`}>Detail Profil</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PoinWarga;
