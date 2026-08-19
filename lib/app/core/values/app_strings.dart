/// String konstanta user-facing.
/// Disiapkan untuk lokalisasi di masa mendatang.
/// Sesuai CLAUDE.md §4.3 — tidak ada hardcoded string user-facing.
class AppStrings {
  AppStrings._();

  // --- App ---
  static const String appName = 'Berseka';
  static const String appTagline = 'Sampah Terdaftar, Lingkungan Tertata';

  // --- Auth ---
  static const String loginTitle = 'Masuk';
  static const String loginSubtitle = 'Masuk dengan email dan kata sandi Anda';
  static const String emailLabel = 'Email';
  static const String emailHint = 'Masukkan email Anda';
  static const String passwordLabel = 'Kata Sandi';
  static const String passwordHint = 'Masukkan kata sandi';
  static const String loginButton = 'Masuk';
  static const String logoutButton = 'Keluar';
  static const String invalidCredentials = 'Email atau kata sandi salah';

  // --- Navigation ---
  static const String navBeranda = 'Beranda';
  static const String navScan = 'Setor';
  static const String navRiwayat = 'Riwayat';
  static const String navPoin = 'Poin';
  static const String navProfil = 'Profil';

  // --- Beranda ---
  static const String berandaGreeting = 'Selamat datang';
  static const String berandaTotalPoin = 'Total Poin';
  static const String berandaSetor = 'Setor Sampah';
  static const String berandaOrganik = 'Organik';
  static const String berandaAnorganik = 'Anorganik';
  static const String berandaRiwayatTerakhir = 'Riwayat Terakhir';
  static const String berandaLihatSemua = 'Lihat Semua';
  static const String berandaStatusTong = 'Status Tempat Sampah';

  // --- Scan / Setor Flow ---
  static const String scanStep1Title = 'Foto Sampah';
  static const String scanStep1Subtitle = 'Ambil foto sampah yang akan dibuang';
  static const String scanStep2Title = 'Verifikasi AI';
  static const String scanStep2Subtitle = 'Mendeteksi jenis & volume sampah';
  static const String scanStep3Title = 'Scan QR Tong';
  static const String scanStep3Subtitle = 'Pindai QR Code pada tempat sampah';
  static const String scanStep4Title = 'Selesai';
  static const String scanStep4Subtitle = 'Sampah berhasil tercatat';

  static const String buttonAmbilFoto = 'Ambil Foto Sampah';
  static const String buttonKirimAI = 'Kirim ke AI Detector';
  static const String buttonScanQR = 'Scan QR Tempat Sampah';
  static const String buttonSelesai = 'Setor Lagi';

  static const String aiDetecting = 'Mendeteksi sampah...';
  static const String aiSuccess = 'Deteksi berhasil!';
  static const String aiTimeout = 'Deteksi AI timeout. Coba lagi.';
  static const String aiImageUnreadable =
      'Foto tidak terbaca. Ambil ulang foto.';
  static const String aiDailyLimitExceeded =
      'Kuota harian AI sudah habis (50/hari).';

  static const String binOverflow =
      'Tempat Sampah sudah penuh! Ajukan pengosongan tempat sampah.';
  static const String binTypeMismatch = 'Jenis sampah tidak sesuai tempat sampah ini.';
  static const String locationOutOfRange =
      'Anda terlalu jauh dari tempat sampah (> 500m).';
  static const String binNotCritical =
      'Tempat Sampah belum penuh, reset belum diperlukan.';

  // --- Riwayat ---
  static const String riwayatTitle = 'Riwayat Pemilahan';
  static const String riwayatEmpty = 'Belum ada riwayat pemilahan.';

  // --- Poin ---
  static const String poinTitle = 'Poin Saya';
  static const String poinTotal = 'Total Poin Terkumpul';
  static const String poinHistory = 'Riwayat Perolehan Poin';

  // --- Profil ---
  static const String profilTitle = 'Profil Rumah Tangga';
  static const String profilNama = 'Nama';
  static const String profilNIK = 'NIK';
  static const String profilAlamat = 'Alamat';
  static const String profilRT = 'RT';
  static const String profilRW = 'RW';
  static const String profilKelurahan = 'Kelurahan';

  // --- Aktivasi Tempat Sampah ---
  static const String aktivasiTitle = 'Aktivasi Tempat Sampah Baru';
  static const String aktivasiSubtitle =
      'Pindai QR pada tempat sampah baru untuk mengaktifkan';
  static const String aktivasiSuccess = 'Tempat Sampah berhasil diaktivasi!';

  // --- Reset Tempat Sampah ---
  static const String resetTitle = 'Ajukan Pengosongan Tempat Sampah';
  static const String resetSubtitle =
      'Foto tempat sampah penuh sebagai bukti pengajuan reset';
  static const String resetButton = 'Ajukan Reset';
  static const String resetSuccess = 'Pengajuan pengosongan terkirim!';
  static const String resetPending = 'Menunggu persetujuan Petugas Pemilah';

  // --- Offline ---
  static const String offlineBannerMessage =
      'Tidak ada koneksi internet. Beberapa fitur tidak tersedia.';

  // --- Error Generic ---
  static const String errorGeneric = 'Terjadi kesalahan. Silakan coba lagi.';
  static const String errorNetwork =
      'Koneksi bermasalah. Periksa internet Anda.';
}
