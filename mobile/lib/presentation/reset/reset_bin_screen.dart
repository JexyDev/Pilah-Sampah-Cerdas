import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/app_config.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/constants/app_dimensions.dart';
import '../../domain/entities/bin_entity.dart';
import '../../domain/entities/bin_reset_entity.dart';
import '../providers/auth_provider.dart';
import '../providers/bin_provider.dart';
import '../shared/widgets/app_loading.dart';

/// Halaman pengajuan pengosongan tong.
/// Sesuai prd.md §3.1 dan ui_ux_flow.md §3: failed_scan_step_1.png
class ResetBinScreen extends ConsumerWidget {
  const ResetBinScreen({super.key});

  String _mapError(String code, String? message) {
    switch (code) {
      case 'BIN_NOT_CRITICAL':
        return AppStrings.binNotCritical;
      case 'RESOURCE_NOT_FOUND':
        return 'Tong tidak ditemukan.';
      default:
        return message ?? AppStrings.errorGeneric;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resetState = ref.watch(resetBinProvider);
    final binsAsync = ref.watch(binsProvider);
    final user = ref.watch(authProvider).user;
    final String userId = user?.id ?? AppConfig.mockUserId;

    // Error listener — tampilkan SnackBar saat ada error dari provider
    ref.listen(resetBinProvider, (_, next) {
      if (next.errorCode != null && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_mapError(next.errorCode!, next.errorMessage)),
            backgroundColor: AppColors.dangerRed,
          ),
        );
        ref.read(resetBinProvider.notifier).reset();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(title: const Text(AppStrings.resetTitle)),
      body: Padding(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: _buildBody(context, ref, resetState, binsAsync, userId),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    ResetBinState resetState,
    AsyncValue<List<BinEntity>> binsAsync,
    String userId,
  ) {
    if (resetState.isLoading) {
      return const AppLoading(message: 'Mengirim pengajuan...');
    }

    if (resetState.isSuccess) {
      return _buildSuccess(context, ref, resetState.result!);
    }

    return binsAsync.when(
      data: (bins) {
        final List<BinEntity> criticalBins = bins
            .where((b) => b.isCritical)
            .toList();
        return _buildForm(context, ref, criticalBins, userId);
      },
      loading: () => const AppLoading(),
      error: (_, __) => const Center(child: Text(AppStrings.errorGeneric)),
    );
  }

  Widget _buildForm(
    BuildContext context,
    WidgetRef ref,
    List<BinEntity> criticalBins,
    String userId,
  ) {
    if (criticalBins.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.check_circle_outline_rounded,
              size: AppDimensions.iconXxl,
              color: AppColors.primaryGreen,
            ),
            const SizedBox(height: AppDimensions.md),
            Text(
              'Semua tong masih dalam kondisi aman.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppDimensions.xs),
            Text(
              AppStrings.binNotCritical,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(AppDimensions.md),
          decoration: BoxDecoration(
            color: AppColors.dangerRed.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
            border: Border.all(
              color: AppColors.dangerRed.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.warning_rounded,
                color: AppColors.dangerRed,
                size: 20,
              ),
              const SizedBox(width: AppDimensions.sm),
              Expanded(
                child: Text(
                  'Tong berikut sudah kritis (>90%). Ajukan pengosongan.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: AppColors.dangerRed),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppDimensions.lg),
        Text('Pilih Tong', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppDimensions.sm),
        Expanded(
          child: ListView.separated(
            itemCount: criticalBins.length,
            separatorBuilder: (_, __) =>
                const SizedBox(height: AppDimensions.sm),
            itemBuilder: (context, index) {
              final BinEntity bin = criticalBins[index];
              return _CriticalBinTile(
                bin: bin,
                onReset: () => ref
                    .read(resetBinProvider.notifier)
                    .submitReset(
                      binId: bin.id,
                      userId: userId,
                      evidencePhotoPath: 'mock_evidence_photo.jpg',
                    ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSuccess(
    BuildContext context,
    WidgetRef ref,
    BinResetEntity result,
  ) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.task_alt_rounded,
            size: AppDimensions.iconXxl,
            color: AppColors.primaryGreen,
          ),
          const SizedBox(height: AppDimensions.md),
          Text(
            AppStrings.resetSuccess,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(color: AppColors.primaryGreen),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppDimensions.sm),
          Text(
            AppStrings.resetPending,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppDimensions.lg),
          Container(
            padding: const EdgeInsets.all(AppDimensions.md),
            decoration: BoxDecoration(
              color: AppColors.warningYellow.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.access_time_rounded,
                  color: AppColors.warningYellow,
                  size: 18,
                ),
                const SizedBox(width: AppDimensions.sm),
                Text(
                  'Status: ${result.status.displayName}',
                  style: const TextStyle(
                    color: AppColors.warningYellow,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppDimensions.xl),
          ElevatedButton(
            onPressed: () {
              ref.read(resetBinProvider.notifier).reset();
              Navigator.of(context).pop();
            },
            child: const Text('Kembali'),
          ),
        ],
      ),
    );
  }
}

class _CriticalBinTile extends StatelessWidget {
  const _CriticalBinTile({required this.bin, required this.onReset});

  final BinEntity bin;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  bin.binType == WasteType.organic
                      ? Icons.compost_rounded
                      : Icons.delete_outline_rounded,
                  color: AppColors.dangerRed,
                  size: AppDimensions.iconMd,
                ),
                const SizedBox(width: AppDimensions.sm),
                Expanded(
                  child: Text(
                    '${bin.binType.displayName} — ${bin.qrSerial}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppDimensions.sm),
            ClipRRect(
              borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
              child: LinearProgressIndicator(
                value: bin.capacityPercent.clamp(0.0, 1.0),
                minHeight: 8,
                backgroundColor: AppColors.border,
                valueColor: const AlwaysStoppedAnimation<Color>(
                  AppColors.dangerRed,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${(bin.capacityPercent * 100).toStringAsFixed(0)}% terisi — '
              '${bin.currentVolumeL.toStringAsFixed(1)}L / '
              '${bin.maxCapacityL.toStringAsFixed(0)}L',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: AppDimensions.md),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onReset,
                icon: const Icon(Icons.restore_rounded),
                label: const Text(AppStrings.resetButton),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.dangerRed,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
