import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/values/app_colors.dart';
import '../../core/values/app_dimensions.dart';
import '../shared/widgets/qr_scanner_widget.dart';
import 'controllers/petugas_residu_controller.dart';

class TimbanganResiduView extends ConsumerStatefulWidget {
  const TimbanganResiduView({super.key});

  @override
  ConsumerState<TimbanganResiduView> createState() => _TimbanganResiduViewState();
}

class _TimbanganResiduViewState extends ConsumerState<TimbanganResiduView> {
  final _formKey = GlobalKey<FormState>();
  final _weightController = TextEditingController();
  final _binCodeController = TextEditingController();
  
  String? _selectedBinId;
  String? _photoPath;
  String _selectedClassification = 'Residu Non-B3';
  bool _isSubmitting = false;

  final List<String> _classifications = [
    'Residu Non-B3',
    'Residu B3',
    'Residu Popok/Pembalut',
    'Residu Lainnya',
  ];

  @override
  void dispose() {
    _weightController.dispose();
    _binCodeController.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
      if (file != null) {
        setState(() {
          _photoPath = file.path;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal mengambil foto: $e'), backgroundColor: AppColors.dangerRed),
      );
    }
  }

  void _showQrScannerModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.black,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SizedBox(
        height: MediaQuery.of(ctx).size.height * 0.7,
        child: Column(
          children: [
            AppBar(
              title: const Text('Scan QR Code Bin', style: TextStyle(color: Colors.white, fontSize: 16)),
              backgroundColor: Colors.black,
              iconTheme: const IconThemeData(color: Colors.white),
              automaticallyImplyLeading: false,
              actions: [
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            Expanded(
              child: QrScannerWidget(
                hint: 'Scan QR Tempat Sampah Warga',
                overlayColor: AppColors.primaryGreen,
                onQrDetected: (code) async {
                  setState(() {
                    _binCodeController.text = code;
                    _selectedBinId = code;
                  });
                  Navigator.pop(ctx);
                  return true;
                },
              ),
            ),
          ],
        ),
      ),
    );
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
          binId: _selectedBinId ?? _binCodeController.text.trim(),
          actualWeightKg: weight,
          classification: _selectedClassification,
          photoPath: _photoPath!,
        );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Input Timbangan Fisik ${weight.toStringAsFixed(1)} Kg Berhasil Disimpan!'),
          backgroundColor: AppColors.primaryGreen,
          duration: const Duration(seconds: 3),
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(petugasResiduControllerProvider);

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
                child: Row(
                  children: [
                    const Icon(Icons.scale_rounded, color: AppColors.primaryGreen, size: 28),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Input manual hasil timbangan fisik residu untuk update status penjemputan hilir.',
                        style: TextStyle(fontSize: 12, color: AppColors.textPrimary, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // 1. Pilih Bin / Scan QR
              const Text('Kode / QR Tempat Sampah', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              if (state.jadwalList.isNotEmpty)
                DropdownButtonFormField<String>(
                  value: _selectedBinId,
                  decoration: const InputDecoration(
                    hintText: 'Pilih dari Jadwal Penjemputan',
                    prefixIcon: Icon(Icons.delete_outline_rounded, color: AppColors.primaryGreen),
                  ),
                  items: state.jadwalList.map((bin) {
                    return DropdownMenuItem(
                      value: bin.binId,
                      child: Text(
                        '${bin.binCode} - ${bin.wargaName} (${bin.volumePercentage.toInt()}%)',
                        style: const TextStyle(fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }).toList(),
                  onChanged: (v) {
                    setState(() {
                      _selectedBinId = v;
                      _binCodeController.text = v ?? '';
                    });
                  },
                ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _binCodeController,
                      decoration: const InputDecoration(
                        hintText: 'Atau ketik manual Kode BIN',
                        prefixIcon: Icon(Icons.qr_code_rounded, color: AppColors.textSecondary),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Kode Tempat Sampah Wajib diisi' : null,
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton(
                    onPressed: _showQrScannerModal,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryBlueDark,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Icon(Icons.qr_code_scanner, color: Colors.white),
                  ),
                ],
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
                value: _selectedClassification,
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
                            fit: StackPane.expand,
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
              const SizedBox(height: AppDimensions.xl),

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
