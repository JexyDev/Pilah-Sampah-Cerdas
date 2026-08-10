import { Search, Loader2, EyeOff, Eye, UserPlus, Download, User, Trash2, X, AlertTriangle, Pencil, Phone, MapPin, CheckCircle } from "lucide-react";
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
import { Pagination } from "../../components/common/Pagination";

/** Pemetaan enum peran ke label bahasa Indonesia baku */
const ROLE_LABEL_MAP: Record<string, string> = {
  SUPER_USER: "Super User",
  ADMIN_DLH: "Dinas Lingkungan Hidup",
  CAMAT: "Camat",
  LURAH: "Lurah",
  RW: "Rukun Warga",
  PEMIMPIN: "Pimpinan",
  PANITIA_TASKFORCE: "Task Force",
  DPL: "Dosen Pembimbing Lapangan",
  PETUGAS_RESIDU: "Petugas Residu",
  MAHASISWA_KKN: "Mahasiswa KKN",
  WARGA: "Warga",
};

const cleanKelurahanName = (raw: string | undefined | null) => {
  if (!raw || raw === "-") return "-";
  let clean = String(raw)
    .replace(/^Kel\.\s*/i, "")
    .replace(/^urahan\s*/i, "")
    .replace(/^Kelurahan\s*/i, "")
    .trim();
  return clean ? `Kelurahan ${clean}` : "-";
};

const AVAILABLE_RWS = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "16", "21", "30", "40", "50", "60", "70"
];

const ManajemenPengguna: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") || "SUPER_USER";

  const [users, setUsers] = useState<any[]>([]);
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

  const [selectedStatus, setSelectedStatus] = useState("Semua");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    password: "",
    roleName: "WARGA",
    phone: "",
    status: "Aktif",
    rtRwId: "",
    nim: "",
    nip: "",
    prodi: "S1 Manajemen",
    selectedRws: [] as string[],
  });

  const formatPhone = (phone: string) => {
    if (!phone) return "-";
    let clean = phone.trim();
    if (clean.includes(".") || clean.length < 7 || clean.startsWith("NIP") || clean.startsWith("4127")) {
      return clean;
    }
    if (clean.startsWith("0")) return "+62" + clean.slice(1);
    if (clean.startsWith("62")) return "+" + clean;
    if (!clean.startsWith("+")) return "+62" + clean;
    return clean;
  };

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalKelurahan, setModalKelurahan] = useState("");

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

      const response = await api.get("/users", { params });
      let dataUsers = response.data.data || [];

      // Clean Lurah data formatting if Lurah role selected
      if (selectedRole === "LURAH") {
        dataUsers = dataUsers.map((u: any) => ({
          ...u,
          kelurahan: cleanKelurahanName(u.kelurahan || u.address),
          address: cleanKelurahanName(u.address || u.kelurahan),
        }));
      }

      setUsers(dataUsers);
    } catch (err) {
      setError("Gagal memuat data pengguna dari server.");
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
    fetchUsers();
  }, [searchQuery, selectedRole, selectedStatus]);
  const ALLOWED_KELURAHANS = [
    "Cipaganti",
    "Dago",
    "Lebak Gede",
    "Lebak Siliwangi",
    "Sadang Serang",
    "Sekeloa",
  ];

  const uniqueKelurahans = ALLOWED_KELURAHANS;

  const handleOpenAddModal = () => {
    setModalType("add");
    const defaultRole = selectedRole !== "Semua" ? selectedRole : "WARGA";
    setModalKelurahan("");
    setFormData({
      name: "",
      address: "",
      password: "",
      roleName: defaultRole,
      phone: "",
      status: "Aktif",
      rtRwId: "",
      nim: "",
      nip: defaultRole === "DPL" || defaultRole === "PEMIMPIN" ? "" : "",
      prodi: defaultRole === "DPL" ? "S1 Manajemen" : "S1 Teknik Informatika",
      jabatan: defaultRole === "PEMIMPIN" ? "Rektor" : "",
      selectedRws: [],
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: any) => {
    setModalType("edit");
    setSelectedUser(u);
    let matchedAreaId = u.rtRwId ? String(u.rtRwId) : "";
    let foundKelurahan = u.kelurahan || "";
    setModalKelurahan(foundKelurahan.replace(/^Kel\.\s*/i, "").replace(/^Kelurahan\s*/i, "").trim());

    // Parse multi-select RWs
    let rwsArr: string[] = [];
    if (u.studentProfile?.kelompok?.cakupanRw || u.wilayah) {
      const raw = u.studentProfile?.kelompok?.cakupanRw || u.wilayah || "";
      const matches = raw.match(/\d+/g);
      if (matches) {
        rwsArr = Array.from(new Set(matches.map((m: string) => m.padStart(2, "0"))));
      }
    }

    setFormData({
      name: u.name || "",
      address: u.address || "",
      password: "",
      roleName: u.role || selectedRole || "WARGA",
      phone: u.phone || "",
      status: u.status || "Aktif",
      rtRwId: matchedAreaId,
      nim: u.studentProfile?.nim || u.nim || "",
      nip: u.nip || u.studentProfile?.nip || u.dplNip || u.dplProfile?.nip || (u.role === "PEMIMPIN" ? "4127.34.02.001" : ""),
      prodi: u.prodi || u.studentProfile?.jurusan || u.address || (u.role === "PEMIMPIN" ? "Universitas Komputer Indonesia" : "S1 Manajemen"),
      jabatan: u.jabatan || (u.role === "PEMIMPIN" ? "Rektor" : ""),
      selectedRws: rwsArr,
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleRwToggle = (rwVal: string) => {
    setFormData((prev) => {
      const exists = prev.selectedRws.includes(rwVal);
      const updated = exists
        ? prev.selectedRws.filter((r) => r !== rwVal)
        : [...prev.selectedRws, rwVal];
      return { ...prev, selectedRws: updated };
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedAreaId = formData.rtRwId ? parseInt(formData.rtRwId) : null;
      const payload: any = {
        name: formData.name,
        address: formData.address,
        phone: formatPhone(formData.phone),
        roleName: formData.roleName,
        status: formData.status,
        rtRwId: parsedAreaId,
        rwId: parsedAreaId,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (formData.roleName === "MAHASISWA_KKN") {
        if (formData.nim) payload.nim = formData.nim;
        if (formData.selectedRws.length > 0) {
          payload.wilayah = `RW ${formData.selectedRws.join(", ")}${modalKelurahan ? ` (${modalKelurahan})` : ""}`;
        }
      }

      if (formData.roleName === "DPL") {
        payload.dplNip = formData.nip;
        payload.dplProdi = formData.prodi;
      }

      if (formData.roleName === "PEMIMPIN") {
        payload.nip = formData.nip;
        payload.perguruanTinggi = formData.prodi;
        payload.jabatan = formData.jabatan;
      }

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

  const handleDeleteClick = (u: any) => {
    setUserToDelete(u);
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

  const handleExportCsv = () => {
    if (users.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = [
      "ID",
      "Nama Lengkap",
      "No HP",
      "Role",
      "Status",
      "Kecamatan",
      "Kelurahan",
      "RW",
      "Alamat",
    ];

    const csvRows = [
      headers.join(","),
      ...users.map((u) =>
        [
          u.id,
          `"${u.name || ""}"`,
          `"${u.phone || ""}"`,
          u.role,
          u.status || "Aktif",
          `"${u.kecamatan || ""}"`,
          `"${cleanKelurahanName(u.kelurahan)}"`,
          `"${u.rw || ""}"`,
          `"${(u.address || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Pengguna_${selectedRole}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV berhasil diunduh");
  };

  // Pagination calculation
  const totalPages = Math.ceil(users.length / rowsPerPage) || 1;
  const paginatedUsers = users.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kelola data akun warga, petugas residu, pengurus RT/RW, DPL, & mahasiswa KKN di Kecamatan Coblong.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download size={15} className="text-slate-500" />
              Ekspor CSV
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus size={15} />
              Tambah Pengguna
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Total Pengguna
            </p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {users.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
            <User size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Status Aktif
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {users.filter((u) => u.status === "Aktif" || u.status === "ACTIVE" || !u.status).length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Peran Terfilter
            </p>
            <h3 className="text-lg font-black text-slate-800 mt-1 truncate max-w-[150px]">
              {ROLE_LABEL_MAP[selectedRole] || selectedRole}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
            <User size={20} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, No. HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Peran</option>
              <option value="SUPER_USER">Super User</option>
              <option value="ADMIN_DLH">Dinas Lingkungan Hidup</option>
              <option value="CAMAT">Camat</option>
              <option value="LURAH">Lurah</option>
              <option value="RW">Rukun Warga</option>
              <option value="PEMIMPIN">Pimpinan</option>
              <option value="PANITIA_TASKFORCE">Task Force</option>
              <option value="DPL">Dosen Pembimbing Lapangan</option>
              <option value="PETUGAS_RESIDU">Petugas Residu</option>
              <option value="MAHASISWA_KKN">Mahasiswa KKN</option>
              <option value="WARGA">Warga</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {selectedRole === "MAHASISWA_KKN" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">Program Studi</th>
                  <th className="py-3.5 px-4">NIM</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Kelompok KKN</th>
                  <th className="py-3.5 px-4">DPL Pembimbing</th>
                  <th className="py-3.5 px-4">Wilayah Tugas</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : selectedRole === "DPL" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">NIP</th>
                  <th className="py-3.5 px-4">Program Studi</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : selectedRole === "SUPER_USER" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Peran</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : selectedRole === "PEMIMPIN" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">NIP</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Perguruan Tinggi</th>
                  <th className="py-3.5 px-4">Jabatan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : selectedRole === "CAMAT" || selectedRole === "LURAH" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Wilayah</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : selectedRole === "PETUGAS_RESIDU" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Peran</th>
                  <th className="py-3.5 px-4">Kecamatan</th>
                  <th className="py-3.5 px-4">Kelurahan</th>
                  <th className="py-3.5 px-4">RW</th>
                  <th className="py-3.5 px-4">Alamat TPS</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : selectedRole === "RW" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Kecamatan</th>
                  <th className="py-3.5 px-4">Kelurahan</th>
                  <th className="py-3.5 px-4">RW</th>
                  <th className="py-3.5 px-4">Alamat Rumah</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : selectedRole === "ADMIN_DLH" ? (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  <th className="py-3.5 px-4">Wilayah</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              ) : (
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">No. HP</th>
                  {selectedRole !== "PANITIA_TASKFORCE" && <th className="py-3.5 px-4">Peran</th>}
                  <th className="py-3.5 px-4">Kecamatan</th>
                  <th className="py-3.5 px-4">Kelurahan</th>
                  <th className="py-3.5 px-4">RW</th>
                  {selectedRole !== "PANITIA_TASKFORCE" && <th className="py-3.5 px-4">Alamat Rumah</th>}
                  {selectedRole !== "PANITIA_TASKFORCE" && <th className="py-3.5 px-4 text-right">Setoran (Kg)</th>}
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
                </tr>
              )}
            </thead>
            <tbody className="text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-blue-600" size={28} />
                      <p className="font-semibold text-xs">Memuat data pengguna...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-rose-600 font-medium">
                    {error}
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((u, idx) =>
                  selectedRole === "MAHASISWA_KKN" ? (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {u.prodi || u.studentProfile?.jurusan || u.studentProfile?.fakultas || "Teknik Informatika"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {u.nim || u.studentProfile?.nim || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <a
                          href={`https://wa.me/${formatPhone(u.phone || "").replace(/\+/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Phone size={12} className="text-emerald-500" />
                          {formatPhone(u.phone)}
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-bold text-[10px] inline-block">
                          {u.studentProfile?.kelompok?.name || u.kelompok || "Belum Plotting"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {u.studentProfile?.kelompok?.dplName || u.dplName || "Belum Plotting"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-blue-600 shrink-0" />
                          {u.wilayah || u.studentProfile?.kelompok?.wilayahPenugasan || "Belum Plotting"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : selectedRole === "DPL" ? (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{formatPhone(u.phone)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">
                        {u.nip || u.studentProfile?.nip || u.dplNip || u.dplProfile?.nip || "4127.34.02.001"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {u.prodi || u.address || "S1 Manajemen"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : selectedRole === "SUPER_USER" ? (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{formatPhone(u.phone)}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold tracking-wide uppercase">
                          SUPER_USER
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : selectedRole === "PEMIMPIN" ? (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {u.nip || "4127.34.02.001"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <a
                          href={`https://wa.me/${formatPhone(u.phone || "").replace(/\+/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Phone size={12} className="text-emerald-500" />
                          {formatPhone(u.phone)}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-extrabold">
                        {u.perguruanTinggi || "Universitas Komputer Indonesia"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {u.jabatan || "Rektor"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : selectedRole === "CAMAT" || selectedRole === "LURAH" ? (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{formatPhone(u.phone)}</td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-extrabold">
                        {u.role === "CAMAT"
                          ? "Kecamatan Coblong"
                          : cleanKelurahanName(u.kelurahan || u.address)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : selectedRole === "PETUGAS_RESIDU" ? (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{formatPhone(u.phone)}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold tracking-wide uppercase">
                          PETUGAS_RESIDU
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-semibold">Coblong</td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-bold">
                        {cleanKelurahanName(u.kelurahan)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-bold">{u.rw || "RW 03"}</td>
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">
                        {u.address || "Pos Residu RW 03"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : selectedRole === "RW" ? (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{formatPhone(u.phone)}</td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-semibold">Coblong</td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-bold">
                        {cleanKelurahanName(u.kelurahan)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-bold">{u.rw || "-"}</td>
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">{u.address || "-"}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : selectedRole === "ADMIN_DLH" ? (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{formatPhone(u.phone)}</td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-bold">
                        Kota Bandung
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
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
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{formatPhone(u.phone)}</td>
                      {selectedRole !== "PANITIA_TASKFORCE" && (
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-[10px] font-bold tracking-wide uppercase">
                            {u.role || "WARGA"}
                          </span>
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-semibold">Coblong</td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-bold">
                        {cleanKelurahanName(u.kelurahan)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-bold">{u.rw || "-"}</td>
                      {selectedRole !== "PANITIA_TASKFORCE" && (
                        <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">{u.address || "-"}</td>
                      )}
                      {selectedRole !== "PANITIA_TASKFORCE" && (
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{u.setoran || 0}</td>
                      )}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {u.status || "Aktif"}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Tidak ada data pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {users.length > 0 && !loading && !error && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={users.length}
            itemsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setRowsPerPage}
          />
        )}
      </div>

      {/* Modal Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-extrabold text-slate-800">
                {modalType === "add" ? "Tambah Pengguna" : "Edit Pengguna"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-semibold"
                />
              </div>

              {/* No Telfon */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Telfon
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-mono font-semibold"
                  placeholder="+628..."
                />
              </div>

              {/* DPL specific fields */}
              {formData.roleName === "DPL" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP / NIDN (Nomor Induk Pegawai)
                    </label>
                    <input
                      type="text"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="4127.34.02.006"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Program Studi
                    </label>
                    <input
                      type="text"
                      value={formData.prodi}
                      onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                      placeholder="S1 Manajemen"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Mahasiswa KKN specific fields */}
              {formData.roleName === "MAHASISWA_KKN" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIM (Nomor Induk Mahasiswa)
                    </label>
                    <input
                      type="text"
                      value={formData.nim}
                      onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                      placeholder="10123047"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Program Studi
                    </label>
                    <input
                      type="text"
                      value={formData.prodi}
                      onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                      placeholder="S1 Teknik Informatika"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Pemimpin specific fields */}
              {formData.roleName === "PEMIMPIN" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP
                    </label>
                    <input
                      type="text"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="4127.34.02.001"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Perguruan Tinggi
                    </label>
                    <input
                      type="text"
                      value={formData.prodi}
                      onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                      placeholder="Universitas Komputer Indonesia"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={formData.jabatan || ""}
                      onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                      placeholder="Rektor"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password{" "}
                  {modalType === "edit" && (
                    <span className="text-[10px] text-slate-400 font-normal">
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
                    className="w-full h-10 pl-3 pr-10 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peran / Role
                </label>
                <input
                  type="text"
                  disabled
                  value={ROLE_LABEL_MAP[formData.roleName] || formData.roleName}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold cursor-not-allowed"
                />
              </div>

              {/* Address / Location fields only if applicable */}
              {["WARGA", "RW", "PETUGAS_RESIDU"].includes(formData.roleName) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.roleName === "PETUGAS_RESIDU" ? "Alamat TPS" : "Alamat Rumah"}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Jl. Dipatiukur No. ..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-semibold"
                  />
                </div>
              )}

              {/* Kelurahan dropdown */}
              {["WARGA", "RW", "LURAH", "PETUGAS_RESIDU", "MAHASISWA_KKN"].includes(formData.roleName) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelurahan
                  </label>
                  <select
                    value={modalKelurahan}
                    onChange={(e) => setModalKelurahan(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-bold cursor-pointer"
                  >
                    <option value="">Pilih Kelurahan</option>
                    {uniqueKelurahans.map((k) => (
                      <option key={k} value={k}>
                        Kel. {k}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Multi-select RW checkboxes for Mahasiswa KKN */}
              {formData.roleName === "MAHASISWA_KKN" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah Tugas (Multi-Select RW)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Pilih satu atau beberapa RW pendampingan:
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                    {AVAILABLE_RWS.map((rwNum) => {
                      const isChecked = formData.selectedRws.includes(rwNum);
                      return (
                        <label
                          key={rwNum}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-blue-50 text-blue-700 border-blue-300"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleRwToggle(rwNum)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          RW {rwNum}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-xs font-bold cursor-pointer"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl font-extrabold text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={15} />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Hapus Pengguna</h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus akun <strong>{userToDelete?.name}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 rounded-xl font-extrabold text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-xs"
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
