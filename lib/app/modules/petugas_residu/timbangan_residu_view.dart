import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/values/app_colors.dart';
import '../../core/values/app_dimensions.dart';
import 'controllers/petugas_residu_controller.dart';

class TimbanganResiduView extends ConsumerStatefulWidget {
  const TimbanganResiduView({super.key});

  @override
  ConsumerState<TimbanganResiduView> createState() => _TimbanganResiduViewState();
}

class _TimbanganResiduViewState extends ConsumerState<TimbanganResiduView> {
  final _formKey = GlobalKey<FormState>();
  final _weightController = TextEditingController();
  
  String? _photoPath;
  String _selectedClassification = 'Residu Non-B3';
  bool _isSubmitting = false;
  
  int _estimatedPoints = 0;

  final List<String> _classifications = [
    'Residu Non-B3',
    'Residu B3',
    'Residu Popok/Pembalut',
    'Residu Lainnya',
  ];

  @override
  void initState() {
    super.initState();
    _weightController.addListener(_calculatePoints);
  }

  @override
  void dispose() {
    _weightController.removeListener(_calculatePoints);
    _weightController.dispose();
    super.dispose();
  }

  void _calculatePoints() {
    final weightStr = _weightController.text.trim();
    final weight = double.tryParse(weightStr) ?? 0.0;
    
    // Rumus: Poin = (Berat * 2) + (Foto Valid ? 10 : 0)
    int points = (weight * 2).toInt();
    if (_photoPath != null) {
      points += 10;
    }
    
    if (points != _estimatedPoints) {
      setState(() {
        _estimatedPoints = points;
      });
    }
  }

  Future<void> _takePhoto() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (file != null) {
        setState(() {
          _photoPath = file.path;
          _calculatePoints();
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal mengambil foto: $e'), backgroundColor: AppColors.dangerRed),
      );
    }
  }

  Future<void> _submitLog() async {
    if (!_formKey.currentState!.validate()) return;
    if (_photoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Foto bukti timbangan residu wajib diambil!'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }

    final double? weight = double.tryParse(_weightController.text.trim());
    if (weight == null || weight <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Berat timbangan harus angka positif (misal: 12.5)!'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final success = await ref.read(petugasResiduControllerProvider.notifier).submitLog(
          binId: 'bin_residu',
          actualWeightKg: weight,
          classification: _selectedClassification,
          photoPath: _photoPath!,
        );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      _showSuccessDialog(weight);
    }
  }

  void _handlePostSuccess() {
    if (Navigator.of(context).canPop()) {
      Navigator.pop(context);
    } else {
      // Jika layar ini digunakan sebagai tab (bukan dipush), maka reset form saja
      _weightController.clear();
      setState(() {
        _photoPath = null;
        _selectedClassification = _classifications.first;
        _calculatePoints();
      });
    }
  }

  void _showSuccessDialog(double weight) {
    // Ambil data dashboard untuk akumulasi global (fallback 540.2 jika null)
    final dashboard = ref.read(petugasResiduControllerProvider).dashboard;
    final double baseAccumulation = dashboard?.totalWeightKg ?? 540.2;
    // Total akumulasi = base + weight yang baru saja disubmit
    final double newTotal = baseAccumulation + weight;

    showDialog(
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
                      const Positioned(top: 8, right: 24, child: Icon(Icons.star, size: 8, color: Colors.blueAccent)),
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
                  'Data residu fisik telah tercatat\ndi Bin Residu Global RT/RW.',
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
                    border: Border.all(color: Colors.blue.shade100, width: 1.5),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
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
                            child: Text('Kg', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlue)),
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
                    color: Colors.green.shade50,
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
                            const Text('Akumulasi Bin Global', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                            const SizedBox(height: 2),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  newTotal.toStringAsFixed(1),
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen, height: 1),
                                ),
                                const SizedBox(width: 4),
                                const Text('Kg', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
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
                          '↑ +${weight.toStringAsFixed(1)} Kg',
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
                      Navigator.pop(ctx);
                      _handlePostSuccess();
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
      appBar: AppBar(
        title: const Text('Input Timbangan Residu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
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
                        'Input manual hasil timbangan fisik residu untuk terakumulasi ke Bin Residu Global RT/RW.',
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
                          Text('Bin Residu Global RT/RW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('Tercatat di Audit Trail Monitoring RT/RW & DLH', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
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
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*'))],
                decoration: const InputDecoration(
                  hintText: 'Masukkan berat (misal: 12.5)',
                  prefixIcon: Icon(Icons.scale_outlined, color: AppColors.primaryGreen),
                  suffixText: 'Kg',
                  suffixStyle: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Berat timbangan wajib diisi';
                  final val = double.tryParse(v);
                  if (val == null || val <= 0) return 'Masukkan angka positif';
                  return null;
                },
              ),
              const SizedBox(height: AppDimensions.lg),

              // 3. Klasifikasi Residu
              const Text('Klasifikasi Kategori Residu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
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
                  if (v != null) setState(() => _selectedClassification = v);
                },
              ),
              const SizedBox(height: AppDimensions.lg),

              // 4. Foto Timbangan (Kamera Langsung)
              const Text('Foto Bukti Timbangan (Kamera Langsung)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _takePhoto,
                child: Container(
                  height: 170,
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
                            ],
                          ),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
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
                            'Estimasi Pendapatan Poin',
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
                  onPressed: _isSubmitting ? null : _submitLog,
                  icon: _isSubmitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.check_circle_rounded, color: Colors.white),
                  label: Text(
                    _isSubmitting ? 'Mengirim Data...' : 'Simpan Timbangan Residu',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
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
