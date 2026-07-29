/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import { Loader2, Pencil, Trash2 } from "lucide-react";

interface PemanfaatanItem {
  id: string;
  rwId: number;
  rw?: {
    name: string;
    kelurahan?: {
      name: string;
    };
  };
  nomorCaraPemanfaatan: string;
  program: string;
  teknologi: string;
  bahanBaku: string;
  volumeBahanBaku: number;
  unitBahanBaku: string;
  hasil: number;
  unitHasil: string;
  fotoDokumentasiUrl: string;
  tanggalPencatatan: string;
}

export const PemanfaatanSampah: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<PemanfaatanItem[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PemanfaatanItem | null>(null);

  // Form states
  const [rwId, setRwId] = useState("");
  const [nomorCaraPemanfaatan, setNomorCaraPemanfaatan] = useState("");
  const [program, setProgram] = useState("BURUAN_SAE");
  const [teknologi, setTeknologi] = useState("");
  const [bahanBaku, setBahanBaku] = useState("");
  const [volumeBahanBaku, setVolumeBahanBaku] = useState("");
  const [unitBahanBaku, setUnitBahanBaku] = useState("Kg");
  const [hasil, setHasil] = useState("");
  const [unitHasil, setUnitHasil] = useState("Kg");
  const [fotoDokumentasiUrl, setFotoDokumentasiUrl] = useState("");
  const [tanggalPencatatan, setTanggalPencatatan] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isReadOnly = user?.peran === "ADMIN_DLH" || user?.peran === "CAMAT" || user?.peran === "LURAH";

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/pemanfaatan");
      if (res.data && res.data.success) {
        setItems(res.data.data);
      }
    } catch (e: any) {
      toast.error("Gagal memuat data pemanfaatan");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await api.post("/ai/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data && res.data.success) {
          const imageUrl = res.data.data.imageUrl;
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://157.10.252.252:3000/api/v1";
          const serverUrl = apiBaseUrl.replace("/api/v1", "");
          const fullImageUrl = `${serverUrl}${imageUrl}`;
          setFotoDokumentasiUrl(fullImageUrl);
          toast.success("Foto berhasil diunggah");
        }
      } catch (err) {
        toast.error("Gagal mengunggah foto");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await api.get("/areas/rt-rw");
      if (res.data && res.data.success) {
        setAreas(res.data.data);
      }
    } catch (e) {
      console.error("Gagal memuat list area RW");
    }
  };

  useEffect(() => {
    fetchItems();
    fetchAreas();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setRwId(user?.rtRwId ? user.rtRwId.toString() : "");
    setNomorCaraPemanfaatan(`CARA-${Date.now()}`);
    setProgram("BURUAN_SAE");
    setTeknologi("");
    setBahanBaku("");
    setVolumeBahanBaku("");
    setUnitBahanBaku("Kg");
    setHasil("");
    setUnitHasil("Kg");
    setFotoDokumentasiUrl("https://picsum.photos/400/300");
    setTanggalPencatatan(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PemanfaatanItem) => {
    setEditingItem(item);
    setRwId(item.rwId.toString());
    setNomorCaraPemanfaatan(item.nomorCaraPemanfaatan);
    setProgram(item.program);
    setTeknologi(item.teknologi);
    setBahanBaku(item.bahanBaku);
    setVolumeBahanBaku(item.volumeBahanBaku.toString());
    setUnitBahanBaku(item.unitBahanBaku);
    setHasil(item.hasil.toString());
    setUnitHasil(item.unitHasil);
    setFotoDokumentasiUrl(item.fotoDokumentasiUrl);
    setTanggalPencatatan(item.tanggalPencatatan.split("T")[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }

    const payload = {
      rwId: parseInt(rwId, 10),
      nomorCaraPemanfaatan,
      program,
      teknologi,
      bahanBaku,
      volumeBahanBaku: parseFloat(volumeBahanBaku),
      unitBahanBaku,
      hasil: parseFloat(hasil),
      unitHasil,
      fotoDokumentasiUrl,
      tanggalPencatatan: new Date(tanggalPencatatan).toISOString(),
    };

    try {
      if (editingItem) {
        await api.put(`/pemanfaatan/${editingItem.id}`, payload);
        toast.success("Program pemanfaatan berhasil diperbarui");
      } else {
        await api.post("/pemanfaatan", payload);
        toast.success("Program pemanfaatan berhasil dicatat");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) {
      toast.error("Akses Ditolak: Peran Anda hanya memiliki akses Read-Only");
      return;
    }
    if (!window.confirm("Apakah Anda yakin ingin menghapus program pemanfaatan ini?")) return;

    try {
      await api.delete(`/pemanfaatan/${id}`);
      toast.success("Program pemanfaatan berhasil dihapus");
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus data");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pemanfaatan Sampah</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Pencatatan dan pemantauan program sirkular sampah (Buruan Sae, Rumah Maggot, POC).
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 transition-all duration-200"
          >
            + Catat Program Baru
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">Daftar Tata Kelola & Pemanfaatan</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading data...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
            <span className="material-symbols-outlined text-4xl text-gray-300">eco</span>
            <p className="mt-2 text-sm">Belum ada data pemanfaatan sampah di kelurahan ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm text-left">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Program & Teknologi</th>
                  <th className="px-6 py-3.5">Bahan Baku</th>
                  <th className="px-6 py-3.5 text-center">Volume <span className="normal-case">(Kg)</span></th>
                  <th className="px-6 py-3.5 text-center">Hasil Pemanfaatan <span className="normal-case">(Kg)</span></th>
                  <th className="px-6 py-3.5">Wilayah RW</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5 text-center">Bukti Foto</th>
                  {!isReadOnly && <th className="px-6 py-3.5 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-gray-800">
                        {item.program.replace("_", " ")}
                      </div>
                      <div className="text-xs text-gray-500">{item.teknologi}</div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="text-gray-700 font-medium">{item.bahanBaku}</span>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <span className="font-extrabold text-gray-900 text-base">
                        {item.volumeBahanBaku}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <span className="font-extrabold text-gray-900 text-base">
                        {item.hasil}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 align-middle">
                      {item.rw?.name || `RW ID ${item.rwId}`}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap align-middle">
                      {new Date(item.tanggalPencatatan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      {item.fotoDokumentasiUrl ? (
                        <a
                          href={item.fotoDokumentasiUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block hover:scale-105 transition-transform"
                        >
                          <img
                            src={item.fotoDokumentasiUrl}
                            alt="Bukti"
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm mx-auto"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">-</span>
                      )}
                    </td>
                    {!isReadOnly && (
                      <td className="px-6 py-4 text-center align-middle whitespace-nowrap">
                        <div className="inline-flex gap-2 justify-center">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 bg-slate-100 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 bg-slate-100 hover:bg-error/20 text-error rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">
                {editingItem ? "Edit Hasil Pemanfaatan" : "Catat Hasil Pemanfaatan Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Program</label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors"
                  >
                    <option value="BURUAN_SAE">Buruan Sae</option>
                    <option value="RUMAH_MAGGOT">Rumah Maggot</option>
                    <option value="POC">Pupuk Organik Cair (POC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Wilayah RW</label>
                  <select
                    value={rwId}
                    onChange={(e) => setRwId(e.target.value)}
                    disabled={!!user?.rtRwId}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors disabled:opacity-60"
                  >
                    <option value="">Pilih RW</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Kel. {a.kelurahan?.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nomor Pencatatan (Sistem)</label>
                  <input
                    type="text"
                    value={nomorCaraPemanfaatan}
                    disabled
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tanggalPencatatan}
                    onChange={(e) => setTanggalPencatatan(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-primary transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Teknologi Pemanfaatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kompos Sirkular, Biokonversi Larva, dll."
                  value={teknologi}
                  onChange={(e) => setTeknologi(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-primary transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Bahan Baku</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sisa Makanan Warga"
                    value={bahanBaku}
                    onChange={(e) => setBahanBaku(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-primary transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Volume</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={volumeBahanBaku}
                      onChange={(e) => setVolumeBahanBaku(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Unit</label>
                    <input
                      type="text"
                      value={unitBahanBaku}
                      disabled
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Hasil Panen</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={hasil}
                    onChange={(e) => setHasil(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Unit Hasil</label>
                  <input
                    type="text"
                    value={unitHasil}
                    disabled
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Foto Dokumentasi (Wajib)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-2xl hover:border-primary transition-colors bg-gray-50 cursor-pointer relative overflow-hidden group min-h-[140px] items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required={!fotoDokumentasiUrl}
                  />
                  <div className="space-y-2 text-center relative z-0">
                    {uploadingPhoto ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs text-gray-500 font-medium">Mengunggah gambar...</p>
                      </div>
                    ) : fotoDokumentasiUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 mb-2 shadow-sm">
                          <img
                            src={fotoDokumentasiUrl}
                            alt="Preview Pemanfaatan"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-primary font-bold group-hover:underline">Ganti Foto Dokumentasi</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-gray-400 text-3xl group-hover:text-primary transition-colors mb-1">
                          add_a_photo
                        </span>
                        <p className="text-xs text-gray-600 font-bold">Pilih Foto dari Gawai / Komputer</p>
                        <p className="text-[10px] text-gray-400">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/95 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PemanfaatanSampah;
