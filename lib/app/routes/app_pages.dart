import 'package:flutter/material.dart';
import '../modules/splash/splash_view.dart';
import '../modules/auth/views/login_view.dart';
import '../modules/auth/views/register_view.dart';
import '../modules/auth/views/forgot_password_view.dart';
import '../modules/onboarding/views/onboarding_view.dart';
import '../modules/dashboard/dashboard_view.dart';
import '../modules/scan/views/scan_flow_view.dart';
import '../modules/aktivasi/views/aktivasi_bin_view.dart';
import '../modules/aktivasi/views/ukur_kapasitas_view.dart';
import '../modules/mahasiswa/views/aktivasi_warga_view.dart';
import '../modules/profil/kelola_bin_view.dart';
import '../modules/auth/views/reset_bin_view.dart';
import '../modules/notifikasi/views/notifikasi_view.dart';
import '../modules/petugas_pemilahan/timbangan_pemilahan_view.dart';
import '../modules/tentang/tentang_aplikasi_view.dart';
import '../modules/mahasiswa/views/kkn_attendance_view.dart';
import '../modules/mahasiswa/views/monitoring_warga_view.dart';
import '../modules/mahasiswa/views/mahasiswa_view.dart';
import '../modules/mahasiswa/views/kelompok_kkn_view.dart';
import '../modules/mahasiswa/views/daftar_warga_view.dart';
import '../modules/mahasiswa/views/detail_warga_view.dart';
import '../modules/mahasiswa/views/pemanfaatan_sampah_view.dart';
import '../modules/mahasiswa/views/edit_profil_mahasiswa_view.dart';
import '../modules/mahasiswa/views/pengajuan_izin_form_view.dart';
import '../modules/mahasiswa/views/monitoring_dampak_kelurahan_view.dart';
import '../modules/petugas_pemilahan/views/riwayat_petugas_pemilahan_view.dart';
import '../modules/petugas_pemilahan/views/ganti_password_petugas_view.dart';
import 'app_routes.dart';

import '../modules/mahasiswa/views/mahasiswa_notifikasi_view.dart';
import '../modules/petugas_pemilahan/views/petugas_notification_view.dart';

/// Peta route terpusat untuk MaterialApp.
class AppPages {
  AppPages._();

  static const String initial = AppRoutes.splash;

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return _buildRoute(const SplashView(), settings);
      case AppRoutes.onboarding:
        return _buildRoute(const OnboardingView(), settings);
      case AppRoutes.login:
        return _buildRoute(const LoginView(), settings);
      case AppRoutes.register:
        return _buildRoute(const RegisterView(), settings);
      case AppRoutes.forgotPassword:
        return _buildRoute(const ForgotPasswordView(), settings);
      case AppRoutes.dashboard:
        return _buildRoute(const DashboardView(), settings);
      case AppRoutes.scan:
        return _buildRoute(const ScanFlowView(), settings);
      case AppRoutes.aktivasiBin:
        return _buildRoute(const AktivasiBinView(), settings);
      case AppRoutes.ukurKapasitas:
        return _buildRoute(const UkurKapasitasView(), settings);
      case AppRoutes.kelolaBin:
        return _buildRoute(const KelolaBinView(), settings);
      case AppRoutes.resetBin:
        return _buildRoute(const ResetBinView(), settings);
      case AppRoutes.notifikasi:
        return _buildRoute(const NotifikasiView(), settings);
      case AppRoutes.mahasiswaNotifikasi:
        return _buildRoute(const MahasiswaNotifikasiView(), settings);
      case AppRoutes.petugasNotifikasi:
        return _buildRoute(const PetugasNotificationView(), settings);
      case AppRoutes.timbanganPemilahan:
        return _buildRoute(const TimbanganPemilahanView(), settings);
      case AppRoutes.tentang:
        return _buildRoute(const TentangAplikasiView(), settings);
      case AppRoutes.kknAttendance:
        return _buildRoute(const KknAttendanceView(), settings);
      case AppRoutes.monitoringWarga:
        return _buildRoute(const MonitoringWargaView(), settings);
      case AppRoutes.mahasiswa:
        return _buildRoute(const MahasiswaView(), settings);
      case AppRoutes.kelompokKkn:
        return _buildRoute(const KelompokKknView(), settings);
      case AppRoutes.daftarWarga:
        return _buildRoute(const DaftarWargaView(), settings);
      case AppRoutes.detailWarga:
        return _buildRoute(const DetailWargaView(), settings);
      case AppRoutes.aktivasiWarga:
        return _buildRoute(const AktivasiWargaView(), settings);
      case AppRoutes.pemanfaatanSampah:
        return _buildRoute(const PemanfaatanSampahView(), settings);
      case AppRoutes.editProfilMahasiswa:
        return _buildRoute(const EditProfilMahasiswaView(), settings);
      case AppRoutes.pengajuanIzin:
        final args = settings.arguments as Map<String, dynamic>?;
        return _buildRoute(
          PengajuanIzinFormView(
            scheduleId: args?['scheduleId'] as String?,
            scheduleTitle: args?['scheduleTitle'] as String?,
          ),
          settings,
        );
      case AppRoutes.riwayatPetugasPemilahan:
        return _buildRoute(const RiwayatPetugasPemilahanView(), settings);
      case AppRoutes.petugasPemilahanGantiPassword:
        return _buildRoute(const GantiPasswordPetugasView(), settings);
      case AppRoutes.monitoringDampakKelurahan:
        return _buildRoute(const MonitoringDampakKelurahanView(), settings);
      default:
        return _buildRoute(const _NotFoundScreen(), settings);
    }
  }

  static PageRouteBuilder<dynamic> _buildRoute(
    Widget page,
    RouteSettings settings,
  ) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        return FadeTransition(opacity: animation, child: child);
      },
      transitionDuration: const Duration(milliseconds: 200),
    );
  }
}

class _NotFoundScreen extends StatelessWidget {
  const _NotFoundScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text(
          'Halaman tidak ditemukan.',
          style: Theme.of(context).textTheme.bodyLarge,
        ),
      ),
    );
  }
}

