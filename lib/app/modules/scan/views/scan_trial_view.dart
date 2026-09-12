import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/ai_detection_entity.dart';
import '../../../data/models/bin_entity.dart';
import '../../../routes/app_routes.dart';
import '../../scan/controllers/scan_controller.dart';
import '../../shared/widgets/inline_camera_widget.dart';
import 'package:image_picker/image_picker.dart';
import '../../shared/controllers/connectivity_controller.dart';

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
  double _compressedKB = 0.0;
  bool _photoTaken = false;
  AiDetectionEntity? _aiResult;
  String? _errorMessage;

  Future<void> _onImageCaptured(String path, double sizeKB) async {
    setState(() {
      _capturedImagePath = path;
      _compressedKB = sizeKB;
      _photoTaken = true;
    });
  }

  Future<void> _startDetection() async {
    setState(() {
      _step = 1;
      _errorMessage = null;
    });

    try {
      await ref
          .read(scanFlowProvider.notifier)
          .detectWaste(imagePath: _capturedImagePath);

      final scanState = ref.read(scanFlowProvider);

      if (!mounted) return;

      if (scanState.errorCode != null) {
        setState(() {
          _errorMessage = scanState.errorMessage ?? 'Deteksi gagal. Coba lagi.';
          _step = 0;
          _photoTaken = false;
        });
        return;
      }

      setState(() {
        _aiResult = scanState.aiResult;
        _step = 2;
      });
    } catch (e, stack) {
      debugPrint('[ScanTrialView] Error deteksi AI: $e\n$stack');
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Gagal menghubungi server AI. Periksa koneksi Anda.';
        _step = 0;
        _photoTaken = false;
      });
    }
  }



  @override
  Widget build(BuildContext context) {
    // Watch provider agar state tidak otomatis di-dispose saat async gap
    ref.watch(scanFlowProvider);
    final isOnline = ref.watch(isOnlineProvider);

    return Scaffold(
      backgroundColor: _step == 0 || _step == 1
          ? const Color(0xFF1C1C1E) // Dark background for camera and loading
          : AppColors.backgroundCanvas,
      appBar: _step == 1
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.close_rounded, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              title: const Text(
                'Analisis AI',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              centerTitle: true,
            )
          : _step == 2
          ? AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(
                  Icons.arrow_back_rounded,
                  color: AppColors.textPrimary,
                ),
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
            )
          : null, // Step 0 camera uses its own top bar
      body: _step == 0
          ? _buildCameraStep(isOnline)
          : _step == 1
          ? _buildLoadingStep()
          : Column(
              children: [
                // Banner trial mode
                _TrialModeBanner(),
                Expanded(child: _buildResultStep()),
              ],
            ),
    );
  }

  // ─── Step 0: Kamera ──────────────────────────────────────────────────────────
  Widget _buildCameraStep(bool isOnline) {
    return Column(
      children: [
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                ),
                const Expanded(
                  child: Text(
                    'Foto Sampah (Uji Coba)',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(width: 48),
              ],
            ),
          ),
        ),
        if (_errorMessage != null)
          Container(
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
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
                const Icon(
                  Icons.error_outline_rounded,
                  color: AppColors.dangerRed,
                  size: 18,
                ),
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
          child: Stack(
            fit: StackFit.expand,
            children: [
              InlineCameraWidget(onImageCaptured: _onImageCaptured),
              if (!_photoTaken)
                IgnorePointer(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Overlay background transparan
                      ColorFiltered(
                        colorFilter: ColorFilter.mode(
                          Colors.black.withValues(alpha: 0.5),
                          BlendMode.srcOut,
                        ),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Container(
                              decoration: const BoxDecoration(
                                color: Colors.black,
                                backgroundBlendMode: BlendMode.dstOut,
                              ),
                            ),
                            Center(
                              child: Container(
                                width: 280,
                                height: 280,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Bingkai Border Putih solid
                      Center(
                        child: Container(
                          width: 280,
                          height: 280,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white, width: 2),
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                      // Teks Panduan Atas
                      Positioned(
                        top: 40,
                        left: 20,
                        right: 20,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Posisikan Objek Sampah di Dalam Bingkai\n(Jarak Optimal: 15 – 30 cm)',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      // Teks Tips Bawah
                      Positioned(
                        bottom:
                            120, // Dinaikkan agar tidak menutupi tombol kamera
                        left: 30,
                        right: 30,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.lightbulb_outline_rounded,
                                color: Colors.amber,
                                size: 16,
                              ),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Tips: Pastikan pencahayaan cukup & bebas jam tangan/alas keramik.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _photoTaken ? 'Foto Siap - Kirim ke AI' : 'Ambil Foto Sampah',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _photoTaken
                    ? 'Foto berhasil diambil (${_compressedKB.toStringAsFixed(0)} KB).\nTap "Deteksi Sampah" untuk analisis AI.'
                    : 'Ambil foto sampah langsung dari kamera dari jarak dekat (tidak boleh terlalu jauh)\natau pilih dari galeri.',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 18),
              if (!isOnline)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.dangerRed.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Koneksi internet diperlukan.',
                    style: TextStyle(color: AppColors.dangerRed, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                )
              else if (_photoTaken)
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _startDetection,
                    icon: const Icon(Icons.psychology_rounded, size: 20),
                    label: const Text(
                      'Deteksi Sampah',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        final picker = ImagePicker();
                        final file = await picker.pickImage(
                          source: ImageSource.gallery,
                          imageQuality: 85,
                        );
                        if (file != null) {
                          final size = (await file.length()) / 1024;
                          setState(() {
                            _capturedImagePath = file.path;
                            _compressedKB = size;
                            _photoTaken = true;
                          });
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).clearSnackBars();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Gagal membuka galeri: $e')),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.photo_library_rounded, size: 20),
                    label: const Text(
                      'Pilih dari Galeri',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primaryGreen,
                      side: const BorderSide(color: AppColors.primaryGreen),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  // ─── Step 1: Loading AI ───────────────────────────────────────────────────────
  Widget _buildLoadingStep() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Ikon Kamera AI
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: const Color(0xFF2C2C2E),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(
                    Icons.camera_alt_rounded,
                    size: 80,
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.psychology_rounded,
                      color: AppColors.primaryGreen,
                      size: 26,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Menganalisis Sampah...',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'AI sedang mendeteksi jenis dan berat\nsampah dari foto Anda.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: Colors.white54,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 48),
            // Progress Bar
            SizedBox(
              width: 220,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: const LinearProgressIndicator(
                  minHeight: 4,
                  backgroundColor: Colors.white12,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.primaryGreen,
                  ),
                ),
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
    final double orgPct =
        (result.organicPercentage as num?)?.toDouble() ??
        (isOrganic ? 1.0 : 0.0);
    final double anorgPct = (1.0 - orgPct).clamp(0.0, 1.0);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    color: AppColors.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.white,
                    size: 36,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Deteksi Berhasil!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Data sampah terdeteksi secara cerdas oleh\nsistem AI kami.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),

            // Container AI Results
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.backgroundCanvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: Rekomendasi Bin
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color:
                              (isOrganic
                                      ? AppColors.organicColor
                                      : AppColors.nonOrganicColor)
                                  .withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.delete_rounded,
                          color: isOrganic
                              ? AppColors.organicColor
                              : AppColors.nonOrganicColor,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'REKOMENDASI TEMPAT SAMPAH',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textHint,
                              ),
                            ),
                            Text(
                              'Tempat Sampah ${result.detectedType.displayName}',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isOrganic
                                    ? AppColors.organicColor
                                    : AppColors.nonOrganicColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1, color: AppColors.border),
                  const SizedBox(height: 16),

                  // Confidence & Estimasi Berat
                  Row(
                    children: [
                      Expanded(
                        child: _buildDetailItem(
                          icon: Icons.psychology_rounded,
                          label: 'KUALITAS AI',
                          value: '',
                          valueWidget: Row(
                            children: [
                              ...List.generate(5, (index) {
                                final double conf =
                                    (result.confidence as num?)?.toDouble() ??
                                    0.0;
                                final stars = (conf * 5).round().clamp(0, 5);
                                return Icon(
                                  Icons.star_rounded,
                                  size: 14,
                                  color: index < stars
                                      ? Colors.amber
                                      : Colors.grey.shade300,
                                );
                              }),
                              const SizedBox(width: 4),
                              Text(
                                '${(((result.confidence as num?)?.toDouble() ?? 0.0) * 100).toStringAsFixed(0)}%',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Expanded(
                        child: _buildDetailItem(
                          icon: Icons.scale_rounded,
                          label: 'EST. BERAT',
                          valueWidget: Text(
                            '${result.displayWeightKg.toStringAsFixed(2)} KG',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          value: '',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Progress Bar Organik vs Anorganik
                  const Text(
                    'KOMPOSISI SAMPAH',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textHint,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Organik: ${(orgPct * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.organicColor,
                        ),
                      ),
                      Text(
                        'Anorganik: ${(anorgPct * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.nonOrganicColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Info: data tidak tersimpan
            // Container(
            //   padding: const EdgeInsets.all(14),
            //   decoration: BoxDecoration(
            //     color: AppColors.warningOrange.withValues(alpha: 0.06),
            //     borderRadius: BorderRadius.circular(12),
            //     border: Border.all(
            //       color: AppColors.warningOrange.withValues(alpha: 0.25),
            //     ),
            //   ),
            //   child: const Row(
            //     crossAxisAlignment: CrossAxisAlignment.start,
            //     children: [
            //       Icon(Icons.info_outline_rounded,
            //           color: AppColors.warningOrange, size: 18),
            //       SizedBox(width: 10),
            //       Expanded(
            //         child: Text(
            //           'Data ini hanya untuk uji coba. Hasil deteksi tidak tersimpan ke sistem dan tidak menghasilkan poin.',
            //           style: TextStyle(
            //             fontSize: 12,
            //             color: AppColors.warningOrange,
            //             height: 1.4,
            //           ),
            //         ),
            //       ),
            //     ],
            //   ),
            // ),
            // const SizedBox(height: 16),

            // CTA Gabung Komunitas
            _GabungKomunitasCta(),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailItem({
    required IconData icon,
    required String label,
    required String value,
    Widget? valueWidget,
  }) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.textHint,
              ),
            ),
            valueWidget ??
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
          ],
        ),
      ],
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
            style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: Consumer(
              builder: (context, ref, _) {
                final bins = ref.watch(binsProvider).value ?? [];
                final hasOrganic = bins.any(
                  (b) => b.binType == WasteType.organic && b.isActive,
                );
                final hasNonOrganic = bins.any(
                  (b) => b.binType == WasteType.nonOrganic && b.isActive,
                );

                String ctaLabel = 'Gabung Sekarang →';
                if (hasOrganic && !hasNonOrganic) {
                  ctaLabel = 'Lengkapi Tempat Sampah Anorganik →';
                } else if (!hasOrganic && hasNonOrganic) {
                  ctaLabel = 'Lengkapi Tempat Sampah Organik →';
                }

                return ElevatedButton(
                  onPressed: () {
                    if (hasOrganic && !hasNonOrganic) {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.ukurKapasitas,
                        arguments: {'targetType': 'non_organic'},
                      );
                    } else if (!hasOrganic && hasNonOrganic) {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.ukurKapasitas,
                        arguments: {'targetType': 'organic'},
                      );
                    } else {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.ukurKapasitas,
                        arguments: {'targetType': 'both'},
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primaryGreen,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    ctaLabel,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
