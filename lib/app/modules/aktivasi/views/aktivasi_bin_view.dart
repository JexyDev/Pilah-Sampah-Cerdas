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
import '../../riwayat/controllers/riwayat_controller.dart';
import '../../../data/models/bin_entity.dart';

/// Aktivasi Tempat Sampah — sesuai desain:
/// AppBar biru, QrScannerWidget (kamera native / input manual),
/// bottom sheet "Tempat Sampah Terdeteksi!" dengan info card + tombol biru.
class AktivasiBinView extends ConsumerStatefulWidget {
  const AktivasiBinView({super.key});

  @override
  ConsumerState<AktivasiBinView> createState() => _AktivasiBinViewState();
}

class _AktivasiBinViewState extends ConsumerState<AktivasiBinView> {
  final GlobalKey<QrScannerWidgetState> _qrScannerKey =
      GlobalKey<QrScannerWidgetState>();
  int _step = 1; // 1 = Organik, 2 = Anorganik
  String _targetType = 'both'; // 'organic', 'non_organic', 'both'
  String _qrOrganik = '';
  String _qrAnorganik = '';
  bool _bothBinsDetected = false;
  final bool _localLoading = false;
  double? _lat;
  double? _lng;

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

      // Sinkronkan juga langsung dengan state binsProvider jika args belum lengkap
      final existingBins = ref.read(binsProvider).value ?? [];
      if (!_hasOrganic) {
        _hasOrganic = existingBins.any((b) => b.binType == WasteType.organic && b.isActive);
      }
      if (!_hasAnorganic) {
        _hasAnorganic = existingBins.any((b) => b.binType == WasteType.nonOrganic && b.isActive);
      }

      if (_hasOrganic && !_hasAnorganic) {
        _targetType = 'non_organic';
        _step = 2; // Langsung ke anorganik
      } else if (!_hasOrganic && _hasAnorganic) {
        _targetType = 'organic';
        _step = 1;
      } else if (args != null && args['targetType'] != null) {
        _targetType = args['targetType'].toString();
        _step = _targetType == 'non_organic' ? 2 : 1;
      } else {
        _targetType = 'both';
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

  Future<void> _fetchGpsInBg() async {
    if (_lat != null && _lng != null) return;
    if (!PlatformUtils.isMobile) return;
    
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
      if (mounted) {
        setState(() {
          _lat = position.latitude;
          _lng = position.longitude;
        });
      }
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar(
            'Gagal mengunci GPS. Harap berpindah ke area luar ruangan lalu ulangi scan.');
      }
    }
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
        lower.contains('an-org') ||
        lower.contains('non-org') ||
        lower.contains('an_org') ||
        lower.contains('non_org') ||
        lower.contains('non_organic') ||
        lower.contains('non organik') ||
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
            lower.contains('basah') ||
            lower.startsWith('bsk-member-'));

    if (_targetType == 'organic') {
      if (isAnorganicPattern) {
        return 'QR Code terdeteksi sebagai Tempat Sampah ANORGANIK. Harap scan tempat sampah ORGANIK (Warna Hijau).';
      }
    } else if (_targetType == 'non_organic') {
      if (isOrganicPattern) {
        return 'QR Code terdeteksi sebagai Tempat Sampah ORGANIK. Harap scan tempat sampah ANORGANIK (Warna Kuning).';
      }
    } else {
      // Mode 'both' (Sepasang Tempat Sampah): Smart Flexible Scan
      // 1. Cek duplikasi dengan QR yang sudah terdeteksi sebelumnya
      if (_qrOrganik.isNotEmpty && qr.trim().toUpperCase() == _qrOrganik.trim().toUpperCase()) {
        return 'QR Code ini sudah dipindai sebagai Tempat Sampah ORGANIK. Harap scan Tempat Sampah ANORGANIK (Kuning).';
      }
      if (_qrAnorganik.isNotEmpty && qr.trim().toUpperCase() == _qrAnorganik.trim().toUpperCase()) {
        return 'QR Code ini sudah dipindai sebagai Tempat Sampah ANORGANIK. Harap scan Tempat Sampah ORGANIK (Hijau).';
      }

      // 2. Proteksi jika slot Anorganik sudah terisi dan user scan Anorganik lain
      if (_qrAnorganik.isNotEmpty && isAnorganicPattern) {
        return 'Tempat Sampah Anorganik sudah dipindai. Harap scan Tempat Sampah ORGANIK (Warna Hijau) untuk melengkapi.';
      }

      // 3. Proteksi jika slot Organik sudah terisi dan user scan Organik lain
      if (_qrOrganik.isNotEmpty && isOrganicPattern) {
        return 'Tempat Sampah Organik sudah dipindai. Harap scan Tempat Sampah ANORGANIK (Warna Kuning) untuk melengkapi.';
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

    final lower = detected.toLowerCase();
    final isAnorganicPattern =
        lower.contains('anorganik') ||
        lower.contains('anorganic') ||
        lower.contains('anorg') ||
        lower.contains('agn') ||
        lower.contains('an-org') ||
        lower.contains('non-org') ||
        lower.contains('an_org') ||
        lower.contains('non_org') ||
        lower.contains('non_organic') ||
        lower.contains('non organik') ||
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
            lower.contains('basah') ||
            lower.startsWith('bsk-member-'));

    setState(() {
      if (_targetType == 'organic') {
        _qrOrganik = detected;
        _bothBinsDetected = true;
      } else if (_targetType == 'non_organic') {
        _qrAnorganik = detected;
        _bothBinsDetected = true;
      } else {
        // Mode 'both': Smart Flexible Scan (Auto-Slotting Bebas Urutan)
        if (isAnorganicPattern) {
          _qrAnorganik = detected;
          if (_qrOrganik.isNotEmpty) {
            _bothBinsDetected = true;
          } else {
            _step = 1; // Alihkan otomatis fokus petunjuk ke Organik (Hijau)
            _lastStepChangeTime = DateTime.now();
          }
        } else if (isOrganicPattern) {
          _qrOrganik = detected;
          if (_qrAnorganik.isNotEmpty) {
            _bothBinsDetected = true;
          } else {
            _step = 2; // Alihkan otomatis fokus petunjuk ke Anorganik (Kuning)
            _lastStepChangeTime = DateTime.now();
          }
        } else {
          // Fallback bila tidak terdeteksi pola spesifik: simpan sesuai step aktif
          if (_step == 2) {
            _qrAnorganik = detected;
            if (_qrOrganik.isNotEmpty) {
              _bothBinsDetected = true;
            } else {
              _step = 1;
              _lastStepChangeTime = DateTime.now();
            }
          } else {
            _qrOrganik = detected;
            if (_qrAnorganik.isNotEmpty) {
              _bothBinsDetected = true;
            } else {
              _step = 2;
              _lastStepChangeTime = DateTime.now();
            }
          }
        }
      }
    });

    // Mulai ambil GPS di background jika belum ada koordinat
    _fetchGpsInBg();

    if (!_bothBinsDetected) {
      Future.delayed(const Duration(milliseconds: 700), () {
        if (mounted && !_bothBinsDetected) {
          _qrScannerKey.currentState?.resetScanner();
        }
      });
    }

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

    final user = ref.read(authProvider).user;
    if (!mounted) return;

    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final double orgCapacity = args?['orgCapacity'] ?? 20.0;
    final double anorgCapacity = args?['anorgCapacity'] ?? 20.0;
    final String? orgShape = args?['orgShape'];
    final double? orgDiameter = args?['orgDiameter'];
    final double? orgHeight = args?['orgHeight'];
    final double? orgLength = args?['orgLength'];
    final double? orgWidth = args?['orgWidth'];
    final String? anorgShape = args?['anorgShape'];
    final double? anorgDiameter = args?['anorgDiameter'];
    final double? anorgHeight = args?['anorgHeight'];
    final double? anorgLength = args?['anorgLength'];
    final double? anorgWidth = args?['anorgWidth'];

    // Menggunakan GPS yang diambil di background saat scan QR
    final lat = _lat;
    final lng = _lng;

    if (PlatformUtils.isMobile && lat == null && lng == null) {
      _showErrorSnackBar(
          'Sinyal GPS belum terkunci. Mohon tunggu atau pindah ke luar ruangan lalu ulangi proses.');
      return;
    }

    // Pastikan hanya mengirimkan kategori yang belum aktif di akun warga
    final String? finalQrOrganik = (_hasOrganic || _targetType == 'non_organic')
        ? null
        : (_qrOrganik.isNotEmpty ? _qrOrganik : null);
    final String? finalQrAnorganik = (_hasAnorganic || _targetType == 'organic')
        ? null
        : (_qrAnorganik.isNotEmpty ? _qrAnorganik : null);

    if (finalQrOrganik == null && finalQrAnorganik == null) {
      _showErrorSnackBar('Tidak ada QR Code baru yang di-scan.');
      return;
    }

    await ref
        .read(aktivasiBinProvider.notifier)
        .aktivasiBatch(
          qrOrganik: finalQrOrganik,
          qrAnorganik: finalQrAnorganik,
          userId: user?.id ?? '',
          householdId: user?.householdId ?? '',
          latitude: lat,
          longitude: lng,
          orgCapacity: orgCapacity,
          anorgCapacity: anorgCapacity,
          orgShape: orgShape,
          orgDiameter: orgDiameter,
          orgHeight: orgHeight,
          orgLength: orgLength,
          orgWidth: orgWidth,
          anorgShape: anorgShape,
          anorgDiameter: anorgDiameter,
          anorgHeight: anorgHeight,
          anorgLength: anorgLength,
          anorgWidth: anorgWidth,
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
    if (code == 'BIN_RW_MISMATCH' || (msg != null && msg.contains('BIN_RW_MISMATCH'))) {
      return 'Stiker Tempat Sampah ini dialokasikan khusus untuk wilayah RW lain. Silakan gunakan stiker yang dibagikan oleh Posko RW Anda.';
    }

    if (code == 'USER_RW_NOT_SET' || (msg != null && msg.contains('USER_RW_NOT_SET'))) {
      return 'Wilayah domisili RW Anda belum terdaftar. Silakan lengkapi profil komunitas Anda terlebih dahulu.';
    }

    if (code == 'ALREADY_ACTIVATED' ||
        code.startsWith('BIN_ALREADY_USED') ||
        (msg != null &&
            (msg.contains('BIN_ALREADY_USED') ||
                msg.contains('ALREADY_ACTIVATED')))) {
      return 'QR Tempat Sampah ini sudah diaktivasi. Anggota keluarga di rumah cukup menggunakan fitur Gabung Rumah Tangga pada profil/onboarding.';
    }

    if (code == 'HOUSEHOLDS_NOT_FOUND' ||
        code == 'HOUSEHOLD_REQUIRED' ||
        (msg != null &&
            (msg.contains('HOUSEHOLDS_NOT_FOUND') ||
                msg.contains('HOUSEHOLD_REQUIRED')))) {
      return 'Akun Anda belum memiliki Rumah Tangga terdaftar. Harap lengkapi pendaftaran rumah tangga Anda terlebih dahulu.';
    }

    switch (code) {
      case 'BIN_NOT_FOUND':
        return 'QR Code Tempat Sampah tidak terdaftar di sistem.';
      case 'HEAD_NOT_FOUND':
        return 'Nomor HP Kepala Keluarga tidak terdaftar di Berseka. Pastikan nomor sudah benar dan aktif.';
      case 'HEAD_HAS_NO_BIN':
        return 'Kepala Keluarga belum mengaktifkan Tempat Sampah di rumah. Harap minta Kepala Keluarga untuk aktivasi wadah terlebih dahulu.';
      case 'CANNOT_JOIN_SELF':
        return 'Anda tidak dapat memasukkan nomor telepon Anda sendiri.';
      case 'ALREADY_FULLY_ACTIVE':
        return 'Akun Anda sudah memiliki Tempat Sampah aktif terdaftar.';
      case 'BIN_CATEGORY_DUPLICATE':
        return msg ?? 'Kategori Tempat Sampah sudah terdaftar untuk warga ini.';
      case 'ONBOARDING_INCOMPLETE_WRONG_CATEGORY':
        return msg ??
            'Harap selesaikan aktivasi kategori Tempat Sampah yang belum terdaftar.';
      default:
        if (msg != null && msg.isNotEmpty) {
          return msg;
        }
        return 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final aktivasiState = ref.watch(aktivasiBinProvider);

    // Otomatis sinkronkan status kepemilikan bin via ref.listen jika data profil/bin termuat
    ref.listen(binsProvider, (prev, next) {
      final binsList = next.value ?? [];
      if (binsList.isNotEmpty && mounted) {
        final hasOrgInDb = binsList.any((b) => b.binType == WasteType.organic && b.isActive);
        final hasNonOrgInDb = binsList.any((b) => b.binType == WasteType.nonOrganic && b.isActive);
        setState(() {
          if (hasOrgInDb && !_hasOrganic) {
            _hasOrganic = true;
          }
          if (hasNonOrgInDb && !_hasAnorganic) {
            _hasAnorganic = true;
          }
          if (_hasOrganic && !_hasAnorganic && _targetType != 'non_organic') {
            _targetType = 'non_organic';
            _step = 2;
          } else if (!_hasOrganic && _hasAnorganic && _targetType != 'organic') {
            _targetType = 'organic';
            _step = 1;
          }
        });
      }
    });

    ref.listen(aktivasiBinProvider, (prev, next) {
      if (next.errorCode != null && !next.isLoading) {
        final errText = _mapError(next.errorCode!, next.errorMessage);
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errText),
            backgroundColor: AppColors.dangerRed,
            duration: const Duration(seconds: 4),
          ),
        );
        ref.read(aktivasiBinProvider.notifier).reset();

        final rawMsg = next.errorMessage ?? '';
        final isNonOrgNeeded = next.errorCode == 'ONBOARDING_INCOMPLETE_WRONG_CATEGORY' &&
            (rawMsg.contains('Non-Organik') ||
             rawMsg.contains('NON_ORGANIC') ||
             rawMsg.contains('ORGANIC'));
        final isOrgNeeded = next.errorCode == 'ONBOARDING_INCOMPLETE_WRONG_CATEGORY' &&
            rawMsg.contains('Organik') &&
            !rawMsg.contains('Non-Organik');

        setState(() {
          if (isNonOrgNeeded) {
            _hasOrganic = true;
            _targetType = 'non_organic';
            _step = 2;
          } else if (isOrgNeeded) {
            _hasAnorganic = true;
            _targetType = 'organic';
            _step = 1;
          } else {
            _step = _targetType == 'non_organic' ? 2 : 1;
          }
          _qrOrganik = '';
          _qrAnorganik = '';
          _bothBinsDetected = false;
        });
      }

      // Trigger notification when success transitions from false to true
      if (!(prev?.isSuccess ?? false) && next.isSuccess) {
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
          ref.invalidate(binsProvider);
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
                : Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: QrScannerWidget(
                      key: _qrScannerKey,
                      hint: _targetType == 'non_organic' || (_qrOrganik.isNotEmpty && _qrAnorganik.isEmpty)
                          ? 'BSK-AGN-...'
                          : 'BSK-OGN-...',
                      overlayColor: _targetType == 'non_organic' || (_qrOrganik.isNotEmpty && _qrAnorganik.isEmpty)
                          ? AppColors.nonOrganicColor
                          : AppColors.organicColor,
                      onQrDetected: _onQrDetected,
                    ),
                  ),
          ),

          // ── Bottom Sheet Putih ────────────────────────────────────
          SafeArea(
            top: false,
            child: Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.sizeOf(context).height * 0.54,
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
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
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

  String _formatDisplayCode(String qr) {
    if (qr.isEmpty) return '';
    String code = qr.trim();
    if (code.contains('/')) {
      code = code.split('/').lastWhere((s) => s.isNotEmpty, orElse: () => code);
    }
    code = code.replaceAll(RegExp(r'^[_\-\s]+'), '');
    return code;
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
        const SizedBox(height: 10),
        Text(
          _targetType == 'organic'
              ? 'Scan QR Tempat Sampah Organik'
              : _targetType == 'non_organic'
                  ? 'Scan QR Tempat Sampah Anorganik'
                  : (_qrOrganik.isNotEmpty
                      ? 'Tahap 2: Scan Tempat Sampah Anorganik'
                      : (_qrAnorganik.isNotEmpty
                          ? 'Tahap 2: Scan Tempat Sampah Organik'
                          : 'Pindai Tempat Sampah (Bebas Urutan)')),
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: _targetType == 'non_organic' || (isBoth && _qrOrganik.isNotEmpty && _qrAnorganik.isEmpty)
                ? AppColors.nonOrganicColor
                : AppColors.organicColor,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 3),
        Text(
          _targetType == 'organic'
              ? 'Arahkan kamera ke Kode QR fisik pada Tempat Sampah Organik (Hijau)'
              : _targetType == 'non_organic'
                  ? 'Arahkan kamera ke Kode QR fisik pada Tempat Sampah Anorganik (Kuning)'
                  : (_qrOrganik.isNotEmpty
                      ? 'Lanjutkan scan barcode Tempat Sampah ANORGANIK (Kuning)'
                      : (_qrAnorganik.isNotEmpty
                          ? 'Lanjutkan scan barcode Tempat Sampah ORGANIK (Hijau)'
                          : 'Arahkan kamera ke stiker Organik (Hijau) atau Anorganik (Kuning)')),
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
        if (isBoth) ...[
          const SizedBox(height: 10),
          _buildStepCard(
            title: '1. Tempat Sampah Organik',
            subtitle: _qrOrganik.isNotEmpty
                ? 'ID: ${_formatDisplayCode(_qrOrganik)}'
                : (_step == 1
                    ? 'Arahkan kamera ke stiker Organik (Hijau)'
                    : 'Ketuk untuk beralih dan scan tempat sampah ini'),
            color: AppColors.organicColor,
            icon: Icons.eco_rounded,
            isCompleted: _qrOrganik.isNotEmpty,
            isActive: _step == 1 && _qrOrganik.isEmpty,
            onTap: () {
              setState(() => _step = 1);
              _qrScannerKey.currentState?.resetScanner();
            },
          ),
          const SizedBox(height: 8),
          _buildStepCard(
            title: '2. Tempat Sampah Anorganik',
            subtitle: _qrAnorganik.isNotEmpty
                ? 'ID: ${_formatDisplayCode(_qrAnorganik)}'
                : (_step == 2
                    ? 'Arahkan kamera ke stiker Anorganik (Kuning)'
                    : 'Ketuk untuk beralih dan scan tempat sampah ini'),
            color: AppColors.nonOrganicColor,
            icon: Icons.category_rounded,
            isCompleted: _qrAnorganik.isNotEmpty,
            isActive: _step == 2 && _qrAnorganik.isEmpty,
            onTap: () {
              setState(() => _step = 2);
              _qrScannerKey.currentState?.resetScanner();
            },
          ),
        ],
        const SizedBox(height: 10),
        const Text(
          'atau masukkan ID tempat sampah secara manual di atas',
          style: TextStyle(fontSize: 11, color: AppColors.textHint),
        ),
        if (isBoth && (_qrOrganik.isNotEmpty || _qrAnorganik.isNotEmpty)) ...[
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () {
              setState(() {
                _step = _targetType == 'non_organic' ? 2 : 1;
                _qrOrganik = '';
                _qrAnorganik = '';
                _bothBinsDetected = false;
              });
              _qrScannerKey.currentState?.resetScanner();
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
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isCompleted
                ? color.withValues(alpha: 0.08)
                : (isActive ? color.withValues(alpha: 0.04) : const Color(0xFFF7F8FA)),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isCompleted || isActive ? color : Colors.grey.shade300,
              width: isCompleted || isActive ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? color
                      : (isActive ? color.withValues(alpha: 0.15) : Colors.grey.shade200),
                  shape: BoxShape.circle,
                  boxShadow: isCompleted
                      ? [
                          BoxShadow(
                            color: color.withValues(alpha: 0.35),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ]
                      : null,
                ),
                child: Center(
                  child: Icon(
                    isCompleted ? Icons.check_rounded : icon,
                    color: isCompleted
                        ? Colors.white
                        : (isActive ? color : Colors.grey.shade500),
                    size: isCompleted ? 18 : 15,
                  ),
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
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (isCompleted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.check_rounded,
                        color: Colors.white,
                        size: 11,
                      ),
                      SizedBox(width: 3),
                      Text(
                        'TERPINDAI',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ),
                )
              else if (isActive)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
        ),
      ),
    );
  }

  Widget _buildDetectedContent() {
    final displayOrgId = _formatDisplayCode(_qrOrganik);
    final displayNonId = _formatDisplayCode(_qrAnorganik);

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
