import { Search, Loader2, EyeOff, Eye, UserPlus, Upload, User, Trash2, X, AlertTriangle, Pencil, Phone, CheckCircle, Shield, Lock, Info, ChevronDown } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect, useMemo } from "react";
import { showToast } from "../../utils/showToast";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { getProfilePhotoUrl, handleAvatarError } from "../../utils/photoUtils";

import { useSearchParams } from "react-router-dom";
import { Pagination } from "../../components/common/Pagination";

/** Pemetaan enum peran ke label bahasa Indonesia baku */
const ROLE_LABEL_MAP: Record<string, string> = {
  DEVELOPER: "Developer",
  SUPER_USER: "Admin",
  ADMIN_DLH: "Dinas Lingkungan Hidup",
  CAMAT: "Camat",
  LURAH: "Lurah",
  RW: "Rukun Warga",
  PEMIMPIN: "Pimpinan",
  PANITIA_TASKFORCE: "Task Force",
  DPL: "Dosen Pembimbing Lapangan",
  PETUGAS_RESIDU: "Petugas Pemilah",
  MAHASISWA_KKN: "Mahasiswa",
  WARGA: "Warga",
};

const cleanKelurahanName = (raw: string | undefined | null) => {
  if (!raw || raw === "-") return "-";
  let clean = String(raw)
    .replace(/^Kel\.\s*/i, "")
    .replace(/^urahan\s*/i, "")
    .replace(/^Kelurahan\s*/i, "")
    .trim();
  return clean ? `Kel. ${clean}` : "-";
};

const detectKelurahanName = (u: any): string => {
  if (u?.kelurahan && u.kelurahan !== "-") {
    return cleanKelurahanName(u.kelurahan);
  }
  
  const combinedText = `${u?.name || ""} ${u?.address || ""} ${u?.wilayah || ""} ${u?.rw || ""}`.toLowerCase();
  
  const knownKelurahans = [
    { name: "Sadang Serang", label: "Kel. Sadang Serang" },
    { name: "Sedang Serang", label: "Kel. Sadang Serang" },
    { name: "Cipaganti", label: "Kel. Cipaganti" },
    { name: "Dago", label: "Kel. Dago" },
    { name: "Lebak Gede", label: "Kel. Lebak Gede" },
    { name: "Lebak Siliwangi", label: "Kel. Lebak Siliwangi" },
    { name: "Sekeloa", label: "Kel. Sekeloa" },
  ];

  for (const k of knownKelurahans) {
    if (combinedText.includes(k.name.toLowerCase())) {
      return k.label;
    }
  }

  const fallback = cleanKelurahanName(u?.address);
  return fallback !== "-" ? fallback : "Kel. Sadang Serang";
};

const getCleanKelName = (raw: string | undefined | null) => {
  if (!raw || raw === "-" || raw === "Kel. -") return "Cipaganti";
  let clean = String(raw)
    .replace(/^Kel\.\s*/i, "")
    .replace(/^urahan\s*/i, "")
    .replace(/^Kelurahan\s*/i, "")
    .trim();
  return clean && clean !== "-" ? clean : "Cipaganti";
};

const formatKecamatanName = (raw: string | undefined | null): string => {
  if (!raw || raw === "-" || raw.trim() === "") return "-";
  let clean = String(raw).trim();
  clean = clean.replace(/^Kecamatan\s*amatan\s*/i, "").replace(/^Kecamatan\s*/i, "").trim();
  if (!clean || clean === "-") return "-";
  return `Kecamatan ${clean}`;
};

const getCleanKabupatenName = (raw: string | undefined | null): string => {
  if (!raw || raw === "-" || raw.trim() === "") return "-";
  return String(raw).trim();
};

const KELURAHAN_RW_MAP: Record<string, string[]> = {
  Cipaganti: ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06", "RW 07"],
  Dago: ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06", "RW 07", "RW 08", "RW 09", "RW 10", "RW 11", "RW 12", "RW 13"],
  "Lebak Gede": ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06", "RW 07", "RW 08", "RW 09", "RW 10", "RW 11", "RW 12", "RW 13"],
  "Lebak Siliwangi": ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06"],
  "Sadang Serang": ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06", "RW 07", "RW 08", "RW 09", "RW 10", "RW 11", "RW 12", "RW 13", "RW 14", "RW 15", "RW 16", "RW 17", "RW 18", "RW 19", "RW 20", "RW 21"],
  Sekeloa: ["RW 01", "RW 02", "RW 03", "RW 04", "RW 05", "RW 06", "RW 07", "RW 08", "RW 09", "RW 10", "RW 11", "RW 12", "RW 13", "RW 14", "RW 15", "RW 16"],
};





const normalizeRoleFromUrl = (param: string | null): string => {
  if (!param) return "SUPER_USER";
  const p = param.trim().toLowerCase();
  if (["developer", "dev"].includes(p)) return "DEVELOPER";
  if (["su", "admin", "superuser", "super_user", "super-user"].includes(p)) return "SUPER_USER";
  if (["pimpinan", "pemimpin", "rektor"].includes(p)) return "PEMIMPIN";
  if (["taskforce", "task-force", "panitia_taskforce"].includes(p)) return "PANITIA_TASKFORCE";
  if (["dpl", "dosen"].includes(p)) return "DPL";
  if (["dlh", "admin_dlh", "admin-dlh", "dinas-lingkungan-hidup"].includes(p)) return "ADMIN_DLH";
  if (["camat"].includes(p)) return "CAMAT";
  if (["lurah"].includes(p)) return "LURAH";
  if (["rw", "rukun-warga"].includes(p)) return "RW";
  if (["petugas-residu", "petugas_residu", "petugas"].includes(p)) return "PETUGAS_RESIDU";
  if (["mahasiswa", "mahasiswa-kkn", "mahasiswa_kkn"].includes(p)) return "MAHASISWA_KKN";
  if (["warga"].includes(p)) return "WARGA";
  return param.toUpperCase();
};

const ManajemenPengguna: React.FC = () => {
  const { user, updateUser: updateStoreUser } = useAuthStore();
  const isReadOnly = ["ADMIN_DLH", "CAMAT", "LURAH", "RT"].includes(user?.peran || "");
  const [searchParams] = useSearchParams();
  const roleFromUrl = normalizeRoleFromUrl(searchParams.get("role") || searchParams.get("roleName") || searchParams.get("type"));

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
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]);
  const [petugasResiduList, setPetugasResiduList] = useState<any[]>([]);
  const [dplList, setDplList] = useState<any[]>([]);
  const [provinsiList, setProvinsiList] = useState<any[]>([]);
  const [kabupatenList, setKabupatenList] = useState<any[]>([]);
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [kelurahanList, setKelurahanList] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resK, resA, resP, resD, resProv, resKab, resKec, resKel] = await Promise.all([
          api.get("/kelompok?limit=100"),
          api.get("/areas/rt-rw"),
          api.get("/users?roleName=PETUGAS_RESIDU"),
          api.get("/users?roleName=DPL"),
          api.get("/areas/provinsi"),
          api.get("/areas/kabupaten"),
          api.get("/areas/kecamatan"),
          api.get("/areas/kelurahan"),
        ]);
        const listK = resK.data?.groups || resK.data?.data || [];
        setKelompokList(listK);
        const listA = resA.data?.data || resA.data || [];
        setAreasList(listA);
        const listP = resP.data?.data || resP.data || [];
        setPetugasResiduList(listP);
        const listD = resD.data?.data || resD.data || [];
        setDplList(listD);
        const listProv = resProv.data?.data || resProv.data || [];
        setProvinsiList(listProv.length > 0 ? listProv : [{ id: 1, name: "Jawa Barat" }]);
        const listKab = resKab.data?.data || resKab.data || [];
        setKabupatenList(listKab.length > 0 ? listKab : [{ id: 1, name: "Kota Bandung" }]);
        const listKec = resKec.data?.data || resKec.data || [];
        setKecamatanList(listKec.length > 0 ? listKec : [{ id: 1, name: "Kecamatan Coblong" }]);
        const listKel = resKel.data?.data || resKel.data || [];
        setKelurahanList(listKel);
      } catch (err) {
        console.error("Error fetching reference data:", err);
      }
    };
    fetchData();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    password: "",
    confirmPassword: "",
    roleName: "WARGA",
    phone: "",
    status: "Aktif",
    rtRwId: "",
    nim: "",
    nip: "",
    prodi: "S1 Manajemen",
    jabatan: "",
    selectedRws: [] as string[],
    dplKelompokIds: [] as string[],
    institusi: "",
    jenjangPendidikan: "S1",
    jumlahAnggotaKeluarga: "",
    programStudi: "",
    fotoProfil: "",
    provinsi: "Jawa Barat",
    kabupaten: "Kota Bandung",
    wilayah: "Kota Bandung",
    kecamatan: "Kecamatan Coblong",
    petugasResiduId: "",
    dplId: "",
  });

  const formatPhone = (phone: string) => {
    if (!phone) return "-";
    let clean = phone.trim().replace(/[\s\-().]/g, "");
    if (clean.startsWith("4127") || clean.startsWith("DPL_") || clean.startsWith("NIP") || clean.includes(".") || clean.length < 9) {
      return "-";
    }
    if (clean.startsWith("0")) return "+62" + clean.slice(1);
    if (clean.startsWith("62")) return "+" + clean;
    if (clean.startsWith("8")) return "+62" + clean;
    if (!clean.startsWith("+")) return "+62" + clean;
    return clean;
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
    fetchUsers();
  }, [searchQuery, selectedRole, selectedStatus]);

  // Password validation check
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      if (modalType === "add" && !formData.password) {
        showToast.error("Kata sandi wajib diisi untuk pengguna baru");
      } else if (formData.password && !passwordRules?.minLength) {
        showToast.error("Kata sandi minimal 8 karakter");
      } else if (formData.password && !passwordRules?.matches) {
        showToast.error("Konfirmasi kata sandi tidak cocok");
      } else {
        showToast.error("Kata sandi belum memenuhi persyaratan keamanan");
      }
      return;
    }

    handleSubmit(e);
  };
  const filteredRwsByKelurahan = useMemo(() => {
    let targetClean = getCleanKelName(modalKelurahan).toLowerCase();
    if (!targetClean || targetClean === "unassigned") {
      targetClean = "cipaganti";
    }

    let list = areasList.filter((a: any) => {
      const areaKel = (a.kelurahan?.name || "").toLowerCase().replace(/^kel\.\s*/i, "").trim();
      return areaKel.includes(targetClean) || targetClean.includes(areaKel);
    });

    if (list.length === 0 && areasList.length > 0) {
      list = areasList.filter((a: any) => {
        const areaKel = (a.kelurahan?.name || "").toLowerCase().replace(/^kel\.\s*/i, "").trim();
        return areaKel.includes("cipaganti");
      });
    }

    // Deduplicate list by numeric RW identifier to prevent duplicate RW buttons in modal
    const seen = new Set<string>();
    const uniqueList: any[] = [];
    for (const item of list) {
      const rawName = item.name.split("(")[0].trim();
      const rwNum = rawName.replace(/\D/g, "").padStart(2, "0");
      if (rwNum && rwNum !== "00" && !seen.has(rwNum)) {
        seen.add(rwNum);
        uniqueList.push({
          ...item,
          cleanName: rawName.startsWith("RW") ? rawName : `RW ${rwNum}`
        });
      }
    }

    return uniqueList.sort((a: any, b: any) => {
      const numA = parseInt(a.name.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.name.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    });
  }, [areasList, modalKelurahan]);

  // Dynamically filter Kota / Kabupaten by selected Provinsi
  const filteredKabupatenList = useMemo(() => {
    if (!formData.provinsi || provinsiList.length === 0) return [];
    const selectedProv = provinsiList.find(
      (p: any) => (p.name || p.nama || "").toLowerCase() === formData.provinsi.toLowerCase()
    );
    if (!selectedProv) return [];
    return kabupatenList.filter((kb: any) => {
      const pId = kb.provinsiId || kb.provinsi?.id;
      const pName = (kb.provinsi?.name || kb.provinsi?.nama || "").toLowerCase();
      return pId === selectedProv.id || (pName && pName === formData.provinsi.toLowerCase());
    });
  }, [provinsiList, kabupatenList, formData.provinsi]);

  // Dynamically filter Kecamatan by selected Kota / Kabupaten
  const filteredKecamatanList = useMemo(() => {
    if (!formData.kabupaten || kabupatenList.length === 0) return [];
    const selectedKab = kabupatenList.find(
      (kb: any) => (kb.name || kb.nama || "").toLowerCase() === formData.kabupaten.toLowerCase()
    );
    if (!selectedKab) return [];
    return kecamatanList.filter((kc: any) => {
      const kId = kc.kabupatenId || kc.kabupaten?.id;
      const kName = (kc.kabupaten?.name || kc.kabupaten?.nama || "").toLowerCase();
      return kId === selectedKab.id || (kName && kName === formData.kabupaten.toLowerCase());
    });
  }, [kabupatenList, kecamatanList, formData.kabupaten]);

  // Dynamically filter Kelurahan by selected Kecamatan
  const filteredKelurahanList = useMemo(() => {
    if (!formData.kecamatan || kelurahanList.length === 0) return [];
    const selectedKec = kecamatanList.find(
      (kc: any) => (kc.name || kc.nama || "").toLowerCase() === formData.kecamatan.toLowerCase()
    );
    if (!selectedKec) {
      return kelurahanList.filter((kl: any) => {
        const kecName = (kl.kecamatan?.name || kl.kecamatan?.nama || kl.kecamatanNama || "").toLowerCase();
        return kecName && kecName.includes(formData.kecamatan.toLowerCase());
      });
    }
    return kelurahanList.filter((kl: any) => {
      const kecId = kl.kecamatanId || kl.kecamatan?.id;
      const kecName = (kl.kecamatan?.name || kl.kecamatan?.nama || kl.kecamatanNama || "").toLowerCase();
      return Number(kecId) === Number(selectedKec.id) || (kecName && kecName === formData.kecamatan.toLowerCase());
    });
  }, [kecamatanList, kelurahanList, formData.kecamatan]);

  const handleProvinsiSelect = (newProv: string) => {
    const selectedProvObj = provinsiList.find(
      (p: any) => (p.name || p.nama || "").toLowerCase() === newProv.toLowerCase()
    );
    const kabsForProv = kabupatenList.filter((kb: any) => {
      const pId = kb.provinsiId || kb.provinsi?.id;
      const pName = (kb.provinsi?.name || kb.provinsi?.nama || "").toLowerCase();
      return (selectedProvObj && pId === selectedProvObj.id) || (pName && pName === newProv.toLowerCase());
    });
    const defaultKab = kabsForProv.length > 0 ? (kabsForProv[0].name || kabsForProv[0].nama) : "";

    let defaultKec = "";
    let defaultKel = "";
    if (defaultKab) {
      const selectedKabObj = kabupatenList.find(
        (kb: any) => (kb.name || kb.nama || "").toLowerCase() === defaultKab.toLowerCase()
      );
      const kecsForKab = kecamatanList.filter((kc: any) => {
        const kId = kc.kabupatenId || kc.kabupaten?.id;
        const kName = (kc.kabupaten?.name || kc.kabupaten?.nama || "").toLowerCase();
        return (selectedKabObj && kId === selectedKabObj.id) || (kName && kName === defaultKab.toLowerCase());
      });
      defaultKec = kecsForKab.length > 0 ? (kecsForKab[0].name || kecsForKab[0].nama) : "";

      if (defaultKec) {
        const selectedKecObj = kecamatanList.find(
          (kc: any) => (kc.name || kc.nama || "").toLowerCase() === defaultKec.toLowerCase()
        );
        const kelsForKec = kelurahanList.filter((kl: any) => {
          const kecId = kl.kecamatanId || kl.kecamatan?.id;
          const kecName = (kl.kecamatan?.name || kl.kecamatan?.nama || kl.kecamatanNama || "").toLowerCase();
          return (selectedKecObj && Number(kecId) === Number(selectedKecObj.id)) || (kecName && kecName === defaultKec.toLowerCase());
        });
        defaultKel = kelsForKec.length > 0 ? (kelsForKec[0].name || kelsForKec[0].nama) : "";
      }
    }

    if (defaultKel) {
      setModalKelurahan(getCleanKelName(defaultKel));
    }

    setFormData((prev) => ({
      ...prev,
      provinsi: newProv,
      kabupaten: defaultKab,
      wilayah: defaultKab,
      kecamatan: defaultKec,
    }));
  };

  const handleKabupatenSelect = (newKab: string) => {
    const selectedKabObj = kabupatenList.find(
      (kb: any) => (kb.name || kb.nama || "").toLowerCase() === newKab.toLowerCase()
    );
    const kecsForKab = kecamatanList.filter((kc: any) => {
      const kId = kc.kabupatenId || kc.kabupaten?.id;
      const kName = (kc.kabupaten?.name || kc.kabupaten?.nama || "").toLowerCase();
      return (selectedKabObj && kId === selectedKabObj.id) || (kName && kName === newKab.toLowerCase());
    });
    const defaultKec = kecsForKab.length > 0 ? (kecsForKab[0].name || kecsForKab[0].nama) : "";

    let defaultKel = "";
    if (defaultKec) {
      const selectedKecObj = kecamatanList.find(
        (kc: any) => (kc.name || kc.nama || "").toLowerCase() === defaultKec.toLowerCase()
      );
      const kelsForKec = kelurahanList.filter((kl: any) => {
        const kecId = kl.kecamatanId || kl.kecamatan?.id;
        const kecName = (kl.kecamatan?.name || kl.kecamatan?.nama || kl.kecamatanNama || "").toLowerCase();
        return (selectedKecObj && Number(kecId) === Number(selectedKecObj.id)) || (kecName && kecName === defaultKec.toLowerCase());
      });
      defaultKel = kelsForKec.length > 0 ? (kelsForKec[0].name || kelsForKec[0].nama) : "";
    }

    if (defaultKel) {
      setModalKelurahan(getCleanKelName(defaultKel));
    }

    setFormData((prev) => ({
      ...prev,
      kabupaten: newKab,
      wilayah: newKab,
      kecamatan: defaultKec,
    }));
  };

  const handleKecamatanSelect = (newKec: string) => {
    const selectedKecObj = kecamatanList.find(
      (kc: any) => (kc.name || kc.nama || "").toLowerCase() === newKec.toLowerCase()
    );
    const kelsForKec = kelurahanList.filter((kl: any) => {
      const kecId = kl.kecamatanId || kl.kecamatan?.id;
      const kecName = (kl.kecamatan?.name || kl.kecamatan?.nama || kl.kecamatanNama || "").toLowerCase();
      return (selectedKecObj && Number(kecId) === Number(selectedKecObj.id)) || (kecName && kecName === newKec.toLowerCase());
    });
    const defaultKel = kelsForKec.length > 0 ? (kelsForKec[0].name || kelsForKec[0].nama) : "";

    if (defaultKel) {
      setModalKelurahan(getCleanKelName(defaultKel));
    }

    setFormData((prev) => ({
      ...prev,
      kecamatan: newKec,
    }));
  };

  const getRwListForKelurahan = (rawKel?: string) => {
    if (!rawKel || rawKel === "-") return KELURAHAN_RW_MAP["Dago"];
    const clean = String(rawKel)
      .replace(/^Kel\.?\s*/i, "")
      .replace(/^Kelurahan\s*/i, "")
      .trim()
      .toLowerCase();

    const matchedRws = areasList
      .filter((a: any) => {
        const areaKel = (a.kelurahan?.name || "").toLowerCase().replace(/^kel\.\s*/i, "").trim();
        return areaKel.includes(clean) || clean.includes(areaKel);
      })
      .map((a: any) => a.name)
      .sort((a: string, b: string) => {
        const numA = parseInt(a.replace(/\D/g, "") || "0", 10);
        const numB = parseInt(b.replace(/\D/g, "") || "0", 10);
        return numA - numB;
      });

    if (matchedRws.length > 0) return matchedRws;

    for (const [key, rws] of Object.entries(KELURAHAN_RW_MAP)) {
      if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
        return rws;
      }
    }
    return KELURAHAN_RW_MAP["Dago"];
  };

  const handleOpenAddModal = () => {
    setModalType("add");
    const defaultRole = selectedRole !== "Semua" ? selectedRole : "WARGA";
    setModalKelurahan("Cipaganti");
    setFormData({
      name: "",
      address: "",
      password: "",
      confirmPassword: "",
      roleName: defaultRole,
      phone: "",
      status: "Aktif",
      rtRwId: "",
      nim: "",
      nip: ["DPL", "PEMIMPIN", "PANITIA_TASKFORCE"].includes(defaultRole) ? "" : "",
      prodi: defaultRole === "DPL" ? "Manajemen" : "Teknik Informatika",
      jabatan: defaultRole === "PEMIMPIN" ? "Rektor" : defaultRole === "PANITIA_TASKFORCE" ? "Anggota Task Force" : "",
      selectedRws: [],
      dplKelompokIds: [],
      institusi: ["PEMIMPIN", "PANITIA_TASKFORCE"].includes(defaultRole) ? "Universitas Komputer Indonesia" : "",
      jenjangPendidikan: "S1",
      jumlahAnggotaKeluarga: "",
      programStudi: "",
      fotoProfil: "",
      provinsi: provinsiList[0]?.name || provinsiList[0]?.nama || "Jawa Barat",
      kabupaten: kabupatenList[0]?.name || "Kota Bandung",
      wilayah: defaultRole === "ADMIN_DLH" ? "Kota Bandung" : "",
      kecamatan: defaultRole === "CAMAT" ? "Kecamatan Coblong" : "",
      petugasResiduId: "",
      dplId: "",
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: any) => {
    setModalType("edit");
    setSelectedUser(u);
    let matchedAreaId = u.rtRwId ? String(u.rtRwId) : "";
    let foundKelurahan = u.kelurahan || u.studentProfile?.kelompok?.kelurahan || cleanKelurahanName(u.studentProfile?.kelompok?.name) || cleanKelurahanName(u.address) || "Cipaganti";
    if (!matchedAreaId && u.rw && areasList.length > 0) {
      const found = areasList.find((a: any) => a.name.toLowerCase() === u.rw.toLowerCase() || a.name.replace(/\D/g, "") === u.rw.replace(/\D/g, ""));
      if (found) {
        matchedAreaId = String(found.id);
        if (found.kelurahan?.name) {
          foundKelurahan = found.kelurahan.name;
        }
      }
    }
    setModalKelurahan(getCleanKelName(foundKelurahan));

    // Parse multi-select RWs (check u.wilayah first so individual student RW assignment takes precedence over group default)
    let rwsArr: string[] = [];
    const rawRw = u.wilayah || u.studentProfile?.kelompok?.cakupanRw || "";
    let matches: string[] = [];
    if (Array.isArray(rawRw)) {
      matches = rawRw.map((r: any) => String(r));
    } else if (typeof rawRw === "string") {
      matches = rawRw.match(/\d+/g) || [];
    } else if (typeof rawRw === "number") {
      matches = [String(rawRw)];
    }
    if (matches.length > 0) {
      rwsArr = Array.from(new Set(matches.map((m: string) => String(m).padStart(2, "0"))));
    }

    const mhsKelompokId = u.studentProfile?.kelompokId || u.studentProfile?.kelompok?.id || u.kelompokId;
    const assignedKelompokIds = (u.role || selectedRole) === "MAHASISWA_KKN"
      ? (mhsKelompokId ? [String(mhsKelompokId)] : [])
      : (u.dplKelompok && Array.isArray(u.dplKelompok) ? u.dplKelompok.map((k: any) => String(k.id)) : []);

    const isPimpinanOrTaskforce = ["PEMIMPIN", "PANITIA_TASKFORCE"].includes(u.role || selectedRole);
    const rawProdi = u.programStudi || u.prodi || u.studentProfile?.jurusan || (isPimpinanOrTaskforce ? "Universitas Komputer Indonesia" : "Manajemen");
    const cleanedProdi = cleanProdiName(rawProdi);
    const extractedJenjang = extractJenjang(rawProdi, u.jenjangPendidikan || u.studentProfile?.jenjangPendidikan);

    setFormData({
      name: u.name || "",
      address: u.address || "",
      password: "",
      confirmPassword: "",
      roleName: u.role || selectedRole || "WARGA",
      phone: u.phone || "",
      status: u.status || "Aktif",
      rtRwId: matchedAreaId,
      nim: u.studentProfile?.nim || u.nim || "",
      nip: u.nip || u.studentProfile?.nip || u.dplNip || u.dplProfile?.nip || "",
      prodi: cleanedProdi,
      jabatan: u.jabatan || (u.role === "PEMIMPIN" ? "Rektor" : u.role === "PANITIA_TASKFORCE" ? "Anggota Task Force" : ""),
      selectedRws: rwsArr,
      dplKelompokIds: assignedKelompokIds,
      institusi: u.institusi || (isPimpinanOrTaskforce ? "Universitas Komputer Indonesia" : cleanedProdi),
      jenjangPendidikan: extractedJenjang,
      jumlahAnggotaKeluarga: u.jumlahAnggotaKeluarga?.toString() || "",
      programStudi: cleanedProdi,
      fotoProfil: u.fotoProfil || "",
      provinsi: u.provinsi || (provinsiList[0]?.name || provinsiList[0]?.nama || "Jawa Barat"),
      kabupaten: u.kabupaten || (kabupatenList[0]?.name || "Kota Bandung"),
      wilayah: u.wilayah || (u.role === "ADMIN_DLH" ? "Kota Bandung" : ""),
      kecamatan: u.kecamatan || (u.role === "CAMAT" ? "Kecamatan Coblong" : ""),
      petugasResiduId: u.petugasResidu?.id || "",
      dplId: u.studentProfile?.kelompok?.dplId || u.studentProfile?.kelompok?.dpl?.id || u.dplId || "",
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

      const currentKel = getCleanKelName(modalKelurahan);
      const formattedRws = updated.map((r) => r.replace(/\D/g, "").padStart(2, "0")).sort();
      const newWilayahStr = formattedRws.length > 0
        ? `RW ${formattedRws.join(", ")} (Kel. ${currentKel})`
        : `Kel. ${currentKel}`;

      return {
        ...prev,
        selectedRws: updated,
        wilayah: newWilayahStr,
      };
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation check
    if (!isPasswordValid) {
      if (modalType === "add" && !formData.password) {
        showToast.error("Kata sandi wajib diisi untuk pengguna baru");
      } else if (formData.password && !passwordRules?.minLength) {
        showToast.error("Kata sandi minimal 8 karakter");
      } else if (formData.password && !passwordRules?.matches) {
        showToast.error("Konfirmasi kata sandi tidak cocok");
      } else {
        showToast.error("Kata sandi belum memenuhi persyaratan keamanan");
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const parsedAreaId = formData.rtRwId ? parseInt(formData.rtRwId) : null;
      let finalAddress = formData.address;
      if (!finalAddress && modalKelurahan) {
        const cleanKel = modalKelurahan.replace(/^Kel\.\s*/i, "").trim();
        finalAddress = `Kel. ${cleanKel}`;
      }

      const payload: any = {
        name: formData.name,
        address: finalAddress,
        phone: formatPhone(formData.phone),
        roleName: formData.roleName,
        status: formData.status,
        rtRwId: parsedAreaId,
        rwId: parsedAreaId,
        provinsi: formData.provinsi,
        kabupaten: formData.kabupaten,
      };

      if (formData.password) {
        payload.password = formData.password;
      }
      payload.fotoProfil = formData.fotoProfil || null;

      if (formData.roleName === "MAHASISWA_KKN") {
        if (formData.nim) payload.nim = formData.nim;
        payload.programStudi = formData.prodi || formData.programStudi;
        const selectedKelId = formData.dplKelompokIds?.[0] || null;
        payload.kelompokId = selectedKelId;
        payload.dplId = formData.dplId || null;
        payload.studentProfile = {
          nim: formData.nim,
          jurusan: formData.prodi || formData.programStudi,
          jenjangPendidikan: formData.jenjangPendidikan,
          kelompokId: selectedKelId,
          dplId: formData.dplId || null,
        };
        if (!selectedKelId) {
          payload.wilayah = null;
          payload.address = null;
        } else {
          const selectedKelObj = kelompokList.find((k: any) => k.id === selectedKelId);
          if (selectedKelObj?.kelurahan) {
            payload.wilayah = `Kel. ${cleanKelurahanName(selectedKelObj.kelurahan)}`;
            payload.address = `Kel. ${cleanKelurahanName(selectedKelObj.kelurahan)}`;
          }
        }
      } else if (formData.wilayah) {
        payload.wilayah = formData.wilayah;
      }

      if (["PEMIMPIN", "PANITIA_TASKFORCE"].includes(formData.roleName)) {
        payload.nip = formData.nip;
        payload.institusi = formData.institusi;
        payload.jabatan = formData.jabatan;
        if (formData.roleName === "PEMIMPIN") {
          payload.perguruanTinggi = formData.prodi;
        }
      }
      if (formData.roleName === "DPL") {
        payload.nip = formData.nip;
        payload.programStudi = formData.prodi || formData.programStudi;
        payload.jenjangPendidikan = formData.jenjangPendidikan;
        payload.dplKelompokIds = formData.dplKelompokIds;
      }
      if (formData.roleName === "WARGA") {
        payload.jumlahAnggotaKeluarga = formData.jumlahAnggotaKeluarga ? parseInt(formData.jumlahAnggotaKeluarga) : null;
      }
      if (formData.roleName === "MAHASISWA_KKN") {
        payload.jenjangPendidikan = formData.jenjangPendidikan;
      }
      if (formData.roleName === "ADMIN_DLH") {
        payload.wilayah = formData.wilayah || "Kota Bandung";
        payload.address = formData.wilayah || "Kota Bandung";
      }
      if (formData.roleName === "CAMAT") {
        payload.kecamatan = formData.kecamatan || "Kecamatan Coblong";
        payload.address = formData.kecamatan || "Kecamatan Coblong";
      }
      if (formData.roleName === "RW") {
        payload.petugasResiduId = formData.petugasResiduId || null;
      }

      if (modalType === "add") {
        await api.post("/users", payload);
        showToast.success("Pengguna berhasil ditambahkan!");
      } else {
        await api.put(`/users/${selectedUser.id}`, payload);
        showToast.success("Data pengguna berhasil diperbarui!");
        // Sync local auth store if logged-in user edited their own account!
        if (user && selectedUser && selectedUser.id === user.id) {
          updateStoreUser({
            name: payload.name,
            phone: payload.phone,
            address: payload.address,
            fotoProfil: payload.fotoProfil !== undefined ? payload.fotoProfil : null,
          });
        }
      }
      handleCloseModal();
      await fetchUsers();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Terjadi kesalahan");
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
      showToast.success("Pengguna berhasil dihapus!");
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Gagal menghapus pengguna");
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // Pagination calculation
  const totalPages = Math.ceil(users.length / rowsPerPage) || 1;
  const paginatedUsers = users.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Helper function for extracting degree level
  const extractJenjang = (prodi?: string, fallbackJenjang?: string) => {
    if (fallbackJenjang && ["S1", "S2", "S3", "D3", "D4"].includes(fallbackJenjang)) return fallbackJenjang;
    if (!prodi) return "S1";
    const match = prodi.match(/\b(S1|S2|S3|D3|D4)\b/i);
    return match ? match[1].toUpperCase() : "S1";
  };

  // Helper function for cleaning redundant degree prefix from Program Studi name
  const cleanProdiName = (prodi?: string) => {
    if (!prodi || prodi.trim() === "" || prodi.trim() === "-") return "-";
    const cleaned = prodi.replace(/\b(S1|S2|S3|D3|D4)\s*/gi, "").trim();
    return cleaned.length > 0 ? cleaned : prodi;
  };

  // Helper function for cleaning redundant KKN Group names
  const cleanKknDisplayName = (name?: string) => {
    if (!name || name === "-") return "-";
    let clean = name.trim();
    clean = clean.replace(/\s*\([^)]*\)/g, ""); // strip existing parenthesized suffix e.g. (Dago) or (Kel. Dago)
    clean = clean.replace(/\s+-\s+/g, " - "); // normalize dashes
    
    // Normalize informal pattern like "Dago 1", "Dago 4", "Cipaganti 4" -> "Kelompok 1 Dago", "Kelompok 4 Dago"
    const informalMatch = clean.match(/^([A-Za-z\s]+?)\s+(\d+)$/);
    if (informalMatch) {
      const place = informalMatch[1].replace(/^Kel\s*/i, "").trim();
      const num = informalMatch[2];
      return `Kelompok ${num} ${place}`;
    }
    return clean;
  };

  // Helper function for rendering Wilayah Penugasan as RW & Kelurahan badges
  const renderWilayahBadges = (raw?: string) => {
    if (!raw || raw === "-" || raw.trim() === "") return <span className="text-slate-400 font-medium">-</span>;

    const str = String(raw).trim();

    // Extract Kelurahan
    const knownKels = ["Cipaganti", "Dago", "Lebak Gede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"];
    let foundKel = "";
    for (const k of knownKels) {
      if (str.toLowerCase().includes(k.toLowerCase())) {
        foundKel = k;
        break;
      }
    }

    // Extract all numeric RW values from string
    const rwNumbers: number[] = [];
    const matches = str.match(/\d+/g);
    if (matches) {
      for (const m of matches) {
        const num = parseInt(m, 10);
        if (num > 0 && num <= 100) {
          rwNumbers.push(num);
        }
      }
    }

    const rwList = Array.from(new Set(rwNumbers)).sort((a, b) => a - b).map(n => `RW ${String(n).padStart(2, "0")}`);

    if (rwList.length === 0 && !foundKel) {
      return <span className="text-slate-700 font-semibold">{str}</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-1 max-w-xs">
        {rwList.map((rwItem, idx) => (
          <span key={idx} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] border border-blue-200 font-extrabold whitespace-nowrap inline-block shadow-2xs">
            {rwItem}
          </span>
        ))}
        {foundKel && (
          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] border border-emerald-200 font-extrabold whitespace-nowrap inline-block shadow-2xs">
            Kel. {foundKel}
          </span>
        )}
      </div>
    );
  };

  const renderPetugasResiduCell = (petugasData: any) => {
    if (!petugasData) {
      return <span className="text-slate-400 font-medium">-</span>;
    }

    const name = typeof petugasData === "string" ? petugasData : petugasData.name || "Petugas Residu";
    const photo = typeof petugasData === "object" ? petugasData.fotoProfil : null;
    const initials = name
      .split(" ")
      .filter(Boolean)
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PR";

    return (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#009966] text-white font-extrabold text-xs flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-2xs">
          {photo ? (
            <img
              src={getProfilePhotoUrl(photo, name)}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => handleAvatarError(e, name)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <span className="font-bold text-slate-800 text-xs leading-tight">{name}</span>
      </div>
    );
  };

  const renderPhoneCell = (rawPhone?: string) => {
    const formatted = formatPhone(rawPhone || "");
    if (!rawPhone || formatted === "-" || formatted === "") {
      return (
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
          <Phone size={12} className="text-slate-300 shrink-0" />
          <span>-</span>
        </div>
      );
    }

    const cleanNum = formatted.replace(/\+/g, "").replace(/\s+/g, "");

    return (
      <a
        href={`https://wa.me/${cleanNum}`}
        target="_blank"
        rel="noreferrer"
        title="Hubungi via WhatsApp"
        className="font-mono text-slate-600 hover:text-emerald-600 hover:underline inline-flex items-center gap-1.5 transition-colors font-bold"
      >
        <Phone size={12} className="text-emerald-500 shrink-0" />
        <span>{formatted}</span>
      </a>
    );
  };

  const getMahasiswaWilayahStr = (u: any) => {
    const studentProfile = u.studentProfile;
    const kel = studentProfile?.kelompok;

    // 1. Cek dari kelompok KKN jika terikat kelompok
    if (kel) {
      let rwStr = "";
      if (kel.cakupanRw) {
        let rws: any[] = [];
        if (Array.isArray(kel.cakupanRw)) {
          rws = kel.cakupanRw;
        } else if (typeof kel.cakupanRw === "string") {
          try { rws = JSON.parse(kel.cakupanRw); } catch { rws = [kel.cakupanRw]; }
        } else if (typeof kel.cakupanRw === "number") {
          rws = [kel.cakupanRw];
        }
        if (rws.length > 0) {
          rwStr = `RW ${rws.map((r: any) => String(r).replace(/\D/g, "").padStart(2, "0")).filter(Boolean).join(", RW ")}`;
        }
      }
      const kelStr = kel.kelurahan ? cleanKelurahanName(kel.kelurahan) : "";
      if (rwStr || kelStr) {
        return [rwStr, kelStr].filter(Boolean).join(" ");
      }
      if (kel.wilayahPenugasan) return kel.wilayahPenugasan;
    }

    // 2. Fallback ke u.address atau u.wilayah
    if (u.address && u.address !== "-") return u.address;
    if (u.wilayah && u.wilayah !== "-") return u.wilayah;

    return "-";
  };


  // === ISO 27001 / NIST SP 800-63B Password Validation ===
  const passwordRules = useMemo(() => {
    const pw = formData.password;
    if (!pw && modalType === "edit") return null; // Skip validation for edit if empty
    return {
      minLength: pw.length >= 8,
      hasUppercase: /[A-Z]/.test(pw),
      hasLowercase: /[a-z]/.test(pw),
      hasNumber: /[0-9]/.test(pw),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?~`]/.test(pw),
      matches: pw === formData.confirmPassword && pw.length > 0,
    };
  }, [formData.password, formData.confirmPassword, modalType]);

  const passwordStrength = useMemo(() => {
    if (!formData.password) return { level: 0, label: "", color: "" };
    const rules = passwordRules;
    if (!rules) return { level: 0, label: "", color: "" };
    const passed = [rules.minLength, rules.hasUppercase, rules.hasLowercase, rules.hasNumber, rules.hasSpecial].filter(Boolean).length;
    if (passed <= 2) return { level: 1, label: "Lemah", color: "bg-rose-500" };
    if (passed <= 3) return { level: 2, label: "Sedang", color: "bg-amber-500" };
    if (passed <= 4) return { level: 3, label: "Kuat", color: "bg-blue-500" };
    return { level: 4, label: "Sangat Kuat", color: "bg-emerald-500" };
  }, [formData.password, passwordRules]);

  const isPasswordValid = useMemo(() => {
    if (modalType === "edit" && !formData.password) return true; // Skip for edit if empty
    if (modalType === "add" && !formData.password) return false;
    if (!passwordRules) return true;
    return passwordRules.minLength && passwordRules.hasUppercase && passwordRules.hasLowercase && passwordRules.hasNumber && passwordRules.matches;
  }, [passwordRules, modalType, formData.password]);

  const getNameInitials = (name?: string): string => {
    if (!name) return "?";
    const cleanName = name
      .replace(/\b(Assoc\.|Prof\.|Dr\.|Dra\.|Drs\.|S\.Kom\.|M\.Kom\.|M\.Eng\.|S\.E\.|M\.Si\.|S\.T\.|M\.T\.|S\.Ds\.|M\.Ds\.|S\.H\.|M\.H\.|S\.Si\.|S\.Pd\.|M\.Pd\.|S\.IP\.|M\.I\.Pol\.|M\.I\.Kom\.|S\.Sos\.|S\.STP\.|M\.AP\.|A\.KS\.|Ph\.D\.|CIMA|CDMP|CSBA)\b/gi, "")
      .trim();
    const words = (cleanName || name).split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0][0].toUpperCase();
    return words.slice(0, 3).map((w) => w[0].toUpperCase()).join("");
  };

  const renderAvatar = (u: any) => {
    const name = typeof u === "string" ? u : u?.name || "?";
    const foto = typeof u === "object" ? u?.fotoProfil : null;
    const initials = getNameInitials(name);
    const fontClass = initials.length >= 3
      ? "text-[8px] font-black tracking-tighter"
      : initials.length === 2
      ? "text-[10px] font-black tracking-tight"
      : "text-[11px] font-black";

    return (
      <div className="w-8 h-8 rounded-full bg-[#009966] text-white flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm font-sans">
        {foto ? (
          <img src={getProfilePhotoUrl(foto, name)} alt="" className="w-full h-full object-cover" onError={(e) => handleAvatarError(e, name)} />
        ) : (
          <span className={fontClass}>{initials}</span>
        )}
      </div>
    );
  };

  const renderDplCell = (dplName: string | null | undefined, fotoProfil?: string | null) => {
    if (!dplName || dplName === "-") {
      return <span className="text-slate-400 font-medium">-</span>;
    }
    return (
      <div className="flex items-center gap-2.5">
        {renderAvatar({ name: dplName, fotoProfil })}
        <span className="font-bold text-slate-800 text-xs">{dplName}</span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#009966]/10 text-[#009966] flex items-center justify-center border border-[#009966]/20 shrink-0">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Manajemen Pengguna
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola akses, daftar pengguna, peran sistem, dan otentikasi akun
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#009966] hover:bg-[#008855] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Peran Terfilter
            </p>
            <h3 className="text-sm sm:text-base font-black text-slate-800 mt-1 leading-snug break-words">
              {ROLE_LABEL_MAP[selectedRole] || selectedRole}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shrink-0">
            <User size={20} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
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

          {/* Status Akun Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${
                selectedStatus === "Aktif" ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : selectedStatus === "Nonaktif" ? "bg-rose-500 shadow-xs shadow-rose-500/50" : "bg-slate-400"
              }`} />
              <span>{selectedStatus === "Semua" ? "Semua Status" : selectedStatus}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isStatusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsStatusDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200/90 rounded-xl shadow-lg z-30 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {[
                    { value: "Semua", label: "Semua Status", color: "bg-slate-400" },
                    { value: "Aktif", label: "Aktif", color: "bg-emerald-500" },
                    { value: "Nonaktif", label: "Nonaktif", color: "bg-rose-500" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(opt.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-extrabold rounded-lg transition-all text-left cursor-pointer ${
                        selectedStatus === opt.value
                          ? "bg-[#009966]/10 text-[#009966]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200">
                {["DEVELOPER", "SUPER_USER"].includes(selectedRole) ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : ["PEMIMPIN", "PANITIA_TASKFORCE"].includes(selectedRole) ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NIP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">INSTITUSI</th>
                    <th className="py-3 px-4">JABATAN</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : selectedRole === "DPL" ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NIP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">PEMBIMBING KELOMPOK</th>
                    <th className="py-3 px-4">JENJANG PENDIDIKAN</th>
                    <th className="py-3 px-4">PROGRAM STUDI</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : selectedRole === "ADMIN_DLH" ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">PROVINSI</th>
                    <th className="py-3 px-4">KOTA / KABUPATEN</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : selectedRole === "CAMAT" ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">KOTA / KABUPATEN</th>
                    <th className="py-3 px-4">KECAMATAN</th>
                    <th className="py-3 px-4">KELURAHAN</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : selectedRole === "LURAH" ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">KECAMATAN</th>
                    <th className="py-3 px-4">KELURAHAN</th>
                    <th className="py-3 px-4">RUKUN WARGA</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : selectedRole === "RW" ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">KELURAHAN</th>
                    <th className="py-3 px-4">RUKUN WARGA</th>
                    <th className="py-3 px-4">PETUGAS PEMILAH</th>
                    <th className="py-3 px-4">ALAMAT LENGKAP</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : selectedRole === "PETUGAS_RESIDU" ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">KECAMATAN</th>
                    <th className="py-3 px-4">KELURAHAN</th>
                    <th className="py-3 px-4">RUKUN WARGA</th>
                    <th className="py-3 px-4">WILAYAH PENUGASAN</th>
                    <th className="py-3 px-4">ALAMAT LENGKAP</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : selectedRole === "MAHASISWA_KKN" ? (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NIM</th>
                    <th className="py-3 px-4">JENJANG PENDIDIKAN</th>
                    <th className="py-3 px-4">PROGRAM STUDI</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">KELOMPOK KKN</th>
                    <th className="py-3 px-4">DOSEN PEMBIMBING</th>
                    <th className="py-3 px-4">WILAYAH PENUGASAN</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4">NAMA LENGKAP</th>
                    <th className="py-3 px-4">NO. HP</th>
                    <th className="py-3 px-4">KECAMATAN</th>
                    <th className="py-3 px-4">KELURAHAN</th>
                    <th className="py-3 px-4">RUKUN WARGA</th>
                    <th className="py-3 px-4">ALAMAT LENGKAP</th>
                    <th className="py-3 px-4 text-center">JML. ANGGOTA KELUARGA</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">AKSI</th>}
                  </>
                )}
              </tr>
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
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {renderAvatar(u)}
                        <span className="font-bold text-slate-800 text-xs">{u.name}</span>
                      </div>
                    </td>

                    {["DEVELOPER", "SUPER_USER"].includes(selectedRole) ? (
                      <>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                      </>
                    ) : ["PEMIMPIN", "PANITIA_TASKFORCE"].includes(selectedRole) ? (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{u.nip || "-"}</td>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{u.institusi || u.prodi || "Universitas Komputer Indonesia"}</td>
                        <td className="py-3 px-4 text-slate-700 font-bold">{u.jabatan || (selectedRole === "PEMIMPIN" ? "Rektor" : "Anggota Task Force")}</td>
                      </>
                    ) : selectedRole === "DPL" ? (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{u.nip || "-"}</td>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">
                          {u.dplKelompok && u.dplKelompok.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Array.from(
                                new Map(
                                  u.dplKelompok.map((k: any) => {
                                    const cleaned = cleanKknDisplayName(k.name);
                                    return [cleaned.toLowerCase(), cleaned];
                                  })
                                ).values()
                              ).map((groupName: any, i: number) => (
                                <span key={i} className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-[11px] border border-emerald-200/80 font-extrabold whitespace-nowrap inline-flex items-center gap-1.5 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {groupName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-bold">{extractJenjang(u.programStudi || u.prodi, u.jenjangPendidikan)}</td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{cleanProdiName(u.programStudi || u.prodi)}</td>
                      </>
                    ) : selectedRole === "ADMIN_DLH" ? (
                      <>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-md text-[10px] border border-teal-200/80 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {u.provinsi || "Jawa Barat"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-md text-[10px] border border-sky-200/80 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {getCleanKabupatenName(u.kabupaten || u.wilayah)}
                          </span>
                        </td>
                      </>
                    ) : selectedRole === "CAMAT" ? (
                      <>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-md text-[10px] border border-sky-200/80 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {getCleanKabupatenName(u.kabupaten || u.wilayah)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-[#e5f7ed] text-[#009966] px-2.5 py-0.5 rounded-md text-[10px] border border-[#009966]/20 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {formatKecamatanName(u.kecamatan)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          {(() => {
                            const isCoblongKec = (u.kecamatan || "").toLowerCase().includes("coblong");
                            const kels = isCoblongKec ? ["Cipaganti", "Dago", "Lebak Gede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"] : [];
                            return kels.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {kels.map((kel, i) => (
                                  <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] border border-emerald-200 font-bold whitespace-nowrap inline-block shadow-2xs">
                                    Kel. {kel}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium text-xs">-</span>
                            );
                          })()}
                        </td>
                      </>
                    ) : selectedRole === "LURAH" ? (
                      <>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-[#e5f7ed] text-[#009966] px-2.5 py-0.5 rounded-md text-[10px] border border-[#009966]/20 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {formatKecamatanName(u.kecamatan)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md text-[10px] border border-emerald-200 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {detectKelurahanName(u)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {getRwListForKelurahan(u.kelurahan || u.address).map((rwItem: string, i: number) => (
                              <span key={i} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] border border-blue-200 font-extrabold whitespace-nowrap inline-block shadow-2xs">
                                {rwItem}
                              </span>
                            ))}
                          </div>
                        </td>
                      </>
                    ) : selectedRole === "RW" ? (
                      <>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md text-[10px] border border-emerald-200 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {detectKelurahanName(u)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.rw && u.rw !== "-" ? (
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] border border-blue-200 font-extrabold whitespace-nowrap inline-block shadow-2xs">
                              {u.rw.startsWith("RW") ? u.rw : `RW ${String(u.rw).padStart(2, "0")}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{renderPetugasResiduCell(u.petugasResidu)}</td>
                        <td className="py-3 px-4 text-slate-700">{u.address || "-"}</td>
                      </>
                    ) : selectedRole === "PETUGAS_RESIDU" ? (
                      <>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-[#e5f7ed] text-[#009966] px-2.5 py-0.5 rounded-md text-[10px] border border-[#009966]/20 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {formatKecamatanName(u.kecamatan)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md text-[10px] border border-emerald-200 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {detectKelurahanName(u)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.rw && u.rw !== "-" ? (
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] border border-blue-200 font-extrabold whitespace-nowrap inline-block shadow-2xs">
                              {u.rw.startsWith("RW") ? u.rw : `RW ${String(u.rw).padStart(2, "0")}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{u.wilayah || (u.rw ? `${u.rw}, ${detectKelurahanName(u)}` : detectKelurahanName(u)) || "-"}</td>
                        <td className="py-3 px-4 text-slate-700">{u.address || "-"}</td>
                      </>
                    ) : selectedRole === "MAHASISWA_KKN" ? (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{u.nim || u.studentProfile?.nim || "-"}</td>
                        <td className="py-3 px-4 text-slate-700 font-bold">{extractJenjang(u.studentProfile?.jurusan || u.prodi || u.programStudi, u.jenjangPendidikan || u.studentProfile?.jenjangPendidikan)}</td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{cleanProdiName(u.studentProfile?.jurusan || u.prodi || u.programStudi)}</td>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4">
                          {u.studentProfile?.kelompok?.name && u.studentProfile.kelompok.name !== "-" ? (
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[10px] border border-blue-200 font-bold whitespace-nowrap inline-block shadow-2xs">
                              {cleanKknDisplayName(u.studentProfile.kelompok.name)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">
                          {renderDplCell(u.studentProfile?.kelompok?.dplName || u.studentProfile?.kelompok?.dpl?.name, u.studentProfile?.kelompok?.dplFotoProfil || u.studentProfile?.kelompok?.dpl?.fotoProfil)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{renderWilayahBadges(getMahasiswaWilayahStr(u))}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4">{renderPhoneCell(u.phone)}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-[#e5f7ed] text-[#009966] px-2.5 py-0.5 rounded-md text-[10px] border border-[#009966]/20 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {formatKecamatanName(u.kecamatan)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md text-[10px] border border-emerald-200 font-bold whitespace-nowrap inline-block shadow-2xs">
                            {detectKelurahanName(u)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-bold">
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] border border-blue-200 font-extrabold whitespace-nowrap inline-block shadow-2xs">
                            {u.rw ? (u.rw.startsWith("RW") ? u.rw : `RW ${String(u.rw).padStart(2, "0")}`) : "RW 06"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{u.address || "-"}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{u.jumlahAnggotaKeluarga != null && u.jumlahAnggotaKeluarga !== "" ? u.jumlahAnggotaKeluarga : "-"}</td>
                      </>
                    )}

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        (u.status === "Aktif" || u.status === "ACTIVE" || !u.status)
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (u.status === "Aktif" || u.status === "ACTIVE" || !u.status) ? "bg-emerald-500" : "bg-rose-500"
                        }`} />
                        {u.status || "Aktif"}
                      </span>
                    </td>

                    {!isReadOnly && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1">
                          {selectedRole.toUpperCase() !== "RW" && u.roleName !== "RW" && u.role !== "RW" && u.role?.name !== "RW" && (
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {(() => {
                            const isSelf = user && (u.id === user.id || (u.phone && user.phone && u.phone === user.phone));
                            return (
                              <button
                                disabled={isSelf}
                                onClick={() => {
                                  if (isSelf) return;
                                  handleDeleteClick(u);
                                }}
                                className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
                                  isSelf
                                    ? "bg-slate-100 text-slate-300 opacity-40 cursor-not-allowed"
                                    : "bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white cursor-pointer"
                                }`}
                                title={isSelf ? "Akun Anda Sendiri - Tidak dapat dihapus" : "Hapus"}
                              >
                                <Trash2 size={15} />
                              </button>
                            );
                          })()}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
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

      {/* Modal Tambah/Edit — Standar ISO 27001 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    modalType === "add"
                      ? "bg-[#009966]/10 text-[#009966] border border-[#009966]/20"
                      : "bg-blue-50 text-blue-600 border border-blue-200/60"
                  }`}>
                    {modalType === "add" ? <UserPlus size={20} /> : <Pencil size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {modalType === "add" ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {modalType === "add" ? "Isi formulir untuk mendaftarkan pengguna baru ke sistem" : `Perbarui informasi akun ${selectedUser?.name || ""}`}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={handleCloseModal} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="overflow-y-auto max-h-[75vh]">
              <div className="p-6 space-y-5">
                {/* ── Section: Informasi Dasar ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User size={14} className="text-slate-400" />
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Informasi Dasar & Foto Profil</span>
                  </div>
                  <div className="space-y-3.5">
                    {/* Foto Profil Input & Live Preview (LOKASI PALING AWAL DI ATAS NAMA LENGKAP) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Foto Profil</label>
                      <div className="flex items-center gap-3.5 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="w-13 h-13 rounded-full bg-[#009966] text-white font-black text-xs flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-md font-sans tracking-wider">
                          {formData.fotoProfil ? (
                            <img
                              src={getProfilePhotoUrl(formData.fotoProfil, formData.name)}
                              alt="Preview Foto"
                              className="w-full h-full object-cover"
                              onError={(e) => handleAvatarError(e, formData.name)}
                            />
                          ) : (
                            <span>{getNameInitials(formData.name)}</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={formData.fotoProfil}
                              onChange={(e) => setFormData({ ...formData, fotoProfil: e.target.value })}
                              placeholder="URL Foto (https://...) atau Unggah berkas"
                              className="flex-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:border-[#009966] focus:ring-1 focus:ring-[#009966] outline-none"
                            />
                            <label className="h-9 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#009966] border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs">
                              <Upload size={13} />
                              <span>Unggah</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setFormData({ ...formData, fotoProfil: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {formData.fotoProfil && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, fotoProfil: "" })}
                                className="h-9 px-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
                                title="Reset Foto"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {formData.fotoProfil ? "Preview foto profil aktif" : `Default foto otomatis inisial nama: (${getNameInitials(formData.name)})`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Nama Lengkap <span className="text-rose-500">*</span></label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Masukkan nama lengkap" className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold text-slate-800 transition-all outline-none" />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">No. Telepon <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        inputMode="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d+]/g, "") })}
                        onBlur={() => {
                          if (formData.phone) {
                            setFormData((prev) => ({ ...prev, phone: formatPhone(prev.phone) }));
                          }
                        }}
                        placeholder="+628xxxxxxxxxx"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-mono font-semibold text-slate-800 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Peran Sistem</label>
                      <input type="text" disabled value={ROLE_LABEL_MAP[formData.roleName] || formData.roleName} className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs font-bold cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                {/* ── Section: Data Khusus Peran ── */}
                {(["DPL", "MAHASISWA_KKN", "PEMIMPIN", "PANITIA_TASKFORCE", "WARGA", "RW", "PETUGAS_RESIDU", "LURAH", "ADMIN_DLH", "CAMAT"].includes(formData.roleName)) && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={14} className="text-slate-400" />
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Data Khusus Peran</span>
                    </div>
                    <div className="space-y-3">
                      {/* DPL Fields */}
                      {formData.roleName === "DPL" && (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">NIP / NIDN</label>
                            <input type="text" value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} placeholder="4127.34.02.006" className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-mono font-semibold transition-all outline-none" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Jenjang Pendidikan</label>
                              <select value={formData.jenjangPendidikan} onChange={(e) => setFormData({...formData, jenjangPendidikan: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none">
                                <option value="S1">S1 (Sarjana)</option>
                                <option value="S2">S2 (Magister)</option>
                                <option value="S3">S3 (Doktor)</option>
                                <option value="D3">D3 (Diploma Tiga)</option>
                                <option value="D4">D4 (Diploma Empat)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Program Studi</label>
                              <input type="text" value={formData.programStudi || formData.prodi} onChange={(e) => setFormData({ ...formData, programStudi: e.target.value, prodi: e.target.value })} placeholder="Manajemen" className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold transition-all outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kelompok KKN Bimbingan</label>
                            <select
                              value={formData.dplKelompokIds?.[0] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData({ ...formData, dplKelompokIds: val ? [val] : [] });
                              }}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                            >
                               <option value="">-- Pilih Kelompok Bimbingan KKN --</option>
                              {kelompokList.map((k: any) => (
                                <option key={k.id} value={k.id}>
                                  {cleanKknDisplayName(k.name)}
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">Dipilih dari 32 Kelompok KKN terintegrasi secara real-time dari database.</p>
                          </div>
                        </>
                      )}

                      {/* Mahasiswa Fields */}
                      {formData.roleName === "MAHASISWA_KKN" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">NIM (Nomor Induk Mahasiswa)</label>
                              <input type="text" inputMode="numeric" pattern="[0-9]*" value={formData.nim} onChange={(e) => setFormData({ ...formData, nim: e.target.value.replace(/\D/g, "") })} placeholder="10123047" className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-mono font-semibold transition-all outline-none" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kelompok KKN</label>
                              <select
                                value={formData.dplKelompokIds?.[0] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let autoDplId = formData.dplId;
                                  let autoKelName = "";
                                  if (val) {
                                    const foundKel = kelompokList.find((k: any) => k.id === val);
                                    if (foundKel?.dplId || foundKel?.dpl?.id) {
                                      autoDplId = foundKel.dplId || foundKel.dpl?.id;
                                    }
                                    if (foundKel?.kelurahan || foundKel?.name) {
                                      autoKelName = foundKel.kelurahan || cleanKelurahanName(foundKel.name);
                                    }
                                  } else {
                                    autoDplId = "";
                                  }
                                  if (autoKelName) setModalKelurahan(getCleanKelName(autoKelName));
                                  setFormData({
                                    ...formData,
                                    dplKelompokIds: val ? [val] : [],
                                    dplId: autoDplId,
                                  });
                                }}
                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                              >
                                <option value="">-- Tanpa Kelompok (Mandiri / Unassigned) --</option>
                                {kelompokList.map((k: any) => (
                                  <option key={k.id} value={k.id}>
                                    {cleanKknDisplayName(k.name)} {(k.dplName || k.dpl?.name) ? `- DPL: ${k.dplName || k.dpl?.name}` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Dosen Pembimbing Lapangan (DPL)</label>
                            <select
                              value={formData.dplId || ""}
                              onChange={(e) => {
                                const selectedDplId = e.target.value;
                                let autoKelompokId = formData.dplKelompokIds?.[0] || "";
                                if (selectedDplId) {
                                  const matchedKel = kelompokList.find((k: any) => k.dplId === selectedDplId || k.dpl?.id === selectedDplId);
                                  if (matchedKel) {
                                    autoKelompokId = matchedKel.id;
                                    if (matchedKel.kelurahan || matchedKel.name) {
                                      setModalKelurahan(getCleanKelName(matchedKel.kelurahan || cleanKelurahanName(matchedKel.name)));
                                    }
                                  }
                                } else {
                                  autoKelompokId = "";
                                }
                                setFormData({
                                  ...formData,
                                  dplId: selectedDplId,
                                  dplKelompokIds: autoKelompokId ? [autoKelompokId] : [],
                                });
                              }}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                            >
                              <option value="">-- Tanpa Dosen Pembimbing --</option>
                              {dplList.map((d: any) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} {d.nip ? `(NIP: ${d.nip})` : ""} {d.programStudi ? `- ${cleanProdiName(d.programStudi)}` : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Jenjang Pendidikan</label>
                              <select value={formData.jenjangPendidikan} onChange={(e) => setFormData({...formData, jenjangPendidikan: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none">
                                <option value="S1">S1 (Sarjana)</option>
                                <option value="S2">S2 (Magister)</option>
                                <option value="S3">S3 (Doktor)</option>
                                <option value="D3">D3 (Diploma Tiga)</option>
                                <option value="D4">D4 (Diploma Empat)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Program Studi</label>
                              <input type="text" value={formData.prodi} onChange={(e) => setFormData({ ...formData, prodi: e.target.value })} placeholder="S1 Teknik Informatika" className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold transition-all outline-none" />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Pimpinan / Task Force Fields */}
                      {["PEMIMPIN", "PANITIA_TASKFORCE"].includes(formData.roleName) && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">NIP</label>
                              <input type="text" value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} placeholder="4127.34.02.001" className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-mono font-semibold transition-all outline-none" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Institusi</label>
                              <input type="text" value={formData.institusi || (formData.roleName === "PEMIMPIN" ? formData.prodi : "")} onChange={(e) => setFormData({ ...formData, institusi: e.target.value })} placeholder="Universitas Komputer Indonesia" className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold transition-all outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Jabatan</label>
                            <input type="text" value={formData.jabatan || ""} onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })} placeholder={formData.roleName === "PEMIMPIN" ? "Rektor / Dekan / Pimpinan Utama" : "Ketua Task Force / Anggota Tim KKN"} className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold transition-all outline-none" />
                          </div>
                        </>
                      )}

                      {/* ADMIN_DLH Fields */}
                      {formData.roleName === "ADMIN_DLH" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Provinsi Penugasan *</label>
                            <select
                              value={formData.provinsi || (provinsiList[0]?.name || provinsiList[0]?.nama || "Jawa Barat")}
                              onChange={(e) => handleProvinsiSelect(e.target.value)}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                            >
                              {provinsiList.map((p: any) => (
                                <option key={p.id} value={p.name || p.nama}>
                                  {p.name || p.nama}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kota / Kabupaten Penugasan *</label>
                            <select
                              value={formData.kabupaten || (filteredKabupatenList[0]?.name || "")}
                              onChange={(e) => handleKabupatenSelect(e.target.value)}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                            >
                              {filteredKabupatenList.length === 0 ? (
                                <option value="">-- Belum ada Kota/Kabupaten di Master Data --</option>
                              ) : (
                                filteredKabupatenList.map((kb: any) => (
                                  <option key={kb.id} value={kb.name}>{kb.name}</option>
                                ))
                              )}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* CAMAT Location Controls */}
                      {formData.roleName === "CAMAT" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Provinsi Penugasan *</label>
                              <select
                                value={formData.provinsi || (provinsiList[0]?.name || provinsiList[0]?.nama || "Jawa Barat")}
                                onChange={(e) => handleProvinsiSelect(e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                              >
                                {provinsiList.map((p: any) => (
                                  <option key={p.id} value={p.name || p.nama}>
                                    {p.name || p.nama}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kota / Kabupaten Penugasan *</label>
                              <select
                                value={formData.kabupaten || (filteredKabupatenList[0]?.name || "")}
                                onChange={(e) => handleKabupatenSelect(e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                              >
                                {filteredKabupatenList.length === 0 ? (
                                  <option value="">-- Belum ada Kota/Kabupaten di Master Data --</option>
                                ) : (
                                  filteredKabupatenList.map((kb: any) => (
                                    <option key={kb.id} value={kb.name}>{kb.name}</option>
                                  ))
                                )}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kecamatan Penugasan *</label>
                            <select
                              value={formData.kecamatan || (filteredKecamatanList[0]?.name || "")}
                              onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                            >
                              {filteredKecamatanList.length === 0 ? (
                                <option value="">-- Belum ada Kecamatan di Master Data --</option>
                              ) : (
                                filteredKecamatanList.map((kc: any) => (
                                  <option key={kc.id} value={kc.name}>{kc.name}</option>
                                ))
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Cakupan Kelurahan Bawahan (Semua Kelurahan)</label>
                            {(() => {
                              const curKec = formData.kecamatan || (filteredKecamatanList[0]?.name || "");
                              const kelsModal = filteredKelurahanList.map((kl: any) => getCleanKelName(kl.name || kl.nama));
                              return kelsModal.length > 0 ? (
                                <>
                                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
                                    {kelsModal.map((kel: string) => (
                                      <span key={kel} className="bg-emerald-100/80 text-emerald-800 px-2.5 py-1 rounded-lg text-[11px] border border-emerald-300/60 font-extrabold shadow-2xs">
                                        Kel. {kel}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1">Camat secara otomatis membawahi dan mengawasi seluruh {kelsModal.length} Kelurahan di {curKec}.</p>
                                </>
                              ) : (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 text-xs italic font-medium">
                                  Belum ada data Kelurahan terdaftar untuk {curKec || "kecamatan penugasan"} di Master Data.
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      )}

                      {/* Cascading Location Controls for Specific Location Roles (Lurah, RW, Petugas Residu, Warga) */}
                      {["WARGA", "RW", "LURAH", "PETUGAS_RESIDU"].includes(formData.roleName) && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Provinsi Penugasan *</label>
                              <select
                                value={formData.provinsi || (provinsiList[0]?.name || provinsiList[0]?.nama || "Jawa Barat")}
                                onChange={(e) => handleProvinsiSelect(e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                              >
                                {provinsiList.map((p: any) => (
                                  <option key={p.id} value={p.name || p.nama}>
                                    {p.name || p.nama}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kota / Kabupaten Penugasan *</label>
                              <select
                                value={formData.kabupaten || (filteredKabupatenList[0]?.name || "")}
                                onChange={(e) => handleKabupatenSelect(e.target.value)}
                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                              >
                                {filteredKabupatenList.length === 0 ? (
                                  <option value="">-- Belum ada Kota/Kabupaten di Master Data --</option>
                                ) : (
                                  filteredKabupatenList.map((kb: any) => (
                                    <option key={kb.id} value={kb.name}>{kb.name}</option>
                                  ))
                                )}
                              </select>
                            </div>
                          </div>

                          {/* 1. Kecamatan (Dropdown) */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kecamatan Penugasan *</label>
                            <select
                              value={formData.kecamatan || (filteredKecamatanList[0]?.name || "")}
                              onChange={(e) => handleKecamatanSelect(e.target.value)}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                            >
                              {filteredKecamatanList.length === 0 ? (
                                <option value="">-- Belum ada Kecamatan di Master Data --</option>
                              ) : (
                                filteredKecamatanList.map((kc: any) => (
                                  <option key={kc.id} value={kc.name}>{kc.name}</option>
                                ))
                              )}
                            </select>
                          </div>

                          {/* 2. Kelurahan (Dropdown - Cascading Level 1) */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kelurahan Penugasan *</label>
                            <select
                              value={getCleanKelName(modalKelurahan)}
                              onChange={(e) => {
                                const selectedKel = e.target.value;
                                setModalKelurahan(selectedKel);

                                const cleanKel = selectedKel.toLowerCase();
                                const matchedRws = areasList.filter((a: any) => {
                                  const areaKel = (a.kelurahan?.name || "").toLowerCase().replace(/^kel\.\s*/i, "").trim();
                                  return areaKel.includes(cleanKel) || cleanKel.includes(areaKel);
                                });
                                const firstRw = matchedRws.length > 0 ? matchedRws[0] : null;

                                setFormData((prev) => {
                                  const newRtRwId = firstRw ? firstRw.id.toString() : "";
                                  const newRwName = firstRw ? firstRw.name : "";
                                  const updatedSelectedRws = prev.roleName === "MAHASISWA_KKN" ? [] : prev.selectedRws;

                                  let newWilayah = prev.wilayah;
                                  if (["PETUGAS_RESIDU", "RW", "WARGA"].includes(prev.roleName)) {
                                    newWilayah = `${newRwName ? `${newRwName}, ` : ""}Kel. ${selectedKel}`;
                                  } else if (prev.roleName === "LURAH" || prev.roleName === "MAHASISWA_KKN") {
                                    newWilayah = `Kel. ${selectedKel}`;
                                  }

                                  return {
                                    ...prev,
                                    rtRwId: newRtRwId,
                                    rw: newRwName,
                                    selectedRws: updatedSelectedRws,
                                    wilayah: newWilayah,
                                  };
                                });
                              }}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                            >
                              {(() => {
                                const activeKelList = filteredKelurahanList.length > 0 ? filteredKelurahanList : kelurahanList;
                                return activeKelList.length === 0 ? (
                                  <option value="">-- Belum ada Kelurahan di Master Data --</option>
                                ) : (
                                  activeKelList.map((kl: any) => {
                                    const kName = getCleanKelName(kl.name || kl.nama);
                                    return (
                                      <option key={kl.id} value={kName}>
                                        Kel. {kName}
                                      </option>
                                    );
                                  })
                                );
                              })()}
                            </select>
                          </div>

                          {/* 3. Rukun Warga (RW) (Dropdown - Cascading Level 2 derived from selected Kelurahan!) */}
                          {["WARGA", "RW", "PETUGAS_RESIDU"].includes(formData.roleName) && (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Rukun Warga Penugasan *</label>
                              <select
                                value={formData.rtRwId || ""}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  const foundArea = areasList.find((a: any) => a.id.toString() === selectedId);
                                  const rwName = foundArea ? foundArea.name : "";
                                  const currentKel = getCleanKelName(foundArea?.kelurahan?.name || modalKelurahan);

                                  setFormData((prev) => {
                                    let newWilayah = prev.wilayah;
                                    if (["PETUGAS_RESIDU", "RW", "WARGA"].includes(prev.roleName)) {
                                      newWilayah = `${rwName ? `${rwName}, ` : ""}Kel. ${currentKel}`;
                                    }

                                    return {
                                      ...prev,
                                      rtRwId: selectedId,
                                      rw: rwName,
                                      wilayah: newWilayah,
                                    };
                                  });
                                }}
                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                              >
                                <option value="">-- Pilih RW (Kel. {getCleanKelName(modalKelurahan)}) --</option>
                                {filteredRwsByKelurahan.map((a: any) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name} (Kel. {a.kelurahan?.name || getCleanKelName(modalKelurahan)})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}

                      {/* Petugas Residu Assignment for RW */}
                      {formData.roleName === "RW" && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Petugas Pemilah</label>
                          <select
                            value={formData.petugasResiduId || ""}
                            onChange={(e) => setFormData({ ...formData, petugasResiduId: e.target.value })}
                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                          >
                            <option value="">-- Belum Ditugaskan --</option>
                            {petugasResiduList.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.phone})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* PETUGAS_RESIDU Wilayah Penugasan */}
                      {formData.roleName === "PETUGAS_RESIDU" && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Wilayah Penugasan</label>
                          <input
                            type="text"
                            value={formData.wilayah}
                            onChange={(e) => setFormData({ ...formData, wilayah: e.target.value })}
                            placeholder="TPS 3R Siliwangi, Jl. Siliwangi No. 10, Coblong, Kel. Cipaganti"
                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold transition-all outline-none"
                          />
                        </div>
                      )}

                      {/* Address for WARGA, RW, PETUGAS_RESIDU */}
                      {["WARGA", "RW", "PETUGAS_RESIDU"].includes(formData.roleName) && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Alamat Lengkap</label>
                          <textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Jl. Dipatiukur No. ..." className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold transition-all outline-none resize-none" />
                        </div>
                      )}

                      {/* Warga: Jumlah Anggota Keluarga */}
                      {formData.roleName === "WARGA" && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Jumlah Anggota Keluarga</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={formData.jumlahAnggotaKeluarga}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setFormData({ ...formData, jumlahAnggotaKeluarga: val });
                            }}
                            placeholder="Contoh: 4"
                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold transition-all outline-none"
                          />
                        </div>
                      )}

                      {/* Dynamic Multi-select RW for Mahasiswa (with Cascading Kelurahan Dropdown above it) */}
                      {formData.roleName === "MAHASISWA_KKN" && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kelurahan Penugasan *</label>
                            <select
                              value={getCleanKelName(modalKelurahan) || (filteredKelurahanList[0] ? getCleanKelName(filteredKelurahanList[0].name || filteredKelurahanList[0].nama) : "Cipaganti")}
                              onChange={(e) => {
                                const selectedKel = e.target.value;
                                setModalKelurahan(selectedKel);
                                setFormData((prev) => ({
                                  ...prev,
                                  selectedRws: [],
                                }));
                              }}
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-bold cursor-pointer transition-all outline-none"
                            >
                              {(() => {
                                const activeKelList = filteredKelurahanList.length > 0 ? filteredKelurahanList : kelurahanList;
                                return activeKelList.length === 0 ? (
                                  <option value="">-- Belum ada Kelurahan di Master Data --</option>
                                ) : (
                                  activeKelList.map((kl: any) => {
                                    const kName = getCleanKelName(kl.name || kl.nama);
                                    return (
                                      <option key={kl.id} value={kName}>
                                        Kel. {kName}
                                      </option>
                                    );
                                  })
                                );
                              })()}
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-[11px] font-bold text-slate-600">Wilayah Penugasan (RW)</label>
                              <span className="text-[10px] font-extrabold text-[#009966] bg-[#009966]/10 px-2.5 py-0.5 rounded-full border border-[#009966]/20">
                                Kel. {getCleanKelName(modalKelurahan) || "Cipaganti"}
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5 p-3 rounded-xl bg-slate-50/50 border border-slate-200 max-h-36 overflow-y-auto">
                              {filteredRwsByKelurahan.map((area: any) => {
                                const rwNum = area.name.replace(/\D/g, "").padStart(2, "0");
                                const rwCleanName = area.cleanName || (area.name.split("(")[0].trim().startsWith("RW") ? area.name.split("(")[0].trim() : `RW ${rwNum}`);
                                const isChecked = formData.selectedRws.includes(rwNum) || formData.selectedRws.includes(rwCleanName);
                                return (
                                  <label key={area.id || rwNum} className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${isChecked ? "bg-[#009966]/10 text-[#009966] border-[#009966]/30 shadow-2xs" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
                                    <input type="checkbox" checked={isChecked} onChange={() => handleRwToggle(rwNum)} className="sr-only" />
                                    {rwCleanName}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Section: Keamanan Akun ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-slate-400" />
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Keamanan Akun</span>
                  </div>
                  <div className="space-y-3">
                    {/* Password */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                        Kata Sandi {modalType === "add" && <span className="text-rose-500">*</span>}
                        {modalType === "edit" && <span className="text-[10px] text-slate-400 font-normal ml-1">(Kosongkan jika tidak diubah)</span>}
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={showPassword ? "text" : "password"} required={modalType === "add"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Minimal 8 karakter" className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/10 focus:bg-white text-xs font-semibold transition-all outline-none" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      {formData.password && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1.5">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.level ? passwordStrength.color : "bg-slate-200"}`} />
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold ${passwordStrength.level <= 1 ? "text-rose-500" : passwordStrength.level <= 2 ? "text-amber-500" : passwordStrength.level <= 3 ? "text-blue-500" : "text-emerald-500"}`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Password Rules Checklist */}
                      {formData.password && passwordRules && (
                        <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          {[
                            { key: "minLength", label: "Minimal 8 karakter" },
                            { key: "hasUppercase", label: "Mengandung huruf besar (A-Z)" },
                            { key: "hasLowercase", label: "Mengandung huruf kecil (a-z)" },
                            { key: "hasNumber", label: "Mengandung angka (0-9)" },
                            { key: "hasSpecial", label: "Mengandung karakter khusus (!@#$...)" },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                                (passwordRules as any)[key] ? "bg-emerald-500 text-white" : "bg-slate-300 text-white"
                              }`}>
                                {(passwordRules as any)[key] ? (
                                  <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                ) : (
                                  <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                              </div>
                              <span className={`text-[10px] font-semibold ${(passwordRules as any)[key] ? "text-emerald-600" : "text-slate-400"}`}>{label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    {(modalType === "add" || formData.password) && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type={showConfirmPassword ? "text" : "password"} required={modalType === "add" || !!formData.password} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Ulangi kata sandi" className={`w-full h-10 pl-10 pr-10 rounded-xl border bg-slate-50/50 focus:ring-2 focus:bg-white text-xs font-semibold transition-all outline-none ${
                            formData.confirmPassword
                              ? (passwordRules?.matches ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100" : "border-rose-300 focus:border-rose-400 focus:ring-rose-100")
                              : "border-slate-200 focus:border-[#009966] focus:ring-[#009966]/10"
                          }`} />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formData.confirmPassword && (
                          <p className={`text-[10px] font-semibold mt-1 ${passwordRules?.matches ? "text-emerald-500" : "text-rose-500"}`}>
                            {passwordRules?.matches ? "✓ Kata sandi cocok" : "✗ Kata sandi tidak cocok"}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    {/* Status Akun Segmented Control */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Status Akun</label>
                      {(() => {
                        const isSelfAccountInModal = modalType === "edit" && user && selectedUser && (selectedUser.id === user.id || (selectedUser.phone && user.phone && selectedUser.phone === user.phone));
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: "Aktif" })}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                  formData.status === "Aktif" || formData.status === "ACTIVE" || !formData.status
                                    ? "bg-white text-emerald-700 shadow-sm border border-emerald-200 ring-2 ring-emerald-500/20"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  formData.status === "Aktif" || formData.status === "ACTIVE" || !formData.status
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-slate-300"
                                }`} />
                                <span>Aktif</span>
                              </button>

                              <button
                                type="button"
                                disabled={isSelfAccountInModal}
                                onClick={() => {
                                  if (isSelfAccountInModal) return;
                                  setFormData({ ...formData, status: "Nonaktif" });
                                }}
                                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
                                  isSelfAccountInModal
                                    ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-400"
                                    : formData.status === "Nonaktif"
                                      ? "bg-white text-rose-700 shadow-sm border border-rose-200 ring-2 ring-rose-500/20 cursor-pointer"
                                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
                                }`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  formData.status === "Nonaktif"
                                    ? "bg-rose-500 animate-pulse"
                                    : "bg-slate-300"
                                }`} />
                                <span>Nonaktif</span>
                              </button>
                            </div>
                            {isSelfAccountInModal && (
                              <p className="text-[10px] font-bold text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/80 flex items-center gap-1.5 mt-2">
                                <AlertTriangle size={13} className="shrink-0 text-amber-500" />
                                <span>Ini adalah akun Anda yang sedang login. Status akun tidak dapat dinonaktifkan demi keamanan.</span>
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting || !isPasswordValid} className={`px-5 py-2.5 text-white rounded-xl font-extrabold text-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm transition-all ${
                  modalType === "add" ? "bg-[#009966] hover:bg-[#008855]" : "bg-blue-600 hover:bg-blue-700"
                }`}>
                  {isSubmitting && <Loader2 className="animate-spin" size={14} />}
                  {modalType === "add" ? "Tambah Pengguna" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      {/* Delete Modal */}
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
