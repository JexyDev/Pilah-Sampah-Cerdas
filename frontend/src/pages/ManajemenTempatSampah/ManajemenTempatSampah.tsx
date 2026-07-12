import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ManajemenTempatSampah: React.FC = () => {
  const [bins, setBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);

  useEffect(() => {
    const fetchBins = async () => {
      try {
        const response = await api.get('/bins');
        setBins(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dari server.');
        toast.error('Gagal memuat data tempat sampah');
      } finally {
        setLoading(false);
      }
    };
    fetchBins();
  }, []);

  const handleActionClick = (actionName: string) => {
    toast.success(`Aksi "${actionName}" disimulasikan!`);
  };

  const openLogModal = (binId: string) => {
    setSelectedBin(binId);
    setIsModalOpen(true);
  };

  const closeLogModal = () => {
    setIsModalOpen(false);
    setSelectedBin(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-headline-xl text-headline-xl text-on-surface">Manajemen Smart Bin</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => handleActionClick('Tambah Tempat Sampah')}
            className="bg-primary text-white px-6 h-12 rounded-lg font-medium text-base hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Titik
          </button>
          <button 
            onClick={() => handleActionClick('Unduh Laporan')}
            className="bg-white border border-outline-variant text-on-surface-variant px-6 h-12 rounded-lg font-medium text-base hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Laporan
          </button>
        </div>
      </div>

      {/* Bin Table */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-[12px] font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Kode</th>
              <th className="px-6 py-4">Lokasi</th>
              <th className="px-6 py-4">Kapasitas</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Update Terakhir</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
                    <p>Memuat data...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-error font-medium">{error}</td>
              </tr>
            ) : (
              bins.map(bin => (
                <tr key={bin.id} className="border-b border-outline-variant/30 hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-on-surface">{bin.kode}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-on-surface">{bin.lokasi}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">{bin.rtRw}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full ${bin.kapasitas > 80 ? 'bg-error' : bin.kapasitas > 50 ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${bin.kapasitas}%` }}></div>
                      </div>
                      <span className="text-[12px] font-bold w-8 text-right">{bin.kapasitas}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${bin.status === 'Penuh' ? 'bg-red-50 text-red-700' : bin.status === 'Normal' ? 'bg-green-50 text-green-700' : bin.status === 'Perbaikan' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'} rounded-full text-[11px] font-bold`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${bin.status === 'Penuh' ? 'bg-red-500' : bin.status === 'Normal' ? 'bg-green-500' : bin.status === 'Perbaikan' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                      {bin.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-[12px]">{bin.lastUpdate}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleActionClick('Lokasi ' + bin.kode)} className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">map</span>
                      </button>
                      <button onClick={() => handleActionClick('Edit ' + bin.kode)} className="w-8 h-8 rounded-md bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-on-surface/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
              <div>
                <h3 className="text-[20px] font-bold text-on-surface">Scan Transaction Logs</h3>
                <p className="text-[12px] font-bold text-on-surface-variant">Bin ID: {selectedBin} • Status Aktivasi Warga: {selectedBin === 'TS-COB-001' ? 'Teraktivasi' : 'Belum Teraktivasi'}</p>
              </div>
              <button 
                className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors" 
                onClick={closeLogModal}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/50 text-on-surface-variant text-[12px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal & Waktu</th>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Berat (kg)</th>
                    <th className="py-3 px-4">Jenis</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] text-on-surface">
                  <tr className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">24 Okt 2026, 14:30</td>
                    <td className="py-3 px-4">Budi Santoso</td>
                    <td className="py-3 px-4 font-bold">1,25</td>
                    <td className="py-3 px-4"><span className="text-primary font-bold">Organik</span></td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">24 Okt 2026, 11:15</td>
                    <td className="py-3 px-4">Siti Aminah</td>
                    <td className="py-3 px-4 font-bold">0,80</td>
                    <td className="py-3 px-4"><span className="text-primary font-bold">Organik</span></td>
                  </tr>
                  <tr className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">23 Okt 2026, 16:45</td>
                    <td className="py-3 px-4">Ahmad Hidayat</td>
                    <td className="py-3 px-4 font-bold">2,10</td>
                    <td className="py-3 px-4"><span className="text-blue-600 font-bold">Anorganik</span></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">23 Okt 2026, 09:20</td>
                    <td className="py-3 px-4">Rina Marlina</td>
                    <td className="py-3 px-4 font-bold">1,50</td>
                    <td className="py-3 px-4"><span className="text-primary font-bold">Organik</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end">
              <button 
                className="px-4 py-2 border border-outline-variant/50 text-on-surface rounded-lg text-[12px] font-bold hover:bg-surface-container-low transition-colors" 
                onClick={closeLogModal}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ManajemenTempatSampah;
