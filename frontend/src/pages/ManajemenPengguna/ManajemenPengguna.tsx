import { Search, Loader2, ShieldAlert, HardHat, EyeOff, Eye, UserPlus, Download, User, Edit, Trash2, X } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const ManajemenPengguna: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedRw, setSelectedRw] = useState("Semua");
  const [selectedRt, setSelectedRt] = useState("Semua");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleName: "WARGA",
    phone: "",
    status: "Aktif",
    rtRwId: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedRole !== "Semua") params.roleName = selectedRole;
      if (selectedStatus !== "Semua") params.status = selectedStatus;
      if (selectedRw !== "Semua") params.rw = selectedRw;
      if (selectedRt !== "Semua") params.rt = selectedRt;

      const response = await api.get("/users", { params });
      setUsers(response.data.data || []);
    } catch (err) {
      setError("Gagal memuat data pengguna dari server.");
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await api.get("/bins/areas");
      setAreas(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch areas:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, selectedRole, selectedStatus, selectedRw, selectedRt]);

  useEffect(() => {
    fetchAreas();
  }, []);

  // Parse RT and RW lists dynamically
  const uniqueRws = Array.from(
    new Set(
      areas
        .map((a) => {
          const match = a.name.match(/RW\s+(\d+)/i);
          return match ? match[1] : null;
        })
        .filter(Boolean)
    )
  ).sort() as string[];

  const uniqueRts = Array.from(
    new Set(
      areas
        .map((a) => {
          const match = a.name.match(/RT\s+(\d+)/i);
          return match ? match[1] : null;
        })
        .filter(Boolean)
    )
  ).sort() as string[];

  const handleOpenAddModal = () => {
    setModalType("add");
    setFormData({
      name: "",
      email: "",
      password: "",
      roleName: "WARGA",
      phone: "",
      status: "Aktif",
      rtRwId: areas[0]?.id?.toString() || "",
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setModalType("edit");
    setSelectedUser(user);
    let matchedAreaId = "";
    if (user.wilayah) {
      const found = areas.find((a) => user.wilayah.includes(a.name));
      if (found) matchedAreaId = found.id.toString();
    }
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      roleName: user.role || "WARGA",
      phone: user.phone || "",
      status: user.status || "Aktif",
      rtRwId: matchedAreaId,
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        rtRwId: formData.rtRwId ? parseInt(formData.rtRwId) : null,
      };

      if (modalType === "add") {
        await api.post("/users", payload);
        toast.success("Pengguna berhasil ditambahkan!");
      } else {
        await api.put(`/users/${selectedUser.id}`, payload);
        toast.success("Data pengguna berhasil diperbarui!");
      }
      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: any) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun ${user.name}?`)) {
      try {
        await api.delete(`/users/${user.id}`);
        toast.success("Pengguna berhasil dihapus!");
        fetchUsers();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Gagal menghapus pengguna");
      }
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "Nama Lengkap",
      "Email",
      "No. Telfon",
      "Peran",
      "Wilayah",
      "Setoran (kg)",
      "Status",
      "Tanggal Terdaftar",
    ];

    const csvData = users.map((u) => [
      u.name,
      u.email,
      u.phone || "-",
      u.role,
      u.wilayah,
      u.setoran,
      u.status,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID") : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Pengguna_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV berhasil diunduh");
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-on-surface">Daftar Pengguna Sistem</h2>
        <div className="flex gap-4">
          <button
            onClick={handleOpenAddModal}
            className="bg-primary text-white px-6 h-12 rounded-lg font-medium text-base hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus size={20} />
            Tambah Pengguna
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-white border border-outline-variant text-on-surface-variant px-6 h-12 rounded-lg font-medium text-base hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download size={20} />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/50">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-on-surface-variant mb-1">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="Cari nama, No. Telfon..."
                type="text"
              />
            </div>
          </div>
          <div className="w-40">
            <label className="block text-xs text-on-surface-variant mb-1">Peran</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN_DLH">Admin DLH</option>
              <option value="CAMAT">Camat</option>
              <option value="LURAH">Lurah</option>
              <option value="RW">RW</option>
              <option value="PETUGAS_RESIDU">Petugas Residu</option>
              <option value="WARGA">Warga</option>
              <option value="MAHASISWA_KKN">Mahasiswa KKN</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-on-surface-variant mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs text-on-surface-variant mb-1">RW</label>
            <select
              value={selectedRw}
              onChange={(e) => setSelectedRw(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua</option>
              {uniqueRws.map((rw) => (
                <option key={rw} value={rw}>
                  {rw}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs text-on-surface-variant mb-1">RT</label>
            <select
              value={selectedRt}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 h-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua</option>
              {uniqueRts.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
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
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold">No. Telfon</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold">Peran</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold">Wilayah</th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold text-right">
                  Setoran (kg)
                </th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold text-center">
                  Status
                </th>
                <th className="text-xs text-on-surface-variant px-6 py-4 font-bold text-center w-24">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p>Memuat pengguna...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-error font-medium">
                    {error}
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-outline-variant/30 hover:bg-surface-container-lowest/80 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div
                        className={`w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-sm border border-outline-variant/20`}
                      >
                        {user.name?.substring(0, 2).toUpperCase() || "U"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface">{user.name}</td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono text-[13px]">
                      {user.phone || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 w-fit">
                        {["SUPER_ADMIN", "ADMIN_DLH"].includes(user.role) && (
                          <ShieldAlert className="text-blue-600" size={15} />
                        )}
                        {["CAMAT", "LURAH", "RW", "PETUGAS_RESIDU", "MAHASISWA_KKN"].includes(
                          user.role
                        ) && (
                          <HardHat className="text-orange-600" size={15} />
                        )}
                        {user.role === "WARGA" && (
                          <User className="text-green-600" size={15} />
                        )}
                        <span
                          className={`inline-block px-2.5 py-1 ${
                            ["SUPER_ADMIN", "ADMIN_DLH"].includes(user.role)
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : [
                                    "CAMAT",
                                    "LURAH",
                                    "RW",
                                    "PETUGAS_RESIDU",
                                    "MAHASISWA_KKN",
                                  ].includes(user.role)
                                ? "bg-orange-50 text-orange-700 border border-orange-200"
                                : "bg-green-50 text-green-700 border border-green-200"
                          } rounded-md text-[10px] font-bold tracking-wide uppercase`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-medium">
                      {user.wilayah}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-on-surface-variant">
                      {user.setoran} kg
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border border-outline-variant/30 bg-surface-container-lowest">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${user.status === "Aktif" ? "bg-green-600" : "bg-outline-variant"}`}
                        ></span>
                        <span
                          className={
                            user.status === "Aktif" ? "text-green-700" : "text-on-surface-variant"
                          }
                        >
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="w-8 h-8 rounded-md hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="w-8 h-8 rounded-md hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-on-surface-variant font-medium"
                  >
                    Tidak ada data pengguna
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h3 className="text-xl font-bold text-on-surface">
                {modalType === "add" ? "Tambah Pengguna" : "Edit Pengguna"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors cursor-pointer"
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[85vh]"
            >
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  No. Telfon
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-mono"
                  placeholder="081234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Password{" "}
                  {modalType === "edit" && (
                    <span className="text-xs text-on-surface-variant font-normal">
                      (Kosongkan jika tidak diubah)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={modalType === "add"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-10 pl-3 pr-10 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff className="text-[20px]" size={20}/> : <Eye className="text-[20px]" size={20}/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Peran / Role
                </label>
                <select
                  required
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-bold cursor-pointer"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN_DLH">Admin DLH</option>
                  <option value="CAMAT">Camat</option>
                  <option value="LURAH">Lurah</option>
                  <option value="RW">RW</option>
                  <option value="PETUGAS_RESIDU">Petugas Residu</option>
                  <option value="WARGA">Warga</option>
                  <option value="MAHASISWA_KKN">Mahasiswa KKN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Wilayah RT/RW
                </label>
                <select
                  value={formData.rtRwId}
                  onChange={(e) => setFormData({ ...formData, rtRwId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-semibold cursor-pointer"
                >
                  <option value="">Pilih Wilayah (opsional)</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Kel. {a.kelurahan?.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Status</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant/50 bg-surface-container-low focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-sm font-semibold cursor-pointer"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin" size={18} />
                  )}
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

export default ManajemenPengguna;
