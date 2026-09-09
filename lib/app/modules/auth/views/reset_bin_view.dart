import 'dart:io';
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
import '../../../data/models/user_entity.dart';
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
  String? _selectedPetugasId;
  DateTime? _lastSnackbarTime;

  /// Batas minimal kapasitas terisi untuk dapat diajukan pengosongan (70%)
  static const double minResetCapacityPercent = 0.70;

  void _showThrottledSnackBar(String message, {Color backgroundColor = AppColors.warningYellow}) {
    final now = DateTime.now();
    if (_lastSnackbarTime != null && now.difference(_lastSnackbarTime!) < const Duration(milliseconds: 1500)) {
      return; // Cegah spamming snackbar jika diketuk berkali-kali
    }
    _lastSnackbarTime = now;
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

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

  void _showImageSourcePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 8.0),
            child: Wrap(
              children: [
                ListTile(
                  leading: const Icon(Icons.photo_camera_rounded, color: AppColors.primaryGreen),
                  title: const Text('Ambil Foto dari Kamera', style: TextStyle(fontWeight: FontWeight.w500)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library_rounded, color: AppColors.primaryGreen),
                  title: const Text('Pilih dari Galeri', style: TextStyle(fontWeight: FontWeight.w500)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.gallery);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
      );
      if (file != null) {
        final size = (await file.length()) / 1024;
        setState(() {
          _evidencePhotoPath = file.path;
          _compressedKB = size;
        });
      }
    } catch (e) {
      if (mounted) {
        _showThrottledSnackBar('Gagal mengambil foto: $e', backgroundColor: AppColors.dangerRed);
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
        _showThrottledSnackBar(
          _mapError(next.errorCode!, next.errorMessage),
          backgroundColor: AppColors.dangerRed,
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
            ScaffoldMessenger.of(context).clearSnackBars();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Pengajuan pengosongan berhasil dikirim ke Petugas Pemilah! Menunggu verifikasi.'),
                backgroundColor: AppColors.primaryGreen,
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
            child: _buildBody(resetState, petugasState, binsAsync, userId, user),
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
    UserEntity? user,
  ) {
    if (resetState.isLoading) {
      return const AppLoading(message: 'Mengirim pengajuan...');
    }

    if (resetState.isSuccess && resetState.result != null) {
      return _buildSuccess(context, ref, resetState.result!);
    }

    final bool hasPendingRequest = resetState.result != null && resetState.result!.status == BinResetStatus.pending;
    return binsAsync.when(
      skipLoadingOnReload: true,
      data: (bins) {
        return _buildForm(bins, userId, user, petugasState, isPending: hasPendingRequest);
      },
      loading: () => const AppLoading(),
      error: (_, __) => const Center(child: Text(AppStrings.errorGeneric)),
    );
  }

  Widget _buildPetugasSection(PetugasPengosonganState petugasState, UserEntity? user) {
    final activePetugas = petugasState.statusResponse?.petugas;
    final listPetugas = petugasState.petugasWilayah;

    if (_selectedPetugasId == null) {
      if (activePetugas != null) {
        _selectedPetugasId = activePetugas.id;
      } else if (listPetugas.isNotEmpty) {
        _selectedPetugasId = listPetugas.first.id;
      }
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: AppDimensions.md),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.person_pin_circle_rounded, color: AppColors.primaryGreen, size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Petugas Pemilah',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (petugasState.isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
            )
          else if (listPetugas.isNotEmpty) ...[
            DropdownButtonFormField<String>(
              initialValue: listPetugas.any((p) => p.id == _selectedPetugasId)
                  ? _selectedPetugasId
                  : listPetugas.first.id,
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                isDense: true,
              ),
              items: listPetugas.map((petugas) {
                return DropdownMenuItem<String>(
                  value: petugas.id,
                  child: Row(
                    children: [
                      const Icon(Icons.badge_outlined, size: 16, color: AppColors.primaryGreen),
                      const SizedBox(width: 8),
                      Text(petugas.name.isNotEmpty ? petugas.name : 'Petugas ${petugas.id}'),
                    ],
                  ),
                );
              }).toList(),
              onChanged: (val) {
                setState(() {
                  _selectedPetugasId = val;
                });
              },
            ),
          ] else if (activePetugas != null) ...[
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.1),
                  child: const Icon(Icons.person, color: AppColors.primaryGreen, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activePetugas.name.isNotEmpty ? activePetugas.name : 'Petugas Pemilah',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const Text(
                        'Petugas Pemilah terdaftar',
                        style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ] else ...[
            const Text(
              'Belum ada Petugas Pemilah terdaftar. Pengajuan akan diteruskan ke antrean Petugas Pemilah otomatis.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildForm(
    List<BinEntity> bins,
    String userId,
    UserEntity? user,
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: AppDimensions.md),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primaryGreen.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Pengajuan pengosongan dilakukan saat tempat sampah sudah penuh (minimal 70%). Anda WAJIB memfoto tempat sampah yang PENUH sebagai bukti pengajuan pengosongan.',
                  style: TextStyle(fontSize: 12.5, color: AppColors.textPrimary, height: 1.4),
                ),
              ),
            ],
          ),
        ),
        _buildPetugasSection(petugasState, user),
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
              final bool isCapacityEligible = bin.capacityPercent >= minResetCapacityPercent;
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
              } else if (!isCapacityEligible) {
                cardBg = Colors.grey.shade50;
                borderColor = Colors.grey.shade300;
                iconColor = (bin.binType == WasteType.organic ? AppColors.organicColor : AppColors.nonOrganicColor).withValues(alpha: 0.4);
                progressColor = (bin.binType == WasteType.organic ? AppColors.organicColor : AppColors.nonOrganicColor).withValues(alpha: 0.4);
                textColor = Colors.grey.shade700;
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
                    _showThrottledSnackBar('Tempat sampah ini dalam status NON-AKTIF dan tidak dapat dipilih.');
                    return;
                  }

                  if (isPendingBin) {
                    _showThrottledSnackBar('Tempat sampah ini sedang dalam proses pengajuan (PENDING).');
                    return;
                  }

                  if (!isCapacityEligible) {
                    _showThrottledSnackBar(
                      'Tempat sampah belum penuh (minimal 70%). Kapasitas saat ini baru ${(bin.capacityPercent * 100).toStringAsFixed(0)}%.',
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
                            !isBinActive
                                ? Icon(Icons.do_not_disturb_on_rounded, color: iconColor, size: AppDimensions.iconMd)
                                : isPendingBin
                                    ? Icon(Icons.access_time_rounded, color: iconColor, size: AppDimensions.iconMd)
                                    : Image.asset('assets/icons/recycle-bin.png', color: iconColor, width: AppDimensions.iconMd, height: AppDimensions.iconMd),
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
                                  ] else if (!isCapacityEligible) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade200,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '${(bin.capacityPercent * 100).toStringAsFixed(0)}% (< 70%)',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.grey.shade700,
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
                                      ? 'Pengosongan sedang diproses — '
                                      : (!isCapacityEligible
                                          ? 'Belum penuh (minimal 70%) — '
                                          : '${(bin.capacityPercent * 100).toStringAsFixed(0)}% terisi — ')),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textColor),
                            ),
                            Text(
                              '${bin.currentWeightKg.toStringAsFixed(1)} kg',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textColor, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              ' / ',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textColor),
                            ),
                            Text(
                              '${bin.maxWeightKg.toStringAsFixed(1)} kg',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: textColor, fontWeight: FontWeight.bold),
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
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      File(_evidencePhotoPath!),
                      width: 44,
                      height: 44,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(Icons.image_rounded, color: AppColors.primaryGreen, size: 36),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Foto Bukti Terpilih',
                          style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                        Text(
                          '${_compressedKB.toStringAsFixed(0)} KB',
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Ganti Foto',
                    icon: const Icon(Icons.edit_rounded, size: 20, color: AppColors.primaryGreen),
                    onPressed: _showImageSourcePicker,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    tooltip: 'Hapus Foto',
                    icon: const Icon(Icons.close_rounded, size: 20, color: AppColors.dangerRed),
                    onPressed: () {
                      setState(() {
                        _evidencePhotoPath = null;
                        _compressedKB = 0;
                      });
                    },
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
                onPressed: _showImageSourcePicker,
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
          final bool isFotoEmpty = _evidencePhotoPath == null;
          final bool canSubmit = !isFotoEmpty && _selectedBinIds.isNotEmpty;

          return SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isPending
                  ? () {
                      _showThrottledSnackBar(
                        'Sedang mengajukan pengosongan tempat sampah. Silakan tunggu hingga dikosongkan oleh petugas.',
                        backgroundColor: AppColors.warningYellow,
                      );
                    }
                  : isFotoEmpty
                          ? () {
                              _showThrottledSnackBar(
                                'Silakan upload foto bukti terlebih dahulu.',
                                backgroundColor: AppColors.dangerRed,
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
                                              petugasId: _selectedPetugasId ?? petugasState.statusResponse?.petugas?.id,
                                            );
                                    }
                                  : () {
                                      _showThrottledSnackBar(
                                        'Pilih minimal satu tempat sampah yang sudah mencapai batas minimal (70%).',
                                        backgroundColor: AppColors.warningYellow,
                                      );
                                    },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: isPending
                    ? AppColors.warningYellow
                    : isFotoEmpty
                        ? AppColors.dangerRed
                        : (canSubmit ? AppColors.primaryGreen : Colors.grey.shade400),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                isPending
                    ? 'Sedang Mengajukan (PENDING)'
                    : isFotoEmpty
                        ? 'Upload Foto Bukti'
                        : (_selectedBinIds.isEmpty
                            ? 'Pilih Tempat Sampah'
                            : 'Kosongkan (${_selectedBinIds.length} Tempat Sampah)'),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isPending || isFotoEmpty || canSubmit ? Colors.white : Colors.grey.shade700,
                ),
                textAlign: TextAlign.center,
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
    final bool isPending = result.status == BinResetStatus.pending;

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isPending ? Icons.hourglass_top_rounded : Icons.task_alt_rounded,
            size: AppDimensions.iconXxl,
            color: isPending ? AppColors.warningYellow : AppColors.primaryGreen,
          ),
          const SizedBox(height: AppDimensions.md),
          Text(
            isPending ? 'Pengajuan Terkirim!' : AppStrings.resetSuccess,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(
              color: isPending ? AppColors.warningYellow : AppColors.primaryGreen,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppDimensions.sm),
          Text(
            isPending
                ? 'Foto bukti tempat sampah penuh berhasil dikirimkan ke Petugas Pemilah. Mohon tunggu verifikasi oleh Petugas Pemilah.'
                : 'Tempat sampah berhasil dikosongkan dan siap digunakan kembali.',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppDimensions.lg),
          Container(
            padding: const EdgeInsets.all(AppDimensions.md),
            decoration: BoxDecoration(
              color: (isPending ? AppColors.warningYellow : AppColors.primaryGreen).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isPending ? Icons.access_time_rounded : Icons.check_circle_rounded,
                  color: isPending ? AppColors.warningYellow : AppColors.primaryGreen,
                  size: 18,
                ),
                const SizedBox(width: AppDimensions.sm),
                Text(
                  isPending ? 'Status: MENUNGGU VERIFIKASI (PENDING)' : 'Status: SELESAI',
                  style: TextStyle(
                    color: isPending ? AppColors.warningYellow : AppColors.primaryGreen,
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
}
