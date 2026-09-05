/**
 * Project: BERSEKA
 * Utility: Robust Offline / Local CMS Persistence using IndexedDB + LocalStorage
 * Prevents data loss and quota exceeded errors for uploaded images and customized content.
 */

export interface HeroSlideItem {
  id: string;
  image: string;
  badge: string;
  title: string;
  location: string;
  metric: string;
  highlight: string;
  isPublished?: boolean;
  sourceType?: "proker" | "logbook" | "manual";
  sourceId?: string | null;
  prokerId?: string | null;
  logbookId?: string | null;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  isStrictRelation?: boolean;
}

export interface MarketProductItem {
  id: string;
  title: string;
  category: "pupuk" | "ecoenzyme" | "kerajinan" | "bibit" | "sayuran" | "buah" | "telur" | "daging" | string;
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
  isPublished?: boolean;
  sourceType?: "proker" | "logbook" | "manual";
  sourceId?: string | null;
  prokerId?: string | null;
  logbookId?: string | null;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  isStrictRelation?: boolean;
}

export interface ActionCampaignItem {
  id: string;
  title: string;
  category: "organic" | "recycle" | "kkn" | "education";
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
  isPublished?: boolean;
  sourceType?: "proker" | "logbook" | "manual";
  sourceId?: string | null;
  prokerId?: string | null;
  logbookId?: string | null;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  isStrictRelation?: boolean;
}

export interface NewsArticleItem {
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
  isPublished?: boolean;
  sourceType?: "proker" | "logbook" | "manual";
  sourceId?: string | null;
  prokerId?: string | null;
  logbookId?: string | null;
  kelompokId?: string | null;
  kelompokNama?: string | null;
  isStrictRelation?: boolean;
}

export interface LiveLogItem {
  id: number;
  user: string;
  rw: string;
  action: string;
  reward: string;
  time: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface LandingContentPayload {
  heroSlides: HeroSlideItem[];
  marketProducts: MarketProductItem[];
  actionCampaigns: ActionCampaignItem[];
  newsItems: NewsArticleItem[];
  liveLogs: LiveLogItem[];
  faqItems: FaqItem[];
  lastModified?: number;
}

export const DEFAULT_CMS_CONTENT: LandingContentPayload = {
  heroSlides: [
    {
      id: "slide-1",
      image: "/image/kkn-hero-sorting.webp",
      badge: "Gerakan Kolaboratif",
      title: "Aksi Pemilahan Sampah Mandiri KKN Tematik UNIKOM 2026",
      location: "Kecamatan Bojongsoang, Kab. Bandung",
      metric: "340+ KK Terbina & Terdata",
      highlight: "100% Berbasis Deteksi AI & QR Code",
      isPublished: true,
    },
    {
      id: "slide-2",
      image: "/image/activity-2.webp",
      badge: "Sirkular Organik",
      title: "Biokonversi Maggot BSF & Rumah Kompos Ramah Lingkungan",
      location: "Rumah Kompos RW 05, Bojongsoang",
      metric: "500 kg Sisa Dapur/Bulan",
      highlight: "Panen Pakan Ternak & Kasgot Super",
      isPublished: true,
    },
    {
      id: "slide-3",
      image: "/image/activity-1.webp",
      badge: "Edukasi & Bank Sampah",
      title: "Sosialisasi Digitalisasi Bank Sampah & Sedekah Anorganik",
      location: "Balai Warga RW 03, Bojongsoang",
      metric: "92% Partisipasi Warga",
      highlight: "Konversi Sampah Jadi Sembako",
      isPublished: true,
    },
  ],
  marketProducts: [
    {
      id: "prod-01",
      title: "Telur Ayam BERSEKA",
      category: "pangan",
      categoryLabel: "Pangan Lokal",
      categoryColor: "bg-emerald-100 text-emerald-800",
      initiator: "Kandang Sehat Warga Coblong",
      priceIdr: 25000,
      pricePoints: 200,
      stock: 60,
      unit: "Kemasan 10 butir",
      rating: 4.9,
      soldCount: 140,
      imageUrl: "/image/products/telur-ayam-berseka.webp",
      description: "Telur ayam sehat dan segar hasil peternakan warga Coblong. Diberi pakan alami bernutrisi tinggi dan suplemen maggot BSF untuk menjaga kualitas dan kesegaran telur.",
      benefits: ["Dari peternakan ayam sehat warga binaan Coblong", "Kemasan karton ramah lingkungan isi 10 butir", "Dipanen segar setiap hari dan kaya nutrisi alami"],
      isPublished: true,
    },
    {
      id: "prod-02",
      title: "Sayuran Segar Buruan SAE",
      category: "buruan_sae",
      categoryLabel: "Buruan SAE",
      categoryColor: "bg-emerald-100 text-emerald-800",
      initiator: "Buruan SAE Coblong Menanam Harapan",
      priceIdr: 15000,
      pricePoints: 150,
      stock: 45,
      unit: "1 paket sayuran",
      rating: 5.0,
      soldCount: 185,
      imageUrl: "/image/products/sayuran-segar-buruan-sae.webp",
      description: "Paket sayuran hijau segar organik (pakcoy, selada, cabai, dan tomat) hasil budidaya perkebunan warga perkotaan Buruan SAE Coblong. Dipetik segar tanpa pestisida kimia.",
      benefits: ["100% bebas pestisida kimia sintetis", "Hasil panen segar kebun perkotaan Buruan SAE Coblong", "Kombinasi sayuran daun dan bumbu dapur siap konsumsi"],
      isPublished: true,
    },
    {
      id: "prod-03",
      title: "POC BERSEKA",
      category: "pupuk",
      categoryLabel: "Pupuk Organik",
      categoryColor: "bg-emerald-100 text-emerald-800",
      initiator: "Rumah Kompos & Olah Sampah Coblong",
      priceIdr: 18000,
      pricePoints: 180,
      stock: 80,
      unit: "Botol 500 ml",
      rating: 4.9,
      soldCount: 160,
      imageUrl: "/image/products/poc-berseka.webp",
      description: "Pupuk Organik Cair (POC) konsentrat hasil fermentasi sampah organik rumah tangga warga Coblong. Mengandung mikroorganisme baik untuk menyuburkan tanah dan mempercepat pertumbuhan tanaman.",
      benefits: ["Dibuat dari 100% sampah organik terpilah warga Coblong", "Mempercepat pertumbuhan vegetatif dan generatif tanaman", "Kemasan botol 500 ml praktis dan mudah diaplikasikan"],
      isPublished: true,
    },
    {
      id: "prod-04",
      title: "Ikan Bioflok BERSEKA",
      category: "perikanan",
      categoryLabel: "Perikanan",
      categoryColor: "bg-emerald-100 text-emerald-800",
      initiator: "Budidaya Bioflok Warga Coblong",
      priceIdr: 35000,
      pricePoints: 350,
      stock: 35,
      unit: "Kemasan 500 gram",
      rating: 4.8,
      soldCount: 95,
      imageUrl: "/image/products/ikan-bioflok-berseka.webp",
      description: "Ikan nila segar hasil budidaya modern dengan teknologi bioflok ramah lingkungan oleh warga Coblong. Daging padat, higienis, tidak berbau lumpur, dan kaya protein hewani.",
      benefits: ["Sistem bioflok modern hemat air & ramah lingkungan", "Ikan segar dan higienis tanpa bau lumpur", "Dikemas rapi 500 gram siap dibersihkan dan diolah"],
      isPublished: true,
    },
    {
      id: "prod-05",
      title: "Kerajinan Daur Ulang BERSEKA",
      category: "kerajinan",
      categoryLabel: "Produk Kreatif",
      categoryColor: "bg-emerald-100 text-emerald-800",
      initiator: "Kelompok Kreatif Warga Coblong",
      priceIdr: 30000,
      pricePoints: 300,
      stock: 25,
      unit: "1 produk",
      rating: 4.9,
      soldCount: 75,
      imageUrl: "/image/products/kerajinan-daur-ulang-berseka.webp",
      description: "Tas anyaman belanja serbaguna bernilai estetika tinggi, dibuat secara teliti oleh warga binaan Coblong dari ribuan sachet dan kemasan plastik bersih yang didaur ulang.",
      benefits: ["Dibuat dari limbah kemasan anorganik terpilah warga", "Anyaman kuat, awet, dan mampu menahan beban belanja", "Mendukung ekonomi kreatif dan zero-waste di Coblong"],
      isPublished: true,
    },
    {
      id: "prod-06",
      title: "Maggot Kering BERSEKA",
      category: "pakan",
      categoryLabel: "Pakan Ternak",
      categoryColor: "bg-emerald-100 text-emerald-800",
      initiator: "Unit Biokonversi BSF Coblong",
      priceIdr: 22000,
      pricePoints: 220,
      stock: 50,
      unit: "Botol 500 gram",
      rating: 5.0,
      soldCount: 130,
      imageUrl: "/image/products/maggot-kering-berseka.webp",
      description: "Pakan alami berprotein tinggi (>40%) dari larva Black Soldier Fly kering hasil pengolahan sisa makanan organik warga Coblong. Sangat baik untuk unggas, ikan hias/konsumsi, dan burung berkicau.",
      benefits: ["Protein hewani tinggi untuk pertumbuhan optimal hewan", "Solusi nyata pengolahan sampah organik jadi pakan bernilai", "Kemasan botol toples 500 gram kedap udara dan higienis"],
      isPublished: true,
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
      benefits: ["Kuning telur oranye pekat kaya nutrisi", "Bebas hormon dan antibiotik sintetis", "Dipanen segar setiap pagi"],
      isPublished: true,
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
      benefits: ["Tekstur daging gurih, padat, dan rendah lemak", "Diproses higienis dan bersertifikat halal", "Kemas vakum kedap udara menjaga kesegaran"],
      isPublished: true,
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
      benefits: ["Dipetik langsung saat pesanan masuk", "Bebas pestisida kimia sintetis", "Daun renyah dan kaya zat besi"],
      isPublished: true,
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
      benefits: ["Manis alami matang pohon", "Rasa segar dan kulit mulus", "Mendukung ekonomi petani lokal Bojongsoang"],
      isPublished: true,
    },
  ],
  actionCampaigns: [
    {
      id: "camp-01",
      title: "Inisiatif Biokonversi Maggot BSF & Pengolahan Sisa Dapur RW 05",
      category: "organic",
      categoryLabel: "Organik & Maggot",
      categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      initiator: "Kelompok 04 KKN UNIKOM",
      initiatorBadge: "Terverifikasi KKN",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/activity-2.webp",
      currentAmount: 390,
      targetAmount: 500,
      unit: "kg",
      daysRemaining: 12,
      participantsCount: 58,
      description: "Program biokonversi sampah organik rumah tangga menjadi pakan ternak tinggi protein dan pupuk kasgot bernilai ekonomi tinggi bersama warga.",
      impactHighlight: "Menghasilkan 80kg larva maggot segar untuk peternak ikan lokal.",
      isPublished: true,
    },
    {
      id: "camp-02",
      title: "Bank Sampah Berkah Mandiri: Sedekah Botol Plastik & Kardus Bekas",
      category: "recycle",
      categoryLabel: "Bank Sampah",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      initiator: "Pengurus RW 03 & Kader Lingkungan",
      initiatorBadge: "Mitra Warga",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/activity-1.webp",
      currentAmount: 820,
      targetAmount: 1000,
      unit: "kg",
      daysRemaining: 18,
      participantsCount: 114,
      description: "Gerakan penukaran sampah anorganik (botol PET, gelas plastik, kardus) menjadi saldo tabungan sembako dan poin reward warga.",
      impactHighlight: "Telah menyalurkan 24 paket sembako untuk keluarga prasejahtera.",
      isPublished: true,
    },
    {
      id: "camp-03",
      title: "Pembuatan Pupuk Organik Cair (POC) dari Limbah Kulit Buah & Sayur",
      category: "kkn",
      categoryLabel: "Inisiatif KKN",
      categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
      initiator: "Tim Mahasiswa KKN Tematik 2026",
      initiatorBadge: "UNIKOM Official",
      location: "Posko KKN RW 02, Coblong",
      imageUrl: "/image/activity-3.webp",
      currentAmount: 245,
      targetAmount: 300,
      unit: "Liter",
      daysRemaining: 8,
      participantsCount: 42,
      description: "Workshop fermentasi limbah buah menjadi cairan eco-enzyme dan POC gratis untuk kebun gizi pekarangan rumah warga.",
      impactHighlight: "200+ botol POC telah dibagikan ke kelompok wanita tani.",
      isPublished: true,
    },
    {
      id: "camp-04",
      title: "Gerakan Sedekah Minyak Jelantah: Ubah Residu Menjadi Biodiesel",
      category: "recycle",
      categoryLabel: "Bank Sampah",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      initiator: "TP-PKK & Karang Taruna RW 04",
      initiatorBadge: "Komunitas",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/kkn-hero-sorting.webp",
      currentAmount: 145,
      targetAmount: 200,
      unit: "Liter",
      daysRemaining: 15,
      participantsCount: 76,
      description: "Pengumpulan jelantah sisa penggorengan agar tidak mencemari saluran air, dikonversi menjadi saldo emas dan poin digital.",
      impactHighlight: "Menyelamatkan 1.500 liter air tanah dari pencemaran minyak.",
      isPublished: true,
    },
    {
      id: "camp-05",
      title: "Digitalisasi Penimbangan Sampah QR Code & IoT Sensor Lingkungan",
      category: "tech",
      categoryLabel: "Teknologi & IoT",
      categoryColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      initiator: "Divisi IoT Mahasiswa KKN UNIKOM",
      initiatorBadge: "Inovasi IoT",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/landingpage.webp",
      currentAmount: 180,
      targetAmount: 200,
      unit: "Titik RW",
      daysRemaining: 20,
      participantsCount: 95,
      description: "Implementasi timbangan digital berbasis IoT terintegrasi QR code untuk pencatatan otomatis setor sampah warga langsung ke dashboard BERSEKA.",
      impactHighlight: "Mengurangi 90% waktu pencatatan manual di posko bank sampah.",
      isPublished: true,
    },
    {
      id: "camp-06",
      title: "Edukasi Pemilahan Sampah Dini & Workshop Komposting Kasgot Warga",
      category: "edukasi",
      categoryLabel: "Edukasi Lingkungan",
      categoryColor: "bg-amber-100 text-amber-800 border-amber-200",
      initiator: "Kelompok 08 KKN Tematik",
      initiatorBadge: "Edukasi Warga",
      location: "Balai Warga RW 06, Coblong",
      imageUrl: "/image/activity-1.webp",
      currentAmount: 320,
      targetAmount: 400,
      unit: "Peserta KK",
      daysRemaining: 10,
      participantsCount: 140,
      description: "Sosialisasi door-to-door metode pemilahan 3 wadah (Organik, Anorganik, Residu) dan pembagian komposter ember tumpuk gratis bagi warga.",
      impactHighlight: "Meningkatkan kepatuhan pemilahan rumah tangga hingga 88%.",
      isPublished: true,
    },
  ],
  newsItems: [
    {
      id: "news-01",
      title: "UNIKOM dan Warga Resmikan Rumah Kompos Terpadu Berbasis IoT",
      category: "Inovasi & KKN",
      date: "28 Mei 2026",
      readTime: "4 min baca",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/activity-2.webp",
      summary: "Kolaborasi civitas akademika UNIKOM bersama aparat desa mewujudkan fasilitas biokonversi sampah organik berkapasitas 500kg per hari.",
      content: "Universitas Komputer Indonesia (UNIKOM) bersama warga meresmikan Rumah Kompos Terpadu yang dilengkapi sistem monitoring digital BERSEKA. Melalui teknologi ini, suhu fermentasi kompos dan bobot timbulan sampah tercatat secara otomatis ke server cloud.\n\nKetua KKN Tematik menyampaikan bahwa fasilitas ini mampu mengolah hingga 500 kg sisa makanan per minggu, mencegah sampah membusuk di saluran drainase perumahan.",
      author: "Tim Humas KKN UNIKOM",
      isPublished: true,
    },
    {
      id: "news-02",
      title: "Tingkat Partisipasi Warga Memilah Sampah Rumah Tangga Naik Signifikan",
      category: "Dampak Warga",
      date: "22 Mei 2026",
      readTime: "3 min baca",
      location: "RW 03 Coblong",
      imageUrl: "/image/activity-1.webp",
      summary: "Sistem reward poin BERSEKA yang dapat ditukar kebutuhan sembako sukses mendorong kepatuhan pemilahan mandiri hingga 92%.",
      content: "Penerapan skema insentif sembako dan bibit tanaman pada program BERSEKA berhasil meningkatkan kepatuhan pemilahan sampah warga dari 34% menjadi 92% dalam kurun waktu 2 bulan.\n\nKader PKK setempat mengungkapkan bahwa antusiasme warga sangat tinggi karena sampah anorganik yang sebelumnya dibuang sia-sia kini memiliki nilai tukar yang pasti dan terdata secara digital.",
      author: "Kader Lingkungan RW 03",
      isPublished: true,
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
      author: "Fasilitator KKN Tematik",
      isPublished: true,
    },
    {
      id: "news-04",
      title: "Panen Perdana Kasgot Organik Binaan KKN Hasilkan 120 Kg Pupuk Berkualitas",
      category: "Ekonomi Sirkular",
      date: "10 Mei 2026",
      readTime: "4 min baca",
      location: "Rumah Maggot RW 05",
      imageUrl: "/image/activity-2.webp",
      summary: "Hasil biokonversi maggot BSF berhasil dipanen dan langsung didistribusikan untuk kebun ketahanan pangan dan dijual di Pasar Berseka.",
      content: "Unit budidaya maggot binaan mahasiswa KKN UNIKOM sukses melaksanakan panen perdana pupuk kasgot sebanyak 120 kg. Pupuk ini langsung dimanfaatkan oleh warga untuk menyuburkan kebun hidroponik dan tanaman cabai pekarangan.",
      author: "Tim KKN Unit Maggot",
      isPublished: true,
    },
    {
      id: "news-05",
      title: "Digitalisasi Bank Sampah: Warga Antusias Tukar Saldo Poin Jadi Sembako",
      category: "Bank Sampah",
      date: "5 Mei 2026",
      readTime: "3 min baca",
      location: "Bank Sampah RW 04",
      imageUrl: "/image/activity-1.webp",
      summary: "Penerapan sistem QR Code pada setiap kantong sampah memudahkan pencatatan saldo dan percepatan penukaran sembako bulanan.",
      content: "Sebanyak 85 kepala keluarga menghadiri hari penimbangan sampah serentak di Bank Sampah RW 04. Dengan sistem QR Code BERSEKA, verifikasi setoran botol plastik dan kardus berlangsung kurang dari 1 menit per warga.",
      author: "Pengelola Bank Sampah",
      isPublished: true,
    },
    {
      id: "news-06",
      title: "Aksi Bersih Saluran & Sosialisasi Pemilahan Sampah Door-to-Door",
      category: "Aksi Lapangan",
      date: "1 Mei 2026",
      readTime: "4 min baca",
      location: "Kecamatan Coblong",
      imageUrl: "/image/kkn-hero-sorting.webp",
      summary: "Mahasiswa KKN UNIKOM bersama Karang Taruna dan warga bergotong-royong membersihkan sedimentasi drainase dan membagikan stiker panduan pilah sampah.",
      content: "Kegiatan gotong royong massal melibatkan lebih dari 150 warga dan mahasiswa. Selain membersihkan saluran air, tim membagikan tempat sampah pilah 2 warna dan menempelkan barcode QR di setiap rumah peserta program.",
      author: "Koordinator Lapangan KKN",
      isPublished: true,
    },
  ],
  liveLogs: [
    { id: 1, user: "Ibu Siti Nurhaliza", rw: "RW 03", action: "Menyetor 4.2 kg Sampah Organik", reward: "+63 Poin", time: "3 menit lalu" },
    { id: 2, user: "Bpk. Hendra Gunawan", rw: "RW 05", action: "Menyetor 6.8 kg Botol Plastik PET", reward: "+170 Poin", time: "8 menit lalu" },
    { id: 3, user: "Kelompok 04 KKN", rw: "RW 04", action: "Memanen 45 kg Pupuk Kompos Kasgot", reward: "Didistribusikan", time: "15 menit lalu" },
    { id: 4, user: "Ibu Ratna Dewi", rw: "RW 02", action: "Menukarkan 2.5 Liter Minyak Jelantah", reward: "+100 Poin", time: "22 menit lalu" },
    { id: 5, user: "Petugas Asep", rw: "RW 01", action: "Konfirmasi Pengangkutan 120 kg Residu", reward: "Terverifikasi", time: "30 menit lalu" },
  ],
  faqItems: [
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
  ]
};

const DB_NAME = "berseka_cms_db";
const DB_VERSION = 1;
const STORE_NAME = "landing_cms";
const KEY = "current_content";
const LS_FALLBACK_KEY = "berseka_landing_cms_content";

export interface StoredPayload {
  data: LandingContentPayload;
  lastModified: number;
}

// ── Open / Init IndexedDB ─────────────────────────────────────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const CMS_BROADCAST_CHANNEL_NAME = "berseka_cms_channel";

// Helper to broadcast changes across all browser tabs and components
function broadcastCmsUpdate(payload: StoredPayload): void {
  if (typeof window === "undefined") return;
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CMS_BROADCAST_CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch (e) {
    console.warn("[cmsStorage] BroadcastChannel error:", e);
  }

  try {
    window.dispatchEvent(new CustomEvent("berseka_cms_updated", { detail: payload }));
  } catch (e) {}
}

// ── Save CMS Content ─────────────────────────────────────────────────────────
export async function saveCmsContent(content: LandingContentPayload): Promise<void> {
  const payload: StoredPayload = {
    data: sanitizeCmsPayload(content),
    lastModified: content.lastModified || Date.now(),
  };

  // 1. Save to IndexedDB (virtually unlimited quota for high-res images)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(payload, KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[cmsStorage] IndexedDB write warning:", err);
  }

  // 2. Also save to LocalStorage as secondary cache
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(payload));
  } catch (err) {
    console.info("[cmsStorage] LocalStorage full, saved via IndexedDB.");
  }

  // 3. Broadcast update to all open tabs / windows
  broadcastCmsUpdate(payload);
}

// ── Load CMS Content ─────────────────────────────────────────────────────────
export function sanitizeCmsPayload(data: Partial<LandingContentPayload>): LandingContentPayload {
  if (!data || typeof data !== "object") return DEFAULT_CMS_CONTENT;
  return {
    heroSlides: Array.isArray(data.heroSlides) ? data.heroSlides : DEFAULT_CMS_CONTENT.heroSlides,
    marketProducts: Array.isArray(data.marketProducts) ? data.marketProducts : DEFAULT_CMS_CONTENT.marketProducts,
    actionCampaigns: Array.isArray(data.actionCampaigns) ? data.actionCampaigns : DEFAULT_CMS_CONTENT.actionCampaigns,
    newsItems: Array.isArray(data.newsItems) ? data.newsItems : DEFAULT_CMS_CONTENT.newsItems,
    liveLogs: Array.isArray(data.liveLogs) ? data.liveLogs : DEFAULT_CMS_CONTENT.liveLogs,
    faqItems: Array.isArray(data.faqItems) ? data.faqItems : DEFAULT_CMS_CONTENT.faqItems,
  };
}

export async function loadCmsContent(): Promise<StoredPayload> {
  // 1. Try IndexedDB first
  try {
    const db = await openDB();
    const stored = await new Promise<StoredPayload | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (stored && stored.data) {
      return {
        ...stored,
        data: sanitizeCmsPayload(stored.data),
        lastModified: stored.lastModified || 0,
      };
    }
  } catch (err) {
    console.warn("[cmsStorage] IndexedDB read warning:", err);
  }

  // 2. Fallback to LocalStorage
  try {
    const cached = localStorage.getItem(LS_FALLBACK_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.data) {
        return {
          ...parsed,
          data: sanitizeCmsPayload(parsed.data),
          lastModified: parsed.lastModified || 0,
        };
      }
      if (parsed?.marketProducts || parsed?.newsItems || parsed?.heroSlides) {
        return {
          data: sanitizeCmsPayload(parsed),
          lastModified: Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn("[cmsStorage] LocalStorage fallback read error:", err);
  }

  // 3. Return defaults if no custom data exists
  return {
    data: DEFAULT_CMS_CONTENT,
    lastModified: 0,
  };
}

// ── Reset to Defaults ────────────────────────────────────────────────────────
export async function resetCmsContent(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {}

  try {
    localStorage.removeItem(LS_FALLBACK_KEY);
  } catch (e) {}

  const resetPayload: StoredPayload = {
    data: DEFAULT_CMS_CONTENT,
    lastModified: Date.now(),
  };

  broadcastCmsUpdate(resetPayload);
}
