import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../data/services/location_service.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/platform_utils.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../scan/controllers/scan_controller.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../../shared/widgets/app_loading.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
import '../../../data/services/notification_engine.dart' as import_engine;
import '../../riwayat/controllers/riwayat_controller.dart';

/// Aktivasi Tempat Sampah — sesuai desain:
/// AppBar biru, QrScannerWidget (kamera native / input manual),
/// bottom sheet "Tempat Sampah Terdeteksi!" dengan info card + tombol biru.
class AktivasiBinView extends ConsumerStatefulWidget {
  const AktivasiBinView({super.key});

  @override
  ConsumerState<AktivasiBinView> createState() => _AktivasiBinViewState();
}

class _AktivasiBinViewState extends ConsumerState<AktivasiBinView> {
  int _step = 1; // 1 = Organik, 2 = Anorganik
  String _targetType = 'both'; // 'organic', 'non_organic', 'both'
  String _qrOrganik = '';
  String _qrAnorganik = '';
  bool _bothBinsDetected = false;
  bool _localLoading = false;

  bool _argsLoaded = false;
  bool _hasOrganic = false;
  bool _hasAnorganic = false;
  DateTime? _lastStepChangeTime;
  DateTime? _lastErrorTime;
  String? _lastErrorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndRequestLocation();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_argsLoaded) {
      final args =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      _hasOrganic = args?['hasOrganic'] ?? false;
      _hasAnorganic = args?['hasAnorganic'] ?? false;

      if (args != null && args['targetType'] != null) {
        _targetType = args['targetType'].toString();
      } else if (_hasOrganic && !_hasAnorganic) {
        _targetType = 'non_organic';
      } else if (!_hasOrganic && _hasAnorganic) {
        _targetType = 'organic';
      } else {
        _targetType = 'both';
      }

      if (_targetType == 'non_organic') {
        _step = 2; // Langsung ke anorganik
      } else {
        _step = 1;
      }
      _argsLoaded = true;
    }
  }

  Future<bool> _checkAndRequestLocation({bool showDialogs = true}) async {
    if (!PlatformUtils.isMobile) return true;

    final LocationPermission permission;
    if (showDialogs && mounted) {
      permission = await LocationService.instance.checkAndRequestPermission(
        context,
        role: 'warga',
      );
    } else {
      final bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return false;
      permission = await Geolocator.checkPermission();
    }

    if (permission == LocationPermission.deniedForever ||
        permission == LocationPermission.denied ||
        permission == LocationPermission.unableToDetermine) {
      return false;
    }

    return true;
  }

  String? _validateBinQr(String qr, int step) {
    final lower = qr.toLowerCase().trim();

    if (lower.startsWith('http://') ||
        lower.startsWith('https://') ||
        lower.startsWith('www.')) {
      return 'QR Code tidak valid! Terdeteksi sebagai tautan web. Pastikan Anda memindai stiker QR Code fisik tempat sampah.';
    }

    if (qr.trim().length < 3) {
      return 'Format QR Code terlalu pendek atau tidak valid.';
    }

    final isAnorganicPattern =
        lower.contains('anorganik') ||
        lower.contains('anorganic') ||
        lower.contains('anorg') ||
        lower.contains('agn') ||
        lower.contains('ano') ||
        lower.contains('non') ||
        lower.contains('an-org') ||
        lower.contains('non-org') ||
        lower.contains('an_org') ||
        lower.contains('plastik') ||
        lower.contains('kertas') ||
        lower.contains('logam');

    final isOrganicPattern =
        !isAnorganicPattern &&
        (lower.contains('organik') ||
            lower.contains('organic') ||
            lower.contains('organ') ||
            lower.contains('ogn') ||
            lower.contains('org') ||
            lower.contains('kompos') ||
            lower.contains('basah'));

    if (_targetType == 'organic') {
      if (isAnorganicPattern) {
        return 'QR Code terdeteksi sebagai Tempat Sampah ANORGANIK. Harap scan tempat sampah ORGANIK (Warna Hijau).';
      }
    } else if (_targetType == 'non_organic') {
      if (isOrganicPattern) {
        return 'QR Code terdeteksi sebagai Tempat Sampah ORGANIK. Harap scan tempat sampah ANORGANIK (Warna Kuning).';
      }
    } else {
      // Mode 'both' (Sepasang Tempat Sampah)
      if (step == 1) {
        if (isAnorganicPattern) {
          return 'QR Code terdeteksi sebagai Tempat Sampah ANORGANIK.\n\nHarap scan barcode pada Tempat Sampah ORGANIK (Warna Hijau) terlebih dahulu untuk Tahap 1.';
        }
      } else if (step == 2) {
        if (isOrganicPattern) {
          return 'QR Code terdeteksi sebagai Tempat Sampah ORGANIK.\n\nHarap scan barcode pada Tempat Sampah ANORGANIK (Warna Kuning) untuk Tahap 2.';
        }
        if (qr.trim().toUpperCase() == _qrOrganik.trim().toUpperCase()) {
          return 'QR Code Tempat Sampah Anorganik tidak boleh sama dengan QR Code Organik!';
        }
      }
    }

    return null;
  }

  Future<bool> _onQrDetected(String qr) async {
    if (_bothBinsDetected) return false;

    // Cooldown setelah step berubah — beri waktu user mengarahkan kamera ke QR berikutnya
    if (_lastStepChangeTime != null &&
        DateTime.now().difference(_lastStepChangeTime!) < const Duration(milliseconds: 1500)) {
      return false;
    }

    final detected = qr.trim();
    final error = _validateBinQr(detected, _step);
    if (error != null) {
      _showErrorSnackBar(error);
      // ponytail: throttle camera scanner loop when pointing at invalid QR
      await Future.delayed(const Duration(milliseconds: 1500));
      return false;
    }

    setState(() {
      if (_targetType == 'organic') {
        _qrOrganik = detected;
        _bothBinsDetected = true;
      } else if (_targetType == 'non_organic') {
        _qrAnorganik = detected;
        _bothBinsDetected = true;
      } else {
        if (_step == 1) {
          _qrOrganik = detected;
          if (_hasAnorganic) {
            _bothBinsDetected = true; // Selesai jika Anorganik sudah ada
          } else {
            _step = 2; // Lanjut ke scan Anorganik
            _lastStepChangeTime = DateTime.now(); // Mulai cooldown
          }
        } else if (_step == 2) {
          _qrAnorganik = detected;
          _bothBinsDetected = true; // Kedua tempat sampah berhasil di-scan
        }
      }
    });

    return true;
  }

  void _showErrorSnackBar(String message) {
    final now = DateTime.now();
    // ponytail: suppress duplicate snackbar within 3s window to prevent spam
    if (_lastErrorTime != null &&
        _lastErrorMessage == message &&
        now.difference(_lastErrorTime!) < const Duration(seconds: 3)) {
      return;
    }
    _lastErrorTime = now;
    _lastErrorMessage = message;

    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.dangerRed,
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _onAktivasi() async {
    final hasPermission = await _checkAndRequestLocation(showDialogs: true);
    if (!hasPermission) return;

    double? lat;
    double? lng;

    final user = ref.read(authProvider).user;
    if (!mounted) return;

    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final double orgCapacity = args?['orgCapacity'] ?? 20.0;
    final double anorgCapacity = args?['anorgCapacity'] ?? 20.0;

    if (PlatformUtils.isMobile) {
      setState(() => _localLoading = true);
      try {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 10),
          ),
        );
        lat = position.latitude;
        lng = position.longitude;
      } catch (e) {
        debugPrint(
          '[AktivasiBinScreen] Gagal mengambil lokasi GPS: $e. Menggunakan fallback.',
        );
      } finally {
        if (mounted) {
          setState(() => _localLoading = false);
        }
      }
    } // End if (PlatformUtils.isMobile)

    if (_qrOrganik.isEmpty && _qrAnorganik.isEmpty) {
      _showErrorSnackBar('Tidak ada QR Code yang di-scan.');
      return;
    }

    await ref
        .read(aktivasiBinProvider.notifier)
        .aktivasiBatch(
          qrOrganik: _qrOrganik.isNotEmpty ? _qrOrganik : null,
          qrAnorganik: _qrAnorganik.isNotEmpty ? _qrAnorganik : null,
          userId: user?.id ?? '',
          householdId: user?.householdId ?? '',
          latitude: lat,
          longitude: lng,
          orgCapacity: orgCapacity,
          anorgCapacity: anorgCapacity,
        );
    if (ref.read(aktivasiBinProvider).isSuccess) {
      // Refresh semua data yang terpengaruh setelah tempat sampah baru diaktivasi
      ref.invalidate(binsProvider);
      ref.invalidate(notificationsProvider);
      // Refresh profil agar data tempat sampah di halaman Profil ikut segar
      await ref.read(authProvider.notifier).fetchProfile();
    }
  }

  String _mapError(String code, String? msg) {
    if (code == 'ALREADY_ACTIVATED' ||
        code.startsWith('BIN_ALREADY_USED') ||
        (msg != null &&
            (msg.contains('BIN_ALREADY_USED') ||
                msg.contains('ALREADY_ACTIVATED')))) {
      return 'QR Tempat Sampah ini sudah diaktivasi oleh warga lain.';
    }

    if (code == 'HOUSEHOLDS_NOT_FOUND' ||
        code == 'HOUSEHOLD_REQUIRED' ||
        (msg != null &&
            (msg.contains('HOUSEHOLDS_NOT_FOUND') ||
                msg.contains('HOUSEHOLD_REQUIRED')))) {
      return 'Akun Anda belum memiliki Rumah Tangga terdaftar. Harap hubungi Admin/Mahasiswa untuk pendaftaran rumah Anda terlebih dahulu.';
    }

    switch (code) {
      case 'BIN_NOT_FOUND':
        return 'QR Code tempat sampah tidak terdaftar di sistem.';
      case 'BIN_CATEGORY_DUPLICATE':
        return msg ?? 'Kategori tempat sampah sudah terdaftar untuk warga ini.';
      case 'ONBOARDING_INCOMPLETE_WRONG_CATEGORY':
        return msg ??
            'Harap selesaikan aktivasi kategori tempat sampah yang belum terdaftar.';
      default:
        if (msg != null && msg.isNotEmpty) {
          return msg;
        }
        return 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final aktivasiState = ref.watch(aktivasiBinProvider);

    ref.listen(aktivasiBinProvider, (prev, next) {
      if (next.errorCode != null && !next.isLoading) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_mapError(next.errorCode!, next.errorMessage)),
            backgroundColor: AppColors.dangerRed,
          ),
        );
        ref.read(aktivasiBinProvider.notifier).reset();
        setState(() {
          _step = 1;
          _qrOrganik = '';
          _qrAnorganik = '';
          _bothBinsDetected = false;
        });
      }

      // Trigger notification when success transitions from false to true
      if (!(prev?.isSuccess ?? false) && next.isSuccess) {
        import_engine.NotificationEngine().showActivationNotification(10);
        // Refresh point providers if they exist globally
        ref.invalidate(pointHistoryProvider);
      }
    });

    if (aktivasiState.isLoading || _localLoading) {
      final loadingMessage = _localLoading
          ? 'Mencari lokasi GPS tempat sampah...'
          : 'Mengaktivasi tempat sampah...';
      return Scaffold(body: AppLoading(message: loadingMessage));
    }

    if (aktivasiState.isSuccess) {
      final int count = (_qrOrganik.isNotEmpty && _qrAnorganik.isNotEmpty)
          ? 2
          : 1;
      // isFirstActivation: warga belum punya bin apapun sebelum aktivasi ini
      final bool isFirstActivation = !_hasOrganic && !_hasAnorganic;
      return _SuccessScreen(
        binCount: count,
        isFirstActivation: isFirstActivation,
        onBack: () {
          ref.read(aktivasiBinProvider.notifier).reset();
          Navigator.maybePop(context);
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: AppColors.textPrimary,
          ),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: const Text(
          'Aktivasi Tempat Sampah',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        elevation: 0,
      ),
      backgroundColor: Colors.black,
      body: Column(
        children: [
          // ── Area Scanner ──────────────────────────────────────────
          Expanded(
            child: _bothBinsDetected
                // Setelah kedua tempat sampah terdeteksi — tampil konfirmasi
                ? Container(
                    color: const Color(0xFF3D4A3F),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.primaryGreen,
                            size: 72,
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Tempat Sampah Berhasil Dipindai',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextButton.icon(
                            onPressed: () => setState(() {
                              _bothBinsDetected = false;
                              _step = _targetType == 'non_organic' ? 2 : 1;
                              _qrOrganik = '';
                              _qrAnorganik = '';
                            }),
                            icon: const Icon(
                              Icons.refresh_rounded,
                              color: Colors.white54,
                            ),
                            label: const Text(
                              'Pindai Ulang',
                              style: TextStyle(color: Colors.white54),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                // Belum terdeteksi — tampil QR scanner (gantian)
                : Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: QrScannerWidget(
                        hint: _step == 1
                            ? 'BIN-ORG-EF2072F0'
                            : 'BIN-NON-EF2072F1',
                        overlayColor: _step == 1
                            ? AppColors.organicColor
                            : AppColors.nonOrganicColor,
                        onQrDetected: _onQrDetected,
                      ),
                    ),
                  ),
          ),

          // ── Bottom Sheet Putih ────────────────────────────────────
          SafeArea(
            top: false,
            child: Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.sizeOf(context).height * 0.58,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 16,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: _bothBinsDetected
                    ? _buildDetectedContent()
                    : _buildScanPrompt(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanPrompt() {
    final isBoth = _targetType == 'both';
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 36,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 14),
        Text(
          _targetType == 'organic'
              ? 'Scan QR Tempat Sampah Organik'
              : _targetType == 'non_organic'
                  ? 'Scan QR Tempat Sampah Anorganik'
                  : (_step == 1
                      ? 'Tahap 1: Scan Tempat Sampah Organik'
                      : 'Tahap 2: Scan Tempat Sampah Anorganik'),
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: _targetType == 'non_organic' || (isBoth && _step == 2)
                ? AppColors.nonOrganicColor
                : AppColors.organicColor,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          _targetType == 'organic'
              ? 'Arahkan kamera ke Kode QR fisik pada Tempat Sampah Organik (Hijau)'
              : _targetType == 'non_organic'
                  ? 'Arahkan kamera ke Kode QR fisik pada Tempat Sampah Anorganik (Kuning)'
                  : (_step == 1
                      ? 'Wajib scan barcode Tempat Sampah ORGANIK (Hijau) terlebih dahulu'
                      : 'Lanjutkan scan barcode Tempat Sampah ANORGANIK (Kuning)'),
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
        if (isBoth) ...[
          const SizedBox(height: 14),
          _buildStepCard(
            title: '1. Tempat Sampah Organik',
            subtitle: _qrOrganik.isNotEmpty
                ? 'Terpindai: ${_qrOrganik.length > 16 ? _qrOrganik.substring(_qrOrganik.length - 16) : _qrOrganik}'
                : (_step == 1
                    ? 'Arahkan kamera ke stiker Organik (Hijau)'
                    : 'Menunggu pemindaian'),
            color: AppColors.organicColor,
            icon: Icons.eco_rounded,
            isCompleted: _qrOrganik.isNotEmpty,
            isActive: _step == 1 && _qrOrganik.isEmpty,
          ),
          const SizedBox(height: 8),
          _buildStepCard(
            title: '2. Tempat Sampah Anorganik',
            subtitle: _qrAnorganik.isNotEmpty
                ? 'Terpindai: ${_qrAnorganik.length > 16 ? _qrAnorganik.substring(_qrAnorganik.length - 16) : _qrAnorganik}'
                : (_step == 2
                    ? 'Arahkan kamera ke stiker Anorganik (Kuning)'
                    : 'Menunggu tahap 1 (Organik) selesai'),
            color: AppColors.nonOrganicColor,
            icon: Icons.category_rounded,
            isCompleted: _qrAnorganik.isNotEmpty,
            isActive: _step == 2 && _qrAnorganik.isEmpty,
          ),
        ],
        const SizedBox(height: 10),
        const Text(
          'atau masukkan ID tempat sampah secara manual di atas',
          style: TextStyle(fontSize: 11, color: AppColors.textHint),
        ),
        if (isBoth && _step == 2) ...[
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () {
              setState(() {
                _step = 1;
                _qrOrganik = '';
                _qrAnorganik = '';
                _bothBinsDetected = false;
              });
            },
            icon: const Icon(Icons.refresh_rounded, color: AppColors.dangerRed, size: 16),
            label: const Text(
              'Ulangi Pemindaian dari Awal',
              style: TextStyle(color: AppColors.dangerRed, fontSize: 12),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStepCard({
    required String title,
    required String subtitle,
    required Color color,
    required IconData icon,
    required bool isCompleted,
    required bool isActive,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isCompleted
            ? color.withValues(alpha: 0.08)
            : (isActive ? color.withValues(alpha: 0.04) : const Color(0xFFF7F8FA)),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCompleted || isActive ? color : Colors.grey.shade300,
          width: isActive ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: (isCompleted || isActive ? color : Colors.grey.shade400).withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCompleted ? Icons.check_rounded : icon,
              color: isCompleted || isActive ? color : Colors.grey.shade500,
              size: 16,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isCompleted || isActive ? color : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: isCompleted
                        ? AppColors.textPrimary
                        : (isActive ? color : AppColors.textHint),
                    fontWeight: isCompleted ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          if (isActive)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'SCAN INI',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDetectedContent() {
    final displayOrgId = _qrOrganik.length > 12
        ? _qrOrganik.substring(_qrOrganik.length - 12)
        : _qrOrganik;
    final displayNonId = _qrAnorganik.length > 12
        ? _qrAnorganik.substring(_qrAnorganik.length - 12)
        : _qrAnorganik;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                color: AppColors.primaryGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_rounded,
                color: Colors.white,
                size: 14,
              ),
            ),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                'Tempat Sampah Siap Diaktivasi!',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryGreen,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => setState(() {
                _bothBinsDetected = false;
                _step = _targetType == 'non_organic' ? 2 : 1;
                _qrOrganik = '';
                _qrAnorganik = '';
              }),
              child: const Icon(
                Icons.close_rounded,
                color: AppColors.textHint,
                size: 20,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        if (_qrOrganik.isNotEmpty) ...[
          // Info card Organik
          _buildInfoCard(
            title: 'Organik',
            id: displayOrgId.toUpperCase(),
            color: AppColors.organicColor,
          ),
          const SizedBox(height: 8),
        ],

        if (_qrAnorganik.isNotEmpty) ...[
          // Info card Anorganik
          _buildInfoCard(
            title: 'Anorganik',
            id: displayNonId.toUpperCase(),
            color: AppColors.nonOrganicColor,
          ),
        ],

        const SizedBox(height: 16),

        // Tombol AKTIVASI
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _onAktivasi,
            icon: const Icon(Icons.sensors_rounded, size: 18),
            label: const FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                'AKTIVASI TEMPAT SAMPAH',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 10),
        Center(
          child: Text(
            (_qrOrganik.isNotEmpty && _qrAnorganik.isNotEmpty)
                ? 'Gunakan kedua tempat sampah ini untuk mengumpulkan poin\nsampah rumah tangga Anda.'
                : 'Gunakan tempat sampah ini untuk mengumpulkan poin\nsampah rumah tangga Anda.',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String id,
    required Color color,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FA),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: color,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              id,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Success Screen ──────────────────────────────────────────────────────────

class _SuccessScreen extends StatelessWidget {
  const _SuccessScreen({
    required this.onBack,
    this.binCount = 2,
    this.isFirstActivation = false,
  });
  final VoidCallback onBack;
  final int binCount;
  final bool isFirstActivation;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: AppColors.textPrimary,
          ),
          onPressed: onBack,
        ),
        title: const Text(
          'Aktivasi Tempat Sampah',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      backgroundColor: Colors.white,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Icon sukses
                Container(
                  width: 80,
                  height: 80,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.white,
                    size: 44,
                  ),
                ),
                const SizedBox(height: 20),

                // Judul — beda antara first-time & tambahan
                Text(
                  isFirstActivation
                      ? '🎉 Selamat Bergabung ke Komunitas Berseka!'
                      : (binCount > 1
                          ? 'Kedua Tempat Sampah Berhasil Diaktivasi!'
                          : 'Tempat Sampah Berhasil Diaktivasi!'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryGreen,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),

                // Deskripsi
                Text(
                  isFirstActivation
                      ? 'Tempat Sampah pintarmu sudah aktif. Kamu sekarang resmi menjadi bagian dari gerakan lingkungan bersih Komunitas Berseka! 🌿\n\nMulai scan sampah dan kumpulkan poinmu.'
                      : (binCount > 1
                          ? 'Kedua tempat sampah Anda telah terhubung\ndengan akun rumah tangga.'
                          : 'Tempat sampah Anda telah terhubung\ndengan akun rumah tangga.'),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Tombol kembali
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onBack,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      isFirstActivation ? 'Mulai Scan Sampah! 🚀' : 'Kembali ke Beranda',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
