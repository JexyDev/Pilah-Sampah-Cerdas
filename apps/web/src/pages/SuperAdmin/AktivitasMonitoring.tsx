import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const AktivitasMonitoring: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    // Mocking fetch as per simplified FE reqs
    setTimeout(() => {
      setStats([
        { name: "Organik", total: 400 },
        { name: "Anorganik", total: 300 },
        { name: "Residu", total: 200 },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Monitoring Aktivitas Pemilahan</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan statistik pemilahan sampah harian di wilayah kerja Anda.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm h-96">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Volume Sampah Terpilah (Bulan Ini)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats}>
            <XAxis dataKey="name" stroke="#8884d8" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#4ade80" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AktivitasMonitoring;
