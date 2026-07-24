import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/platform_utils.dart';
import '../../domain/entities/bin_entity.dart';
import '../providers/bin_provider.dart';
import '../providers/connectivity_provider.dart';
import '../providers/notification_provider.dart';
import '../providers/waste_log_provider.dart';
import '../shared/widgets/app_loading.dart';
import '../shared/widgets/inline_camera_widget.dart';
import '../shared/widgets/qr_scanner_widget.dart';

/// Alur scan sampah — sesuai desain:
/// Step 1: Kamera + bottom sheet "Pindai Sampah" + tombol "Deteksi Sampah"
/// Step 2: Modal "Scan Berhasil!" dengan info AI
/// Step 3: Kamera QR + banner info + progress bar
/// Step 4: Modal "Pencatatan Berhasil!"
/// Error: Modal khusus per error code
class ScanFlowScreen extends ConsumerStatefulWidget {
  const ScanFlowScreen({super.key});

  @override
  ConsumerState<ScanFlowScreen> createState() => _ScanFlowScreenState();
}

class _ScanFlowScreenState extends ConsumerState<ScanFlowScreen> {
  // GPS — diisi dari geolocator saat scan QR, fallback null (skip geofencing)
  double? _userLat;
  double? _userLng;
  bool _gpsLoading = false;

  // State foto
  bool _photoTaken = false;
  double _compressedKB = 0;
  String _capturedImagePath = ''; // path foto yang diambil kamera

  // Counter untuk mereset QR Scanner jika terjadi error
  int _qrScanAttempt = 0;

  @override
  void initState() {
    super.initState();
    _fetchGps();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(scanFlowProvider.notifier).reset();
    });
    _photoTaken = false;
    super.dispose();
  }

  /// Minta izin lokasi dan ambil koordinat GPS sekarang.
  /// Di desktop/web: lewati (geofencing di-skip, backend tetap proses).
  Future<void> _fetchGps() async {
    if (!PlatformUtils.isMobile) return;
    if (!mounted) return;

    setState(() => _gpsLoading = true);

    try {
      // Cek permission
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }

      if (perm == LocationPermission.deniedForever ||
          perm == LocationPermission.denied) {
        // Izin ditolak — tetap lanjut tanpa GPS (backend skip geofencing)
        if (mounted) setState(() => _gpsLoading = false);
        return;
      }

      // Ambil posisi dengan akurasi medium (lebih cepat dari high)
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 8),
        ),
      );

      if (mounted) {
        setState(() {
          _userLat = pos.latitude;
          _userLng = pos.longitude;
          _gpsLoading = false;
        });
      }
    } catch (_) {
      // GPS timeout atau error — lanjut tanpa koordinat
      if (mounted) setState(() => _gpsLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(scanFlowProvider);
    final bool isOnline = ref.watch(isOnlineProvider);

    ref.listen<ScanFlowState>(scanFlowProvider, (prev, next) {
      if (next.errorCode != null && !next.isLoading) {
        _showErrorDialog(context, next.errorCode!, next.errorMessage);
        ref.read(scanFlowProvider.notifier).clearError();
        if (mounted) {
          setState(() {
            _qrScanAttempt++;
          });
        }
      }
      // Saat AI berhasil (step 1→2), tampilkan bottom sheet konfirmasi AI dulu.
      // QR Scanner baru aktif setelah user tap "Lanjut" di sheet.
      if ((prev?.currentStep ?? 0) <= 1 &&
          next.currentStep == 2 &&
          next.aiResult != null &&
          !next.isLoading) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            showAiSuccessSheet(context, ref);
          }
        });
      }
      // ─── AUTO-REFRESH setelah transaksi berhasil (step 2→3) ─────────────
      // Invalidate semua provider terkait agar data langsung segar di semua
      // layar (Beranda, Riwayat, Poin) tanpa user harus pull-to-refresh manual.
      if ((prev?.currentStep ?? 0) < 3 &&
          next.currentStep == 3 &&
          next.scanResult != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            ref.invalidate(wasteLogsProvider);
            ref.invalidate(totalPointsProvider);
            ref.invalidate(pointHistoryProvider);
            ref.invalidate(dailyPointsProvider);
            ref.invalidate(notificationsProvider);
            ref.invalidate(binsProvider);
          }
        });
      }
    });

    return PopScope(
      canPop: state.currentStep == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          // You could show a toast here if you want to tell them they can't leave,
          // but 'mode absolute' means just ignoring the back press.
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            // Background kamera simulasi
            _buildCameraBackground(state.currentStep),
            // Content sesuai step
            if (state.isLoading)
              const Center(child: AppLoading())
            else
              _buildStepContent(context, state, isOnline),
          ],
        ),
      ),
    );
  }

  Widget _buildCameraBackground(int step) {
    // Simulasi background kamera — abu gelap
    return Container(
      color: const Color(0xFF1A1A1A),
      child: Center(
        child: Icon(
          step == 2 ? Icons.qr_code_scanner_rounded : Icons.camera_alt_rounded,
          color: Colors.white12,
          size: 120,
        ),
      ),
    );
  }

  Widget _buildStepContent(
    BuildContext context,
    ScanFlowState state,
    bool isOnline,
  ) {
    switch (state.currentStep) {
      case 0:
        return _buildStep0(context, isOnline);
      case 1:
        return _buildStep1Loading(); // AI sedang memproses
      case 2:
        return _buildStep2QrScan(context, state);
      case 3:
        return _buildStep3Success(context, state);
      default:
        return _buildStep0(context, isOnline);
    }
  }

  /// Step 1: Loading screen saat AI sedang mendeteksi jenis sampah.
  Widget _buildStep1Loading() {
    return Column(
      children: [
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                ),
                const Expanded(
                  child: Text(
                    'Analisis AI',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(width: 48),
              ],
            ),
          ),
        ),
        Expanded(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Animasi pulsing icon AI
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.85, end: 1.0),
                  duration: const Duration(milliseconds: 800),
                  curve: Curves.easeInOut,
                  builder: (_, scale, child) =>
                      Transform.scale(scale: scale, child: child),
                  child: Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.psychology_rounded,
                      color: AppColors.primaryGreen,
                      size: 52,
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                const Text(
                  'Menganalisis Sampah...',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'AI sedang mendeteksi jenis dan berat\nsampah dari foto Anda.',
                  style: TextStyle(color: Colors.white60, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                const SizedBox(
                  width: 180,
                  child: LinearProgressIndicator(
                    backgroundColor: Colors.white24,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppColors.primaryGreen,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// Step 0: Kamera inline di dalam app + bottom sheet
  Widget _buildStep0(BuildContext context, bool isOnline) {
    return Column(
      children: [
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                ),
                const Expanded(
                  child: Text(
                    'Foto Sampah',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(width: 48),
              ],
            ),
          ),
        ),
        Expanded(
          child: InlineCameraWidget(
            onImageCaptured: (path, sizeKB) {
              setState(() {
                _capturedImagePath = path;
                _compressedKB = sizeKB;
                _photoTaken = true;
              });
            },
          ),
        ),
        Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                _photoTaken ? 'Foto Siap - Kirim ke AI' : 'Ambil Foto Sampah',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _photoTaken
                    ? 'Foto berhasil diambil (${_compressedKB.toStringAsFixed(0)} KB).\nTap "Deteksi Sampah" untuk analisis AI.'
                    : 'Ambil foto sampah langsung dari kamera\natau pilih dari galeri.',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 18),
              if (!isOnline)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.dangerRed.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Koneksi internet diperlukan.',
                    style: TextStyle(color: AppColors.dangerRed, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                )
              else if (_photoTaken)
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () => ref
                        .read(scanFlowProvider.notifier)
                        .detectWaste(imagePath: _capturedImagePath),
                    icon: const Icon(Icons.psychology_rounded, size: 20),
                    label: const Text(
                      'Deteksi Sampah',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        final picker = ImagePicker();
                        final file = await picker.pickImage(
                            source: ImageSource.gallery, imageQuality: 85);
                        if (file != null) {
                          final size = (await file.length()) / 1024;
                          setState(() {
                            _capturedImagePath = file.path;
                            _compressedKB = size;
                            _photoTaken = true;
                          });
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Gagal membuka galeri: $e')),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.photo_library_rounded, size: 20),
                    label: const Text(
                      'Pilih dari Galeri',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primaryGreen,
                      side: const BorderSide(color: AppColors.primaryGreen),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 24),
              _buildProgressBar(0),
            ],
          ),
        ),
      ],
    );
  }

  /// Step 2: Kamera QR nyata via QrScannerWidget
  Widget _buildStep2QrScan(BuildContext context, ScanFlowState state) {
    final result = state.aiResult;
    if (result == null) return _buildStep0(context, true);
    final bool isOrganic = result.detectedType == WasteType.organic;

    return Column(
      children: [
        const SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                SizedBox(width: 48),
                Expanded(
                  child: Text(
                    'Scan QR Tong Sampah',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                Icon(Icons.info_outline_rounded, color: Colors.white),
              ],
            ),
          ),
        ),

        // Banner kuning info jenis sampah terdeteksi + status GPS
        Container(
          color: AppColors.warningYellow,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              const Icon(
                Icons.qr_code_scanner_rounded,
                color: Colors.white,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Sampah: ${result.detectedType.displayName} '
                  '(${(result.volumeEstimate * (isOrganic ? 0.4 : 0.2)).toStringAsFixed(1)} kg) '
                  '— Arahkan ke tong ${result.detectedType.displayName.toUpperCase()}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              // Indikator GPS
              if (_gpsLoading)
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              else
                Icon(
                  _userLat != null
                      ? Icons.gps_fixed_rounded
                      : Icons.gps_off_rounded,
                  color: Colors.white,
                  size: 16,
                ),
            ],
          ),
        ),

        // QR Scanner nyata (mobile) atau input manual (desktop/web)
        Expanded(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: QrScannerWidget(
                key: ValueKey(_qrScanAttempt),
                hint: isOrganic ? 'BIN-ORG-EF2072F0' : 'BIN-ANORG-8215BE3D',
                overlayColor: AppColors.primaryGreen,
                onQrDetected: (qrCode) {
                  // Guard: skip jika sudah loading atau sudah sukses
                  final s = ref.read(scanFlowProvider);
                  if (s.isLoading || s.scanResult != null) return;
                  
                  // Local validation: pastikan QR sesuai jenis AI
                  final isOrganicAI = s.aiResult?.detectedType == WasteType.organic;
                  final upperQr = qrCode.toUpperCase();
                  final isScanOrganik = !upperQr.contains('NON') && !upperQr.contains('ANORG');
                  
                  if (isOrganicAI && !isScanOrganik) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Bin yang di-scan adalah Anorganik, sedangkan sampah Anda Organik.'),
                        backgroundColor: AppColors.dangerRed,
                      ),
                    );
                    return;
                  } else if (!isOrganicAI && isScanOrganik) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Bin yang di-scan adalah Organik, sedangkan sampah Anda Anorganik.'),
                        backgroundColor: AppColors.dangerRed,
                      ),
                    );
                    return;
                  }

                  ref
                      .read(scanFlowProvider.notifier)
                      .scanAndCommit(
                        qrCode: qrCode,
                        userLat: _userLat ?? 0.0,
                        userLng: _userLng ?? 0.0,
                      );
                },
              ),
            ),
          ),
        ),

        // Bottom sheet info
        Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Icon(
                    Icons.qr_code_scanner_rounded,
                    color: AppColors.primaryGreen,
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Verifikasi Lokasi Pembuangan',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Arahkan kamera ke QR Code pada tong sampah '
                'untuk memverifikasi lokasi pembuangan Anda.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              _buildProgressBar(1),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProgressBar(int active) {
    const steps = ['Identifikasi', 'Verifikasi Tong', 'Selesai'];

    return Row(
      children: List.generate(steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          return const SizedBox(width: 8);
        }
        final idx = i ~/ 2;
        final bool done = idx < active;
        final bool current = idx == active;
        return Expanded(
          child: Column(
            children: [
              Container(
                height: 4,
                decoration: BoxDecoration(
                  color: done || current
                      ? (current
                            ? AppColors.primaryGreen
                            : AppColors.primaryGreenLight)
                      : Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                steps[idx],
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: current ? FontWeight.w600 : FontWeight.w400,
                  color: current ? AppColors.primaryGreen : AppColors.textHint,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      }),
    );
  }

  /// Step 3: Modal "Pencatatan Berhasil!"
  Widget _buildStep3Success(BuildContext context, ScanFlowState state) {
    final result = state.scanResult;
    if (result == null) return const SizedBox.shrink();

    // Cari info bin untuk progress
    final double newVol = result.newBinVolumeL;
    const double maxVol = 25.0;
    final double pct = (newVol / maxVol).clamp(0.0, 1.0);

    return Container(
      color: Colors.black54,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Checkmark hijau
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.white,
                    size: 36,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Pencatatan Berhasil!',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Data sampah Anda telah terverifikasi\nke dalam sistem.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                // Kategori + Berat
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundCanvas,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'KATEGORI',
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              state.aiResult?.detectedType.displayName ??
                                  'Organik',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundCanvas,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              'BERAT',
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${result.weightKg.toStringAsFixed(1)} kg',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Kapasitas tong
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Maks Tong',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            '${newVol.toStringAsFixed(1)} kg',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: pct,
                          minHeight: 8,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(
                            pct >= 0.9
                                ? AppColors.dangerRed
                                : AppColors.primaryGreen,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Maks ${maxVol.toStringAsFixed(0)} kg',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textHint,
                            ),
                          ),
                          Text(
                            '${(pct * 100).toStringAsFixed(0)}% Tercapai',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Poin banner
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF8E1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: const BoxDecoration(
                          color: AppColors.warningYellow,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.star_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Selamat!',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.warningYellow,
                            ),
                          ),
                          Text(
                            'Anda mendapat +${result.pointsAwarded} poin',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.warningYellow,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                _buildProgressBar(2),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    // Invalidate ulang sebagai safety fallback sebelum kembali
                    // (mencegah edge case jika addPostFrameCallback terlewat)
                    ref.invalidate(wasteLogsProvider);
                    ref.invalidate(totalPointsProvider);
                    ref.invalidate(pointHistoryProvider);
                    ref.invalidate(dailyPointsProvider);
                    ref.invalidate(notificationsProvider);
                    ref.invalidate(binsProvider);
                    ref.read(scanFlowProvider.notifier).reset();
                    Navigator.of(context).pop();
                  },
                  child: const Text('SELESAI'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showErrorDialog(
    BuildContext context,
    String errorCode,
    String? errorMessage,
  ) {
    if (errorCode == 'BIN_TYPE_MISMATCH') {
      _showMismatchDialog(context);
    } else if (errorCode == 'IMAGE_UNREADABLE' || errorCode == 'AI_TIMEOUT') {
      _showScanFailedDialog(context, errorMessage);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage ?? 'Terjadi kesalahan.'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
    }
  }

  /// Dialog BIN_TYPE_MISMATCH — "Tidak Sesuai!" dengan info sampah vs tong
  void _showMismatchDialog(BuildContext context) {
    final aiResult = ref.read(scanFlowProvider).aiResult;
    final String detectedName = aiResult?.detectedType.displayName ?? 'Organik';
    // Tong yang salah = kebalikan dari yang terdeteksi
    final String tongName = aiResult?.detectedType == WasteType.organic
        ? 'Non-Organik'
        : 'Organik';

    showDialog(
      context: context,
      builder: (_) => _MismatchDialog(
        sampahType: detectedName,
        tongType: tongName,
        onScanUlang: () {
          Navigator.of(context).pop();
          ref.read(scanFlowProvider.notifier).clearError();
        },
        onBatal: () {
          Navigator.of(context).pop();
          ref.read(scanFlowProvider.notifier).reset();
          Navigator.of(context).pop();
        },
      ),
    );
  }

  /// Dialog scan gagal — "Scan Gagal" merah
  void _showScanFailedDialog(BuildContext context, String? message) {
    showDialog(
      context: context,
      builder: (_) => _ScanFailedDialog(
        message: message ?? 'Barcode tidak terbaca oleh sistem.',
        onRetry: () {
          Navigator.of(context).pop();
          ref.read(scanFlowProvider.notifier).reset();
        },
      ),
    );
  }
}

// ─── Dialog: Scan Berhasil Step 1 (AI Result) ────────────────────────────────

/// Ditampilkan saat AI berhasil mendeteksi — "Scan Berhasil!"
void showAiSuccessSheet(BuildContext context, WidgetRef ref) {
  final state = ref.read(scanFlowProvider);
  final result = state.aiResult;
  if (result == null) return;
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    isDismissible: false,
    enableDrag: false,
    backgroundColor: Colors.transparent,
    builder: (_) => PopScope(
      canPop: false,
      child: _AiSuccessSheet(result: result, ref: ref),
    ),
  );
}

class _AiSuccessSheet extends StatelessWidget {
  const _AiSuccessSheet({required this.result, required this.ref});
  final dynamic result;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final bool isOrganic = result.detectedType == WasteType.organic;
    return SafeArea(
      top: false,
      child: Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              color: AppColors.primaryGreen,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Colors.white,
              size: 36,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Deteksi Berhasil!',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.primaryGreen,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Data sampah terdeteksi secara cerdas oleh\nsistem AI kami.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          
          // Container AI Results
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.backgroundCanvas,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Rekomendasi Bin
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: (isOrganic ? AppColors.organicColor : AppColors.nonOrganicColor).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.delete_rounded,
                        color: isOrganic ? AppColors.organicColor : AppColors.nonOrganicColor,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'REKOMENDASI TONG',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textHint,
                            ),
                          ),
                          Text(
                            'Bin ${result.detectedType.displayName}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: isOrganic ? AppColors.organicColor : AppColors.nonOrganicColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 16),
                
                // Confidence & Estimasi Berat
                Row(
                  children: [
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.psychology_rounded,
                        label: 'CONFIDENCE',
                        value: '${((result.confidence ?? 0.85) * 100).toStringAsFixed(0)}%',
                      ),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        icon: Icons.scale_rounded,
                        label: 'EST. BERAT',
                        value: '${result.displayWeightKg.toStringAsFixed(1)} kg',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Progress Bar Organik vs Anorganik
                const Text(
                  'KOMPOSISI SAMPAH',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textHint,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      'Org',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.organicColor,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: result.organicPercentage ?? (isOrganic ? 0.85 : 0.15),
                          minHeight: 8,
                          backgroundColor: AppColors.nonOrganicColor,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.organicColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Anorg',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.nonOrganicColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 12),
                
                // Estimasi Poin
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Estimasi Poin:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(
                          Icons.stars_rounded,
                          color: AppColors.warningYellow,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '+${result.estimatedPoints ?? (isOrganic ? 150 : 100)} Pts',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.warningYellow,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                // State sudah di step 2 dari provider
              },
              icon: const Icon(Icons.qr_code_scanner_rounded, size: 20),
              label: const Text(
                'LANJUT SCAN TONG SAMPAH',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
      ),
    );
  }

  Widget _buildDetailItem({required IconData icon, required String label, required String value}) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.textHint,
              ),
            ),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─── Dialog: BIN_TYPE_MISMATCH ───────────────────────────────────────────────

class _MismatchDialog extends StatelessWidget {
  const _MismatchDialog({
    required this.sampahType,
    required this.tongType,
    required this.onScanUlang,
    required this.onBatal,
  });

  final String sampahType;
  final String tongType;
  final VoidCallback onScanUlang;
  final VoidCallback onBatal;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.warningOrange.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: AppColors.warningOrange,
                size: 36,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Tidak Sesuai!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            // SAMPAH vs TONG
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: AppColors.dangerRed.withValues(alpha: 0.2),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            const Text(
                              'SAMPAH',
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                sampahType.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.close_rounded,
                        color: AppColors.dangerRed,
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            const Text(
                              'TONG',
                              style: TextStyle(
                                fontSize: 10,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                tongType.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(
                        Icons.info_outline_rounded,
                        size: 14,
                        color: AppColors.dangerRed,
                      ),
                      SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'Jenis sampah tidak cocok dengan kategori tong yang dipilih. Harap masukkan sampah ke tempat yang sesuai.',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.dangerRed,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onScanUlang,
              icon: const Icon(Icons.qr_code_scanner_rounded),
              label: const Text('SCAN ULANG TONG YANG BENAR'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.warningOrange,
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: onBatal,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.border),
                foregroundColor: AppColors.textSecondary,
              ),
              child: const Text('BATAL'),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Dialog: Scan Gagal ───────────────────────────────────────────────────────

class _ScanFailedDialog extends StatelessWidget {
  const _ScanFailedDialog({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: AppColors.dangerRed,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.close_rounded,
                color: Colors.white,
                size: 36,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Scan Gagal',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.dangerRed,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('COBA ULANG'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.dangerRed,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
