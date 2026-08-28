class ApiEndpoints {
  static const String kknActiveTimeline = '/kkn/timeline/active';
  ApiEndpoints._();

  // Auth
  static const String login = '/auth/login';
  static const String registerWarga = '/auth/register/warga';
  static const String registerMahasiswa = '/auth/register/mahasiswa-kkn';
  static const String registerPetugas = '/auth/register/petugas-residu';
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
  static const String binsResetRequests = '/bins/reset-requests';
  static String binsApproveReset(String id) => '/bins/reset/$id/approve';
  static const String binsResetPetugasStatus = '/bins/reset/petugas-status';
  static const String binsResetPetugasWilayah = '/bins/reset/petugas-wilayah';
  static const String binsResetSetDefaultPetugas = '/bins/reset/set-default-petugas';
  static const String aiDetect = '/ai/detect';
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
  static const String kknAbsen = '/kkn/absen';
  static const String kknWarga = '/kkn/warga';
  static const String kknActivateByScan = '/kkn/warga/activate-by-scan';
  static const String kknActivateBin = '/kkn/warga/activate-bin';
  static const String kknHistory = '/kkn/history';
  static const String kknKelompokMe = '/kkn/kelompok/me';
  static const String kknWilayahKelompok = '/kkn/wilayah-kelompok';
  static const String timesheetSummary = '/timesheet/summary';
  static String kknClaimWarga(String wargaId) => '/kkn/warga/$wargaId/claim';
  
  // 3 Pilar KKN
  static const String kknProgramKerja = '/kkn/program-kerja';
  static const String kknPanenHasil = '/kkn/panen-hasil';
  static const String kknPemanfaatanSampah = '/kkn/pemanfaatan-sampah';
  static const String kknPemanfaatanUnharvested = '/kkn/pemanfaatan-sampah/unharvested';
  static const String kknPengajuanIzin = '/kkn/pengajuan-izin';
  static const String kknPoskoRegister = '/kkn/posko/register';
  static const String logbookMahasiswa = '/logbook/mahasiswa';
  static const String kknPoskoMe = '/kkn/posko/me';
  static const String kknFacilities = '/facilities';
  static const String kknFasilitasJenis = '/kkn/fasilitas/jenis';
  static const String kknFasilitasBantuInput = '/facilities';
  static const String kknHandover = '/kkn/handover';

  // KKN Kegiatan (GPS Presensi Berbasis Kegiatan)
  static const String kknKegiatanAktif = '/kkn/kegiatan-aktif';
  static String kknMulaiKegiatan(String id) => '/kkn/kegiatan/$id/mulai';
  static String kknSelesaiKegiatan(String id) => '/kkn/kegiatan/$id/selesai';
  static String kknJedaKegiatan(String id) => '/kkn/kegiatan/$id/jeda';
  static String kknCheckOut(String id) => '/kkn-attendance/kegiatan/$id/check-out';
  static String kknPresensiHistory(String id) => '/kkn/kegiatan/$id/presensi-history';
  static const String kknOutOfZoneViolation = '/kkn/out-of-zone-violation';

  // Schedules
  static const String schedules = '/schedules';
  static String kegiatanLokasi(String id) => '/kegiatan/$id/lokasi';
  static String kegiatanAbsen(String id) => '/kegiatan/$id/absen';

  // Petugas Pemilahan
  static const String petugasDashboard = '/petugas-residu/dashboard';
  static const String petugasJadwalHarian = '/petugas-residu/jadwal-harian';
  static const String petugasSubmitLog = '/petugas-residu/submit-log';
  static const String petugasRiwayat = '/petugas-residu/riwayat';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsReadAll = '/notifications/read-all';
  static const String notificationsDeviceToken = '/notifications/device-token';
  static const String notificationsUnregisterToken = '/notifications/unregister-token';
  static String notificationsRead(String id) => '/notifications/$id/read';

  // Pemanfaatan & Evaluasi Warga
  static const String pemanfaatan = '/pemanfaatan';
  static String pemanfaatanDetail(String id) => '/pemanfaatan/$id';
  static const String pemanfaatanFeedback = '/pemanfaatan/feedback';
  static String pemanfaatanFeedbackTanggapan(String id) => '/pemanfaatan/feedback/$id/tanggapan';
  static String pemanfaatanFeedbackDelete(String id) => '/pemanfaatan/feedback/$id';
}

