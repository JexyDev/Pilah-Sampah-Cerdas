import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

// ========== Sub-Components ==========

const KpiCard: React.FC<{ iconName: string; iconBg: string; iconColor: string; label: string; value: string; trend: string; trendLabel: string; trendUp?: boolean; }> = ({ iconName, iconBg, iconColor, label, value, trend, trendLabel, trendUp = true }) => (
  <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl border border-outline-variant/30 flex flex-col items-start gap-3 shadow-sm hover:-translate-y-0.5 transition-all duration-300">
    <div className={`w-10 h-10 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{iconName}</span>
    </div>
    <div className="min-w-0 w-full">
      <p className="text-label-sm text-on-surface-variant font-medium tracking-wide">{label}</p>
      <h3 className="text-[20px] font-extrabold text-on-surface leading-tight mt-1">{value}</h3>
      <div className={`flex items-center text-[11px] ${trendUp ? 'text-primary' : 'text-on-surface-variant'} font-bold mt-2`}>
        {trendUp ? (
          <span className="material-symbols-outlined text-[14px] mr-0.5">arrow_upward</span>
        ) : (
          <span className="material-symbols-outlined text-[14px] mr-0.5 text-on-surface-variant">arrow_downward</span>
        )}
        <span>{trend}</span>
        <span className="text-on-surface-variant font-normal ml-1">{trendLabel}</span>
      </div>
    </div>
  </div>
);

// ========== Main Dashboard ==========

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data.data);
      } catch (err) {
        setError('Gagal memuat data dashboard dari server.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>autorenew</span>
          <p className="text-on-surface-variant font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px]">error</span>
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-gutter pb-12">

      {/* === KPI Section (6 Cards) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter">
        <KpiCard iconName="group" iconBg="bg-blue-100" iconColor="text-blue-600" label="Total Pengguna" value={stats?.totalPengguna?.value} trend={stats?.totalPengguna?.trend} trendLabel={stats?.totalPengguna?.trendLabel} trendUp={stats?.totalPengguna?.trendUp} />
        <KpiCard iconName="delete" iconBg="bg-green-100" iconColor="text-green-600" label="Tempat Sampah Aktif" value={stats?.tempatSampahAktif?.value} trend={stats?.tempatSampahAktif?.trend} trendLabel={stats?.tempatSampahAktif?.trendLabel} trendUp={stats?.tempatSampahAktif?.trendUp} />
        <KpiCard iconName="location_on" iconBg="bg-indigo-100" iconColor="text-indigo-600" label="Lokasi Terdaftar" value={stats?.lokasiTerdaftar?.value} trend={stats?.lokasiTerdaftar?.trend} trendLabel={stats?.lokasiTerdaftar?.trendLabel} trendUp={stats?.lokasiTerdaftar?.trendUp} />
        <KpiCard iconName="shopping_bag" iconBg="bg-amber-100" iconColor="text-amber-600" label="Setoran Hari Ini" value={stats?.setoranHariIni?.value} trend={stats?.setoranHariIni?.trend} trendLabel={stats?.setoranHariIni?.trendLabel} trendUp={stats?.setoranHariIni?.trendUp} />
        <KpiCard iconName="stars" iconBg="bg-yellow-100" iconColor="text-yellow-600" label="Total Poin" value={stats?.totalPoin?.value} trend={stats?.totalPoin?.trend} trendLabel={stats?.totalPoin?.trendLabel} trendUp={stats?.totalPoin?.trendUp} />
        <KpiCard iconName="calendar_month" iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Jadwal Minggu Ini" value={stats?.jadwalMingguIni?.value} trend={stats?.jadwalMingguIni?.trend} trendLabel={stats?.jadwalMingguIni?.trendLabel} trendUp={stats?.jadwalMingguIni?.trendUp} />
      </div>

      {/* === Charts Grid === */}
      <div className="flex gap-gutter h-[340px]">
        {/* Line Chart — Trend Setoran */}
        <div className="w-1/2 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-[18px] text-on-surface">Trend Setoran Sampah per Minggu <span className="text-[12px] text-on-surface-variant font-normal">(kg)</span></h4>
            <div className="bg-surface-container px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-2 cursor-pointer">
              <span>8 Minggu Terakhir</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </div>
          </div>
          {/* SVG Line Chart */}
          <div className="h-[220px] w-full relative">
            <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006d37" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#006d37" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              {[0, 50, 100, 150, 200].map(y => (
                <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="#f0f2f5" strokeWidth="1" />
              ))}
              {/* Area Fill */}
              <path d="M0,160 L100,140 L200,120 L300,90 L400,110 L500,80 L600,50 L700,30 L700,200 L0,200 Z" fill="url(#lineGrad)" />
              {/* Line */}
              <path d="M0,160 L100,140 L200,120 L300,90 L400,110 L500,80 L600,50 L700,30" fill="none" stroke="#006d37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {/* Dots */}
              {[
                [0, 160], [100, 140], [200, 120], [300, 90], [400, 110], [500, 80], [600, 50], [700, 30]
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="5" fill="#006d37" stroke="white" strokeWidth="2" />
              ))}
            </svg>
            {/* X-axis labels */}
            <div className="absolute bottom-[-4px] left-0 right-0 flex justify-between px-1">
              {['Mng 12','Mng 13','Mng 14','Mng 15','Mng 16','Mng 17','Mng 18','Mng 19'].map((w, i) => (
                <span key={i} className="text-[10px] text-on-surface-variant font-bold">{w}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart — Komposisi Sampah */}
        <div className="w-1/4 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6 flex flex-col">
          <h4 className="font-bold text-[18px] text-on-surface mb-4">Komposisi Sampah</h4>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full border-[12px] border-primary-container relative flex items-center justify-center">
              <div className="absolute inset-[-12px] border-[12px] border-secondary-container rounded-full border-t-transparent border-l-transparent" style={{ transform: 'rotate(-30deg)' }}></div>
              <div className="text-center z-10">
                <span className="block text-[22px] font-bold text-on-surface leading-none">62%</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Organik</span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2">
              <div className="flex justify-between items-center text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                  <span className="text-on-surface">Organik</span>
                </div>
                <span className="text-on-surface font-bold">{stats?.komposisiSampah?.organik?.berat} ({stats?.komposisiSampah?.organik?.persentase})</span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                  <span className="text-on-surface">Anorganik</span>
                </div>
                <span className="text-on-surface font-bold">{stats?.komposisiSampah?.anorganik?.berat} ({stats?.komposisiSampah?.anorganik?.persentase})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Widget */}
        <div className="w-1/4 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden relative border border-outline-variant/30">
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-outline-variant/30 shadow-sm">
            <h4 className="font-bold text-[14px] text-on-surface">Kepatuhan RT/RW</h4>
          </div>
          <div className="w-full h-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.757876800742!2d107.60946252981977!3d-6.880479133333333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6580f4f9f4d%3A0x6b30fef6a75f850e!2sCoblong%2C%20Bandung%20City%2C%20West%20Java!5e0!3m2!1sen!2sid!4v1720800000000!5m2!1sen!2sid"
              className="w-full h-full border-0 grayscale opacity-85"
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-outline-variant shadow-sm z-10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Total Wilayah</p>
                <p className="text-[12px] font-bold text-on-surface">76 RW Terdata</p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white border-2 border-white">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white border-2 border-white font-bold text-[10px]">3</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === Tables + Activity Grid === */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Data Tempat Sampah Terbaru */}
        <div className="col-span-5 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Data Tempat Sampah Terbaru</h4>
            <Link to="/master-data" className="text-primary text-[12px] font-bold hover:underline">Lihat Semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[12px] text-on-surface-variant border-b border-outline-variant">
                  <th className="pb-3 font-bold">ID & Jenis</th>
                  <th className="pb-3 font-bold">Pemilik / Lokasi</th>
                  <th className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {[
                  { id: 'TS-COB-000324', type: 'Organik', typeColor: 'text-primary', typeIcon: 'recycling', owner: 'RW 06 Dago', addr: 'Jl. Dago Giri No. 10', status: 'Aktif', statusCls: 'bg-green-100 text-green-700' },
                  { id: 'TS-COB-000323', type: 'Non Organik', typeColor: 'text-secondary', typeIcon: 'delete', owner: 'Kel. Lebakgede', addr: 'Jl. Lebak Gede No. 21', status: 'Aktif', statusCls: 'bg-green-100 text-green-700' },
                  { id: 'TS-COB-000322', type: 'Organik', typeColor: 'text-primary', typeIcon: 'recycling', owner: 'RW 02 Cigadung', addr: 'Jl. Cigadung Raya', status: 'Perawatan', statusCls: 'bg-yellow-100 text-yellow-700' },
                ].map(row => (
                  <tr key={row.id} className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-bold">{row.id}</span>
                        <span className={`text-[10px] ${row.typeColor} flex items-center gap-1`}>
                          <span className="material-symbols-outlined text-[14px]">{row.typeIcon}</span> {row.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span>{row.owner}</span>
                        <span className="text-[10px] text-on-surface-variant">{row.addr}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`${row.statusCls} px-2 py-0.5 rounded text-[10px] font-bold`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manajemen Pengguna */}
        <div className="col-span-4 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Manajemen Pengguna</h4>
            <Link to="/master-data" className="text-primary text-[12px] font-bold hover:underline">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Rudi Santoso', role: 'Admin • Kec. Coblong', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBROnzK6rmUZGgZvhgSMmeki_TDGPMh-NFD2_5bHY-C8fj1gm6A5faBvMVS6DOcXkGHUOkg3aPTQYpVhNaB0XvmWe_tvN7Si_vz8pqHEjgSJm0tNs21QUixHrEULn1nRnjszxpyMQq8aDwD01WG2fb22MD5WvUJdhsAhRipbZshOjwwTnhymoc2qB9n-ze7Wc5lhvtJ7PkJn_3iwh22pkIchyZPWIxhrox7GlQ3V5KAd2VbAePH9YAyJXIFarBrDlDdLT-OTmSJHnPG' },
              { name: 'Siti Nurhaliza', role: 'Petugas • Kel. Lebakgede', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8MPjMx7P2Gy0fJtHjElRZoTJglWiaHPw_X9TKuGx9UocQI-QB7tMKAGXtevQnI0LyW0p7p4Omta9GiSL4E3lfLDTlZ9SUddAI-qTzYIG6_974a6oTL-4znxBH6g25_0UCpokT94sS_2XqNUE1kVnyf4zZaPBr7pAMDO860wb9V6HLendeYkfwi9UF_cnT-8Cv0926epimAP-5f9oa9fZYLFUEYEFjGjBLHkQbvfgrxTIurLxy3xufH3DB46eRxmJqUeG4d_tY5g1U' },
              { name: 'Asep Maulana', role: 'Warga • RW 06 Dago', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGHADswoikiZDKchds4Oq1dbKUkpYgwECA0UJvoJtDiJtylqGkg8H_jhu7Aw56s9IQqNle4Bi4a_OayuQSa55qjfCVuU_xuzKONyxrYlCoFp-icigzUlPBp1cM07y5h5mzgAMhg2YSDqU_VWuugagzt_vOVHmqBLitvN_MNrM0IsTxwcg9wtCfJopqq1E4vPytW9kzHs16Iba5aPvgKJgfVq9ddAyUuyX6UJEChsvX6AxbdPc9VU0_TL59xqnWRHToN4Dq5TALkoAW' },
            ].map(user => (
              <div key={user.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
                <img className="w-10 h-10 rounded-full border border-outline-variant object-cover" alt={user.name} src={user.img} />
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-on-surface leading-none">{user.name}</p>
                  <p className="text-[10px] text-on-surface-variant">{user.role}</p>
                </div>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Aktif</span>
              </div>
            ))}
          </div>
        </div>

        {/* Jadwal Kegiatan */}
        <div className="col-span-3 bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Jadwal Kegiatan</h4>
            <button className="w-8 h-8 flex items-center justify-center bg-surface-container rounded-lg text-primary hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
            </button>
          </div>
          <div className="space-y-4">
            {[
              { dayName: 'JUM', dayNum: '23', title: 'Sosialisasi Pilah Sampah', sub: 'RW 06 Dago • 08:00', badge: 'Sosialisasi', badgeCls: 'bg-blue-100 text-blue-700', numCls: 'text-primary', bgCls: 'bg-primary-container/10' },
              { dayName: 'SAB', dayNum: '24', title: 'Pengangkutan Organik', sub: 'Kec. Coblong • 07:00', badge: 'Pengangkutan', badgeCls: 'bg-green-100 text-green-700', numCls: 'text-secondary', bgCls: 'bg-secondary-container/10' },
              { dayName: 'MIN', dayNum: '25', title: 'Validasi Data Setoran', sub: 'Sistem Pusat • 09:00', badge: 'Validasi Data', badgeCls: 'bg-amber-100 text-amber-800', numCls: 'text-amber-700', bgCls: 'bg-amber-100' },
            ].map(item => (
              <div key={item.dayNum} className="flex gap-4">
                <div className={`flex flex-col items-center ${item.bgCls} rounded-lg px-2 py-1 min-w-[50px] h-fit`}>
                  <span className={`text-[10px] font-bold ${item.numCls} uppercase`}>{item.dayName}</span>
                  <span className={`text-[18px] font-bold ${item.numCls}`}>{item.dayNum}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-on-surface leading-tight">{item.title}</p>
                  <p className="text-[10px] text-on-surface-variant">{item.sub}</p>
                  <span className={`inline-block mt-1 ${item.badgeCls} px-1.5 py-0.5 rounded text-[9px] font-bold uppercase`}>{item.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === Bottom Operational Widgets === */}
      <div className="grid grid-cols-4 gap-gutter">
        {/* Poin Warga Top 5 */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Poin Warga - Top 5</h4>
            <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          </div>
          <div className="space-y-4">
            {[
              { name: '1. Dewi Lestari (RW 06)', points: '12.350 Poin', pct: '95%', bold: true },
              { name: '2. Budi Hartono (RW 02)', points: '9.870 Poin', pct: '78%', bold: true },
              { name: '3. Siti Aminah (RW 01)', points: '8.420 Poin', pct: '65%', bold: true },
              { name: '4. Rizky Maulana (RW 03)', points: '7.560 Poin', pct: '55%', bold: false },
            ].map(item => (
              <div key={item.name} className={`space-y-1 ${!item.bold ? 'opacity-60' : ''}`}>
                <div className="flex justify-between text-[12px]">
                  <span className={`${item.bold ? 'font-bold' : ''} text-on-surface`}>{item.name}</span>
                  <span className="text-primary font-bold">{item.points}</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: item.pct }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tempat Sampah QR */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6 bg-gradient-to-br from-white to-surface-container-low">
          <h4 className="font-bold text-[18px] text-on-surface mb-6">Tempat Sampah (QR)</h4>
          <div className="flex gap-4">
            <div className="w-1/2 p-3 bg-white rounded-xl border-2 border-outline-variant flex items-center justify-center">
              <img className="w-full aspect-square opacity-80" alt="QR Code Bin" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcTcLLQqg-8ECQUcvOzqLqFWjpoY1T2zzimqpsp9wJEbz69saVyk7GgW0_SC7Oc_OhK3tiLvpOmL_UmNlJgoZiqPvlsuCoavsy-ZBOLR8ETv8cXWW2ldWaeEZZdwLo-C-XVSsDeAvFG0cyKsO-Bj7qkVq-0rcfWeddnyjx8rgKu-dG6qO18ql-G3mGOuxG42th8L9LNWGYSxh1djykahQdW_MZa3hN45_rHTdZ_83AzyfqW8LwOuoVmg4OT-a7ojO0w8F5eNt1yBBZ" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">ID BIN</p>
                <p className="text-[12px] font-bold text-primary">TS-COB-000324</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">Kapasitas</p>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-on-surface">85% Full</span>
                  <span className="material-symbols-outlined text-error text-[14px]">sensors_off</span>
                </div>
              </div>
              <div className="pt-2">
                <button className="w-full py-2 bg-primary text-white rounded-lg text-[12px] font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Detail Bin</button>
              </div>
            </div>
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Aktivitas Terbaru</h4>
            <span className="material-symbols-outlined text-primary">history</span>
          </div>
          <div className="space-y-4">
            {[
              { iconBg: 'bg-green-100', iconColor: 'text-green-700', icon: 'add', title: 'Setoran 18 kg Organik', sub: 'Dewi Lestari • 09:30' },
              { iconBg: 'bg-blue-100', iconColor: 'text-blue-700', icon: 'local_shipping', title: 'Pengangkutan Selesai', sub: 'Dago Giri • 08:15' },
              { iconBg: 'bg-amber-100', iconColor: 'text-amber-700', icon: 'warning', title: 'Bin Hampir Penuh', sub: 'RW 01 Dago • 07:45' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-6 h-6 rounded-full ${item.iconBg} flex items-center justify-center z-10 border-2 border-white flex-shrink-0`}>
                  <span className={`material-symbols-outlined text-[14px] ${item.iconColor}`}>{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-on-surface">{item.title}</p>
                  <p className="text-[10px] text-on-surface-variant">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifikasi Sistem */}
        <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-[18px] text-on-surface">Notifikasi Sistem</h4>
            <span className="material-symbols-outlined text-error">campaign</span>
          </div>
          <div className="space-y-4">
            {[
              { icon: 'error_outline', iconColor: 'text-error', title: 'Sensor Offline (TS-00321)', sub: 'Baterai lemah terdeteksi' },
              { icon: 'verified_user', iconColor: 'text-primary', title: 'Target Harian Tercapai', sub: 'Capaian 105% hari ini' },
            ].map((notif, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                <span className={`material-symbols-outlined ${notif.iconColor} text-[20px] mt-0.5`}>{notif.icon}</span>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-on-surface">{notif.title}</p>
                  <p className="text-[9px] text-on-surface-variant">{notif.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === Peringkat Komunitas Lestari === */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm rounded-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h4 className="text-[22px] font-bold text-on-surface">Peringkat Komunitas Lestari</h4>
            <p className="text-[14px] text-on-surface-variant">Statistik keaktifan pemilahan sampah di 6 Kelurahan, 76 RW, dan 469 RT wilayah Kecamatan Coblong.</p>
          </div>
          <button className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
            <span className="material-symbols-outlined">download</span>
            <span>Unduh Laporan Lengkap</span>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-gutter">
          {/* Top Warga */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <h5 className="font-bold text-[18px]">Top 10 Warga</h5>
            </div>
            <div className="space-y-3">
              {[
                { rank: '1', name: 'Dewi Lestari', sub: 'RW 06 Dago', val: '12.3k Poin', rankCls: 'bg-yellow-400 text-white' },
                { rank: '2', name: 'Budi Hartono', sub: 'RW 02 Cigadung', val: '9.8k Poin', rankCls: 'bg-slate-300 text-on-surface' },
                { rank: '3', name: 'Siti Aminah', sub: 'RW 01 Coblong', val: '8.4k Poin', rankCls: 'bg-amber-600 text-white' },
                { rank: '4', name: 'Rizky Maulana', sub: 'RW 03 Lebak Gede', val: '7.5k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '5', name: 'Hani Fitriani', sub: 'RW 04 Sekeloa', val: '7.1k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '6', name: 'Ahmad Wijaya', sub: 'RW 02 Coblong', val: '6.8k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '7', name: 'Rudi Hermawan', sub: 'RW 03 Sekeloa', val: '6.5k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '8', name: 'Siti Rahmawati', sub: 'RW 05 Dago', val: '6.2k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '9', name: 'Reza Herdian', sub: 'RW 01 Lebak Siliwangi', val: '5.9k Poin', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '10', name: 'Adi Nugroho', sub: 'RW 04 Cigadung', val: '5.5k Poin', rankCls: 'bg-surface-variant text-on-surface' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'bg-white shadow-sm' : 'bg-white/60'} p-2 rounded-xl border border-outline-variant/30`}>
                  <span className={`w-6 h-6 flex items-center justify-center ${item.rankCls} font-bold rounded-full text-[10px]`}>{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="text-primary font-bold text-[12px]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top RT */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <h5 className="font-bold text-[18px]">Top 10 RT</h5>
            </div>
            <div className="space-y-3">
              {[
                { rank: '1', name: 'RT 04 / RW 06', sub: 'Kel. Dago', val: '850 kg', rankCls: 'bg-yellow-400 text-white' },
                { rank: '2', name: 'RT 01 / RW 02', sub: 'Kel. Cigadung', val: '720 kg', rankCls: 'bg-slate-300 text-on-surface' },
                { rank: '3', name: 'RT 03 / RW 04', sub: 'Kel. Sekeloa', val: '680 kg', rankCls: 'bg-amber-600 text-white' },
                { rank: '4', name: 'RT 02 / RW 03', sub: 'Kel. Sadang Serang', val: '610 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '5', name: 'RT 05 / RW 01', sub: 'Kel. Dago', val: '590 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '6', name: 'RT 01 / RW 05', sub: 'Kel. Lebak Siliwangi', val: '550 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '7', name: 'RT 03 / RW 02', sub: 'Kel. Sekeloa', val: '520 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '8', name: 'RT 02 / RW 04', sub: 'Kel. Cigadung', val: '490 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '9', name: 'RT 04 / RW 03', sub: 'Kel. Sadang Serang', val: '460 kg', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '10', name: 'RT 01 / RW 06', sub: 'Kel. Lebak Gede', val: '430 kg', rankCls: 'bg-surface-variant text-on-surface' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'bg-white shadow-sm' : 'bg-white/60'} p-2 rounded-xl border border-outline-variant/30`}>
                  <span className={`w-6 h-6 flex items-center justify-center ${item.rankCls} font-bold rounded-full text-[10px]`}>{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="text-secondary font-bold text-[12px]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top RW */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              <h5 className="font-bold text-[18px]">Top 10 RW</h5>
            </div>
            <div className="space-y-3">
              {[
                { rank: '1', name: 'RW 06 Dago', sub: '48 KK Aktif', val: '2.4 ton', rankCls: 'bg-yellow-400 text-white' },
                { rank: '2', name: 'RW 02 Cigadung', sub: '42 KK Aktif', val: '2.1 ton', rankCls: 'bg-slate-300 text-on-surface' },
                { rank: '3', name: 'RW 04 Sekeloa', sub: '38 KK Aktif', val: '1.9 ton', rankCls: 'bg-amber-600 text-white' },
                { rank: '4', name: 'RW 01 Coblong', sub: '35 KK Aktif', val: '1.7 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '5', name: 'RW 03 Lebak Gede', sub: '31 KK Aktif', val: '1.5 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '6', name: 'RW 05 Sadang Serang', sub: '29 KK Aktif', val: '1.4 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '7', name: 'RW 03 Sekeloa', sub: '27 KK Aktif', val: '1.2 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '8', name: 'RW 01 Lebak Siliwangi', sub: '25 KK Aktif', val: '1.1 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '9', name: 'RW 02 Coblong', sub: '22 KK Aktif', val: '0.9 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '10', name: 'RW 04 Cigadung', sub: '20 KK Aktif', val: '0.8 ton', rankCls: 'bg-surface-variant text-on-surface' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'bg-white shadow-sm' : 'bg-white/60'} p-2 rounded-xl border border-outline-variant/30`}>
                  <span className={`w-6 h-6 flex items-center justify-center ${item.rankCls} font-bold rounded-full text-[10px]`}>{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="text-amber-700 font-bold text-[12px]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Kelurahan */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-indigo-600" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
              <h5 className="font-bold text-[18px]">Top 6 Kelurahan</h5>
            </div>
            <div className="space-y-3">
              {[
                { rank: '1', name: 'Kel. Dago', sub: 'Efisiensi 94%', val: '12.5 ton', rankCls: 'bg-yellow-400 text-white' },
                { rank: '2', name: 'Kel. Cigadung', sub: 'Efisiensi 89%', val: '9.2 ton', rankCls: 'bg-slate-300 text-on-surface' },
                { rank: '3', name: 'Kel. Sadang Serang', sub: 'Efisiensi 85%', val: '8.4 ton', rankCls: 'bg-amber-600 text-white' },
                { rank: '4', name: 'Kel. Sekeloa', sub: 'Efisiensi 82%', val: '7.8 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '5', name: 'Kel. Lebak Gede', sub: 'Efisiensi 79%', val: '6.5 ton', rankCls: 'bg-surface-variant text-on-surface' },
                { rank: '6', name: 'Kel. Lebak Siliwangi', sub: 'Efisiensi 75%', val: '5.2 ton', rankCls: 'bg-surface-variant text-on-surface' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 ${i === 0 ? 'bg-white shadow-sm' : 'bg-white/60'} p-2 rounded-xl border border-outline-variant/30`}>
                  <span className={`w-6 h-6 flex items-center justify-center ${item.rankCls} font-bold rounded-full text-[10px]`}>{item.rank}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-on-surface">{item.name}</p>
                    <p className="text-[9px] text-on-surface-variant">{item.sub}</p>
                  </div>
                  <span className="text-indigo-700 font-bold text-[12px]">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === Footer === */}
      <footer className="flex justify-between items-center pt-4 pb-4">
        <p className="text-[12px] text-on-surface-variant">© 2026 Pilah Sampah Cerdas. Sampah Terdata, Lingkungan Tertata.</p>
        <div className="flex gap-gutter">
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">Kebijakan Privasi</a>
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">Syarat & Ketentuan</a>
          <a href="#" className="text-[12px] text-on-surface-variant hover:text-primary transition-colors">Bantuan</a>
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;
