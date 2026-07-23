/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/app_assets.dart';
import '../../core/constants/app_colors.dart';
import '../../core/router/app_router.dart';
import '../providers/auth_provider.dart';

/// Splash screen — white bg, animasi stagger smooth untuk mobile.
/// Menggunakan logo resmi dan Plus Jakarta Sans.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
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
                            child: Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: Image.asset(
                                AppAssets.logo,
                                fit: BoxFit.cover,
                              ),
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
                            'TrashCare',
                            style: GoogleFonts.plusJakartaSans(
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
                            style: GoogleFonts.plusJakartaSans(
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
