import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ManajemenPengguna: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data.data);
      } catch (err) {
        setError('Gagal memuat data pengguna dari server.');
        toast.error('Gagal memuat data pengguna');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleActionClick = (actionName: string) => {
    toast.success(`Aksi "${actionName}" berhasil disimulasikan!`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-on-surface">Daftar Pengguna Sistem</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => handleActionClick('Tambah Pengguna')}
            className="bg-primary text-white px-6 h-12 rounded-lg font-medium text-base hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Pengguna
          </button>
          <button 
            onClick={() => handleActionClick('Ekspor Excel')}
            className="bg-white border border-outline-variant text-on-surface-variant px-6 h-12 rounded-lg font-medium text-base hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">table_view</span>
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/50">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-on-surface-variant mb-1">Pencarian</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                className="w-full pl-10 pr-4 h-10 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" 
                placeholder="Cari nama, NIK..." 
                type="text"
              />
            </div>
          </div>
          <div className="w-32">
            <label className="block text-xs text-on-surface-variant mb-1">Peran</label>
            <select className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
              <option>Semua</option>
              <option>Admin</option>
              <option>Petugas</option>
              <option>Warga</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-on-surface-variant mb-1">Status</label>
            <select className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
              <option>Semua</option>
              <option>Aktif</option>
              <option>Nonaktif</option>
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-on-surface-variant mb-1">RW</label>
            <select className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
              <option>Semua</option>
              <option>01</option>
              <option>02</option>
              <option>03</option>
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-on-surface-variant mb-1">RT</label>
            <select className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
              <option>Semua</option>
              <option>01</option>
              <option>02</option>
              <option>03</option>
              <option>04</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/50">
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold w-16">Avatar</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold">Nama</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold">NIK</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold">Peran</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold">Wilayah</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold text-right">Setoran (kg)</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold text-center">Status</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined animate-spin text-primary text-[32px]">autorenew</span>
                      <p>Memuat pengguna...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-error font-medium">{error}</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest/80 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className={`w-9 h-9 rounded-full ${user.avatarBg || 'bg-blue-100'} ${user.avatarColor || 'text-blue-700'} flex items-center justify-center font-bold text-xs shadow-sm border border-outline-variant/20`}>
                        {user.avatar || user.nama.substring(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface">{user.nama}</td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono text-[13px]">{user.nik}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 w-fit">
                        {user.peran === 'Admin' && <span className="material-symbols-outlined text-[15px] text-blue-600">admin_panel_settings</span>}
                        {user.peran === 'Petugas' && <span className="material-symbols-outlined text-[15px] text-orange-600">engineering</span>}
                        {user.peran === 'Warga' && <span className="material-symbols-outlined text-[15px] text-green-600">person</span>}
                        <span className={`inline-block px-2.5 py-1 ${user.peran === 'Admin' ? 'bg-blue-50 text-blue-700 border border-blue-200' : user.peran === 'Petugas' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-green-50 text-green-700 border border-green-200'} rounded-md text-[10px] font-bold tracking-wide uppercase`}>
                          {user.peran}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-medium">{user.wilayah}</td>
                    <td className="px-6 py-4 text-right font-bold text-on-surface-variant">{user.setoran}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border border-outline-variant/30 bg-surface-container-lowest">
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Aktif' ? 'bg-green-600' : 'bg-outline-variant'}`}></span>
                        <span className={user.status === 'Aktif' ? 'text-green-700' : 'text-on-surface-variant'}>{user.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleActionClick('Edit Pengguna ' + user.nama)} className="w-8 h-8 rounded-md hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleActionClick('Blokir Pengguna ' + user.nama)} className="w-8 h-8 rounded-md hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors" title="Blokir">
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManajemenPengguna;
