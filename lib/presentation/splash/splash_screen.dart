import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/app_colors.dart';
import '../../core/router/app_router.dart';
import '../providers/auth_provider.dart';

/// Splash screen — white bg, animasi stagger smooth untuk mobile.
/// Teks biru+hijau Poppins, dot indicator.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  // Gunakan TickerProviderStateMixin untuk multiple controllers
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

    // Controller untuk judul
    _titleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    // Controller untuk tagline (delayed 200ms setelah judul)
    _taglineController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );

    // Controller untuk dot indicator (delayed 400ms)
    _dotsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    // Animasi judul: fade + slide dari bawah
    _titleFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _titleController, curve: Curves.easeOut));
    _titleSlide = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(
          CurvedAnimation(parent: _titleController, curve: Curves.easeOutCubic),
        );

    // Animasi tagline: fade + slide dari bawah
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

    // Animasi dots: fade
    _dotsFade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _dotsController, curve: Curves.easeOut));

    // Mulai animasi secara stagger
    _startAnimations();
  }

  Future<void> _startAnimations() async {
    // Judul muncul pertama
    await Future.delayed(const Duration(milliseconds: 150));
    if (mounted) _titleController.forward();

    // Tagline muncul 200ms setelah judul
    await Future.delayed(const Duration(milliseconds: 200));
    if (mounted) _taglineController.forward();

    // Dots muncul 150ms setelah tagline
    await Future.delayed(const Duration(milliseconds: 150));
    if (mounted) _dotsController.forward();

    // Navigate setelah semua animasi + pause sejenak
    await Future.delayed(const Duration(milliseconds: 1600));
    if (!mounted) return;

    final authState = ref.read(authProvider);
    Navigator.of(context).pushReplacementNamed(
      authState.isAuthenticated ? AppRoutes.main : AppRoutes.login,
    );
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
            // Konten teks di tengah
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Judul — slide + fade
                      SlideTransition(
                        position: _titleSlide,
                        child: FadeTransition(
                          opacity: _titleFade,
                          child: Text(
                            'Pilah Sampah Cerdas',
                            style: GoogleFonts.poppins(
                              color: AppColors.primaryBlue,
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              height: 1.2,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Tagline — slide + fade (delayed)
                      SlideTransition(
                        position: _taglineSlide,
                        child: FadeTransition(
                          opacity: _taglineFade,
                          child: Text(
                            'Sampah Terdata, Lingkungan Tertata',
                            style: GoogleFonts.poppins(
                              color: AppColors.primaryGreen,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Dot indicator bawah — fade in
            FadeTransition(
              opacity: _dotsFade,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 52),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(3, (i) {
                    final bool active = i == 1;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: active ? 22 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: active
                            ? AppColors.primaryBlue
                            : const Color(0xFFCDD5E0),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    );
                  }),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
