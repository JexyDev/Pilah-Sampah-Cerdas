import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/platform_utils.dart';
import '../../../data/services/location_service.dart';
import '../../shared/widgets/app_loading.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
import '../../../data/providers/repository_providers.dart';

/// Aktivasi Tempat Sampah Komunal (Role Petugas Pemilahan / Residu)
/// Tampilan menyatu (Unified Layout): Scanner QR, Lokasi GPS, dan Form Alamat TPS dalam 1 halaman scrollable.
class AktivasiTempatSampahKomunalView extends ConsumerStatefulWidget {
  const AktivasiTempatSampahKomunalView({super.key});

  @override
  ConsumerState<AktivasiTempatSampahKomunalView> createState() =>
      _AktivasiTempatSampahKomunalViewState();
}

class _AktivasiTempatSampahKomunalViewState
    extends ConsumerState<AktivasiTempatSampahKomunalView> {
  final GlobalKey<QrScannerWidgetState> _scannerKey =
      GlobalKey<QrScannerWidgetState>();
  final TextEditingController _addressController = TextEditingController();

  String _qrCode = '';
  double? _lat;
  double? _lng;
  bool _isLoading = false;
  bool _gpsLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initLocation();
    });
  }

  @override
  void dispose() {
    _addressController.dispose();
    super.dispose();
  }

  /// Inisialisasi awal GPS secara otomatis
  Future<void> _initLocation() async {
    final hasPermission = await _checkAndRequestLocation();
    if (hasPermission) {
      _fetchGps();
    }
  }

  Future<bool> _checkAndRequestLocation() async {
    if (!PlatformUtils.isMobile) return true;
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) {
        _showErrorSnackBar('Layanan lokasi GPS belum aktif di perangkat.');
      }
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        if (mounted) {
          _showErrorSnackBar('Izin akses lokasi GPS ditolak.');
        }
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      if (mounted) {
        _showErrorSnackBar(
            'Izin lokasi ditolak permanen. Buka pengaturan untuk mengaktifkan.');
      }
      return false;
    }

    return true;
  }

  /// Ambil koordinat GPS realtime dan auto-fill alamat TPS via reverse geocoding
  Future<void> _fetchGps() async {
    if (!PlatformUtils.isMobile) {
      debugPrint('[AktivasiTempatSampahKomunal] Skip GPS: Platform bukan mobile');
      return;
    }
    if (!mounted) return;

    debugPrint('[AktivasiTempatSampahKomunal] Memulai pencarian sinyal GPS realtime...');
    setState(() => _gpsLoading = true);

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      debugPrint(
        '[AktivasiTempatSampahKomunal] GPS BERHASIL DIKUNCI: Lat: ${position.latitude}, Lng: ${position.longitude}',
      );

      if (mounted) {
        setState(() {
          _lat = position.latitude;
          _lng = position.longitude;
        });

        // Auto-fill alamat dari GPS jika field masih kosong
        if (_addressController.text.trim().isEmpty) {
          debugPrint('[AktivasiTempatSampahKomunal] Reverse Geocoding alamat dari GPS...');
          final addr = await LocationService.instance.getAddressFromCoordinates(
            position.latitude,
            position.longitude,
          );
          debugPrint('[AktivasiTempatSampahKomunal] Hasil alamat GPS: "$addr"');
          if (addr != null && addr.isNotEmpty && mounted) {
            setState(() {
              _addressController.text = addr;
            });
          }
        }
      }
    } catch (e, stack) {
      debugPrint('[AktivasiTempatSampahKomunal] PERINGATAN/ERROR GPS: $e\n$stack');
      if (mounted) {
        _showErrorSnackBar(
            'Gagal mengunci GPS akurat. Pastikan Anda berada di area terbuka.');
      }
    } finally {
      if (mounted) {
        setState(() => _gpsLoading = false);
      }
    }
  }

  void _showErrorSnackBar(String message) {
    debugPrint('[AktivasiTempatSampahKomunal] SnackBar Error: $message');
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.maroonRed,
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    debugPrint('[AktivasiTempatSampahKomunal] SnackBar Sukses: $message');
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.primaryGreen,
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<bool> _onQrDetected(String detected) async {
    debugPrint('[AktivasiTempatSampahKomunal] EVENT: QR Terdeteksi: "$detected"');

    if (_isLoading || _qrCode.isNotEmpty) {
      debugPrint('[AktivasiTempatSampahKomunal] Ignored scan: loading=$_isLoading, existingQr=$_qrCode');
      return false;
    }

    final lower = detected.toLowerCase().trim();
    final isOrganicPattern = lower.contains('organik') ||
        lower.contains('organic') ||
        lower.contains('org') ||
        lower.contains('ogn');

    if (!isOrganicPattern) {
      debugPrint(
        '[AktivasiTempatSampahKomunal] PERINGATAN: QR Ditolak! Pola "$detected" tidak mengandung pattern organik.',
      );
      _showErrorSnackBar('Harap scan QR untuk Tempat Sampah Organik');
      _scannerKey.currentState?.resetScanner();
      return false;
    }

    debugPrint('[AktivasiTempatSampahKomunal] SUKSES: QR Valid "$detected"');

    setState(() {
      _qrCode = detected.trim();
    });

    if (_lat == null || _lng == null) {
      _fetchGps();
    }

    return true;
  }

  Future<void> _submit() async {
    debugPrint('[AktivasiTempatSampahKomunal] Memulai submit aktivasi...');

    if (_qrCode.isEmpty) {
      debugPrint('[AktivasiTempatSampahKomunal] Submit gagal: QR Code belum dipindai');
      _showErrorSnackBar('Silakan scan QR Code Tempat Sampah terlebih dahulu.');
      return;
    }

    final lat = _lat;
    final lng = _lng;

    if (PlatformUtils.isMobile && (lat == null || lng == null)) {
      debugPrint('[AktivasiTempatSampahKomunal] Submit gagal: Sinyal GPS belum terkunci');
      _showErrorSnackBar('Sinyal GPS belum terkunci. Mohon tunggu atau pindah ke luar ruangan.');
      _fetchGps();
      return;
    }

    debugPrint(
      '[AktivasiTempatSampahKomunal] Mengirim request ke backend: qrCodes=[$_qrCode], lat=$lat, lng=$lng, address="${_addressController.text.trim()}"',
    );

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(petugasPemilahanRepositoryProvider);

      await repository.registerKomunalBin(
        qrCodes: [_qrCode],
        latitude: lat ?? 0.0,
        longitude: lng ?? 0.0,
        address: _addressController.text.trim(),
      );

      debugPrint('[AktivasiTempatSampahKomunal] SUKSES: Backend merespons OK!');
      if (mounted) {
        _showSuccessSnackBar('Tempat Sampah Komunal TPS berhasil diaktifkan!');
        Navigator.of(context).pop(true);
      }
    } catch (e, stack) {
      debugPrint('[AktivasiTempatSampahKomunal] ERROR REGISTER BIN: $e\n$stack');
      _showErrorSnackBar(e.toString().replaceAll('Exception: ', ''));
      if (mounted) {
        setState(() {
          _qrCode = '';
        });
        _scannerKey.currentState?.resetScanner();
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isReadyToSubmit = _qrCode.isNotEmpty &&
        !_isLoading &&
        (!PlatformUtils.isMobile || (_lat != null && _lng != null));

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Aktivasi Tempat Sampah Komunal',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.maybePop(context),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── 1. SCAN QR CODE TEMPAT SAMPAH ORGANIK ──
                const Text(
                  '1. Scan QR Code Tempat Sampah Organik',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (_qrCode.isEmpty)
                  Container(
                    height: 250,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: QrScannerWidget(
                      key: _scannerKey,
                      onQrDetected: _onQrDetected,
                      hint: 'BSK-OGN-XXXXXX',
                      overlayColor: AppColors.organicColor,
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primaryGreen),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.primaryGreen,
                          size: 28,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'QR Tempat Sampah Terdeteksi:',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _qrCode,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.refresh_rounded, color: AppColors.warningOrange),
                          tooltip: 'Scan Ulang',
                          onPressed: () {
                            debugPrint('[AktivasiTempatSampahKomunal] Reset scan QR oleh user');
                            setState(() {
                              _qrCode = '';
                            });
                            _scannerKey.currentState?.resetScanner();
                          },
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 20),

                // ── 2. KOORDINAT GPS (OTOMATIS) ──
                const Text(
                  '2. Koordinat GPS (Otomatis)',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _lat != null
                            ? Icons.location_on_rounded
                            : Icons.location_searching_rounded,
                        color: _lat != null ? AppColors.primaryBlue : AppColors.textHint,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _gpsLoading
                              ? 'Sedang mengunci posisi GPS akurat...'
                              : (_lat != null
                                  ? '${_lat!.toStringAsFixed(6)}, ${_lng!.toStringAsFixed(6)}'
                                  : 'Menunggu sinyal GPS...'),
                          style: TextStyle(
                            color: _lat != null ? AppColors.textPrimary : AppColors.textHint,
                            fontWeight: _lat != null ? FontWeight.bold : FontWeight.normal,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      if (_gpsLoading)
                        const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryBlue),
                          ),
                        )
                      else
                        IconButton(
                          icon: const Icon(Icons.refresh_rounded, color: AppColors.primaryBlue, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          tooltip: 'Segarkan GPS',
                          onPressed: _fetchGps,
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // ── 3. DETAIL LOKASI / ALAMAT TPS ──
                const Text(
                  '3. Detail Lokasi / Alamat TPS',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _addressController,
                  maxLines: 3,
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Contoh: TPS RW 16 Kelurahan Sekeloa',
                    hintStyle: const TextStyle(fontSize: 12, color: AppColors.textHint),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // ── 4. TOMBOL SUBMIT ──
                ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    disabledBackgroundColor: Colors.grey.shade300,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: isReadyToSubmit ? 2 : 0,
                  ),
                  child: Text(
                    _isLoading
                        ? 'Memproses...'
                        : 'Aktifkan Tempat Sampah Komunal',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: _isLoading ? Colors.white70 : Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_isLoading)
            const Positioned.fill(
              child: ColoredBox(
                color: Colors.black26,
                child: AppLoading(message: 'Mengaktifkan tempat sampah komunal...'),
              ),
            ),
        ],
      ),
    );
  }
}
