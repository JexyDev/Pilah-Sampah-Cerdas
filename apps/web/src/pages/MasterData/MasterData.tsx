/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, Trash2, GraduationCap, MapPin, Phone, Eye, Search, Users, Delete } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import { useMasterDataStore } from "../../store/useMasterDataStore";
import api from "../../services/api";
import styles from "./MasterData.module.css";

const MasterData: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");

  const { users, bins, isLoading, error, fetchMasterData, deleteUser, deleteBin } =
    useMasterDataStore();
  const [activeTab, setActiveTab] = useState<"mahasiswa" | "users" | "bins">("mahasiswa");

  // Mahasiswa state (Synchronized with Manajemen Mahasiswa)
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [mhsSearch, setMhsSearch] = useState("");
  const [selectedMhsDetail, setSelectedMhsDetail] = useState<any | null>(null);

  const fetchMahasiswas = async () => {
    setLoadingMahasiswa(true);
    try {
      const response = await api.get(`/admin/mahasiswa?limit=500`);
      setMahasiswas(response.data.users || []);
    } catch (err: any) {
      console.error("Gagal memuat data mahasiswa:", err);
    } finally {
      setLoadingMahasiswa(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchMahasiswas();
  }, [fetchMasterData]);

  const filteredMahasiswas = useMemo(() => {
    if (!mhsSearch.trim()) return mahasiswas;
    const q = mhsSearch.toLowerCase();
    return mahasiswas.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(q) ||
        (m.studentProfile?.nim || "").toLowerCase().includes(q) ||
        (m.phone || "").toLowerCase().includes(q) ||
        (m.studentProfile?.kelompok?.name || "").toLowerCase().includes(q)
    );
  }, [mahasiswas, mhsSearch]);

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus ${name}?`)) {
      try {
        await deleteUser(id);
        toast.success(`Berhasil menghapus ${name}`);
      } catch (e: any) {
        toast.error("Gagal menghapus user");
      }
    }
  };

  const handleDeleteBin = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus ${name}?`)) {
      try {
        await deleteBin(id);
        toast.success(`Berhasil menghapus ${name}`);
      } catch (e: any) {
        toast.error("Gagal menghapus tempat sampah");
      }
    }
  };

  const handleDeleteMahasiswa = async (mhs: any) => {
    if (window.confirm(`Yakin ingin menonaktifkan mahasiswa ${mhs.name}?`)) {
      try {
        await api.delete(`/admin/mahasiswa/${mhs.id}`);
        toast.success(`Mahasiswa ${mhs.name} berhasil dinonaktifkan`);
        fetchMahasiswas();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Gagal menonaktifkan mahasiswa");
      }
    }
  };

  if (isLoading && users.length === 0 && mahasiswas.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={48} color="var(--primary-green)" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
        <button className={styles.btnPrimary} onClick={fetchMasterData}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Master Data Sistem
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pusat data terintegrasi mahasiswa KKN, warga, staff, dan aset tempat sampah cerdas.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "mahasiswa"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
          onClick={() => setActiveTab("mahasiswa")}
        >
          <GraduationCap size={16} />
          Master Data Mahasiswa KKN ({mahasiswas.length})
        </button>
        <button
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "users"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} />
          Data Warga & Staff ({users.length})
        </button>
        <button
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "bins"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
          onClick={() => setActiveTab("bins")}
        >
          <Delete size={16} />
          Data Tempat Sampah ({bins.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        {/* Tab 1: Mahasiswa KKN */}
        {activeTab === "mahasiswa" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari Nama, NIM, No. WA, Kelompok..."
                  value={mhsSearch}
                  onChange={(e) => setMhsSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Menampilkan {filteredMahasiswas.length} dari total {mahasiswas.length} Mahasiswa
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama & NIM</th>
                    <th className="py-3 px-4">Universitas / Fakultas</th>
                    <th className="py-3 px-4">No. WhatsApp</th>
                    <th className="py-3 px-4">Kelompok KKN</th>
                    <th className="py-3 px-4">Wilayah Tugas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center w-24">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {loadingMahasiswa ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                        Memuat data mahasiswa...
                      </td>
                    </tr>
                  ) : filteredMahasiswas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                        Tidak ada data mahasiswa yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredMahasiswas.map((mhs, idx) => (
                      <tr key={mhs.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{mhs.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">NIM: {mhs.studentProfile?.nim || "-"}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">
                          {mhs.studentProfile?.fakultas || "UNIKOM"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          <a
                            href={`https://wa.me/${(mhs.phone || "").replace(/\+/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <Phone size={12} className="text-emerald-500" />
                            {mhs.phone || "-"}
                          </a>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-bold text-[10px] inline-block">
                            {mhs.studentProfile?.kelompok?.name || "Belum Plotting"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {mhs.rtRw?.name ? (
                            <span className="flex items-center gap-1">
                              <MapPin size={13} className="text-primary" />
                              {mhs.rtRw.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belum diset</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              mhs.status === "Aktif"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {mhs.status || "Aktif"}
                          </span>
                        </td>
                        {!isReadOnly && (
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => setSelectedMhsDetail(mhs)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-primary rounded-lg transition-colors cursor-pointer"
                                title="Detail Profil"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteMahasiswa(mhs)}
                                className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Nonaktifkan"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Data Warga & Staff */}
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Nama User</th>
                  <th className="py-3 px-4">Email / No. HP</th>
                  <th className="py-3 px-4">Role / Peran</th>
                  <th className="py-3 px-4">Poin Setoran</th>
                  {!isReadOnly && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">
                      {u.id ? u.id.substring(0, 8) : "-"}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{u.email || (u as any).phone || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold text-[10px] border border-purple-200 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {(u.totalPoin || 0).toLocaleString()} Poin
                    </td>
                    {!isReadOnly && (
                      <td className="py-3 px-4 text-center">
                        <button
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus User"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Data Tempat Sampah */}
        {activeTab === "bins" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">QR Code / Kode</th>
                  <th className="py-3 px-4">Wilayah RT/RW</th>
                  <th className="py-3 px-4">Kapasitas Max</th>
                  <th className="py-3 px-4">Volume Saat Ini</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {bins.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[10px]">
                      {b.id ? b.id.substring(0, 8) : "-"}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">{b.qrCode}</td>
                    <td className="py-3 px-4 text-slate-600">{b.rtRw?.name || "-"}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{b.maxCapacityLiter} L</td>
                    <td className="py-3 px-4 font-bold text-slate-700">{b.currentVolumeLiter} L</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          b.status === "penuh"
                            ? "bg-rose-100 text-rose-700"
                            : b.status === "waspada"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    {!isReadOnly && (
                      <td className="py-3 px-4 text-center">
                        <button
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Tong"
                          onClick={() => handleDeleteBin(b.id, b.qrCode)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Profil Mahasiswa */}
      {selectedMhsDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <GraduationCap className="text-primary" /> Detail Mahasiswa KKN
              </h3>
              <button
                onClick={() => setSelectedMhsDetail(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-lg">
                  {selectedMhsDetail.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedMhsDetail.name}</p>
                  <p className="font-mono text-slate-500 text-[11px]">NIM: {selectedMhsDetail.studentProfile?.nim || "-"}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Universitas / Fakultas</span>
                  <span className="font-bold text-slate-800">{selectedMhsDetail.studentProfile?.fakultas || "UNIKOM"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Program Studi</span>
                  <span className="font-semibold text-slate-700">{selectedMhsDetail.studentProfile?.jurusan || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">No. WhatsApp</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedMhsDetail.phone || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Kelompok KKN</span>
                  <span className="font-bold text-blue-700">{selectedMhsDetail.studentProfile?.kelompok?.name || "Belum Plotting"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Dosen Pembimbing (DPL)</span>
                  <span className="font-semibold text-purple-700">{selectedMhsDetail.studentProfile?.kelompok?.dpl?.name || "Belum Ada DPL"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Wilayah Penugasan</span>
                  <span className="font-bold text-slate-800">{selectedMhsDetail.rtRw?.name || "-"}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedMhsDetail(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer mt-2"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
