import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/values/app_colors.dart';
import '../scan/controllers/scan_controller.dart';
import '../../routes/app_routes.dart';
import '../../data/models/bin_entity.dart';
import '../auth/controllers/auth_controller.dart';
import '../../data/models/user_entity.dart';

class KelolaBinView extends ConsumerWidget {
  const KelolaBinView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final binsAsync = ref.watch(binsProvider);
    final userAsync = ref.watch(authProvider);
    final user = userAsync.user;

    return Scaffold(
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        title: const Text(
          'Kelola Tempat Sampah',
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
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Navigator.maybePop(context),
        ),
      ),
      backgroundColor: AppColors.backgroundCanvas,
      body: binsAsync.when(
        skipLoadingOnReload: true,
        data: (bins) {
          if (bins.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.delete_rounded,
                    size: 64,
                    color: AppColors.textHint,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Belum ada tempat sampah terdaftar.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ],
              ),
            );
          }
          final hasOrganic = bins.any(
            (b) => b.binType == WasteType.organic && b.isActive,
          );
          final hasNonOrganic = bins.any(
            (b) => b.binType == WasteType.nonOrganic && b.isActive,
          );
          final isMissingOne =
              (hasOrganic && !hasNonOrganic) || (!hasOrganic && hasNonOrganic);

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: bins.length + (isMissingOne ? 1 : 0),
            itemBuilder: (context, index) {
              if (isMissingOne && index == 0) {
                final missingName =
                    hasOrganic ? 'Anorganik (Kuning)' : 'Organik (Hijau)';
                final existingName = hasOrganic ? 'Organik' : 'Anorganik';
                final missingColor =
                    hasOrganic ? AppColors.nonOrganicColor : AppColors.organicColor;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: missingColor.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(14),
                      border:
                          Border.all(color: missingColor.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          color: missingColor,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Tempat Sampah Belum Lengkap',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: missingColor,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Anda baru memiliki Tempat Sampah $existingName aktif. Harap aktivasi Tempat Sampah $missingName untuk melengkapi pemilahan dan pengumpulan poin sampah.',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textPrimary,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }

              final bin = bins[isMissingOne ? index - 1 : index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _BinCardLarge(bin: bin, user: user),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Builder(
            builder: (context) {
              final bins = binsAsync.value ?? [];
              final hasOrganic = bins.any(
                (b) => b.binType == WasteType.organic && b.isActive,
              );
              final hasNonOrganic = bins.any(
                (b) => b.binType == WasteType.nonOrganic && b.isActive,
              );
              String buttonText = 'Tambah Tempat Sampah Baru';
              if (!hasOrganic && !hasNonOrganic) {
                buttonText = 'Aktivasi Tempat Sampah (Sepasang)';
              } else if (hasOrganic && !hasNonOrganic) {
                buttonText = 'Aktivasi Tempat Sampah Anorganik';
              } else if (!hasOrganic && hasNonOrganic) {
                buttonText = 'Aktivasi Tempat Sampah Organik';
              }

              return ElevatedButton(
                onPressed: () => _onTambahBinPressed(context, bins),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    buttonText,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _onTambahBinPressed(BuildContext context, List<BinEntity> bins) {
    final hasOrganic = bins.any(
      (b) => b.binType == WasteType.organic && b.isActive,
    );
    final hasNonOrganic = bins.any(
      (b) => b.binType == WasteType.nonOrganic && b.isActive,
    );
    final isPostOnboarding = hasOrganic && hasNonOrganic;

    if (!isPostOnboarding) {
      if (hasOrganic && !hasNonOrganic) {
        Navigator.of(context).pushNamed(
          AppRoutes.ukurKapasitas,
          arguments: {'targetType': 'non_organic'},
        );
      } else if (!hasOrganic && hasNonOrganic) {
        Navigator.of(context).pushNamed(
          AppRoutes.ukurKapasitas,
          arguments: {'targetType': 'organic'},
        );
      } else {
        Navigator.of(context).pushNamed(
          AppRoutes.ukurKapasitas,
          arguments: {'targetType': 'both'},
        );
      }
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: Colors.white,
      builder: (sheetCtx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Tambah Tempat Sampah Baru',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Pilih kategori Tempat Sampah yang ingin Anda daftarkan:',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              _buildOptionTile(
                context: context,
                sheetCtx: sheetCtx,
                title: 'Tempat Sampah Organik (1 Wadah)',
                subtitle: 'Khusus sampah basah, sisa makanan, dan kompos',
                color: AppColors.organicColor,
                icon: Icons.eco_rounded,
                targetType: 'organic',
              ),
              const SizedBox(height: 10),
              _buildOptionTile(
                context: context,
                sheetCtx: sheetCtx,
                title: 'Tempat Sampah Anorganik (1 Wadah)',
                subtitle: 'Khusus sampah plastik, botol, kertas, dan daur ulang',
                color: AppColors.nonOrganicColor,
                icon: Icons.category_rounded,
                targetType: 'non_organic',
              ),
              const SizedBox(height: 10),
              _buildOptionTile(
                context: context,
                sheetCtx: sheetCtx,
                title: 'Sepasang Tempat Sampah (2 Wadah)',
                subtitle: 'Daftarkan 1 Organik dan 1 Anorganik sekaligus',
                color: AppColors.primaryGreen,
                icon: Icons.all_inclusive_rounded,
                targetType: 'both',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionTile({
    required BuildContext context,
    required BuildContext sheetCtx,
    required String title,
    required String subtitle,
    required Color color,
    required IconData icon,
    required String targetType,
  }) {
    return InkWell(
      onTap: () {
        Navigator.pop(sheetCtx);
        Navigator.of(context).pushNamed(
          AppRoutes.ukurKapasitas,
          arguments: {'targetType': targetType},
        );
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.3)),
          color: color.withValues(alpha: 0.05),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 14,
              color: AppColors.textHint,
            ),
          ],
        ),
      ),
    );
  }
}

class _BinCardLarge extends StatelessWidget {
  const _BinCardLarge({required this.bin, this.user});
  final BinEntity bin;
  final UserEntity? user;

  String _getDisplayStatus(BinEntity bin) {
    if (!bin.isActive) {
      return 'NON AKTIF (Dinonaktifkan di Web)';
    }
    if (bin.isResetPending) {
      return 'DIAJUKAN PENGOSONGAN';
    }
    final raw = bin.backendStatus.toUpperCase();
    if (raw == 'RUSAK' || raw == 'BROKEN' || raw == 'PERBAIKAN') {
      return 'PERBAIKAN';
    }
    if (raw == 'NORMAL' || raw == 'AMAN') {
      return 'AMAN';
    }
    if (raw == 'SEDANG') {
      return 'SEDANG';
    }
    if (raw == 'PENUH') {
      return 'PENUH';
    }
    // Sesuai Web (STATUS KAPASITAS: AMAN < 70%, SEDANG 70-90%, PENUH > 90%)
    if (bin.capacityPercent > 0.90) {
      return 'PENUH';
    } else if (bin.capacityPercent >= 0.70) {
      return 'SEDANG';
    }
    return 'AMAN';
  }

  Color _getDisplayStatusColor(String status) {
    switch (status) {
      case 'AMAN':
        return AppColors.primaryGreen;
      case 'SEDANG':
      case 'DIAJUKAN PENGOSONGAN':
        return AppColors.warningYellow;
      case 'PENUH':
      case 'PERBAIKAN':
      case 'NON AKTIF (Dinonaktifkan di Web)':
      default:
        return AppColors.dangerRed;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOrganic = bin.binType == WasteType.organic;
    final color = isOrganic
        ? AppColors.organicColor
        : AppColors.nonOrganicColor;
    final displayStatus = _getDisplayStatus(bin);
    final statusColor = _getDisplayStatusColor(displayStatus);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.delete_rounded, color: color, size: 40),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isOrganic
                          ? 'Tempat Sampah Organik'
                          : 'Tempat Sampah Anorganik',
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Pemilik: ${user?.name ?? '-'}',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'ID Tempat Sampah: ${bin.qrSerial}',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      'Kapasitas Maksimal: ${bin.maxCapacityL.toStringAsFixed(0)} Liter (Est. ${bin.maxWeightKg.toStringAsFixed(1)} kg)',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text(
                          'Status: ',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          displayStatus,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: bin.isActive ? bin.capacityPercent.clamp(0.0, 1.0) : 0.0,
              minHeight: 8,
              backgroundColor: bin.isActive
                  ? AppColors.border
                  : Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation<Color>(
                bin.isActive ? color : Colors.grey,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            bin.isResetPending
                ? 'Pengajuan pengosongan sedang diproses'
                : '${(bin.capacityPercent * 100).toStringAsFixed(0)}% terisi — ${bin.currentVolumeL.toStringAsFixed(0)} / ${bin.maxCapacityL.toStringAsFixed(0)} L (Est. ${bin.currentWeightKg.toStringAsFixed(1)} / ${bin.maxWeightKg.toStringAsFixed(1)} kg)',
            style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}
