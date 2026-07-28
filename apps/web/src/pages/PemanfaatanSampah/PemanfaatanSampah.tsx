import React from "react";

export const PemanfaatanSampah: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hasil Pemanfaatan Sampah</h1>
      <p className="text-sm text-gray-500 mt-1">Pencatatan manual hasil program (Buruan Sae, Rumah Maggot, POC) oleh RW.</p>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Data Pemanfaatan</h2>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90">
            + Catat Hasil Baru
          </button>
        </div>

        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Program</th>
              <th className="px-6 py-3">Kuantitas</th>
              <th className="px-6 py-3">Bukti Foto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                Belum ada data pemanfaatan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PemanfaatanSampah;
