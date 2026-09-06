import { Loader2, Check, X, Trash2, Map, Plus, Search, AlertTriangle, Pencil, Tags, QrCode, CheckCircle, XCircle, ChevronDown, ChevronUp, Phone, ShieldCheck, Download, Maximize2, Minimize2, Layers, User, Box, RotateCcw } from "lucide-react";

/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { exportToXlsx } from "../../utils/exportXlsx";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import KategoriSampah from "../KategoriSampah/KategoriSampah";
import MasterQrManager from "../SuperUser/MasterQrManager";
import { MapContainer, Marker, Popup, Circle, Polygon, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { ThemeTileLayer } from "../../components/common/ThemeTileLayer";
import L from "leaflet";
import {
  KELURAHAN_GEODATA,
  createHouseholdPinIcon,
} from "../../constants/coblongGeoData";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapEvents = ({
  setZoom,
  setSelectedKelurahan,
}: {
  setZoom: (z: number) => void;
  setSelectedKelurahan: (k: string) => void;
}) => {
  useMapEvents({
    zoomend: (e) => {
      const z = e.target.getZoom();
      setZoom(z);
      if (z < 15) {
        setSelectedKelurahan("Semua Kelurahan");
      }
    },
  });
  return null;
};

const MapFlyTo = ({ target }: { target: { center: [number, number]; zoom: number; timestamp: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    if (target && target.center && !isNaN(target.center[0]) && !isNaN(target.center[1]) && target.center[0] < 0 && target.center[1] > 0) {
      map.flyTo(target.center, target.zoom, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
};


const MapResizer: React.FC<{ isFullscreen: boolean }> = ({ isFullscreen }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isFullscreen, map]);
  return null;
};

// Helper for map events

const ManajemenTempatSampah: React.FC = () => {
  const { user } = useAuthStore();
  const isReadOnly = ["CAMAT", "LURAH", "PANITIA_TASKFORCE", "PEMIMPIN", "PIMPINAN", "DPL", "DOSEN_PEMBIMBING"].includes(user?.peran || "");
  const [searchParams, setSearchParams] = useSearchParams();

  type TabType = "kodefikasi" | "monitoring" | "kategori" | "batch_qr";

  const getTabFromUrl = (): TabType => {
    const tab = searchParams.get("tab");
    if (tab === "monitoring") return "monitoring";
    if (tab === "kategori") return "kategori";
    if (tab === "batch_qr" || tab === "batch-qr" || tab === "qr" || tab === "batch") return "batch_qr";
    return "kodefikasi";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromUrl());

  useEffect(() => {
    const currentTab = getTabFromUrl();
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [bins, setBins] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [selectedBinObj, setSelectedBinObj] = useState<any | null>(null);
  const [selectedBinDetail, setSelectedBinDetail] = useState<any | null>(null);

  // Map view reference & Monitoring controls
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.8903, 107.611]);
  void setMapCenter;
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [selectedMapKelurahan, setSelectedMapKelurahan] = useState("Semua Kelurahan");
  const [flyTarget, setFlyTarget] = useState<{ center: [number, number]; zoom: number; timestamp: number } | null>(null);

  // Map settings
  const isMapSU = user?.peran === "SUPER_USER" || user?.peran === "DEVELOPER" || (user as any)?.role === "SUPER_USER" || (user as any)?.role === "DEVELOPER";
  const [mapTileProvider, setMapTileProvider] = useState<"google_vector" | "google_satellite" | "cartodb" | "osm">(() => {
    return isMapSU ? "google_satellite" : "google_vector";
  });

  // Sync default satellite for SU on user load
  useEffect(() => {
    if (user?.peran === "SUPER_USER" || user?.peran === "DEVELOPER") {
      setMapTileProvider("google_satellite");
    }
  }, [user?.peran]);

  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>("Semua");
  const [mapStatusFilter, setMapStatusFilter] = useState<string>("Semua");
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [mapSearchInput, setMapSearchInput] = useState<string>("");
  const [showKelurahanBoundaries, setShowKelurahanBoundaries] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Handle ESC key to exit map fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMapFullscreen) {
        setIsMapFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMapFullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isMapFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMapFullscreen]);

  // REALTIME POLLING: Auto-sync map data every 10 seconds when Monitoring tab is active
  useEffect(() => {
    if (activeTab === "monitoring") {
      fetchBins();
      const interval = setInterval(() => {
        fetchBins();
        setLastSyncTime(new Date());
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Verified & Owned Bins ONLY for Geospatial Realtime Monitoring (NO MOCK/DUMMY PINS)
  const verifiedMapBins = React.useMemo(() => {
    return bins.filter((b) => {
      const hasGps = b.latitude !== null && b.longitude !== null && !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude));
      const isVerifiedAndOwned = Boolean(
        (b.userId || b.wargaName) &&
        (b.verifiedAt !== "Belum Diaktivasi" || b.realStatus === "ACTIVE_BOUND" || b.realStatus === "ACTIVE")
      );
      return hasGps && isVerifiedAndOwned;
    });
  }, [bins]);

  // Auto-center map to the average location of verified active bins if available
  useEffect(() => {
    if (verifiedMapBins.length > 0 && selectedMapKelurahan === "Semua Kelurahan") {
      const avgLat = verifiedMapBins.reduce((sum, b) => sum + Number(b.latitude), 0) / verifiedMapBins.length;
      const avgLng = verifiedMapBins.reduce((sum, b) => sum + Number(b.longitude), 0) / verifiedMapBins.length;
      if (!isNaN(avgLat) && !isNaN(avgLng) && avgLat !== 0 && avgLng !== 0) {
        setFlyTarget({ center: [avgLat, avgLng], zoom: 15, timestamp: Date.now() });
      }
    }
  }, [verifiedMapBins.length]);

  // Search input auto-fly to matched bin
  useEffect(() => {
    if (mapSearchInput.trim() && verifiedMapBins.length > 0) {
      const q = mapSearchInput.trim().toLowerCase();
      const match = verifiedMapBins.find(
        (b) => (b.kode || "").toLowerCase().includes(q) || (b.wargaName || "").toLowerCase().includes(q)
      );
      if (match && match.latitude && match.longitude) {
        setFlyTarget({
          center: [Number(match.latitude), Number(match.longitude)],
          zoom: 18,
          timestamp: Date.now(),
        });
      }
    }
  }, [mapSearchInput]);

  // Filtered map bins based on user controls
  const filteredMapBins = React.useMemo(() => {
    return verifiedMapBins.filter((b) => {
      // 0. Filter by Map Search Input
      if (mapSearchInput.trim()) {
        const q = mapSearchInput.trim().toLowerCase();
        const codeMatch = (b.kode || "").toLowerCase().includes(q);
        const ownerMatch = (b.wargaName || b.user?.name || "").toLowerCase().includes(q);
        if (!codeMatch && !ownerMatch) return false;
      }

      // 1. Filter Kelurahan
      if (selectedMapKelurahan !== "Semua Kelurahan") {
        const binRw = (b.rw || "").toLowerCase();
        const selKel = selectedMapKelurahan.toLowerCase();
        const userAddress = (b.user?.address || b.lokasi || "").toLowerCase();
        if (!binRw.includes(selKel) && !userAddress.includes(selKel)) {
          return false;
        }
      }

      // 2. Filter Kategori
      if (mapCategoryFilter !== "Semua") {
        const catName = (b.category?.name || b.lokasi || "").toLowerCase();
        const target = mapCategoryFilter.toLowerCase();
        if (target === "organik" && !catName.includes("organik") && !catName.includes("organic")) return false;
        if (target === "anorganik" && !catName.includes("anorganik") && !catName.includes("non_organic")) return false;
      }

      // 3. Filter Status Okupansi
      if (mapStatusFilter !== "Semua") {
        const isRusak = b.status === "Rusak" || b.realStatus === "BROKEN";
        const isPenuh = b.status === "Penuh" || b.kapasitas >= 90;
        const isSedang = b.status === "Sedang" || (b.kapasitas >= 70 && b.kapasitas < 90);
        const isAman = b.status === "Normal" || b.kapasitas < 70;

        if (mapStatusFilter === "Rusak" && !isRusak) return false;
        if (mapStatusFilter === "Penuh" && !isPenuh) return false;
        if (mapStatusFilter === "Sedang" && !isSedang) return false;
        if (mapStatusFilter === "Aman" && !isAman) return false;
      }

      return true;
    });
  }, [verifiedMapBins, selectedMapKelurahan, mapCategoryFilter, mapStatusFilter, mapSearchInput]);

  // Group Filtered Bins by Household (1 Single Pin per House)
  const householdMapGroups = React.useMemo<Array<{
    householdKey: string;
    userId?: string;
    wargaName: string;
    wargaPhone?: string;
    address: string;
    rtRw: string;
    kelurahan: string;
    latitude: number;
    longitude: number;
    organikBin: any | null;
    anorganikBin: any | null;
    residuBin: any | null;
    allBins: any[];
    isPenuh: boolean;
    isSedang: boolean;
    isRusak: boolean;
    lastActivity?: string;
  }>>(() => {
    const map: Record<string, {
      householdKey: string;
      userId?: string;
      wargaName: string;
      wargaPhone?: string;
      address: string;
      rtRw: string;
      kelurahan: string;
      latitude: number;
      longitude: number;
      organikBin: any | null;
      anorganikBin: any | null;
      residuBin: any | null;
      allBins: any[];
      isPenuh: boolean;
      isSedang: boolean;
      isRusak: boolean;
      lastActivity?: string;
    }> = {};

    for (const bin of filteredMapBins) {
      const lat = Number(bin.latitude);
      const lng = Number(bin.longitude);
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) continue;

      const ownerName = bin.wargaName || bin.user?.name || "Warga Terdaftar";
      const ownerPhone = bin.wargaPhone || bin.user?.phone || bin.phone || "";
      const userId = bin.userId || bin.user?.id || "";
      const key = userId ? `user-${userId}` : ownerPhone ? `phone-${ownerPhone}` : `loc-${lat.toFixed(5)}_${lng.toFixed(5)}`;

      const vol = Number(bin.currentVolumeLiter || 0);
      const max = Number(bin.maxCapacityLiter || 25);
      const pct = bin.kapasitas !== undefined ? bin.kapasitas : (max > 0 ? Math.round((vol / max) * 100) : 0);
      const isRusak = bin.status === "Rusak" || bin.realStatus === "BROKEN";
      const isPenuh = bin.status === "Penuh" || pct >= 90;
      const isSedang = bin.status === "Sedang" || (pct >= 70 && pct < 90);

      const binCode = (bin as any).kode || bin.qrCode || bin.id || "";
      const rawCat = (bin.category?.name || (binCode.includes("ANG") ? "anorganik" : binCode.includes("RSD") ? "residu" : binCode.includes("OGN") ? "organik" : "") || "").toLowerCase();
      const isAnorganik = rawCat.includes("anorganik") || rawCat.includes("non_organic") || rawCat.includes("ang");
      const isResidu = rawCat.includes("residu") || rawCat.includes("b3") || rawCat.includes("rsd");
      const isOrganik = !isAnorganik && !isResidu;

      let group = map[key];
      if (!group) {
        const candidateAddress =
          bin.address ||
          (bin as any).wargaAddress ||
          bin.user?.address ||
          (bin.lokasi && !bin.lokasi.toLowerCase().startsWith("kategori:") ? bin.lokasi : null) ||
          "Wilayah Operasional";

        group = {
          householdKey: key,
          userId,
          wargaName: ownerName,
          wargaPhone: ownerPhone,
          address: candidateAddress,
          rtRw: bin.rw || "Wilayah Dampingan",
          kelurahan: bin.kelurahan?.name || bin.user?.kelurahan?.name || (typeof bin.kelurahan === "string" ? bin.kelurahan : ""),
          latitude: lat,
          longitude: lng,
          organikBin: null,
          anorganikBin: null,
          residuBin: null,
          allBins: [],
          isPenuh: false,
          isSedang: false,
          isRusak: false,
          lastActivity: bin.lastActivityLog || bin.verifiedAt,
        };
        map[key] = group;
      }

      group.allBins.push(bin);
      if (isRusak) group.isRusak = true;
      if (isPenuh) group.isPenuh = true;
      if (isSedang) group.isSedang = true;

      if (isOrganik && !group.organikBin) {
        group.organikBin = bin;
      } else if (isAnorganik && !group.anorganikBin) {
        group.anorganikBin = bin;
      } else if (isResidu && !group.residuBin) {
        group.residuBin = bin;
      } else if (!group.organikBin) {
        group.organikBin = bin;
      } else if (!group.anorganikBin) {
        group.anorganikBin = bin;
      }
    }

    return Object.values(map);
  }, [filteredMapBins]);

  // Search Bar Candidate Results (Limit 5 items)
  const mapSearchResults = React.useMemo(() => {
    if (!mapSearchInput.trim()) return [];
    const q = mapSearchInput.trim().toLowerCase();
    return verifiedMapBins
      .filter(
        (b) =>
          (b.kode || "").toLowerCase().includes(q) ||
          (b.wargaName || b.user?.name || "").toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [mapSearchInput, verifiedMapBins]);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [binToDelete, setBinToDelete] = useState<string | null>(null);
  const [rejectBinKode, setRejectBinKode] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [resetOwnershipModal, setResetOwnershipModal] = useState<{ id: string; qrCode: string; wargaName?: string } | null>(null);
  const [isResettingOwnership, setIsResettingOwnership] = useState(false);

  // Kategori Add Modal Trigger Signal
  const [openKategoriAddSignal, setOpenKategoriAddSignal] = useState(0);

  // Form Modal state (Edit data tempat sampah fisik)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    qrCode: string;
    categoryId: string;
    rtRwId: number;
    latitude: string;
    longitude: string;
    maxCapacityLiter: number;
    userId: string;
    status?: string;
  }>({
    qrCode: "",
    categoryId: "organik",
    rtRwId: 1,
    latitude: "",
    longitude: "",
    maxCapacityLiter: 25,
    userId: "",
    status: "ACTIVE_BOUND",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown options
  const [categories, setCategories] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [wargas, setWargas] = useState<any[]>([]);

  // Logs state
  const [logTransactions, setLogTransactions] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  void logTransactions;
  void loadingLogs;

  // Search & Filter state
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Phone formatter matching ManajemenPengguna.tsx
  const formatPhone = (phone?: string) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("62")) return `+${cleaned}`;
    if (cleaned.startsWith("0")) return `+62${cleaned.slice(1)}`;
    return `+${cleaned}`;
  };

  const renderPhoneCell = (phone?: string) => {
    if (!phone || phone === "-") return <span className="text-slate-400 font-medium text-[11px]">-</span>;
    const formatted = formatPhone(phone);
    const cleanNum = phone.replace(/\D/g, "");
    return (
      <a
        href={`https://wa.me/${cleanNum}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-mono font-bold text-[#009966] hover:underline text-[11px] cursor-pointer"
      >
        <Phone size={14} className="text-[#009966] shrink-0" />
        <span>{formatted}</span>
      </a>
    );
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, statusFilter, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(bins.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedBins = bins.slice(startIndex, startIndex + rowsPerPage);


  const fetchBins = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchInput) query.append("search", searchInput);
      if (statusFilter) query.append("status", statusFilter);
      const res = await api.get(`/bins?${query.toString()}`);
      setBins(res.data.data || []);
    } catch (err) {
      setError("Gagal memuat data dari server.");
      toast.error("Gagal memuat data tempat sampah");
    } finally {
      setLoading(false);
    }
  };

  const fetchHouseholds = async () => {
    try {
      const response = await api.get("/households");
      const data = response.data.data || [];
      setHouseholds(data);
      void households;
    } catch (err) {
      console.error("Failed to fetch households:", err);
    }
  };

  const loadFormOptions = async () => {
    try {
      const [catRes, areaRes] = await Promise.all([api.get("/categories"), api.get("/bins/areas")]);
      setCategories(catRes.data?.data || []);
      setAreas(areaRes.data?.data || []);

      api
        .get("/users", { params: { roleName: "WARGA" } })
        .then((res) => setWargas(res.data?.data || []))
        .catch((err) => console.log("Non-admin or error fetching wargas:", err));
      void wargas;
      void areas;
    } catch (err) {
      console.error("Failed to load form options:", err);
    }
  };

  useEffect(() => {
    fetchBins();
  }, [statusFilter]);

  useEffect(() => {
    fetchHouseholds();
    loadFormOptions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBins();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handleOpenEditModal = (bin: any) => {
    const targetId = bin.id || bin.kode;
    setSelectedBin(targetId);
    setFormData({
      qrCode: bin.kode,
      categoryId: bin.categoryId || "organik",
      rtRwId: bin.rwId || 1,
      latitude: bin.latitude ? bin.latitude.toString() : "",
      longitude: bin.longitude ? bin.longitude.toString() : "",
      maxCapacityLiter: bin.maxCapacityLiter || 25,
      userId: bin.userId || "",
      status: bin.realStatus || bin.status || "ACTIVE_BOUND",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (kode: string) => {
    setBinToDelete(kode);
    setIsDeleteModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedBin(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      await api.put(`/bins/${selectedBin}`, payload);
      toast.success("Data tempat sampah berhasil diperbarui!");
      closeFormModal();
      await fetchBins();
      await fetchHouseholds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan perubahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveActivation = async (binKode: string) => {
    try {
      const res = await api.put(`/bins/${binKode}/approve-activation`);
      if (res.data?.success) {
        toast.success("Aktivasi tempat sampah disetujui!");
        fetchBins();
        fetchHouseholds();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyetujui aktivasi");
    }
  };

  const handleRejectActivation = (binKode: string) => {
    setRejectBinKode(binKode);
  };

  const handleConfirmRejectActivation = async () => {
    if (!rejectBinKode) return;
    try {
      setIsRejecting(true);
      const res = await api.put(`/bins/${rejectBinKode}/reject-activation`);
      if (res.data?.success) {
        toast.success("Aktivasi tempat sampah ditolak dan akun warga dibersihkan!");
        setRejectBinKode(null);
        fetchBins();
        fetchHouseholds();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menolak aktivasi");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleConfirmResetOwnership = async () => {
    if (!resetOwnershipModal) return;
    try {
      setIsResettingOwnership(true);
      const targetId = resetOwnershipModal.id || resetOwnershipModal.qrCode;
      const res = await api.post(`/bins/${targetId}/reset-ownership`);
      if (res.data?.success || res.data?.status === "success") {
        toast.success(`Kepemilikan Tempat Sampah ${resetOwnershipModal.qrCode} berhasil di-reset ke status PRINTED (Belum Terikat)`);
        setResetOwnershipModal(null);
        fetchBins();
        fetchHouseholds();
      }
    } catch (error: any) {
      console.error("Gagal mereset kepemilikan tempat sampah:", error);
      toast.error(error.response?.data?.message || "Gagal mereset kepemilikan tempat sampah");
    } finally {
      setIsResettingOwnership(false);
    }
  };

  const handleDeleteClick = (binKode: string) => {
    setBinToDelete(binKode);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!binToDelete) return;
    try {
      await api.delete(`/bins/${binToDelete}`);
      toast.success("Tempat sampah berhasil dihapus!");
      setIsDeleteModalOpen(false);
      setBinToDelete(null);
      fetchBins();
      fetchHouseholds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus tempat sampah");
    }
  };

  const handleExportCSV = () => {
    if (!bins || bins.length === 0) {
      toast.error("Tidak ada data tempat sampah dalam tabel untuk diekspor.");
      return;
    }
    const headers = ["ID", "Kode QR", "Kategori", "Status", "Kapasitas (L)", "Pemilik / Warga", "Wilayah RW", "Kelurahan", "Tanggal Aktivasi"];
    const rows = bins.map((b) => [
      b.id,
      b.qrCode || b.kode || "-",
      b.category?.name || b.kategori || "-",
      b.status,
      b.kapasitasLiter || 50,
      b.user?.name || b.pemilik || "-",
      b.rw?.name || b.rwNama || "-",
      b.rw?.kelurahan?.name || b.kelurahanNama || "-",
      b.activatedAt ? new Date(b.activatedAt).toLocaleString("id-ID") : "-",
    ]);

    exportToXlsx(headers, rows, `Master_Tempat_Sampah_${new Date().toISOString().slice(0, 10)}`, "Tempat Sampah");
    toast.success(`Berhasil mengekspor ${bins.length} tempat sampah!`);
  };

  void handleApproveActivation;
  void handleRejectActivation;
  void handleDeleteClick;
  void handleExportCSV;

  const openLogModal = async (binInput: any) => {
    const binObj = typeof binInput === "object" ? binInput : bins.find(b => (b.kode || b.id) === binInput);
    const binId = typeof binInput === "string" ? binInput : (binInput.kode || binInput.id);
    setSelectedBin(binId);
    setSelectedBinObj(binObj || null);
    setIsModalOpen(true);
    setLoadingLogs(true);
    try {
      const res = await api.get("/transactions/deposits", {
        params: { binCode: binId },
      });
      setLogTransactions(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch bin logs:", err);
      toast.error("Gagal memuat log transaksi");
    } finally {
      setLoadingLogs(false);
    }
  };

  const closeLogModal = () => {
    setIsModalOpen(false);
    setSelectedBin(null);
    setSelectedBinObj(null);
    setLogTransactions([]);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* 1. Header Bar (Clean Multi-Tier Executive UI) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        {/* Tier 1: Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Manajemen Tempat Sampah
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Kelola tempat sampah fisik, lokasi GPS, QR code, peta pemantauan, dan kategori sampah.
            </p>
          </div>

          <div className="self-start sm:self-center flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-700/50 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#009966] animate-pulse" />
              Inventaris Aktif
            </span>
          </div>
        </div>

        {/* Tier 2: Sub-Tabs & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange("kodefikasi")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === "kodefikasi"
                  ? "bg-[#009966] text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-slate-800/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700"
              }`}
            >
              <QrCode size={15} />
              <span>Kodefikasi</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("monitoring")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === "monitoring"
                  ? "bg-[#009966] text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-slate-800/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700"
              }`}
            >
              <Map size={15} />
              <span>Monitoring &amp; Peta</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("kategori")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === "kategori"
                  ? "bg-[#009966] text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-slate-800/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700"
              }`}
            >
              <Tags size={15} />
              <span>Kategori Sampah</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("batch_qr")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === "batch_qr"
                  ? "bg-[#009966] text-white shadow-xs"
                  : "bg-slate-100/80 dark:bg-slate-800/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700"
              }`}
            >
              <QrCode size={15} />
              <span>Batch Kode QR</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {!isReadOnly && activeTab === "kategori" && (
              <button
                type="button"
                onClick={() => setOpenKategoriAddSignal((prev) => prev + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-[#009966] hover:bg-[#008055] text-white font-bold rounded-xl transition-all text-xs shadow-xs cursor-pointer active:scale-95"
              >
                <Plus size={15} /> <span>Tambah Kategori</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Contents */}
      {activeTab === "batch_qr" ? (
        <MasterQrManager />
      ) : activeTab === "kategori" ? (
        <KategoriSampah openAddModalSignal={openKategoriAddSignal} />
      ) : activeTab === "monitoring" ? (
        <div className="space-y-6">

          {/* Header Summary KPI Cards for Monitoring */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                TERVERIFIKASI GPS
              </span>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{verifiedMapBins.length}</h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/50">
                  Aktif
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                ORGANIK
              </span>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {verifiedMapBins.filter((b) => (b.category?.name || b.lokasi || "").toLowerCase().includes("organik") && !(b.category?.name || b.lokasi || "").toLowerCase().includes("anorganik")).length}
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                ANORGANIK
              </span>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400">
                  {verifiedMapBins.filter((b) => (b.category?.name || b.lokasi || "").toLowerCase().includes("anorganik")).length}
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-2xs" />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                PENUH
              </span>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                  {verifiedMapBins.filter((b) => b.status === "Penuh" || b.kapasitas >= 90).length}
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-2xs" />
              </div>
            </div>
          </div>

          {/* Geospatial Map Container with Live Sync Toolbar */}
          <div
            className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all duration-200 ${
              isMapFullscreen
                ? "fixed inset-0 z-[1000] p-4 sm:p-6 flex flex-col h-screen w-screen rounded-none shadow-2xl overflow-hidden"
                : "rounded-2xl shadow-sm p-4 sm:p-5 space-y-4 flex flex-col min-h-0"
            }`}
          >

            {/* Toolbar Top Bar - Tiered Layout for Clean UX */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              {/* Row 1: Title, Live Sync Status, and Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-700/40 shrink-0 shadow-2xs">
                    <Map size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                        Peta Sebaran Real-Time Tempat Sampah Terverifikasi
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live Sync
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Menampilkan sebaran {householdMapGroups.length} Rumah Tangga ({filteredMapBins.length} Tempat Sampah aktif terhubung)
                    </p>
                  </div>
                </div>

                {/* Right Primary Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Fullscreen Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#009966] to-emerald-600 hover:from-[#008055] hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                    title={isMapFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Full Size Peta)"}
                  >
                    {isMapFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    <span className="hidden sm:inline">{isMapFullscreen ? "Kecilkan Peta" : "Full Size Peta"}</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Clean Filter & Map Layer Switcher Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. Kelurahan Filter */}
                  <select
                    value={selectedMapKelurahan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedMapKelurahan(val);
                      if (val !== "Semua Kelurahan" && KELURAHAN_GEODATA[val.toUpperCase().replace(/\s+/g, "_")]) {
                        const geo = KELURAHAN_GEODATA[val.toUpperCase().replace(/\s+/g, "_")];
                        setFlyTarget({ center: geo.centroid, zoom: 16, timestamp: Date.now() });
                      } else {
                        setFlyTarget({ center: [-6.8903, 107.611], zoom: 15, timestamp: Date.now() });
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 shadow-2xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none"
                  >
                    <option value="Semua Kelurahan">Semua Kelurahan</option>
                    <option value="Dago">Kel. Dago</option>
                    <option value="Sadang Serang">Kel. Sadang Serang</option>
                    <option value="Sekeloa">Kel. Sekeloa</option>
                    <option value="Lebak Gede">Kel. Lebak Gede</option>
                    <option value="Lebak Siliwangi">Kel. Lebak Siliwangi</option>
                    <option value="Cipaganti">Kel. Cipaganti</option>
                  </select>

                  {/* 2. Kategori Filter */}
                  <select
                    value={mapCategoryFilter}
                    onChange={(e) => setMapCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 shadow-2xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Organik">Organik</option>
                    <option value="Anorganik">Anorganik</option>
                  </select>

                  {/* 3. Status Filter */}
                  <select
                    value={mapStatusFilter}
                    onChange={(e) => setMapStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 shadow-2xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all focus:outline-none"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Aman">Aman (&lt;70%)</option>
                    <option value="Sedang">Sedang (70-90%)</option>
                    <option value="Penuh">Penuh (&gt;90%)</option>
                    <option value="Rusak">Fisik Rusak</option>
                  </select>
                </div>

                {/* 4. Icon Batas Wilayah Toggle & Map Layer Switcher */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowKelurahanBoundaries(!showKelurahanBoundaries)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs border ${
                      showKelurahanBoundaries
                        ? "bg-[#009966]/10 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border-[#009966]/30 dark:border-emerald-700/50 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                    title={showKelurahanBoundaries ? "Sembunyikan Batas Wilayah (GeoJSON)" : "Tampilkan Batas Wilayah (GeoJSON)"}
                  >
                    <Layers size={14} className={showKelurahanBoundaries ? "text-[#009966] dark:text-emerald-400" : "text-slate-400"} />
                    <span>Batas Wilayah</span>
                  </button>

                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setMapTileProvider("google_vector")}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        mapTileProvider === "google_vector"
                          ? "bg-[#009966] text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Tampilan Google Maps Vektor"
                    >
                      Google Peta
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapTileProvider("google_satellite")}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        mapTileProvider === "google_satellite"
                          ? "bg-[#009966] text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Tampilan Google Maps Satelit / Hybrid"
                    >
                      Satelit
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapTileProvider("cartodb")}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        mapTileProvider === "cartodb"
                          ? "bg-[#009966] text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Tampilan Kartografi Clean"
                    >
                      CartoDB
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Canvas Viewport */}
            <div className={`w-full rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700 relative ${isMapFullscreen ? "flex-1 min-h-0 mt-3" : "h-[500px]"}`}>

              {/* Floating Top-Left Search Bar Overlay with Limit 5 Candidate Results */}
              <div className="absolute top-4 left-4 z-20 pointer-events-auto">
                <div className="relative w-64 sm:w-80 shadow-2xl rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                  <div className="flex items-center px-3.5 py-2">
                    <Search size={15} className="text-[#009966] dark:text-emerald-400 shrink-0 mr-2.5" />
                    <input
                      type="text"
                      placeholder="Cari nama atau kode tempat sampah..."
                      value={mapSearchInput}
                      onChange={(e) => setMapSearchInput(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                    {mapSearchInput && (
                      <button
                        type="button"
                        onClick={() => setMapSearchInput("")}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Limit 5 Search Results List Dropdown */}
                  {mapSearchInput.trim() && (
                    <div className="border-t border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto rounded-b-2xl bg-white dark:bg-slate-900 shadow-xl">
                      {mapSearchResults.length > 0 ? (
                        mapSearchResults.map((bin) => {
                          const binCode = (bin as any).kode || bin.qrCode || bin.id || "";
                          const rawCat = (bin.category?.name || (binCode.includes("ANG") ? "anorganik" : binCode.includes("RSD") ? "residu" : binCode.includes("OGN") ? "organik" : "")).toLowerCase();
                          const isResidu = rawCat.includes("residu") || rawCat.includes("b3") || rawCat.includes("rsd");
                          const isAnorganic = rawCat.includes("anorganik") || rawCat.includes("ang");
                          const catName = isResidu ? "Residu" : isAnorganic ? "Anorganik" : "Organik";
                          return (
                            <div
                              key={`search-res-${bin.id || bin.kode}`}
                              onClick={() => {
                                setMapSearchInput(bin.kode);
                                if (bin.latitude && bin.longitude) {
                                  setFlyTarget({
                                    center: [Number(bin.latitude), Number(bin.longitude)],
                                    zoom: 18,
                                    timestamp: Date.now(),
                                  });
                                }
                              }}
                              className="px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer transition-colors flex items-center justify-between"
                            >
                              <div>
                                <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100 block">{bin.kode}</span>
                                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold">{bin.wargaName || bin.user?.name || "Warga Terdaftar"}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                isResidu
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                  : isAnorganic
                                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50"
                                  : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50"
                              }`}>
                                {catName}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3.5 py-3 text-xs text-slate-400 font-medium text-center">
                          Tidak ada tempat sampah yang cocok
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Map Overlay Legend Card (Legenda Peta) */}
              <div
                className="absolute bottom-4 right-4 flex flex-col pointer-events-auto max-w-[280px] sm:max-w-[300px] select-none"
                style={{ zIndex: 500, isolation: "isolate" }}
              >
                {!isLegendOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsLegendOpen(true)}
                    className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl rounded-2xl px-3.5 py-2 border border-slate-200/90 dark:border-slate-700 flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-[#009966] transition-all cursor-pointer group"
                    title="Tampilkan Legenda Peta"
                  >
                    <Layers className="w-4 h-4 text-[#009966] group-hover:scale-110 transition-transform" />
                    <span>Legenda Sebaran Peta</span>
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ) : (
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-700 flex flex-col gap-2.5 min-w-[210px]">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#009966] dark:text-emerald-400" />
                        <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                          Legenda Sebaran Peta
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLegendOpen(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Sembunyikan Legenda"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Legenda Kategori */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Kategori Tempat Sampah</span>
                      <div className="grid grid-cols-1 gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-2xs" />
                          <span>Organik</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-2xs" />
                          <span>Anorganik</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-white shadow-2xs" />
                          <span>Residu</span>
                        </div>
                      </div>
                    </div>

                    {/* Legenda Kapasitas */}
                    <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Status Volume & Okupansi</span>
                      <div className="grid grid-cols-1 gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shadow-2xs" />
                          <span>Aman (&lt; 70% Terisi)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 shadow-2xs" />
                          <span>Sedang (70% - 90%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100 animate-pulse shadow-2xs" />
                          <span>Penuh (&gt; 90% Terisi)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-700 border border-white shadow-2xs" />
                          <span>Tempat Sampah Rusak</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Diperbarui: {lastSyncTime.toLocaleTimeString()}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Realtime</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Leaflet Map Renderer (attributionControl=false removes Leaflet watermark, zoomControl=false removes + / - box) */}
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                attributionControl={false}
                zoomControl={false}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
              >
                <MapResizer isFullscreen={isMapFullscreen} />
                <MapFlyTo target={flyTarget} />
                <MapEvents setZoom={setMapZoom} setSelectedKelurahan={setSelectedMapKelurahan} />

                {/* Dynamically Resolved Tile Provider (Google Maps Vector / Satelit / CartoDB / OSM / Dark Matter) */}
                <ThemeTileLayer
                  lightUrl={
                    mapTileProvider === "google_vector"
                      ? "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                      : mapTileProvider === "google_satellite"
                      ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                      : mapTileProvider === "cartodb"
                      ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                />

                {/* KELURAHAN BOUNDARY POLYGONS (OFFICIAL LAPAKGIS / OSM GEOJSON) */}
                {showKelurahanBoundaries && Object.values(KELURAHAN_GEODATA).map((kg) => {
                  if (
                    selectedMapKelurahan !== "Semua Kelurahan" &&
                    selectedMapKelurahan.toLowerCase() !== kg.name.toLowerCase()
                  ) {
                    return null;
                  }

                  return (
                    <Polygon
                      key={`kel-poly-real-${kg.id}`}
                      positions={kg.bounds}
                      pathOptions={{
                        color: kg.color,
                        fillColor: kg.color,
                        fillOpacity: selectedMapKelurahan.toLowerCase() === kg.name.toLowerCase() ? 0.30 : 0.15,
                        weight: selectedMapKelurahan.toLowerCase() === kg.name.toLowerCase() ? 3 : 2,
                      }}
                    />
                  );
                })}

                {/* REAL HOUSEHOLD MAP MARKERS (1 Single Pin per House with 2 Bins) */}
                {householdMapGroups.map((group) => {
                  const lat = group.latitude;
                  const lng = group.longitude;
                  const circleColor = group.isRusak
                    ? "#e11d48"
                    : group.isPenuh
                    ? "#ef4444"
                    : group.isSedang
                    ? "#f59e0b"
                    : "#10b981";

                  const org = group.organikBin;
                  const anorg = group.anorganikBin;

                  const orgVol = Number(org?.currentVolumeLiter || 0);
                  const orgMax = Number(org?.maxCapacityLiter || 25);
                  const orgPct = org ? (org.kapasitas !== undefined ? org.kapasitas : (orgMax > 0 ? Math.round((orgVol / orgMax) * 100) : 0)) : 0;

                  const anorgVol = Number(anorg?.currentVolumeLiter || 0);
                  const anorgMax = Number(anorg?.maxCapacityLiter || 25);
                  const anorgPct = anorg ? (anorg.kapasitas !== undefined ? anorg.kapasitas : (anorgMax > 0 ? Math.round((anorgVol / anorgMax) * 100) : 0)) : 0;

                  return (
                    <React.Fragment key={`hh-manage-pin-${group.householdKey}`}>
                      {/* Radius indicator circle around household */}
                      <Circle
                        center={[lat, lng]}
                        radius={18}
                        pathOptions={{
                          color: circleColor,
                          fillColor: circleColor,
                          fillOpacity: 0.18,
                          weight: 1.5,
                        }}
                      />

                      <Marker
                        position={[lat, lng]}
                        icon={createHouseholdPinIcon(
                          Boolean(org),
                          Boolean(anorg),
                          group.isPenuh,
                          group.isSedang,
                          group.isRusak
                        )}
                      >
                        {/* HOVER TOOLTIP */}
                        <Tooltip permanent={false} direction="top" offset={[0, -16]} className="custom-bin-hover-tooltip">
                          <div className="p-2 min-w-[230px] space-y-1.5 font-sans">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{group.wargaName}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                                Aktif Terhubung
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 space-y-0.5">
                              <div>{group.address} - {group.rtRw}</div>
                              {group.wargaPhone && <div className="font-mono text-emerald-700 font-bold">{group.wargaPhone}</div>}
                            </div>

                            {/* Dual Bin Status Snippet */}
                            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                              {org && (
                                <div className="space-y-0.5">
                                  <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-emerald-700 dark:text-emerald-400">Organik ({org.kode || org.qrCode})</span>
                                    <span className={orgPct >= 90 ? "text-rose-600" : orgPct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                      {orgVol}/{orgMax}L ({orgPct}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${orgPct >= 90 ? "bg-rose-500" : orgPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                      style={{ width: `${Math.min(orgPct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {anorg && (
                                <div className="space-y-0.5">
                                  <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-amber-700 dark:text-amber-400">Anorganik ({anorg.kode || anorg.qrCode})</span>
                                    <span className={anorgPct >= 90 ? "text-rose-600" : anorgPct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                      {anorgVol}/{anorgMax}L ({anorgPct}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${anorgPct >= 90 ? "bg-rose-500" : anorgPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                      style={{ width: `${Math.min(anorgPct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Tooltip>

                        {/* CLICK POPUP */}
                        <Popup>
                          <div className="p-2 min-w-[280px] max-w-[320px] space-y-3 font-sans">
                            <div className="flex items-center justify-between border-b pb-2">
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs block">{group.wargaName}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{group.rtRw}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                                Rumah Warga
                              </span>
                            </div>

                            {/* Owner details */}
                            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/50 space-y-1">
                              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Identitas Rumah Tangga</span>
                              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                                <div>Alamat: <strong className="text-slate-900 dark:text-slate-100">{group.address}</strong></div>
                                {group.wargaPhone && (
                                  <div>No. WhatsApp: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{group.wargaPhone}</strong></div>
                                )}
                              </div>
                            </div>

                            {/* 2 Tempat Sampah Grid Cards */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                                Tempat Sampah Terhubung (2 Wadah)
                              </span>

                              <div className="grid grid-cols-1 gap-2">
                                {org ? (
                                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">{org.kode || org.qrCode}</span>
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                                        Organik
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-bold">
                                      <span className="text-slate-500">Volume Terisi:</span>
                                      <span className={orgPct >= 90 ? "text-rose-600" : orgPct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                        {orgVol}/{orgMax}L ({orgPct}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${orgPct >= 90 ? "bg-rose-500" : orgPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                        style={{ width: `${Math.min(orgPct, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-xs italic border border-slate-100 dark:border-slate-800">
                                    Tempat Sampah Organik belum terhubung
                                  </div>
                                )}

                                {anorg ? (
                                  <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">{anorg.kode || anorg.qrCode}</span>
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 uppercase">
                                        Anorganik
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-bold">
                                      <span className="text-slate-500">Volume Terisi:</span>
                                      <span className={anorgPct >= 90 ? "text-rose-600" : anorgPct >= 70 ? "text-amber-600" : "text-emerald-600"}>
                                        {anorgVol}/{anorgMax}L ({anorgPct}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${anorgPct >= 90 ? "bg-rose-500" : anorgPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                        style={{ width: `${Math.min(anorgPct, 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 text-xs italic border border-slate-100 dark:border-slate-800">
                                    Tempat Sampah Anorganik belum terhubung
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                              <div>Koordinat Rumah: <strong className="font-mono text-slate-700 dark:text-slate-300">{lat.toFixed(4)}, {lng.toFixed(4)}</strong></div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  TOTAL TEMPAT SAMPAH
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {bins.length}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-700/40 shadow-2xs">
                <Trash2 size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  STATUS NORMAL
                </p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {bins.filter((b) => b.status === "ACTIVE_BOUND" || b.status === "ACTIVE" || b.status === "Normal").length}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-700/50 shadow-2xs">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  KAPASITAS PENUH (&gt;80%)
                </p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {bins.filter((b) => {
                    const vol = Number(b.currentVolumeLiter || 0);
                    const max = Number(b.maxCapacityLiter || 25);
                    return (max > 0 && (vol / max) >= 0.8) || b.status === "Penuh";
                  }).length}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-700/50 shadow-2xs">
                <AlertTriangle size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  FISIK RUSAK
                </p>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {bins.filter((b) => b.status === "BROKEN" || b.realStatus === "BROKEN" || b.status === "Rusak").length}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-700/50 shadow-2xs">
                <XCircle size={20} />
              </div>
            </div>
          </div>

      {/* Search & Filter Toolbar matching User Screenshot */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode tempat sampah..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#009966] focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              <span className={`w-2 h-2 rounded-full ${
                statusFilter === "Normal" || statusFilter === "ACTIVE" || statusFilter === "Aktif" ? "bg-emerald-500" : statusFilter === "Penuh" ? "bg-rose-500" : statusFilter === "Sedang" ? "bg-amber-500" : statusFilter === "Perbaikan" ? "bg-rose-500" : "bg-slate-400"
              }`} />
              <span>{statusFilter ? statusFilter : "Semua Status"}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isStatusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsStatusDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {["Semua Status", "Normal", "Penuh", "Sedang", "Perbaikan"].map((st) => {
                    const isSelected = (st === "Semua Status" && !statusFilter) || statusFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setStatusFilter(st === "Semua Status" ? "" : st);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/80 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 font-extrabold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                        }`}
                      >
                        <span>{st}</span>
                        {isSelected && <Check size={16} className="text-[#009966] dark:text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bin Table matching Master Pengguna styling */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/80 text-[10.5px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                <th className="py-3 px-4 text-center whitespace-nowrap">QR CODE</th>
                <th className="py-3 px-4 whitespace-nowrap">KODE TEMPAT SAMPAH</th>
                <th className="py-3 px-4 whitespace-nowrap">KATEGORI</th>
                <th className="py-3 px-4 whitespace-nowrap">DIMILIKI OLEH</th>
                <th className="py-3 px-4 whitespace-nowrap">KAPASITAS</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">STATUS</th>
                <th className="py-3 px-4 whitespace-nowrap">DIVERIFIKASI PADA</th>
                <th className="py-3 px-4 whitespace-nowrap">GPS</th>
                {!isReadOnly && <th className="py-3 px-4 text-center whitespace-nowrap">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-700/40 shadow-xs">
                      <Loader2 className="animate-spin text-[#009966]" size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">Memuat Data Tempat Sampah...</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">Menghubungkan ke server BERSEKA real-time.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-700/50 shadow-xs">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100">Gagal Memuat Data Tempat Sampah</p>
                      <p className="text-[11px] text-rose-500 font-semibold mt-0.5">{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchBins}
                      className="mt-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </td>
              </tr>
            ) : bins.length > 0 ? (
              paginatedBins.map((bin) => {
                const categoryName = String(bin.category?.name || bin.kategori || bin.categoryId || "Organik").toLowerCase();
                const isResiduBin = categoryName.includes("residu") || categoryName.includes("b3");
                const isAnorganikBin = categoryName.includes("anorganik");
                const catText = isResiduBin ? "Residu" : isAnorganikBin ? "Anorganik" : "Organik";

                return (
                  <tr
                    key={bin.kode}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/50 transition-colors text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap"
                  >
                    {/* 1. QR CODE */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div
                        onClick={() => setSelectedBinDetail(bin)}
                        className="inline-flex items-center justify-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-[#009966] hover:scale-105 transition-all cursor-pointer"
                        title="Klik untuk melihat Detail & Scan QR Code"
                      >
                        <img
                          className="w-10 h-10 rounded-lg object-contain"
                          alt="QR Code"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(bin.kode)}`}
                        />
                      </div>
                    </td>

                    {/* 2. KODE TEMPAT SAMPAH */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedBinDetail(bin)}
                        className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-[#009966]/10 hover:text-[#009966] dark:hover:text-emerald-400 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                        title="Klik untuk melihat Detail & Scan QR Code"
                      >
                        {bin.kode}
                      </button>
                    </td>

                    {/* 3. KATEGORI */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        isResiduBin
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          : isAnorganikBin
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50"
                          : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50"
                      }`}>
                        {catText}
                      </span>
                    </td>

                    {/* 4. DIMILIKI OLEH */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {bin.wargaName || bin.user?.name ? (
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
                            {bin.wargaName || bin.user?.name}
                          </p>
                          <div className="mt-0.5 whitespace-nowrap">
                            {renderPhoneCell(bin.wargaPhone || bin.user?.phone || bin.phone)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium italic text-xs whitespace-nowrap">Belum Terikat</span>
                      )}
                    </td>

                    {/* 5. KAPASITAS */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 min-w-[110px]">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-slate-700 dark:text-slate-300">{bin.currentVolumeLiter || 0}/{bin.maxCapacityLiter || 25}L</span>
                          <span className={bin.kapasitas > 90 ? "text-rose-600 dark:text-rose-400" : bin.kapasitas >= 70 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {bin.kapasitas}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/60 dark:border-slate-800/60 dark:border-slate-700">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              bin.kapasitas > 90 ? "bg-rose-500" : bin.kapasitas >= 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(bin.kapasitas, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 6. STATUS */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        bin.status === "Penuh" || bin.realStatus === "BROKEN"
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50"
                          : bin.realStatus === "PENDING_APPROVAL" || bin.status === "Perbaikan"
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50"
                          : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          bin.status === "Penuh" || bin.realStatus === "BROKEN"
                            ? "bg-rose-500"
                            : bin.realStatus === "PENDING_APPROVAL" || bin.status === "Perbaikan"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`} />
                        {bin.realStatus === "PENDING_APPROVAL" ? "Menunggu" : bin.status === "ACTIVE_BOUND" ? "Aktif" : bin.status || "Aktif"}
                      </span>
                    </td>

                    {/* 7. DIVERIFIKASI PADA */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs font-semibold whitespace-nowrap">
                      {bin.verifiedAt && bin.verifiedAt !== "Belum Diaktivasi" ? (
                        <span>{bin.verifiedAt}</span>
                      ) : (
                        <span className="text-slate-400 font-medium italic">Belum Diaktivasi</span>
                      )}
                    </td>

                    {/* 8. GPS */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
                      {bin.latitude && bin.longitude ? (
                        `${Number(bin.latitude).toFixed(4)}, ${Number(bin.longitude).toFixed(4)}, ${bin.altitude || 768} mdpl`
                      ) : bin.gpsFormatted && bin.gpsFormatted !== "Belum Terikat (GPS)" ? (
                        bin.gpsFormatted.replace("m mdpl", " mdpl")
                      ) : (
                        <span className="text-slate-400 font-sans font-medium italic text-xs">Belum Terikat (GPS)</span>
                      )}
                    </td>

                    {/* 9. AKSI */}
                    {!isReadOnly && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(bin)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#009966] hover:text-white dark:hover:bg-[#009966] transition-all flex items-center justify-center cursor-pointer"
                            title="Ubah Data"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() =>
                              setResetOwnershipModal({
                                id: bin.id || bin.kode,
                                qrCode: bin.kode || bin.qrCode,
                                wargaName: bin.wargaName || bin.user?.name,
                              })
                            }
                            className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-all flex items-center justify-center cursor-pointer"
                            title="Reset Kepemilikan (Kembalikan ke Belum Terikat / PRINTED)"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => openLogModal(bin)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#009966] hover:text-white dark:hover:bg-[#009966] transition-all flex items-center justify-center cursor-pointer"
                            title="Identitas Kepemilikan Tempat Sampah"
                          >
                            <ShieldCheck size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(bin.kode)}
                            className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all flex items-center justify-center cursor-pointer"
                            title="Hapus Tempat Sampah"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <EmptyTableState
                colSpan={9}
                entityName="Tempat Sampah"
                isSearch={!!(searchInput || statusFilter)}
                searchQuery={searchInput}
                onResetSearch={() => {
                  setSearchInput("");
                  setStatusFilter("");
                }}
              />
            )}
          </tbody>
        </table>
        </div>

        {/* Interactive Table Pagination Footer Bar */}
        {bins.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={bins.length}
            itemsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setRowsPerPage}
          />
        )}
      </div>
      </div>
      )}
      {/* Identitas Kepemilikan Tempat Sampah Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/80">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="text-[#009966] dark:text-emerald-400" size={20} />
                Identitas Kepemilikan Tempat Sampah
              </h3>
              <button
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
                onClick={closeLogModal}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Card 1: Identitas Pemilik Tempat Sampah (Sama Seperti Master Pengguna Warga) */}
              {(() => {
                const isBound = Boolean(selectedBinObj?.wargaName || selectedBinObj?.user?.name || selectedBinObj?.userId);
                return (
                  <div className="bg-slate-50 dark:bg-slate-800 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <User size={15} className="text-[#009966] dark:text-emerald-400" /> Identitas Pemilik Tempat Sampah
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isBound ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600"
                      }`}>
                        {isBound ? "Terikat Pemilik" : "Belum Terikat"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Nama Lengkap</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                          {selectedBinObj?.wargaName || selectedBinObj?.user?.name || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">No. HP</span>
                        {renderPhoneCell(selectedBinObj?.wargaPhone || selectedBinObj?.user?.phone || selectedBinObj?.phone)}
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Kecamatan</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          {selectedBinObj?.kecamatan || selectedBinObj?.user?.kecamatan || (isBound ? "Wilayah Operasional" : "-")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Kelurahan</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          {selectedBinObj?.kelurahan || selectedBinObj?.user?.kelurahan || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Rukun Warga</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          {selectedBinObj?.rw || selectedBinObj?.user?.rw || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Jml. Anggota Keluarga</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          {selectedBinObj?.jumlahAnggotaKeluarga || selectedBinObj?.user?.jumlahAnggotaKeluarga ? `${selectedBinObj?.jumlahAnggotaKeluarga || selectedBinObj?.user?.jumlahAnggotaKeluarga} Orang` : "-"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Alamat Lengkap</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          {selectedBinObj?.address || selectedBinObj?.user?.address || selectedBinObj?.locationName || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Card 2: Spesifikasi Tempat Sampah */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Box size={15} className="text-blue-600 dark:text-blue-400" /> Spesifikasi tempat sampah
                  </span>
                  <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border border-blue-300 dark:border-blue-700/50">
                    {selectedBinObj?.category?.name || selectedBinObj?.kategoriText || (selectedBinObj?.kode?.includes("ANG") ? "Anorganik" : selectedBinObj?.kode?.includes("RSD") ? "Residu" : "Organik")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Kode Tempat Sampah</span>
                    <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                      {selectedBinObj?.kode || selectedBin}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Kapasitas Maksimal</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {selectedBinObj?.maxCapacityLiter || 25} Liter
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Volume Terisi Sekarang</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      {selectedBinObj?.currentVolumeLiter || 0} Liter ({selectedBinObj?.kapasitas || 0}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Status Operasional</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {selectedBinObj?.realStatus === "PRINTED" || (!selectedBinObj?.wargaName && !selectedBinObj?.user?.name) ? "Belum Diaktivasi (PRINTED)" : selectedBinObj?.realStatus === "PENDING_APPROVAL" ? "Menunggu Verifikasi" : selectedBinObj?.status || "Normal"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/80">
              <button
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                onClick={closeLogModal}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Tempat Sampah Modal (FULL QR CODE ONLY) */}
      {selectedBinDetail && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 p-6 text-center">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <QrCode className="text-[#009966] dark:text-emerald-400" size={20} />
                QR Code Tempat Sampah
              </h3>
              <button
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
                onClick={() => setSelectedBinDetail(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* FULL QR CODE BODY */}
            <div className="flex flex-col items-center justify-center gap-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <img
                className="w-56 h-56 object-contain rounded-xl p-2 bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-700"
                alt="QR Code Tempat Sampah"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedBinDetail.kode)}`}
              />
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  KODE TEMPAT SAMPAH
                </p>
                <span className="text-sm font-mono font-black text-[#009966] dark:text-emerald-400 tracking-wider">
                  {selectedBinDetail.kode}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-5 flex gap-3">
              <button
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                onClick={() => setSelectedBinDetail(null)}
              >
                Tutup
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(selectedBinDetail.kode)}`}
                target="_blank"
                rel="noreferrer"
                download={`QR_${selectedBinDetail.kode}.png`}
                className="flex-1 py-3 px-4 bg-[#009966] hover:bg-[#008055] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                Unduh QR
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Tempat Sampah */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-white dark:bg-slate-900">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 dark:border-emerald-700/40 shrink-0 mt-0.5">
                  <Pencil size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Ubah Data Tempat Sampah
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Perbarui informasi tempat sampah fisik.
                  </p>
                </div>
              </div>
              <button
                onClick={closeFormModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]"
            >
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Kode Tempat Sampah
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.qrCode || selectedBin || ""}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Kategori Sampah <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#009966] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none transition-all cursor-pointer"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="organik">Organik</option>
                      <option value="anorganik">Anorganik</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Kapasitas Maksimum (Liter) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.maxCapacityLiter}
                  onChange={(e) => setFormData({ ...formData, maxCapacityLiter: parseFloat(e.target.value) })}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#009966] text-xs font-bold text-slate-800 dark:text-slate-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Status Operasional (Sensor Real-time)
                </label>

                {/* Status Card 1 */}
                <div className="p-4 bg-slate-50/60 dark:bg-slate-800/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mb-0.5">
                      Status Otomatis Lapangan
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug block max-w-[230px]">
                      Dihitung otomatis dari persentase volume terisi dari sensor mobile.
                    </span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide border shrink-0 ${
                    formData.status === "BROKEN" || formData.status === "Rusak"
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50"
                      : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50"
                  }`}>
                    {formData.status === "BROKEN" ? "Rusak" : "Aktif"}
                  </span>
                </div>

                {/* Status Card 2 Checkbox */}
                <label className="mt-3 flex items-start gap-3 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/30 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-amber-50/80 dark:hover:bg-amber-950/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.status === "BROKEN" || formData.status === "Rusak"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked ? "BROKEN" : "ACTIVE_BOUND",
                      })
                    }
                    className="mt-0.5 w-4 h-4 text-amber-600 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 block mb-0.5">
                      Tandai Fisik Tempat Sampah Rusak atau dalam Perbaikan
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal block">
                      Centang jika fisik tempat sampah rusak atau sobek dan perlu penanganan petugas.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-6 py-2.5 rounded-full font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#009966] text-white rounded-full font-extrabold hover:bg-[#008055] text-xs shadow-md shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete (Standardized to User Screenshot) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center transform transition-all border border-slate-100 dark:border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-[#ff2851] flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-700/50">
              <AlertTriangle size={26} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-1.5">Hapus Tempat Sampah?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus tempat sampah dengan kode <strong>{binToDelete}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-[#ff2851] text-white font-bold rounded-2xl hover:bg-[#e02045] text-xs shadow-md shadow-rose-200 transition-all cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Tolak Aktivasi Tempat Sampah */}
      <ConfirmModal
        isOpen={Boolean(rejectBinKode)}
        onClose={() => setRejectBinKode(null)}
        onConfirm={handleConfirmRejectActivation}
        isLoading={isRejecting}
        title="Tolak Aktivasi Tempat Sampah"
        message={`Apakah Anda yakin ingin menolak aktivasi untuk tempat sampah ${rejectBinKode || ""}? Akun warga terkait akan dibersihkan.`}
        confirmText="Ya, Tolak Aktivasi"
        type="danger"
      />

      {/* Confirmation Modal Reset Kepemilikan Tempat Sampah */}
      <ConfirmModal
        isOpen={Boolean(resetOwnershipModal)}
        onClose={() => setResetOwnershipModal(null)}
        onConfirm={handleConfirmResetOwnership}
        isLoading={isResettingOwnership}
        title="Reset Kepemilikan Tempat Sampah"
        message={`Apakah Anda yakin ingin melepas kepemilikan Warga dari Tempat Sampah ${resetOwnershipModal?.qrCode || ""}${resetOwnershipModal?.wargaName ? ` (${resetOwnershipModal.wargaName})` : ""}? Status tempat sampah akan di-reset kembali menjadi PRINTED (Belum Terikat).`}
        confirmText="Ya, Reset Kepemilikan"
        type="warning"
      />
    </div>
  );
};

export default ManajemenTempatSampah;
