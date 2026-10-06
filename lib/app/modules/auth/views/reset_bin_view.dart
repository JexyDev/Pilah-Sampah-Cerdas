import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
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

  void _showThrottledSnackBar(
    String message, {
    Color backgroundColor = AppColors.warningYellow,
  }) {
    final now = DateTime.now();
    if (_lastSnackbarTime != null &&
        now.difference(_lastSnackbarTime!) <
            const Duration(milliseconds: 1500)) {
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

  void _showCancelPendingDialog(BinEntity bin, String userId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.info_outline_rounded, color: AppColors.warningYellow),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Batalkan Pengajuan?',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Text(
          'Tempat Sampah ${bin.binType.displayName} sedang dalam antrean pengosongan.\n\n'
          'Jika tempat sampah belum penuh atau Anda tidak sengaja mengajukan, Anda dapat membatalkan pengajuan ini agar dapat digunakan kembali untuk scan.',
          style: const TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Kembali', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref.read(resetBinProvider.notifier).cancelReset(userId, binId: bin.id);
              ref.invalidate(binsProvider);
              ref.invalidate(notificationsProvider);
              if (mounted) {
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Pengajuan Tempat Sampah ${bin.binType.displayName} berhasil dibatalkan.'),
                      backgroundColor: AppColors.primaryGreen,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                } else {
                  final err = ref.read(resetBinProvider).errorMessage ?? 'Gagal membatalkan pengajuan tempat sampah.';
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(err),
                      backgroundColor: AppColors.dangerRed,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              }
            },
            child: const Text('Ya, Batalkan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
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
            padding: const EdgeInsets.symmetric(
              vertical: 16.0,
              horizontal: 8.0,
            ),
            child: Wrap(
              children: [
                ListTile(
                  leading: const Icon(
                    Icons.photo_camera_rounded,
                    color: AppColors.primaryGreen,
                  ),
                  title: const Text(
                    'Ambil Foto dari Kamera',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const Icon(
                    Icons.photo_library_rounded,
                    color: AppColors.primaryGreen,
                  ),
                  title: const Text(
                    'Pilih dari Galeri',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
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

  Future<void> _saveTempFormState() async {
    try {
      final user = ref.read(authProvider).user;
      final uid = user?.id ?? 'guest';
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('temp_reset_bin_ids_$uid', _selectedBinIds.toList());
      if (_selectedPetugasId != null) {
        await prefs.setString('temp_reset_petugas_id_$uid', _selectedPetugasId!);
      }
    } catch (_) {}
  }

  Future<void> _restoreTempFormState() async {
    try {
      final user = ref.read(authProvider).user;
      final uid = user?.id ?? 'guest';
      final prefs = await SharedPreferences.getInstance();
      final savedIds = prefs.getStringList('temp_reset_bin_ids_$uid');
      final savedPetugas = prefs.getString('temp_reset_petugas_id_$uid');
      if (mounted) {
        setState(() {
          if (savedIds != null && savedIds.isNotEmpty) {
            _selectedBinIds.addAll(savedIds);
          }
          if (savedPetugas != null && savedPetugas.isNotEmpty) {
            _selectedPetugasId = savedPetugas;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _clearTempFormState() async {
    try {
      final user = ref.read(authProvider).user;
      final uid = user?.id ?? 'guest';
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('temp_reset_bin_ids_$uid');
      await prefs.remove('temp_reset_petugas_id_$uid');
    } catch (_) {}
  }

  /// [RECOVERY] Menangani Android Process Death ketika kamera dibuka pada HP dengan RAM terbatas.
  /// Saat aplikasi di-relaunch setelah user menjepret foto di kamera, LostDataResponse akan memulihkan file foto tersebut.
  Future<void> _retrieveLostData() async {
    try {
      final picker = ImagePicker();
      final LostDataResponse response = await picker.retrieveLostData();
      if (response.isEmpty) return;
      if (response.file != null) {
        final file = response.file!;
        final size = (await file.length()) / 1024;
        if (mounted) {
          setState(() {
            _evidencePhotoPath = file.path;
            _compressedKB = size;
          });
        }
      } else if (response.exception != null) {
        debugPrint('[ResetBinView] LostData exception: ${response.exception}');
      }
    } catch (e) {
      debugPrint('[ResetBinView] Failed to retrieve lost image: $e');
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    // Simpan pilihan tempat sampah ke cache lokal agar tidak hilang jika terjadi Process Death
    await _saveTempFormState();

    try {
      final picker = ImagePicker();
      // Gunakan resolusi 1280x720 (HD) dan quality 80 agar hemat memori RAM pada HP warga
      final file = await picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1280,
        maxHeight: 720,
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
        _showThrottledSnackBar(
          'Gagal mengambil foto: $e',
          backgroundColor: AppColors.dangerRed,
        );
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _restoreTempFormState();
    _retrieveLostData();
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
    ref.listen(resetBinProvider, (previous, next) {
      if (next.errorCode != null && previous?.errorCode != next.errorCode && !next.isLoading) {
        _showThrottledSnackBar(
          _mapError(next.errorCode!, next.errorMessage),
          backgroundColor: AppColors.dangerRed,
        );
        ref.read(resetBinProvider.notifier).reset();
      }
      // AUTO-REFRESH: setelah pengajuan berhasil, refresh data tempat sampah & notifikasi
      if (previous?.isSuccess != true && next.isSuccess && next.isJustSubmitted && !next.isLoading) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            _clearTempFormState();
            setState(() {
              _selectedBinIds.clear();
              _evidencePhotoPath = null;
              _compressedKB = 0;
            });
            ref.invalidate(binsProvider);
            ref.invalidate(notificationsProvider);
            ScaffoldMessenger.of(context).clearSnackBars();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Pengajuan pengosongan berhasil dikirim ke Petugas Pemilah! Menunggu verifikasi.',
                ),
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
          _clearTempFormState();
          ref.invalidate(binsProvider);
          ref.invalidate(notificationsProvider);
          ref.read(resetBinProvider.notifier).reset();
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(
          title: const FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(AppStrings.resetTitle),
          ),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppDimensions.md),
            child: _buildBody(
              resetState,
              petugasState,
              binsAsync,
              userId,
              user,
            ),
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

    if (resetState.isSuccess && resetState.result != null && resetState.isJustSubmitted) {
      return _buildSuccess(context, ref, resetState.result!);
    }

    return binsAsync.when(
      skipLoadingOnReload: true,
      data: (bins) {
        return _buildForm(
          bins,
          userId,
          user,
          petugasState,
        );
      },
      loading: () => const AppLoading(),
      error: (_, __) => const Center(child: Text(AppStrings.errorGeneric)),
    );
  }

  Widget _buildPetugasSection(
    PetugasPengosonganState petugasState,
    UserEntity? user,
  ) {
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
              Icon(
                Icons.person_pin_circle_rounded,
                color: AppColors.primaryGreen,
                size: 20,
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Petugas Pemilah',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (petugasState.isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else if (listPetugas.length == 1) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.badge_outlined,
                    size: 20,
                    color: AppColors.primaryGreen,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Petugas Pemilah Wilayah Anda',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          listPetugas.first.name.isNotEmpty
                              ? listPetugas.first.name
                              : 'Petugas ${listPetugas.first.id}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ] else if (listPetugas.length > 1) ...[
            DropdownButtonFormField<String>(
              isExpanded: true,
              initialValue: listPetugas.any((p) => p.id == _selectedPetugasId)
                  ? _selectedPetugasId
                  : listPetugas.first.id,
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                isDense: true,
              ),
              items: listPetugas.map((petugas) {
                return DropdownMenuItem<String>(
                  value: petugas.id,
                  child: Row(
                    children: [
                      const Icon(
                        Icons.badge_outlined,
                        size: 16,
                        color: AppColors.primaryGreen,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          petugas.name.isNotEmpty
                              ? petugas.name
                              : 'Petugas ${petugas.id}',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
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
                  backgroundColor: AppColors.primaryGreen.withValues(
                    alpha: 0.1,
                  ),
                  child: const Icon(
                    Icons.person,
                    color: AppColors.primaryGreen,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activePetugas.name.isNotEmpty
                            ? activePetugas.name
                            : 'Petugas Pemilah',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const Text(
                        'Petugas Pemilah terdaftar',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ] else ...[
            const Text(
              'Belum ada Petugas Pemilah terdaftar. Pengajuan akan diteruskan ke antrean Petugas Pemilah otomatis.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
                fontStyle: FontStyle.italic,
              ),
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
    PetugasPengosonganState petugasState,
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
              'Anda belum Mengaktivasi Tempat Sampah.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    final bool allBinsPending = bins.isNotEmpty && bins.every((b) => b.isResetPending);

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
            border: Border.all(
              color: AppColors.primaryGreen.withValues(alpha: 0.3),
            ),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.info_outline_rounded,
                color: AppColors.primaryGreen,
                size: 20,
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Pengajuan pengosongan dapat dilakukan kapan saja saat tempat sampah perlu dikosongkan. Anda wajib menyertakan foto tempat sampah sebagai bukti pengajuan pengosongan.',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textPrimary,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        _buildPetugasSection(petugasState, user),
        Text(
          'Status Tempat Sampah',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
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
                iconColor = (bin.binType == WasteType.organic
                    ? AppColors.organicColor
                    : AppColors.nonOrganicColor);
                progressColor = (bin.binType == WasteType.organic
                    ? AppColors.organicColor
                    : AppColors.nonOrganicColor);
                textColor = AppColors.textPrimary;
              } else {
                cardBg = Colors.white;
                borderColor = AppColors.border;
                iconColor = (bin.binType == WasteType.organic
                    ? AppColors.organicColor
                    : AppColors.nonOrganicColor);
                progressColor = (bin.binType == WasteType.organic
                    ? AppColors.organicColor
                    : AppColors.nonOrganicColor);
                textColor = AppColors.textPrimary;
              }

              return InkWell(
                onTap: () {
                  if (!isBinActive) {
                    _showThrottledSnackBar(
                      'Tempat sampah ini dalam status NON-AKTIF dan tidak dapat dipilih.',
                    );
                    return;
                  }

                  if (isPendingBin) {
                    _showCancelPendingDialog(bin, userId);
                    return;
                  }

                  if (bin.currentVolumeL <= 0.0) {
                    _showThrottledSnackBar(
                      'Tempat Sampah ${bin.binType.displayName} sudah kosong (0%), tidak perlu dikosongkan.',
                      backgroundColor: AppColors.primaryBlue,
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
                                ? Icon(
                                    Icons.do_not_disturb_on_rounded,
                                    color: iconColor,
                                    size: AppDimensions.iconMd,
                                  )
                                : isPendingBin
                                ? Icon(
                                    Icons.access_time_rounded,
                                    color: iconColor,
                                    size: AppDimensions.iconMd,
                                  )
                                : Image.asset(
                                    'assets/icons/recycle-bin.png',
                                    color: iconColor,
                                    width: AppDimensions.iconMd,
                                    height: AppDimensions.iconMd,
                                  ),
                            const SizedBox(width: AppDimensions.sm),
                            Expanded(
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Tempat Sampah ${bin.binType.displayName}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                            color: textColor,
                                          ),
                                    ),
                                  ),
                                  if (!isBinActive) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
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
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.warningYellow
                                            .withValues(alpha: 0.2),
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
                                    const SizedBox(width: 6),
                                    InkWell(
                                      onTap: () => _showCancelPendingDialog(bin, userId),
                                      borderRadius: BorderRadius.circular(6),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 3,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.dangerRed
                                              .withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(
                                            color: AppColors.dangerRed
                                                .withValues(alpha: 0.5),
                                            width: 0.8,
                                          ),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              Icons.cancel_outlined,
                                              size: 11,
                                              color: AppColors.dangerRed,
                                            ),
                                            SizedBox(width: 3),
                                            Text(
                                              'Batal',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.dangerRed,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ] else if (bin.currentVolumeL <= 0.0) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.green.shade50,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: Colors.green.shade200),
                                      ),
                                      child: const Text(
                                        'KOSONG (0%)',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primaryGreen,
                                        ),
                                      ),
                                    ),
                                  ] else ...[
                                    const SizedBox(width: 8),
                                    Icon(
                                      isSelected
                                          ? Icons.check_circle_rounded
                                          : Icons
                                                .radio_button_unchecked_rounded,
                                      color: isSelected
                                          ? AppColors.primaryGreen
                                          : AppColors.textHint,
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
                          borderRadius: BorderRadius.circular(
                            AppDimensions.radiusFull,
                          ),
                          child: LinearProgressIndicator(
                            value: isBinActive
                                ? bin.capacityPercent.clamp(0.0, 1.0)
                                : 0.0,
                            minHeight: 8,
                            backgroundColor: isBinActive
                                ? AppColors.border
                                : Colors.grey.shade300,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              progressColor,
                            ),
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
                                        : '${(bin.capacityPercent * 100).toStringAsFixed(0)}% terisi — '),
                              style: Theme.of(
                                context,
                              ).textTheme.bodySmall?.copyWith(color: textColor),
                            ),
                            Text(
                              '${bin.currentWeightKg.toStringAsFixed(1)} kg',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: textColor,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            Text(
                              ' / ',
                              style: Theme.of(
                                context,
                              ).textTheme.bodySmall?.copyWith(color: textColor),
                            ),
                            Text(
                              '${bin.maxWeightKg.toStringAsFixed(1)} kg',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: textColor,
                                    fontWeight: FontWeight.bold,
                                  ),
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

        if (!allBinsPending) ...[const SizedBox(height: AppDimensions.md)],

        // Upload Bukti
        if (!allBinsPending) ...[
          if (_evidencePhotoPath != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.primaryGreen.withValues(alpha: 0.3),
                ),
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
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.image_rounded,
                        color: AppColors.primaryGreen,
                        size: 36,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Foto Bukti Terpilih',
                          style: TextStyle(
                            color: AppColors.primaryGreen,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          '${_compressedKB.toStringAsFixed(0)} KB',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Ganti Foto',
                    icon: const Icon(
                      Icons.edit_rounded,
                      size: 20,
                      color: AppColors.primaryGreen,
                    ),
                    onPressed: _showImageSourcePicker,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    tooltip: 'Hapus Foto',
                    icon: const Icon(
                      Icons.close_rounded,
                      size: 20,
                      color: AppColors.dangerRed,
                    ),
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
                icon: const Icon(
                  Icons.camera_alt_outlined,
                  color: AppColors.primaryGreen,
                ),
                label: const Text(
                  'Upload Foto Bukti (< 5MB)',
                  style: TextStyle(
                    color: AppColors.primaryGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(
                    color: AppColors.primaryGreen,
                    width: 1.5,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
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
              onPressed: allBinsPending
                  ? () {
                      _showThrottledSnackBar(
                        'Seluruh tempat sampah Anda sedang dalam proses penjemputan oleh petugas.',
                        backgroundColor: AppColors.warningYellow,
                      );
                    }
                  : _selectedBinIds.isEmpty
                  ? () {
                      _showThrottledSnackBar(
                        'Pilih minimal satu tempat sampah yang ingin dikosongkan.',
                        backgroundColor: AppColors.warningYellow,
                      );
                    }
                  : isFotoEmpty
                  ? () {
                      _showThrottledSnackBar(
                        'Silakan upload foto bukti terlebih dahulu.',
                        backgroundColor: AppColors.warningYellow,
                      );
                      _showImageSourcePicker();
                    }
                  : () {
                      final binIds = _selectedBinIds.toList();
                      ref
                          .read(resetBinProvider.notifier)
                          .submitReset(
                            binIds: binIds,
                            userId: userId,
                            evidencePhotoPath: _evidencePhotoPath!,
                            wargaName: ref.read(authProvider).user?.name,
                            petugasId:
                                _selectedPetugasId ??
                                petugasState.statusResponse?.petugas?.id,
                          );
                    },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: allBinsPending
                    ? AppColors.warningYellow
                    : (canSubmit
                          ? AppColors.primaryGreen
                          : Colors.grey.shade300),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                allBinsPending
                    ? 'Semua Tempat Sampah Sedang Diproses'
                    : (_selectedBinIds.isEmpty
                          ? 'Pilih Tempat Sampah'
                          : 'Ajukan Pengosongan (${_selectedBinIds.length} Tempat Sampah)'),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: allBinsPending || canSubmit
                      ? Colors.white
                      : Colors.grey.shade600,
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
    final bool isAssigned = result.status == BinResetStatus.assigned;
    final bool isCancelled = result.status == BinResetStatus.cancelled;
    final bool isRejected = result.status == BinResetStatus.rejected;
    final bool isActionable = isPending || isAssigned;

    final IconData iconData = isAssigned
        ? Icons.local_shipping_rounded
        : isPending
            ? Icons.hourglass_top_rounded
            : isCancelled
                ? Icons.cancel_outlined
                : isRejected
                    ? Icons.highlight_off_rounded
                    : Icons.task_alt_rounded;

    final Color statusColor = isAssigned
        ? AppColors.primaryBlue
        : isPending
            ? AppColors.warningYellow
            : isCancelled
                ? Colors.grey
                : isRejected
                    ? AppColors.dangerRed
                    : AppColors.primaryGreen;

    final String titleText = isAssigned
        ? 'Petugas Menuju Lokasi'
        : isPending
            ? 'Pengajuan Terkirim!'
            : isCancelled
                ? 'Pengajuan Dibatalkan'
                : isRejected
                    ? 'Pengajuan Ditolak'
                    : AppStrings.resetSuccess;

    final String descText = isAssigned
        ? 'Pengajuan Anda telah diterima dan petugas sedang dalam perjalanan menuju lokasi Anda.'
        : isPending
            ? 'Foto bukti tempat sampah penuh berhasil dikirimkan ke Petugas Pemilah. Mohon tunggu verifikasi oleh Petugas Pemilah.'
            : isCancelled
                ? 'Pengajuan pengosongan tempat sampah telah berhasil dibatalkan.'
                : isRejected
                    ? (result.rejectReason ?? 'Pengajuan pengosongan tempat sampah ditolak oleh petugas.')
                    : 'Tempat sampah berhasil dikosongkan dan siap digunakan kembali.';

    final String statusLabel = isAssigned
        ? 'Status: PETUGAS SEDANG MENUJU LOKASI (ASSIGNED)'
        : isPending
            ? 'Status: MENUNGGU VERIFIKASI (PENDING)'
            : isCancelled
                ? 'Status: DIBATALKAN'
                : isRejected
                    ? 'Status: DITOLAK'
                    : 'Status: SELESAI';

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            iconData,
            size: AppDimensions.iconXxl,
            color: statusColor,
          ),
          const SizedBox(height: AppDimensions.md),
          Text(
            titleText,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: statusColor,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppDimensions.sm),
          Text(
            descText,
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppDimensions.lg),
          Container(
            padding: const EdgeInsets.all(AppDimensions.md),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  iconData,
                  color: statusColor,
                  size: 18,
                ),
                const SizedBox(width: AppDimensions.sm),
                Text(
                  statusLabel,
                  style: TextStyle(
                    color: statusColor,
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
          if (isActionable) ...[
            const SizedBox(height: AppDimensions.sm),
            TextButton.icon(
              onPressed: () async {
                final uid = ref.read(authProvider).user?.id;
                if (uid != null) {
                  final success = await ref.read(resetBinProvider.notifier).cancelReset(
                    uid,
                    requestId: result.id,
                    binId: result.binId,
                  );
                  ref.invalidate(binsProvider);
                  ref.invalidate(notificationsProvider);
                  if (context.mounted) {
                    if (success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Pengajuan pengosongan tempat sampah berhasil dibatalkan.'),
                          backgroundColor: AppColors.primaryGreen,
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                      Navigator.maybePop(context);
                    } else {
                      final err = ref.read(resetBinProvider).errorMessage ?? 'Gagal membatalkan pengajuan tempat sampah.';
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(err),
                          backgroundColor: AppColors.dangerRed,
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    }
                  }
                }
              },
              icon: const Icon(Icons.cancel_outlined, size: 16, color: AppColors.dangerRed),
              label: const Text(
                'Batalkan Pengajuan Ini',
                style: TextStyle(color: AppColors.dangerRed, fontSize: 13),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
