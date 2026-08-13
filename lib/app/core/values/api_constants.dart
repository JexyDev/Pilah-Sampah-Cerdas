class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String login = '/auth/login';
  static const String registerWarga = '/auth/register/warga';
  static const String registerMahasiswa = '/auth/register/mahasiswa-kkn';
  static const String registerPetugas = '/auth/register/petugas-pemilahan';
  static const String requestOtp = '/auth/request-otp';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String uploadAvatar = '/auth/upload-avatar';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String changePassword = '/auth/change-password';
  static const String authPassword = '/auth/password';

  // Area & Household
  static const String householdsMe = '/households/me';
  static const String wilayahKecamatan = '/areas/kecamatan';
  static const String wilayahRw = '/areas/rw';
  static const String wilayahRt = '/areas/rt';
  static const String areasKelurahan = '/areas/kelurahan';
  static const String areasRtRw = '/areas/rt-rw';

  // Bin & Waste
  static const String binsMy = '/bins/my';
  static const String binsMyBins = '/bins/my-bins';
  static const String binsScan = '/bins/scan';
  static const String binsActivate = '/bins/activate';
  static const String binsMeasure = '/bins/measure';
  static const String binsReset = '/bins/reset';
  static const String aiDetect = 'https://trashcare.id/api/v1/ai/detect';
  static const String wasteDetect = '/waste/detect';

  // Transactions & Points
  static const String transactionsDeposits = '/transactions/deposits';
  static const String transactionsMyDeposits = '/transactions/my-deposits';
  static const String pointsMe = '/points/me';
  static const String pointsLeaderboard = '/points/leaderboard';

  // KKN
  static const String kknDashboard = '/kkn/dashboard';
  static const String kknWargaDampingan = '/kkn/warga-dampingan';
  static const String kknActivityLog = '/kkn/activity-log';
  static const String kknActiveZone = '/kkn/active-zone';
  static const String kknLocationPing = '/kkn/location-ping';
  static const String kknCheckIn = '/kkn/attendance/check-in';
  static const String kknWarga = '/kkn/warga';
  static const String kknActivateByScan = '/kkn/warga/activate-by-scan';
  static const String kknActivateBin = '/kkn/warga/activate-bin';
  static const String kknHistory = '/kkn/history';
  static const String kknKelompokMe = '/kkn/kelompok/me';
  static const String kknPemanfaatanSampah = '/kkn/pemanfaatan-sampah';
  static const String kknPengajuanIzin = '/kkn/pengajuan-izin';

  // Schedules
  static const String schedules = '/schedules';
  static String kegiatanLokasi(String id) => '/schedules/$id/lokasi';
  static String kegiatanAbsen(String id) => '/schedules/$id/absen';

  // Petugas Pemilahan
  static const String petugasDashboard = '/petugas-pemilahan/dashboard';
  static const String petugasJadwalHarian = '/petugas-pemilahan/jadwal-harian';
  static const String petugasSubmitLog = '/petugas-pemilahan/submit-log';
  static const String petugasRiwayat = '/petugas-pemilahan/riwayat';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsReadAll = '/notifications/read-all';
  static const String notificationsDeviceToken = '/notifications/device-token';
  static const String notificationsUnregisterToken = '/notifications/unregister-token';
  static String notificationsRead(String id) => '/notifications/$id/read';
}

