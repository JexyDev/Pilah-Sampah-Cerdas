import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
import '../controllers/petugas_residu_controller.dart';

class LaporPelanggaranView extends ConsumerStatefulWidget {
  const LaporPelanggaranView({super.key});

  @override
  ConsumerState<LaporPelanggaranView> createState() => _LaporPelanggaranViewState();
}

class _LaporPelanggaranViewState extends ConsumerState<LaporPelanggaranView> {
  final _formKey = GlobalKey<FormState>();
  final _qrController = TextEditingController();

  String? _photoPath;
  String _selectedType = 'Sampah Organik Tercampur';
  String _selectedSeverity = 'LOW';
  bool _isSubmitting = false;

  final List<String> _violationTypes = [
    'Sampah Organik Tercampur',
    'Sampah Anorganik Tercampur',
    'Sampah B3 Tidak Terpilah',
  ];

  @override
  void dispose() {
    _qrController.dispose();
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
              title: const Text('Scan QR Code Tempat Sampah', style: TextStyle(color: Colors.white, fontSize: 16)),
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
                overlayColor: AppColors.dangerRed,
                onQrDetected: (code) async {
                  setState(() {
                    _qrController.text = code;
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

  Future<void> _submitViolation() async {
    if (!_formKey.currentState!.validate()) return;
    if (_photoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Foto bukti pelanggaran wajib diambil dari kamera!'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final success = await ref.read(petugasResiduControllerProvider.notifier).laporViolation(
          binQrCode: _qrController.text.trim(),
          evidencePhotoPath: _photoPath!,
          type: _selectedType,
          severity: _selectedSeverity,
        );

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (dialogCtx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          contentPadding: const EdgeInsets.all(24),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.dangerRed.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.report_problem_rounded,
                  color: AppColors.dangerRed,
                  size: 52,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Laporan Berhasil Dikirim!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Sistem backend otomatis memproses laporan, pemotongan poin warga, dan mengirimkan notifikasi peringatan.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(dialogCtx);
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.dangerRed,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text(
                    'Selesai',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Lapor Pelanggaran Residu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        backgroundColor: AppColors.dangerRed,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Banner Panduan Pelanggaran
              Container(
                padding: const EdgeInsets.all(AppDimensions.md),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: AppColors.dangerRed, size: 24),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Foto bukti dan Scan QR Wajib dilampirkan. Laporan pelanggaran akan berdampak langsung pada skor insentif poin warga.',
                        style: TextStyle(fontSize: 12, color: AppColors.dangerRed, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // 1. Kode QR Tempat Sampah
              const Text('Kode QR / Serial Bin Warga', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _qrController,
                      decoration: const InputDecoration(
                        hintText: 'Contoh: RES-010201',
                        prefixIcon: Icon(Icons.qr_code_rounded, color: AppColors.textSecondary),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Kode QR Wajib diisi' : null,
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

              // 2. Foto Bukti Pelanggaran
              const Text('Foto Bukti Pelanggaran (Kamera Langsung)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _takePhoto,
                child: Container(
                  height: 180,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _photoPath == null ? Colors.grey[300]! : AppColors.dangerRed,
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
                            Icon(Icons.camera_alt_rounded, size: 48, color: AppColors.dangerRed),
                            SizedBox(height: 8),
                            Text('Ketuk untuk Ambil Foto Bukti', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.dangerRed)),
                            SizedBox(height: 4),
                            Text('Hanya mendukung kamera langsung', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // 3. Jenis Pelanggaran
              const Text('Jenis Pelanggaran', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _selectedType,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.warning_amber_rounded, color: AppColors.dangerRed),
                ),
                items: _violationTypes
                    .map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 14))))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedType = v);
                },
              ),
              const SizedBox(height: AppDimensions.lg),

              // 4. Tingkat Keparahan (Severity)
              const Text('Tingkat Keparahan (Severity)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildSeverityCard('LOW', 'Ringan', 'Tercampur sedikit (-10 Poin)', Colors.orange),
                  const SizedBox(width: 8),
                  _buildSeverityCard('MEDIUM', 'Sedang', 'Tercampur separuh (-25 Poin)', Colors.deepOrange),
                  const SizedBox(width: 8),
                  _buildSeverityCard('SEVERE', 'Berat', 'Tercampur total (-50 Poin)', AppColors.dangerRed),
                ],
              ),
              const SizedBox(height: AppDimensions.xl),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitViolation,
                  icon: _isSubmitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.send_rounded, color: Colors.white),
                  label: Text(
                    _isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Pelanggaran',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.dangerRed,
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

  Widget _buildSeverityCard(String value, String title, String subtitle, Color color) {
    final isSelected = _selectedSeverity == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedSeverity = value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected ? color.withValues(alpha: 0.12) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : Colors.grey[300]!,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: isSelected ? color : AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  color: isSelected ? color : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
