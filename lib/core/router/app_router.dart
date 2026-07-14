import 'package:flutter/material.dart';
import '../../presentation/splash/splash_screen.dart';
import '../../presentation/auth/login_screen.dart';
import '../../presentation/main/main_shell.dart';
import '../../presentation/scan/scan_flow_screen.dart';
import '../../presentation/aktivasi/aktivasi_bin_screen.dart';
import '../../presentation/reset/reset_bin_screen.dart';

/// Nama-nama route terpusat agar tidak ada magic string di widget.
class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String login = '/login';
  static const String main = '/main';
  static const String scan = '/scan';
  static const String aktivasiBin = '/aktivasi-bin';
  static const String resetBin = '/reset-bin';
}

/// Route generator terpusat.
class AppRouter {
  AppRouter._();

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return _buildRoute(const SplashScreen(), settings);
      case AppRoutes.login:
        return _buildRoute(const LoginScreen(), settings);
      case AppRoutes.main:
        return _buildRoute(const MainShell(), settings);
      case AppRoutes.scan:
        return _buildRoute(const ScanFlowScreen(), settings);
      case AppRoutes.aktivasiBin:
        return _buildRoute(const AktivasiBinScreen(), settings);
      case AppRoutes.resetBin:
        return _buildRoute(const ResetBinScreen(), settings);
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
