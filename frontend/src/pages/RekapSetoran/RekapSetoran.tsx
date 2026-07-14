import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const RekapSetoran: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const response = await api.get('/transactions/deposits');
        setDeposits(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dari server.');
        toast.error('Gagal memuat data setoran');
      } finally {
        setLoading(false);
      }
    };
    fetchDeposits();
  }, []);

  const handleActionClick = (actionName: string) => {
    toast.success(`Aksi "${actionName}" disimulasikan!`);
  };

  return (
    <div className="flex flex-col">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-1">Rekap & Analisis Setoran</h2>
          <p className="text-[14px] text-on-surface-variant">
            Ringkasan data setoran sampah warga di wilayah <span className="font-bold text-on-surface">Kecamatan Coblong</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => handleActionClick('Ekspor Excel')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant/50 rounded-lg text-on-surface text-[12px] font-bold hover:bg-surface-container-low transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">description</span>
            Ekspor Excel
          </button>
          <button 
            onClick={() => handleActionClick('Ekspor CSV')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant/50 rounded-lg text-on-surface text-[12px] font-bold hover:bg-surface-container-low transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">grid_on</span>
            Ekspor CSV
          </button>
          <button 
            onClick={() => handleActionClick('Unduh Laporan PDF')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-[12px] font-bold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Unduh Laporan PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        <div className="col-span-1 md:col-span-8 bg-white rounded-xl p-5 shadow-sm border border-outline-variant/50 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Rentang Waktu</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">calendar_month</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-[14px] text-on-surface transition-colors" readOnly type="text" value="01 Okt 2026 - 31 Okt 2026" />
            </div>
          </div>
          <div className="w-px h-10 bg-outline-variant/30 hidden md:block"></div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Kelurahan</label>
            <select className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-[14px] text-on-surface appearance-none transition-colors">
              <option value="semua">Semua Kelurahan</option>
              <option value="dago">Dago</option>
              <option value="lebak_siliwangi">Lebak Siliwangi</option>
              <option value="cipaganti">Cipaganti</option>
            </select>
          </div>
          <div className="w-px h-10 bg-outline-variant/30 hidden md:block"></div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">RT</label>
            <div className="relative">
              <select className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-[14px] text-on-surface appearance-none transition-colors">
                <option value="semua">Semua RT</option>
                <option value="01">RT 01</option>
                <option value="02">RT 02</option>
                <option value="03">RT 03</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
            </div>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">RW</label>
            <div className="relative">
              <select className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-[14px] text-on-surface appearance-none transition-colors">
                <option value="semua">Semua RW</option>
                <option value="01">RW 01</option>
                <option value="02">RW 02</option>
                <option value="03">RW 03</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* Quick Stat */}
        <div className="col-span-1 md:col-span-4 bg-primary rounded-xl p-5 shadow-sm text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <p className="text-[12px] font-bold mb-1 opacity-90 text-green-100">Total Setoran (Bulan Ini)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold">4.250</h3>
            <span className="text-[14px] mb-1 opacity-90 text-green-100">Kg</span>
          </div>
          <div className="flex items-center mt-2 text-sm text-green-100">
            <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
            <span className="text-[11px] font-bold">+12% dari bulan lalu</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content (Asymmetric Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Analytics Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-outline-variant/50 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Tren Setoran Sampah</h3>
              <p className="text-[11px] font-bold text-on-surface-variant mt-1 uppercase tracking-wider">Perbandingan Organik vs Anorganik (6 Bulan Terakhir)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-[18px]">eco</span>
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Organik</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-[18px]">recycling</span>
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Anorganik</span>
              </div>
            </div>
          </div>
          {/* Chart Area */}
          <div className="flex-1 flex flex-col justify-end min-h-[250px] w-full mt-4">
            <div className="flex-1 flex items-end justify-between gap-6 h-[200px] pt-4 pb-2 px-2 border-b border-outline-variant/30 relative">
              {/* Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-dashed border-outline-variant/20 h-0"></div>
                <div className="w-full border-t border-dashed border-outline-variant/20 h-0"></div>
                <div className="w-full border-t border-dashed border-outline-variant/20 h-0"></div>
                <div className="w-full h-0"></div>
              </div>
              
              {[
                { month: 'Mei', organik: 60, anorganik: 40 },
                { month: 'Jun', organik: 70, anorganik: 30 },
                { month: 'Jul', organik: 55, anorganik: 45 },
                { month: 'Agu', organik: 80, anorganik: 20 },
                { month: 'Sep', organik: 65, anorganik: 35 },
                { month: 'Okt', organik: 75, anorganik: 25 },
              ].map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end z-10">
                  <div className="w-full flex items-end justify-center gap-1.5 h-[160px]">
                    {/* Organik Bar */}
                    <div className="relative flex-1 flex justify-center group/tooltip h-full items-end">
                      <div className="w-4 bg-primary rounded-t-sm hover:opacity-90 transition-all duration-300 shadow-sm" style={{ height: `${item.organik}%` }}></div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-on-surface text-white text-[10px] px-2 py-1 rounded shadow opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-bold">
                        Organik: {item.organik * 10} kg
                      </div>
                    </div>
                    {/* Anorganik Bar */}
                    <div className="relative flex-1 flex justify-center group/tooltip h-full items-end">
                      <div className="w-4 bg-secondary rounded-t-sm hover:opacity-90 transition-all duration-300 shadow-sm" style={{ height: `${item.anorganik}%` }}></div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-on-surface text-white text-[10px] px-2 py-1 rounded shadow opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 font-bold">
                        Anorganik: {item.anorganik * 10} kg
                      </div>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-on-surface-variant group-hover:text-primary transition-colors">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Composition & Mini Stats */}
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-6">
          {/* Doughnut Chart Area */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/50 flex-1 flex flex-col items-center justify-center relative">
            <h3 className="text-[18px] font-bold text-on-surface absolute top-5 left-5">Komposisi</h3>
            <div className="w-32 h-32 relative mt-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                <path className="text-green-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="72, 100" strokeWidth="4"></path>
                <path className="text-blue-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="28, 100" strokeDashoffset="-72" strokeWidth="4"></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[18px] font-bold text-on-surface">72%</span>
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Organik</span>
              </div>
            </div>
          </div>
          {/* Stat Card 2 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/50 border-l-4 border-l-blue-600 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Total Poin Dibagikan</p>
              <h4 className="text-[20px] font-bold text-on-surface">128.500 <span className="text-[14px] font-normal text-on-surface-variant">Pts</span></h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
        <div className="p-5 border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[18px] font-bold text-on-surface">Riwayat Setoran Detail</h3>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary text-[14px] transition-colors outline-none" placeholder="Cari nama warga..." type="text" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">ID Transaksi</th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tanggal</th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Warga / Penyetor</th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kategori</th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Berat (Kg)</th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Poin</th>
                <th className="py-3 px-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-outline-variant/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
                      <p>Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-error font-medium">{error}</td>
                </tr>
              ) : (
                deposits.map(deposit => (
                  <tr key={deposit.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="py-3 px-4 text-on-surface-variant font-mono text-sm">#{deposit.id}</td>
                    <td className="py-3 px-4 text-on-surface">{deposit.tanggal}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface font-bold text-xs">
                          {deposit.warga.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-on-surface font-bold">{deposit.warga}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${deposit.kategori.includes('Kertas') || deposit.kategori.includes('Plastik') || deposit.kategori.includes('Logam') || deposit.kategori.includes('Kaca') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {deposit.kategori.includes('Kertas') || deposit.kategori.includes('Plastik') || deposit.kategori.includes('Logam') || deposit.kategori.includes('Kaca') ? 'Anorganik' : 'Organik'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-on-surface font-bold">{deposit.berat}</td>
                    <td className="py-3 px-4 text-right text-primary font-bold">{deposit.poin}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleActionClick('Opsi ' + deposit.id)} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant">
          <span className="text-[11px] font-bold uppercase tracking-wider">Menampilkan 1-2 dari 1,240 data</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 hover:bg-surface-container-low transition-colors disabled:opacity-50 bg-white" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white text-[12px] font-bold shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 hover:bg-surface-container-low transition-colors text-[12px] font-bold bg-white">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 hover:bg-surface-container-low transition-colors text-[12px] font-bold bg-white">3</button>
            <span className="w-8 h-8 flex items-center justify-center">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/50 hover:bg-surface-container-low transition-colors bg-white">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RekapSetoran;
