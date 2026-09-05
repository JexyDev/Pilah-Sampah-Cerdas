/**
 * Project: BERSEKA - Landing Page CMS (Content Management System)
 * Allows Admin (SUPER_USER & DEVELOPER) to customize every section of the public Landing Page:
 * - Pasar Berseka (Products, Pricing, Points, Stock, Images)
 * - Hero Carousel Slides (Images, Badges, Titles, Metrics)
 * - Program Aksi & Inisiatif (Campaigns, Targets, Units, Progress)
 * - Berita & Cerita Lapangan (News Articles, Authors, Summaries)
 * - Ticker Aktivitas & FAQ
 * Features seamless Dual Storage (API + LocalStorage Instant Live Sync) and Drag & Drop Image Upload
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Calendar,
  MapPin,
  Download,
  AlertCircle,
  Save,
  RefreshCw,
  Image as ImageIcon,
  ShoppingBag,
  Layers,
  Newspaper,
  MessageSquare,
  HelpCircle,
  Eye,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Award,
  Tag,
  Clock,
  X,
  ShieldCheck,
  TrendingUp,
  FileText,
  UploadCloud,
  FolderOpen,
  Link2,
  Camera,
  Check,
  Search,
  BookOpen,
  Filter,
  RotateCcw,
  Building2,
  Users
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import {
  loadCmsContent,
  saveCmsContent,
  resetCmsContent,
  DEFAULT_CMS_CONTENT,
  type HeroSlideItem,
  type MarketProductItem,
  type ActionCampaignItem,
  type NewsArticleItem,
  type LiveLogItem,
  type FaqItem,
  type LandingContentPayload,
} from "../../utils/cmsStorage";

// ── Shared Preset Images ──────────────────────────────────────────────────────
const PRESET_GALLERY_IMAGES = [
  { label: "Pemilahan & Daur Ulang", url: "/image/kkn-hero-sorting.webp", desc: "Aksi pemilahan sampah KKN" },
  { label: "Biokonversi Maggot & Kompos", url: "/image/activity-2.webp", desc: "Budidaya maggot BSF & kasgot" },
  { label: "Bank Sampah & Sosialisasi", url: "/image/activity-1.webp", desc: "Sosialisasi penimbangan warga" },
  { label: "Aksi Bersih Lingkungan", url: "/image/activity-3.webp", desc: "Pelatihan eco-enzyme & POC" },
  { label: "Komunitas & Inovasi", url: "/image/landingpage.webp", desc: "Kerjasama KKN UNIKOM" },
];

// ── Reusable Image Upload & Picker Component ──────────────────────────────────
interface ImageUploadPickerProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
}

const ImageUploadPicker: React.FC<ImageUploadPickerProps> = ({
  label = "Foto / Gambar",
  value,
  onChange,
  helperText = "Format: PNG, JPG, JPEG, atau WebP (Maks. 10MB, otomatis dikompresi)"
}) => {
  const [sourceMode, setSourceMode] = useState<"upload" | "preset" | "url">("upload");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to clean base64 DataURL
  const processAndSetFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast.error("File yang dipilih harus berupa gambar (JPG/PNG/WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Ukuran file terlalu besar (Maksimal 10MB)");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/webp", 0.85);
          onChange(compressedDataUrl);
          showToast.success("Foto berhasil diunggah!");
        } else {
          onChange(event.target?.result as string);
        }
        setUploading(false);
      };
      img.onerror = () => {
        onChange(event.target?.result as string);
        setUploading(false);
      };
    };
    reader.onerror = () => {
      showToast.error("Gagal membaca file gambar.");
      setUploading(false);
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndSetFile(file);
    }
  };

  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <label className="block font-extrabold text-slate-700 text-xs">{label} *</label>
        
        {/* Source Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-extrabold">
          <button
            type="button"
            onClick={() => setSourceMode("upload")}
            className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              sourceMode === "upload" ? "bg-white text-[#005841] shadow-2xs font-black" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UploadCloud size={12} />
            <span>Unggah Foto</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceMode("preset")}
            className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              sourceMode === "preset" ? "bg-white text-[#005841] shadow-2xs font-black" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderOpen size={12} />
            <span>Galeri Preset</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceMode("url")}
            className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              sourceMode === "url" ? "bg-white text-[#005841] shadow-2xs font-black" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Link2 size={12} />
            <span>URL</span>
          </button>
        </div>
      </div>

      {/* ── MODE 1: FILE UPLOAD (DRAG & DROP) ── */}
      {sourceMode === "upload" && (
        <div className="space-y-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {value ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group h-44 flex items-center justify-center">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Camera size={14} />
                  <span>Ganti Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>
              </div>
              <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                ✓ Foto Siap Digunakan
              </span>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? "border-[#005841] bg-emerald-50/60 scale-[1.01]"
                  : "border-slate-300 hover:border-[#005841] bg-slate-50/60 hover:bg-emerald-50/30"
              }`}
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-[#005841] flex items-center justify-center shadow-xs">
                {uploading ? (
                  <RefreshCw size={20} className="animate-spin text-emerald-700" />
                ) : (
                  <UploadCloud size={22} />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-slate-800">
                  {uploading ? "Memproses gambar..." : "Klik atau seret foto ke sini untuk mengunggah"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  {helperText}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: PRESET GALLERY ── */}
      {sourceMode === "preset" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_GALLERY_IMAGES.map((preset, pIdx) => {
              const isSelected = value === preset.url;
              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className={`relative rounded-xl overflow-hidden border p-1 text-left transition cursor-pointer flex flex-col ${
                    isSelected
                      ? "border-[#005841] ring-2 ring-[#005841]/30 bg-emerald-50/60"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="relative h-20 w-full rounded-lg overflow-hidden bg-slate-800">
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#005841] text-white flex items-center justify-center shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-800 pt-1.5 px-0.5 truncate block">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODE 3: DIRECT URL INPUT ── */}
      {sourceMode === "url" && (
        <div className="space-y-2">
          <div className="relative">
            <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://... atau /image/nama-file.webp"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-semibold text-xs focus:outline-none focus:border-[#005841]"
            />
          </div>
          {value && (
            <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
              <img
                src={value}
                alt="Preview URL"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────

export const KurasiLandingPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = true; // Enabled for testing and Super Admin access

  // Tab State
  const [activeTab, setActiveTab] = useState<"pasar" | "hero" | "campaign" | "news" | "ticker_faq">("pasar");

  // Main CMS Data State
  const [content, setContent] = useState<LandingContentPayload>(DEFAULT_CMS_CONTENT);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Modals State
  const [modalType, setModalType] = useState<"product" | "slide" | "campaign" | "news" | "faq" | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{
    tab: string;
    index: number;
    title: string;
  } | null>(null);

  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // Form states for modals
  const [productForm, setProductForm] = useState<MarketProductItem>({
    id: "",
    title: "",
    category: "pupuk",
    categoryLabel: "Pupuk & Kompos",
    categoryColor: "bg-emerald-100 text-emerald-800",
    initiator: "",
    priceIdr: 15000,
    pricePoints: 150,
    stock: 50,
    unit: "Pack",
    rating: 5.0,
    soldCount: 0,
    imageUrl: "/image/activity-2.webp",
    description: "",
    benefits: [""],
    isPublished: true,
  });

  const [slideForm, setSlideForm] = useState<HeroSlideItem>({
    id: "",
    image: "/image/kkn-hero-sorting.webp",
    badge: "Gerakan Kolaboratif",
    title: "",
    location: "Kecamatan Bojongsoang, Kab. Bandung",
    metric: "100+ KK Terbina",
    highlight: "100% Berbasis QR Code",
    isPublished: true,
  });

  const [campaignForm, setCampaignForm] = useState<ActionCampaignItem>({
    id: "",
    title: "",
    category: "organic",
    categoryLabel: "Organik & Maggot",
    categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    initiator: "",
    initiatorBadge: "Terverifikasi KKN",
    location: "Kecamatan Bojongsoang",
    imageUrl: "/image/activity-2.webp",
    currentAmount: 0,
    targetAmount: 500,
    unit: "kg",
    daysRemaining: 14,
    participantsCount: 20,
    description: "",
    impactHighlight: "",
    isPublished: true,
  });

  const [newsForm, setNewsForm] = useState<NewsArticleItem>({
    id: "",
    title: "",
    category: "Inovasi & KKN",
    date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    readTime: "3 min baca",
    location: "Kecamatan Bojongsoang",
    imageUrl: "/image/activity-1.webp",
    summary: "",
    content: "",
    author: "Tim Humas KKN UNIKOM",
    isPublished: true,
  });

  const [faqForm, setFaqForm] = useState<FaqItem>({
    q: "",
    a: "",
  });

  // ── Universal Import Sources State (Strict by ID per Kategori) ───────────────
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importTargetCategory, setImportTargetCategory] = useState<"campaign" | "news" | "hero" | "pasar">("campaign");
  const [importSourceType, setImportSourceType] = useState<"logbook" | "proker">("proker");
  const [logbookSources, setLogbookSources] = useState<any[]>([]);
  const [prokerSources, setProkerSources] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState<boolean>(false);
  const [importSearchTerm, setImportSearchTerm] = useState<string>("");
  const [importFilterKelompok, setImportFilterKelompok] = useState<string>("");
  const [importFilterKelurahan, setImportFilterKelurahan] = useState<string>("");
  const [importFilterKategori, setImportFilterKategori] = useState<string>("");
  const [importPage, setImportPage] = useState<number>(1);
  const importPageSize = 8;

  const getSafeImageUrl = (url?: string | null, fallback = "/image/activity-1.webp"): string => {
    if (!url || typeof url !== "string" || !url.trim()) return fallback;
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.startsWith("data:")) {
      return trimmed;
    }
    return `/${trimmed}`;
  };

  const fetchImportSources = async () => {
    setLoadingSources(true);
    try {
      const [logbooksRes, prokersRes] = await Promise.allSettled([
        api.get("/system/landing-curated/logbook-sources"),
        api.get("/system/landing-curated/proker-sources")
      ]);
      
      if (logbooksRes.status === "fulfilled" && logbooksRes.value.data?.success) {
        const rawData = logbooksRes.value.data.data;
        setLogbookSources(Array.isArray(rawData) ? rawData : []);
      }
      if (prokersRes.status === "fulfilled" && prokersRes.value.data?.success) {
        const rawData = prokersRes.value.data.data;
        setProkerSources(Array.isArray(rawData) ? rawData : []);
      }
    } catch (err) {
      console.error("Failed to fetch logbook/proker sources:", err);
    } finally {
      setLoadingSources(false);
    }
  };

  // Distinct list of Kelurahan from both logbooks and prokers
  const availableKelurahanList = useMemo(() => {
    const set = new Set<string>();
    logbookSources.forEach((l) => { if (l.kelurahan) set.add(l.kelurahan.trim()); });
    prokerSources.forEach((p) => { if (p.kelurahan) set.add(p.kelurahan.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [logbookSources, prokerSources]);

  // Distinct list of Kelompok KKN with counts
  const availableKelompokList = useMemo(() => {
    const map = new Map<string, { id: string; nama: string; kelurahan?: string; logbookCount: number; prokerCount: number }>();
    
    logbookSources.forEach((l) => {
      const key = l.kelompokNama || l.kelompokId || "Kelompok";
      if (!map.has(key)) {
        map.set(key, { id: String(l.kelompokId || key), nama: l.kelompokNama || `Kelompok (${key})`, kelurahan: l.kelurahan, logbookCount: 0, prokerCount: 0 });
      }
      map.get(key)!.logbookCount++;
    });

    prokerSources.forEach((p) => {
      const key = p.kelompokNama || p.kelompokId || "Kelompok";
      if (!map.has(key)) {
        map.set(key, { id: String(p.kelompokId || key), nama: p.kelompokNama || `Kelompok (${key})`, kelurahan: p.kelurahan, logbookCount: 0, prokerCount: 0 });
      }
      map.get(key)!.prokerCount++;
    });

    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama, "id", { numeric: true }));
  }, [logbookSources, prokerSources]);

  // Distinct list of Proker Categories
  const availableProkerCategories = useMemo(() => {
    const set = new Set<string>();
    prokerSources.forEach((p) => { if (p.kategori) set.add(p.kategori.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [prokerSources]);

  // Reset pagination to page 1 whenever any filter or search changes
  useEffect(() => {
    setImportPage(1);
  }, [importSourceType, importFilterKelompok, importFilterKelurahan, importFilterKategori, importSearchTerm]);

  // Filtered source items
  const filteredImportItems = useMemo(() => {
    const items = importSourceType === "logbook" ? logbookSources : prokerSources;
    return items.filter((item) => {
      // 1. Filter Kelurahan
      if (importFilterKelurahan) {
        const itemKelurahan = (item.kelurahan || "").toLowerCase();
        if (!itemKelurahan.includes(importFilterKelurahan.toLowerCase())) return false;
      }

      // 2. Filter Kelompok KKN
      if (importFilterKelompok) {
        const matchId = String(item.kelompokId || "") === importFilterKelompok;
        const matchNama = (item.kelompokNama || "") === importFilterKelompok;
        if (!matchId && !matchNama) return false;
      }

      // 3. Filter Kategori / Khusus
      if (importFilterKategori) {
        if (importSourceType === "proker") {
          if ((item.kategori || "").toLowerCase() !== importFilterKategori.toLowerCase()) return false;
        } else {
          // Logbook filter
          if (importFilterKategori === "with_photo") {
            if (!item.fotoBuktiUrl || typeof item.fotoBuktiUrl !== "string" || item.fotoBuktiUrl.trim().length < 4) return false;
          } else if (importFilterKategori === "pemanfaatan") {
            const txt = `${item.deskripsi || ""} ${item.tempat || ""}`.toLowerCase();
            if (!txt.includes("pemanfaatan") && !txt.includes("kompos") && !txt.includes("maggot") && !txt.includes("loseda") && !txt.includes("bata terawang") && !txt.includes("press")) return false;
          }
        }
      }

      // 4. Search query
      if (importSearchTerm.trim()) {
        const q = importSearchTerm.toLowerCase();
        const deskripsi = (item.deskripsi || "").toLowerCase();
        const tempat = (item.tempat || item.logbookTempat || "").toLowerCase();
        const kelompokNama = (item.kelompokNama || "").toLowerCase();
        const penulisNama = (item.penulisNama || "").toLowerCase();
        const kelurahan = (item.kelurahan || "").toLowerCase();
        const kategori = (item.kategori || item.prokerKategori || "").toLowerCase();
        const idStr = String(item.id || "").toLowerCase();

        return (
          deskripsi.includes(q) ||
          tempat.includes(q) ||
          kelompokNama.includes(q) ||
          penulisNama.includes(q) ||
          kelurahan.includes(q) ||
          kategori.includes(q) ||
          idStr.includes(q)
        );
      }

      return true;
    });
  }, [importSourceType, logbookSources, prokerSources, importFilterKelompok, importFilterKelurahan, importFilterKategori, importSearchTerm]);

  // Paginated list
  const totalImportPages = Math.max(1, Math.ceil(filteredImportItems.length / importPageSize));
  const paginatedImportItems = useMemo(() => {
    const start = (importPage - 1) * importPageSize;
    return filteredImportItems.slice(start, start + importPageSize);
  }, [filteredImportItems, importPage, importPageSize]);

  const hasActiveImportFilters = Boolean(
    importFilterKelompok || importFilterKelurahan || importFilterKategori || importSearchTerm.trim()
  );

  const handleResetImportFilters = () => {
    setImportFilterKelompok("");
    setImportFilterKelurahan("");
    setImportFilterKategori("");
    setImportSearchTerm("");
    setImportPage(1);
  };

  const handleOpenImportModal = (targetCategory?: "campaign" | "news" | "hero" | "pasar") => {
    const target = targetCategory || (activeTab === "campaign" ? "campaign" : activeTab === "news" ? "news" : activeTab === "hero" ? "hero" : activeTab === "pasar" ? "pasar" : "campaign");
    setImportTargetCategory(target);
    setShowImportModal(true);
    setImportSearchTerm("");
    setImportFilterKelompok("");
    setImportFilterKelurahan("");
    setImportFilterKategori("");
    setImportPage(1);
    if (target === "news") {
      setImportSourceType("logbook");
    } else {
      setImportSourceType("proker");
    }
    if (logbookSources.length === 0 && prokerSources.length === 0) {
      fetchImportSources();
    }
  };

  // Alias for backward compatibility
  const handleOpenImportNews = () => handleOpenImportModal("news");

  // Helper mapping category for campaigns
  const mapProkerToCampaignCategory = (rawCat?: string, desc?: string): { category: "organic" | "recycle" | "kkn" | "education"; categoryLabel: string; categoryColor: string } => {
    const text = `${rawCat || ""} ${desc || ""}`.toLowerCase();
    if (text.includes("organik") || text.includes("kompos") || text.includes("maggot") || text.includes("pupuk") || text.includes("poc")) {
      return { category: "organic", categoryLabel: "Organik & Maggot", categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    }
    if (text.includes("bank sampah") || text.includes("anorganik") || text.includes("daur ulang") || text.includes("plastik") || text.includes("jelantah")) {
      return { category: "recycle", categoryLabel: "Bank Sampah & Daur Ulang", categoryColor: "bg-blue-100 text-blue-800 border-blue-200" };
    }
    if (text.includes("edukasi") || text.includes("sosialisasi") || text.includes("sekolah") || text.includes("pelatihan") || text.includes("bimbingan")) {
      return { category: "education", categoryLabel: "Edukasi Pemilahan", categoryColor: "bg-amber-100 text-amber-800 border-amber-200" };
    }
    return { category: "kkn", categoryLabel: "Inisiatif KKN", categoryColor: "bg-purple-100 text-purple-800 border-purple-200" };
  };

  const handleSelectImportItem = (item: any, type: "logbook" | "proker", overrideTarget?: "campaign" | "news" | "hero" | "pasar") => {
    const target = overrideTarget || importTargetCategory;
    const sourceId = String(item.id);
    const kelompokNama = item.kelompokNama || null;
    const kelompokId = item.kelompokId || null;
    const prokerId = type === "proker" ? sourceId : (item.prokerId ? String(item.prokerId) : null);
    const logbookId = type === "logbook" ? sourceId : null;

    if (target === "campaign") {
      // ── MAPPING KE PROGRAM AKSI (CAMPAIGN) ──
      if (type === "proker") {
        const lines = (item.deskripsi || "").split("\n").map((l: string) => l.trim().replace(/\*\*/g, "").replace(/^#+\s*/, "")).filter(Boolean);
        let derivedTitle = lines[0] || "Program Aksi KKN";
        if (derivedTitle.length > 75) derivedTitle = derivedTitle.slice(0, 72) + "...";
        const catConfig = mapProkerToCampaignCategory(item.kategori, item.deskripsi);

        setCampaignForm({
          id: `camp-proker-${sourceId}`,
          title: derivedTitle,
          category: catConfig.category,
          categoryLabel: catConfig.categoryLabel,
          categoryColor: catConfig.categoryColor,
          initiator: kelompokNama || "Kelompok KKN UNIKOM",
          initiatorBadge: item.status === "DISETUJUI" || item.status === "SELESAI" ? "Terverifikasi KKN" : "Inisiatif Mahasiswa",
          location: item.kelurahan ? `Kelurahan ${item.kelurahan}, Kec. Coblong` : "Kecamatan Coblong, Kota Bandung",
          imageUrl: getSafeImageUrl(item.fotoBuktiUrl, "/image/activity-2.webp"),
          currentAmount: 0,
          targetAmount: item.kategori === "ORGANIK" ? 500 : 300,
          unit: item.kategori === "ORGANIK" ? "kg" : "Aksi",
          daysRemaining: 14,
          participantsCount: 25,
          description: lines.slice(1).join("\n") || item.deskripsi || "Program kerja KKN tematik pengelolaan lingkungan bersama warga.",
          impactHighlight: `Inisiatif program ${item.kategori || "KKN"} oleh ${kelompokNama || "Mahasiswa KKN"} bersama warga setempat.`,
          isPublished: true,
          sourceType: "proker",
          sourceId,
          prokerId,
          logbookId: null,
          kelompokId,
          kelompokNama,
          isStrictRelation: true,
        });
      } else {
        // From logbook
        const firstLine = (item.deskripsi || "").split("\n")[0].trim().replace(/\*\*/g, "");
        const derivedTitle = item.prokerDeskripsi ? `${item.prokerDeskripsi.slice(0, 60)} (${kelompokNama || "KKN"})` : (firstLine.slice(0, 75) || "Aksi Lapangan KKN");
        const catConfig = mapProkerToCampaignCategory(item.prokerKategori, item.deskripsi);

        setCampaignForm({
          id: `camp-logbook-${sourceId}`,
          title: derivedTitle,
          category: catConfig.category,
          categoryLabel: catConfig.categoryLabel,
          categoryColor: catConfig.categoryColor,
          initiator: kelompokNama || item.penulisNama || "Mahasiswa KKN",
          initiatorBadge: "Aksi Terverifikasi",
          location: item.tempat ? `${item.tempat}, Kel. ${item.kelurahan || "Coblong"}` : (item.kelurahan ? `Kel. ${item.kelurahan}, Coblong` : "Kecamatan Coblong"),
          imageUrl: getSafeImageUrl(item.fotoBuktiUrl, "/image/activity-1.webp"),
          currentAmount: 0,
          targetAmount: 350,
          unit: "kg",
          daysRemaining: 14,
          participantsCount: 20,
          description: item.deskripsi || "Dokumentasi kegiatan lapangan aksi lingkungan KKN.",
          impactHighlight: `Kegiatan lapangan di ${item.tempat || "Coblong"} oleh ${kelompokNama || "Mahasiswa KKN"}.`,
          isPublished: true,
          sourceType: "logbook",
          sourceId,
          logbookId,
          prokerId,
          kelompokId,
          kelompokNama,
          isStrictRelation: true,
        });
      }

      setEditingIndex(null);
      setShowImportModal(false);
      setModalType("campaign");
      showToast.success(`Data ${type === "proker" ? "Program Kerja" : "Logbook"} #${sourceId.slice(0, 8)} berhasil ditarik ke Program Aksi dengan relasi Strict ID!`);

    } else if (target === "news") {
      // ── MAPPING KE BERITA & ARTIKEL ──
      if (type === "logbook") {
        let derivedTitle = "";
        if (item.tempat) {
          derivedTitle = `Aktivitas KKN: ${item.tempat} - ${item.prokerKategori || "Aksi Lingkungan"}`;
        } else {
          derivedTitle = `Aksi Lapangan ${kelompokNama || "Mahasiswa KKN"}`;
        }
        const firstLine = (item.deskripsi || "").split("\n")[0].trim().replace(/\*\*/g, "");
        if (firstLine.length > 10 && firstLine.length <= 80) {
          derivedTitle = firstLine;
        }

        const dateStr = item.tanggalKegiatan
          ? new Date(item.tanggalKegiatan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
          : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

        const summaryText = (item.deskripsi || "").slice(0, 140) + ((item.deskripsi || "").length > 140 ? "..." : "");

        setNewsForm({
          id: `news-logbook-${sourceId}`,
          title: derivedTitle,
          category: item.prokerKategori || "Logbook KKN",
          date: dateStr,
          readTime: "3 min baca",
          location: item.kelurahan ? `Kel. ${item.kelurahan}, Bojongsoang` : (item.tempat || "Kecamatan Bojongsoang"),
          imageUrl: getSafeImageUrl(item.fotoBuktiUrl, "/image/activity-1.webp"),
          summary: summaryText,
          content: `${item.deskripsi || ""}\n\nLokasi: ${item.tempat || "-"}\nKelompok: ${kelompokNama || "-"}\nPenulis: ${item.penulisNama || "-"}`,
          author: item.penulisNama ? `${item.penulisNama} (${kelompokNama || "KKN"})` : (kelompokNama || "Tim KKN UNIKOM"),
          isPublished: true,
          sourceType: "logbook",
          sourceId,
          logbookId,
          prokerId,
          kelompokId,
          kelompokNama,
          isStrictRelation: true,
        });
      } else {
        const dateStr = item.waktuPelaksanaan
          ? new Date(item.waktuPelaksanaan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
          : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

        const cleanTitle = (item.deskripsi || "").split("\n")[0].replace(/\*\*/g, "").slice(0, 65);

        setNewsForm({
          id: `news-proker-${sourceId}`,
          title: `Program Inovasi: ${cleanTitle}`,
          category: item.kategori ? `Proker ${item.kategori}` : "Inisiatif KKN",
          date: dateStr,
          readTime: "3 min baca",
          location: item.kelurahan ? `Kel. ${item.kelurahan}, Bojongsoang` : "Kecamatan Bojongsoang",
          imageUrl: getSafeImageUrl(item.fotoBuktiUrl, "/image/activity-2.webp"),
          summary: (item.deskripsi || "").slice(0, 140) + ((item.deskripsi || "").length > 140 ? "..." : ""),
          content: `${item.deskripsi || ""}\n\nKategori Program: ${item.kategori || "-"}\nKelompok: ${kelompokNama || "-"}\nWilayah: Kel. ${item.kelurahan || "Coblong"}`,
          author: kelompokNama || "Tim Program Kerja KKN",
          isPublished: true,
          sourceType: "proker",
          sourceId,
          prokerId,
          logbookId: null,
          kelompokId,
          kelompokNama,
          isStrictRelation: true,
        });
      }

      setEditingIndex(null);
      setShowImportModal(false);
      setModalType("news");
      showToast.success(`Data ${type === "proker" ? "Program Kerja" : "Logbook"} #${sourceId.slice(0, 8)} berhasil ditarik ke Berita dengan relasi Strict ID!`);

    } else if (target === "hero") {
      // ── MAPPING KE HERO CAROUSEL ──
      if (type === "proker") {
        const firstLine = (item.deskripsi || "").split("\n")[0].replace(/\*\*/g, "").slice(0, 80);
        setSlideForm({
          id: `slide-proker-${sourceId}`,
          image: getSafeImageUrl(item.fotoBuktiUrl, "/image/kkn-hero-sorting.webp"),
          badge: item.kategori ? `Proker ${item.kategori}` : "Inisiatif Kolaboratif",
          title: firstLine || "Aksi Inovasi Lingkungan KKN BERSEKA",
          location: item.kelurahan ? `Kelurahan ${item.kelurahan}, Kec. Coblong` : "Kecamatan Coblong, Bandung",
          metric: `${kelompokNama || "Kelompok KKN"} Terlibat`,
          highlight: "Program Kerja Resmi KKN",
          isPublished: true,
          sourceType: "proker",
          sourceId,
          prokerId,
          logbookId: null,
          kelompokId,
          kelompokNama,
          isStrictRelation: true,
        });
      } else {
        const firstLine = (item.deskripsi || "").split("\n")[0].replace(/\*\*/g, "").slice(0, 80);
        setSlideForm({
          id: `slide-logbook-${sourceId}`,
          image: getSafeImageUrl(item.fotoBuktiUrl, "/image/activity-1.webp"),
          badge: "Aksi Lapangan KKN",
          title: firstLine || "Dokumentasi Aksi Lapangan Mahasiswa KKN",
          location: item.tempat ? `${item.tempat}, Kel. ${item.kelurahan || "Coblong"}` : (item.kelurahan ? `Kel. ${item.kelurahan}, Coblong` : "Kecamatan Coblong"),
          metric: `Aksi ${kelompokNama || "Mahasiswa KKN"}`,
          highlight: "Foto Bukti Terverifikasi Lapangan",
          isPublished: true,
          sourceType: "logbook",
          sourceId,
          logbookId,
          prokerId,
          kelompokId,
          kelompokNama,
          isStrictRelation: true,
        });
      }

      setEditingIndex(null);
      setShowImportModal(false);
      setModalType("slide");
      showToast.success(`Data ${type === "proker" ? "Program Kerja" : "Logbook"} #${sourceId.slice(0, 8)} berhasil ditarik ke Hero Carousel dengan relasi Strict ID!`);

    } else if (target === "pasar") {
      // ── MAPPING KE PASAR BERSEKA ──
      const firstLine = (item.deskripsi || "").split("\n")[0].replace(/\*\*/g, "").slice(0, 60);
      const textLower = `${item.kategori || ""} ${item.deskripsi || ""}`.toLowerCase();
      let prodCategory = "pupuk";
      let catLabel = "Pupuk & Kompos";
      let catColor = "bg-emerald-100 text-emerald-800";
      let price = 15000;
      let points = 150;
      let unit = "Pack (1 kg)";

      if (textLower.includes("eco-enzyme") || textLower.includes("enzyme")) {
        prodCategory = "ecoenzyme";
        catLabel = "Eco-Enzyme";
        catColor = "bg-amber-100 text-amber-800";
        price = 20000;
        points = 200;
        unit = "Botol (500 ml)";
      } else if (textLower.includes("maggot") || textLower.includes("kasgot")) {
        prodCategory = "pupuk";
        catLabel = "Biokonversi Maggot";
        catColor = "bg-emerald-100 text-emerald-800";
        price = 22000;
        points = 220;
        unit = "Pack (500g)";
      } else if (textLower.includes("kerajinan") || textLower.includes("plastik") || textLower.includes("daur ulang") || textLower.includes("lilin")) {
        prodCategory = "kerajinan";
        catLabel = "Daur Ulang Kreatif";
        catColor = "bg-purple-100 text-purple-800";
        price = 25000;
        points = 250;
        unit = "Pcs";
      } else if (textLower.includes("bibit") || textLower.includes("tanaman") || textLower.includes("sayur")) {
        prodCategory = "bibit";
        catLabel = "Bibit & Tanaman";
        catColor = "bg-green-100 text-green-800";
        price = 25000;
        points = 250;
        unit = "Paket Lengkap";
      }

      setProductForm({
        id: `prod-${type}-${sourceId}`,
        title: firstLine || "Produk Inovasi KKN BERSEKA",
        category: prodCategory,
        categoryLabel: catLabel,
        categoryColor: catColor,
        initiator: kelompokNama || "Mahasiswa KKN & Warga",
        priceIdr: price,
        pricePoints: points,
        stock: 40,
        unit,
        rating: 5.0,
        soldCount: 0,
        imageUrl: getSafeImageUrl(item.fotoBuktiUrl, "/image/activity-2.webp"),
        description: item.deskripsi || "Produk olahan dan pemanfaatan sampah ramah lingkungan karya mahasiswa KKN bersama warga.",
        benefits: ["100% Berbasis Sirkular Ekonomi Warga", "Mendukung pengurangan sampah di sumber", "Kualitas teruji dari aksi lapangan"],
        isPublished: true,
        sourceType: type,
        sourceId,
        prokerId,
        logbookId,
        kelompokId,
        kelompokNama,
        isStrictRelation: true,
      });

      setEditingIndex(null);
      setShowImportModal(false);
      setModalType("product");
      showToast.success(`Data ${type === "proker" ? "Program Kerja" : "Logbook"} #${sourceId.slice(0, 8)} berhasil ditarik ke Pasar Berseka dengan relasi Strict ID!`);
    }
  };

  // ── Auto-persist helper across IndexedDB + LocalStorage + API Sync ──────────
  const updateAndPersistContent = async (newContent: LandingContentPayload) => {
    const payload = {
      ...newContent,
      lastModified: Date.now(),
    };
    setContent(payload);
    setHasUnsavedChanges(true);
    // 1. Instant local persistence & BroadcastChannel notification
    await saveCmsContent(payload);
    // 2. Background sync with backend API
    try {
      await api.put("/system/landing-content", payload);
    } catch (e) {
      console.info("[KurasiLandingPage] Background API sync pending manual publish.");
    }
  };

  // ── Fetch Landing Page Content (IndexedDB + API Hybrid) ─────────────────────
  const fetchLandingContent = async () => {
    let localData = DEFAULT_CMS_CONTENT;
    let localTimestamp = 0;

    // 1. Try IndexedDB & LocalStorage first for instant persistent local data
    try {
      const localStored = await loadCmsContent();
      if (localStored?.data) {
        localData = localStored.data;
        localTimestamp = localStored.lastModified || 0;
        setContent(localData);
      }
    } catch (err) {
      console.warn("[KurasiLandingPage] Local load warning:", err);
    }

    // 2. Try API (if backend is reachable)
    try {
      const res = await api.get("/system/landing-content");
      if (res.data?.success && res.data?.data) {
        const serverData = res.data.data;
        const serverTimestamp = serverData.lastModified || 0;
        // Only override if server data is strictly newer than local modified time
        if (serverTimestamp > localTimestamp) {
          setContent(serverData);
          await saveCmsContent(serverData);
        } else if (localTimestamp > serverTimestamp) {
          // If local has newer edits, push to server
          try {
            await api.put("/system/landing-content", localData);
          } catch (e) {}
        }
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.info("[KurasiLandingPage] Operating with persistent local storage.");
    }
  };

  useEffect(() => {
    fetchLandingContent();
  }, []);

  // ── Save Landing Page Content ───────────────────────────────────────────────
  const handleSaveAll = async () => {
    setSaving(true);
    const updatedContent = {
      ...content,
      lastModified: Date.now(),
    };

    // 1. Save to IndexedDB (unlimited quota) + LocalStorage + Broadcast
    await saveCmsContent(updatedContent);

    // 2. Persist to API if server is online
    let serverSuccess = false;
    try {
      const res = await api.put("/system/landing-content", updatedContent);
      if (res.data?.success) serverSuccess = true;
    } catch (err: any) {
      console.info("[KurasiLandingPage] Persisted safely in persistent browser storage.");
    }

    setSaving(false);
    setHasUnsavedChanges(false);
    if (serverSuccess) {
      showToast.success("Konfigurasi Landing Page berhasil dipublikasikan & tersinkronisasi ke server!");
    } else {
      showToast.success("Konfigurasi Landing Page tersimpan lokal & aktif di Landing Page.");
    }
  };

  // ── Reset to Defaults ───────────────────────────────────────────────────────
  const handleResetToDefaults = async () => {
    setSaving(true);
    try {
      await resetCmsContent();
      setContent(DEFAULT_CMS_CONTENT);
      try {
        await api.post("/system/landing-content/reset");
      } catch (e) {}
      showToast.success("Konten Landing Page berhasil direset ke standar.");
      setHasUnsavedChanges(false);
    } catch (err) {
      showToast.error("Gagal mereset konten.");
    } finally {
      setSaving(false);
      setShowResetModal(false);
    }
  };

  // ── Modal Open Handlers ─────────────────────────────────────────────────────
  const handleOpenAddProduct = () => {
    setEditingIndex(null);
    setProductForm({
      id: `prod-${Date.now()}`,
      title: "",
      category: "pupuk",
      categoryLabel: "Pupuk & Kompos",
      categoryColor: "bg-emerald-100 text-emerald-800",
      initiator: "KKN Kelompok RW",
      priceIdr: 15000,
      pricePoints: 150,
      stock: 50,
      unit: "Pack",
      rating: 5.0,
      soldCount: 0,
      imageUrl: "/image/activity-2.webp",
      description: "",
      benefits: ["100% Organik ramah lingkungan", "Mendukung ekonomi sirkular warga"],
      isPublished: true,
    });
    setModalType("product");
  };

  const handleOpenEditProduct = (index: number) => {
    setEditingIndex(index);
    setProductForm({ ...content.marketProducts[index] });
    setModalType("product");
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title.trim()) {
      showToast.warning("Nama produk wajib diisi");
      return;
    }

    const updated = [...content.marketProducts];
    if (editingIndex !== null) {
      updated[editingIndex] = productForm;
    } else {
      updated.unshift(productForm);
    }

    updateAndPersistContent({ ...content, marketProducts: updated });
    setModalType(null);
    showToast.success(editingIndex !== null ? "Produk diperbarui di Landing Page" : "Produk ditambahkan ke Landing Page");
  };

  // ── Hero Slide Handlers ─────────────────────────────────────────────────────
  const handleOpenAddSlide = () => {
    setEditingIndex(null);
    setSlideForm({
      id: `slide-${Date.now()}`,
      image: "/image/kkn-hero-sorting.webp",
      badge: "Gerakan Kolaboratif",
      title: "",
      location: "Kecamatan Bojongsoang, Kab. Bandung",
      metric: "100+ KK Terbina",
      highlight: "100% Berbasis QR Code",
      isPublished: true,
    });
    setModalType("slide");
  };

  const handleOpenEditSlide = (index: number) => {
    setEditingIndex(index);
    setSlideForm({ ...content.heroSlides[index] });
    setModalType("slide");
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title.trim()) {
      showToast.warning("Judul slide wajib diisi");
      return;
    }

    const updated = [...content.heroSlides];
    if (editingIndex !== null) {
      updated[editingIndex] = slideForm;
    } else {
      updated.push(slideForm);
    }

    updateAndPersistContent({ ...content, heroSlides: updated });
    setModalType(null);
    showToast.success(editingIndex !== null ? "Slide diperbarui di Landing Page" : "Slide ditambahkan ke Landing Page");
  };

  // ── Campaign Handlers ───────────────────────────────────────────────────────
  const handleOpenAddCampaign = () => {
    setEditingIndex(null);
    setCampaignForm({
      id: `camp-${Date.now()}`,
      title: "",
      category: "organic",
      categoryLabel: "Organik & Maggot",
      categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      initiator: "Kelompok KKN UNIKOM",
      initiatorBadge: "Terverifikasi KKN",
      location: "Kecamatan Bojongsoang",
      imageUrl: "/image/activity-2.webp",
      currentAmount: 0,
      targetAmount: 500,
      unit: "kg",
      daysRemaining: 14,
      participantsCount: 20,
      description: "",
      impactHighlight: "",
      isPublished: true,
    });
    setModalType("campaign");
  };

  const handleOpenEditCampaign = (index: number) => {
    setEditingIndex(index);
    setCampaignForm({ ...content.actionCampaigns[index] });
    setModalType("campaign");
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.title.trim()) {
      showToast.warning("Judul program aksi wajib diisi");
      return;
    }

    const updated = [...content.actionCampaigns];
    if (editingIndex !== null) {
      updated[editingIndex] = campaignForm;
    } else {
      updated.unshift(campaignForm);
    }

    updateAndPersistContent({ ...content, actionCampaigns: updated });
    setModalType(null);
    showToast.success(editingIndex !== null ? "Program aksi diperbarui di Landing Page" : "Program aksi ditambahkan ke Landing Page");
  };

  // ── News Handlers ───────────────────────────────────────────────────────────
  const handleOpenAddNews = () => {
    setEditingIndex(null);
    setNewsForm({
      id: `news-${Date.now()}`,
      title: "",
      category: "Inovasi & KKN",
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      readTime: "3 min baca",
      location: "Kecamatan Bojongsoang",
      imageUrl: "/image/activity-1.webp",
      summary: "",
      content: "",
      author: "Tim Humas KKN UNIKOM",
      isPublished: true,
    });
    setModalType("news");
  };

  const handleOpenEditNews = (index: number) => {
    setEditingIndex(index);
    setNewsForm({ ...content.newsItems[index] });
    setModalType("news");
  };

  const handleSaveNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim()) {
      showToast.warning("Judul berita wajib diisi");
      return;
    }

    const updated = [...content.newsItems];
    if (editingIndex !== null) {
      updated[editingIndex] = newsForm;
    } else {
      updated.unshift(newsForm);
    }

    updateAndPersistContent({ ...content, newsItems: updated });
    setModalType(null);
    showToast.success(editingIndex !== null ? "Berita diperbarui di Landing Page" : "Berita ditambahkan ke Landing Page");
  };

  // ── FAQ Handlers ────────────────────────────────────────────────────────────
  const handleOpenAddFaq = () => {
    setEditingIndex(null);
    setFaqForm({ q: "", a: "" });
    setModalType("faq");
  };

  const handleOpenEditFaq = (index: number) => {
    setEditingIndex(index);
    setFaqForm({ ...content.faqItems[index] });
    setModalType("faq");
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.q.trim() || !faqForm.a.trim()) {
      showToast.warning("Pertanyaan dan jawaban wajib diisi");
      return;
    }

    const updated = [...content.faqItems];
    if (editingIndex !== null) {
      updated[editingIndex] = faqForm;
    } else {
      updated.push(faqForm);
    }

    updateAndPersistContent({ ...content, faqItems: updated });
    setModalType(null);
    showToast.success(editingIndex !== null ? "FAQ diperbarui di Landing Page" : "FAQ ditambahkan ke Landing Page");
  };

  // ── Delete Handler ──────────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteConfig) return;
    const { tab, index } = deleteConfig;

    let updatedContent = { ...content };

    if (tab === "product") {
      updatedContent.marketProducts = content.marketProducts.filter((_, i) => i !== index);
    } else if (tab === "slide") {
      updatedContent.heroSlides = content.heroSlides.filter((_, i) => i !== index);
    } else if (tab === "campaign") {
      updatedContent.actionCampaigns = content.actionCampaigns.filter((_, i) => i !== index);
    } else if (tab === "news") {
      updatedContent.newsItems = content.newsItems.filter((_, i) => i !== index);
    } else if (tab === "faq") {
      updatedContent.faqItems = content.faqItems.filter((_, i) => i !== index);
    }

    updateAndPersistContent(updatedContent);
    setDeleteConfig(null);
    showToast.info("Item dihapus.");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-left">
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#005841] text-xs font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>CMS Super Admin</span>
            </span>
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold animate-pulse">
                Ada perubahan belum disimpan
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Kelola Konten Landing Page BERSEKA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Atur dan publikasikan produk Pasar Berseka, banner carousel hero, program aksi, artikel berita, dan FAQ publik secara dinamis.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => window.open("/", "_blank")}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Eye size={15} />
            <span>Lihat Live Web</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#005841] hover:bg-[#004332] text-white text-xs font-black shadow-md shadow-[#005841]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? "Menyimpan..." : "Simpan Semua Perubahan"}</span>
          </button>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        <button
          onClick={() => setActiveTab("pasar")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
            activeTab === "pasar"
              ? "bg-[#005841] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShoppingBag size={15} />
          <span>Pasar Berseka ({content.marketProducts?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
            activeTab === "hero"
              ? "bg-[#005841] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ImageIcon size={15} />
          <span>Hero Carousel ({content.heroSlides?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("campaign")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
            activeTab === "campaign"
              ? "bg-[#005841] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Layers size={15} />
          <span>Program Aksi ({content.actionCampaigns?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("news")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
            activeTab === "news"
              ? "bg-[#005841] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Newspaper size={15} />
          <span>Berita &amp; Artikel ({content.newsItems?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("ticker_faq")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
            activeTab === "ticker_faq"
              ? "bg-[#005841] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <HelpCircle size={15} />
          <span>Ticker &amp; FAQ ({content.faqItems?.length || 0})</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <RefreshCw size={32} className="mx-auto text-emerald-600 animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Memuat data CMS Landing Page...</p>
        </div>
      ) : (
        <>
          {/* ════════════════════ TAB 1: PASAR BERSEKA ════════════════════ */}
          {activeTab === "pasar" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Daftar Produk Pasar Berseka</h3>
                  <p className="text-xs text-slate-500 font-medium">Kelola produk olahan KKN &amp; UMKM warga binaan yang ditampilkan di etalase publik.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenImportModal("pasar")}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#005841] border border-emerald-200 text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Sparkles size={15} className="text-emerald-700" />
                    <span>Tarik dari Logbook / Proker</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className="btn-primary-emerald py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    <span>Tambah Produk Baru</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {content.marketProducts?.map((prod, idx) => (
                  <div key={prod.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
                    <div className="relative h-44 w-full bg-slate-900">
                      <img
                        src={prod.imageUrl}
                        alt={prod.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/image/activity-1.webp"; }}
                      />
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${prod.categoryColor}`}>
                        {prod.categoryLabel}
                      </span>
                      {prod.isStrictRelation && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-bold border border-emerald-400/40 flex items-center gap-1 shadow-xs">
                          <ShieldCheck size={11} className="text-emerald-300" />
                          <span>{prod.sourceType === "logbook" ? "Logbook" : "Proker"} #{String(prod.sourceId || prod.prokerId || prod.id).slice(0, 8)}</span>
                        </span>
                      )}
                      <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] font-bold">
                        Stok: {prod.stock} {prod.unit}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 block truncate">Inisiator: {prod.initiator}</span>
                        {prod.kelompokNama && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 block w-fit">
                            {prod.kelompokNama}
                          </span>
                        )}
                        <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2">{prod.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{prod.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-black text-[#005841]">Rp {prod.priceIdr.toLocaleString("id-ID")}</div>
                          <div className="text-[11px] font-bold text-[#0468bf]">⭐ {prod.pricePoints} Poin</div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(idx)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfig({ tab: "product", index: idx, title: prod.title })}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 2: HERO CAROUSEL ════════════════════ */}
          {activeTab === "hero" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Slide Banner Hero Carousel (Top-Right)</h3>
                  <p className="text-xs text-slate-500 font-medium">Urutan gambar sliding interaktif di hero section landing page.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenImportModal("hero")}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#005841] border border-emerald-200 text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Sparkles size={15} className="text-emerald-700" />
                    <span>Tarik dari Logbook / Proker</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddSlide}
                    className="btn-primary-emerald py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    <span>Tambah Slide Baru</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {content.heroSlides?.map((slide, idx) => (
                  <div key={slide.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative h-44 w-full bg-slate-900">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/image/activity-1.webp"; }}
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase">
                        Slide #{idx + 1}: {slide.badge}
                      </span>
                      {slide.isStrictRelation && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-bold border border-emerald-400/40 flex items-center gap-1 shadow-xs">
                          <ShieldCheck size={11} className="text-emerald-300" />
                          <span>{slide.sourceType === "logbook" ? "Logbook" : "Proker"} #{String(slide.sourceId || slide.prokerId || slide.id).slice(0, 8)}</span>
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2">{slide.title}</h4>
                        <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <MapPin size={12} /> {slide.location}
                        </p>
                        {slide.kelompokNama && (
                          <div className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded w-fit border border-emerald-200/60">
                            Unit: {slide.kelompokNama}
                          </div>
                        )}
                        <div className="text-xs text-emerald-700 font-bold pt-1">
                          📊 {slide.metric} • ✨ {slide.highlight}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSlide(idx)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="Edit Slide"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfig({ tab: "slide", index: idx, title: slide.title })}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                          title="Hapus Slide"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 3: PROGRAM AKSI (CAMPAIGNS) ════════════════════ */}
          {activeTab === "campaign" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Program Aksi &amp; Inisiatif Berseka (BenihBaik Style)</h3>
                  <p className="text-xs text-slate-500 font-medium">Program kerja KKN dan inisiatif pengumpulan sampah warga dengan progress target.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenImportModal("campaign")}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#005841] border border-emerald-200 text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Sparkles size={15} className="text-emerald-700" />
                    <span>Tarik dari Logbook / Proker</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddCampaign}
                    className="btn-primary-emerald py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    <span>Tambah Program Aksi</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {content.actionCampaigns?.map((camp, idx) => {
                  const progress = Math.min(Math.round((camp.currentAmount / camp.targetAmount) * 100), 100);
                  return (
                    <div key={camp.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                      <div className="relative h-44 w-full bg-slate-900">
                        <img
                          src={camp.imageUrl}
                          alt={camp.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/image/activity-1.webp"; }}
                        />
                        <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${camp.categoryColor}`}>
                          {camp.categoryLabel}
                        </span>
                        {camp.isStrictRelation && (
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-bold border border-emerald-400/40 flex items-center gap-1 shadow-xs">
                            <ShieldCheck size={11} className="text-emerald-300" />
                            <span>{camp.sourceType === "logbook" ? "Logbook" : "Proker"} #{String(camp.sourceId || camp.prokerId || camp.id).slice(0, 8)}</span>
                          </span>
                        )}
                        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] font-bold">
                          {progress}% tercapai
                        </span>
                      </div>

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 block truncate">Inisiator: {camp.initiator}</span>
                          {camp.kelompokNama && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 block w-fit">
                              {camp.kelompokNama}
                            </span>
                          )}
                          <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2">{camp.title}</h4>
                          <p className="text-xs text-slate-500 font-semibold">{camp.location}</p>
                          <p className="text-xs text-slate-600 line-clamp-2">{camp.description}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="text-xs font-black text-[#005841]">
                            {camp.currentAmount} / {camp.targetAmount} {camp.unit}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCampaign(idx)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Edit Program"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfig({ tab: "campaign", index: idx, title: camp.title })}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                              title="Hapus Program"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 4: BERITA & CERITA LAPANGAN ════════════════════ */}
          {activeTab === "news" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Artikel Berita &amp; Cerita Lapangan KKN</h3>
                  <p className="text-xs text-slate-500 font-medium">Publikasikan dokumentasi kegiatan, inovasi, dan kisah inspiratif.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenImportModal("news")}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#005841] border border-emerald-200 text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Sparkles size={15} className="text-emerald-700" />
                    <span>Tarik dari Logbook / Proker</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddNews}
                    className="btn-primary-emerald py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    <span>Tulis Berita Baru</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {content.newsItems?.map((news, idx) => (
                  <div key={news.id || idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative h-44 w-full bg-slate-900">
                      <img
                        src={news.imageUrl}
                        alt={news.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/image/activity-1.webp"; }}
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase">
                        {news.category}
                      </span>
                      {news.isStrictRelation && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[10px] font-bold border border-emerald-400/40 flex items-center gap-1 shadow-xs">
                          <ShieldCheck size={11} className="text-emerald-300" />
                          <span>{news.sourceType === "logbook" ? "Logbook" : "Proker"} #{String(news.sourceId || news.prokerId || news.id).slice(0, 8)}</span>
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold">{news.date} • {news.readTime}</div>
                        <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2">{news.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{news.summary}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400">Oleh: {news.author}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditNews(idx)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Edit Berita"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfig({ tab: "news", index: idx, title: news.title })}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                            title="Hapus Berita"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 5: TICKER & FAQ ════════════════════ */}
          {activeTab === "ticker_faq" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: FAQ List */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">Pertanyaan &amp; Jawaban (FAQ)</h3>
                    <p className="text-xs text-slate-500 font-medium">Daftar FAQ yang tampil di accordion landing page publik.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddFaq}
                    className="btn-primary-emerald py-1.5 px-3.5 text-xs flex items-center gap-1"
                  >
                    <Plus size={15} />
                    <span>Tambah FAQ</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {content.faqItems?.map((faq, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {idx + 1}. {faq.q}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditFaq(idx)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfig({ tab: "faq", index: idx, title: faq.q })}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live Logs Preview */}
              <div className="lg:col-span-4 space-y-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Live Activity Ticker</h3>
                  <p className="text-xs text-slate-500 font-medium">Log aliran aktivitas penimbangan dan sedekah sampah terkini.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 max-h-[500px] overflow-y-auto">
                  {content.liveLogs?.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{log.user} ({log.rw})</span>
                        <span className="text-[10px] text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{log.action}</p>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        {log.reward}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ───────────────── MODAL: PRODUCT ADD / EDIT ───────────────── */}
      {modalType === "product" && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingIndex !== null ? "Edit Produk Pasar Berseka" : "Tambah Produk Baru"}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {productForm.isStrictRelation && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#005841] shrink-0" />
                    <span>
                      <strong>Relasi Strict ID Aktif:</strong> Terhubung ke {productForm.sourceType === "logbook" ? "Logbook Kegiatan" : "Program Kerja"} #{String(productForm.sourceId || productForm.prokerId || productForm.id).slice(0, 8)}
                      {productForm.kelompokNama ? ` • ${productForm.kelompokNama}` : ""}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-200/70 text-[#005841] px-2 py-0.5 rounded-full shrink-0">
                    Strict ID
                  </span>
                </div>
              )}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="Contoh: Pupuk Kasgot Super (1 kg)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:border-[#005841]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const labels: Record<string, string> = {
                        pupuk: "Pupuk & Kompos",
                        ecoenzyme: "Eco-Enzyme",
                        kerajinan: "Daur Ulang Kreatif",
                        bibit: "Bibit & Tanaman",
                      };
                      const colors: Record<string, string> = {
                        pupuk: "bg-emerald-100 text-emerald-800",
                        ecoenzyme: "bg-amber-100 text-amber-800",
                        kerajinan: "bg-purple-100 text-purple-800",
                        bibit: "bg-green-100 text-green-800",
                      };
                      setProductForm({
                        ...productForm,
                        category: val,
                        categoryLabel: labels[val] || "Produk",
                        categoryColor: colors[val] || "bg-slate-100 text-slate-800",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  >
                    <option value="pupuk">Pupuk &amp; Pakan Organik</option>
                    <option value="ecoenzyme">Eco-Enzyme Kebersihan</option>
                    <option value="kerajinan">Daur Ulang Kreatif</option>
                    <option value="bibit">Bibit &amp; Tanaman</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Inisiator / Pembuat *</label>
                  <input
                    type="text"
                    required
                    value={productForm.initiator}
                    onChange={(e) => setProductForm({ ...productForm, initiator: e.target.value })}
                    placeholder="Contoh: KKN Kelompok 04 RW 05"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Harga Tunai (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.priceIdr}
                    onChange={(e) => setProductForm({ ...productForm, priceIdr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Poin BERSEKA *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.pricePoints}
                    onChange={(e) => setProductForm({ ...productForm, pricePoints: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Stok &amp; Satuan</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      required
                      min={0}
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className="w-16 px-2 py-2 rounded-xl border border-slate-300 font-semibold"
                    />
                    <input
                      type="text"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      placeholder="Pack"
                      className="w-full px-2 py-2 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Image Upload Picker */}
              <ImageUploadPicker
                label="Foto Produk Pasar Berseka"
                value={productForm.imageUrl}
                onChange={(newUrl) => setProductForm({ ...productForm, imageUrl: newUrl })}
                helperText="Unggah foto produk dari HP/laptop (PNG/JPG/WebP, otomatis dikompresi)"
              />

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Jelaskan kualitas dan kegunaan produk..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary-emerald py-2 px-5 text-xs"
                >
                  Simpan ke Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: SLIDE ADD / EDIT ───────────────── */}
      {modalType === "slide" && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingIndex !== null ? "Edit Slide Carousel Hero" : "Tambah Slide Baru"}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-3.5 text-xs">
              {slideForm.isStrictRelation && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#005841] shrink-0" />
                    <span>
                      <strong>Relasi Strict ID Aktif:</strong> Terhubung ke {slideForm.sourceType === "logbook" ? "Logbook Kegiatan" : "Program Kerja"} #{String(slideForm.sourceId || slideForm.prokerId || slideForm.id).slice(0, 8)}
                      {slideForm.kelompokNama ? ` • ${slideForm.kelompokNama}` : ""}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-200/70 text-[#005841] px-2 py-0.5 rounded-full shrink-0">
                    Strict ID
                  </span>
                </div>
              )}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Judul Utama Slide *</label>
                <input
                  type="text"
                  required
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  placeholder="Contoh: Aksi Pemilahan Sampah Mandiri KKN Tematik"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Label Tag Badge *</label>
                  <input
                    type="text"
                    required
                    value={slideForm.badge}
                    onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })}
                    placeholder="Contoh: Gerakan Kolaboratif"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Lokasi Kegiatan</label>
                  <input
                    type="text"
                    value={slideForm.location}
                    onChange={(e) => setSlideForm({ ...slideForm, location: e.target.value })}
                    placeholder="Contoh: Kec. Bojongsoang"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Metrik Angka</label>
                  <input
                    type="text"
                    value={slideForm.metric}
                    onChange={(e) => setSlideForm({ ...slideForm, metric: e.target.value })}
                    placeholder="Contoh: 340+ KK Terbina"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Highlight Keunggulan</label>
                  <input
                    type="text"
                    value={slideForm.highlight}
                    onChange={(e) => setSlideForm({ ...slideForm, highlight: e.target.value })}
                    placeholder="Contoh: 100% Berbasis QR Code"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Enhanced Image Upload Picker */}
              <ImageUploadPicker
                label="Foto Banner Slide Hero"
                value={slideForm.image}
                onChange={(newUrl) => setSlideForm({ ...slideForm, image: newUrl })}
                helperText="Rekomendasi rasio landscape 16:9 atau 4:3 (Maks. 10MB)"
              />

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary-emerald py-2 px-5 text-xs"
                >
                  Simpan ke Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: CAMPAIGN ADD / EDIT ───────────────── */}
      {modalType === "campaign" && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingIndex !== null ? "Edit Program Aksi" : "Tambah Program Aksi Baru"}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-3.5 text-xs">
              {campaignForm.isStrictRelation && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#005841] shrink-0" />
                    <span>
                      <strong>Relasi Strict ID Aktif:</strong> Terhubung ke {campaignForm.sourceType === "logbook" ? "Logbook Kegiatan" : "Program Kerja"} #{String(campaignForm.sourceId || campaignForm.prokerId || campaignForm.id).slice(0, 8)}
                      {campaignForm.kelompokNama ? ` • ${campaignForm.kelompokNama}` : ""}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-200/70 text-[#005841] px-2 py-0.5 rounded-full shrink-0">
                    Strict ID
                  </span>
                </div>
              )}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Judul Program Aksi *</label>
                <input
                  type="text"
                  required
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  placeholder="Contoh: Inisiatif Biokonversi Maggot BSF RW 05"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={campaignForm.category}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const labels: Record<string, string> = {
                        organic: "Organik & Maggot",
                        recycle: "Bank Sampah",
                        kkn: "Inisiatif KKN",
                        education: "Edukasi Warga",
                      };
                      const colors: Record<string, string> = {
                        organic: "bg-emerald-100 text-emerald-800 border-emerald-200",
                        recycle: "bg-blue-100 text-blue-800 border-blue-200",
                        kkn: "bg-purple-100 text-purple-800 border-purple-200",
                        education: "bg-amber-100 text-amber-800 border-amber-200",
                      };
                      setCampaignForm({
                        ...campaignForm,
                        category: val,
                        categoryLabel: labels[val] || "Program",
                        categoryColor: colors[val] || "bg-slate-100 text-slate-800",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  >
                    <option value="organic">Organik &amp; Maggot</option>
                    <option value="recycle">Bank Sampah &amp; Daur Ulang</option>
                    <option value="kkn">Inisiatif KKN Mahasiswa</option>
                    <option value="education">Edukasi &amp; Sosialisasi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Inisiator *</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.initiator}
                    onChange={(e) => setCampaignForm({ ...campaignForm, initiator: e.target.value })}
                    placeholder="Contoh: Kelompok 04 KKN UNIKOM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Terkumpul</label>
                  <input
                    type="number"
                    min={0}
                    value={campaignForm.currentAmount}
                    onChange={(e) => setCampaignForm({ ...campaignForm, currentAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Target *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={campaignForm.targetAmount}
                    onChange={(e) => setCampaignForm({ ...campaignForm, targetAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={campaignForm.unit}
                    onChange={(e) => setCampaignForm({ ...campaignForm, unit: e.target.value })}
                    placeholder="kg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Enhanced Image Upload Picker */}
              <ImageUploadPicker
                label="Foto Dokumentasi Program Aksi"
                value={campaignForm.imageUrl}
                onChange={(newUrl) => setCampaignForm({ ...campaignForm, imageUrl: newUrl })}
                helperText="Unggah foto kegiatan pengumpulan sampah dari perangkat"
              />

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Capaian / Highlight Nyata</label>
                <input
                  type="text"
                  value={campaignForm.impactHighlight}
                  onChange={(e) => setCampaignForm({ ...campaignForm, impactHighlight: e.target.value })}
                  placeholder="Contoh: Menghasilkan 80kg pupuk kasgot untuk petani lokal."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Rangkum tujuan aksi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary-emerald py-2 px-5 text-xs"
                >
                  Simpan ke Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: NEWS ADD / EDIT ───────────────── */}
      {modalType === "news" && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingIndex !== null ? "Edit Artikel Berita" : "Tulis Berita Baru"}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNews} className="space-y-3.5 text-xs">
              {newsForm.isStrictRelation && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#005841] shrink-0" />
                    <span>
                      <strong>Relasi Strict ID Aktif:</strong> Terhubung ke {newsForm.sourceType === "logbook" ? "Logbook Kegiatan" : "Program Kerja"} #{String(newsForm.sourceId || newsForm.prokerId || newsForm.id).slice(0, 8)}
                      {newsForm.kelompokNama ? ` • ${newsForm.kelompokNama}` : ""}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-200/70 text-[#005841] px-2 py-0.5 rounded-full shrink-0">
                    Strict ID
                  </span>
                </div>
              )}
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Judul Berita *</label>
                <input
                  type="text"
                  required
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  placeholder="Judul artikel berita..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    placeholder="Inovasi & KKN"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Penulis / Humas</label>
                  <input
                    type="text"
                    value={newsForm.author}
                    onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })}
                    placeholder="Tim Humas KKN UNIKOM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Enhanced Image Upload Picker */}
              <ImageUploadPicker
                label="Foto Cover Berita"
                value={newsForm.imageUrl}
                onChange={(newUrl) => setNewsForm({ ...newsForm, imageUrl: newUrl })}
                helperText="Unggah foto cover artikel berita dari perangkat"
              />

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Ringkasan (Snippet) *</label>
                <textarea
                  rows={2}
                  required
                  value={newsForm.summary}
                  onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                  placeholder="Ringkasan singkat yang muncul di kartu berita..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Isi Lengkap Artikel *</label>
                <textarea
                  rows={5}
                  required
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  placeholder="Tuliskan isi berita lengkap..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary-emerald py-2 px-5 text-xs"
                >
                  Simpan ke Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: FAQ ADD / EDIT ───────────────── */}
      {modalType === "faq" && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {editingIndex !== null ? "Edit Pertanyaan FAQ" : "Tambah Pertanyaan FAQ"}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Pertanyaan (Question) *</label>
                <input
                  type="text"
                  required
                  value={faqForm.q}
                  onChange={(e) => setFaqForm({ ...faqForm, q: e.target.value })}
                  placeholder="Contoh: Bagaimana cara mendapatkan poin?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Jawaban (Answer) *</label>
                <textarea
                  rows={4}
                  required
                  value={faqForm.a}
                  onChange={(e) => setFaqForm({ ...faqForm, a: e.target.value })}
                  placeholder="Jelaskan jawaban secara ramah dan informatif..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary-emerald py-2 px-5 text-xs"
                >
                  Simpan ke Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── UNIVERSAL MODAL: IMPORT DARI LOGBOOK / PROKER (STRICT BY ID) ───────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-100 my-6 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#005841] text-[10px] sm:text-[11px] font-black uppercase flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>Sumber Database KKN</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] sm:text-[11px] font-black uppercase">
                    Kategori Target: {
                      importTargetCategory === "campaign" ? "Program Aksi (Program KKN)" :
                      importTargetCategory === "news" ? "Berita & Cerita Lapangan" :
                      importTargetCategory === "hero" ? "Hero Carousel" :
                      "Pasar Berseka"
                    }
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Tarik Data Lapangan ke Landing Page (Strict by ID)
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Pilih logbook kegiatan mahasiswa atau program kerja KKN resmi. Data yang ditarik akan langsung dipetakan dan dihubungkan secara ketat (Strict ID) ke database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Category Switcher (Allows changing destination tab right inside modal) */}
            <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-slate-100 rounded-2xl text-[11px] font-bold shrink-0">
              <span className="text-slate-500 px-2 text-[10px] uppercase font-black">Tujuan Impor:</span>
              <button
                type="button"
                onClick={() => setImportTargetCategory("campaign")}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                  importTargetCategory === "campaign"
                    ? "bg-[#005841] text-white font-extrabold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                Program Aksi
              </button>
              <button
                type="button"
                onClick={() => setImportTargetCategory("news")}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                  importTargetCategory === "news"
                    ? "bg-[#005841] text-white font-extrabold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                Berita &amp; Artikel
              </button>
              <button
                type="button"
                onClick={() => setImportTargetCategory("hero")}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                  importTargetCategory === "hero"
                    ? "bg-[#005841] text-white font-extrabold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                Hero Carousel
              </button>
              <button
                type="button"
                onClick={() => setImportTargetCategory("pasar")}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                  importTargetCategory === "pasar"
                    ? "bg-[#005841] text-white font-extrabold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                Pasar Berseka
              </button>
            </div>

            {/* Controls: Source Switcher + Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => {
                    setImportSourceType("logbook");
                    setImportFilterKategori("");
                  }}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer text-[11px] sm:text-xs ${
                    importSourceType === "logbook"
                      ? "bg-white text-[#005841] shadow-2xs font-black"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BookOpen size={13} />
                  <span>Logbook Kegiatan ({logbookSources.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportSourceType("proker");
                    setImportFilterKategori("");
                  }}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer text-[11px] sm:text-xs ${
                    importSourceType === "proker"
                      ? "bg-white text-[#005841] shadow-2xs font-black"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers size={13} />
                  <span>Program Kerja ({prokerSources.length})</span>
                </button>
              </div>

              {/* Refresh Data Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchImportSources}
                  disabled={loadingSources}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                  title="Segarkan Data Sumber dari Server"
                >
                  <RefreshCw size={13} className={loadingSources ? "animate-spin text-emerald-700" : ""} />
                  <span>Segarkan Data</span>
                </button>
              </div>
            </div>

            {/* Comprehensive & Detailed Filter Bar */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Search Query */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={importSearchTerm}
                    onChange={(e) => setImportSearchTerm(e.target.value)}
                    placeholder="Cari kata kunci, nama, RW..."
                    className="w-full pl-8.5 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#005841] focus:ring-1 focus:ring-[#005841]/20 transition"
                  />
                  {importSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setImportSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* 2. Filter Kelurahan */}
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none">
                    <Building2 size={13} />
                  </div>
                  <select
                    value={importFilterKelurahan}
                    onChange={(e) => {
                      setImportFilterKelurahan(e.target.value);
                      if (importFilterKelompok) {
                        const kelItem = availableKelompokList.find((k) => k.id === importFilterKelompok || k.nama === importFilterKelompok);
                        if (kelItem?.kelurahan && e.target.value && !kelItem.kelurahan.toLowerCase().includes(e.target.value.toLowerCase())) {
                          setImportFilterKelompok("");
                        }
                      }
                    }}
                    className="w-full pl-7.5 pr-6 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005841] focus:ring-1 focus:ring-[#005841]/20 cursor-pointer transition truncate"
                  >
                    <option value="">Semua Kelurahan ({availableKelurahanList.length})</option>
                    {availableKelurahanList.map((kel) => (
                      <option key={kel} value={kel}>
                        Kel. {kel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Filter Kelompok KKN */}
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none">
                    <Users size={13} />
                  </div>
                  <select
                    value={importFilterKelompok}
                    onChange={(e) => setImportFilterKelompok(e.target.value)}
                    className="w-full pl-7.5 pr-6 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005841] focus:ring-1 focus:ring-[#005841]/20 cursor-pointer transition truncate"
                  >
                    <option value="">Semua Kelompok KKN ({availableKelompokList.length})</option>
                    {availableKelompokList
                      .filter((k) => !importFilterKelurahan || (k.kelurahan && k.kelurahan.toLowerCase().includes(importFilterKelurahan.toLowerCase())))
                      .map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama} {k.kelurahan ? `(${k.kelurahan})` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 4. Filter Kategori (Proker) / Tipe (Logbook) */}
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-700 pointer-events-none">
                    <Filter size={13} />
                  </div>
                  {importSourceType === "proker" ? (
                    <select
                      value={importFilterKategori}
                      onChange={(e) => setImportFilterKategori(e.target.value)}
                      className="w-full pl-7.5 pr-6 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005841] focus:ring-1 focus:ring-[#005841]/20 cursor-pointer transition truncate"
                    >
                      <option value="">Semua Kategori Proker ({availableProkerCategories.length})</option>
                      {availableProkerCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={importFilterKategori}
                      onChange={(e) => setImportFilterKategori(e.target.value)}
                      className="w-full pl-7.5 pr-6 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005841] focus:ring-1 focus:ring-[#005841]/20 cursor-pointer transition truncate"
                    >
                      <option value="">Semua Logbook</option>
                      <option value="with_photo">📷 Hanya Ada Foto Bukti Asli</option>
                      <option value="pemanfaatan">♻️ Aksi Pemanfaatan &amp; Pengolahan</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Active Filter Indicators & Reset Action */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] pt-1 border-t border-slate-200/60 font-semibold text-slate-600">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Menampilkan <strong className="text-emerald-800">{filteredImportItems.length}</strong> dari{" "}
                    <strong>{importSourceType === "logbook" ? logbookSources.length : prokerSources.length}</strong>{" "}
                    {importSourceType === "logbook" ? "Logbook Kegiatan" : "Program Kerja"}
                  </span>
                  {importFilterKelurahan && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Kel. {importFilterKelurahan}
                      <button type="button" onClick={() => setImportFilterKelurahan("")} className="hover:text-red-600 cursor-pointer">✕</button>
                    </span>
                  )}
                  {importFilterKelompok && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {availableKelompokList.find((k) => k.id === importFilterKelompok || k.nama === importFilterKelompok)?.nama || "Kelompok Terpilih"}
                      <button type="button" onClick={() => setImportFilterKelompok("")} className="hover:text-red-600 cursor-pointer">✕</button>
                    </span>
                  )}
                  {importFilterKategori && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                      {importFilterKategori === "with_photo" ? "Ada Foto Bukti" : importFilterKategori === "pemanfaatan" ? "Pemanfaatan" : importFilterKategori}
                      <button type="button" onClick={() => setImportFilterKategori("")} className="hover:text-red-600 cursor-pointer">✕</button>
                    </span>
                  )}
                  {importSearchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                      "{importSearchTerm}"
                      <button type="button" onClick={() => setImportSearchTerm("")} className="hover:text-red-600 cursor-pointer">✕</button>
                    </span>
                  )}
                </div>

                {hasActiveImportFilters && (
                  <button
                    type="button"
                    onClick={handleResetImportFilters}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 text-[11px] font-extrabold cursor-pointer transition shrink-0 ml-auto"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[300px]">
              {loadingSources ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw size={28} className="animate-spin text-[#005841] mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Mengambil data aktivitas lapangan KKN...</p>
                </div>
              ) : filteredImportItems.length === 0 ? (
                <div className="py-16 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100 p-6">
                  <AlertCircle size={32} className="text-slate-400 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-700">
                    Tidak ada {importSourceType === "logbook" ? "logbook kegiatan" : "program kerja"} yang cocok dengan filter
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Coba ubah kata kunci pencarian, pilih kelurahan lain, atau tekan tombol reset di bawah.
                  </p>
                  {hasActiveImportFilters && (
                    <button
                      type="button"
                      onClick={handleResetImportFilters}
                      className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Semua Filter</span>
                    </button>
                  )}
                </div>
              ) : (
                (() => {
                  const targetLabel =
                    importTargetCategory === "campaign" ? "Program Aksi" :
                    importTargetCategory === "news" ? "Berita" :
                    importTargetCategory === "hero" ? "Hero Carousel" :
                    "Pasar Berseka";

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {paginatedImportItems.map((item) => {
                        const isLogbook = importSourceType === "logbook";
                        return (
                          <div
                            key={item.id}
                            className="bg-white hover:bg-emerald-50/20 rounded-2xl border border-slate-200 hover:border-emerald-300 p-4 transition space-y-3 flex flex-col justify-between group shadow-2xs"
                          >
                            <div className="space-y-2.5">
                              {/* Top Info Header */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#005841] font-black text-[10px] truncate max-w-[160px]">
                                    {item.kelompokNama || "Kelompok KKN"}
                                  </span>
                                  {item.kelurahan && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold shrink-0">
                                      Kel. {item.kelurahan}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200/60">
                                    #{String(item.id).slice(0, 8)}
                                  </span>
                                  {isLogbook && item.tanggalKegiatan && (
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {new Date(item.tanggalKegiatan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Photo Preview */}
                              {item.fotoBuktiUrl ? (
                                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-800 border border-slate-200">
                                  <img
                                    src={getSafeImageUrl(item.fotoBuktiUrl)}
                                    alt="Foto Bukti"
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "/image/activity-1.webp"; }}
                                  />
                                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/65 text-white text-[9px] font-bold flex items-center gap-1">
                                    <Camera size={10} /> Foto Asli Lapangan
                                  </span>
                                </div>
                              ) : (
                                !isLogbook && (
                                  <div className="h-16 w-full rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold gap-1.5">
                                    <Layers size={14} className="text-slate-300" />
                                    <span>Program Kerja Resmi</span>
                                  </div>
                                )
                              )}

                              {/* Proker Category or Logbook Location */}
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold flex-wrap">
                                {!isLogbook && item.kategori && (
                                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                                    {item.kategori}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <MapPin size={12} className="text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[200px]">{item.tempat || item.logbookTempat || item.kelurahan || "Coblong"}</span>
                                </span>
                                {isLogbook && item.penulisNama && (
                                  <span className="truncate max-w-[150px]">• {item.penulisNama}</span>
                                )}
                              </div>

                              {/* Description snippet */}
                              <p className="text-xs text-slate-700 font-medium line-clamp-3 leading-relaxed">
                                {item.deskripsi}
                              </p>

                              {/* Proker Extra Metadata */}
                              {!isLogbook && (item.kebutuhanBiaya || item.waktuPelaksanaan) && (
                                <div className="pt-1 flex items-center gap-2 text-[10px] font-bold text-slate-600 flex-wrap">
                                  {item.kebutuhanBiaya && Number(item.kebutuhanBiaya) > 0 && (
                                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200/60">
                                      Biaya: Rp {Number(item.kebutuhanBiaya).toLocaleString("id-ID")}
                                    </span>
                                  )}
                                  {item.waktuPelaksanaan && (
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                      Waktu: {item.waktuPelaksanaan}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Card Footer: Strict ID badge & Action Button */}
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                                <ShieldCheck size={12} className="text-emerald-700" />
                                <span>Strict ID #{String(item.id).slice(0, 6)}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectImportItem(item, isLogbook ? "logbook" : "proker", importTargetCategory)}
                                className="px-3 py-1.5 rounded-xl bg-[#005841] hover:bg-[#004734] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                              >
                                <Sparkles size={12} />
                                <span>Tarik ke {targetLabel}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Pagination Footer */}
            {totalImportPages > 1 && (
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-slate-500">
                  Halaman <strong className="text-slate-800">{importPage}</strong> dari <strong className="text-slate-800">{totalImportPages}</strong> ({filteredImportItems.length} total entri)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setImportPage((prev) => Math.max(1, prev - 1))}
                    disabled={importPage <= 1}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs font-bold flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  {/* Page numbers (up to 5 pages shown) */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalImportPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalImportPages || Math.abs(p - importPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
                            <button
                              type="button"
                              onClick={() => setImportPage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                importPage === p
                                  ? "bg-[#005841] text-white shadow-2xs"
                                  : "text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setImportPage((prev) => Math.min(totalImportPages, prev + 1))}
                    disabled={importPage >= totalImportPages}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition text-xs font-bold flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs">
              <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-700" />
                Data ditarik dengan relasi Strict ID ke database riil. Anda dapat mengedit detail sebelum disimpan.
              </span>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── CONFIRM DELETE MODAL ───────────────── */}
      {deleteConfig && (
        <ConfirmModal
          isOpen={true}
          title="Konfirmasi Hapus Item"
          message={`Apakah Anda yakin ingin menghapus "${deleteConfig.title}" dari daftar? Perubahan akan disimpan saat Anda menekan tombol Simpan Semua Perubahan.`}
          confirmText="Ya, Hapus dari Draft"
          cancelText="Batal"
          type="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfig(null)}
        />
      )}

      {/* ───────────────── CONFIRM RESET MODAL ───────────────── */}
      {showResetModal && (
        <ConfirmModal
          isOpen={true}
          title="Reset ke Pengaturan Awal"
          message="Seluruh konfigurasi Landing Page kustom akan dikembalikan ke data default standar resmi BERSEKA. Apakah Anda ingin melanjutkan?"
          confirmText="Ya, Reset ke Standar"
          cancelText="Batal"
          type="warning"
          onConfirm={handleResetToDefaults}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
};

export default KurasiLandingPage;
