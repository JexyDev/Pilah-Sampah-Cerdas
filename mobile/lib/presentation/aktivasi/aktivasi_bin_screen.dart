import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/platform_utils.dart';
import '../providers/auth_provider.dart';
import '../providers/bin_provider.dart';
import '../providers/notification_provider.dart';
import '../shared/widgets/app_loading.dart';
import '../shared/widgets/qr_scanner_widget.dart';

/// Aktivasi Tong Sampah — sesuai desain:
/// AppBar biru, QrScannerWidget (kamera native / input manual),
/// bottom sheet "Tong Terdeteksi!" dengan info card + tombol biru.
class AktivasiBinScreen extends ConsumerStatefulWidget {
  const AktivasiBinScreen({super.key});

  @override
  ConsumerState<AktivasiBinScreen> createState() => _AktivasiBinScreenState();
}

class _AktivasiBinScreenState extends ConsumerState<AktivasiBinScreen> {
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
            content: const Text('Silakan aktifkan GPS/Layanan Lokasi pada perangkat Anda untuk mencatat titik posisi tong sampah.'),
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Akses lokasi diperlukan untuk mencatat titik posisi tong sampah.'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
      return false;
    }

    return true;
  }

  Future<bool> _onQrDetected(String qr) async {
    if (_bothBinsDetected) return false;

    bool success = true;

    setState(() {
      final detected = qr.trim();

      if (_step == 1) {
        _qrOrganik = detected;
        if (_hasAnorganic) {
          _bothBinsDetected = true; // Selesai jika Anorganik sudah ada
        } else {
          _step = 2; // Lanjut ke scan Anorganik
        }
      } else if (_step == 2) {
        if (_qrOrganik.isNotEmpty && detected.toUpperCase() == _qrOrganik.toUpperCase()) {
          // Abaikan secara diam-diam jika mendeteksi ulang barcode yang sama (transisi kamera lambat)
          success = false;
        } else {
          _qrAnorganik = detected;
          _bothBinsDetected = true; // Kedua/satu tong berhasil di-scan
        }
      }
    });
    
    return success;
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
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
    }

    final List<String> serials = [];
    if (_qrOrganik.isNotEmpty) serials.add(_qrOrganik);
    if (_qrAnorganik.isNotEmpty) serials.add(_qrAnorganik);

    if (serials.isEmpty) {
      _showErrorSnackBar('Tidak ada QR Code yang di-scan.');
      return;
    }

    await ref
        .read(aktivasiBinProvider.notifier)
        .aktivasiBatch(
          qrSerials: serials,
          userId: user?.id ?? '',
          householdId: user?.householdId ?? '',
          latitude: lat,
          longitude: lng,
          orgCapacity: orgCapacity,
          anorgCapacity: anorgCapacity,
        );
    if (ref.read(aktivasiBinProvider).isSuccess) {
      // Refresh semua data yang terpengaruh setelah tong baru diaktivasi
      ref.invalidate(binsProvider);
      ref.invalidate(notificationsProvider);
      // Refresh profil agar data tong di halaman Profil ikut segar
      await ref.read(authProvider.notifier).fetchProfile();
    }
  }

  String _mapError(String code, String? msg) {
    switch (code) {
      case 'ALREADY_ACTIVATED':
        return 'Tong ini sudah aktif dan terdaftar.';
      case 'BIN_NOT_FOUND':
        return 'QR Serial tidak terdaftar di sistem.';
      case 'BIN_CATEGORY_DUPLICATE':
        return msg ?? 'Kategori tong sudah terdaftar untuk warga ini.';
      default:
        return msg ?? 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final aktivasiState = ref.watch(aktivasiBinProvider);

    ref.listen(aktivasiBinProvider, (_, next) {
      if (next.errorCode != null && !next.isLoading) {
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
    });

    if (aktivasiState.isLoading || _localLoading) {
      final loadingMessage = _localLoading ? 'Mencari lokasi GPS tong...' : 'Mengaktivasi tong...';
      return Scaffold(body: AppLoading(message: loadingMessage));
    }

    if (aktivasiState.isSuccess) {
      return _SuccessScreen(
        onBack: () {
          ref.read(aktivasiBinProvider.notifier).reset();
          Navigator.of(context).pop();
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Aktivasi Tong Sampah',
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
                // Setelah kedua tong terdeteksi — tampil konfirmasi
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
                            'Tong Berhasil Di-scan',
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
                              'Scan Ulang',
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
              ? 'Langkah 1/2: Arahkan kamera ke QR Code\npada Tong Sampah Organik Anda'
              : 'Langkah 2/2: Arahkan kamera ke QR Code\npada Tong Sampah Anorganik Anda',
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        const Text(
          'atau masukkan ID tong secara manual di atas',
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
              'Ulangi Scan dari Awal',
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
              'Tong Siap Diaktivasi!',
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
              'AKTIVASI TONG',
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
        const Center(
          child: Text(
            'Gunakan kedua tong ini untuk mengumpulkan poin\nsampah rumah tangga Anda.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
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
  const _SuccessScreen({required this.onBack});
  final VoidCallback onBack;

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
          'Aktivasi Tong Sampah',
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
              const Text(
                'Kedua Tong Berhasil Diaktivasi!',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryGreen,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Kedua tong sampah Anda telah terhubung\ndengan akun rumah tangga.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
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
