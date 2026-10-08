import 'dart:io';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/scale_display_parser.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/bin_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/location_service.dart';
import '../../../data/services/offline_queue_service.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../shared/controllers/connectivity_controller.dart';
import '../controllers/petugas_pemilahan_controller.dart';

class TimbanganPemilahanView extends ConsumerStatefulWidget {
  const TimbanganPemilahanView({
    super.key,
    this.initialBinId,
    this.initialBinCode,
    this.initialCategory,
    this.initialWargaName,
  });

  final String? initialBinId;
  final String? initialBinCode;
  final String? initialCategory;
  final String? initialWargaName;

  @override
  ConsumerState<TimbanganPemilahanView> createState() =>
      _TimbanganPemilahanViewState();
}

class _TimbanganPemilahanViewState
    extends ConsumerState<TimbanganPemilahanView> {
  final _formKey = GlobalKey<FormState>();
  final _weightController = TextEditingController();

  String? _photoPath;
  String? _photoTimbanganPath;
  Position? _currentLocation;
  String? _locationAddress;
  String _selectedClassification = 'Organik';
  bool _isSubmitting = false;
  bool _isScanningAi = false;
  SharedPreferences? _prefs;
  String _inputMethod = 'MANUAL';
  double? _ocrDetectedValue; // ponytail: tracks original OCR reading for banner display

  int _estimatedPoints = 0;

  bool get _canSubmit {
    final weight = double.tryParse(_weightController.text.trim().replaceAll(',', '.')) ?? 0.0;
    return _photoPath != null && _photoTimbanganPath != null && weight > 0 && !_isSubmitting && !_isScanningAi;
  }

  final List<String> _classifications = [
    'Organik',
    'Anorganik',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialCategory != null) {
      final cat = widget.initialCategory!.trim().toUpperCase();
      if (cat.contains('ANORGANIK') || cat == 'ANORGANIC') {
        _selectedClassification = 'Anorganik';
      } else if (cat.contains('ORGANIK') || cat == 'ORGANIC') {
        _selectedClassification = 'Organik';
      }
    }
    _weightController.addListener(_calculatePoints);
    _weightController.addListener(_onWeightManualEdit);
    _loadDraft();
  }

  Future<void> _loadDraft() async {
    _prefs = await SharedPreferences.getInstance();
    // ponytail: always start fresh - clear any stale draft from previous session
    await _clearDraft();
  }

  void _saveDraft() {
    _prefs?.setString('draft_weight_pemilahan', _weightController.text);
    _prefs?.setString('draft_class_pemilahan', _selectedClassification);
    if (_photoPath != null) {
      _prefs?.setString('draft_photo_pemilahan', _photoPath!);
    } else {
      _prefs?.remove('draft_photo_pemilahan');
    }
    if (_photoTimbanganPath != null) {
      _prefs?.setString('draft_photo_timbangan_pemilahan', _photoTimbanganPath!);
    } else {
      _prefs?.remove('draft_photo_timbangan_pemilahan');
    }
  }

  Future<void> _clearDraft() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('draft_weight_pemilahan');
    await prefs.remove('draft_class_pemilahan');
    await prefs.remove('draft_photo_pemilahan');
    await prefs.remove('draft_photo_timbangan_pemilahan');
  }

  @override
  void dispose() {
    _weightController.removeListener(_calculatePoints);
    _weightController.removeListener(_onWeightManualEdit);
    _weightController.dispose();
    super.dispose();
  }

  void _calculatePoints() {
    final weightStr = _weightController.text.trim().replaceAll(',', '.');
    final weight = double.tryParse(weightStr) ?? 0.0;

    // SSOT Backend: Flat 5 Poin per input timbangan pemilahan residu
    final int points = weight > 0 ? 5 : 0;

    if (points != _estimatedPoints) {
      setState(() {
        _estimatedPoints = points;
      });
    }
    _saveDraft();
  }

  Future<void> _takePhoto() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
      );
      if (file != null) {
        if (!mounted) return;
        final locPermission = await LocationService.instance
            .checkAndRequestPermission(context, role: 'petugas_pemilahan');
        Position? loc;
        String? address;
        if (locPermission == LocationPermission.whileInUse ||
            locPermission == LocationPermission.always) {
          loc = await LocationService.instance.getCurrentLocation();
          if (loc != null) {
            address = await LocationService.instance.getAddressFromCoordinates(
              loc.latitude,
              loc.longitude,
            );
          }
        }
        setState(() {
          _photoPath = file.path;
          _currentLocation = loc;
          _locationAddress = address;
          _isScanningAi = true;
        });

        // ponytail: Auto-detect classification suggestion. Fallback silently to manual entry if offline/timeout.
        try {
          final user = ref.read(authProvider).user;
          final userId = user?.id ?? '';
          final aiResult = await ref.read(binRepositoryProvider).detectWaste(
            userId,
            imagePath: file.path,
          );
          if (mounted) {
            final category = aiResult.detectedType == WasteType.organic ? 'Organik' : 'Anorganik';
            setState(() {
              _selectedClassification = category;
            });
          }
        } catch (e) {
          debugPrint('[TimbanganPemilahan] Waste detect fallback: $e');
        } finally {
          if (mounted) {
            setState(() => _isScanningAi = false);
          }
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal mengambil foto: $e'),
          backgroundColor: AppColors.maroonRed,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _takePhotoTimbangan() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
      );
      if (file != null) {
        setState(() {
          _photoTimbanganPath = file.path;
          _isScanningAi = true;
        });

        // On-device OCR via ML Kit
        try {
          final inputImage = InputImage.fromFilePath(file.path);
          final textRecognizer = TextRecognizer();
          final recognised = await textRecognizer.processImage(inputImage);
          await textRecognizer.close();

          final parsed = ScaleDisplayParser.parse(recognised.text);
          if (parsed != null && mounted) {
            setState(() {
              _ocrDetectedValue = parsed;
              _inputMethod = 'OCR_CAMERA';
              _weightController.text = parsed.toStringAsFixed(1);
            });
          }
        } catch (e) {
          debugPrint('[TimbanganPemilahan] OCR fallback: $e');
          // ponytail: OCR gagal → tetap simpan foto, petugas input manual
        } finally {
          if (mounted) setState(() => _isScanningAi = false);
        }
        _calculatePoints();
      }
    } catch (e) {
      debugPrint('Error taking photo timbangan: $e');
    }
  }

  void _onWeightManualEdit() {
    // Jika petugas mengedit setelah OCR fill, ubah status
    if (_inputMethod == 'OCR_CAMERA' && _ocrDetectedValue != null) {
      final current = double.tryParse(
        _weightController.text.trim().replaceAll(',', '.'),
      );
      if (current != _ocrDetectedValue) {
        _inputMethod = 'OCR_MANUAL_CORRECTED';
      }
    }
  }

  Future<void> _submitLog() async {
    if (!_formKey.currentState!.validate()) return;
    if (_photoPath == null || _photoTimbanganPath == null) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Foto bukti timbangan pemilahan wajib diambil!'),
          backgroundColor: AppColors.maroonRed,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    final double? weight = double.tryParse(_weightController.text.trim().replaceAll(',', '.'));
    if (weight == null || weight <= 0 || weight > 500) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Berat timbangan tidak valid (0.1 - 500 kg)!'),
          backgroundColor: AppColors.maroonRed,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    final targetBinId = (widget.initialBinId != null && widget.initialBinId!.isNotEmpty)
        ? widget.initialBinId!
        : ((widget.initialBinCode != null && widget.initialBinCode!.isNotEmpty)
            ? widget.initialBinCode!
            : 'GLOBAL_BIN_RT_RW');

    final isOnline = ref.read(isOnlineProvider);
    if (!isOnline) {
      final user = ref.read(authProvider).user;
      await OfflineQueueService.enqueue({
        'transaction_id': 'TRX-${DateTime.now().millisecondsSinceEpoch}',
        'collector_id': user?.id ?? '',
        'bin_id': targetBinId,
        'weight_kg': weight,
        'input_method': _inputMethod,
        'evidence_photo_path': _photoTimbanganPath,
        'photo_path': _photoPath,
        'classification': _selectedClassification,
        'timestamp': DateTime.now().toUtc().toIso8601String(),
        'latitude': _currentLocation?.latitude,
        'longitude': _currentLocation?.longitude,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Data Berhasil Disimpan di Antrean Offline\n(Akan otomatis disinkronkan saat sinyal pulih)'),
          backgroundColor: AppColors.primaryGreen,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final success = await ref
        .read(petugasPemilahanControllerProvider.notifier)
        .submitLog(
          binId: targetBinId,
          actualWeightKg: weight,
          classification: _selectedClassification,
          photoPath: _photoPath!,
          photoTimbanganPath: _photoTimbanganPath!,
          inputMethod: _inputMethod,
          latitude: _currentLocation?.latitude,
          longitude: _currentLocation?.longitude,
        );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      await _showSuccessDialog(weight);
      if (mounted) {
        await _clearDraft(); // ponytail: clear BEFORE setState to prevent stale prefs if page is re-opened before async completes
        _weightController.removeListener(_calculatePoints);
        _weightController.removeListener(_onWeightManualEdit);
        setState(() {
          _photoPath = null;
          _photoTimbanganPath = null;
          _selectedClassification = _classifications.first;
          _estimatedPoints = 0;
          _inputMethod = 'MANUAL';
          _ocrDetectedValue = null;
        });
        _weightController.clear();
        _weightController.addListener(_calculatePoints);
        _weightController.addListener(_onWeightManualEdit);

        if (!mounted) return;
        if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        }
      }
    } else if (!success && mounted) {
      final errorMsg =
          ref.read(petugasPemilahanControllerProvider).errorMessage ??
          'Gagal menyimpan data timbangan.';
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMsg),
          backgroundColor: AppColors.maroonRed,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _showSuccessDialog(double weight) async {
    // Ambil data dashboard untuk akumulasi global
    final dashboard = ref.read(petugasPemilahanControllerProvider).dashboard;
    final double baseAccumulation = dashboard?.totalWeightKg ?? 0.0;
    // Total akumulasi = base + weight yang baru saja disubmit
    final double newTotal = baseAccumulation + weight;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          backgroundColor: Colors.white,
          elevation: 8,
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 24,
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 1. Ikon Centang dengan Ripple/Halo Effect & Stars (Diperkecil)
                SizedBox(
                  width: 90,
                  height: 90,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Outer Halo
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                      ),
                      // Inner Halo
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                      ),
                      // Core Green Circle
                      Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          color: AppColors.primaryGreen,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check_rounded,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      // Dekorasi bintang kecil (Stars)
                      const Positioned(
                        top: 12,
                        left: 12,
                        child: Icon(
                          Icons.circle,
                          size: 4,
                          color: AppColors.primaryBlue,
                        ),
                      ),
                      const Positioned(
                        top: 8,
                        right: 24,
                        child: Icon(
                          Icons.star,
                          size: 8,
                          color: AppColors.primaryBlue,
                        ),
                      ),
                      const Positioned(
                        bottom: 16,
                        left: 16,
                        child: Icon(
                          Icons.circle,
                          size: 3,
                          color: AppColors.primaryBlue,
                        ),
                      ),
                      const Positioned(
                        bottom: 24,
                        right: 12,
                        child: Icon(
                          Icons.star,
                          size: 10,
                          color: AppColors.primaryGreen,
                        ),
                      ),
                      const Positioned(
                        top: 28,
                        left: 6,
                        child: Icon(
                          Icons.star,
                          size: 6,
                          color: AppColors.primaryGreen,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // 2. Judul
                RichText(
                  textAlign: TextAlign.center,
                  text: const TextSpan(
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                      height: 1.2,
                    ),
                    children: [
                      TextSpan(text: 'Timbangan Berhasil\n'),
                      TextSpan(
                        text: 'Disimpan!',
                        style: TextStyle(color: AppColors.primaryGreen),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // 3. Subjudul
                Text(
                  widget.initialBinCode != null
                      ? 'Data pemilahan fisik tercatat dan tempat sampah ${widget.initialBinCode} berhasil dikosongkan.'
                      : 'Data pemilahan fisik telah tercatat\ndi Tempat Sampah Pemilahan Global RW.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.normal,
                    color: AppColors.textSecondary,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 20),

                // 4. Card Berat yang dicatat
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    vertical: 16,
                    horizontal: 16,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(
                      color: AppColors.primaryBlue,
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.scale_rounded,
                            size: 16,
                            color: AppColors.primaryBlue,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Berat yang dicatat',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            weight.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryBlue,
                              height: 1,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Padding(
                            padding: EdgeInsets.only(bottom: 2),
                            child: Text(
                              'kg',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryBlue,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // 5. Card Akumulasi Bin Global
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreenLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.delete_outline_rounded,
                          color: AppColors.primaryGreen,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Akumulasi Tempat Sampah Pemilahan Global',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  newTotal.toStringAsFixed(1),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryGreen,
                                    height: 1,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Text(
                                  'kg',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '↑ +${weight.toStringAsFixed(1)} kg',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // 6. Tombol Selesai
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1C64F2),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Selesai',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    bool hasUnsavedChanges() {
      return _weightController.text.isNotEmpty ||
          _photoPath != null ||
          _selectedClassification != _classifications.first;
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;

        if (!hasUnsavedChanges()) {
          if (context.mounted) Navigator.pop(context);
          return;
        }

        final bool? shouldPop = await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Text(
                'Batalkan Input Timbangan?',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: const Text(
                'Perubahan ini akan terhapus jika Anda keluar dari halaman ini.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text(
                    'Lanjutkan Edit',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.dangerRed,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => Navigator.of(context).pop(true),
                  child: const Text('Keluar'),
                ),
              ],
            );
          },
        );

        if (shouldPop == true && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        title: const Text('Input Timbangan'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(AppDimensions.md),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.scale_rounded, color: AppColors.primaryGreen, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.initialBinCode != null
                                ? 'Pengosongan ${widget.initialWargaName != null ? '${widget.initialWargaName!} (${widget.initialBinCode!})' : widget.initialBinCode!}'
                                : 'Tempat Sampah Pemilahan Global RW',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            widget.initialBinCode != null
                                ? 'Input timbangan untuk mencatat pemilahan sekaligus reset volume tempat sampah ke 0%.'
                                : 'Input manual hasil timbangan fisik pemilahan untuk terakumulasi ke audit trail RW & DLH.',
                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // 2. Input Berat Timbangan (kg)
              const Text('Berat Fisik Timbangan (kg)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              // OCR status banner
              if (_ocrDetectedValue != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: _inputMethod == 'OCR_MANUAL_CORRECTED'
                        ? AppColors.warningOrange.withValues(alpha: 0.1)
                        : AppColors.primaryBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _inputMethod == 'OCR_MANUAL_CORRECTED'
                          ? AppColors.warningOrange.withValues(alpha: 0.3)
                          : AppColors.primaryBlue.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _inputMethod == 'OCR_MANUAL_CORRECTED' ? Icons.edit_note : Icons.auto_fix_high,
                        size: 16,
                        color: _inputMethod == 'OCR_MANUAL_CORRECTED' ? AppColors.warningOrange : AppColors.primaryBlue,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _inputMethod == 'OCR_MANUAL_CORRECTED'
                              ? 'OCR: ${_ocrDetectedValue!.toStringAsFixed(1)} kg → Dikoreksi manual'
                              : 'Terdeteksi via OCR: ${_ocrDetectedValue!.toStringAsFixed(1)} kg (Dapat diedit manual)',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _inputMethod == 'OCR_MANUAL_CORRECTED' ? AppColors.warningOrange : AppColors.primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              TextFormField(
                controller: _weightController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: false),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*[\.\,]?\d*'))],
                decoration: const InputDecoration(
                  hintText: 'Masukkan berat (misal: 12.5 atau 12,5)',
                  prefixIcon: Icon(Icons.scale_outlined, color: AppColors.primaryGreen),
                  suffixText: 'kg',
                  suffixStyle: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                  helperText: '* Angka terisi otomatis dari foto timbangan (OCR), atau dapat diketik manual langsung di kolom ini.',
                  helperMaxLines: 2,
                  helperStyle: TextStyle(color: AppColors.primaryBlue, fontStyle: FontStyle.italic),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Berat timbangan wajib diisi';
                  final val = double.tryParse(v.replaceAll(',', '.'));
                  if (val == null || val <= 0) return 'Masukkan angka positif';
                  if (val > 500) return 'Maksimal 500 kg per input';
                  return null;
                },
              ),
              const SizedBox(height: AppDimensions.lg),

              // 3. Klasifikasi Pemilahan
              const Text('Klasifikasi Kategori Pemilahan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                key: ValueKey(_selectedClassification),
                initialValue: _selectedClassification,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.category_outlined, color: AppColors.primaryGreen),
                  helperText: '* Kategori akan dideteksi otomatis saat Anda mengambil foto sampah, namun dapat dipilih manual.',
                  helperMaxLines: 2,
                  helperStyle: TextStyle(color: AppColors.primaryBlue, fontStyle: FontStyle.italic),
                ),
                items: _classifications
                    .map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 14))))
                    .toList(),
                onChanged: (v) {
                  if (v != null) {
                    setState(() => _selectedClassification = v);
                    _saveDraft();
                  }
                },
              ),
              const SizedBox(height: AppDimensions.lg),

              // 4. Foto Bukti Sampah
              const Text('Foto Bukti Sampah', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _isScanningAi ? null : _takePhoto,
                child: Container(
                  height: 260, // Increased height so photo is not aggressively cropped
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _photoPath == null ? Colors.grey[300]! : AppColors.primaryGreen,
                      width: 2,
                    ),
                  ),
                  child: _photoPath != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.file(File(_photoPath!), fit: BoxFit.cover),
                              Positioned(
                                right: 12,
                                top: 12,
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: const BoxDecoration(
                                    color: Colors.black54,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.edit, color: Colors.white, size: 20),
                                ),
                              ),
                              if (_currentLocation != null)
                                Positioned(
                                  left: 12,
                                  bottom: 12,
                                  right: 12,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.7),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.location_on, color: AppColors.primaryGreen, size: 14),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            _locationAddress != null && _locationAddress!.isNotEmpty
                                                ? _locationAddress!
                                                : 'GPS: ${_currentLocation!.latitude.toStringAsFixed(4)}, ${_currentLocation!.longitude.toStringAsFixed(4)}',
                                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              if (_isScanningAi)
                                Container(
                                  color: Colors.black54,
                                  child: const Center(
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        CircularProgressIndicator(color: Colors.white),
                                        SizedBox(height: 12),
                                        Text(
                                          'Memproses bukti foto...',
                                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        )
                      : _isScanningAi
                          ? const Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircularProgressIndicator(color: AppColors.primaryGreen),
                                  SizedBox(height: 12),
                                  Text(
                                    'Memproses bukti foto...',
                                    style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                ],
                              ),
                            )
                          : const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.delete_outline_rounded, size: 40, color: AppColors.primaryGreen),
                                SizedBox(height: 8),
                                Text('Ambil Foto Bukti Sampah', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
                                SizedBox(height: 4),
                                Text('Pastikan sampah terlihat jelas', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                              ],
                            ),
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // 5. Foto Bukti Penimbangan (OCR)
              const Text('Foto Timbangan & Display Angka (OCR)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 4),
              const Text(
                'Ambil foto saat sampah berada di atas timbangan. Pastikan layar angka timbangan terlihat jelas dan tidak buram/silau agar terbaca otomatis.',
                style: TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.3),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _isScanningAi ? null : _takePhotoTimbangan,
                child: Container(
                  height: 260,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _photoTimbanganPath == null ? Colors.grey[300]! : AppColors.primaryBlue,
                      width: 2,
                    ),
                  ),
                  child: _photoTimbanganPath != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.file(File(_photoTimbanganPath!), fit: BoxFit.cover),
                              // Evidence badge
                              Positioned(
                                left: 12,
                                top: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryGreen,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.check_circle, color: Colors.white, size: 12),
                                      SizedBox(width: 4),
                                      Text('Evidence OK', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                              ),
                              // Ambil Ulang button
                              Positioned(
                                right: 12,
                                top: 12,
                                child: GestureDetector(
                                  onTap: _takePhotoTimbangan,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.black54,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.refresh, color: Colors.white, size: 14),
                                        SizedBox(width: 4),
                                        Text('Ambil Ulang', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              if (_isScanningAi)
                                Container(
                                  color: Colors.black54,
                                  child: const Center(
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        CircularProgressIndicator(color: Colors.white),
                                        SizedBox(height: 12),
                                        Text('Membaca angka timbangan...', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        )
                      : _isScanningAi
                          ? const Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircularProgressIndicator(color: AppColors.primaryBlue),
                                  SizedBox(height: 12),
                                  Text('Membaca angka timbangan...', style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold, fontSize: 13)),
                                ],
                              ),
                            )
                          : const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.document_scanner_outlined, size: 40, color: AppColors.primaryBlue),
                                SizedBox(height: 8),
                                Text('Ambil Foto Timbangan (OCR)', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlue)),
                                SizedBox(height: 4),
                                Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 16),
                                  child: Text(
                                    'Foto saat sampah ditimbang & pastikan angka display terlihat jelas',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                  ),
                                ),
                              ],
                            ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(AppDimensions.md),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Dynamic Point Estimator
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.stars_rounded, color: AppColors.warningOrange, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Estimasi Poin Sementara',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                          ),
                          Row(
                            children: [
                              Text(
                                '$_estimatedPoints',
                                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
                              ),
                              const SizedBox(width: 4),
                              const Text(
                                'Pts',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (_photoPath != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.check_circle_rounded, size: 12, color: AppColors.primaryGreen),
                            SizedBox(width: 4),
                            Text(
                              'Foto OK',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.md),
              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _canSubmit ? _submitLog : null,
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(
                          Icons.check_circle_rounded,
                          color: Colors.white,
                        ),
                  label: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      _isSubmitting
                          ? 'Mengirim Data...'
                          : 'Simpan Timbangan Pemilahan',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    disabledBackgroundColor: Colors.grey[300],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
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
