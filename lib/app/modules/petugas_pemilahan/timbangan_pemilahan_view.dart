import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/values/app_colors.dart';
import '../../core/values/app_dimensions.dart';
import '../../data/services/location_service.dart';
import '../shared/controllers/connectivity_controller.dart';
import '../shared/widgets/feature_rating_dialog.dart';
import 'controllers/petugas_pemilahan_controller.dart';

class TimbanganPemilahanView extends ConsumerStatefulWidget {
  const TimbanganPemilahanView({super.key});

  @override
  ConsumerState<TimbanganPemilahanView> createState() => _TimbanganPemilahanViewState();
}

class _TimbanganPemilahanViewState extends ConsumerState<TimbanganPemilahanView> {
  final _formKey = GlobalKey<FormState>();
  final _weightController = TextEditingController();
  
  String? _photoPath;
  Position? _currentLocation;
  String _selectedClassification = 'Pemilahan Non-B3';
  bool _isSubmitting = false;
  SharedPreferences? _prefs;
  
  int _estimatedPoints = 0;

  bool get _canSubmit {
    final weight = double.tryParse(_weightController.text.trim().replaceAll(',', '.')) ?? 0.0;
    return _photoPath != null && weight > 0 && !_isSubmitting;
  }

  final List<String> _classifications = [
    'Pemilahan Non-B3',
    'Pemilahan B3',
    'Pemilahan Popok/Pembalut',
    'Pemilahan Lainnya',
  ];

  @override
  void initState() {
    super.initState();
    _weightController.addListener(_calculatePoints);
    _loadDraft();
  }

  Future<void> _loadDraft() async {
    _prefs = await SharedPreferences.getInstance();
    final weight = _prefs?.getString('draft_weight_pemilahan');
    final classification = _prefs?.getString('draft_class_pemilahan');
    final photo = _prefs?.getString('draft_photo_pemilahan');

    if (mounted) {
      setState(() {
        if (weight != null) _weightController.text = weight;
        if (classification != null && _classifications.contains(classification)) {
          _selectedClassification = classification;
        }
        if (photo != null && File(photo).existsSync()) _photoPath = photo;
        _calculatePoints();
      });
    }
  }

  void _saveDraft() {
    _prefs?.setString('draft_weight_pemilahan', _weightController.text);
    _prefs?.setString('draft_class_pemilahan', _selectedClassification);
    if (_photoPath != null) {
      _prefs?.setString('draft_photo_pemilahan', _photoPath!);
    } else {
      _prefs?.remove('draft_photo_pemilahan');
    }
  }

  void _clearDraft() {
    _prefs?.remove('draft_weight_pemilahan');
    _prefs?.remove('draft_class_pemilahan');
    _prefs?.remove('draft_photo_pemilahan');
  }

  @override
  void dispose() {
    _weightController.removeListener(_calculatePoints);
    _weightController.dispose();
    super.dispose();
  }

  void _calculatePoints() {
    final weightStr = _weightController.text.trim().replaceAll(',', '.');
    final weight = double.tryParse(weightStr) ?? 0.0;
    
    // Skala KPI Petugas: 2 Poin per 1 Kg (Dibulatkan)
    int points = weight.round() * 2;
    
    // Bonus kehadiran & foto bukti di titik kumpul (+10)
    if (weight > 0 && _photoPath != null) {
      points += 10;
    }
    
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
      final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (file != null) {
        if (!mounted) return;
        final locPermission = await LocationService.instance.checkAndRequestPermission(context);
        Position? loc;
        if (locPermission == LocationPermission.whileInUse || locPermission == LocationPermission.always) {
          loc = await LocationService.instance.getCurrentLocation();
        }
        setState(() {
          _photoPath = file.path;
          _currentLocation = loc;
          _calculatePoints();
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal mengambil foto: $e'), backgroundColor: AppColors.maroonRed),
      );
    }
  }

  Future<void> _submitLog() async {
    if (!_formKey.currentState!.validate()) return;
    if (_photoPath == null) {
      ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Foto bukti timbangan pemilahan wajib diambil!'),
          backgroundColor: AppColors.maroonRed,
        ),
      );
      return;
    }

    final double? weight = double.tryParse(_weightController.text.trim().replaceAll(',', '.'));
    if (weight == null || weight <= 0 || weight > 9999) {
      ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Berat timbangan tidak valid!'),
          backgroundColor: AppColors.maroonRed,
        ),
      );
      return;
    }

    final isOnline = ref.read(isOnlineProvider);
    if (!isOnline) {
      ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Koneksi terputus. Data disimpan sebagai draft.'),
          backgroundColor: AppColors.maroonRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final success = await ref.read(petugasPemilahanControllerProvider.notifier).submitLog(
      binId: 'GLOBAL_BIN_RT_RW', 
      actualWeightKg: weight,
      classification: _selectedClassification,
      photoPath: _photoPath!,
      latitude: _currentLocation?.latitude,
      longitude: _currentLocation?.longitude,
    );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      await _showSuccessDialog(weight);
      if (mounted) {
        // Rating dialog 1-5 bintang (hanya muncul 1x saat pertama kali berhasil input timbangan)
        await showFeatureRatingOnceIfNeeded(
          context: context,
          featureKey: 'petugas_input_timbangan',
          featureTitle: 'Input Timbangan Berhasil! ⭐',
          featureSubtitle: 'Bagaimana kepuasan dan kemudahan Anda saat pertama kali melakukan input manual timbangan pemilahan?',
          roleTag: 'Petugas Pemilahan',
        );

        _clearDraft();
        _weightController.clear();
        setState(() {
          _photoPath = null;
          _selectedClassification = _classifications.first;
          _estimatedPoints = 0;
        });

        if (!mounted) return;
        if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        }
      }
    } else if (!success && mounted) {
      final errorMsg = ref.read(petugasPemilahanControllerProvider).errorMessage ?? 'Gagal menyimpan data timbangan.';
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMsg),
          backgroundColor: AppColors.maroonRed,
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          backgroundColor: Colors.white,
          elevation: 8,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
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
                        child: const Icon(Icons.check_rounded, color: Colors.white, size: 28),
                      ),
                      // Dekorasi bintang kecil (Stars)
                      const Positioned(top: 12, left: 12, child: Icon(Icons.circle, size: 4, color: AppColors.primaryBlue)),
                      const Positioned(top: 8, right: 24, child: Icon(Icons.star, size: 8, color: AppColors.primaryBlue)),
                      const Positioned(bottom: 16, left: 16, child: Icon(Icons.circle, size: 3, color: AppColors.primaryBlue)),
                      const Positioned(bottom: 24, right: 12, child: Icon(Icons.star, size: 10, color: AppColors.primaryGreen)),
                      const Positioned(top: 28, left: 6, child: Icon(Icons.star, size: 6, color: AppColors.primaryGreen)),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                
                // 2. Judul
                RichText(
                  textAlign: TextAlign.center,
                  text: const TextSpan(
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary, height: 1.2),
                    children: [
                      TextSpan(text: 'Timbangan Berhasil\n'),
                      TextSpan(text: 'Disimpan!', style: TextStyle(color: AppColors.primaryGreen)),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                
                // 3. Subjudul
                const Text(
                  'Data pemilahan fisik telah tercatat\ndi Tempat Sampah Pemilahan Global RW.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
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
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: AppColors.primaryBlue, width: 1.5),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.scale_rounded, size: 16, color: AppColors.primaryBlue),
                          SizedBox(width: 8),
                          Text('Berat yang dicatat', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            weight.toStringAsFixed(1),
                            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primaryBlue, height: 1),
                          ),
                          const SizedBox(width: 4),
                          const Padding(
                            padding: EdgeInsets.only(bottom: 2),
                            child: Text('kg', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlue)),
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
                        child: const Icon(Icons.delete_outline_rounded, color: AppColors.primaryGreen, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Akumulasi Tempat Sampah Pemilahan Global', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                            const SizedBox(height: 2),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    newTotal.toStringAsFixed(1),
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen, height: 1),
                                  ),
                                  const SizedBox(width: 4),
                                  const Text('kg', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
                                ],
                              ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '↑ +${weight.toStringAsFixed(1)} kg',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
    return Scaffold(
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
                child: const Row(
                  children: [
                    Icon(Icons.scale_rounded, color: AppColors.primaryGreen, size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Input manual hasil timbangan fisik pemilahan untuk terakumulasi ke Tempat Sampah Pemilahan Global RW.',
                        style: TextStyle(fontSize: 12, color: AppColors.textPrimary, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // 1. Lokasi / Bin Global Info
              const Text('Target Penampungan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.delete_sweep_rounded, color: AppColors.primaryGreen),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Tempat Sampah Pemilahan Global RW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('Tercatat di Audit Trail Monitoring RW & DLH', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // 2. Input Berat Timbangan (Kg)
              const Text('Berat Fisik Timbangan (Kg)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _weightController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: false),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*[\.\,]?\d*'))],
                decoration: const InputDecoration(
                  hintText: 'Masukkan berat (misal: 12.5 atau 12,5)',
                  prefixIcon: Icon(Icons.scale_outlined, color: AppColors.primaryGreen),
                  suffixText: 'Kg',
                  suffixStyle: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Berat timbangan wajib diisi';
                  final val = double.tryParse(v.replaceAll(',', '.'));
                  if (val == null || val <= 0) return 'Masukkan angka positif';
                  if (val > 9999) return 'Maksimal 9999 kg';
                  return null;
                },
              ),
              const SizedBox(height: AppDimensions.lg),

              // 3. Klasifikasi Pemilahan
              const Text('Klasifikasi Kategori Pemilahan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _selectedClassification,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.category_outlined, color: AppColors.primaryGreen),
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

              // 4. Foto Timbangan (Kamera Langsung)
              const Text('Foto Bukti Timbangan (Kamera Langsung)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _takePhoto,
                child: Container(
                  height: 200, // Make camera area taller for better view
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
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.black54,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.location_on, color: AppColors.primaryGreen, size: 14),
                                        const SizedBox(width: 4),
                                        Text(
                                          'GPS Tercatat: ${_currentLocation!.latitude.toStringAsFixed(4)}, ${_currentLocation!.longitude.toStringAsFixed(4)}',
                                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        )
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt_rounded, size: 48, color: AppColors.primaryGreen),
                            SizedBox(height: 8),
                            Text('Ketuk untuk Ambil Foto Timbangan', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
                            SizedBox(height: 4),
                            Text('Hanya mendukung kamera langsung', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
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
                            'Estimasi Poin Sementara (Dihitung Server)',
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
                          color: AppColors.warningYellow.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.camera_alt_rounded, size: 12, color: AppColors.warningOrange),
                            SizedBox(width: 4),
                            Text('+10', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.warningOrange)),
                          ],
                        ),
                      )
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
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.check_circle_rounded, color: Colors.white),
                  label: Text(
                    _isSubmitting ? 'Mengirim Data...' : 'Simpan Timbangan Pemilahan',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    disabledBackgroundColor: Colors.grey[300],
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

