import 'package:flutter/material.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';

/// State UI khusus jika Akun Petugas Pemilahan belum di-approve oleh Admin/RW
class PetugasWhitelistGuardWidget extends StatelessWidget {
  const PetugasWhitelistGuardWidget({
    super.key,
    required this.onRefresh,
    this.statusText = 'PENDING',
  });

  final VoidCallback onRefresh;
  final String statusText;

  @override
  Widget build(BuildContext context) {
    final isRejected = statusText.toUpperCase() == 'REJECTED';

    return Container(
      margin: const EdgeInsets.all(AppDimensions.md),
      padding: const EdgeInsets.all(AppDimensions.lg),
      decoration: BoxDecoration(
        color: isRejected ? AppColors.dangerRed : AppColors.warningYellow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isRejected ? AppColors.dangerRed.withValues(alpha: 0.3) : AppColors.warningYellow,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: (isRejected ? AppColors.dangerRed : AppColors.warningYellow).withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isRejected ? AppColors.dangerRed : AppColors.warningYellow,
              shape: BoxShape.circle,
            ),
            child: Icon(
              isRejected ? Icons.cancel_outlined : Icons.hourglass_top_rounded,
              color: isRejected ? AppColors.dangerRed : AppColors.warningYellow,
              size: 40,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isRejected ? 'Pendaftaran Ditolak' : 'Menunggu Persetujuan RW / Admin DLH',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: isRejected ? AppColors.dangerRed : AppColors.warningYellow,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isRejected
                ? 'Pengajuan akun Petugas Pemilahan Anda ditolak oleh Admin. Silakan hubungi pengurus RW setempat untuk informasi lebih lanjut.'
                : 'Akun Anda telah terdaftar sebagai Petugas Pemilahan dan sedang dalam tahap verifikasi Whitelist RW/Admin. Fitur input sampah pemilahan ke RW akan otomatis aktif setelah akun Anda disetujui.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: onRefresh,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Cek Status Terbaru'),
            style: ElevatedButton.styleFrom(
              backgroundColor: isRejected ? AppColors.dangerRed : AppColors.warningYellow,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }
}

