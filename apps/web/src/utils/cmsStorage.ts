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
      badge: "Edukasi & Sosialisasi",
      title: "Sosialisasi Digitalisasi Pemilahan Sampah & Sedekah Anorganik",
      location: "Balai Warga RW 03, Bojongsoang",
      metric: "92% Partisipasi Warga",
      highlight: "Konversi Sampah Jadi Sembako",
      isPublished: true,
    },
  ],
  marketProducts: [
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
      benefits: ["100% Organik tanpa bahan kimia sintetis", "Mempercepat pertumbuhan akar dan daun", "Menjaga kelembapan struktur tanah"],
      isPublished: true,
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
      benefits: ["Menghilangkan bau tak sedap seketika", "Alami, aman bagi kulit dan ramah lingkungan", "Bisa digunakan sebagai pengusir hama tanaman"],
      isPublished: true,
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
      benefits: ["Benih unggul dengan daya kecambah >85%", "Dilengkapi panduan perawatan mudah untuk pemula", "Mendukung ketahanan pangan keluarga"],
      isPublished: true,
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
      benefits: ["Mencegah pencemaran saluran got dari jelantah", "Aroma menenangkan dan mengusir nyamuk", "Kemasan toples kaca estetik"],
      isPublished: true,
    },
    {
      id: "prod-05",
      title: "Tas Belanja Anyaman Plastik Daur Ulang",
      category: "kerajinan",
      categoryLabel: "Daur Ulang Kreatif",
      categoryColor: "bg-blue-100 text-blue-800",
      initiator: "Unit Daur Ulang Berkah RW 01",
      priceIdr: 35000,
      pricePoints: 350,
      stock: 25,
      unit: "Pcs",
      rating: 4.9,
      soldCount: 40,
      imageUrl: "/image/activity-1.webp",
      description: "Tas belanja belanja pasar ramah lingkungan berdaya tahan tinggi yang dianyam rapi oleh ibu-ibu warga binaan dari kemasan plastik sachet bersih.",
      benefits: ["Kuat menampung beban hingga 12 kg", "Tahan air dan mudah dibersihkan", "Menggantikan 500+ kantong plastik sekali pakai"],
      isPublished: true,
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
      benefits: ["Protein hewani tinggi 42%", "Meningkatkan kecerahan warna sisik dan daya tahan ikan", "Tahan simpan hingga 6 bulan"],
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
      title: "Kodifikasi Tempat Sampah Berbasis QR",
      category: "tech",
      categoryLabel: "IDENTITAS DIGITAL",
      categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      initiator: "KKN UNIKOM 2026",
      initiatorBadge: "Terverifikasi KKN",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/activity-1.webp",
      currentAmount: 340,
      targetAmount: 500,
      unit: "Titik QR",
      daysRemaining: 15,
      participantsCount: 120,
      description: "Setiap tempat sampah diberi kode QR sebagai identitas digital untuk mencatat pemilik, lokasi, jenis sampah, aktivitas pemilahan, dan riwayat pengangkutan.",
      impactHighlight: "Memudahkan monitoring pemilahan sampah organik & residu secara real-time.",
      isPublished: true,
    },
    {
      id: "camp-02",
      title: "Pemantauan Gas Metana di TPS Organik",
      category: "organic",
      categoryLabel: "MONITORING LINGKUNGAN",
      categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      initiator: "KKN UNIKOM 2026",
      initiatorBadge: "Terverifikasi KKN",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/activity-2.webp",
      currentAmount: 180,
      targetAmount: 200,
      unit: "TPS",
      daysRemaining: 12,
      participantsCount: 85,
      description: "Sensor memantau konsentrasi gas metana, suhu, dan kelembapan pada tempat penampungan sementara organik untuk mendukung peringatan dini dan pengelolaan yang lebih aman.",
      impactHighlight: "Peringatan dini otomatis untuk mencegah potensi akumulasi gas berlebih di area TPS.",
      isPublished: true,
    },
    {
      id: "camp-03",
      title: "IoT untuk Buruan SAE",
      category: "kkn",
      categoryLabel: "PERTANIAN PERKOTAAN",
      categoryColor: "bg-green-100 text-green-800 border-green-200",
      initiator: "KKN UNIKOM 2026",
      initiatorBadge: "Terverifikasi KKN",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/activity-3.webp",
      currentAmount: 240,
      targetAmount: 300,
      unit: "Kebun",
      daysRemaining: 18,
      participantsCount: 95,
      description: "Sensor IoT membantu memantau kelembapan tanah, suhu, dan kebutuhan air pada kebun warga agar budidaya sayuran lebih efisien, produktif, dan berkelanjutan.",
      impactHighlight: "Efisiensi penyiraman air tanaman hingga 40% dan peningkatan produktivitas sayur warga.",
      isPublished: true,
    },
    {
      id: "camp-04",
      title: "Komposter IoT untuk Pupuk Organik Cair",
      category: "organic",
      categoryLabel: "SAMPAH ORGANIK",
      categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      initiator: "KKN UNIKOM 2026",
      initiatorBadge: "Terverifikasi KKN",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/activity-2.webp",
      currentAmount: 390,
      targetAmount: 500,
      unit: "Liter POC",
      daysRemaining: 10,
      participantsCount: 65,
      description: "Komposter dilengkapi sensor suhu, kelembapan, dan waktu proses untuk membantu produksi pupuk organik cair yang konsisten, higienis, dan mudah dipantau.",
      impactHighlight: "Menghasilkan pupuk organik cair berkualitas tinggi untuk kebun warga secara konsisten.",
      isPublished: true,
    },
    {
      id: "camp-05",
      title: "Timbangan Digital untuk Petugas Sampah",
      category: "tech",
      categoryLabel: "DATA TIMBANGAN",
      categoryColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      initiator: "KKN UNIKOM 2026",
      initiatorBadge: "Terverifikasi KKN",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/landingpage.webp",
      currentAmount: 180,
      targetAmount: 200,
      unit: "Petugas",
      daysRemaining: 20,
      participantsCount: 110,
      description: "Petugas menimbang sampah berdasarkan jenis dan wilayah. Data berat, waktu, lokasi, serta identitas petugas tersimpan otomatis pada dashboard BERSEKA.ID.",
      impactHighlight: "Data penimbangan sampah terintegrasi 100% otomatis tanpa pencatatan manual di lapangan.",
      isPublished: true,
    },
    {
      id: "camp-06",
      title: "Pemanfaatan Sampah Menjadi Produk Kreatif",
      category: "recycle",
      categoryLabel: "EKONOMI SIRKULAR",
      categoryColor: "bg-amber-100 text-amber-800 border-amber-200",
      initiator: "KKN UNIKOM 2026",
      initiatorBadge: "Terverifikasi KKN",
      location: "Kecamatan Coblong, Kota Bandung",
      imageUrl: "/image/kkn-hero-sorting.webp",
      currentAmount: 450,
      targetAmount: 500,
      unit: "Produk",
      daysRemaining: 8,
      participantsCount: 140,
      description: "Sampah anorganik terpilah diolah menjadi produk kerajinan dan barang bernilai jual untuk mendorong kreativitas warga, UMKM lokal, dan Pasar BERSEKA.",
      impactHighlight: "Memberdayakan UMKM warga dan memasok produk bernilai ekonomi ke etalase Pasar BERSEKA.",
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
      title: "Digitalisasi Penimbangan Sampah: Warga Antusias Tukar Saldo Poin Jadi Sembako",
      category: "Daur Ulang",
      date: "5 Mei 2026",
      readTime: "3 min baca",
      location: "Posko Penimbangan RW 04",
      imageUrl: "/image/activity-1.webp",
      summary: "Penerapan sistem QR Code pada setiap kantong sampah memudahkan pencatatan saldo dan percepatan penukaran sembako bulanan.",
      content: "Sebanyak 85 kepala keluarga menghadiri hari penimbangan sampah serentak di Posko RW 04. Dengan sistem QR Code BERSEKA, verifikasi setoran botol plastik dan kardus berlangsung kurang dari 1 menit per warga.",
      author: "Pengelola Lingkungan RW 04",
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
      a: "Ya, seluruh produk hasil olahan KKN dan warga di Pasar Berseka dapat dibeli menggunakan uang tunai secara langsung di Posko KKN/Mitra Warga, ataupun ditukarkan dengan Poin BERSEKA."
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
      a: "Sampah organik (sisa makanan, kulit buah, sayur) akan dialirkan untuk biokonversi maggot BSF dan komposting kasgot. Sampah anorganik (botol plastik PET, kardus, kaleng) disalurkan untuk didaur ulang menjadi produk kreatif."
    }
  ]
};

const DB_NAME = "berseka_cms_db";
const DB_VERSION = 2;
const STORE_NAME = "landing_cms";
const KEY = "current_content";
const LS_FALLBACK_KEY = "berseka_landing_cms_content_v2";

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

  // Sanitize actionCampaigns: If stale data containing Bank Sampah or less than 6 programs exists, reset to defaults
  let campaigns = Array.isArray(data.actionCampaigns) ? data.actionCampaigns : DEFAULT_CMS_CONTENT.actionCampaigns;
  const hasStaleBankSampah = campaigns.some(
    (c) =>
      c.title?.includes("Bank Sampah") ||
      c.categoryLabel?.toLowerCase().includes("bank sampah") ||
      c.category === "recycle" ||
      c.title?.includes("Sedekah Minyak Jelantah")
  );
  if (hasStaleBankSampah || campaigns.length !== 6) {
    campaigns = DEFAULT_CMS_CONTENT.actionCampaigns;
  }

  // Clean newsItems
  let news = Array.isArray(data.newsItems) ? data.newsItems : DEFAULT_CMS_CONTENT.newsItems;
  news = news.map((n) => ({
    ...n,
    category: n.category === "Bank Sampah" ? "Daur Ulang" : n.category,
    title: n.title?.replace(/Bank Sampah/gi, "Penimbangan Sampah") || n.title,
    location: n.location?.replace(/Bank Sampah/gi, "Posko Penimbangan") || n.location,
    content: n.content?.replace(/Bank Sampah/gi, "Posko") || n.content,
    author: n.author?.replace(/Bank Sampah/gi, "Pengelola Lingkungan") || n.author,
  }));

  // Clean heroSlides
  let slides = Array.isArray(data.heroSlides) ? data.heroSlides : DEFAULT_CMS_CONTENT.heroSlides;
  slides = slides.map((s) => ({
    ...s,
    badge: s.badge?.replace(/Bank Sampah/gi, "Sosialisasi") || s.badge,
    title: s.title?.replace(/Bank Sampah/gi, "Pemilahan Sampah") || s.title,
  }));

  // Clean marketProducts
  let products = Array.isArray(data.marketProducts) ? data.marketProducts : DEFAULT_CMS_CONTENT.marketProducts;
  products = products.map((p) => ({
    ...p,
    initiator: p.initiator?.replace(/Bank Sampah/gi, "Unit Daur Ulang") || p.initiator,
  }));

  // Clean FAQ
  let faqs = Array.isArray(data.faqItems) ? data.faqItems : DEFAULT_CMS_CONTENT.faqItems;
  faqs = faqs.map((f) => ({
    ...f,
    a: f.a?.replace(/Bank Sampah/gi, "Posko Daur Ulang") || f.a,
  }));

  return {
    heroSlides: slides,
    marketProducts: products,
    actionCampaigns: campaigns,
    newsItems: news,
    liveLogs: Array.isArray(data.liveLogs) ? data.liveLogs : DEFAULT_CMS_CONTENT.liveLogs,
    faqItems: faqs,
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
