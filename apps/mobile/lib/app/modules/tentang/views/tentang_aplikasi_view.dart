import 'package:flutter/material.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_assets.dart';
import '../../../core/values/app_config.dart';
import '../../../core/values/app_text_styles.dart';

class TentangAplikasiView extends StatelessWidget {
  const TentangAplikasiView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tentang Aplikasi'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
      ),
      backgroundColor: Colors.white,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
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
              const SizedBox(height: 24),
              Text(
                AppConfig.appName,
                style: AppTextStyles.h1.copyWith(
                  fontSize: 28,
                  color: AppColors.primaryGreen,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Versi 1.0.0',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'TrashCare adalah platform manajemen pemilahan sampah cerdas yang bertujuan untuk meningkatkan kepatuhan dan efisiensi pengelolaan sampah di lingkungan masyarakat.',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMedium,
              ),
              const SizedBox(height: 32),
              const Text(
                'Hak Cipta © 2026 Universitas Komputer Indonesia.\nSeluruh hak dilindungi undang-undang.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
