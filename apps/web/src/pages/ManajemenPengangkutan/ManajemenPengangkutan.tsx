import React, { useEffect, useState } from "react";

export const ManajemenPengangkutan: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock backend data based on FE simplified reqs
    setTimeout(() => {
      setTasks([
        { id: "T1", status: "PENDING", binId: "BIN-001", assignedTo: "-" },
        { id: "T2", status: "CLAIMED", binId: "BIN-002", assignedTo: "Budi (Petugas)" },
        { id: "T3", status: "IN_TRANSIT", binId: "BIN-003", assignedTo: "Siti (Petugas)" },
        { id: "T4", status: "COMPLETED", binId: "BIN-004", assignedTo: "Anton (Petugas)" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Pengangkutan</h1>
      <p className="text-sm text-gray-500 mt-1">Daftar penugasan pengangkutan sampah (Auto-assign berbasis polygon).</p>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Task ID</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">ID Tempat Sampah</th>
              <th className="px-6 py-3">Petugas Penjemput</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map(t => (
              <tr key={t.id}>
                <td className="px-6 py-4">{t.id}</td>
                <td className="px-6 py-4 font-bold">{t.status}</td>
                <td className="px-6 py-4">{t.binId}</td>
                <td className="px-6 py-4">{t.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManajemenPengangkutan;
