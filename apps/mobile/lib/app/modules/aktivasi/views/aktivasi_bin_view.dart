import 'package:flutter/material.dart';


import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
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
  String _qrOrganik = '';
  String _qrAnorganik = '';
  bool _bothBinsDetected = false;
  bool _localLoading = false;

  bool _argsLoaded = false;
  bool _hasOrganic = false;
  bool _hasAnorganic = false;

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
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      _hasOrganic = args?['hasOrganic'] ?? false;
      _hasAnorganic = args?['hasAnorganic'] ?? false;
      
      if (_hasOrganic && !_hasAnorganic) {
        _step = 2; // Langsung ke anorganik
      }
      if (_hasOrganic && _hasAnorganic) {
        _bothBinsDetected = true; // Gak perlu scan lagi
      }
      _argsLoaded = true;
    }
  }

  Future<bool> _checkAndRequestLocation({bool showDialogs = true}) async {
    if (!PlatformUtils.isMobile) return true;

    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted && showDialogs) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Text('GPS Tidak Aktif'),
            content: const Text('Silakan aktifkan GPS/Layanan Lokasi pada perangkat Anda untuk mencatat titik posisi tempat sampah.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  Geolocator.openLocationSettings();
                },
                child: const Text('Buka Pengaturan'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Batal'),
              ),
            ],
          ),
        );
      }
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever ||
        permission == LocationPermission.denied) {
      if (mounted && showDialogs) {
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Akses lokasi diperlukan untuk mencatat titik posisi tempat sampah.'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
      return false;
    }

    return true;
  }

  String? _validateBinQr(String qr, int step) {
    final lower = qr.toLowerCase().trim();

    if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('www.')) {
      return 'QR Code tidak valid! Terdeteksi sebagai tautan web. Pastikan Anda memindai stiker QR Code fisik tempat sampah.';
    }

    if (qr.trim().length < 3) {
      return 'Format QR Code terlalu pendek atau tidak valid.';
    }

    final isAnorganicPattern = lower.contains('anorganik') ||
        lower.contains('anorg') ||
        lower.contains('non') ||
        lower.contains('an-org') ||
        lower.contains('non-org') ||
        lower.contains('an_org') ||
        lower.contains('plastik') ||
        lower.contains('kertas') ||
        lower.contains('logam');

    final isOrganicPattern = !isAnorganicPattern &&
        (lower.contains('organik') ||
            lower.contains('organ') ||
            lower.contains('org') ||
            lower.contains('kompos') ||
            lower.contains('basah'));

    if (step == 1) {
      if (isAnorganicPattern) {
        return 'QR Code terdeteksi sebagai Tempat Sampah ANORGANIK. Harap scan tempat sampah ORGANIK (Hijau) terlebih dahulu.';
      }
    } else if (step == 2) {
      if (isOrganicPattern) {
        return 'QR Code terdeteksi sebagai Tempat Sampah ORGANIK. Harap scan tempat sampah ANORGANIK (Kuning).';
      }
      if (qr.trim().toUpperCase() == _qrOrganik.trim().toUpperCase()) {
        return 'QR Code Tempat Sampah Anorganik tidak boleh sama dengan QR Code Organik!';
      }
    }

    return null;
  }

  Future<bool> _onQrDetected(String qr) async {
    if (_bothBinsDetected) return false;

    final detected = qr.trim();
    final error = _validateBinQr(detected, _step);
    if (error != null) {
      _showErrorSnackBar(error);
      return false;
    }

    setState(() {
      if (_step == 1) {
        _qrOrganik = detected;
        if (_hasAnorganic) {
          _bothBinsDetected = true; // Selesai jika Anorganik sudah ada
        } else {
          _step = 2; // Lanjut ke scan Anorganik
        }
      } else if (_step == 2) {
        _qrAnorganik = detected;
        _bothBinsDetected = true; // Kedua tempat sampah berhasil di-scan
      }
    });
    
    return true;
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.dangerRed,
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
    
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
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
        debugPrint('[AktivasiBinScreen] Gagal mengambil lokasi GPS: $e. Menggunakan fallback.');
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
        (msg != null && (msg.contains('BIN_ALREADY_USED') || msg.contains('ALREADY_ACTIVATED')))) {
      return 'QR Tempat Sampah ini sudah diaktivasi oleh warga lain.';
    }
    switch (code) {
      case 'ALREADY_ACTIVATED':
        return 'QR Tempat Sampah ini sudah diaktivasi oleh warga lain.';
      case 'BIN_NOT_FOUND':
        return 'QR Code tempat sampah tidak terdaftar di sistem.';
      case 'BIN_CATEGORY_DUPLICATE':
        return msg ?? 'Kategori tempat sampah sudah terdaftar untuk warga ini.';
      case 'HOUSEHOLDS_NOT_FOUND':
      case 'HOUSEHOLD_REQUIRED':
        return 'Akun Anda belum memiliki Rumah Tangga terdaftar. Harap hubungi Mahasiswa Pendamping/Admin untuk pendaftaran rumah Anda terlebih dahulu.';
      default:
        if (msg != null && msg.isNotEmpty && !msg.startsWith('BIN_ALREADY_USED')) {
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
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
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
        import_engine.NotificationEngine().showActivationNotification(20);
        // Refresh point providers if they exist globally
        ref.invalidate(pointHistoryProvider);
      }
    });

    if (aktivasiState.isLoading || _localLoading) {
      final loadingMessage = _localLoading ? 'Mencari lokasi GPS tempat sampah...' : 'Mengaktivasi tempat sampah...';
      return Scaffold(body: AppLoading(message: loadingMessage));
    }

    if (aktivasiState.isSuccess) {
      final int count = (_qrOrganik.isNotEmpty && _qrAnorganik.isNotEmpty) ? 2 : 1;
      return _SuccessScreen(
        binCount: count,
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
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
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
                              _step = _hasOrganic ? 2 : 1;
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
                        hint: _step == 1 ? 'BIN-ORG-EF2072F0' : 'BIN-NON-EF2072F1',
                        overlayColor: _step == 1 ? AppColors.organicColor : AppColors.nonOrganicColor,
                        onQrDetected: _onQrDetected,
                      ),
                    ),
                  ),
          ),

          // ── Bottom Sheet Putih ────────────────────────────────────
          SafeArea(
            top: false,
            child: Container(
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
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              child: _bothBinsDetected ? _buildDetectedContent() : _buildScanPrompt(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanPrompt() {
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
        const SizedBox(height: 16),
        const Icon(
          Icons.qr_code_scanner_rounded,
          color: AppColors.primaryGreen,
          size: 32,
        ),
        const SizedBox(height: 10),
        Text(
          _step == 1
              ? (_hasAnorganic 
                  ? 'Arahkan kamera ke Kode QR\npada Tempat Sampah Organik Anda' 
                  : 'Langkah 1/2: Arahkan kamera ke Kode QR\npada Tempat Sampah Organik Anda')
              : (_hasOrganic 
                  ? 'Arahkan kamera ke Kode QR\npada Tempat Sampah Anorganik Anda' 
                  : 'Langkah 2/2: Arahkan kamera ke Kode QR\npada Tempat Sampah Anorganik Anda'),
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        const Text(
          'atau masukkan ID tempat sampah secara manual di atas',
          style: TextStyle(fontSize: 12, color: AppColors.textHint),
        ),
        if (_step == 2 && !_hasOrganic) ...[
          const SizedBox(height: 16),
          TextButton.icon(
            onPressed: () {
              setState(() {
                _step = 1;
                _qrOrganik = '';
                _qrAnorganik = '';
                _bothBinsDetected = false;
              });
            },
            icon: const Icon(Icons.refresh_rounded, color: AppColors.dangerRed),
            label: const Text(
              'Ulangi Pemindaian dari Awal',
              style: TextStyle(color: AppColors.dangerRed),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDetectedContent() {
    final displayOrgId = _qrOrganik.length > 12 ? _qrOrganik.substring(_qrOrganik.length - 12) : _qrOrganik;
    final displayNonId = _qrAnorganik.length > 12 ? _qrAnorganik.substring(_qrAnorganik.length - 12) : _qrAnorganik;

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
            const Text(
              'Tempat Sampah Siap Diaktivasi!',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.primaryGreen,
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: () => setState(() {
                _bothBinsDetected = false;
                _step = _hasOrganic ? 2 : 1;
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
            label: const Text(
              'AKTIVASI TEMPAT SAMPAH',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
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
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard({required String title, required String id, required Color color}) {
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
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const Spacer(),
          Text(
            id,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Success Screen ──────────────────────────────────────────────────────────

class _SuccessScreen extends StatelessWidget {
  const _SuccessScreen({required this.onBack, this.binCount = 2});
  final VoidCallback onBack;
  final int binCount;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: onBack,
        ),
        title: const Text(
          'Aktivasi Tempat Sampah',
          style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
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
              Text(
                binCount > 1 
                  ? 'Kedua Tempat Sampah Berhasil Diaktivasi!' 
                  : 'Tempat Sampah Berhasil Diaktivasi!',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryGreen,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                binCount > 1 
                  ? 'Kedua tempat sampah Anda telah terhubung\ndengan akun rumah tangga.'
                  : 'Tempat sampah Anda telah terhubung\ndengan akun rumah tangga.',
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onBack,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                  ),
                  child: const Text('Kembali ke Beranda'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
