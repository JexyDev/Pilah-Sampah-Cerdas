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
  final Set<String> _selectedJenisSampah = {};
  String? _selectedPetugasId;

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
        ref.read(petugasPengosonganProvider.notifier).checkStatus();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final resetState = ref.watch(resetBinProvider);
    final petugasState = ref.watch(petugasPengosonganProvider);
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
              _selectedJenisSampah.clear();
              _selectedPetugasId = null;
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
            child: _buildBody(resetState, petugasState, binsAsync, userId),
          ),
        ),
      ),
    );
  }

  Widget _buildBody(
    ResetBinState resetState,
    PetugasPengosonganState petugasState,
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
<<<<<<< HEAD
    return binsAsync.when(skipLoadingOnReload: true, data: (bins) {
        return _buildForm(bins, userId, isPending: hasPendingRequest);
=======
    return binsAsync.when(
      data: (bins) {
        return _buildForm(bins, userId, petugasState, isPending: hasPendingRequest);
>>>>>>> 20024bc6 (feat: fungsi detail notifikasi)
      },
      loading: () => const AppLoading(),
      error: (_, __) => const Center(child: Text(AppStrings.errorGeneric)),
    );
  }

  Widget _buildForm(
    List<BinEntity> bins,
    String userId,
    PetugasPengosonganState petugasState, {
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

        if (!isPending) ...[
          _buildPetugasSelection(petugasState),
          
          const Text('Jenis Sampah yang Dikosongkan', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: AppDimensions.sm),
          Row(
            children: [
              Expanded(
                child: CheckboxListTile(
                  title: const Text('Organik', style: TextStyle(fontSize: 14)),
                  value: _selectedJenisSampah.contains('organik'),
                  onChanged: (bool? value) {
                    setState(() {
                      if (value == true) {
                        _selectedJenisSampah.add('organik');
                      } else {
                        _selectedJenisSampah.remove('organik');
                      }
                    });
                  },
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  activeColor: AppColors.organicColor,
                ),
              ),
              Expanded(
                child: CheckboxListTile(
                  title: const Text('Anorganik', style: TextStyle(fontSize: 14)),
                  value: _selectedJenisSampah.contains('anorganik'),
                  onChanged: (bool? value) {
                    setState(() {
                      if (value == true) {
                        _selectedJenisSampah.add('anorganik');
                      } else {
                        _selectedJenisSampah.remove('anorganik');
                      }
                    });
                  },
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  activeColor: AppColors.nonOrganicColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppDimensions.md),
        ],
        
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
          
          final bool isJenisSampahEmpty = _selectedJenisSampah.isEmpty;
          final bool isPetugasInvalid = _selectedPetugasId == 'CHANGE_REQUESTED';
          
          final bool canSubmit = _evidencePhotoPath != null && _selectedBinIds.isNotEmpty && !isJenisSampahEmpty && !isPetugasInvalid;

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
                      : isJenisSampahEmpty
                          ? () {
                              ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Pilih minimal satu jenis sampah yang ingin dikosongkan.'),
                                  backgroundColor: AppColors.dangerRed,
                                  behavior: SnackBarBehavior.floating,
                                  duration: Duration(seconds: 3),
                                ),
                              );
                            }
                          : isPetugasInvalid
                              ? () {
                                  ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Pilih petugas tujuan terlebih dahulu.'),
                                      backgroundColor: AppColors.dangerRed,
                                      behavior: SnackBarBehavior.floating,
                                      duration: Duration(seconds: 3),
                                    ),
                                  );
                                }
                              : canSubmit
                                  ? () {
                                      final binIds = _selectedBinIds.toList();
                                      ref.read(resetBinProvider.notifier).submitReset(
                                              binIds: binIds,
                                              userId: userId,
                                              evidencePhotoPath: _evidencePhotoPath!,
                                              wargaName: ref.read(authProvider).user?.name,
                                              petugasId: _selectedPetugasId,
                                              jenisSampah: _selectedJenisSampah.join(','),
                                            );
                                    }
                                  : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: isPending
                    ? AppColors.warningYellow
                    : hasInvalidSelectedBin || isJenisSampahEmpty || isPetugasInvalid
                        ? AppColors.dangerRed
                        : (canSubmit ? AppColors.primaryGreen : Colors.grey.shade400),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                isPending
                    ? 'Sedang Mengajukan (PENDING)'
                    : hasInvalidSelectedBin
                        ? 'Tempat Sampah Belum 70%'
                        : isJenisSampahEmpty
                            ? 'Pilih Jenis Sampah'
                            : isPetugasInvalid
                                ? 'Pilih Petugas Tujuan'
                                : (_selectedBinIds.isEmpty
                                    ? 'Pilih Tempat Sampah'
                                    : _evidencePhotoPath == null 
                                        ? 'Upload Foto Bukti'
                                        : 'Ajukan Pengosongan (${_selectedBinIds.length} Tempat Sampah)'),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: isPending || hasInvalidSelectedBin || isJenisSampahEmpty || isPetugasInvalid || canSubmit ? Colors.white : Colors.grey.shade700,
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
              Navigator.maybePop(context);
            },
            child: const Text('Kembali'),
          ),
        ],
      ),
    );
  }

  Widget _buildPetugasSelection(PetugasPengosonganState state) {
    if (state.isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator(color: AppColors.primaryGreen)),
      );
    }

    if (state.error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Text('Gagal memuat info petugas: ${state.error}', style: const TextStyle(color: AppColors.dangerRed)),
      );
    }

    final hasDefault = state.statusResponse?.hasDefaultPetugas ?? false;
    final defaultPetugas = state.statusResponse?.petugas;

    if (hasDefault && defaultPetugas != null && _selectedPetugasId == null) {
      return Container(
        margin: const EdgeInsets.only(bottom: AppDimensions.md),
        padding: const EdgeInsets.all(AppDimensions.md),
        decoration: BoxDecoration(
          color: AppColors.primaryGreen.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.2),
              backgroundImage: defaultPetugas.fotoProfil != null ? NetworkImage(defaultPetugas.fotoProfil!) : null,
              child: defaultPetugas.fotoProfil == null ? const Icon(Icons.person, color: AppColors.primaryGreen) : null,
            ),
            const SizedBox(width: AppDimensions.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Petugas Tujuan', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  Text(defaultPetugas.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            TextButton(
              onPressed: () {
                setState(() {
                  _selectedPetugasId = 'CHANGE_REQUESTED';
                });
                ref.read(petugasPengosonganProvider.notifier).fetchPetugasWilayah();
              },
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Ganti', style: TextStyle(fontSize: 12, color: AppColors.primaryGreen, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
    }

    // Tampilkan daftar petugas untuk dipilih
    final petugasList = state.petugasWilayah;
    
    if (petugasList.isEmpty && !hasDefault && state.statusResponse != null) {
      return Container(
        margin: const EdgeInsets.only(bottom: AppDimensions.md),
        padding: const EdgeInsets.all(AppDimensions.md),
        decoration: BoxDecoration(
          color: AppColors.warningYellow.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.warningYellow),
        ),
        child: const Row(
          children: [
            Icon(Icons.info_outline, color: AppColors.warningYellow),
            SizedBox(width: AppDimensions.sm),
            Expanded(
              child: Text(
                'Belum ada petugas pemilah terdaftar di wilayah Anda. Pengajuan akan diteruskan ke Admin RW untuk diproses manual.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ),
          ],
        ),
      );
    }

    if (petugasList.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Pilih Petugas Pemilah', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: AppDimensions.sm),
        ...petugasList.map((petugas) {
          final isSelected = _selectedPetugasId == petugas.id || (_selectedPetugasId == 'CHANGE_REQUESTED' && petugas.id == defaultPetugas?.id);
          return Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: InkWell(
              onTap: () {
                setState(() => _selectedPetugasId = petugas.id);
                // Call set default if they are changing or setting for first time
                ref.read(petugasPengosonganProvider.notifier).setDefaultPetugas(petugas.id);
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primaryGreen.withValues(alpha: 0.1) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isSelected ? AppColors.primaryGreen : AppColors.border),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Colors.grey.shade200,
                      backgroundImage: petugas.fotoProfil != null ? NetworkImage(petugas.fotoProfil!) : null,
                      child: petugas.fotoProfil == null ? const Icon(Icons.person, color: Colors.grey) : null,
                    ),
                    const SizedBox(width: AppDimensions.md),
                    Expanded(
                      child: Text(petugas.name, style: const TextStyle(fontWeight: FontWeight.w500)),
                    ),
                    if (isSelected) const Icon(Icons.check_circle, color: AppColors.primaryGreen),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: AppDimensions.md),
      ],
    );
  }
}

