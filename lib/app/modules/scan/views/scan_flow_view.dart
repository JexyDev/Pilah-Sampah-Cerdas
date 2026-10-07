import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lottie/lottie.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../../../routes/app_routes.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/platform_utils.dart';
import '../../../data/models/bin_entity.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../scan/controllers/scan_controller.dart';
import '../../shared/controllers/connectivity_controller.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../../shared/widgets/weight_text.dart';
import '../../riwayat/controllers/riwayat_controller.dart';
import '../../shared/widgets/app_loading.dart';
import '../../shared/widgets/inline_camera_widget.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
import '../../shared/widgets/feature_rating_dialog.dart';
import '../../shared/controllers/user_location_controller.dart';

/// Alur scan sampah — sesuai desain:
/// Step 1: Kamera + bottom sheet "Pindai Sampah" + tombol "Deteksi Sampah"
/// Step 2: Modal "Scan Berhasil!" dengan info AI
/// Step 3: Kamera QR + banner info + progress bar
/// Step 4: Modal "Pencatatan Berhasil!"
/// Error: Modal khusus per error code
class ScanFlowView extends ConsumerStatefulWidget {
  const ScanFlowView({super.key});

  @override
  ConsumerState<ScanFlowView> createState() => _ScanFlowViewState();
}

class _ScanFlowViewState extends ConsumerState<ScanFlowView> {
  // GPS — diisi dari geolocator saat scan QR, fallback null (skip geofencing)
  double? _userLat;
  final GlobalKey<QrScannerWidgetState> _qrScannerKey =
      GlobalKey<QrScannerWidgetState>();
  double? _userLng;
  double? _gpsAccuracy;
  DateTime? _gpsTimestamp;
  bool _gpsLoading = false;
  bool _isAiSheetOpen = false;

  // State foto
  bool _photoTaken = false;
  double _compressedKB = 0;
  String _capturedImagePath = ''; // path foto yang diambil kamera
  DateTime? _lastWarningTime;
  String? _lastWarningMsg;

  @override
  void initState() {
    super.initState();
    // Warm-up GPS secara senyap dan cepat sejak halaman dibuka
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initGps();
      // Selalu refresh binsProvider saat scan dibuka agar status pengosongan tempat sampah selalu mutakhir dari server
      ref.invalidate(binsProvider);
    });
  }

  @override
  void dispose() {
    // ponytail: scanFlowProvider is autoDispose — state resets when no watcher remains
    super.dispose();
  }

  void _showThrottledWarning(String message) {
    final now = DateTime.now();
    // ponytail: suppress duplicate warning within 3s window to prevent spam
    if (_lastWarningTime != null &&
        _lastWarningMsg == message &&
        now.difference(_lastWarningTime!) < const Duration(seconds: 3)) {
      return;
    }
    _lastWarningTime = now;
    _lastWarningMsg = message;

    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(
        content: Text(message),
        backgroundColor: AppColors.warningOrange,
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ));
  }

  /// Memeriksa apakah koordinat GPS saat ini masih segar (< 60 detik) dan berakurasi tinggi (<= 50m).
  bool get _isGpsFresh {
    if (_userLat == null || _userLng == null || _userLat == 0.0 || _userLng == 0.0) {
      return false;
    }
    if (_gpsTimestamp == null) return false;
    final ageSeconds = DateTime.now().difference(_gpsTimestamp!).inSeconds;
    // Dianggap segar hanya jika umur < 60 detik DAN akurasi <= 50 meter
    return ageSeconds < 60 && (_gpsAccuracy == null || _gpsAccuracy! <= 50.0);
  }

  /// Inisialisasi awal GPS — periksa cache dengan validasi umur & akurasi
  Future<void> _initGps() async {
    if (!PlatformUtils.isMobile) return;
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.whileInUse ||
          perm == LocationPermission.always) {
        final lastPos = await Geolocator.getLastKnownPosition();
        if (lastPos != null && mounted) {
          final now = DateTime.now();
          final cacheAge = now.difference(lastPos.timestamp);
          // Hanya gunakan cache jika usianya di bawah 60 detik DAN akurasinya <= 50 meter
          if (cacheAge.inSeconds < 60 && lastPos.accuracy <= 50.0) {
            setState(() {
              _userLat = lastPos.latitude;
              _userLng = lastPos.longitude;
              _gpsAccuracy = lastPos.accuracy;
              _gpsTimestamp = lastPos.timestamp;
            });
            debugPrint('[ScanFlowView] Menggunakan fresh GPS cache (${cacheAge.inSeconds}s, acc: ${lastPos.accuracy}m)');
          } else {
            debugPrint('[ScanFlowView] Cache GPS kadaluarsa (${cacheAge.inSeconds}s, acc: ${lastPos.accuracy}m). Wajib refresh realtime.');
          }
        }
        // Lanjutkan pengambilan GPS presisi realtime di background
        _fetchGps(requestPermissionIfNeeded: false);
      }
    } catch (_) {}
  }

  /// Minta izin lokasi dan ambil koordinat GPS realtime sekarang dengan akurasi tinggi.
  Future<Position?> _fetchGps({bool requestPermissionIfNeeded = true}) async {
    if (!PlatformUtils.isMobile) return null;
    if (!mounted) return null;

    setState(() => _gpsLoading = true);

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          _showThrottledWarning('GPS tidak aktif. Mohon aktifkan GPS perangkat Anda.');
        }
        return null;
      }

      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied && requestPermissionIfNeeded) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        if (mounted) {
          _showThrottledWarning('Izin lokasi diperlukan untuk memindai Tempat Sampah.');
        }
        return null;
      }

      // Prioritaskan LocationAccuracy.high dengan batas waktu 8 detik
      Position? pos;
      try {
        pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 0,
            timeLimit: Duration(seconds: 8),
          ),
        );
      } catch (_) {
        // Fallback jika high accuracy timeout di dalam ruangan: coba medium 5 detik
        try {
          pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.medium,
              distanceFilter: 0,
              timeLimit: Duration(seconds: 5),
            ),
          );
        } catch (_) {}
      }

      if (pos != null) {
        final p = pos;
        if (mounted) {
          setState(() {
            _userLat = p.latitude;
            _userLng = p.longitude;
            _gpsAccuracy = p.accuracy;
            _gpsTimestamp = p.timestamp;
            _gpsLoading = false;
          });
          // Update juga userLocationProvider agar sinkron dengan dashboard/beranda
          ref.read(userLocationProvider.notifier).setPositionDirect(p);
        }
        return p;
      }
    } catch (e) {
      debugPrint('[ScanFlowView] GPS fetch error: $e');
    } finally {
      if (mounted && _gpsLoading) {
        setState(() => _gpsLoading = false);
      }
    }
    return null;
  }

  /// Memastikan koordinat GPS realtime valid dan segar sebelum transaksi dikirim ke backend.
  Future<bool> _ensureRealtimeGps() async {
    if (_isGpsFresh) {
      return true;
    }
    final pos = await _fetchGps(requestPermissionIfNeeded: true);
    return pos != null && _userLat != null && _userLat != 0.0;
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(scanFlowProvider);
    final bool isOnline = ref.watch(isOnlineProvider);

    // Listen untuk notifikasi error / redirect
    ref.listen<ScanFlowState>(scanFlowProvider, (prev, next) {
      if (next.errorCode != null && !next.isLoading) {
        _showErrorDialog(context, next.errorCode!, next.errorMessage);
        // Do not clearError here so QrScannerWidget knows it failed and resets itself
      }
      // Saat AI berhasil (step 1→2), tampilkan bottom sheet konfirmasi AI dulu.
      // QR Scanner baru aktif setelah user tap "Lanjut" di sheet.
      if ((prev?.currentStep ?? 0) <= 1 &&
          next.currentStep == 2 &&
          next.aiResult != null &&
          !next.isLoading) {
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          if (mounted) {
            _isAiSheetOpen = true;
            await showAiSuccessSheet(context, ref);
            if (mounted) {
              _isAiSheetOpen = false;
            }
          }
        });
      }
      // ─── AUTO-REFRESH setelah transaksi berhasil (step 2→3) ─────────────
      if ((prev?.currentStep ?? 0) < 3 &&
          next.currentStep == 3 &&
          next.scanResult != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          final capturedContext = context;

          ref.invalidate(wasteLogsProvider);
          ref.invalidate(totalPointsProvider);
          ref.invalidate(pointHistoryProvider);
          ref.invalidate(dailyPointsProvider);
          ref.invalidate(userLeaderboardRankProvider);
          ref.invalidate(notificationsProvider);
          ref.invalidate(binsProvider);

          // Langsung tampilkan rating (jika pertama kali) lalu keluar
          // ignore: use_build_context_synchronously
          showFeatureRatingOnceIfNeeded(
            // ignore: use_build_context_synchronously
            context: capturedContext,
            featureKey: 'warga_setor_sampah',
            featureTitle: 'Setoran Sampah Berhasil! 🎉',
            featureSubtitle:
                'Bagaimana kepuasan Anda saat pertama kali melakukan setoran & pemilahan sampah Berseka?',
            roleTag: 'Warga',
          ).then((_) {
            // Biarkan user melihat Step 3 (Pencatatan Berhasil)
            // Jangan otomatis di-pop agar popup berhasil tidak ter-skip
          });
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
            _buildStepContent(context, state, isOnline),
            if (state.isLoading && state.currentStep != 1)
              Container(
                color: Colors.black54,
                child: const Center(child: AppLoading()),
              ),
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
          child: Stack(
            fit: StackFit.expand,
            children: [
              InlineCameraWidget(
                onImageCaptured: (path, sizeKB) {
                  setState(() {
                    _capturedImagePath = path;
                    _compressedKB = sizeKB;
                    _photoTaken = true;
                  });
                },
              ),
              if (!_photoTaken)
                IgnorePointer(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Overlay background transparan
                      ColorFiltered(
                        colorFilter: ColorFilter.mode(
                          Colors.black.withValues(alpha: 0.5),
                          BlendMode.srcOut,
                        ),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Container(
                              decoration: const BoxDecoration(
                                color: Colors.black,
                                backgroundBlendMode: BlendMode.dstOut,
                              ),
                            ),
                            Center(
                              child: Container(
                                width: (MediaQuery.of(context).size.width * 0.75).clamp(200.0, 280.0),
                                height: (MediaQuery.of(context).size.width * 0.75).clamp(200.0, 280.0),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Bingkai Border Putih solid
                      Center(
                        child: Container(
                          width: (MediaQuery.of(context).size.width * 0.75).clamp(200.0, 280.0),
                          height: (MediaQuery.of(context).size.width * 0.75).clamp(200.0, 280.0),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white, width: 2),
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                      // Teks Panduan Atas
                      Positioned(
                        top: 40,
                        left: 20,
                        right: 20,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Posisikan Objek Sampah di Dalam Bingkai\n(Jarak Optimal: 15 – 30 cm)',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      // Teks Tips Bawah
                      Positioned(
                        bottom:
                            120, // Dinaikkan agar tidak menutupi tombol kamera
                        left: 30,
                        right: 30,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.lightbulb_outline_rounded,
                                color: Colors.amber,
                                size: 16,
                              ),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Tips: Pastikan pencahayaan cukup & bebas jam tangan/alas keramik.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
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
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
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
                    : 'Ambil foto sampah langsung dari kamera dari jarak dekat (tidak boleh terlalu jauh)\natau pilih dari galeri.',
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
                    onPressed: () {
                      _fetchGps(); // Ambil GPS di background tanpa memblokir kamera di awal
                      ref
                          .read(scanFlowProvider.notifier)
                          .detectWaste(imagePath: _capturedImagePath);
                    },
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
                          source: ImageSource.gallery,
                          imageQuality: 85,
                        );
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
                          ScaffoldMessenger.of(context).clearSnackBars();
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
                    'Scan QR Tempat Sampah',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                SizedBox(width: 48),
              ],
            ),
          ),
        ),

        // Banner info jenis sampah terdeteksi + status GPS
        Container(
          color: isOrganic ? AppColors.organicColor : AppColors.nonOrganicColor,
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
                  '(${result.volumeEstimate.toStringAsFixed(1)} Liter) '
                  '— Arahkan ke Tempat Sampah ${result.detectedType.displayName.toUpperCase()}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
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
                GestureDetector(
                  onTap: () {
                    _fetchGps();
                    ScaffoldMessenger.of(context)
                      ..clearSnackBars()
                      ..showSnackBar(
                        const SnackBar(
                          content: Text('Memperbarui koordinat GPS realtime...'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                  },
                  child: Icon(
                    _userLat != null && _userLat != 0.0
                        ? Icons.gps_fixed_rounded
                        : Icons.gps_off_rounded,
                    color: Colors.white,
                    size: 16,
                  ),
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
                key: _qrScannerKey,
                hint: isOrganic ? 'BIN-ORG-EF2072F0' : 'BIN-ANORG-8215BE3D',
                overlayColor: AppColors.primaryGreen,
                onQrDetected: (qrCode) async {
                  if (_isAiSheetOpen) {
                    return false; // Jangan scan jika popup AI masih terbuka
                  }

                  // Guard: skip jika sudah loading, sukses, atau sedang ada error tampil
                  final s = ref.read(scanFlowProvider);
                  if (s.isLoading ||
                      s.scanResult != null ||
                      s.errorCode != null) {
                    return false;
                  }

                  // CEK LOKAL JIKA BIN SEDANG PENGAJUAN (isResetPending)
                  // Gunakan cached bins seketika (0 ms) jika sudah tersedia, fallback fetch jika belum
                  // ponytail: simple future read; upgrade to dedicated single-bin endpoint if latency matters
                  final cachedBins = ref.read(binsProvider).value;
                  final bins = cachedBins ??
                      await ref.read(binsProvider.future).timeout(
                        const Duration(seconds: 3),
                        onTimeout: () => ref.read(binsProvider).value ?? [],
                      );
                  final foundBin = bins
                      .where((b) => b.qrSerial == qrCode)
                      .firstOrNull;
                  if (foundBin != null && foundBin.isResetPending) {
                    if (context.mounted) {
                      final decision =
                          await _showPendingResetDecisionDialog(context, foundBin);
                      if (decision == 'cancel_and_scan') {
                        final userId = ref.read(authProvider).user?.id;
                        if (userId != null) {
                          await ref
                              .read(resetBinProvider.notifier)
                              .cancelReset(userId, binId: foundBin.id);
                          ref.invalidate(binsProvider);
                        }
                        // Lanjut proses scan di bawah
                      } else if (decision == 'continue_scan') {
                        // Lanjut proses scan di bawah
                      } else {
                        _qrScannerKey.currentState?.resetScanner();
                        return false;
                      }
                    } else {
                      return false;
                    }
                  }

                  // Validasi kategori client-side — cegah scan QR yang salah tanpa hit backend
                  final expectedType = s.aiResult?.detectedType;
                  if (foundBin != null &&
                      expectedType != null &&
                      foundBin.binType != expectedType) {
                    _showThrottledWarning(
                      'QR ini milik Tempat Sampah ${foundBin.binType.displayName}. '
                      'Silakan scan QR Tempat Sampah ${expectedType.displayName}.',
                    );
                    await Future.delayed(const Duration(milliseconds: 1500));
                    return false;
                  }

                  // Fallback validasi: cek pola QR string jika bin belum ada di state lokal
                  if (expectedType != null) {
                    final lower = qrCode.toLowerCase().trim();
                    final isAnorgPattern = lower.contains('anorganik') ||
                        lower.contains('anorganic') ||
                        lower.contains('anorg') ||
                        lower.contains('agn') ||
                        lower.contains('non-org') ||
                        lower.contains('non_org') ||
                        lower.contains('non_organic') ||
                        lower.contains('non organik') ||
                        lower.contains('plastik') ||
                        lower.contains('kertas') ||
                        lower.contains('logam');
                    final isOrgPattern = !isAnorgPattern &&
                        (lower.contains('organik') ||
                            lower.contains('organic') ||
                            lower.contains('organ') ||
                            lower.contains('ogn') ||
                            lower.contains('org') ||
                            lower.contains('kompos') ||
                            lower.contains('basah') ||
                            lower.startsWith('bsk-member-'));

                    if (expectedType == WasteType.organic && isAnorgPattern) {
                      _showThrottledWarning(
                        'QR ini terdeteksi sebagai Tempat Sampah ANORGANIK. '
                        'Silakan scan QR Tempat Sampah ORGANIK (Hijau).',
                      );
                      await Future.delayed(const Duration(milliseconds: 1500));
                      return false;
                    } else if (expectedType == WasteType.nonOrganic && isOrgPattern) {
                      _showThrottledWarning(
                        'QR ini terdeteksi sebagai Tempat Sampah ORGANIK. '
                        'Silakan scan QR Tempat Sampah ANORGANIK (Kuning).',
                      );
                      await Future.delayed(const Duration(milliseconds: 1500));
                      return false;
                    }
                  }

                  // Guard GPS Realtime: Pastikan koordinat GPS realtime valid & bukan 0.0 sebelum kirim ke server
                  if (PlatformUtils.isMobile) {
                    final hasValidGps = await _ensureRealtimeGps();
                    if (!hasValidGps) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context)
                          ..clearSnackBars()
                          ..showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Sedang mengunci lokasi GPS realtime. Pastikan GPS aktif dan coba beberapa detik lagi.',
                              ),
                              backgroundColor: AppColors.warningOrange,
                              duration: Duration(seconds: 3),
                            ),
                          );
                      }
                      return false;
                    }
                  }

                  // Pastikan koordinat GPS akurat dan segar sudah didapatkan
                  double? finalLat = _userLat;
                  double? finalLng = _userLng;

                  if (!_isGpsFresh) {
                    final pos = await _fetchGps(requestPermissionIfNeeded: true);
                    if (pos != null) {
                      finalLat = pos.latitude;
                      finalLng = pos.longitude;
                    }
                  }

                  if (PlatformUtils.isMobile &&
                      (finalLat == null || finalLng == null || finalLat == 0.0)) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context)
                        ..clearSnackBars()
                        ..showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Lokasi GPS tidak terdeteksi. Pastikan GPS HP Anda menyala lalu coba lagi.',
                            ),
                            backgroundColor: AppColors.dangerRed,
                            duration: Duration(seconds: 3),
                          ),
                        );
                    }
                    return false;
                  }

                  // Berikan tips jika akurasi GPS sedang melebar (> 50 meter)
                  if (_gpsAccuracy != null && _gpsAccuracy! > 50.0) {
                    _showThrottledWarning(
                      'Akurasi sinyal GPS sedang melebar (~${_gpsAccuracy!.toStringAsFixed(0)}m). Mohon dekatkan HP ke Tempat Sampah.',
                    );
                  }

                  await ref
                      .read(scanFlowProvider.notifier)
                      .scanAndCommit(
                        qrCode: qrCode,
                        userLat: finalLat ?? 0.0,
                        userLng: finalLng ?? 0.0,
                      );

                  // if there's an error, return false to reset the scanner so the user can scan again
                  final nextS = ref.read(scanFlowProvider);
                  if (nextS.errorCode != null) {
                    return false;
                  }
                  return true;
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
          padding: EdgeInsets.fromLTRB(
            24,
            20,
            24,
            MediaQuery.of(context).padding.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
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
                'Arahkan kamera ke QR Code pada tempat sampah '
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
    const steps = ['Identifikasi', 'Verifikasi Lokasi', 'Selesai'];

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
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  steps[idx],
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: current ? FontWeight.w600 : FontWeight.w400,
                    color: current ? AppColors.primaryGreen : AppColors.textHint,
                  ),
                  textAlign: TextAlign.center,
                ),
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
    final bins = ref.watch(binsProvider).asData?.value ?? [];
    final aiResult = state.aiResult;
    final activeBin = bins.firstWhere(
      (b) => b.isActive && b.binType == aiResult?.detectedType,
      orElse: () => bins.isEmpty
          ? const BinEntity(
              id: '',
              qrSerial: '',
              binType: WasteType.organic,
              currentVolumeL: 0,
              maxCapacityL: 25.0,
              lat: 0,
              lng: 0,
              householdName: '',
              rw: '',
              isActive: true,
            )
          : bins.first,
    );
    final double maxVol = activeBin.maxCapacityL > 0
        ? activeBin.maxCapacityL
        : 25.0;
    final double pct = (maxVol > 0 ? newVol / maxVol : 0.0).clamp(0.0, 1.0);
    final double currentBinVolumeL = newVol;
    final double maxBinVolumeL = maxVol;

    return Container(
      color: Colors.black54,
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Lottie Animasi Koin
                  SizedBox(
                    width: 120,
                    height: 120,
                    child: Lottie.network(
                      'https://assets2.lottiefiles.com/packages/lf20_touohxv0.json',
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
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
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Pencatatan Berhasil!',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                    textAlign: TextAlign.center,
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
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
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
                                'EST. VOLUME',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              WeightText(
                                result.volumeLiter,
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
                  // Kapasitas Tempat Sampah
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
                          children: [
                            const Expanded(
                              child: Text(
                                'Kapasitas Tempat Sampah',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${currentBinVolumeL.toStringAsFixed(1)} L',
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
                          children: [
                            Expanded(
                              child: Text(
                                'Maks ${maxBinVolumeL.toStringAsFixed(0)} L',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textHint,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${(pct * 100).toStringAsFixed(0)}% Terisi',
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
                  if (pct >= 1.0)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppColors.dangerRed.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppColors.dangerRed.withValues(alpha: 0.2),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.warning_rounded,
                            color: AppColors.dangerRed,
                            size: 20,
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Tempat Sampah Penuh, Gunakan Tempat Sampah Milik anda yang lain atau aktivasi tempat sampah baru',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.dangerRed,
                                fontWeight: FontWeight.w600,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
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
                        Expanded(
                          child: Column(
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
                              TweenAnimationBuilder<int>(
                                tween: IntTween(
                                  begin: 0,
                                  end: result.pointsAwarded,
                                ),
                                duration: const Duration(milliseconds: 1500),
                                curve: Curves.easeOutExpo,
                                builder: (context, value, child) {
                                  return Text(
                                    'Anda mendapat +$value poin',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.warningYellow,
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
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
                      ref.invalidate(userLeaderboardRankProvider);
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
    } else if (errorCode == 'BIN_OVERFLOW') {
      _showOverflowDialog(context, errorMessage);
    } else if (errorCode == 'LOCATION_OUT_OF_RANGE') {
      _showLocationErrorDialog(context, errorMessage);
    } else if (errorCode == 'IMAGE_UNREADABLE' || errorCode == 'AI_TIMEOUT') {
      _showScanFailedDialog(context, errorMessage, isQrError: false);
    } else {
      // Tampilkan error dari backend langsung dalam bentuk popup/dialog agar sesuai error dari backend
      final state = ref.read(scanFlowProvider);
      final isQrError = state.currentStep == 2 || state.aiResult != null;
      _showScanFailedDialog(
        context,
        errorMessage ?? 'Terjadi kesalahan sistem.',
        isQrError: isQrError,
      );
    }
  }

  /// Dialog LOCATION_OUT_OF_RANGE — Peringatan jarak lebih dari 50 meter
  void _showLocationErrorDialog(BuildContext context, String? message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        insetPadding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ── Ikon Lokasi ──────────────────────────────────────────
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFFDE68A), width: 2),
                ),
                child: const Icon(
                  Icons.location_off_rounded,
                  size: 38,
                  color: Color(0xFFF59E0B),
                ),
              ),
              const SizedBox(height: 16),

              // ── Judul ────────────────────────────────────────────────
              const Text(
                'Di Luar Jangkauan',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 10),

              // ── Pesan ────────────────────────────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFED7AA), width: 1),
                ),
                child: Column(
                  children: [
                    Text(
                      message ??
                          'Anda berada di luar jangkauan lokasi Tempat Sampah yang ingin dipindai.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF92400E),
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          size: 13,
                          color: Color(0xFFB45309),
                        ),
                        SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Harap mendekat ke lokasi Tempat Sampah Anda.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFB45309),
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Tips: Jika Anda berada di dalam rumah atau bawah kanopi, melangkahlah ke teras atau dekat jendela agar sinyal GPS ponsel dapat terhubung langsung ke satelit.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // ── Tombol Coba Lagi (Wajib Await + Loading) ─────────────────────
              StatefulBuilder(
                builder: (dialogCtx, setBtnState) {
                  return SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: _gpsLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.refresh_rounded, size: 18),
                      label: Text(
                        _gpsLoading
                            ? 'Mengunci Lokasi Presisi...'
                            : 'Coba Lagi',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      onPressed: _gpsLoading
                          ? null
                          : () async {
                              setBtnState(() => _gpsLoading = true);
                              setState(() => _gpsLoading = true);

                              // WAJIB AWAIT perolehan lokasi realtime baru
                              final newPos = await _fetchGps(requestPermissionIfNeeded: true);

                              if (dialogCtx.mounted) {
                                Navigator.of(dialogCtx).pop();
                              }
                              ref.read(scanFlowProvider.notifier).clearError();

                              if (mounted) {
                                setState(() => _gpsLoading = false);
                                if (newPos != null) {
                                  _qrScannerKey.currentState?.resetScanner();
                                } else {
                                  _showThrottledWarning(
                                    'Gagal mengunci lokasi presisi. Pastikan GPS aktif dan Anda berada di dekat Tempat Sampah.',
                                  );
                                  _qrScannerKey.currentState?.resetScanner();
                                }
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF59E0B),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 10),

              // ── Tombol Keluar ────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    ref.read(scanFlowProvider.notifier).reset();
                    Navigator.of(context).pop();
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF64748B),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: const Text(
                    'Kembali ke Beranda',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Dialog BIN_OVERFLOW — Larangan Scan QR Tempat Sampah Penuh
  void _showOverflowDialog(BuildContext context, String? message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _OverflowDialog(
        message:
            message ??
            'Tempat sampah ini sudah penuh! Transaksi tidak dapat dilakukan.',
        onScanLain: () {
          Navigator.of(context).pop();
          ref.read(scanFlowProvider.notifier).clearError();
          _qrScannerKey.currentState?.resetScanner();
        },
        onAjukanReset: () {
          Navigator.of(context).pop();
          ref.read(scanFlowProvider.notifier).reset();
          Navigator.of(context).pushReplacementNamed(AppRoutes.resetBin);
        },
        onKeluar: () {
          Navigator.of(context).pop();
          ref.read(scanFlowProvider.notifier).reset();
          Navigator.of(context).pop();
        },
      ),
    );
  }

  Future<String?> _showPendingResetDecisionDialog(
    BuildContext context,
    BinEntity bin,
  ) {
    final bool isNearlyFull = bin.capacityPercent >= 0.95;
    final String pct = (bin.capacityPercent * 100).toStringAsFixed(0);
    final String currentVol = bin.currentVolumeL.toStringAsFixed(1);
    final String maxVol = bin.maxCapacityL.toStringAsFixed(0);

    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppColors.warningYellow.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.hourglass_top_rounded,
                  color: AppColors.warningYellow,
                  size: 32,
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Pengosongan Sedang Diajukan',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                isNearlyFull
                    ? 'Tempat Sampah ${bin.binType.displayName} sudah hampir penuh ($pct%) dan sedang dalam antrean pengosongan petugas.'
                    : 'Tempat Sampah ${bin.binType.displayName} tercatat sedang dalam proses pengosongan ($currentVol L / $maxVol L).\n\n'
                      'Jika tempat sampah belum penuh atau Anda tidak sengaja mengajukan, Anda dapat membatalkan pengajuan dan langsung melanjutkan scan.',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.of(ctx).pop('cancel_and_scan'),
                  icon: const Icon(Icons.cancel_outlined, size: 18),
                  label: const Text(
                    'Batalkan Pengajuan & Lanjut Scan',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(ctx).pop('continue_scan'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'Tetap Lanjut Scan',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop('change_bin'),
                child: const Text(
                  'Ganti Tempat Sampah Lain',
                  style: TextStyle(
                    color: AppColors.textHint,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Dialog BIN_TYPE_MISMATCH — "Tidak Sesuai!" dengan info sampah vs tempat sampah
  void _showMismatchDialog(BuildContext context) {
    final aiResult = ref.read(scanFlowProvider).aiResult;
    final String detectedName = aiResult?.detectedType.displayName ?? 'Organik';
    // Tempat sampah yang salah = kebalikan dari yang terdeteksi
    final String binName = aiResult?.detectedType == WasteType.organic
        ? 'Anorganik'
        : 'Organik';

    showDialog(
      context: context,
      builder: (_) => _MismatchDialog(
        sampahType: detectedName,
        binType: binName,
        onScanUlang: () {
          Navigator.of(context).pop();
          ref.read(scanFlowProvider.notifier).clearError();
          _qrScannerKey.currentState?.resetScanner();
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
  void _showScanFailedDialog(
    BuildContext context,
    String? message, {
    required bool isQrError,
  }) {
    showDialog(
      context: context,
      builder: (_) => _ScanFailedDialog(
        message: message ?? 'Barcode tidak terbaca oleh sistem.',
        onRetry: () {
          Navigator.of(context).pop();
          if (isQrError) {
            ref.read(scanFlowProvider.notifier).clearError();
            _qrScannerKey.currentState?.resetScanner();
          } else {
            ref.read(scanFlowProvider.notifier).reset();
          }
        },
        onCancel: () {
          Navigator.of(context).pop(); // Tutup dialog
          Navigator.maybePop(context); // Keluar dari halaman Scan
        },
      ),
    );
  }
}

// ─── Dialog: Scan Berhasil Step 1 (AI Result) ────────────────────────────────

/// Ditampilkan saat AI berhasil mendeteksi — "Scan Berhasil!"
Future<void> showAiSuccessSheet(BuildContext context, WidgetRef ref) async {
  final state = ref.read(scanFlowProvider);
  final result = state.aiResult;
  if (result == null) return;
  await showModalBottomSheet<void>(
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
    // Nilai murni dari model AI tanpa fallback angka buatan/dummy
    final double orgPct =
        (result.organicPercentage as num?)?.toDouble() ?? (isOrganic ? 1.0 : 0.0);
    final double anorgPct = (1.0 - orgPct).clamp(0.0, 1.0);

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
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        ref.read(scanFlowProvider.notifier).reset();
                      },
                      icon: const Icon(
                        Icons.arrow_back_rounded,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
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
                ],
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
                            color:
                                (isOrganic
                                        ? AppColors.organicColor
                                        : AppColors.nonOrganicColor)
                                    .withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.delete_rounded,
                            color: isOrganic
                                ? AppColors.organicColor
                                : AppColors.nonOrganicColor,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'REKOMENDASI TEMPAT SAMPAH',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textHint,
                                ),
                              ),
                              Text(
                                'Tempat Sampah ${result.detectedType.displayName}',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: isOrganic
                                      ? AppColors.organicColor
                                      : AppColors.nonOrganicColor,
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
                            label: 'KUALITAS AI',
                            value: '',
                            valueWidget: FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Row(
                                children: [
                                  ...List.generate(5, (index) {
                                    final double conf =
                                        (result.confidence as num?)?.toDouble() ?? 0.0;
                                    final stars = (conf * 5).round().clamp(0, 5);
                                    return Icon(
                                      Icons.star_rounded,
                                      size: 14,
                                      color: index < stars
                                          ? Colors.amber
                                          : Colors.grey.shade300,
                                    );
                                  }),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${(((result.confidence as num?)?.toDouble() ?? 0.0) * 100).toStringAsFixed(0)}%',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: _buildDetailItem(
                            icon: Icons.water_drop_rounded,
                            label: 'EST. VOLUME',
                            valueWidget: WeightText(
                              result.displayVolumeLiter,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            value: '',
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
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'Organik: ${(orgPct * 100).toStringAsFixed(0)}%',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.organicColor,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Anorganik: ${(anorgPct * 100).toStringAsFixed(0)}%',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.nonOrganicColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Apakah hasil deteksi AI ini sudah sesuai?',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        // Koreksi Kategori
                        final newType = isOrganic
                            ? WasteType.nonOrganic
                            : WasteType.organic;
                        ref
                            .read(scanFlowProvider.notifier)
                            .updateAiDetectedType(newType);
                        Navigator.of(context).pop();

                        ScaffoldMessenger.of(context)
                          ..clearSnackBars()
                          ..showSnackBar(
                          SnackBar(
                            content: Text(
                              'Kategori dikoreksi manual menjadi ${newType.displayName}. Silakan lanjut scan tempat sampah.',
                            ),
                            backgroundColor: AppColors.primaryGreen,
                            duration: const Duration(seconds: 3),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: AppColors.primaryGreen),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Koreksi Kategori',
                          style: TextStyle(
                            color: AppColors.primaryGreen,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).pop();
                        // State sudah di step 2 dari provider
                      },
                      icon: const Icon(
                        Icons.check_rounded,
                        size: 18,
                        color: Colors.white,
                      ),
                      label: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Sesuai',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppColors.primaryGreen,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailItem({
    required IconData icon,
    required String label,
    required String value,
    Widget? valueWidget,
  }) {
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
            valueWidget ??
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
    required this.binType,
    required this.onScanUlang,
    required this.onBatal,
  });

  final String sampahType;
  final String binType;
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
            // SAMPAH vs TEMPAT SAMPAH
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
                              'TEMPAT SAMPAH',
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
                                binType.toUpperCase(),
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
                          'Jenis sampah tidak cocok dengan kategori tempat sampah yang dipilih. Harap masukkan sampah ke tempat yang sesuai.',
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
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: onScanUlang,
                icon: const Icon(Icons.qr_code_scanner_rounded, size: 20),
                label: const FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'SCAN ULANG TEMPAT SAMPAH YANG BENAR',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warningOrange,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: onBatal,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.border),
                  foregroundColor: AppColors.textSecondary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'BATAL',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Dialog: Scan Gagal ───────────────────────────────────────────────────────

class _ScanFailedDialog extends StatelessWidget {
  const _ScanFailedDialog({
    required this.message,
    required this.onRetry,
    this.onCancel,
  });

  final String message;
  final VoidCallback onRetry;
  final VoidCallback? onCancel;

  String _formatErrorMessage(String rawMsg) {
    if (rawMsg.contains('This exception was thrown') ||
        rawMsg.contains('validateStatus') ||
        rawMsg.contains('status code of 400')) {
      return 'Jenis tempat sampah tidak sesuai atau QR Code tidak dapat diproses. Harap pastikan kategori sampah sesuai dengan tempat sampah.';
    }
    if (rawMsg.contains('status code of 404')) {
      return 'Tempat sampah tidak ditemukan di sistem. Harap pastikan QR Code terdaftar.';
    }
    if (rawMsg.contains('status code of 500')) {
      return 'Server backend sedang mengalami kendala. Harap coba beberapa saat lagi.';
    }
    return rawMsg; // Jika ada error string custom dari backend, langsung return
  }

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
              _formatErrorMessage(message),
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
                minimumSize: const Size.fromHeight(44),
              ),
            ),
            if (onCancel != null) ...[
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: onCancel,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.border),
                  foregroundColor: AppColors.textSecondary,
                  minimumSize: const Size.fromHeight(44),
                ),
                child: const Text('KELUAR'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─── Dialog: BIN_OVERFLOW (Tempat Sampah Penuh) ──────────────────────────────────

class _OverflowDialog extends StatelessWidget {
  const _OverflowDialog({
    required this.message,
    required this.onScanLain,
    required this.onAjukanReset,
    required this.onKeluar,
  });

  final String message;
  final VoidCallback onScanLain;
  final VoidCallback onAjukanReset;
  final VoidCallback onKeluar;

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
                color: AppColors.dangerRed.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.report_problem_rounded,
                color: AppColors.dangerRed,
                size: 36,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Tempat Sampah Penuh!',
              style: TextStyle(
                fontSize: 20,
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
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton.icon(
                onPressed: onScanLain,
                icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
                label: const FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'Scan QR Tempat Sampah Lain',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton.icon(
                onPressed: onAjukanReset,
                icon: const Icon(
                  Icons.cleaning_services_rounded,
                  size: 18,
                  color: AppColors.primaryGreen,
                ),
                label: const FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'Ajukan Pengosongan Tempat Sampah',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.primaryGreen),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: onKeluar,
              child: const Text(
                'Batal',
                style: TextStyle(
                  color: AppColors.textHint,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
