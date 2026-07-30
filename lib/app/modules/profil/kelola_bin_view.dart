import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/values/app_colors.dart';
import '../../data/models/bin_entity.dart';
import '../auth/controllers/auth_controller.dart';
import '../scan/controllers/scan_controller.dart';
import '../../routes/app_routes.dart';

class KelolaBinView extends ConsumerWidget {
  const KelolaBinView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final binsAsync = ref.watch(binsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Kelola Tong Sampah',
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
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppColors.primaryGreen),
            onPressed: () => Navigator.of(context).pushNamed(AppRoutes.ukurKapasitas),
          ),
        ],
      ),
      backgroundColor: AppColors.backgroundCanvas,
      body: binsAsync.when(
        data: (bins) {
          if (bins.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.delete_outline, size: 64, color: AppColors.textHint),
                  const SizedBox(height: 16),
                  const Text(
                    'Belum ada tong terdaftar.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pushNamed(AppRoutes.ukurKapasitas),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                    ),
                    child: const Text('Tambah Tong Baru'),
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
                child: _BinCardLarge(bin: bin),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}

class _BinCardLarge extends StatelessWidget {
  const _BinCardLarge({required this.bin});
  final BinEntity bin;

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
          Icon(Icons.delete_outline, color: color, size: 40),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOrganic ? 'Bin Organik (Hijau)' : 'Bin Anorganik (Kuning)',
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'ID: ${bin.id}',
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
                      bin.isActive ? 'AKTIF' : 'NON-AKTIF',
                      style: TextStyle(
                        color: bin.isActive ? AppColors.primaryGreen : Colors.red,
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
