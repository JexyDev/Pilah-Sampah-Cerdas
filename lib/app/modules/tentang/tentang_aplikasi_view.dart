import 'package:flutter/material.dart';
import '../../core/values/app_colors.dart';
import '../../core/values/app_dimensions.dart';

class TentangAplikasiView extends StatelessWidget {
  const TentangAplikasiView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Tentang Aplikasi',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/logo/berseka_logo.png',
              width: 120,
              errorBuilder: (context, error, stackTrace) => const Icon(
                Icons.eco_rounded,
                size: 80,
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(height: AppDimensions.xl),
            const Text(
              'BERSEKA',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(height: AppDimensions.sm),
            const Text(
              'Versi 1.0.0',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppDimensions.xxl),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 32.0),
              child: Text(
                'Bersih, Sehat, Kampung Asri.\nAplikasi Manajemen Sampah Pintar.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: AppColors.textHint,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
