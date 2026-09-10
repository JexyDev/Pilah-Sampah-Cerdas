import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/ai_detection_entity.dart';
import '../../../data/models/bin_entity.dart';
import '../../../routes/app_routes.dart';
import '../../scan/controllers/scan_controller.dart';
import '../../shared/widgets/inline_camera_widget.dart';

/// Halaman Scan AI Trial — khusus untuk Warga yang belum aktivasi Tempat Sampah (Guest Mode).
///
/// Menggunakan endpoint POST /api/v1/waste/detect (murni inferensi AI, tanpa commit transaksi).
/// Setelah hasil tampil, ada CTA "Gabung Komunitas Berseka" untuk mengajak warga aktivasi bin.
class ScanTrialView extends ConsumerStatefulWidget {
  const ScanTrialView({super.key});

  @override
  ConsumerState<ScanTrialView> createState() => _ScanTrialViewState();
}

class _ScanTrialViewState extends ConsumerState<ScanTrialView> {
  // 0 = kamera, 1 = loading AI, 2 = hasil
  int _step = 0;
  String _capturedImagePath = '';
  AiDetectionEntity? _aiResult;
  String? _errorMessage;

  Future<void> _onImageCaptured(String path, double sizeKB) async {
    setState(() {
      _capturedImagePath = path;
      _step = 1;
      _errorMessage = null;
    });

    try {
      await ref
          .read(scanFlowProvider.notifier)
          .detectWaste(imagePath: path);

      final scanState = ref.read(scanFlowProvider);

      if (!mounted) return;

      if (scanState.errorCode != null) {
        setState(() {
          _errorMessage = scanState.errorMessage ?? 'Deteksi gagal. Coba lagi.';
          _step = 0;
        });
        return;
      }

      setState(() {
        _aiResult = scanState.aiResult;
        _step = 2;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Gagal menghubungi server AI. Periksa koneksi Anda.';
        _step = 0;
      });
    }
  }

  void _reset() {
    ref.read(scanFlowProvider.notifier).reset();
    setState(() {
      _step = 0;
      _capturedImagePath = '';
      _aiResult = null;
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Uji Coba Deteksi AI',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Banner trial mode
          _TrialModeBanner(),
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_step == 0) return _buildCameraStep();
    if (_step == 1) return _buildLoadingStep();
    return _buildResultStep();
  }

  // ─── Step 0: Kamera ──────────────────────────────────────────────────────────
  Widget _buildCameraStep() {
    return Column(
      children: [
        if (_errorMessage != null)
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: AppColors.dangerRed.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline_rounded,
                    color: AppColors.dangerRed, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      color: AppColors.dangerRed,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ambil Foto Sampah',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Arahkan kamera ke sampah, lalu tekan tombol capture. AI akan mendeteksi jenis sampahnya.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: InlineCameraWidget(
                      onImageCaptured: _onImageCaptured,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── Step 1: Loading AI ───────────────────────────────────────────────────────
  Widget _buildLoadingStep() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Preview foto yang diambil
            if (_capturedImagePath.isNotEmpty)
              Container(
                height: 200,
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.file(
                    File(_capturedImagePath),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            const SizedBox(
              width: 52,
              height: 52,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Sedang Menganalisis...',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Model AI sedang memproses gambar sampah Anda. Mohon tunggu sebentar.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Step 2: Hasil Deteksi AI ─────────────────────────────────────────────────
  Widget _buildResultStep() {
    final result = _aiResult;
    if (result == null) return const SizedBox.shrink();

    final isOrganic = result.detectedType == WasteType.organic;
    final typeColor = isOrganic ? AppColors.primaryGreen : AppColors.primaryBlue;
    final typeLabel = isOrganic ? 'Organik' : 'Anorganik';
    final typeIcon = isOrganic ? Icons.eco_rounded : Icons.recycling_rounded;
    final confidencePercent = ((result.confidence ?? 0) * 100).toStringAsFixed(1);
    final weightKg = result.displayWeightKg.toStringAsFixed(2);
    final estimatedPts = result.estimatedPoints ?? 0;

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header hasil
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: typeColor.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(typeIcon, color: typeColor, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Hasil Deteksi AI',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        'Sampah $typeLabel',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: typeColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Foto preview kecil
            if (_capturedImagePath.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.file(
                  File(_capturedImagePath),
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),

            const SizedBox(height: 16),

            // Stats cards
            Row(
              children: [
                _StatChip(
                  label: 'Akurasi AI',
                  value: '$confidencePercent%',
                  icon: Icons.analytics_rounded,
                  color: AppColors.primaryGreen,
                ),
                const SizedBox(width: 10),
                _StatChip(
                  label: 'Est. Berat',
                  value: '${weightKg} kg',
                  icon: Icons.scale_rounded,
                  color: AppColors.warningOrange,
                ),
                const SizedBox(width: 10),
                _StatChip(
                  label: 'Est. Poin',
                  value: '+$estimatedPts',
                  icon: Icons.stars_rounded,
                  color: AppColors.warningYellow,
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Info: data tidak tersimpan
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.warningOrange.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.warningOrange.withValues(alpha: 0.25),
                ),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline_rounded,
                      color: AppColors.warningOrange, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Data ini hanya untuk uji coba. Hasil deteksi tidak tersimpan ke sistem dan tidak menghasilkan poin.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.warningOrange,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // CTA Gabung Komunitas
            _GabungKomunitasCta(),

            const SizedBox(height: 16),

            // Tombol coba lagi
            Center(
              child: TextButton.icon(
                onPressed: _reset,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Coba Lagi dengan Foto Baru'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Banner Mode Trial ────────────────────────────────────────────────────────
class _TrialModeBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 16),
      color: AppColors.primaryGreen.withValues(alpha: 0.09),
      child: const Row(
        children: [
          Icon(Icons.science_rounded, color: AppColors.primaryGreen, size: 16),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Mode Uji Coba — Hasil deteksi tidak tersimpan ke sistem',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.primaryGreen,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Stat Chip ─────────────────────────────────────────────────────────────────
class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.18)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── CTA Gabung Komunitas ─────────────────────────────────────────────────────
class _GabungKomunitasCta extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF16A34A), Color(0xFF15803D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryGreen.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text('🌿', style: TextStyle(fontSize: 22)),
              SizedBox(width: 8),
              Text(
                'Bergabung ke Komunitas',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Aktifkan Tempat Sampah pintarmu agar setiap kontribusimu dihitung, poinmu terkumpul, dan lingkunganmu semakin bersih!',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.ukurKapasitas,
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.primaryGreen,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Text(
                'Gabung Sekarang →',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
