import React, { useState } from "react";

export const ManajemenEkosistemKkn: React.FC = () => {
  const [activeTab, setActiveTab] = useState("universitas");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Ekosistem KKN</h1>
      <p className="text-sm text-gray-500 mt-1">Kelola data Universitas, Dosen Pembimbing (DPL), dan Kelompok Mahasiswa.</p>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {["universitas", "dpl", "kelompok"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab === "dpl" ? "Dosen Pembimbing (DPL)" : tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        {activeTab === "universitas" && (
          <div>
            <h2 className="text-lg font-bold mb-4">Daftar Universitas Mitra</h2>
            <p className="text-sm text-gray-500">Fitur CRUD Universitas akan dimuat di sini.</p>
          </div>
        )}
        {activeTab === "dpl" && (
          <div>
            <h2 className="text-lg font-bold mb-4">Daftar Dosen Pembimbing Lapangan (DPL)</h2>
            <p className="text-sm text-gray-500">Fitur CRUD DPL akan dimuat di sini.</p>
          </div>
        )}
        {activeTab === "kelompok" && (
          <div>
            <h2 className="text-lg font-bold mb-4">Daftar Kelompok KKN & Penugasan Area</h2>
            <p className="text-sm text-gray-500">Fitur CRUD Kelompok dan mapping Polygon Warga akan dimuat di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManajemenEkosistemKkn;
