import 'package:flutter/material.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/notification_entity.dart';

class DetailNotifikasiView extends StatelessWidget {
  const DetailNotifikasiView({super.key});

  Color _resolveIconBg(String type) {
    switch (type.toUpperCase()) {
      case 'POIN_BERTAMBAH':
        return const Color(0xFFFEF3C7);
      case 'TONG_PENUH':
        return const Color(0xFFFEE2E2);
      case 'PENGAJUAN_PENGOSONGAN':
      case 'PENGAJUAN_DISETUJUI':
        return const Color(0xFFD1FAE5);
      case 'PENGAJUAN_DITOLAK':
        return const Color(0xFFFEE2E2);
      default:
        return const Color(0xFFE0E7FF);
    }
  }

  Color _resolveIconColor(String type) {
    switch (type.toUpperCase()) {
      case 'POIN_BERTAMBAH':
        return const Color(0xFFD97706);
      case 'TONG_PENUH':
        return const Color(0xFFDC2626);
      case 'PENGAJUAN_PENGOSONGAN':
      case 'PENGAJUAN_DISETUJUI':
        return const Color(0xFF059669);
      case 'PENGAJUAN_DITOLAK':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF4F46E5);
    }
  }

  IconData _resolveIcon(String iconName, String type) {
    if (type.toUpperCase().contains('PUNISHMENT') || type.toUpperCase().contains('PENALTI')) {
      return Icons.warning_rounded;
    }
    switch (iconName) {
      case 'star':
        return Icons.star_rounded;
      case 'warning':
        return Icons.warning_rounded;
      case 'delete_sweep':
        return Icons.delete_sweep_rounded;
      case 'check_circle':
        return Icons.check_circle_rounded;
      case 'info':
      default:
        return Icons.info_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = ModalRoute.of(context)?.settings.arguments as NotificationEntity?;

    if (item == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Detail Notifikasi'),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.textPrimary,
        ),
        body: const Center(child: Text('Data notifikasi tidak ditemukan.')),
      );
    }

    final isPunishment = item.type.toUpperCase().contains('PUNISHMENT') || item.title.toUpperCase().contains('PENALTI');
    final iconColor = isPunishment ? const Color(0xFFEF4444) : _resolveIconColor(item.type);
    final iconBg = isPunishment ? const Color(0xFFFEE2E2) : _resolveIconBg(item.type);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Detail Notifikasi',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.maybePop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimensions.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: AppDimensions.xl),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _resolveIcon(item.icon, item.type),
                color: iconColor,
                size: 64,
              ),
            ),
            const SizedBox(height: AppDimensions.xl),
            Text(
              item.title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppDimensions.sm),
            Text(
              item.time,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textHint,
              ),
            ),
            const SizedBox(height: AppDimensions.xl),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppDimensions.lg),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppDimensions.radiusLg),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                item.desc,
                style: const TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: AppDimensions.xxl),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.maybePop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Kembali',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
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
