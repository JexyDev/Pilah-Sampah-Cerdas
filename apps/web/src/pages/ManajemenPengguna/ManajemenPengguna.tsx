import { Search, Loader2, ShieldAlert, HardHat, EyeOff, Eye, UserPlus, Download, User, Trash2, X, ChevronLeft, ChevronRight, AlertTriangle, Pencil, Phone, MapPin, GraduationCap } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

import { useSearchParams } from "react-router-dom";

const ManajemenPengguna: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") || "Semua";

  const [users, setUsers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState(roleFromUrl);

  useEffect(() => {
    if (roleFromUrl !== selectedRole) {
      setSelectedRole(roleFromUrl);
    }
  }, [roleFromUrl]);

  const handleRoleTabChange = (role: string) => {
    setSelectedRole(role);
    if (role === "Semua") {
      setSearchParams({});
    } else {
      setSearchParams({ role });
    }
  };
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedRw, setSelectedRw] = useState("Semua");
  const [selectedRt, setSelectedRt] = useState("Semua");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",

    password: "",
    roleName: "WARGA",
    phone: "",
    status: "Aktif",
    rtRwId: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

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
    setCurrentPage(1); // Reset page on filter change
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

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success("Pengguna berhasil dihapus!");
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus pengguna");
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // Pagination logic
  const sortedUsers = [...users].sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return 0;
  });
  const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + rowsPerPage);

  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "Nama Lengkap",

      "No. Telfon",
      "Peran",
      "Wilayah",
      "Setoran (Kg)",
      "Status",
      "Tanggal Terdaftar",
    ];

    const csvData = users.map((u) => [
      u.name,

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
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h1>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
              <User size={13} /> Data Pengguna
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data akun warga, petugas residu, pengurus RT/RW, & mahasiswa KKN di Kecamatan Coblong.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl transition-all text-xs shadow-sm cursor-pointer"
            >
              <UserPlus size={15} /> Tambah Pengguna
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs border border-slate-200 cursor-pointer"
          >
            <Download size={15} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Master Role Switcher Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
        {[
          { key: "Semua", label: "Semua Peran", icon: "🌐" },
          { key: "ADMIN_DLH", label: "Admin & Eksekutif", icon: "🏢" },
          { key: "RW", label: "Pengurus RW / RT", icon: "🛡️" },
          { key: "PETUGAS_RESIDU", label: "Petugas Residu Hilir", icon: "🚚" },
          { key: "MAHASISWA_KKN", label: "Mahasiswa KKN", icon: "🎓" },
          { key: "WARGA", label: "Warga Mandiri", icon: "🏠" },
        ].map((tab) => {
          const isActive = selectedRole === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleRoleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pengguna</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Status Aktif</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {users.filter((u) => u.status === "Aktif" || u.status === "ACTIVE").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Verifikasi</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {users.filter((u) => u.status === "PENDING" || u.status === "Pending" || u.status === "PENDING_APPROVAL").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Peran Terfilter</p>
          <p className="text-base font-extrabold text-blue-700 mt-1 truncate">{selectedRole === "Semua" ? "Seluruh Role (9)" : selectedRole.replace("_", " ")}</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Cari nama, No. HP..."
            type="text"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="Semua">Semua Peran</option>
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
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
          <div>
            <select
              value={selectedRw}
              onChange={(e) => setSelectedRw(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="Semua">Semua RW</option>
              {uniqueRws.map((rw) => (
                <option key={rw} value={rw}>
                  RW {rw}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedRt}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="Semua">Semua RT</option>
              {uniqueRts.map((rt) => (
                <option key={rt} value={rt}>
                  RT {rt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {selectedRole === "MAHASISWA_KKN" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama & NIM</th>
                  <th className="py-3.5 px-4">Universitas / Fakultas</th>
                  <th className="py-3.5 px-4">No. WhatsApp</th>
                  <th className="py-3.5 px-4">Kelompok KKN</th>
                  <th className="py-3.5 px-4">Wilayah Tugas</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-16">Avatar</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Peran</th>
                  <th className="py-3.5 px-4">Wilayah</th>
                  <th className="py-3.5 px-4 text-right">Setoran (Kg)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              )}
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
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, idx) =>
                  selectedRole === "MAHASISWA_KKN" ? (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          NIM: {user.studentProfile?.nim || "-"}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {user.studentProfile?.fakultas || "UNIKOM"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <a
                          href={`https://wa.me/${(user.phone || "").replace(/\+/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Phone size={12} className="text-emerald-500" />
                          {user.phone || "-"}
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-bold text-[10px] inline-block">
                          {user.studentProfile?.kelompok?.name || "Belum Plotting"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {user.wilayah && user.wilayah !== "-" ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-primary" />
                            {user.wilayah}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum diset</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            user.status === "Aktif" || user.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {user.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : (
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
                      <td className="px-6 py-4">
                        <p className="font-bold text-on-surface">{user.name}</p>
                        {user.studentProfile?.nim && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            NIM: {user.studentProfile.nim}
                          </p>
                        )}
                        {user.pendampingKkn && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            <GraduationCap size={12} className="text-emerald-600" />
                            Pendamping: {user.pendampingKkn.name}
                          </span>
                        )}
                      </td>
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
                          ) && <HardHat className="text-orange-600" size={15} />}
                          {user.role === "WARGA" && <User className="text-green-600" size={15} />}
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
                        {user.setoran}
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
                      {!isReadOnly && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="w-8 h-8 rounded-md hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="w-8 h-8 rounded-md hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )
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

        {/* Pagination Controls */}
        {users.length > 0 && !loading && !error && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/30 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">Tampilkan</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-surface-container-low border border-outline-variant/50 rounded-md px-2 py-1 text-sm focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-on-surface-variant">data per halaman</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-on-surface-variant">
                Menampilkan {startIndex + 1}-{Math.min(startIndex + rowsPerPage, users.length)} dari {users.length} data
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} className="text-on-surface-variant" />
                </button>
                <div className="flex items-center px-2 text-sm font-medium text-on-surface">
                  {currentPage} / {totalPages || 1}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1 rounded-md hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} className="text-on-surface-variant" />
                </button>
              </div>
            </div>
          </div>
        )}
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

      {/* Modal Hapus */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Hapus Pengguna</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Apakah Anda yakin ingin menghapus akun <strong>{userToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 rounded-lg font-medium border border-outline-variant text-on-surface-variant hover:bg-surface-container-low cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 cursor-pointer transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenPengguna;
