import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const KategoriSampah: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dari server.');
        toast.error('Gagal memuat kategori');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleActionClick = (actionName: string) => {
    toast.success(`Aksi "${actionName}" disimulasikan!`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-on-surface mb-2">Konfigurasi Kategori Sampah</h2>
        <p className="text-[14px] text-on-surface-variant max-w-4xl">
          Atur faktor konversi dan nilai poin untuk setiap jenis sampah. Faktor densitas digunakan untuk mengubah volume (Liter) yang tercatat di fasilitas fisik menjadi berat ekuivalen (Kilogram) untuk keperluan kalkulasi poin warga secara otomatis.
        </p>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kategori Sampah</th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Jenis</th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Poin & Harga</th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Deskripsi</th>
                <th className="py-4 px-6 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-[14px] text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
                      <p>Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-error font-medium">{error}</td>
                </tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id} className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors duration-150 group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.iconBg} ${cat.iconColor}`}>
                          <span className="material-symbols-outlined text-[20px]">{cat.jenis === 'Organik' ? 'eco' : 'recycling'}</span>
                        </div>
                        <span className="font-bold text-on-surface">{cat.nama}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md font-bold text-[11px] tracking-wide uppercase ${cat.jenis === 'Organik' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {cat.jenis}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-primary mb-1">{cat.poin}</p>
                      <p className="text-[12px] text-on-surface-variant">{cat.harga}</p>
                    </td>
                    <td className="py-4 px-6 text-[12px] text-on-surface-variant max-w-xs truncate" title={cat.desc}>
                      {cat.desc}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => handleActionClick('Edit ' + cat.nama)} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors inline-flex items-center justify-center opacity-70 group-hover:opacity-100" title="Edit Kategori">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer/Hint */}
        <div className="bg-surface-container-lowest px-6 py-4 border-t border-outline-variant/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">info</span>
          <p className="text-[11px] font-bold text-on-surface-variant leading-none">
            Perubahan pada faktor densitas dan poin akan berlaku pada transaksi yang dicatat setelah perubahan disimpan. Data historis tidak akan terpengaruh.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KategoriSampah;
