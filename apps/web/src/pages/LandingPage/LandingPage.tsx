/**
 * BERSEKA Public Landing Page
 * Redesigned with BenihBaik-Inspired Social Impact & Action Campaign UX Architecture
 * Features: Auto-sliding Hero Carousel, Pasar Berseka (KKN Marketplace), Clean News Section, and Waste Impact Simulator
 * Developed for Universitas Komputer Indonesia (UNIKOM) & Pemdes Dampingan
 */

/**
 * 6. Landing Page Refresh & Admin CMS Overhaul
 * 
 * - Landing Page Architecture (Public):
 *   - Dynamic Hero Carousel: Auto-sliding banner carousel with 3 default verified KKN slides, dot indicators, and pause-on-hover.
 *   - Pasar Berseka Showcase: Stalls for KKN circular products (Kasgot, Eco-Enzyme, Bibit Sayur, Lilin Daur Ulang, Tas Anyaman, Maggot Kering) with dual pricing (IDR and BERSEKA points).
 *   - News Section: Clean 3-column articles with reading time, category chips, dates, and popup reader modal.
 *   - Waste-to-Impact Calculator (Kalkulator Berkah Sampah): Interactive slider for carbon reduction and point estimation.
 *   - Live Transparency Activity Stream: Real-time ticker of verified waste drops.
 * 
 * - Admin CMS Dashboard (/kurasi-landing / /kelola-landing):
 *   - Granted access to SUPER_USER & DEVELOPER roles.
 *   - Tab 1 (Pasar Berseka): Full CRUD for products, prices (IDR & Points), stock, units, preset image picker, benefits, and descriptions.
 *   - Tab 2 (Hero Carousel): Full CRUD for sliding banners, badges, headline titles, locations, metrics, and highlights.
 *   - Tab 3 (Program Aksi): Full CRUD for action campaigns, targets, current amounts, units, and impact achievements.
 *   - Tab 4 (Berita & Artikel): Full CRUD for news items, categories, summaries, and full-text articles.
 *   - Tab 5 (Ticker & FAQ): Full CRUD for FAQ accordion items and live activity stream preview.
 *   - Real-Time Database Sync: Powered by GET/PUT /api/v1/system/landing-content and POST /api/v1/system/landing-content/reset.
 * 
 * - Verification:
 *   - apps/api: npm run build completed with 0 errors.
 *   - apps/web: npm run build completed with 0 errors.
 *   - Remote safety: Changes kept strictly local on update branch without pushing.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  Building2,
  Leaf,
  Recycle,
  GraduationCap,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Smartphone,
  ExternalLink,
  ChevronDown,
  Clock,
  MapPin,
  Flame,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronLeft,
  Info,
  Calendar,
  X,
  HeartHandshake,
  ShoppingBag,
  Tag,
  Newspaper,
  BookOpen,
  MessageCircle
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { loadCmsContent } from "../../utils/cmsStorage";
import api from "../../services/api";
import "./LandingPage.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type CampaignCategory = string;
type MarketCategory = "all" | "sayuran_buah" | "telur" | "daging" | "pupuk" | "ecoenzyme" | "kerajinan" | "bibit" | string;
type WasteTypeKey = "organik" | "plastik" | "kertas" | "jelantah" | "logam";

interface ActionCampaign {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  categoryColor: string;
  initiator: string;
  initiatorBadge: string;
  location: string;
  imageUrl: string;
  currentAmount: number;
  targetAmount: number;
  unit: string;
  daysRemaining: number;
  participantsCount: number;
  description: string;
  impactHighlight: string;
}

interface MarketProduct {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  categoryColor: string;
  initiator: string;
  priceIdr: number;
  pricePoints: number;
  stock: number;
  unit: string;
  rating: number;
  soldCount: number;
  imageUrl: string;
  description: string;
  benefits: string[];
}

interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  location: string;
  imageUrl: string;
  summary: string;
  content: string;
  author: string;
}

// ── Hero Slides Data (Sliding Carousel 3 Images) ─────────────────────────────

const HERO_SLIDES = [
  {
    id: 1,
    image: "/image/kkn-hero-sorting.webp",
    badge: "Gerakan Kolaboratif",
    title: "Aksi Pemilahan Sampah Mandiri KKN Tematik UNIKOM 2026",
    location: "Kecamatan Bojongsoang, Kab. Bandung",
    metric: "340+ KK Terbina & Terdata",
    highlight: "100% Berbasis Deteksi AI & QR Code"
  },
  {
    id: 2,
    image: "/image/activity-2.webp",
    badge: "Sirkular Organik",
    title: "Biokonversi Maggot BSF & Rumah Kompos Ramah Lingkungan",
    location: "Rumah Kompos RW 05, Bojongsoang",
    metric: "500 kg Sisa Dapur/Bulan",
    highlight: "Panen Pakan Ternak & Kasgot Super"
  },
  {
    id: 3,
    image: "/image/activity-1.webp",
    badge: "Edukasi & Bank Sampah",
    title: "Sosialisasi Digitalisasi Bank Sampah & Sedekah Anorganik",
    location: "Balai Warga RW 03, Bojongsoang",
    metric: "92% Partisipasi Warga",
    highlight: "Konversi Sampah Jadi Sembako"
  }
];

// ── Initial Campaign Data (BenihBaik-Style Inisiatif Dampak Nyata) ───────────

const INITIAL_CAMPAIGNS: ActionCampaign[] = [
  {
    id: "camp-01",
    title: "Inisiatif Biokonversi Maggot BSF & Pengolahan Sisa Dapur RW 05",
    category: "organic",
    categoryLabel: "Organik & Maggot",
    categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    initiator: "Kelompok 04 KKN UNIKOM",
    initiatorBadge: "Terverifikasi KKN",
    location: "Kecamatan Bojongsoang, Kab. Bandung",
    imageUrl: "/image/activity-2.webp",
    currentAmount: 390,
    targetAmount: 500,
    unit: "kg",
    daysRemaining: 12,
    participantsCount: 58,
    description: "Program biokonversi sampah organik rumah tangga menjadi pakan ternak tinggi protein dan pupuk kasgot bernilai ekonomi tinggi bersama warga.",
    impactHighlight: "Menghasilkan 80kg larva maggot segar untuk peternak ikan lokal."
  },
  {
    id: "camp-02",
    title: "Bank Sampah Berkah Mandiri: Sedekah Botol Plastik & Kardus Bekas",
    category: "recycle",
    categoryLabel: "Bank Sampah",
    categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
    initiator: "Pengurus RW 03 & Kader Lingkungan",
    initiatorBadge: "Mitra Warga",
    location: "Desa Bojongsoang, Kab. Bandung",
    imageUrl: "/image/activity-1.webp",
    currentAmount: 820,
    targetAmount: 1000,
    unit: "kg",
    daysRemaining: 18,
    participantsCount: 114,
    description: "Gerakan penukaran sampah anorganik (botol PET, gelas plastik, kardus) menjadi saldo tabungan sembako dan poin reward warga.",
    impactHighlight: "Telah menyalurkan 24 paket sembako untuk keluarga prasejahtera."
  },
  {
    id: "camp-03",
    title: "Pembuatan Pupuk Organik Cair (POC) dari Limbah Kulit Buah & Sayur",
    category: "kkn",
    categoryLabel: "Inisiatif KKN",
    categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
    initiator: "Tim Mahasiswa KKN Tematik 2026",
    initiatorBadge: "UNIKOM Official",
    location: "Posko KKN RW 02, Bojongsoang",
    imageUrl: "/image/activity-3.webp",
    currentAmount: 245,
    targetAmount: 300,
    unit: "Liter",
    daysRemaining: 8,
    participantsCount: 42,
    description: "Workshop fermentasi limbah buah menjadi cairan eco-enzyme dan POC gratis untuk kebun gizi pekarangan rumah warga.",
    impactHighlight: "200+ botol POC telah dibagikan ke kelompok wanita tani."
  },
  {
    id: "camp-04",
    title: "Gerakan Sedekah Minyak Jelantah: Ubah Residu Menjadi Biodiesel",
    category: "recycle",
    categoryLabel: "Bank Sampah",
    categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
    initiator: "TP-PKK & Karang Taruna RW 04",
    initiatorBadge: "Komunitas",
    location: "Kecamatan Bojongsoang",
    imageUrl: "/image/kkn-hero-sorting.webp",
    currentAmount: 145,
    targetAmount: 200,
    unit: "Liter",
    daysRemaining: 15,
    participantsCount: 76,
    description: "Pengumpulan jelantah sisa penggorengan agar tidak mencemari saluran air, dikonversi menjadi saldo emas dan poin digital.",
    impactHighlight: "Menyelamatkan 1.500 liter air tanah dari pencemaran minyak."
  },
  {
    id: "camp-05",
    title: "Sosialisasi Pemilahan 3 Wadah Mandiri & Aktivasi QR Code Tempat Sampah",
    category: "education",
    categoryLabel: "Edukasi Warga",
    categoryColor: "bg-amber-100 text-amber-800 border-amber-200",
    initiator: "Fasilitator Lingkungan & Posko KKN",
    initiatorBadge: "Edukasi Terpadu",
    location: "RT 01 - RT 05 RW 01",
    imageUrl: "/image/landingpage.webp",
    currentAmount: 138,
    targetAmount: 150,
    unit: "KK",
    daysRemaining: 5,
    participantsCount: 138,
    description: "Pendampingan pintu ke pintu untuk edukasi pemilahan sampah organik, anorganik, dan residu berbahaya beserta pemasangan stiker QR Code.",
    impactHighlight: "Tingkat kepatuhan pemilahan meningkat hingga 92% di RW 01."
  },
  {
    id: "camp-06",
    title: "Optimalisasi Jalur Pengangkutan Sampah Terpilah Tanpa Timbulan Liar",
    category: "kkn",
    categoryLabel: "Inisiatif KKN",
    categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
    initiator: "Petugas Residu & DPL KKN UNIKOM",
    initiatorBadge: "Operasional Terpadu",
    location: "Wilayah Binaan Coblong & Bojongsoang",
    imageUrl: "/image/activity-1.webp",
    currentAmount: 47,
    targetAmount: 50,
    unit: "Titik Kumpul",
    daysRemaining: 21,
    participantsCount: 89,
    description: "Digitalisasi rute penjemputan sampah terpilah menggunakan sensor GPS dan pelaporan timbangan terintegrasi aplikasi mobile.",
    impactHighlight: "Waktu tempuh petugas terpangkas 35% lebih efisien."
  }
];

// ── Pasar Berseka Products (KKN Community Stalls) ────────────────────────────

const MARKET_PRODUCTS: MarketProduct[] = [
  {
    id: "prod-01",
    title: "Pupuk Organik Kasgot Super (1 kg)",
    category: "pupuk",
    categoryLabel: "Pupuk & Kompos",
    categoryColor: "bg-emerald-100 text-emerald-800",
    initiator: "KKN Kelompok 04 RW 05",
    priceIdr: 15000,
    pricePoints: 150,
    stock: 85,
    unit: "Pack (1 kg)",
    rating: 4.9,
    soldCount: 120,
    imageUrl: "/image/activity-2.webp",
    description: "Pupuk bekas maggot (Kasgot) murni kaya unsur hara makro dan mikro, sangat efektif menyuburkan tanaman hias, sayur, dan buah pekarangan rumah.",
    benefits: ["100% Organik tanpa bahan kimia sintetis", "Mempercepat pertumbuhan akar dan daun", "Menjaga kelembapan struktur tanah"]
  },
  {
    id: "prod-02",
    title: "Cairan Eco-Enzyme Fermentasi Kulit Buah (500 ml)",
    category: "ecoenzyme",
    categoryLabel: "Eco-Enzyme",
    categoryColor: "bg-amber-100 text-amber-800",
    initiator: "KKN Kelompok 12 RW 02",
    priceIdr: 20000,
    pricePoints: 200,
    stock: 45,
    unit: "Botol (500 ml)",
    rating: 4.8,
    soldCount: 95,
    imageUrl: "/image/activity-3.webp",
    description: "Cairan serbaguna hasil fermentasi 90 hari sisa kulit jeruk, nanas, dan pepaya dengan molase. Berfungsi sebagai pembersih alami, desinfektan lantai, dan penghilang bau tong sampah.",
    benefits: ["Menghilangkan bau tak sedap seketika", "Alami, aman bagi kulit dan ramah lingkungan", "Bisa digunakan sebagai pengusir hama tanaman"]
  },
  {
    id: "prod-03",
    title: "Paket Bibit Sayur & Media Tanam Kompos Berseka",
    category: "bibit",
    categoryLabel: "Bibit & Tanaman",
    categoryColor: "bg-green-100 text-green-800",
    initiator: "Kelompok Wanita Tani & KKN",
    priceIdr: 25000,
    pricePoints: 250,
    stock: 60,
    unit: "Paket Lengkap",
    rating: 5.0,
    soldCount: 80,
    imageUrl: "/image/landingpage.webp",
    description: "Paket berkebun mandiri di rumah berisi 3 jenis benih sayur (Cabai Rawit, Kangkung, Bayam Merah) lengkap dengan pot ramah lingkungan dan media tanam kompos.",
    benefits: ["Benih unggul dengan daya kecambah >85%", "Dilengkapi panduan perawatan mudah untuk pemula", "Mendukung ketahanan pangan keluarga"]
  },
  {
    id: "prod-04",
    title: "Lilin Aromaterapi Daur Ulang Minyak Jelantah",
    category: "kerajinan",
    categoryLabel: "Daur Ulang Kreatif",
    categoryColor: "bg-purple-100 text-purple-800",
    initiator: "Karang Taruna & KKN RW 04",
    priceIdr: 18000,
    pricePoints: 180,
    stock: 35,
    unit: "Pcs (Glass Jar)",
    rating: 4.9,
    soldCount: 65,
    imageUrl: "/image/kkn-hero-sorting.webp",
    description: "Lilin aroma terapi wangi lavender dan kopi yang dibuat dari pemurnian minyak jelantah sisa dapur dengan arang aktif dan minyak atsiri alami.",
    benefits: ["Mencegah pencemaran saluran got dari jelantah", "Aroma menenangkan dan mengusir nyamuk", "Kemasan toples kaca estetik"]
  },
  {
    id: "prod-05",
    title: "Tas Belanja Anyaman Plastik Daur Ulang",
    category: "kerajinan",
    categoryLabel: "Daur Ulang Kreatif",
    categoryColor: "bg-blue-100 text-blue-800",
    initiator: "Bank Sampah Berkah RW 01",
    priceIdr: 35000,
    pricePoints: 350,
    stock: 25,
    unit: "Pcs",
    rating: 4.9,
    soldCount: 40,
    imageUrl: "/image/activity-1.webp",
    description: "Tas belanja belanja pasar ramah lingkungan berdaya tahan tinggi yang dianyam rapi oleh ibu-ibu warga binaan dari kemasan plastik sachet bersih.",
    benefits: ["Kuat menampung beban hingga 12 kg", "Tahan air dan mudah dibersihkan", "Menggantikan 500+ kantong plastik sekali pakai"]
  },
  {
    id: "prod-06",
    title: "Maggot BSF Kering (Pakan Ikan & Burung 200g)",
    category: "pupuk",
    categoryLabel: "Pakan Organik",
    categoryColor: "bg-emerald-100 text-emerald-800",
    initiator: "Unit Biokonversi RW 05",
    priceIdr: 22000,
    pricePoints: 220,
    stock: 50,
    unit: "Pack (200g)",
    rating: 5.0,
    soldCount: 110,
    imageUrl: "/image/activity-2.webp",
    description: "Larva Black Soldier Fly kering oven berprotein 42% dan tinggi asam amino. Pakan suplemen terbaik untuk ikan koi, lele, burung berkicau, dan unggas.",
    benefits: ["Protein hewani tinggi 42%", "Meningkatkan kecerahan warna sisik dan daya tahan ikan", "Tahan simpan hingga 6 bulan"]
  },
  {
    id: "prod-07",
    title: "Telur Ayam Kampung Segar Organik (Isi 10 Butir)",
    category: "telur",
    categoryLabel: "Telur Segar",
    categoryColor: "bg-amber-100 text-amber-800",
    initiator: "Peternak Binaan KKN RW 05",
    priceIdr: 28000,
    pricePoints: 280,
    stock: 40,
    unit: "Tray (10 butir)",
    rating: 4.9,
    soldCount: 88,
    imageUrl: "/image/activity-3.webp",
    description: "Telur ayam kampung segar dari ayam yang dibudidayakan bebas residu dengan suplemen pakan maggot BSF alami kaya omega dan protein tinggi.",
    benefits: ["Kuning telur oranye pekat kaya nutrisi", "Bebas hormon dan antibiotik sintetis", "Dipanen segar setiap pagi"]
  },
  {
    id: "prod-08",
    title: "Daging Ayam Kampung Segar Siap Olah (1 Ekor)",
    category: "daging",
    categoryLabel: "Daging Segar",
    categoryColor: "bg-rose-100 text-rose-800",
    initiator: "Koperasi Binaan BERSEKA RW 03",
    priceIdr: 65000,
    pricePoints: 650,
    stock: 20,
    unit: "Ekor (~0.9 - 1.1 kg)",
    rating: 5.0,
    soldCount: 45,
    imageUrl: "/image/activity-2.webp",
    description: "Daging ayam kampung segar diproses higienis dan halal, hasil peternakan terintegrasi biokonversi sirkular ramah lingkungan.",
    benefits: ["Tekstur daging gurih, padat, dan rendah lemak", "Diproses higienis dan bersertifikat halal", "Kemas vakum kedap udara menjaga kesegaran"]
  },
  {
    id: "prod-09",
    title: "Sayur Bayam Hijau & Kangkung Hidroponik Kompos",
    category: "sayuran",
    categoryLabel: "Sayuran Segar",
    categoryColor: "bg-emerald-100 text-emerald-800",
    initiator: "Kebun Kompos KWT RW 02",
    priceIdr: 8000,
    pricePoints: 80,
    stock: 60,
    unit: "Ikat (~350 gr)",
    rating: 4.9,
    soldCount: 150,
    imageUrl: "/image/landingpage.webp",
    description: "Sayuran hijau segar hasil budidaya pekarangan lestari dengan nutrisi pupuk kasgot organik murni tanpa pestisida kimia.",
    benefits: ["Dipetik langsung saat pesanan masuk", "Bebas pestisida kimia sintetis", "Daun renyah dan kaya zat besi"]
  },
  {
    id: "prod-10",
    title: "Pisang Cavendish & Pepaya Manis Kebun Berseka",
    category: "buah",
    categoryLabel: "Buah Segar",
    categoryColor: "bg-yellow-100 text-yellow-800",
    initiator: "Kelompok Tani Binaan KKN RW 04",
    priceIdr: 22000,
    pricePoints: 220,
    stock: 30,
    unit: "Sisir / Pcs (~1.2 kg)",
    rating: 4.8,
    soldCount: 75,
    imageUrl: "/image/kkn-hero-sorting.webp",
    description: "Buah-buahan segar matang pohon bernutrisi tinggi yang disuburkan menggunakan kompos organik fermentasi sampah rumah tangga.",
    benefits: ["Manis alami matang pohon", "Rasa segar dan kulit mulus", "Mendukung ekonomi petani lokal Bojongsoang"]
  }
];

// ── Default Clean News Data ──────────────────────────────────────────────────

const DEFAULT_NEWS: NewsItem[] = [
  {
    id: "news-01",
    title: "UNIKOM dan Warga Bojongsoang Resmikan Rumah Kompos Terpadu Berbasis IoT",
    category: "Inovasi & KKN",
    date: "28 Mei 2026",
    readTime: "4 min baca",
    location: "Kecamatan Bojongsoang",
    imageUrl: "/image/activity-2.webp",
    summary: "Kolaborasi civitas akademika UNIKOM bersama aparat desa mewujudkan fasilitas biokonversi sampah organik berkapasitas 500kg per hari.",
    content: "Universitas Komputer Indonesia (UNIKOM) bersama warga Desa Bojongsoang meresmikan Rumah Kompos Terpadu yang dilengkapi sistem monitoring digital BERSEKA. Melalui teknologi ini, suhu fermentasi kompos dan bobot timbulan sampah tercatat secara otomatis ke server cloud.\n\nKetua KKN Tematik menyampaikan bahwa fasilitas ini mampu mengolah hingga 500 kg sisa makanan per minggu, mencegah sampah membusuk di saluran drainase perumahan.",
    author: "Tim Humas KKN UNIKOM"
  },
  {
    id: "news-02",
    title: "Tingkat Partisipasi Warga Memilah Sampah Rumah Tangga Naik Signifikan",
    category: "Dampak Warga",
    date: "22 Mei 2026",
    readTime: "3 min baca",
    location: "RW 03 Bojongsoang",
    imageUrl: "/image/activity-1.webp",
    summary: "Sistem reward poin BERSEKA yang dapat ditukar kebutuhan sembako sukses mendorong kepatuhan pemilahan mandiri hingga 92%.",
    content: "Penerapan skema insentif sembako dan bibit tanaman pada program BERSEKA berhasil meningkatkan kepatuhan pemilahan sampah warga dari 34% menjadi 92% dalam kurun waktu 2 bulan.\n\nKader PKK setempat mengungkapkan bahwa antusiasme warga sangat tinggi karena sampah anorganik yang sebelumnya dibuang sia-sia kini memiliki nilai tukar yang pasti dan terdata secara digital.",
    author: "Kader Lingkungan RW 03"
  },
  {
    id: "news-03",
    title: "Pelatihan Pembuatan Eco-Enzyme Bersama Kelompok Wanita Tani Berkah",
    category: "Pemberdayaan",
    date: "15 Mei 2026",
    readTime: "5 min baca",
    location: "Posko KKN RW 02",
    imageUrl: "/image/activity-3.webp",
    summary: "Edukasi pemanfaatan kulit buah sisa dapur menjadi cairan multifungsi pembersih dan pupuk cair ramah lingkungan.",
    content: "Mahasiswa KKN menggelar pelatihan pembuatan cairan eco-enzyme bagi anggota Kelompok Wanita Tani (KWT). Limbah kulit buah jeruk, nanas, dan pepaya difermentasikan bersama molase selama 3 bulan untuk menghasilkan enzim pembersih alami.\n\nProduk ini kini menjadi salah satu komoditas unggulan di Pasar Berseka dan dibagikan secara berkala kepada warga sekitar.",
    author: "Fasilitator KKN Tematik"
  }
];

// ── Live Stream Logs ──────────────────────────────────────────────────────────

const LIVE_STREAM_LOGS = [
  { id: 1, user: "Ibu Siti Nurhaliza", rw: "RW 03", action: "Menyetor 4.2 kg Sampah Organik", reward: "+63 Poin", time: "3 menit lalu" },
  { id: 2, user: "Bpk. Hendra Gunawan", rw: "RW 05", action: "Menyetor 6.8 kg Botol Plastik PET", reward: "+170 Poin", time: "8 menit lalu" },
  { id: 3, user: "Kelompok 04 KKN", rw: "RW 04", action: "Memanen 45 kg Pupuk Kompos Kasgot", reward: "Didistribusikan", time: "15 menit lalu" },
  { id: 4, user: "Ibu Ratna Dewi", rw: "RW 02", action: "Menukarkan 2.5 Liter Minyak Jelantah", reward: "+100 Poin", time: "22 menit lalu" },
  { id: 5, user: "Petugas Asep", rw: "RW 01", action: "Konfirmasi Pengangkutan 120 kg Residu", reward: "Terverifikasi", time: "30 menit lalu" },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Force clean light mode on Landing Page unconditionally
  useEffect(() => {
    useThemeStore.getState().setInsideMainLayout(false);
    useThemeStore.getState().resetThemeToLight();
  }, []);

  // ── States ──────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<CampaignCategory>("all");
  const [activeMarketCategory, setActiveMarketCategory] = useState<MarketCategory>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Hero Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState<boolean>(false);

  // Dynamic CMS Landing Content States (Initialized with rich defaults)
  const [heroSlides, setHeroSlides] = useState<any[]>(HERO_SLIDES);
  const [campaigns, setCampaigns] = useState<ActionCampaign[]>(INITIAL_CAMPAIGNS);
  const [marketProducts, setMarketProducts] = useState<MarketProduct[]>(MARKET_PRODUCTS);
  const [newsList, setNewsList] = useState<NewsItem[]>(DEFAULT_NEWS);
  const [liveStreamLogs, setLiveStreamLogs] = useState<any[]>(LIVE_STREAM_LOGS);
  const [faqList, setFaqList] = useState<any[]>([
    {
      q: "Bagaimana cara warga mendapatkan poin dari memilah sampah?",
      a: "Warga cukup memilah sampah dari rumah (organik, anorganik, dan minyak jelantah). Saat jadwal penjemputan atau penyetoran di posko, scan kode QR tempat sampah dan catat timbangannya bersama petugas/mahasiswa KKN. Poin reward akan otomatis masuk ke akun Anda."
    },
    {
      q: "Apakah produk di Pasar Berseka bisa dibeli dengan uang tunai?",
      a: "Ya, seluruh produk hasil olahan KKN dan warga di Pasar Berseka dapat dibeli menggunakan uang tunai secara langsung di Posko KKN/Bank Sampah, ataupun ditukarkan dengan Poin BERSEKA."
    },
    {
      q: "Apakah aplikasi BERSEKA berbayar untuk warga?",
      a: "Tidak. Aplikasi BERSEKA 100% GRATIS untuk seluruh warga, mahasiswa KKN, dan petugas pengelola lingkungan. Ini merupakan program pengabdian masyarakat resmi dari Universitas Komputer Indonesia (UNIKOM)."
    },
    {
      q: "Bagaimana jika barcode tempat sampah saya rusak atau hilang?",
      a: "Anda dapat menghubungi petugas RW atau mahasiswa KKN di Posko terdekat untuk mencetak dan mengaktivasi stiker Kode QR tempat sampah baru secara instan melalui aplikasi."
    },
    {
      q: "Apa yang membedakan sampah organik dan anorganik pada sistem BERSEKA?",
      a: "Sampah organik (sisa makanan, kulit buah, sayur) akan dialirkan untuk biokonversi maggot BSF dan komposting kasgot. Sampah anorganik (botol plastik PET, kardus, kaleng) disalurkan ke Bank Sampah untuk didaur ulang."
    }
  ]);

  // Calculator state
  const [calcWasteType, setCalcWasteType] = useState<WasteTypeKey>("organik");
  const [calcWeightKg, setCalcWeightKg] = useState<number>(5);

  // Modals
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ActionCampaign | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState<boolean>(false);

  // Backend Live Stats & News
  const [statsData, setStatsData] = useState<{
    kegiatanCount?: number;
    wargaCount?: number;
    totalSampahKg?: number;
    sampahOrganikKg?: number;
    sampahAnorganikKg?: number;
    kelurahanCount?: number;
    tingkatPemilahanPercent?: number;
    totalPoin?: number;
  } | null>(null);

  // ── Auto-Slide Hero Carousel (5 seconds interval, pause on hover) ───────────
  useEffect(() => {
    if (isCarouselHovered || !heroSlides.length) return;
    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [isCarouselHovered, heroSlides.length]);

  // ── Data Fetching with Auto-Polling ─────────────────────────────────────────
  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        const res = await api.get("/system/landing-stats");
        if (res.data?.success && res.data?.data) {
          setStatsData(res.data.data);
        }
      } catch (err) {
        console.warn("[LandingPage] Live stats fallback.", err);
      }
    };

    const fetchPublicProkers = async () => {
      try {
        const res = await api.get("/system/public-proker");
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setCampaigns(res.data.data);
        }
      } catch (err) {
        console.warn("[LandingPage] Proker fetch error, falling back to CMS content.", err);
      }
    };

    const syncFromCmsStorage = async () => {
      const stored = await loadCmsContent();
      if (stored?.data) {
        const d = stored.data;
        if (Array.isArray(d.heroSlides) && d.heroSlides.length > 0) setHeroSlides(d.heroSlides);
        if (Array.isArray(d.actionCampaigns) && d.actionCampaigns.length > 0) setCampaigns(d.actionCampaigns);
        if (Array.isArray(d.marketProducts) && d.marketProducts.length > 0) setMarketProducts(d.marketProducts);
        if (Array.isArray(d.newsItems) && d.newsItems.length > 0) setNewsList(d.newsItems);
        if (Array.isArray(d.liveLogs) && d.liveLogs.length > 0) setLiveStreamLogs(d.liveLogs);
        if (Array.isArray(d.faqItems) && d.faqItems.length > 0) setFaqList(d.faqItems);
      }
      return stored;
    };

    const fetchLandingDynamicContent = async () => {
      const localStored = await syncFromCmsStorage();
      try {
        const res = await api.get("/system/landing-content");
        if (res.data?.success && res.data?.data) {
          const serverData = res.data.data;
          const serverTimestamp = serverData.lastModified || 0;
          // ONLY apply server data if server has newer lastModified than local client
          if (serverTimestamp > (localStored?.lastModified || 0)) {
            if (Array.isArray(serverData.heroSlides) && serverData.heroSlides.length > 0) setHeroSlides(serverData.heroSlides);
            if (Array.isArray(serverData.actionCampaigns) && serverData.actionCampaigns.length > 0) setCampaigns(serverData.actionCampaigns);
            if (Array.isArray(serverData.marketProducts) && serverData.marketProducts.length > 0) setMarketProducts(serverData.marketProducts);
            if (Array.isArray(serverData.newsItems) && serverData.newsItems.length > 0) setNewsList(serverData.newsItems);
            if (Array.isArray(serverData.liveLogs) && serverData.liveLogs.length > 0) setLiveStreamLogs(serverData.liveLogs);
            if (Array.isArray(serverData.faqItems) && serverData.faqItems.length > 0) setFaqList(serverData.faqItems);
          }
        }
      } catch (err) {
        // Offline / local preview fallback
      }
    };

    const initLandingData = async () => {
      await syncFromCmsStorage();
      await fetchLandingDynamicContent();
      await fetchPublicProkers();
      await fetchLandingStats();
    };
    initLandingData();

    const handleCustomCmsUpdate = (e: any) => {
      const d = e.detail?.data;
      if (d) {
        if (Array.isArray(d.heroSlides) && d.heroSlides.length > 0) setHeroSlides(d.heroSlides);
        if (Array.isArray(d.actionCampaigns) && d.actionCampaigns.length > 0) setCampaigns(d.actionCampaigns);
        if (Array.isArray(d.marketProducts) && d.marketProducts.length > 0) setMarketProducts(d.marketProducts);
        if (Array.isArray(d.newsItems) && d.newsItems.length > 0) setNewsList(d.newsItems);
        if (Array.isArray(d.liveLogs) && d.liveLogs.length > 0) setLiveStreamLogs(d.liveLogs);
        if (Array.isArray(d.faqItems) && d.faqItems.length > 0) setFaqList(d.faqItems);
      } else {
        syncFromCmsStorage();
      }
    };

    window.addEventListener("berseka_cms_updated", handleCustomCmsUpdate);
    window.addEventListener("storage", syncFromCmsStorage);

    const interval = setInterval(() => {
      fetchLandingStats();
      fetchLandingDynamicContent();
    }, 15000);

    return () => {
      window.removeEventListener("berseka_cms_updated", handleCustomCmsUpdate);
      window.removeEventListener("storage", syncFromCmsStorage);
      clearInterval(interval);
    };
  }, []);

  // ── Scroll Section Observer ─────────────────────────────────────────────────
  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const targetId = id.startsWith("#") ? id : `#${id}`;
    const element = document.querySelector(targetId);

    if (element) {
      window.history.pushState(null, "", targetId.toLowerCase());
      setActiveSection(targetId.toLowerCase());
      const navbarOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navbarOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const sections = ["#about", "#program", "#pasar", "#berita", "#kalkulator", "#testimoni"];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 150) {
        setActiveSection("");
        return;
      }
      for (const sectionId of sections) {
        const el = document.querySelector(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 150) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Impact Calculator Computations ──────────────────────────────────────────
  const calculatorResult = useMemo(() => {
    const formulas: Record<WasteTypeKey, { co2PerKg: number; pointsPerKg: number; conversionText: string; title: string }> = {
      organik: {
        co2PerKg: 0.85,
        pointsPerKg: 15,
        conversionText: `Setara pakan ${(calcWeightKg * 1.5).toFixed(1)} kg larva Maggot BSF & ${(calcWeightKg * 0.4).toFixed(1)} kg pupuk kompos subur.`,
        title: "Sisa Makanan & Sayuran Dapur"
      },
      plastik: {
        co2PerKg: 1.60,
        pointsPerKg: 25,
        conversionText: `Setara mendaur ulang ${(calcWeightKg * 22).toFixed(0)} botol plastik PET menjadi serat tekstil daur ulang.`,
        title: "Botol & Wadah Plastik Bersih"
      },
      kertas: {
        co2PerKg: 1.10,
        pointsPerKg: 20,
        conversionText: `Menyelamatkan ${(calcWeightKg * 0.02).toFixed(2)} pohon dewasa & ${(calcWeightKg * 26).toFixed(0)} Liter air bersih industri.`,
        title: "Kardus, Kertas & Buku Bekas"
      },
      jelantah: {
        co2PerKg: 2.40,
        pointsPerKg: 40,
        conversionText: `Dikonversi menjadi ${(calcWeightKg * 0.88).toFixed(1)} Liter bahan baku biodiesel & mencegah cemaran air tanah.`,
        title: "Minyak Jelantah Rumah Tangga"
      },
      logam: {
        co2PerKg: 3.50,
        pointsPerKg: 50,
        conversionText: `Menghemat ${(calcWeightKg * 95).toFixed(0)}% energi peleburan logam baru dari tambang bijih besi.`,
        title: "Kaleng Minuman & Logam Bekas"
      }
    };

    const selected = formulas[calcWasteType];
    const totalCo2 = (calcWeightKg * selected.co2PerKg).toFixed(1);
    const totalPoints = Math.round(calcWeightKg * selected.pointsPerKg);

    return {
      title: selected.title,
      totalCo2,
      totalPoints,
      conversionText: selected.conversionText,
    };
  }, [calcWasteType, calcWeightKg]);

  // ── Dynamic Campaign Categories & Max 2 Action Cards ─────────────────────────
  const campaignCategories = useMemo(() => {
    const cats = Array.from(
      new Set(campaigns.map((c) => c.categoryLabel || c.category))
    ).filter(Boolean);
    return ["Semua", ...cats];
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((camp) => {
        const matchCat =
          activeCategory === "all" ||
          activeCategory === "Semua" ||
          camp.category === activeCategory ||
          camp.categoryLabel === activeCategory;
        const matchSearch =
          searchQuery.trim() === "" ||
          camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          camp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          camp.initiator.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
      })
      .slice(0, 2);
  }, [activeCategory, searchQuery, campaigns]);

  // ── Pasar Berseka Filtered Products (Buah, Sayuran, Telur, Daging) ───────────
  const filteredMarketProducts = useMemo(() => {
    return marketProducts.filter((prod) => {
      if (activeMarketCategory === "all") return true;
      if (activeMarketCategory === "sayuran_buah") {
        return (
          prod.category === "sayuran" ||
          prod.category === "buah" ||
          prod.category === "bibit" ||
          prod.categoryLabel.toLowerCase().includes("sayur") ||
          prod.categoryLabel.toLowerCase().includes("buah")
        );
      }
      if (activeMarketCategory === "telur") {
        return prod.category === "telur" || prod.categoryLabel.toLowerCase().includes("telur");
      }
      if (activeMarketCategory === "daging") {
        return prod.category === "daging" || prod.categoryLabel.toLowerCase().includes("daging");
      }
      return prod.category === activeMarketCategory;
    });
  }, [activeMarketCategory, marketProducts]);

  // ── Filtered News (Max 2 articles, 3-Day Retention Filter + Fallback Option A) ─
  const displayNews = useMemo(() => {
    const parseDateMs = (dateStr?: string): number => {
      if (!dateStr) return NaN;
      let t = new Date(dateStr).getTime();
      if (!isNaN(t)) return t;

      const monthMap: Record<string, string> = {
        januari: "January", jan: "Jan",
        februari: "February", feb: "Feb",
        maret: "March", mar: "Mar",
        april: "April", apr: "Apr",
        mei: "May",
        juni: "June", jun: "Jun",
        juli: "July", jul: "Jul",
        agustus: "August", agu: "Aug", ags: "Aug",
        september: "September", sep: "Sep",
        oktober: "October", okt: "Oct",
        november: "November", nov: "Nov",
        desember: "December", des: "Dec",
      };
      let normalized = dateStr.toLowerCase();
      for (const [idMonth, enMonth] of Object.entries(monthMap)) {
        if (normalized.includes(idMonth)) {
          normalized = normalized.replace(idMonth, enMonth);
          break;
        }
      }
      return new Date(normalized).getTime();
    };

    const threeDaysAgoMs = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const recent = (newsList || []).filter((n) => {
      if (!n.date) return false;
      const parsed = parseDateMs(n.date);
      return !isNaN(parsed) && parsed >= threeDaysAgoMs;
    });
    // Fallback: If 0 articles within 3 days, show 2 most recent published articles (Option A approved)
    const base = recent.length > 0 ? recent : newsList;
    return (base || []).slice(0, 2);
  }, [newsList]);

  // Format stats safely
  const formattedOrganikTotal = statsData?.sampahOrganikKg !== undefined
    ? `${Math.round(statsData.sampahOrganikKg * 100) / 100} kg`
    : "850 kg";

  const formattedAnorganikTotal = statsData?.sampahAnorganikKg !== undefined
    ? `${Math.round(statsData.sampahAnorganikKg * 100) / 100} kg`
    : "578 kg";

  const formattedWargaTotal = statsData?.wargaCount !== undefined
    ? `${statsData.wargaCount.toLocaleString("id-ID")}`
    : "725";

  const formattedKelurahanTotal = statsData?.kelurahanCount !== undefined
    ? `${statsData.kelurahanCount}`
    : "8";

  const formattedPointsTotal = statsData?.totalPoin !== undefined
    ? `${statsData.totalPoin.toLocaleString("id-ID")}`
    : "48.500";

  return (
    <div className="landing-page min-h-screen relative selection:bg-emerald-600 selection:text-white">

      {/* ───────────────── 1. MODERN GLASS NAVBAR ───────────────── */}
      <nav className="landing-nav py-3.5">
        <div className="container-custom flex items-center justify-between">
          {/* Logo Brand */}
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <img
              src="/app-logo.png"
              alt="BERSEKA"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Nav Links Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <button onClick={() => scrollToSection("#about")} className={`nav-link-item ${activeSection === "#about" ? "active" : ""}`}>
              Tentang Kami
            </button>
            <button onClick={() => scrollToSection("#program")} className={`nav-link-item ${activeSection === "#program" ? "active" : ""}`}>
              Program Aksi
            </button>
            <button onClick={() => scrollToSection("#pasar")} className={`nav-link-item ${activeSection === "#pasar" ? "active" : ""}`}>
              Pasar Berseka
            </button>
            <button onClick={() => scrollToSection("#berita")} className={`nav-link-item ${activeSection === "#berita" ? "active" : ""}`}>
              Berita
            </button>
            <button onClick={() => scrollToSection("#kalkulator")} className={`nav-link-item ${activeSection === "#kalkulator" ? "active" : ""}`}>
              Kalkulator BERSEKA
            </button>
            <button onClick={() => scrollToSection("#testimoni")} className={`nav-link-item ${activeSection === "#testimoni" ? "active" : ""}`}>
              Kisah Warga
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <button
                onClick={() => setShowContactModal(true)}
                className="btn-secondary-white py-2 px-3 text-xs text-slate-700 hover:text-[#005841]"
                title="Hubungi Posko & Tim KKN BERSEKA"
              >
                <MessageCircle size={15} className="text-emerald-700" />
                <span>Hubungi Kami</span>
              </button>

              <button
                onClick={() => setShowApkModal(true)}
                className="btn-secondary-white py-2 px-3.5 text-xs"
              >
                <Smartphone size={16} className="text-emerald-700" />
                <span>Unduh App</span>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary-emerald py-2 px-4 text-xs"
                >
                  <Award size={16} />
                  <span>Dasbor Saya</span>
                </button>
              ) : (
                <Link to="/login" className="btn-primary-emerald py-2 px-4 text-xs">
                  <span>Masuk Portal</span>
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/98 border-t border-slate-200 px-6 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-3 font-bold text-sm text-slate-700">
              <button onClick={() => scrollToSection("#about")} className="text-left py-2 hover:text-[#005841]">
                Tentang Kami
              </button>
              <button onClick={() => scrollToSection("#program")} className="text-left py-2 hover:text-[#005841]">
                Program Aksi &amp; Inisiatif
              </button>
              <button onClick={() => scrollToSection("#pasar")} className="text-left py-2 hover:text-[#005841]">
                Pasar Berseka (Produk KKN)
              </button>
              <button onClick={() => scrollToSection("#berita")} className="text-left py-2 hover:text-[#005841]">
                Berita &amp; Cerita Aksi
              </button>
              <button onClick={() => scrollToSection("#kalkulator")} className="text-left py-2 hover:text-[#005841]">
                Kalkulator BERSEKA
              </button>
              <button onClick={() => scrollToSection("#testimoni")} className="text-left py-2 hover:text-[#005841]">
                Kisah Warga
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowContactModal(true);
                }}
                className="text-left py-2 hover:text-[#005841] flex items-center gap-2"
              >
                <MessageCircle size={15} className="text-emerald-700" />
                <span>Hubungi Kami</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowApkModal(true);
                }}
                className="btn-secondary-white w-full justify-center py-2.5 text-xs"
              >
                <Smartphone size={16} />
                <span>Unduh Aplikasi Mobile (APK)</span>
              </button>
              <Link
                to={isAuthenticated ? "/dashboard" : "/login"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-primary-emerald w-full justify-center py-2.5 text-xs"
              >
                <span>{isAuthenticated ? "Buka Dasbor" : "Masuk ke Akun"}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ───────────────── 2. HERO IMPACT SECTION (With Dynamic Carousel) ───────────────── */}
      <section className="relative pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="hero-badge-pill">
                  <Sparkles size={15} className="text-[#58a621]" />
                  <span>Ekosistem Pengelolaan Sampah Terintegrasi</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>100% Transparan &amp; Terbina UNIKOM</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-black text-[#005841] tracking-widest uppercase block">
                  BERSIH, SEHAT, KAMPUNG ASRI
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight">
                  <span className="hero-title-gradient">BERSEKA</span>
                </h1>
              </div>

              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
                Mengangkat kearifan lokal Sunda <em>&ldquo;Berseka&rdquo;</em> yang bermakna hidup bersih, apik, dan tertata rapi, platform <strong>BERSEKA</strong> mengintegrasikan pemilahan sampah dari sumber rumah tangga, verifikasi kode QR fisik tempat sampah, audit klasifikasi berbasis kecerdasan buatan (AI), serta pengangkutan residu secara terstruktur di wilayah Kecamatan Coblong.
              </p>

              {/* Quick CTA Actions */}
              <div className="flex items-center gap-3.5 flex-wrap pt-2">
                <button
                  onClick={() => scrollToSection("#program")}
                  className="btn-primary-emerald py-3 px-6 text-sm"
                >
                  <span>Ikuti Program Aksi</span>
                  <ArrowRight size={17} />
                </button>

                <button
                  onClick={() => scrollToSection("#pasar")}
                  className="btn-secondary-white py-3 px-5 text-sm"
                >
                  <ShoppingBag size={17} className="text-[#005841]" />
                  <span>Jelajahi Pasar Berseka</span>
                </button>
              </div>

              {/* Verified Trust Strip */}
              <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-semibold border-t border-slate-200/80 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>AI Waste Classification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>QR Code Smart Bin</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Pasar Produk Olahan KKN</span>
                </div>
              </div>
            </div>

            {/* Right Card / Interactive 3-Image Carousel */}
            <div className="lg:col-span-5 relative">
              <div
                className="hero-carousel-container h-84 sm:h-96 w-full"
                onMouseEnter={() => setIsCarouselHovered(true)}
                onMouseLeave={() => setIsCarouselHovered(false)}
              >
                {heroSlides.map((slide, sIdx) => {
                  const isActive = sIdx === currentSlideIndex;
                  return (
                    <div
                      key={slide.id || sIdx}
                      className={`hero-slide ${isActive ? "active" : ""}`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />

                      {/* Floating Overlay Content */}
                      <div className="absolute bottom-5 left-5 right-5 space-y-2.5 text-white text-left">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider">
                            {slide.badge}
                          </span>
                          <span className="text-[11px] text-emerald-200 font-bold flex items-center gap-1">
                            <MapPin size={12} /> {slide.location}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base sm:text-lg leading-snug">
                          {slide.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/20 text-slate-200 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Aksi Lapangan Mahasiswa KKN
                          </span>
                          <span className="text-emerald-300 font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Dokumentasi Terverifikasi
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Prev & Next Controls */}
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                  className="hero-carousel-btn left-3"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length)}
                  className="hero-carousel-btn right-3"
                  aria-label="Next Slide"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Dot Indicators */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                  {heroSlides.map((_, dIdx) => (
                    <button
                      key={dIdx}
                      type="button"
                      onClick={() => setCurrentSlideIndex(dIdx)}
                      className={`hero-carousel-dot ${dIdx === currentSlideIndex ? "active" : ""}`}
                      aria-label={`Go to slide ${dIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────── LIVE IMPACT STATS STRIP ───────────────── */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="impact-strip-card text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sampah Organik</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#005841] flex items-center justify-center">
                  <Leaf size={18} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{formattedOrganikTotal}</div>
              <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                <TrendingUp size={13} /> Maggot BSF &amp; Kompos
              </p>
            </div>

            <div className="impact-strip-card text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sampah Anorganik</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Recycle size={18} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{formattedAnorganikTotal}</div>
              <p className="text-[11px] text-teal-700 font-bold mt-1">Daur Ulang Bank Sampah</p>
            </div>

            <div className="impact-strip-card text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengguna Terlibat</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0468bf] flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{formattedWargaTotal} Pengguna</div>
              <p className="text-[11px] text-blue-700 font-bold mt-1">Master Pengguna Terlibat</p>
            </div>

            <div className="impact-strip-card text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wilayah Binaan</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{formattedKelurahanTotal} Kelurahan</div>
              <p className="text-[11px] text-amber-700 font-bold mt-1">Master Wilayah Dampingan</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 3. LIVE TRANSPARENCY STREAM TICKER ───────────────── */}
      <section className="bg-[#005841] text-white py-3.5 border-y border-emerald-800/80 overflow-hidden">
        <div className="container-custom flex items-center gap-4">
          <div className="live-stream-badge shrink-0 bg-rose-500/20 text-rose-200 border-rose-400/30">
            <span className="live-pulse-dot bg-rose-400" />
            <span className="uppercase tracking-wider font-extrabold text-[11px]">Aktivitas Terkini</span>
          </div>

          <div className="overflow-x-auto no-scrollbar flex items-center gap-6 whitespace-nowrap text-xs font-medium">
            {liveStreamLogs.map((item) => (
              <div key={item.id} className="inline-flex items-center gap-2 text-slate-200 shrink-0">
                <span className="font-bold text-white">{item.user} ({item.rw})</span>
                <span className="text-emerald-300">•</span>
                <span className="text-emerald-100">{item.action}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-300 font-extrabold text-[10px]">
                  {item.reward}
                </span>
                <span className="text-slate-400 text-[10px]">({item.time})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── 4. FEATURED ACTION CAMPAIGNS (BenihBaik Grid) ───────────────── */}
      <section id="program" className="py-16 sm:py-20 bg-[#f7faf7]/60">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-[#005841] font-extrabold text-xs uppercase tracking-wider">
                <HeartHandshake size={16} />
                <span>Program Aksi &amp; Inisiatif Berdaya</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Pilih Aksi Nyata &amp; Salurkan Sampah Terpilah
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                Dukung inisiatif pengelolaan sampah mandiri bersama kelompok KKN dan warga di wilayah dampingan Anda.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari program atau lokasi RW..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-[#005841] focus:ring-2 focus:ring-[#005841]/20 transition"
              />
            </div>
          </div>

          {/* Category Filter Tabs (Dynamic from Program Kerja) */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {campaignCategories.map((catName) => {
              const isActive =
                (catName === "Semua" && (activeCategory === "all" || activeCategory === "Semua")) ||
                activeCategory === catName;
              return (
                <button
                  key={catName}
                  onClick={() => setActiveCategory(catName === "Semua" ? "all" : catName)}
                  className={`category-tab-btn ${isActive ? "active" : ""}`}
                >
                  <Sparkles size={14} />
                  <span>{catName}</span>
                </button>
              );
            })}
          </div>

          {/* Campaign Cards Grid (Strictly 2 Cards Max) */}
          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Info size={36} className="mx-auto text-slate-400 mb-3" />
              <h3 className="font-bold text-slate-700 text-base">Tidak ada program yang sesuai</h3>
              <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian lain atau pilih kategori lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {filteredCampaigns.map((camp) => {
                const progressPercent = Math.min(Math.round((camp.currentAmount / camp.targetAmount) * 100), 100);

                return (
                  <div key={camp.id} className="campaign-card text-left group">
                    <div className="campaign-image-wrapper">
                      <img
                        src={camp.imageUrl}
                        alt={camp.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                        }}
                      />
                      <span className={`campaign-category-tag ${camp.categoryColor}`}>
                        {camp.categoryLabel}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                          <span className="flex items-center gap-1.5 truncate max-w-[190px]">
                            <Building2 size={13} className="text-[#005841] shrink-0" />
                            {camp.initiator}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold">
                            {camp.initiatorBadge}
                          </span>
                        </div>

                        <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-[#005841] transition-colors">
                          {camp.title}
                        </h3>

                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{camp.location}</span>
                        </p>

                        <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
                          {camp.description}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-extrabold text-[#005841]">
                              {camp.currentAmount} {camp.unit}
                              <span className="font-medium text-slate-500"> terkumpul</span>
                            </span>
                            <span className="font-black text-slate-800">{progressPercent}%</span>
                          </div>
                          <div className="campaign-progress-bar-bg">
                            <div
                              className="campaign-progress-bar-fill"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mt-1.5">
                            <span>Target: {camp.targetAmount} {camp.unit}</span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Clock size={12} /> {camp.daysRemaining} hari lagi
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedCampaign(camp)}
                          className="w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-[#005841] hover:border-[#005841] hover:text-white text-slate-800 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Lihat Aksi &amp; Detail</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ───────────────── 5. PASAR BERSEKA (KKN Marketplace Stalls) ───────────────── */}
      <section id="pasar" className="py-16 sm:py-20 bg-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-[#005841] rounded-full text-xs font-extrabold uppercase tracking-wider">
                <ShoppingBag size={14} />
                <span>Ekonomi Sirkular &amp; Karya Nyata</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Pasar Berseka: Produk Hasil Olahan &amp; Daur Ulang KKN
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                Beli produk ramah lingkungan karya mahasiswa KKN dan UMKM warga binaan dengan uang tunai atau tukarkan langsung dengan Poin BERSEKA Anda.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                🌱 100% Karya Komunitas Binaan
              </span>
            </div>
          </div>

          {/* Market Category Tabs */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 no-scrollbar">
            <button
              onClick={() => setActiveMarketCategory("all")}
              className={`category-tab-btn ${activeMarketCategory === "all" ? "active" : ""}`}
            >
              <Sparkles size={15} />
              <span>Semua Produk ({marketProducts.length})</span>
            </button>
            <button
              onClick={() => setActiveMarketCategory("sayuran_buah")}
              className={`category-tab-btn ${activeMarketCategory === "sayuran_buah" ? "active" : ""}`}
            >
              <Leaf size={15} />
              <span>Buah &amp; Sayuran</span>
            </button>
            <button
              onClick={() => setActiveMarketCategory("telur")}
              className={`category-tab-btn ${activeMarketCategory === "telur" ? "active" : ""}`}
            >
              <Tag size={15} />
              <span>Telur Segar</span>
            </button>
            <button
              onClick={() => setActiveMarketCategory("daging")}
              className={`category-tab-btn ${activeMarketCategory === "daging" ? "active" : ""}`}
            >
              <ShoppingBag size={15} />
              <span>Daging Segar</span>
            </button>
            <button
              onClick={() => setActiveMarketCategory("pupuk")}
              className={`category-tab-btn ${activeMarketCategory === "pupuk" ? "active" : ""}`}
            >
              <Recycle size={15} />
              <span>Pupuk &amp; Pakan Maggot</span>
            </button>
            <button
              onClick={() => setActiveMarketCategory("ecoenzyme")}
              className={`category-tab-btn ${activeMarketCategory === "ecoenzyme" ? "active" : ""}`}
            >
              <Flame size={15} />
              <span>Eco-Enzyme &amp; Kerajinan</span>
            </button>
          </div>

          {/* Market Products Grid */}
          {filteredMarketProducts.length === 0 ? (
            <div className="py-16 px-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-4 max-w-lg mx-auto animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
                <ShoppingBag size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-800 text-base">
                  Belum Ada Produk Tersedia
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Produk olahan dan hasil panen untuk kategori ini sedang dalam tahap produksi atau menunggu jadwal panen berikutnya oleh kelompok KKN binaan.
                </p>
              </div>
              <button
                onClick={() => setActiveMarketCategory("all")}
                className="btn-primary-emerald py-2.5 px-5 text-xs font-bold mx-auto cursor-pointer"
              >
                <span>Lihat Semua Produk ({marketProducts.length})</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-left">
              {filteredMarketProducts.map((product) => (
                <div key={product.id} className="market-product-card group">
                  <div className="market-product-img-box">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                      }}
                    />
                    <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-xs ${product.categoryColor}`}>
                      {product.categoryLabel}
                    </span>
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1">
                      ⭐ {product.rating} ({product.soldCount} terjual)
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 block truncate">
                        Oleh: {product.initiator}
                      </span>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base line-clamp-2 group-hover:text-[#005841] transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 font-normal">
                        {product.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 font-bold block">Harga / Poin:</span>
                          <div className="text-base font-black text-slate-900">
                            Rp {product.priceIdr.toLocaleString("id-ID")}
                          </div>
                        </div>
                        <span className="market-point-badge">
                          <Award size={14} />
                          <span>atau {product.pricePoints} Poin</span>
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-[#005841] text-[#005841] hover:text-white border border-emerald-200 hover:border-[#005841] font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag size={15} />
                        <span>Beli / Tukar Produk</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────────────── 6. BERITA & CERITA AKSI LINGKUNGAN ───────────────── */}
      <section id="berita" className="py-16 sm:py-20 bg-[#f7faf7]">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-[#0468bf] rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Newspaper size={14} />
                <span>Kabar Terkini &amp; Dokumentasi</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Berita &amp; Cerita Lapangan KKN BERSEKA
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                Simak catatan aksi nyata mahasiswa dan masyarakat dalam inovasi pemilahan sampah dan konservasi lingkungan.
              </p>
            </div>
          </div>

          {/* Clean 2-Column News Grid (Max 2 Articles, 3-Day Retention Filter) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-left max-w-4xl mx-auto">
            {displayNews.map((news) => (
              <div
                key={news.id}
                onClick={() => setSelectedNews(news)}
                className="news-article-card group cursor-pointer"
              >
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                    }}
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-black text-[#005841] uppercase tracking-wider shadow-xs">
                    {news.category}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {news.date}
                      </span>
                      <span>{news.readTime}</span>
                    </div>

                    <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#0468bf] transition-colors">
                      {news.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 font-normal leading-relaxed">
                      {news.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#0468bf] font-extrabold">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── 7. INTERACTIVE WASTE IMPACT CALCULATOR ───────────────── */}
      <section id="kalkulator" className="py-16 sm:py-20 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto calculator-card text-left">
            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-[#005841] rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Kalkulator BERSEKA</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Kalkulator BERSEKA: Dampak &amp; Nilai Sampah Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
                Hitung langsung kontribusi pemilahan sampah rumah tangga Anda terhadap pengurangan emisi karbon dan estimasi poin berkah BERSEKA.
              </p>
            </div>

            <div className="space-y-8">
              {/* Step 1: Waste Type Selector */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                  1. Pilih Jenis Sampah yang Anda Pilah:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <button
                    type="button"
                    onClick={() => setCalcWasteType("organik")}
                    className={`calc-type-btn ${calcWasteType === "organik" ? "active" : ""}`}
                  >
                    <Leaf size={22} className={calcWasteType === "organik" ? "text-[#005841]" : "text-slate-500"} />
                    <span className="text-xs font-bold">Organik Dapur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcWasteType("plastik")}
                    className={`calc-type-btn ${calcWasteType === "plastik" ? "active" : ""}`}
                  >
                    <Recycle size={22} className={calcWasteType === "plastik" ? "text-[#005841]" : "text-slate-500"} />
                    <span className="text-xs font-bold">Botol Plastik</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcWasteType("kertas")}
                    className={`calc-type-btn ${calcWasteType === "kertas" ? "active" : ""}`}
                  >
                    <Building2 size={22} className={calcWasteType === "kertas" ? "text-[#005841]" : "text-slate-500"} />
                    <span className="text-xs font-bold">Kardus/Kertas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcWasteType("jelantah")}
                    className={`calc-type-btn ${calcWasteType === "jelantah" ? "active" : ""}`}
                  >
                    <Flame size={22} className={calcWasteType === "jelantah" ? "text-[#005841]" : "text-slate-500"} />
                    <span className="text-xs font-bold">Minyak Jelantah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcWasteType("logam")}
                    className={`calc-type-btn ${calcWasteType === "logam" ? "active" : ""}`}
                  >
                    <Award size={22} className={calcWasteType === "logam" ? "text-[#005841]" : "text-slate-500"} />
                    <span className="text-xs font-bold">Kaleng/Logam</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Weight Slider */}
              <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    2. Estimasi Berat / Volume Sampah:
                  </label>
                  <span className="text-lg font-black text-[#005841] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    {calcWeightKg} {calcWasteType === "jelantah" ? "Liter" : "Kilogram (kg)"}
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={50}
                  value={calcWeightKg}
                  onChange={(e) => setCalcWeightKg(Number(e.target.value))}
                  className="calc-slider"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>1 {calcWasteType === "jelantah" ? "L" : "kg"}</span>
                  <span>25 {calcWasteType === "jelantah" ? "L" : "kg"}</span>
                  <span>50 {calcWasteType === "jelantah" ? "L" : "kg"}</span>
                </div>
              </div>

              {/* Step 3: Result Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left">
                  <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Leaf size={15} className="text-[#58a621]" />
                    Reduksi Emisi Karbon
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#005841] mt-1">
                    {calculatorResult.totalCo2} <span className="text-sm font-bold text-emerald-700">kg CO₂e</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    Gas metana dicegah lepas ke atmosfer TPA.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left">
                  <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={15} className="text-[#0468bf]" />
                    Estimasi Poin Reward BERSEKA
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#0468bf] mt-1">
                    +{calculatorResult.totalPoints} <span className="text-sm font-bold text-blue-700">Poin</span>
                  </div>
                  <p className="text-[11px] text-blue-700 font-medium mt-1">
                    Dapat ditukarkan ke sembako, produk Pasar Berseka, atau tabungan.
                  </p>
                </div>
              </div>

              {/* Tangible Equivalent Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-200">
                  <strong className="text-emerald-300 font-bold">Dampak Konkret:</strong> {calculatorResult.conversionText}
                </div>
              </div>

              {/* Scientific Methodology & Citation Footnote */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-left">
                <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  <strong className="text-emerald-900 font-bold">Sumber Metodologi &amp; Faktor Reduksi:</strong> Perhitungan reduksi emisi gas rumah kaca (GRK) mengacu pada standar faktor emisi inventarisasi gas rumah kaca KLHK RI dan IPCC Guidelines for National Greenhouse Gas Inventories (~0.85 kg CO₂e per kg sampah organik terolah melalui biokonversi maggot BSF &amp; komposting aerobik tanpa pembusukan anaerobik TPA; ~1.60 kg CO₂e per kg plastik daur ulang menggantikan polimer murni virgin).
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowApkModal(true)}
                  className="btn-primary-emerald py-3 px-8 text-sm"
                >
                  <Smartphone size={16} />
                  <span>Mulai Pilah &amp; Setor Melalui Aplikasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 8. ABOUT BERSEKA ───────────────── */}
      <section id="about" className="py-16 sm:py-20 bg-[#f7faf7]">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-[#005841] rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Building2 size={14} />
                <span>Mengenal BERSEKA</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                Bersih, Sehat, Kampung Asri:{" "}
                <span className="text-[#005841]">Sistem Sirkular Sampah Cerdas</span>
              </h2>

              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                BERSEKA adalah platform digital resmi yang dikembangkan oleh civitas akademika <strong>Universitas Komputer Indonesia (UNIKOM)</strong> untuk mendukung program Kuliah Kerja Nyata (KKN) Tematik Pengelolaan Persampahan di Jawa Barat.
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#005841] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Pemberdayaan Rumah Tangga Mandiri</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Warga memilah sampah sejak dari dapur, dipindai menggunakan AI, dan dicatat transparan.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0468bf] flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Inkubasi Aksi Mahasiswa KKN</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Pendampingan digitalisasi logbook, monitoring wilayah, dan program kerja berbasis data lapangan.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Recycle size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Integrasi Pasar Berseka &amp; Bank Sampah</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Penjualan produk olahan KKN dan penukaran poin reward warga berbasis circular economy.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden border-2 border-white shadow-xl">
                <img
                  src="/image/landingpage.webp"
                  alt="Tentang BERSEKA"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/image/activity-2.webp";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 9. HUMAN STORIES & TESTIMONIALS ───────────────── */}
      <section id="testimoni" className="py-16 sm:py-20 bg-white">
        <div className="container-custom">
          <div className="text-center space-y-2 mb-12 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-[#0468bf] rounded-full text-xs font-extrabold uppercase tracking-wider">
              <Users size={14} />
              <span>Kisah Perubahan Nyata</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Cerita Dari Mereka yang Bergerak
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Bagaimana pemilahan sampah cerdas memberi dampak langsung bagi kehidupan sehari-hari warga dan mahasiswa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
            <div className="testimonial-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#005841] font-black text-lg flex items-center justify-center shrink-0 border border-emerald-300">
                  RN
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Ibu Ratna Ningsih</h4>
                  <p className="text-xs text-slate-500 font-semibold">Warga RW 03 Bojongsoang</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium italic">
                &ldquo;Dulu sampah sisa dapur selalu bau. Sejak diajari adik-adik KKN pakai sistem ember terpilah BERSEKA, sisa sayur diambil untuk maggot dan poinnya bisa saya tukar minyak goreng dan pupuk kasgot di Pasar Berseka.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                <span>Dampak: Nol Bau Dapur</span>
                <span>⭐ 450 Poin Ditukar</span>
              </div>
            </div>

            <div className="testimonial-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0468bf] font-black text-lg flex items-center justify-center shrink-0 border border-blue-300">
                  FN
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Fajar Nugraha</h4>
                  <p className="text-xs text-slate-500 font-semibold">Ketua Kelompok KKN UNIKOM</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium italic">
                &ldquo;Aplikasi ini membantu kami memantau tingkat kepatuhan warga secara akurat lewat barcode. Kami juga bisa memasarkan hasil pupuk kasgot dan eco-enzyme buatan kelompok kami langsung di Pasar Berseka.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-700 font-bold">
                <span>Dampingan: 140 KK Terdata</span>
                <span>⭐ 100% Digital Logbook</span>
              </div>
            </div>

            <div className="testimonial-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 font-black text-lg flex items-center justify-center shrink-0 border border-purple-300">
                  US
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Pak Ujang Supriatna</h4>
                  <p className="text-xs text-slate-500 font-semibold">Petugas Pemilahan &amp; Residu</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium italic">
                &ldquo;Kerja kami jauh lebih manusiawi dan efisien. Sampah basah sudah tidak bercampur beling atau plastik kotor. Pengangkutan ke tempat biokonversi jadi cepat dan tidak ada ceceran di jalan.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-700 font-bold">
                <span>Efisiensi: 35% Waktu Tempuh</span>
                <span>⭐ Timbangan Real-Time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 10. SDG GLOBAL ALIGNMENT ───────────────── */}
      <section className="py-16 sm:py-20 bg-[#f7faf7]">
        <div className="container-custom">
          <div className="text-center space-y-2 mb-12 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-[#005841] rounded-full text-xs font-extrabold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Komitmen Keberlanjutan PBB</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Mendukung Sustainable Development Goals (SDGs)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Setiap kilogram sampah yang Anda pilah berkontribusi langsung pada 5 pilar tujuan pembangunan berkelanjutan global.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 text-left">
            <div className="sdg-card border-emerald-200">
              <span className="px-2.5 py-1 rounded bg-[#4C9F38] text-white text-[10px] font-black uppercase">SDG #3</span>
              <h4 className="font-black text-slate-900 text-xs sm:text-sm mt-3">Kehidupan Sehat &amp; Sejahtera</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Mencegah timbulan lalat dan penyakit berbasis lingkungan.</p>
            </div>

            <div className="sdg-card border-amber-200">
              <span className="px-2.5 py-1 rounded bg-[#F99D26] text-white text-[10px] font-black uppercase">SDG #11</span>
              <h4 className="font-black text-slate-900 text-xs sm:text-sm mt-3">Kota &amp; Kawasan Berkelanjutan</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Mewujudkan permukiman warga yang bersih, tertata, dan asri.</p>
            </div>

            <div className="sdg-card border-orange-200">
              <span className="px-2.5 py-1 rounded bg-[#CF8D2A] text-white text-[10px] font-black uppercase">SDG #12</span>
              <h4 className="font-black text-slate-900 text-xs sm:text-sm mt-3">Konsumsi &amp; Produksi Bertanggung Jawab</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Mengedukasi sirkulasi daur ulang dan pengurangan sampah dari sumber.</p>
            </div>

            <div className="sdg-card border-green-200">
              <span className="px-2.5 py-1 rounded bg-[#3F7E44] text-white text-[10px] font-black uppercase">SDG #13</span>
              <h4 className="font-black text-slate-900 text-xs sm:text-sm mt-3">Penanganan Perubahan Iklim</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Menekan pelepasan emisi gas metana dari dekomposisi anaerobik TPA.</p>
            </div>

            <div className="sdg-card border-lime-200">
              <span className="px-2.5 py-1 rounded bg-[#56C02B] text-white text-[10px] font-black uppercase">SDG #15</span>
              <h4 className="font-black text-slate-900 text-xs sm:text-sm mt-3">Ekosistem Daratan Lestari</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Melindungi kualitas kesuburan tanah melalui penggunaan pupuk organik.</p>
            </div>
          </div>
        </div>
      </section>



      {/* ───────────────── 12. APP DOWNLOAD SHOWCASE CTA ───────────────── */}
      <section className="py-16 sm:py-20 bg-[#f7faf7]">
        <div className="container-custom">
          <div className="app-download-banner p-8 sm:p-14 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-extrabold uppercase tracking-wider">
                  <Smartphone size={14} />
                  <span>Aplikasi Mobile Android</span>
                </span>

                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Download Aplikasi BERSEKA &amp; Mulai Dapatkan Poin Hari Ini
                </h2>

                <p className="text-sm text-emerald-100 font-medium max-w-xl leading-relaxed">
                  Pindai jenis sampah dengan kamera AI, pantau timbangan setoran, aktifkan tempat sampah QR pribadi, dan tukarkan poin reward langsung dari genggaman Anda.
                </p>

                <div className="flex items-center gap-3.5 flex-wrap pt-2">
                  <Link
                    to="/download"
                    className="btn-secondary-white py-3 px-6 text-sm bg-white text-[#005841] hover:bg-emerald-50 border-none shadow-lg"
                  >
                    <Download size={18} />
                    <span>Download APK Langsung</span>
                  </Link>

                  <button
                    onClick={() => setShowApkModal(true)}
                    className="py-3 px-5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-md transition flex items-center gap-2 cursor-pointer border border-white/20"
                  >
                    <QrCode size={18} />
                    <span>Pindai Kode QR</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="w-52 sm:w-60 p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-center space-y-3 shadow-2xl">
                  <div className="p-3 bg-white rounded-2xl inline-block shadow-md">
                    <img
                      src="/app-logo.png"
                      alt="QR Scan"
                      className="w-32 h-32 object-contain mx-auto"
                    />
                  </div>
                  <p className="text-xs text-emerald-100 font-bold">
                    Scan untuk unduh di smartphone Android
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 13. FAQ ACCORDION ───────────────── */}
      <section id="faq" className="py-16 sm:py-20 bg-white">
        <div className="container-custom max-w-3xl">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-extrabold text-[#005841] uppercase tracking-wider">
              Pertanyaan yang Sering Diajukan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Pertanyaan &amp; Jawaban (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Informasi lengkap seputar tata cara pemilahan, penukaran produk Pasar Berseka, dan operasional KKN.
            </p>
          </div>

          <div className="space-y-3 text-left">
            {faqList.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-accordion-item ${openFaq === idx ? "active" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-black text-slate-900 text-xs sm:text-sm cursor-pointer hover:text-[#005841] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform shrink-0 ml-2 ${openFaq === idx ? "rotate-180 text-[#005841]" : "text-slate-400"}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── 14. FOOTER ───────────────── */}
      <footer className="landing-footer pt-16 pb-12 text-left">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            <div className="md:col-span-5 space-y-4">
              <img
                src="/app-logo.png"
                alt="BERSEKA"
                className="h-10 w-auto object-contain brightness-0 invert opacity-95"
              />
              <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-sm">
                BERSEKA (Bersih, Sehat, Kampung Asri) adalah platform cerdas pengelolaan sampah terintegrasi berbasis partisipasi warga dan civitas akademika Universitas Komputer Indonesia.
              </p>
              <div className="text-xs text-slate-500 font-semibold space-y-1">
                <p>📍 Jl. Dipati Ukur No. 112-116, Coblong, Kota Bandung</p>
                <p>📧 admin@berseka.id <span className="text-[11px] text-slate-400 font-normal">(Cadangan: admin.berseka@gmail.com)</span></p>
                <p>📷 Instagram: <a href="https://instagram.com/berseka.id" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">@berseka.id</a></p>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Navigasi Utama</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => scrollToSection("#about")} className="footer-link">Tentang BERSEKA</button></li>
                <li><button onClick={() => scrollToSection("#program")} className="footer-link">Program Aksi Warga</button></li>
                <li><button onClick={() => scrollToSection("#pasar")} className="footer-link">Pasar Berseka (Produk KKN)</button></li>
                <li><button onClick={() => scrollToSection("#berita")} className="footer-link">Berita &amp; Cerita Lapangan</button></li>
                <li><button onClick={() => scrollToSection("#kalkulator")} className="footer-link">Kalkulator BERSEKA</button></li>
                <li><button onClick={() => scrollToSection("#faq")} className="footer-link">Pusat Bantuan &amp; FAQ</button></li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Akses Portal &amp; Aplikasi</h4>
              <div className="space-y-2 text-xs">
                <Link to="/login" className="footer-link block">Portal Masuk Petugas &amp; DPL</Link>
                <Link to="/download" className="footer-link block">Unduh Aplikasi Mobile (Android APK)</Link>
                <button onClick={() => setShowContactModal(true)} className="footer-link block text-left">
                  Hubungi Dukungan Lapangan KKN
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <p>© {new Date().getFullYear()} Universitas Komputer Indonesia (UNIKOM). All Rights Reserved.</p>
            <p className="text-slate-400 font-semibold">Dikembangkan untuk Program Pengabdian Masyarakat KKN Tematik</p>
          </div>
        </div>
      </footer>

      {/* ───────────────── FLOATING DOWNLOAD APK FAB BUTTON ───────────────── */}
      <div className="fixed bottom-6 right-6 sm:right-10 z-40 group flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <span className="absolute -inset-1.5 rounded-full bg-[#005841]/30 animate-ping opacity-75 pointer-events-none" />
          <button
            onClick={() => setShowApkModal(true)}
            className="relative w-13 h-13 bg-[#005841] hover:bg-[#004332] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#005841]/50 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/90 cursor-pointer shrink-0"
            aria-label="Unduh Aplikasi Mobile BERSEKA"
          >
            <Download size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* ───────────────── MODAL: PRODUCT DETAIL / BUY SIMULATOR ───────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col justify-between text-left">
            <div>
              <div className="relative h-56 w-full bg-slate-900">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/75 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedProduct.categoryColor}`}>
                    {selectedProduct.categoryLabel}
                  </span>
                  <span className="text-xs text-white font-bold">
                    Stok: {selectedProduct.stock} {selectedProduct.unit}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[42vh]">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400">Inisiator: {selectedProduct.initiator}</span>
                  <h3 className="font-black text-slate-900 text-lg leading-snug">
                    {selectedProduct.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 block">Harga Tunai:</span>
                    <span className="text-xl font-black text-[#005841]">
                      Rp {selectedProduct.priceIdr.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-800 block">Tukar Poin BERSEKA:</span>
                    <span className="text-base font-black text-[#0468bf]">
                      ⭐ {selectedProduct.pricePoints} Poin
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Deskripsi &amp; Manfaat</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {selectedProduct.description}
                  </p>
                  <ul className="space-y-1 pt-1">
                    {selectedProduct.benefits.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setShowContactModal(true);
                }}
                className="btn-primary-emerald py-2.5 px-5 text-xs flex items-center gap-1.5"
              >
                <MessageCircle size={15} />
                <span>Pesan / Ambil di Posko KKN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: NEWS ARTICLE READER ───────────────── */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col justify-between text-left">
            <div>
              <div className="relative h-60 w-full bg-slate-900">
                <img
                  src={selectedNews.imageUrl}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
                <button
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/75 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                    {selectedNews.category}
                  </span>
                  <span className="text-xs text-white font-semibold">
                    {selectedNews.date} • {selectedNews.readTime}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[48vh]">
                <h2 className="font-black text-slate-900 text-lg sm:text-xl leading-snug">
                  {selectedNews.title}
                </h2>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold pb-2 border-b border-slate-100">
                  <span>Oleh: <strong>{selectedNews.author}</strong></span>
                  <span>•</span>
                  <span>Lokasi: <strong>{selectedNews.location}</strong></span>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed whitespace-pre-line space-y-3">
                  {selectedNews.content}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300 transition cursor-pointer"
              >
                Tutup Baca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: APK DOWNLOAD & QR SCAN ───────────────── */}
      {showApkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-100 text-center relative">
            <button
              onClick={() => setShowApkModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005841] flex items-center justify-center mx-auto shadow-xs">
              <Smartphone size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-lg">Unduh Aplikasi Mobile</h3>
              <p className="text-xs text-slate-500 font-medium">Pindai QR Code atau unduh file APK langsung ke HP Android Anda.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <img
                src="/app-logo.png"
                alt="Scan QR APK"
                className="w-36 h-36 object-contain mx-auto"
              />
            </div>

            <div className="space-y-2">
              <Link
                to="/download"
                onClick={() => setShowApkModal(false)}
                className="btn-primary-emerald w-full justify-center py-3 text-xs"
              >
                <Download size={16} />
                <span>Buka Halaman Unduh APK</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowApkModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: DETAIL CAMPAIGN / INITIATIVE ───────────────── */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col justify-between text-left">
            <div>
              <div className="relative h-56 w-full bg-slate-900">
                <img
                  src={selectedCampaign.imageUrl}
                  alt={selectedCampaign.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/image/activity-1.webp";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/75 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedCampaign.categoryColor}`}>
                    {selectedCampaign.categoryLabel}
                  </span>
                  <span className="text-xs text-white font-bold flex items-center gap-1">
                    <Clock size={13} /> {selectedCampaign.daysRemaining} hari lagi
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[42vh]">
                <h3 className="font-black text-slate-900 text-lg leading-snug">
                  {selectedCampaign.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-semibold">
                  <MapPin size={15} className="text-[#005841] shrink-0" />
                  <span>{selectedCampaign.location}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Deskripsi Inisiatif</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {selectedCampaign.description}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900">
                  <strong className="text-[#005841]">Capaian Nyata:</strong> {selectedCampaign.impactHighlight}
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-extrabold text-slate-800">
                    <span>Terkumpul: {selectedCampaign.currentAmount} {selectedCampaign.unit}</span>
                    <span>Target: {selectedCampaign.targetAmount} {selectedCampaign.unit}</span>
                  </div>
                  <div className="campaign-progress-bar-bg">
                    <div
                      className="campaign-progress-bar-fill"
                      style={{ width: `${Math.min(Math.round((selectedCampaign.currentAmount / selectedCampaign.targetAmount) * 100), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCampaign(null);
                  setShowApkModal(true);
                }}
                className="btn-primary-emerald py-2.5 px-5 text-xs"
              >
                <span>Dukung &amp; Setor Sampah</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── MODAL: CONTACT US (Official UNIKOM & Posko) ───────────────── */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 text-left relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-[#005841] rounded-full text-xs font-black uppercase tracking-wider">
                <MessageCircle size={14} />
                <span>Pusat Informasi &amp; Kontak</span>
              </div>
              <h3 className="font-black text-slate-900 text-xl">Hubungi Posko &amp; Tim KKN BERSEKA</h3>
              <p className="text-xs text-slate-500 font-medium">Layanan informasi pemilahan sampah, pemesanan produk Pasar Berseka, dan kemitraan wilayah.</p>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 font-medium">
              {/* Kampus UNIKOM */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Building2 size={15} className="text-[#005841]" />
                    Kampus Pusat UNIKOM
                  </span>
                  <a
                    href="https://maps.google.com/?q=Universitas+Komputer+Indonesia"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#005841] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Google Maps</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Jl. Dipati Ukur No. 112-116, Lebakgede, Kec. Coblong, Kota Bandung, Jawa Barat 40132
                </p>
              </div>

              {/* Posko Wilayah KKN */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <MapPin size={15} className="text-emerald-700" />
                  Posko Dampingan Lapangan
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Balai Warga RW 03 &amp; Rumah Kompos RW 05, Desa Bojongsoang, Kec. Bojongsoang, Kab. Bandung
                </p>
              </div>

              {/* Kontak WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://wa.me/6285715516065"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 bg-green-50 hover:bg-green-100/80 border border-green-200 rounded-2xl flex items-center gap-3 text-green-900 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-green-700 font-bold block uppercase tracking-wider">WhatsApp Hotline</span>
                    <span className="text-xs font-black text-green-950">+62 857-1551-6065</span>
                  </div>
                </a>

                <a
                  href="mailto:admin@berseka.id"
                  className="p-3.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#0468bf] text-white flex items-center justify-center shrink-0">
                    <Newspaper size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-700 font-bold block uppercase tracking-wider">Email Resmi</span>
                    <span className="text-xs font-black text-blue-950">admin@berseka.id</span>
                    <span className="text-[10px] text-slate-500 block font-normal">Cadangan: admin.berseka@gmail.com</span>
                  </div>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://wa.me/6285715516065"
                target="_blank"
                rel="noreferrer"
                className="btn-primary-emerald flex-1 justify-center py-2.5 text-xs"
              >
                <Smartphone size={15} />
                <span>Chat via WhatsApp</span>
              </a>
              <button
                onClick={() => setShowContactModal(false)}
                className="btn-secondary-white py-2.5 px-5 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
