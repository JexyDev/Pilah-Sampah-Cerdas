import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
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
class ResetBinScreen extends ConsumerStatefulWidget {
  const ResetBinScreen({super.key});

  @override
  ConsumerState<ResetBinScreen> createState() => _ResetBinScreenState();
}

class _ResetBinScreenState extends ConsumerState<ResetBinScreen> {
  String? _evidencePhotoPath;
  double _compressedKB = 0;

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

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
          source: ImageSource.gallery, imageQuality: 85);
      if (file != null) {
        final size = (await file.length()) / 1024;
        setState(() {
          _evidencePhotoPath = file.path;
          _compressedKB = size;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memilih foto: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final resetState = ref.watch(resetBinProvider);
    final binsAsync = ref.watch(binsProvider);
    final user = ref.watch(authProvider).user;
    final String userId = user?.id ?? '';

    // Error listener
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
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppDimensions.md),
          child: _buildBody(resetState, binsAsync, userId),
        ),
      ),
    );
  }

  Widget _buildBody(
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
        // Tampilkan semua tong milik user (maks 25kg)
        return _buildForm(bins, userId);
      },
      loading: () => const AppLoading(),
      error: (_, __) => const Center(child: Text(AppStrings.errorGeneric)),
    );
  }

  Widget _buildForm(
    List<BinEntity> bins,
    String userId,
  ) {
    if (bins.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.info_outline_rounded,
              size: AppDimensions.iconXxl,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: AppDimensions.md),
            Text(
              'Anda belum memiliki tong terdaftar.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Tong Sampah Anda', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppDimensions.sm),
        Expanded(
          child: ListView.separated(
            itemCount: bins.length,
            separatorBuilder: (_, __) =>
                const SizedBox(height: AppDimensions.sm),
            itemBuilder: (context, index) {
              final BinEntity bin = bins[index];
              return Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: AppColors.border, width: 1),
                  borderRadius: BorderRadius.circular(12),
                ),
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
                            color: bin.isCritical ? AppColors.dangerRed : AppColors.primaryGreen,
                            size: AppDimensions.iconMd,
                          ),
                          const SizedBox(width: AppDimensions.sm),
                          Expanded(
                            child: Text(
                              'Tong ${bin.binType.displayName}',
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
                          valueColor: AlwaysStoppedAnimation<Color>(
                            bin.isCritical ? AppColors.dangerRed : AppColors.primaryGreen,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${(bin.capacityPercent * 100).toStringAsFixed(0)}% terisi — '
                        '${bin.currentVolumeL.toStringAsFixed(1)} kg / '
                        '${bin.maxCapacityL.toStringAsFixed(0)} kg',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        
        const SizedBox(height: AppDimensions.md),
        
        // Upload Bukti
        if (_evidencePhotoPath != null)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.image_rounded, color: AppColors.primaryGreen),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Foto terpilih (${_compressedKB.toStringAsFixed(0)} KB)',
                    style: const TextStyle(color: AppColors.primaryGreen, fontSize: 13),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_rounded, size: 20, color: AppColors.primaryGreen),
                  onPressed: _pickImage,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          )
        else
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.camera_alt_outlined),
              label: const Text('Upload Foto Bukti (< 1MB)'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          
        const SizedBox(height: AppDimensions.lg),
        
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: (_evidencePhotoPath != null)
                ? () {
                    ref.read(resetBinProvider.notifier).submitReset(
                          binId: bins.isNotEmpty ? bins.first.id : 'all',
                          userId: userId,
                          evidencePhotoPath: _evidencePhotoPath!,
                        );
                  }
                : null,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: AppColors.primaryGreen,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Ajukan Pengosongan', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
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

