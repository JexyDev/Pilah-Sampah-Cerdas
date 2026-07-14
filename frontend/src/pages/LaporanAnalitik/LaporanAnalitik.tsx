import React from 'react';

const LaporanAnalitik: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-1">Laporan & Analitik Teknikal</h2>
          <p className="text-[14px] text-on-surface-variant">
            Monitoring performa sistem dan metrik teknikal secara real-time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-outline-variant/50">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">RT:</span>
            <span className="text-[14px] font-bold text-on-surface">469</span>
            <span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer">keyboard_arrow_down</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-outline-variant/50">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">RW:</span>
            <span className="text-[14px] font-bold text-on-surface">076</span>
            <span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer">keyboard_arrow_down</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-outline-variant/50 cursor-pointer hover:bg-surface-container-low transition-colors">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Kategori:</span>
            <span className="text-[14px] font-bold text-on-surface">Semua Kategori</span>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">keyboard_arrow_down</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer text-[12px] font-bold">
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer text-[12px] font-bold">
            <span className="material-symbols-outlined text-[20px]">grid_on</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* System Uptime */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">System Uptime</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Current Availability (30d)</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              Stable
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-8">
            <p className="text-4xl font-bold text-green-600 tracking-tight">99.98%</p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">Total Uptime</p>
          </div>
          <div className="mt-6 pt-6 border-t border-outline-variant/30">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Last Incident</span>
              <span className="text-[12px] font-bold text-on-surface">14 days ago</span>
            </div>
          </div>
        </div>

        {/* Chart 1: AI Computer-Vision Accuracy */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-surface-container-low rounded-lg w-fit">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">filter_list</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Filtered by: Coblong • RT 469 • RW 076</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">AI Accuracy</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">30-Day Moving Avg</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> 94.2%
            </span>
          </div>
          <div className="flex-1 h-[200px] bg-surface-container-low rounded-lg flex items-center justify-center border-2 border-dashed border-outline-variant/50 relative overflow-hidden">
             {/* Simple visual mock for Line chart */}
             <svg className="w-full h-full preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d="M0,35 Q10,30 20,32 T40,25 T60,20 T80,28 T100,10" fill="none" stroke="#16a34a" strokeWidth="2" />
                <path d="M0,35 Q10,30 20,32 T40,25 T60,20 T80,28 T100,10 L100,40 L0,40 Z" fill="rgba(22, 163, 74, 0.1)" stroke="none" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
             </svg>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Peak</p>
              <p className="text-[18px] font-bold text-green-600">98.4%</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Confidence</p>
              <p className="text-[18px] font-bold text-blue-600">91.2%</p>
            </div>
          </div>
        </div>

        {/* Chart 2: Response Latency */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-surface-container-low rounded-lg w-fit">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">filter_list</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Filtered by: Coblong • RT 469 • RW 076</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Response Latency</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Hourly Average Today (ms)</p>
            </div>
            <button className="text-on-surface-variant hover:text-blue-600 transition-colors">
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>
          </div>
          <div className="flex-1 h-[200px] bg-surface-container-low rounded-lg flex items-center justify-center border-2 border-dashed border-outline-variant/50 relative overflow-hidden">
             {/* Simple visual mock for Bar chart */}
             <svg className="w-full h-full preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 40">
                {[...Array(12)].map((_, i) => (
                  <rect key={i} x={5 + i * 8} y={20 - Math.random() * 15} width="6" height={20 + Math.random() * 15} fill="#3b82f6" rx="1" />
                ))}
             </svg>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Peak Latency Today</p>
              <p className="text-[18px] font-bold text-red-500">612ms</p>
            </div>
          </div>
        </div>

        {/* Chart 3: Redis Quota Metrics */}
        <div className="md:col-span-12 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-surface-container-low rounded-lg w-fit">
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">filter_list</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Filtered by: Coblong • RT 469 • RW 076</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Redis Cache & Queue Metrics</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Daily Hits vs Misses in Coblong (Last 14 Days)</p>
            </div>
            <div className="flex items-center gap-6 text-sm font-bold bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-[12px] text-on-surface">Cache Hits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-[12px] text-on-surface">Cache Misses</span>
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full flex items-end justify-between gap-2 pt-6 pb-2 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
            {[
              { day: '1', hits: 85, misses: 15 },
              { day: '2', hits: 90, misses: 10 },
              { day: '3', hits: 78, misses: 22 },
              { day: '4', hits: 92, misses: 8 },
              { day: '5', hits: 88, misses: 12 },
              { day: '6', hits: 85, misses: 15 },
              { day: '7', hits: 91, misses: 9 },
              { day: '8', hits: 89, misses: 11 },
              { day: '9', hits: 94, misses: 6 },
              { day: '10', hits: 90, misses: 10 },
              { day: '11', hits: 87, misses: 13 },
              { day: '12', hits: 86, misses: 14 },
              { day: '13', hits: 92, misses: 8 },
              { day: '14', hits: 95, misses: 5 },
            ].map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                {/* Stacked Bar Container */}
                <div className="w-full flex flex-col justify-end h-[210px] rounded-t-md overflow-hidden relative">
                  {/* Cache Misses Bar (Red) */}
                  <div className="w-full bg-red-500 hover:opacity-90 transition-opacity relative group/miss" style={{ height: `${item.misses}%` }}>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] px-1.5 py-0.5 rounded shadow opacity-0 group-hover/miss:opacity-100 pointer-events-none whitespace-nowrap z-20">
                      Misses: {item.misses}%
                    </div>
                  </div>
                  {/* Cache Hits Bar (Blue) */}
                  <div className="w-full bg-blue-600 hover:opacity-90 transition-opacity relative group/hit" style={{ height: `${item.hits}%` }}>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] px-1.5 py-0.5 rounded shadow opacity-0 group-hover/hit:opacity-100 pointer-events-none whitespace-nowrap z-20">
                      Hits: {item.hits}%
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant">H-{14 - index}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Cache Misses</p>
              <p className="text-[20px] font-bold text-red-500">1,248</p>
            </div>
          </div>
        </div>

        {/* System Load Mini-Cards */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Server CPU Usage</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Real-time Load (60m)</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">memory</span>
              Optimal
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-4">
            <p className="text-4xl font-bold text-blue-600 tracking-tight">42%</p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">Current Load</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Peak Usage</p>
              <p className="text-[18px] font-bold text-blue-600">88.2%</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Core Count</p>
              <p className="text-[18px] font-bold text-on-surface">16 vCPU</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Active Connections</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Real-time WebSocket & API</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">hub</span>
              Optimal
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-8">
            <p className="text-4xl font-bold text-green-600 tracking-tight">1,842</p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">Current Active</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Peak (24h)</p>
              <p className="text-[18px] font-bold text-on-surface">2,450</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Avg Duration</p>
              <p className="text-[18px] font-bold text-on-surface">14m 22s</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-outline-variant/50 p-6 flex flex-col mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-on-surface">Network Bandwidth</h3>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Real-time Traffic (60m)</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">swap_vert</span>
              Active
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center py-4">
            <p className="text-4xl font-bold text-green-600 tracking-tight">128.5 Mbps</p>
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">Current Usage</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-outline-variant/30">
            <div className="text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Incoming</p>
              <p className="text-[18px] font-bold text-green-600">82.1 Mbps</p>
            </div>
            <div className="text-center border-l border-outline-variant/30">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Outgoing</p>
              <p className="text-[18px] font-bold text-blue-600">46.4 Mbps</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LaporanAnalitik;
