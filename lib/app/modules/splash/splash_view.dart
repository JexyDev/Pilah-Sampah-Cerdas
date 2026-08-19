import 'package:flutter/material.dart';


import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/values/app_assets.dart';
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
                      // Logo Asli Web
                      SlideTransition(
                        position: _titleSlide,
                        child: FadeTransition(
                          opacity: _titleFade,
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 24),
                            child: Image.asset(
                              AppAssets.logo,
                              height: 80,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                      // Judul
                      SlideTransition(
                        position: _titleSlide,
                        child: FadeTransition(
                          opacity: _titleFade,
                          child: Text(
                            'Berseka',
                            style: GoogleFonts.poppins(
                              color: AppColors.primaryGreen,
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              height: 1.2,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Tagline
                      SlideTransition(
                        position: _taglineSlide,
                        child: FadeTransition(
                          opacity: _taglineFade,
                          child: Text(
                            'Sampah Terdata, Lingkungan Tertata',
                            style: GoogleFonts.poppins(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                            textAlign: TextAlign.center,
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


