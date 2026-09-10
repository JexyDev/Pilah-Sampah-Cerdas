/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Cylinder,
  Calculator,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Search,
  RefreshCw,
  Sparkles,
  Layers,
  Plus,
  Edit3,
  Trash2,
  Eye,
  X,
  RotateCcw,
  LayoutGrid,
  List,
  Upload,
  Image as ImageIcon,
  Ruler,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export interface MasterTempatSampahItem {
  id: string;
  nama: string;
  bentuk: "tabung" | "kotak";
  ukuranLabel: "Kecil" | "Sedang" | "Besar" | "Jumbo" | "Kustom";
  kapasitas: number; // Liter
  // Dimensi Fisik (cm)
  panjang?: number; // cm (kotak)
  lebar?: number; // cm (kotak)
  diameter?: number; // cm (tabung)
  tinggi: number; // cm
  material: string;
  lokasiUmum: string;
  deskripsi: string;
  imageUrl: string;
  isDefault?: boolean;
  createdAt?: string;
}

// Galeri Pilihan Foto Tempat Sampah Nyata di Indonesia
export const INDONESIAN_BIN_PHOTO_PRESETS = [
  {
    id: "photo-drum-komunal",
    title: "Tong Drum Biru Komunal RT/RW",
    category: "tabung",
    url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
    desc: "Drum plastik biru bertutup komunal khas lingkungan warga Indonesia",
  },
  {
    id: "photo-tong-pedal",
    title: "Tempat Sampah Injak Pedal (Toilet/Kamar)",
    category: "tabung",
    url: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800&q=80",
    desc: "Tempat sampah pedal stainless/plastik higienis kamar mandi & kos",
  },
  {
    id: "photo-ember-cat",
    title: "Ember Daur Ulang Gagang Kawat",
    category: "tabung",
    url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80",
    desc: "Ember plastik bekas cat 20 kg bertutup gagang untuk dapur warga",
  },
  {
    id: "photo-drum-depan-rumah",
    title: "Tong Drum Plastik Depan Pagar",
    category: "tabung",
    url: "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80",
    desc: "Tong sampah drum hitam/biru sedang di depan teras rumah atau warung",
  },
  {
    id: "photo-kotak-slim",
    title: "Kotak Slim Bawah Meja Kantor",
    category: "kotak",
    url: "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?auto=format&fit=crop&w=800&q=80",
    desc: "Tempat sampah balok slim persegi panjang bawah meja ruang kerja",
  },
  {
    id: "photo-kotak-swing",
    title: "Kotak Tutup Ayun (Swing Top) Dapur",
    category: "kotak",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    desc: "Tempat sampah kotak tutup ayun bolak-balik dapur & pantry keluarga",
  },
  {
    id: "photo-pilah-3",
    title: "Tempat Sampah Pilah 3 Warna Balai RW",
    category: "kotak",
    url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80",
    desc: "Tempat sampah kompartemen pilah Organik, Anorganik & B3 fasilitas umum",
  },
  {
    id: "photo-dustbin-roda",
    title: "Dustbin Kotak Beroda Outdoor (Sulo Bin)",
    category: "kotak",
    url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    desc: "Tempat sampah balok 2 roda pinggir jalan komplek untuk armada caktor",
  },
];

// Data Awal Bawaan Standar Tempat Sampah Real Indonesia
export const DEFAULT_MASTER_TEMPAT_SAMPAH: MasterTempatSampahItem[] = [
  {
    id: "preset-t-1",
    nama: "Tempat Sampah Pedal Injak Kamar/Toilet",
    bentuk: "tabung",
    ukuranLabel: "Kecil",
    kapasitas: 10.0,
    diameter: 23,
    tinggi: 24,
    material: "Stainless Steel / Plastik PP",
    lokasiUmum: "Toilet, Kamar Mandi Kos, Kamar Tidur, Ruang Medis",
    deskripsi:
      "Model silinder higienis dengan mekanisme pedal injak kaki tanpa perlu menyentuh tutup wadah.",
    imageUrl:
      "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800&q=80",
    isDefault: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "preset-t-2",
    nama: "Ember Daur Ulang Bertutup Gagang Kawat",
    bentuk: "tabung",
    ukuranLabel: "Sedang",
    kapasitas: 20.0,
    diameter: 29,
    tinggi: 30,
    material: "Plastik PP Fleksibel (Ember Cat)",
    lokasiUmum: "Dapur Rumah Tangga, Teras Belakang, Samping Wastafel",
    deskripsi:
      "Sangat populer di rumah tangga Indonesia; modifikasi ember cat 20 kg bertutup rapat anti-bau.",
    imageUrl:
      "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80",
    isDefault: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "preset-t-3",
    nama: "Tong Drum Plastik Depan Pagar Rumah",
    bentuk: "tabung",
    ukuranLabel: "Besar",
    kapasitas: 40.0,
    diameter: 36,
    tinggi: 39,
    material: "Plastik HDPE Tebal",
    lokasiUmum: "Depan Pagar Rumah, Teras Depan, Depan Warung Kelontong",
    deskripsi:
      "Drum plastik hitam atau biru ukuran sedang bertutup pegangan atas untuk menampung sampah harian keluarga.",
    imageUrl:
      "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80",
    isDefault: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "preset-t-4",
    nama: "Tong Drum Plastik Komunal RT/RW",
    bentuk: "tabung",
    ukuranLabel: "Jumbo",
    kapasitas: 60.0,
    diameter: 40,
    tinggi: 48,
    material: "Plastik Drum Industri HDPE",
    lokasiUmum: "Titik Kumpul Gang RT/RW, Depan Balai Warga, Lapangan",
    deskripsi:
      "Drum silinder tebal daya tampung besar yang diletakkan di titik kumpul strategis untuk pengangkutan berkala petugas residu.",
    imageUrl:
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80",
    isDefault: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "preset-k-1",
    nama: "Tempat Sampah Slim Kotak Bawah Meja",
    bentuk: "kotak",
    ukuranLabel: "Kecil",
    kapasitas: 12.0,
    panjang: 25,
    lebar: 20,
    tinggi: 24,
    material: "Plastik Polipropilena (PP)",
    lokasiUmum: "Bawah Meja Kerja Kantor, Ruang Belajar, Samping Meja Kasir",
    deskripsi:
      "Bentuk balok ramping hemat tempat, ideal untuk sampah kering, kertas, dan bungkus snack di area indoor.",
    imageUrl:
      "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?auto=format&fit=crop&w=800&q=80",
    isDefault: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "preset-k-2",
    nama: "Tempat Sampah Kotak Tutup Ayun (Swing Top)",
    bentuk: "kotak",
    ukuranLabel: "Sedang",
    kapasitas: 25.0,
    panjang: 40,
    lebar: 25,
    tinggi: 25,
    material: "Plastik PP Tebal",
    lokasiUmum: "Dapur Rumah Tangga, Ruang Makan, Pantry Kantor Kelurahan",
    deskripsi:
      "Desain kotak persegi dengan tutup ayun otomatis kembali tertutup untuk membatasi aroma sisa makanan.",
    imageUrl:
      "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80",
    isDefault: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "preset-k-3",
    nama: "Tempat Sampah Pilah 3 Kompartemen RW",
    bentuk: "kotak",
    ukuranLabel: "Besar",
    kapasitas: 50.0,
    panjang: 40,
    lebar: 35,
    tinggi: 36,
    material: "Fiberglass / Plat Seng Tebal",
    lokasiUmum: "Balai RW, Halaman Sekolah, Taman Fasilitas Umum, Posko KKN",
    deskripsi:
      "Tiga wadah kotak terintegrasi untuk pemilahan langsung jenis Organik (Hijau), Anorganik (Kuning), dan Residu/B3 (Merah).",
    imageUrl:
      "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80",
    isDefault: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "preset-k-4",
    nama: "Dustbin Kotak Beroda 2 Outdoor (Sulo Bin)",
    bentuk: "kotak",
    ukuranLabel: "Jumbo",
    kapasitas: 70.0,
    panjang: 45,
    lebar: 35,
    tinggi: 45,
    material: "Plastik HDPE Anti-UV Beroda Karet",
    lokasiUmum: "Jalur Utama Komplek, Pinggir Jalan Protokol, Drop Point RW",
    deskripsi:
      "Tempat sampah beroda kokoh dengan pegangan ergonomis, mudah didorong dan diangkat saat proses pengangkutan truk armroll.",
    imageUrl:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    isDefault: true,
    createdAt: "2026-01-10T00:00:00.000Z",
  },
];

const STORAGE_KEY = "berseka_master_preset_tempat_sampah_v2";

export const MasterPresetTempatSampahPage: React.FC = () => {
  // State Master List dengan LocalStorage persistence
  const [items, setItems] = useState<MasterTempatSampahItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Gagal membaca localStorage master tempat sampah:", e);
    }
    return DEFAULT_MASTER_TEMPAT_SAMPAH;
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [shapeFilter, setShapeFilter] = useState<"semua" | "tabung" | "kotak">("semua");
  const [capacityFilter, setCapacityFilter] = useState<"semua" | "kecil" | "sedang" | "besar" | "jumbo">("semua");
  const [sortBy, setSortBy] = useState<"kapasitas_asc" | "kapasitas_desc" | "nama_asc" | "nama_desc" | "terbaru">("kapasitas_asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeMainTab, setActiveMainTab] = useState<"katalog" | "simulator">("katalog");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<MasterTempatSampahItem | null>(null);

  const [detailModalItem, setDetailModalItem] = useState<MasterTempatSampahItem | null>(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState<MasterTempatSampahItem | null>(null);

  // Form State
  const [formNama, setFormNama] = useState("");
  const [formBentuk, setFormBentuk] = useState<"tabung" | "kotak">("tabung");
  const [formUkuranLabel, setFormUkuranLabel] = useState<"Kecil" | "Sedang" | "Besar" | "Jumbo" | "Kustom">("Sedang");
  const [formDiameter, setFormDiameter] = useState<number>(30);
  const [formPanjang, setFormPanjang] = useState<number>(35);
  const [formLebar, setFormLebar] = useState<number>(25);
  const [formTinggi, setFormTinggi] = useState<number>(30);
  const [formKapasitas, setFormKapasitas] = useState<number>(20);
  const [formAutoCalculate, setFormAutoCalculate] = useState<boolean>(true);
  const [formMaterial, setFormMaterial] = useState("Plastik HDPE");
  const [formLokasi, setFormLokasi] = useState("Teras Rumah / Dapur Warga");
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formImageUrl, setFormImageUrl] = useState(INDONESIAN_BIN_PHOTO_PRESETS[0].url);
  const [formImageSourceTab, setFormImageSourceTab] = useState<"gallery" | "upload" | "url">("gallery");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Simulator Interactive States
  const [simShape, setSimShape] = useState<"tabung" | "kotak">("tabung");
  const [simDiameter, setSimDiameter] = useState<number>(28);
  const [simTinggiTabung, setSimTinggiTabung] = useState<number>(32);
  const [simPanjang, setSimPanjang] = useState<number>(35);
  const [simLebar, setSimLebar] = useState<number>(25);
  const [simTinggiKotak, setSimTinggiKotak] = useState<number>(30);

  // Simpan otomatis ke LocalStorage setiap ada mutasi pada items
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Gagal menyimpan ke localStorage:", e);
    }
  }, [items]);

  // Kalkulasi Otomatis Kapasitas di Form saat dimensi berubah
  useEffect(() => {
    if (!formAutoCalculate) return;
    if (formBentuk === "tabung") {
      const r = (Number(formDiameter) || 0) / 2;
      const t = Number(formTinggi) || 0;
      const vol = (Math.PI * r * r * t) / 1000;
      setFormKapasitas(Math.round(vol * 10) / 10);
    } else {
      const p = Number(formPanjang) || 0;
      const l = Number(formLebar) || 0;
      const t = Number(formTinggi) || 0;
      const vol = (p * l * t) / 1000;
      setFormKapasitas(Math.round(vol * 10) / 10);
    }
  }, [formBentuk, formDiameter, formPanjang, formLebar, formTinggi, formAutoCalculate]);

  // Sinkronisasi data dari backend jika tersedia
  const handleSyncWithApi = async () => {
    setLoading(true);
    try {
      const [resTabung, resKotak] = await Promise.allSettled([
        api.get("/bins/presets/tabung"),
        api.get("/bins/presets/kotak"),
      ]);

      let updated = false;
      const newItems = [...items];

      if (resTabung.status === "fulfilled" && resTabung.value.data?.data) {
        const apiTabungList = resTabung.value.data.data;
        apiTabungList.forEach((apiItem: any) => {
          const exists = newItems.find((i) => i.id === apiItem.id);
          if (exists) {
            exists.kapasitas = apiItem.capacity || exists.kapasitas;
            exists.diameter = apiItem.diameter || exists.diameter;
            exists.tinggi = apiItem.tinggi || exists.tinggi;
          }
        });
        updated = true;
      }

      if (resKotak.status === "fulfilled" && resKotak.value.data?.data) {
        const apiKotakList = resKotak.value.data.data;
        apiKotakList.forEach((apiItem: any) => {
          const exists = newItems.find((i) => i.id === apiItem.id);
          if (exists) {
            exists.kapasitas = apiItem.capacity || exists.kapasitas;
            exists.panjang = apiItem.panjang || exists.panjang;
            exists.lebar = apiItem.lebar || exists.lebar;
            exists.tinggi = apiItem.tinggi || exists.tinggi;
          }
        });
        updated = true;
      }

      if (updated) {
        setItems(newItems);
        toast.success("Berhasil sinkronisasi nilai dimensi dari server");
      } else {
        toast.success("Katalog lokal telah mutakhir");
      }
    } catch (err) {
      console.warn("Gagal sinkronisasi API, tetap menggunakan lokal:", err);
      toast.success("Katalog lokal aktif & siap digunakan");
    } finally {
      setLoading(false);
    }
  };

  // Reset ke Default Bawaan Berseka Indonesia
  const handleResetToDefault = () => {
    if (window.confirm("Apakah Anda yakin ingin mengembalikan seluruh katalog ke daftar acuan standar Indonesia bawaan sistem? Data kustom yang Anda buat akan di-reset.")) {
      setItems(DEFAULT_MASTER_TEMPAT_SAMPAH);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MASTER_TEMPAT_SAMPAH));
      toast.success("Katalog berhasil dikembalikan ke standar Indonesia");
    }
  };

  // Salin JSON
  const handleCopyJson = (data: any, identifier: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(identifier);
    toast.success("Spesifikasi JSON berhasil disalin!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Buka Modal Tambah
  const handleOpenCreateModal = () => {
    setFormMode("create");
    setEditingItem(null);
    setFormNama("");
    setFormBentuk("tabung");
    setFormUkuranLabel("Sedang");
    setFormDiameter(29);
    setFormPanjang(35);
    setFormLebar(25);
    setFormTinggi(30);
    setFormKapasitas(20);
    setFormAutoCalculate(true);
    setFormMaterial("Plastik PP Daur Ulang");
    setFormLokasi("Teras Rumah / Dapur Warga");
    setFormDeskripsi("");
    setFormImageUrl(INDONESIAN_BIN_PHOTO_PRESETS[0].url);
    setFormImageSourceTab("gallery");
    setIsFormModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEditModal = (item: MasterTempatSampahItem) => {
    setFormMode("edit");
    setEditingItem(item);
    setFormNama(item.nama);
    setFormBentuk(item.bentuk);
    setFormUkuranLabel(item.ukuranLabel);
    setFormDiameter(item.diameter || 30);
    setFormPanjang(item.panjang || 35);
    setFormLebar(item.lebar || 25);
    setFormTinggi(item.tinggi || 30);
    setFormKapasitas(item.kapasitas);
    setFormAutoCalculate(false);
    setFormMaterial(item.material);
    setFormLokasi(item.lokasiUmum);
    setFormDeskripsi(item.deskripsi);
    setFormImageUrl(item.imageUrl);
    setFormImageSourceTab("gallery");
    setIsFormModalOpen(true);
  };

  // Handler Upload Gambar Lokal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormImageUrl(reader.result);
        toast.success("Foto tempat sampah berhasil dimuat!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Simpan Form (Create / Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNama.trim()) {
      toast.error("Nama tempat sampah wajib diisi");
      return;
    }

    if (formKapasitas <= 0) {
      toast.error("Kapasitas harus lebih besar dari 0 Liter");
      return;
    }

    if (formBentuk === "tabung") {
      if (!formDiameter || formDiameter <= 0 || !formTinggi || formTinggi <= 0) {
        toast.error("Diameter dan tinggi harus bernilai positif");
        return;
      }
    } else {
      if (
        !formPanjang ||
        formPanjang <= 0 ||
        !formLebar ||
        formLebar <= 0 ||
        !formTinggi ||
        formTinggi <= 0
      ) {
        toast.error("Panjang, lebar, dan tinggi harus bernilai positif");
        return;
      }
    }

    if (formMode === "create") {
      const generatedId =
        formBentuk === "tabung"
          ? `preset-t-${Date.now().toString().slice(-4)}`
          : `preset-k-${Date.now().toString().slice(-4)}`;

      const newItem: MasterTempatSampahItem = {
        id: generatedId,
        nama: formNama.trim(),
        bentuk: formBentuk,
        ukuranLabel: formUkuranLabel,
        kapasitas: Number(formKapasitas),
        diameter: formBentuk === "tabung" ? Number(formDiameter) : undefined,
        panjang: formBentuk === "kotak" ? Number(formPanjang) : undefined,
        lebar: formBentuk === "kotak" ? Number(formLebar) : undefined,
        tinggi: Number(formTinggi),
        material: formMaterial.trim() || "Plastik Standar",
        lokasiUmum: formLokasi.trim() || "Lingkungan Warga",
        deskripsi: formDeskripsi.trim() || "Tempat sampah operasional penampungan sampah warga.",
        imageUrl: formImageUrl || INDONESIAN_BIN_PHOTO_PRESETS[0].url,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };

      setItems([newItem, ...items]);
      toast.success(`Jenis tempat sampah "${newItem.nama}" berhasil ditambahkan!`);
    } else if (formMode === "edit" && editingItem) {
      const updatedList = items.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            nama: formNama.trim(),
            bentuk: formBentuk,
            ukuranLabel: formUkuranLabel,
            kapasitas: Number(formKapasitas),
            diameter: formBentuk === "tabung" ? Number(formDiameter) : undefined,
            panjang: formBentuk === "kotak" ? Number(formPanjang) : undefined,
            lebar: formBentuk === "kotak" ? Number(formLebar) : undefined,
            tinggi: Number(formTinggi),
            material: formMaterial.trim() || "Plastik Standar",
            lokasiUmum: formLokasi.trim() || "Lingkungan Warga",
            deskripsi: formDeskripsi.trim(),
            imageUrl: formImageUrl || item.imageUrl,
          };
        }
        return item;
      });

      setItems(updatedList);
      toast.success(`Perubahan pada "${formNama}" berhasil disimpan!`);
    }

    setIsFormModalOpen(false);
  };

  // Hapus Item
  const handleConfirmDelete = () => {
    if (!deleteTargetItem) return;
    setItems(items.filter((i) => i.id !== deleteTargetItem.id));
    toast.success(`"${deleteTargetItem.nama}" telah berhasil dihapus`);
    setDeleteTargetItem(null);
  };

  // Filter & Search Logic
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter Bentuk
    if (shapeFilter !== "semua") {
      result = result.filter((item) => item.bentuk === shapeFilter);
    }

    // Filter Kapasitas
    if (capacityFilter === "kecil") {
      result = result.filter((item) => item.kapasitas < 20);
    } else if (capacityFilter === "sedang") {
      result = result.filter((item) => item.kapasitas >= 20 && item.kapasitas < 40);
    } else if (capacityFilter === "besar") {
      result = result.filter((item) => item.kapasitas >= 40 && item.kapasitas <= 60);
    } else if (capacityFilter === "jumbo") {
      result = result.filter((item) => item.kapasitas > 60);
    }

    // Search Query (Pencarian Nama, ID, Material, Lokasi, Dimensi)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.nama.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.material.toLowerCase().includes(q) ||
          item.lokasiUmum.toLowerCase().includes(q) ||
          item.deskripsi.toLowerCase().includes(q) ||
          String(item.kapasitas).includes(q) ||
          (item.diameter && String(item.diameter).includes(q)) ||
          (item.panjang && String(item.panjang).includes(q)) ||
          (item.lebar && String(item.lebar).includes(q)) ||
          String(item.tinggi).includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "kapasitas_asc") return a.kapasitas - b.kapasitas;
      if (sortBy === "kapasitas_desc") return b.kapasitas - a.kapasitas;
      if (sortBy === "nama_asc") return a.nama.localeCompare(b.nama);
      if (sortBy === "nama_desc") return b.nama.localeCompare(a.nama);
      if (sortBy === "terbaru") {
        return (
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      }
      return 0;
    });

    return result;
  }, [items, shapeFilter, capacityFilter, searchQuery, sortBy]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const total = items.length;
    const tabung = items.filter((i) => i.bentuk === "tabung").length;
    const kotak = items.filter((i) => i.bentuk === "kotak").length;
    const avgCap =
      total > 0
        ? Math.round((items.reduce((acc, curr) => acc + curr.kapasitas, 0) / total) * 10) / 10
        : 0;
    return { total, tabung, kotak, avgCap };
  }, [items]);

  // Kalkulasi Simulator
  const simCalculatedVolume = useMemo(() => {
    if (simShape === "tabung") {
      const r = (Number(simDiameter) || 0) / 2;
      const t = Number(simTinggiTabung) || 0;
      const vol = (Math.PI * r * r * t) / 1000;
      return Math.round(vol * 10) / 10;
    } else {
      const p = Number(simPanjang) || 0;
      const l = Number(simLebar) || 0;
      const t = Number(simTinggiKotak) || 0;
      const vol = (p * l * t) / 1000;
      return Math.round(vol * 10) / 10;
    }
  }, [simShape, simDiameter, simTinggiTabung, simPanjang, simLebar, simTinggiKotak]);

  const simClosestPreset = useMemo(() => {
    const candidateList = items.filter((i) => i.bentuk === simShape);
    if (!candidateList.length || simCalculatedVolume <= 0) return null;

    let closest = candidateList[0];
    let minDiff = Math.abs(candidateList[0].kapasitas - simCalculatedVolume);

    for (let i = 1; i < candidateList.length; i++) {
      const diff = Math.abs(candidateList[i].kapasitas - simCalculatedVolume);
      if (diff < minDiff) {
        minDiff = diff;
        closest = candidateList[i];
      }
    }
    return { preset: closest, diff: Math.round(minDiff * 10) / 10 };
  }, [simCalculatedVolume, simShape, items]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Utama */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold mb-2">
            <Sparkles size={14} />
            Master Data & Pengelolaan Preset Fisik
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Jenis & Ukuran Tempat Sampah Nyata Indonesia
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Katalog referensi tempat sampah riil di lingkungan rumah tangga dan komunal Indonesia (Tabung & Kotak).
            Lengkap dengan gambar nyata, spesifikasi dimensi fisik (panjang, lebar, tinggi, diameter), kapasitas liter, serta fitur CRUD penuh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Kembalikan katalog ke 8 tempat sampah standar Indonesia bawaan sistem"
          >
            <RotateCcw size={14} />
            <span>Reset Standar</span>
          </button>

          <button
            onClick={handleSyncWithApi}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
            title="Sinkronisasi dimensi dengan endpoint server"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-600" : ""} />
            <span>Sinkronkan API</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition hover:shadow cursor-pointer"
          >
            <Plus size={15} />
            <span>Tambah Jenis Tempat Sampah</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Model</span>
            <Layers size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total}</div>
          <span className="text-[10px] text-slate-400">Model terdaftar di katalog</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bentuk Tabung</span>
            <Cylinder size={16} className="text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-400">{stats.tabung}</div>
          <span className="text-[10px] text-slate-400">Silinder (Diameter & Tinggi)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bentuk Kotak</span>
            <Box size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.kotak}</div>
          <span className="text-[10px] text-slate-400">Balok (Panjang, Lebar, Tinggi)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rata-rata Kapasitas</span>
            <Calculator size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {stats.avgCap} <span className="text-sm font-semibold">L</span>
          </div>
          <span className="text-[10px] text-slate-400">Volume tampung rata-rata</span>
        </div>
      </div>

      {/* Navigasi Tab Utama (Katalog vs Simulator Dimensi) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveMainTab("katalog")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeMainTab === "katalog"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Layers size={15} />
          <span>Katalog & Manajemen Tempat Sampah</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-500 text-white font-black">
            {filteredAndSortedItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab("simulator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeMainTab === "simulator"
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Calculator size={15} />
          <span>Simulator & Kalkulator Ukuran Fisik</span>
        </button>
      </div>

      {/* TAB 1: KATALOG & CRUD */}
      {activeMainTab === "katalog" && (
        <div className="space-y-5">
          {/* Toolbar Filter, Search, & Sorting */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, ID, material, lokasi, atau dimensi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Bentuk Pill Switch */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0">
                <button
                  onClick={() => setShapeFilter("semua")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    shapeFilter === "semua"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                  }`}
                >
                  Semua Bentuk
                </button>
                <button
                  onClick={() => setShapeFilter("tabung")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    shapeFilter === "tabung"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                  }`}
                >
                  <Cylinder size={13} />
                  <span>Tabung ({items.filter((i) => i.bentuk === "tabung").length})</span>
                </button>
                <button
                  onClick={() => setShapeFilter("kotak")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    shapeFilter === "kotak"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                  }`}
                >
                  <Box size={13} />
                  <span>Kotak ({items.filter((i) => i.bentuk === "kotak").length})</span>
                </button>
              </div>

              {/* View Switcher (Grid vs Table) */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0 self-end lg:self-auto">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Tampilan Grid Kartu Visual"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Tampilan Data Table Rinci"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Second Row: Capacity filter & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <SlidersHorizontal size={13} />
                  Kapasitas:
                </span>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="semua">Semua Kapasitas</option>
                  <option value="kecil">Kecil (&lt; 20 Liter)</option>
                  <option value="sedang">Sedang (20 - 40 Liter)</option>
                  <option value="besar">Besar (40 - 60 Liter)</option>
                  <option value="jumbo">Jumbo (&gt; 60 Liter)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <ArrowUpDown size={13} />
                  Urutkan:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="kapasitas_asc">Kapasitas Terendah &rarr; Tertinggi</option>
                  <option value="kapasitas_desc">Kapasitas Tertinggi &rarr; Terendah</option>
                  <option value="nama_asc">Nama (A &rarr; Z)</option>
                  <option value="nama_desc">Nama (Z &rarr; A)</option>
                  <option value="terbaru">Terbaru Ditambahkan</option>
                </select>
              </div>
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredAndSortedItems.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                  Tidak ditemukan tempat sampah yang cocok
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Coba ubah kata kunci pencarian atau ganti filter bentuk dan kapasitas.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShapeFilter("semua");
                    setCapacityFilter("semua");
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  Bersihkan Filter
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  + Tambah Model Baru
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE: GRID KARTU VISUAL */}
          {viewMode === "grid" && filteredAndSortedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredAndSortedItems.map((item) => {
                const isTabung = item.bentuk === "tabung";
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Hero Image Container dengan Badges */}
                      <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.nama}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase shadow-xs ${
                              isTabung
                                ? "bg-teal-500 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            {isTabung ? <Cylinder size={11} /> : <Box size={11} />}
                            {isTabung ? "Tabung (Silinder)" : "Kotak (Balok)"}
                          </span>

                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                            {item.id}
                          </span>
                        </div>

                        {/* Bottom Overlay Info (Kapasitas & Ukuran) */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                              Ukuran {item.ukuranLabel}
                            </span>
                            <div className="text-2xl font-black tracking-tight flex items-baseline gap-1">
                              {item.kapasitas} <span className="text-xs font-bold text-emerald-300">Liter</span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white font-bold text-[10px]">
                            {item.material}
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-3.5">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
                            {item.nama}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                            {item.deskripsi}
                          </p>
                        </div>

                        {/* SPESIFIKASI DIMENSI FISIK (PANJANG x LEBAR x TINGGI ATAU DIAMETER x TINGGI) */}
                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Ruler size={11} className="text-emerald-600" />
                              Dimensi Fisik Nyata:
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              Satuan: cm
                            </span>
                          </div>

                          {isTabung ? (
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 text-center">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                  Diameter (Ø)
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  {item.diameter} cm
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 text-center">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                  Tinggi (t)
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  {item.tinggi} cm
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-1">
                              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 text-center">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                  Panjang (p)
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  {item.panjang} cm
                                </span>
                              </div>
                              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 text-center">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                  Lebar (l)
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  {item.lebar} cm
                                </span>
                              </div>
                              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 text-center">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                  Tinggi (t)
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                  {item.tinggi} cm
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 text-center font-mono">
                            {isTabung
                              ? `Ø ${item.diameter} cm × t ${item.tinggi} cm`
                              : `${item.panjang} cm (p) × ${item.lebar} cm (l) × ${item.tinggi} cm (t)`}
                          </div>
                        </div>

                        {/* Rekomendasi Lokasi */}
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] uppercase">
                            Lokasi Rekomendasi:
                          </span>
                          <span className="line-clamp-1">{item.lokasiUmum}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => setDetailModalItem(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                        title="Lihat Detail & Foto Lengkap"
                      >
                        <Eye size={13} />
                        <span>Detail</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 hover:text-blue-600 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
                        title="Edit Tempat Sampah"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteTargetItem(item)}
                        className="p-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
                        title="Hapus Model"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: DATA TABLE */}
          {viewMode === "table" && filteredAndSortedItems.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3.5 px-4">Foto & Model</th>
                      <th className="py-3.5 px-4">Bentuk & ID</th>
                      <th className="py-3.5 px-4 text-center">Kapasitas</th>
                      <th className="py-3.5 px-4">Dimensi Fisik (cm)</th>
                      <th className="py-3.5 px-4">Material</th>
                      <th className="py-3.5 px-4">Rekomendasi Area</th>
                      <th className="py-3.5 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    {filteredAndSortedItems.map((item) => {
                      const isTabung = item.bentuk === "tabung";
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                        >
                          {/* Foto & Nama */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.imageUrl}
                                alt={item.nama}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700"
                              />
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                  {item.nama}
                                </h4>
                                <span className="text-[10px] text-slate-400">
                                  Ukuran {item.ukuranLabel}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Bentuk & ID */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isTabung
                                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              }`}
                            >
                              {isTabung ? <Cylinder size={10} /> : <Box size={10} />}
                              {isTabung ? "Tabung" : "Kotak"}
                            </span>
                            <span className="block font-mono text-[10px] text-slate-400 mt-1">
                              {item.id}
                            </span>
                          </td>

                          {/* Kapasitas */}
                          <td className="py-3 px-4 text-center">
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {item.kapasitas}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 ml-0.5">L</span>
                          </td>

                          {/* Dimensi Fisik */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {isTabung ? (
                              <div>
                                <span className="text-slate-800 dark:text-slate-200 font-bold">
                                  Ø {item.diameter} cm
                                </span>{" "}
                                &times;{" "}
                                <span className="text-slate-800 dark:text-slate-200 font-bold">
                                  t {item.tinggi} cm
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-slate-800 dark:text-slate-200 font-bold">
                                  {item.panjang}
                                </span>{" "}
                                &times;{" "}
                                <span className="text-slate-800 dark:text-slate-200 font-bold">
                                  {item.lebar}
                                </span>{" "}
                                &times;{" "}
                                <span className="text-slate-800 dark:text-slate-200 font-bold">
                                  {item.tinggi} cm
                                </span>
                                <span className="block text-[10px] text-slate-400 font-sans">
                                  (p &times; l &times; t)
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Material */}
                          <td className="py-3 px-4 text-[11px]">{item.material}</td>

                          {/* Lokasi */}
                          <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                            {item.lokasiUmum}
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setDetailModalItem(item)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition"
                                title="Lihat Detail"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                                title="Edit"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteTargetItem(item)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition"
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIMULATOR & KALKULATOR UKURAN */}
      {activeMainTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Box */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calculator size={18} className="text-emerald-600" />
                  Kalkulator Dimensi & Kapasitas Tempat Sampah
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Geser slider dimensi fisik untuk mengetahui estimasi liter volume dan mencari template acuan terdekat di Indonesia.
                </p>
              </div>
            </div>

            {/* Switch Bentuk Simulator */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => setSimShape("tabung")}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  simShape === "tabung"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Cylinder size={15} />
                <span>Tabung (Silinder)</span>
              </button>
              <button
                onClick={() => setSimShape("kotak")}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  simShape === "kotak"
                    ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Box size={15} />
                <span>Kotak (Balok)</span>
              </button>
            </div>

            {/* Slider Tabung */}
            {simShape === "tabung" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Diameter Alas (Ø cm):</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                      {simDiameter} cm
                    </span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="1"
                    value={simDiameter}
                    onChange={(e) => setSimDiameter(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Tinggi Tempat Sampah (t cm):</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                      {simTinggiTabung} cm
                    </span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    step="1"
                    value={simTinggiTabung}
                    onChange={(e) => setSimTinggiTabung(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-mono space-y-1">
                  <div>Rumus: V = π &times; (d &divide; 2)² &times; t &divide; 1000</div>
                  <div>
                    V = 3.1416 &times; {(simDiameter / 2).toFixed(1)}² &times; {simTinggiTabung} &divide; 1000 ={" "}
                    <span className="font-bold text-emerald-600">{simCalculatedVolume} Liter</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Slider Kotak */
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Panjang (p cm):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                      {simPanjang} cm
                    </span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="70"
                    step="1"
                    value={simPanjang}
                    onChange={(e) => setSimPanjang(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Lebar (l cm):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                      {simLebar} cm
                    </span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="1"
                    value={simLebar}
                    onChange={(e) => setSimLebar(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Tinggi (t cm):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                      {simTinggiKotak} cm
                    </span>
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    step="1"
                    value={simTinggiKotak}
                    onChange={(e) => setSimTinggiKotak(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-mono space-y-1">
                  <div>Rumus: V = p &times; l &times; t &divide; 1000</div>
                  <div>
                    V = {simPanjang} &times; {simLebar} &times; {simTinggiKotak} &divide; 1000 ={" "}
                    <span className="font-bold text-blue-600">{simCalculatedVolume} Liter</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Simulator Result Card */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Hasil Kalkulasi Volume & Rekomendasi Katalog Terdekat
              </h4>

              <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-center space-y-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Estimasi Kapasitas Wadah
                </span>
                <div className="text-5xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight">
                  {simCalculatedVolume} <span className="text-2xl font-bold text-emerald-600">Liter</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Dihitung otomatis dari dimensi fisik aktual {simShape === "tabung" ? `Ø ${simDiameter} cm × t ${simTinggiTabung} cm` : `${simPanjang} × ${simLebar} × ${simTinggiKotak} cm`}.
                </p>
              </div>

              {simClosestPreset && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Preset Terdekat di Katalog:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      Selisih: &plusmn;{simClosestPreset.diff} L
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={simClosestPreset.preset.imageUrl}
                      alt={simClosestPreset.preset.nama}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {simClosestPreset.preset.nama} ({simClosestPreset.preset.kapasitas} Liter)
                      </p>
                      <p className="text-xs font-mono text-slate-400">
                        ID: {simClosestPreset.preset.id} &bull; Ukuran {simClosestPreset.preset.ukuranLabel}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                    Warga dapat langsung memilih acuan <strong>"{simClosestPreset.preset.nama}"</strong> pada aplikasi mobile untuk kalibrasi instan.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Catatan Standar Indonesia:</strong> Kapasitas 10-20 Liter umumnya digunakan untuk indoor kamar/dapur, 40 Liter untuk depan pagar rumah warga, dan 60-100 Liter untuk titik komunal RT/RW.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH / EDIT TEMPAT SAMPAH */}
      {/* ========================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  {formMode === "create" ? <Plus size={18} /> : <Edit3 size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {formMode === "create" ? "Tambah Jenis Tempat Sampah Baru" : "Edit Spesifikasi Tempat Sampah"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Lengkapi foto nyata, dimensi panjang/lebar/tinggi, dan informasi spesifikasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Nama Tempat Sampah */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Nama / Label Tempat Sampah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tong Drum Komunal RT 04, Tempat Sampah Injak Toilet..."
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Bentuk & Kategori Ukuran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Bentuk Fisik <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormBentuk("tabung")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold border transition cursor-pointer ${
                        formBentuk === "tabung"
                          ? "bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Cylinder size={14} />
                      <span>Tabung (Silinder)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormBentuk("kotak")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold border transition cursor-pointer ${
                        formBentuk === "kotak"
                          ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Box size={14} />
                      <span>Kotak (Balok)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Kategori Ukuran
                  </label>
                  <select
                    value={formUkuranLabel}
                    onChange={(e) => setFormUkuranLabel(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Kecil">Kecil (Kamar / Toilet)</option>
                    <option value="Sedang">Sedang (Dapur / Teras)</option>
                    <option value="Besar">Besar (Depan Rumah / Fasum)</option>
                    <option value="Jumbo">Jumbo (Komunal RT/RW)</option>
                    <option value="Kustom">Kustom / Non-Standar</option>
                  </select>
                </div>
              </div>

              {/* Dimensi Fisik (Panjang, Lebar, Tinggi atau Diameter, Tinggi) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Ruler size={14} className="text-emerald-600" />
                    Input Dimensi Fisik (Satuan: Sentimeter / cm)
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500">
                    <input
                      type="checkbox"
                      checked={formAutoCalculate}
                      onChange={(e) => setFormAutoCalculate(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <span>Hitung Otomatis Kapasitas</span>
                  </label>
                </div>

                {formBentuk === "tabung" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Diameter Alas (cm) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        required
                        value={formDiameter}
                        onChange={(e) => setFormDiameter(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Tinggi Tabung (cm) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        required
                        value={formTinggi}
                        onChange={(e) => setFormTinggi(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Panjang (cm) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        required
                        value={formPanjang}
                        onChange={(e) => setFormPanjang(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Lebar (cm) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        required
                        value={formLebar}
                        onChange={(e) => setFormLebar(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Tinggi (cm) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        required
                        value={formTinggi}
                        onChange={(e) => setFormTinggi(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                {/* Kapasitas Liter Hasil Kalkulasi */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Kapasitas Terhitung:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      value={formKapasitas}
                      onChange={(e) => {
                        setFormAutoCalculate(false);
                        setFormKapasitas(Number(e.target.value));
                      }}
                      className="w-24 px-2.5 py-1 text-right font-black text-sm bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-600 dark:text-emerald-400 font-mono"
                    />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Liter</span>
                  </div>
                </div>
              </div>

              {/* PILIHAN FOTO REAL TEMPAT SAMPAH */}
              <div className="space-y-3">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Foto Real Tempat Sampah Indonesia <span className="text-rose-500">*</span>
                </label>

                {/* Sub Tab Pemilihan Foto */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setFormImageSourceTab("gallery")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      formImageSourceTab === "gallery"
                        ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Galeri Bawaan Indonesia
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormImageSourceTab("upload")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      formImageSourceTab === "upload"
                        ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Upload File Gambar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormImageSourceTab("url")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      formImageSourceTab === "url"
                        ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Tautan URL Foto
                  </button>
                </div>

                {/* Content Sub Tab Galeri */}
                {formImageSourceTab === "gallery" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {INDONESIAN_BIN_PHOTO_PRESETS.map((preset) => {
                      const isSelected = formImageUrl === preset.url;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => setFormImageUrl(preset.url)}
                          className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                            isSelected
                              ? "border-emerald-500 ring-2 ring-emerald-500/20"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="w-full h-20 object-cover"
                          />
                          <div className="p-1 bg-white dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {preset.title}
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check size={12} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Content Sub Tab Upload File */}
                {formImageSourceTab === "upload" && (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Upload size={18} />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        Pilih File Foto
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Format JPG, PNG, atau WebP (Maks. 2 MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Content Sub Tab URL */}
                {formImageSourceTab === "url" && (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                )}

                {/* Preview Gambar Terpilih */}
                {formImageUrl && (
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Preview Foto Terpilih
                      </span>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {formImageUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Material & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Material Wadah
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Plastik HDPE, Stainless Steel, Ember Daur Ulang..."
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Rekomendasi Lokasi Penggunaan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dapur, Balai RW, Depan Pagar..."
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Deskripsi & Karakteristik
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas mengenai tempat sampah ini..."
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition cursor-pointer shadow-sm"
                >
                  {formMode === "create" ? "Simpan Model Baru" : "Perbarui Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETAIL SPESIFIKASI TEMPAT SAMPAH */}
      {/* ========================================================= */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Image Hero */}
            <div className="relative h-64 bg-slate-900 overflow-hidden">
              <img
                src={detailModalItem.imageUrl}
                alt={detailModalItem.nama}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

              <button
                onClick={() => setDetailModalItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition"
              >
                <X size={16} />
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                    detailModalItem.bentuk === "tabung" ? "bg-teal-500" : "bg-blue-600"
                  }`}
                >
                  {detailModalItem.bentuk === "tabung" ? <Cylinder size={11} /> : <Box size={11} />}
                  Bentuk {detailModalItem.bentuk === "tabung" ? "Tabung (Silinder)" : "Kotak (Balok)"}
                </span>
                <h3 className="text-xl font-black">{detailModalItem.nama}</h3>
                <span className="font-mono text-xs opacity-75">{detailModalItem.id}</span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Grid Dimensi Rinci */}
              <div>
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Ruler size={14} className="text-emerald-600" />
                  Rincian Dimensi Fisik Tempat Sampah
                </h4>

                {detailModalItem.bentuk === "tabung" ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Diameter (Ø)</span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100">
                        {detailModalItem.diameter} cm
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Tinggi (t)</span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100">
                        {detailModalItem.tinggi} cm
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold">
                        Kapasitas
                      </span>
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                        {detailModalItem.kapasitas} L
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-semibold">Panjang (p)</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {detailModalItem.panjang} cm
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-semibold">Lebar (l)</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {detailModalItem.lebar} cm
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block font-semibold">Tinggi (t)</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {detailModalItem.tinggi} cm
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                      <span className="text-[9px] text-blue-700 dark:text-blue-300 block font-semibold">
                        Kapasitas
                      </span>
                      <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                        {detailModalItem.kapasitas} L
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Material & Area */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Material Wadah:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-right">
                    {detailModalItem.material}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Lokasi Penempatan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-right">
                    {detailModalItem.lokasiUmum}
                  </span>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Karakteristik & Penggunaan di Indonesia:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {detailModalItem.deskripsi}
                </p>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleCopyJson(detailModalItem, detailModalItem.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition cursor-pointer"
                >
                  {copiedId === detailModalItem.id ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-emerald-600">Spesifikasi Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Salin JSON Spesifikasi</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const item = detailModalItem;
                      setDetailModalItem(null);
                      handleOpenEditModal(item);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold transition"
                  >
                    Edit Data
                  </button>
                  <button
                    onClick={() => setDetailModalItem(null)}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KONFIRMASI HAPUS TEMPAT SAMPAH */}
      {/* ========================================================= */}
      {deleteTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Hapus Jenis Tempat Sampah?
              </h3>
              <p className="text-xs text-slate-500">
                Model <strong>"{deleteTargetItem.nama}"</strong> ({deleteTargetItem.id}) akan dihapus dari katalog master sistem.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetItem(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold hover:bg-slate-100 transition text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black transition text-xs shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterPresetTempatSampahPage;
