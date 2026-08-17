import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../core/values/app_colors.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
import '../../shared/widgets/feature_rating_dialog.dart';
import '../controllers/aktivasi_warga_controller.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/mahasiswa_notifikasi_controller.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/firebase_notification_service.dart';

class AktivasiWargaView extends ConsumerStatefulWidget {
  const AktivasiWargaView({super.key});

  @override
  ConsumerState<AktivasiWargaView> createState() => _AktivasiWargaViewState();
}

class _AktivasiWargaViewState extends ConsumerState<AktivasiWargaView> {
  int _step = 1;
  String _binOrganikId = '';
  String _binAnorganikId = '';
  bool _isProcessing = false;

  /// Memvalidasi format & kategori QR Code tempat sampah
  String? _validateBinQr(String qr, int step) {
    final lower = qr.toLowerCase().trim();

    // 1. Tolak QR acak / URL / link web yang bukan format tempat sampah
    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('www.')) {
      return 'QR Code tidak valid!\n\nTerdeteksi sebagai tautan web. Pastikan Anda memindai stiker QR Code resmi fisik pada tempat sampah TrashCare.';
    }

    // 2. Minimal panjang kode QR tempat sampah yang wajar
    if (qr.trim().length < 3) {
      return 'Format QR Code terlalu pendek atau tidak valid. Harap pindai kode QR tempat sampah resmi Pilah Sampah Cerdas.';
    }

    // Pola Anorganik
    final isAnorganicPattern = lower.contains('anorganik') ||
        lower.contains('anorg') ||
        lower.contains('non') ||
        lower.contains('an-org') ||
        lower.contains('non-org') ||
        lower.contains('an_org') ||
        lower.contains('plastik') ||
        lower.contains('kertas') ||
        lower.contains('logam');

    // Pola Organik
    final isOrganicPattern = !isAnorganicPattern &&
        (lower.contains('organik') ||
            lower.contains('organ') ||
            lower.contains('org') ||
            lower.contains('kompos') ||
            lower.contains('basah'));

    if (step == 1) {
      // Step 1: Harus Organik
      if (isAnorganicPattern) {
        return 'QR Code yang Anda scan terdeteksi sebagai Tempat Sampah ANORGANIK.\n\nHarap scan barcode pada Tempat Sampah ORGANIK (Warna Hijau) untuk Tahap 1.';
      }
    } else if (step == 2) {
      // Step 2: Harus Anorganik
      if (isOrganicPattern) {
        return 'QR Code yang Anda scan terdeteksi sebagai Tempat Sampah ORGANIK.\n\nHarap scan barcode pada Tempat Sampah ANORGANIK (Warna Kuning) untuk Tahap 2.';
      }
      if (qr.trim().toUpperCase() == _binOrganikId.trim().toUpperCase()) {
        return 'QR Code Tempat Sampah Anorganik tidak boleh sama dengan QR Code Organik. Silakan scan tempat sampah Anorganik yang berbeda.';
      }
    }

    return null; // Valid
  }

  Future<void> _handleQrDetected(String qrCode, String wargaId, String wargaName) async {
    if (_isProcessing) return;
    _isProcessing = true;

    final cleanQr = qrCode.trim();
    if (cleanQr.isEmpty) {
      _isProcessing = false;
      return;
    }

    if (wargaId.trim().isEmpty) {
      _isProcessing = false;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('ID Warga tidak ditemukan. Silakan pilih ulang warga dari daftar.'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
      return;
    }

    // Validasi kesesuaian kategori QR (Organik vs Anorganik vs Random)
    final validationError = _validateBinQr(cleanQr, _step);
    if (validationError != null) {
      await showDialog(
        context: context,
        builder: (dialogCtx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: AppColors.dangerRed, size: 28),
              SizedBox(width: 10),
              Expanded(child: Text('Kategori QR Tidak Sesuai', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
            ],
          ),
          content: Text(validationError, style: const TextStyle(fontSize: 13, height: 1.4)),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen),
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Pindai Ulang', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      _isProcessing = false;
      return;
    }

    if (_step == 1) {
      // Step 1: Scan Organik QR
      final confirmed = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (dialogCtx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.eco_rounded, color: AppColors.primaryGreen, size: 28),
              SizedBox(width: 10),
              Expanded(child: Text('QR Organik Terdeteksi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Kode QR Tempat Sampah Organik:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              const SizedBox(height: 4),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                ),
                child: Text(
                  cleanQr,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primaryGreen),
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Tekan tombol di bawah untuk melanjutkan ke pindaian tempat sampah Anorganik (Tahap 2).',
                style: TextStyle(fontSize: 12, color: AppColors.textPrimary),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx, false),
              child: const Text('Scan Ulang', style: TextStyle(color: AppColors.dangerRed)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () => Navigator.pop(dialogCtx, true),
              child: const Text('Lanjut ke Scan Anorganik', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      );

      if (confirmed == true && mounted) {
        setState(() {
          _binOrganikId = cleanQr;
          _step = 2;
        });
      }
      _isProcessing = false;
    } else {
      // Step 2: Scan Anorganik QR

      // Show confirmation dialog before processing activation
      final processConfirm = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (dialogCtx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.verified_user_rounded, color: AppColors.primaryGreen, size: 28),
              SizedBox(width: 10),
              Expanded(child: Text('Konfirmasi Aktivasi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Warga Binaan: $wargaName', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 12),
              const Text('QR Organik:', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              Text(_binOrganikId, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.primaryGreen)),
              const SizedBox(height: 8),
              const Text('QR Anorganik:', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              Text(cleanQr, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.nonOrganicColor)),
              const SizedBox(height: 14),
              const Text(
                'Lokasi GPS saat ini akan direkam sebagai lokasi fisik tempat sampah Warga.',
                style: TextStyle(fontSize: 11, color: AppColors.textHint, fontStyle: FontStyle.italic),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx, false),
              child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () => Navigator.pop(dialogCtx, true),
              child: const Text('Proses Aktivasi Sekarang', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      );

      if (processConfirm != true) {
        _isProcessing = false;
        return;
      }

      setState(() {
        _binAnorganikId = cleanQr;
      });

      // Show loading indicator
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => const Center(
            child: CircularProgressIndicator(color: AppColors.primaryGreen),
          ),
        );
      }

      // Submit bin activation to backend
      final success = await ref.read(aktivasiWargaProvider.notifier).activateBin(
        wargaId,
        _binOrganikId,
        _binAnorganikId,
      );

      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop(); // Close loading dialog
      }

      if (success && mounted) {
        // Catat notifikasi lokal
        final user = ref.read(authProvider).user;
        if (user != null) {
          await FirebaseNotificationService().saveNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Tempat Sampah QR Warga Berhasil Dipasang',
            desc: 'Aktivasi Tempat Sampah QR untuk Warga Binaan ($wargaName) sukses terdaftar.',
            type: 'AKTIVASI_BIN_SUKSES',
          );

          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Tempat Sampah QR Warga Berhasil Dipasang',
            desc: 'Aktivasi Tempat Sampah QR untuk Warga Binaan ($wargaName) sukses terdaftar.',
            type: 'AKTIVASI_BIN_SUKSES',
          );
        }

        // Invalidate state agar Warga & Tempat Sampah langsung ter-update di Mahasiswa dan Warga
        ref.invalidate(mahasiswaControllerProvider);
        ref.invalidate(mahasiswaNotificationsProvider);
        await ref.read(mahasiswaControllerProvider.notifier).fetchAll();
        await ref.read(aktivasiWargaProvider.notifier).refresh();

        // Tampilkan Full Dialog Modal Berhasil Aktivasi
        if (mounted) {
          await showDialog(
            context: context,
            barrierDismissible: false,
            builder: (modalCtx) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              contentPadding: const EdgeInsets.all(24),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.primaryGreen,
                      size: 56,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Aktivasi Berhasil!',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Berhasil mengaktifkan tempat sampah milik Warga Binaan $wargaName!\n\nWarga kini resmi terdaftar di daftar Warga Dampingan Anda.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(modalCtx);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text(
                        'Selesai',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );

          if (mounted) {
            // Rating dialog 1-5 bintang (hanya muncul 1x saat pertama kali berhasil aktivasi warga binaan)
            await showFeatureRatingOnceIfNeeded(
              context: context,
              featureKey: 'mahasiswa_aktivasi_warga',
              featureTitle: 'Aktivasi Warga Berhasil! ⭐',
              featureSubtitle: 'Bagaimana pengalaman Anda saat pertama kali membantu proses aktivasi tempat sampah warga binaan?',
              roleTag: 'Mahasiswa KKN',
            );

            if (mounted) {
              Navigator.pop(context);
            }
          }
        }
      } else if (mounted) {
        final err = ref.read(aktivasiWargaProvider).errorMessage ?? 'Gagal mengaktivasi tempat sampah. QR Code mungkin sudah pernah terdaftar.';
        await showDialog(
          context: context,
          builder: (dialogCtx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.error_outline_rounded, color: AppColors.dangerRed, size: 28),
                SizedBox(width: 10),
                Expanded(child: Text('Aktivasi Gagal')),
              ],
            ),
            content: Text(err),
            actions: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen),
                onPressed: () => Navigator.pop(dialogCtx),
                child: const Text('Coba Lagi', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
        setState(() {
          _binAnorganikId = '';
        });
      }
      _isProcessing = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final rawArgs = ModalRoute.of(context)?.settings.arguments;
    String wargaId = '';
    String wargaName = 'Warga';

    if (rawArgs is Map<String, dynamic>) {
      final wargaMap = rawArgs['warga'] as Map<String, dynamic>? ?? rawArgs;
      wargaId = wargaMap['id']?.toString() ?? wargaMap['wargaId']?.toString() ?? wargaMap['binId']?.toString() ?? '';
      wargaName = wargaMap['name']?.toString() ?? wargaMap['wargaName']?.toString() ?? 'Warga';
    } else if (rawArgs is WargaDampingan) {
      wargaId = rawArgs.wargaId.isNotEmpty ? rawArgs.wargaId : rawArgs.wargaName;
      wargaName = rawArgs.wargaName;
    } else if (rawArgs is String) {
      wargaId = rawArgs;
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ─── Full Camera Screen QR Scanner Widget ──────────────────────────
          QrScannerWidget(
            isFullScreen: true,
            hint: _step == 1 ? 'Scan QR Tempat Sampah Organik' : 'Scan QR Tempat Sampah Anorganik',
            overlayColor: _step == 1 ? const Color(0xFF10B981) : const Color(0xFFFFB800),
            onQrDetected: (qrCode) async {
              await _handleQrDetected(qrCode, wargaId, wargaName);
              return true;
            },
          ),

          // ─── Floating Bottom Bar & Step Progress Overlay ─────────────────────
          SafeArea(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                margin: const EdgeInsets.only(left: 16, right: 16, bottom: 24, top: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF121212).withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _step == 1 ? const Color(0xFF10B981) : const Color(0xFFFFB800),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: (_step == 1 ? const Color(0xFF10B981) : const Color(0xFFFFB800)).withValues(alpha: 0.3),
                      blurRadius: 16,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        InkWell(
                          onTap: () => Navigator.pop(context),
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Aktivasi Tempat Sampah Warga',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white.withValues(alpha: 0.6),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                wargaName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Progress Bar 2-Step
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 6,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981), // Organik Green
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            height: 6,
                            decoration: BoxDecoration(
                              color: _step == 2 ? const Color(0xFFFFB800) : Colors.white24, // Non-organik Yellow
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Status Text (Hijau untuk Organik, Kuning untuk Non-Organik)
                    Row(
                      children: [
                        Icon(
                          _step == 1 ? Icons.eco_rounded : Icons.category_rounded,
                          color: _step == 1 ? const Color(0xFF10B981) : const Color(0xFFFFB800),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _step == 1
                                ? 'Tahap 1 dari 2: Scan QR Tempat Sampah Organik (Hijau)'
                                : 'Tahap 2 dari 2: Scan QR Tempat Sampah Anorganik (Kuning)',
                            style: TextStyle(
                              color: _step == 1 ? const Color(0xFF10B981) : const Color(0xFFFFB800),
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
