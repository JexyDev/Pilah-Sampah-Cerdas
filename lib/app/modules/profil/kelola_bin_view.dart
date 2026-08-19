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
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.maybePop(context),
        ),
      ),
      backgroundColor: AppColors.backgroundCanvas,
      body: binsAsync.when(skipLoadingOnReload: true, data: (bins) {
          if (bins.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset('assets/icons/recycle-bin.png', color: AppColors.textHint, width: 64, height: 64),
                  SizedBox(height: 16),
                  Text(
                    'Belum ada tempat sampah terdaftar.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: bins.length,
            itemBuilder: (context, index) {
              final bin = bins[index];
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
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).pushNamed(AppRoutes.ukurKapasitas),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Tambah Tempat Sampah Baru',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ),
    );
  }
}

class _BinCardLarge extends StatelessWidget {
  const _BinCardLarge({required this.bin, this.user});
  final BinEntity bin;
  final UserEntity? user;

  @override
  Widget build(BuildContext context) {
    final isOrganic = bin.binType == WasteType.organic;
    final color = isOrganic ? AppColors.organicColor : AppColors.nonOrganicColor;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Image.asset('assets/icons/recycle-bin.png', color: color, width: 40, height: 40),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOrganic ? 'Tempat Sampah Organik' : 'Tempat Sampah Anorganik',
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
                Text(
                  'User ID: ${user?.id ?? '-'}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'ID Tempat Sampah: ${bin.qrSerial}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                Text(
                  'Kapasitas Maksimal: ${bin.maxCapacityL} L',
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
                      bin.backendStatus.isNotEmpty ? bin.backendStatus.replaceAll('_', ' ').toUpperCase() : (bin.isActive ? 'AKTIF' : 'NON-AKTIF'),
                      style: TextStyle(
                        color: (bin.backendStatus.toUpperCase() == 'ACTIVE_BOUND' || bin.backendStatus.toUpperCase() == 'AKTIF' || (bin.backendStatus.isEmpty && bin.isActive)) ? AppColors.primaryGreen : AppColors.dangerRed,
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
    );
  }
}
