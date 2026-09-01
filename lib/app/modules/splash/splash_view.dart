import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher_string.dart';
import '../../core/values/api_constants.dart';
import '../../data/providers/repository_providers.dart';



import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/values/app_colors.dart';
import '../../routes/app_routes.dart';
import '../auth/controllers/auth_controller.dart';

/// Splash screen — white bg, animasi stagger smooth untuk mobile.
/// Menggunakan logo resmi dan Plus Jakarta Sans.
class SplashView extends ConsumerStatefulWidget {
  const SplashView({super.key});

  @override
  ConsumerState<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends ConsumerState<SplashView>
    with TickerProviderStateMixin {
  bool _isOutdated = false;
  String _updateUrl = '';

  bool _isVersionLower(String current, String minReq) {
    final cParts = current.split('.');
    final mParts = minReq.split('.');
    for (int i = 0; i < 3; i++) {
      final c = i < cParts.length ? int.tryParse(cParts[i]) ?? 0 : 0;
      final m = i < mParts.length ? int.tryParse(mParts[i]) ?? 0 : 0;
      if (c < m) return true;
      if (c > m) return false;
    }
    return false;
  }

  late AnimationController _titleController;
  late AnimationController _taglineController;
  late AnimationController _dotsController;

  late Animation<double> _titleFade;
  late Animation<Offset> _titleSlide;
  late Animation<double> _taglineFade;
  late Animation<Offset> _taglineSlide;
  late Animation<double> _dotsFade;

  @override
  void initState() {
    super.initState();

    _titleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _taglineController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );

    _dotsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _titleFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _titleController, curve: Curves.easeOut));
    _titleSlide = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(
          CurvedAnimation(parent: _titleController, curve: Curves.easeOutCubic),
        );

    _taglineFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _taglineController, curve: Curves.easeOut),
    );
    _taglineSlide = Tween<Offset>(begin: const Offset(0, 0.4), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _taglineController,
            curve: Curves.easeOutCubic,
          ),
        );

    _dotsFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _dotsController, curve: Curves.easeOut));

    _startAnimations();
  }

  Future<void> _startAnimations() async {
    await Future.delayed(const Duration(milliseconds: 150));
    if (mounted) _titleController.forward();

    await Future.delayed(const Duration(milliseconds: 200));
    if (mounted) _taglineController.forward();

    await Future.delayed(const Duration(milliseconds: 150));
    if (mounted) _dotsController.forward();

    await Future.delayed(const Duration(milliseconds: 1600));
    if (!mounted) return;


    // Version check
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.get(ApiEndpoints.appVersion).timeout(const Duration(seconds: 3));
      if (res.statusCode == 200 && res.data['min_required_version'] != null) {
          final minVer = res.data['min_required_version'].toString();
          final latestVer = res.data['latest_version']?.toString() ?? minVer;
          final updateUrl = res.data['update_url']?.toString() ?? 'https://play.google.com/store/apps/details?id=com.berseka.app';
          final packageInfo = await PackageInfo.fromPlatform();
          final currentVer = packageInfo.version;
          
          if (_isVersionLower(currentVer, minVer)) {
            if (mounted) {
              setState(() {
                _isOutdated = true;
                _updateUrl = updateUrl;
              });
            }
            return; // Halt flow completely
          } else if (_isVersionLower(currentVer, latestVer)) {
            // Optional Update Dialog
            if (mounted) {
              await showDialog(
                context: context,
                barrierDismissible: false,
                builder: (ctx) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  title: const Text('Update Tersedia', style: TextStyle(fontWeight: FontWeight.bold)),
                  content: const Text('Versi terbaru BERSEKA telah tersedia. Apakah Anda ingin memperbaruinya sekarang?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Nanti Saja', style: TextStyle(color: Colors.grey)),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen, elevation: 0),
                      onPressed: () {
                        launchUrlString(updateUrl, mode: LaunchMode.externalApplication);
                        Navigator.pop(ctx);
                      },
                      child: const Text('Update', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              );
            }
          }
        }
      } catch (_) {}

    // Fix bug splash stuck: tambahkan timeout 3 detik sebagai fallback

    try {
      await ref
          .read(authProvider.notifier)
          .initialized
          .timeout(const Duration(seconds: 3));
    } catch (e) {
      debugPrint('Initialization failed or timed out: $e');
    }

    if (!mounted) return;

    final authState = ref.read(authProvider);
    if (authState.isAuthenticated) {
      final user = authState.user;
      if (user != null) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.main);
      } else {
        Navigator.of(context).pushReplacementNamed(AppRoutes.main);
      }
    } else {
      Navigator.of(context).pushReplacementNamed(AppRoutes.login);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _taglineController.dispose();
    _dotsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isOutdated) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.system_update_rounded, size: 80, color: Colors.orange),
                const SizedBox(height: 16),
                const Text('Versi Kedaluwarsa', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Versi aplikasi Anda sudah terlalu lama. Silakan perbarui aplikasi BERSEKA untuk melanjutkan.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54)),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () => launchUrlString(_updateUrl, mode: LaunchMode.externalApplication),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))
                  ),
                  child: const Text('Update Sekarang', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                )
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Logo Asli (Transparent Circle)
                      SlideTransition(
                        position: _titleSlide,
                        child: FadeTransition(
                          opacity: _titleFade,
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Image.asset(
                              'assets/app-logo.png', // The circle icon requested
                              height: 100,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                      // Text BERSEKA
                      SlideTransition(
                        position: _titleSlide,
                        child: FadeTransition(
                          opacity: _titleFade,
                          child: Text(
                            'BERSEKA',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 34,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF005841), // Dark Green dari desain
                              letterSpacing: 1.2,
                              height: 1.1,
                            ),
                          ),
                        ),
                      ),
                      // Tagline (Sesuai Icon)
                      SlideTransition(
                        position: _taglineSlide,
                        child: FadeTransition(
                          opacity: _taglineFade,
                          child: Text(
                            'Bersih, Sehat, Kampung Asri',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF5CA432), // Light Green dari desain
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Loading indicator bawah
            FadeTransition(
              opacity: _dotsFade,
              child: const Padding(
                padding: EdgeInsets.only(bottom: 52),
                child: SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


