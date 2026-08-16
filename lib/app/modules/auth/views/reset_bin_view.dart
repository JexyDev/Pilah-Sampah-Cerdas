import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_strings.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/bin_entity.dart';
import '../../../data/models/bin_reset_entity.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../scan/controllers/scan_controller.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../../shared/widgets/app_loading.dart';
import '../../shared/widgets/weight_text.dart';
import '../../../data/services/notification_engine.dart';

/// Halaman pengajuan pengosongan tempat sampah.
/// Sesuai prd.md §3.1 dan ui_ux_flow.md §3: failed_scan_step_1.png
class ResetBinView extends ConsumerStatefulWidget {
  const ResetBinView({super.key});

  @override
  ConsumerState<ResetBinView> createState() => _ResetBinViewState();
}

class _ResetBinViewState extends ConsumerState<ResetBinView> {
  String? _evidencePhotoPath;
  double _compressedKB = 0;
  final Set<String> _selectedBinIds = {};

  String _mapError(String code, String? message) {
    switch (code) {
      case 'BIN_NOT_CRITICAL':
        return AppStrings.binNotCritical;
      case 'RESOURCE_NOT_FOUND':
        return 'Tempat sampah tidak ditemukan.';
      case 'DUPLICATE_REQUEST':
        return 'Sudah ada pengajuan pengosongan aktif untuk tempat sampah ini. Silakan tunggu hingga diproses oleh petugas.';
      case 'BIN_NOT_OWNED':
        return 'Tempat sampah ini bukan milik Anda.';
      case 'VALIDATION_ERROR':
        return message ?? 'Foto bukti wajib diunggah.';
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
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memilih foto: $e')),
        );
      }
    }
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final user = ref.read(authProvider).user;
      if (user != null) {
        ref.read(resetBinProvider.notifier).checkActiveRequest(user.id);
      }
    });
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
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_mapError(next.errorCode!, next.errorMessage)),
            backgroundColor: AppColors.dangerRed,
          ),
        );
        ref.read(resetBinProvider.notifier).reset();
      }
      // AUTO-REFRESH: setelah pengajuan berhasil, refresh data tempat sampah & notifikasi
      if (next.isSuccess && !next.isLoading) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            setState(() {
              _selectedBinIds.clear();
            });
            ref.invalidate(binsProvider);
            ref.invalidate(notificationsProvider);
            NotificationEngine().showResetPendingNotification();
            ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Pengajuan pengosongan berhasil dikirim. Menunggu proses persetujuan Petugas Pemilah (PENDING).'),
                backgroundColor: AppColors.warningYellow,
                behavior: SnackBarBehavior.floating,
                duration: Duration(seconds: 4),
              ),
            );
          }
        });
      }
    });

    return PopScope(
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) {
          ref.invalidate(binsProvider);
          ref.invalidate(notificationsProvider);
          ref.read(resetBinProvider.notifier).reset();
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(title: const Text(AppStrings.resetTitle)),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppDimensions.md),
            child: _buildBody(resetState, binsAsync, userId),
          ),
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

    if (resetState.isSuccess && resetState.result != null) {
      return _buildSuccess(context, ref, resetState.result!);
    }

    final bool hasPendingRequest = resetState.result != null && resetState.result!.status == BinResetStatus.pending;
    return binsAsync.when(skipLoadingOnReload: true, data: (bins) {
        return _buildForm(bins, userId, isPending: hasPendingRequest);
      },
      loading: () => const AppLoading(),
      error: (_, __) => const Center(child: Text(AppStrings.errorGeneric)),
    );
  }

  Widget _buildForm(
    List<BinEntity> bins,
    String userId, {
    bool isPending = false,
  }) {
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
              'Anda belum memiliki tempat sampah terdaftar.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    // Removed auto selection so user is free to choose or not
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Status Tempat Sampah', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: AppDimensions.sm),
        Expanded(
          child: ListView.separated(
            itemCount: bins.length,
            separatorBuilder: (_, __) =>
                const SizedBox(height: AppDimensions.sm),
            itemBuilder: (context, index) {
              final BinEntity bin = bins[index];
              final bool isBinActive = bin.isActive;
              final bool isPendingBin = bin.isResetPending;
              final bool isSelected = _selectedBinIds.contains(bin.id);

              Color cardBg;
              Color borderColor;
              Color iconColor;
              Color progressColor;
              Color textColor;

              if (!isBinActive) {
                cardBg = Colors.grey.shade100;
                borderColor = Colors.grey.shade300;
                iconColor = Colors.grey.shade400;
                progressColor = Colors.grey.shade400;
                textColor = Colors.grey.shade600;
              } else if (isPendingBin) {
                cardBg = AppColors.warningYellow.withValues(alpha: 0.08);
                borderColor = AppColors.warningYellow;
                iconColor = AppColors.warningYellow;
                progressColor = AppColors.warningYellow;
                textColor = AppColors.textPrimary;
              } else if (isSelected) {
                cardBg = AppColors.primaryGreen.withValues(alpha: 0.06);
                borderColor = AppColors.primaryGreen;
                iconColor = (bin.binType == WasteType.organic ? AppColors.organicColor : AppColors.nonOrganicColor);
                progressColor = (bin.binType == WasteType.organic ? AppColors.organicColor : AppColors.nonOrganicColor);
                textColor = AppColors.textPrimary;
              } else {
                cardBg = Colors.white;
                borderColor = AppColors.border;
                iconColor = (bin.binType == WasteType.organic ? AppColors.organicColor : AppColors.nonOrganicColor);
                progressColor = (bin.binType == WasteType.organic ? AppColors.organicColor : AppColors.nonOrganicColor);
                textColor = AppColors.textPrimary;
              }

              return InkWell(
                onTap: () {
                  if (!isBinActive) {
                    ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Tempat sampah ini dalam status NON-AKTIF dan tidak dapat dipilih.'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                    return;
                  }

                  if (isPendingBin) {
                    ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Tempat sampah ini sedang dalam proses pengajuan (PENDING).'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                    return;
                  }
                  setState(() {
                    if (_selectedBinIds.contains(bin.id)) {
                      _selectedBinIds.remove(bin.id);
                    } else {
                      _selectedBinIds.add(bin.id);
                    }
                  });
                },
                borderRadius: BorderRadius.circular(12),
                child: Card(
                  elevation: 0,
                  color: cardBg,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(
                      color: borderColor,
                      width: isSelected ? 2 : (isBinActive ? 1 : 1.5),
                    ),
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
                              !isBinActive
                                  ? Icons.do_not_disturb_on_rounded
                                  : (isPendingBin
                                      ? Icons.access_time_rounded
                                      : (bin.binType == WasteType.organic
                                          ? Icons.compost_rounded
                                          : Icons.delete_outline_rounded)),
                              color: iconColor,
                              size: AppDimensions.iconMd,
                            ),
                            const SizedBox(width: AppDimensions.sm),
                            Expanded(
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Tempat Sampah ${bin.binType.displayName}',
                                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: textColor,
                                          ),
                                    ),
                                  ),
                                  if (!isBinActive) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade300,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        'NON-AKTIF',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ),
                                  ] else if (isPendingBin) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.warningYellow.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        'PENDING',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.warningYellow,
                                        ),
                                      ),
                                    ),
                                  ] else ...[
                                    const SizedBox(width: 8),
                                    Icon(
                                      isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                      color: isSelected ? AppColors.primaryGreen : AppColors.textHint,
                                      size: 22,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppDimensions.sm),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
                          child: LinearProgressIndicator(
                            value: isBinActive ? bin.capacityPercent.clamp(0.0, 1.0) : 0.0,
                            minHeight: 8,
                            backgroundColor: isBinActive ? AppColors.border : Colors.grey.shade300,
                            valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            Text(
                              !isBinActive
                                  ? 'Tempat Sampah Dinonaktifkan di Web — '
                                  : (isPendingBin
                                      ? 'Pengajuan pengosongan sedang diproses — '
                                      : '${(bin.capacityPercent * 100).toStringAsFixed(0)}% terisi — '),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textColor),
                            ),
                            WeightText(
                              bin.currentVolumeL,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textColor),
                            ),
                            Text(
                              ' / ',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textColor),
                            ),
                            WeightText(
                              bin.maxCapacityL,
                              fractionDigits: 0,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textColor),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        
        const SizedBox(height: AppDimensions.md),
        
        // Upload Bukti
        if (!isPending) ...[
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
                label: const Text('Upload Foto Bukti (< 5MB)'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            
          const SizedBox(height: AppDimensions.lg),
        ],
        
        (() {
          final bool hasInvalidSelectedBin = _selectedBinIds.any((id) {
            final b = bins.firstWhere((element) => element.id == id);
            return b.capacityPercent < 0.70;
          });

          return SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isPending
                  ? () {
                      ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Sedang mengajukan reset Tempat Sampah. Silakan tunggu hingga di-reset oleh petugas.'),
                          backgroundColor: AppColors.warningYellow,
                          behavior: SnackBarBehavior.floating,
                          duration: Duration(seconds: 3),
                        ),
                      );
                    }
                  : hasInvalidSelectedBin
                      ? () {
                          ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Tempat sampah yang dipilih belum terisi 70%. Tidak dapat mengajukan pengosongan.'),
                              backgroundColor: AppColors.dangerRed,
                              behavior: SnackBarBehavior.floating,
                              duration: Duration(seconds: 3),
                            ),
                          );
                        }
                      : (_evidencePhotoPath != null && _selectedBinIds.isNotEmpty)
                          ? () {
                              final binIds = _selectedBinIds.toList();
                              ref.read(resetBinProvider.notifier).submitReset(
                                      binIds: binIds,
                                      userId: userId,
                                      evidencePhotoPath: _evidencePhotoPath!,
                                      wargaName: ref.read(authProvider).user?.name,
                                    );
                            }
                          : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: isPending
                    ? AppColors.warningYellow
                    : hasInvalidSelectedBin
                        ? AppColors.dangerRed
                        : (_selectedBinIds.isNotEmpty ? AppColors.primaryGreen : Colors.grey.shade400),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                isPending
                    ? 'Sedang Mengajukan (PENDING)'
                    : hasInvalidSelectedBin
                        ? 'Tempat Sampah Belum 70%'
                        : (_selectedBinIds.isEmpty
                            ? 'Pilih Tempat Sampah Terlebih Dahulu'
                            : 'Ajukan Pengosongan (${_selectedBinIds.length} Tempat Sampah)'),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: isPending || hasInvalidSelectedBin || _selectedBinIds.isNotEmpty ? Colors.white : Colors.grey.shade700,
                ),
              ),
            ),
          );
        })(),
        const SizedBox(height: AppDimensions.md),
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
              // Invalidate data terkait sebelum kembali ke halaman profil
              ref.invalidate(binsProvider);
              ref.invalidate(notificationsProvider);
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

