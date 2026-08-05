import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
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
      wargaId = rawArgs.binId.isNotEmpty ? rawArgs.binId : rawArgs.wargaName;
      wargaName = rawArgs.wargaName;
    } else if (rawArgs is String) {
      wargaId = rawArgs;
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text('Aktivasi Bin: $wargaName', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppDimensions.md),
            color: Colors.black,
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: _step == 2 ? AppColors.primaryGreen : Colors.grey[800],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md),
            child: Text(
              _step == 1 ? 'Tahap 1: Scan QR Bin Organik' : 'Tahap 2: Scan QR Bin Anorganik',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: AppDimensions.md),
          Expanded(
            child: QrScannerWidget(
              key: ValueKey(_step),
              hint: 'Arahkan kamera ke QR Code',
              overlayColor: _step == 1 ? AppColors.primaryGreen : AppColors.primaryBlueDark,
              onQrDetected: (qrCode) async {
                if (_step == 1) {
                  setState(() {
                    _binOrganikId = qrCode;
                    _step = 2;
                  });
                  return true;
                } else {
                  setState(() {
                    _binAnorganikId = qrCode;
                  });

                  // Show loading indicator
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (_) => const Center(
                      child: CircularProgressIndicator(color: AppColors.primaryGreen),
                    ),
                  );

                  // Submit bin activation
                  final success = await ref.read(aktivasiWargaProvider.notifier).activateBin(
                    wargaId,
                    _binOrganikId,
                    _binAnorganikId,
                  );

                  if (mounted) {
                    Navigator.of(context, rootNavigator: true).pop(); // Close dialog
                  }

                  if (success && mounted) {
                    // Catat notifikasi ke FirebaseNotificationService & LocalCache agar tersimpan di disk Halaman Notifikasi in-app
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
                    ref.read(mahasiswaControllerProvider.notifier).fetchAll();
                    ref.read(aktivasiWargaProvider.notifier).refresh();

                    // Tampilkan Success Modal Dialog Pop-up
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
                              'Berhasil mengaktifkan tempat sampah milik $wargaName!\n\nWarga kini resmi terdaftar di daftar Warga Dampingan Anda.',
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
                      Navigator.pop(context);
                    }
                    return true;
                  } else if (mounted) {
                    final err = ref.read(aktivasiWargaProvider).errorMessage ?? 'Gagal mengaktivasi tempat sampah.';
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(err),
                        backgroundColor: AppColors.dangerRed,
                        duration: const Duration(seconds: 3),
                      ),
                    );
                    setState(() {
                      _binAnorganikId = '';
                    });
                    return false;
                  }
                  return false;
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}
