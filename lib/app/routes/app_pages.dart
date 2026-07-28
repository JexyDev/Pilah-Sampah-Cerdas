import 'package:flutter/material.dart';
import '../modules/splash/splash_view.dart';
import '../modules/auth/views/login_view.dart';
import '../modules/auth/views/register_view.dart';
import '../modules/auth/views/forgot_password_view.dart';
import '../modules/dashboard/dashboard_view.dart';
import '../modules/scan/views/scan_flow_view.dart';
import '../modules/aktivasi/views/aktivasi_bin_view.dart';
import '../modules/aktivasi/views/ukur_kapasitas_view.dart';
import '../modules/profil/kelola_bin_view.dart';
import '../modules/auth/views/reset_bin_view.dart';
import '../modules/notifikasi/views/notifikasi_view.dart';
import '../modules/petugas_residu/timbangan_residu_view.dart';
import '../modules/tentang/tentang_aplikasi_view.dart';
import '../modules/monitoring_warga/views/kkn_attendance_view.dart';
import '../modules/monitoring_warga/views/monitoring_warga_view.dart';
import 'app_routes.dart';

/// Route generator terpusat.
class AppPages {
  AppPages._();

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return _buildRoute(const SplashView(), settings);
      case AppRoutes.login:
        return _buildRoute(const LoginView(), settings);
      case AppRoutes.register:
        return _buildRoute(const RegisterView(), settings);
      case AppRoutes.forgotPassword:
        return _buildRoute(const ForgotPasswordView(), settings);
      case AppRoutes.main:
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
      case AppRoutes.timbanganResidu:
        return _buildRoute(const TimbanganResiduView(), settings);
      case AppRoutes.tentang:
        return _buildRoute(const TentangAplikasiView(), settings);
      case AppRoutes.kknAttendance:
        return _buildRoute(const KknAttendanceView(), settings);
      case AppRoutes.monitoringWarga:
        return _buildRoute(const MonitoringWargaView(), settings);
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
