import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import '../values/app_colors.dart';

/// Halaman pemotongan (crop) foto profil interaktif profesional.
/// Mendukung pinch-to-zoom, geser (pan), putar 90°, dan mask lingkaran 1:1.
class ProfilePhotoCropperView extends StatefulWidget {
  const ProfilePhotoCropperView({
    super.key,
    required this.imageFile,
  });

  final File imageFile;

  /// Helper statis untuk memanggil cropper dan mendapatkan berkas File hasil potongan
  static Future<File?> crop(
    BuildContext context, {
    required File imageFile,
  }) {
    return Navigator.of(context).push<File>(
      MaterialPageRoute(
        builder: (_) => ProfilePhotoCropperView(imageFile: imageFile),
        fullscreenDialog: true,
      ),
    );
  }

  @override
  State<ProfilePhotoCropperView> createState() => _ProfilePhotoCropperViewState();
}

class _ProfilePhotoCropperViewState extends State<ProfilePhotoCropperView> {
  final GlobalKey _cropKey = GlobalKey();
  final TransformationController _transformController = TransformationController();
  int _quarterTurns = 0;
  bool _isProcessing = false;
  double? _imageWidth;
  double? _imageHeight;
  bool _isImageLoaded = true;

  ImageStreamListener? _streamListener;
  ImageStream? _imageStream;

  @override
  void initState() {
    super.initState();
    _loadImageSize();
  }

  void _loadImageSize() {
    try {
      _imageStream = FileImage(widget.imageFile).resolve(ImageConfiguration.empty);
      _streamListener = ImageStreamListener(
        (ImageInfo info, bool _) {
          if (!mounted) return;
          final double w = info.image.width.toDouble();
          final double h = info.image.height.toDouble();
          setState(() {
            _imageWidth = w > 0 ? w : null;
            _imageHeight = h > 0 ? h : null;
            _isImageLoaded = true;
          });
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              final screenSize = MediaQuery.of(context).size;
              final double cropSize = (screenSize.width - 48).clamp(240.0, 360.0);
              _resetMatrix(cropSize);
            }
          });
        },
        onError: (dynamic _, StackTrace? __) {
          if (mounted) {
            setState(() => _isImageLoaded = true);
          }
        },
      );
      _imageStream!.addListener(_streamListener!);
    } catch (_) {
      if (mounted) {
        setState(() => _isImageLoaded = true);
      }
    }
  }

  void _resetMatrix(double cropSize) {
    if (_imageWidth == null || _imageHeight == null) {
      _transformController.value = Matrix4.identity();
      return;
    }
    final bool isRotated = _quarterTurns % 2 != 0;
    final double effW = isRotated ? _imageHeight! : _imageWidth!;
    final double effH = isRotated ? _imageWidth! : _imageHeight!;
    final double coverScale = math.max(cropSize / effW, cropSize / effH);

    final double renderedW = effW * coverScale;
    final double renderedH = effH * coverScale;

    final double initialDx = (cropSize - renderedW) / 2;
    final double initialDy = (cropSize - renderedH) / 2;

    _transformController.value = Matrix4.identity()..setTranslationRaw(initialDx, initialDy, 0.0);
  }

  void _rotate(double cropSize) {
    setState(() {
      _quarterTurns = (_quarterTurns + 1) % 4;
    });
    _resetMatrix(cropSize);
  }

  void _reset(double cropSize) {
    setState(() {
      _quarterTurns = 0;
    });
    _resetMatrix(cropSize);
  }

  Future<void> _saveAndReturnCropped() async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      await WidgetsBinding.instance.endOfFrame;
      final boundary = _cropKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) {
        throw Exception('Gagal membaca area gambar.');
      }

      // Render gambar beresolusi tajam (pixelRatio: 2.0)
      final ui.Image image = await boundary.toImage(pixelRatio: 2.0);
      final ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) {
        throw Exception('Gagal mengekstraksi byte gambar.');
      }

      final pngBytes = byteData.buffer.asUint8List();
      final tempDir = await getTemporaryDirectory();
      final String filePath = '${tempDir.path}/avatar_crop_${DateTime.now().millisecondsSinceEpoch}.png';
      final File croppedFile = File(filePath);
      await croppedFile.writeAsBytes(pngBytes, flush: true);

      if (mounted) {
        Navigator.of(context).pop(croppedFile);
      }
    } catch (_) {
      if (mounted) {
        // Fallback aman: kembalikan berkas foto asli agar proses upload tidak pernah terblokir
        Navigator.of(context).pop(widget.imageFile);
      }
    }
  }

  @override
  void dispose() {
    if (_streamListener != null && _imageStream != null) {
      _imageStream!.removeListener(_streamListener!);
    }
    _transformController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    // Ukuran crop square 1:1, dibatasi agar muat nyaman di layar
    final double cropSize = (screenSize.width - 48).clamp(240.0, 360.0);

    final double imgW = _imageWidth ?? cropSize;
    final double imgH = _imageHeight ?? cropSize;
    final bool isRotated = _quarterTurns % 2 != 0;
    final double effW = isRotated ? imgH : imgW;
    final double effH = isRotated ? imgW : imgH;
    final double coverScale = math.max(cropSize / effW, cropSize / effH);
    final double displayW = imgW * coverScale;
    final double displayH = imgH * coverScale;

    return Scaffold(
      backgroundColor: const Color(0xFF0B132B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B132B),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white, size: 24),
          onPressed: () => Navigator.of(context).pop(),
          tooltip: 'Batal',
        ),
        title: const Text(
          'Sesuaikan Foto Profil',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12.0, top: 8.0, bottom: 8.0),
            child: ElevatedButton.icon(
              onPressed: _isProcessing ? null : _saveAndReturnCropped,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              icon: _isProcessing
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.check_rounded, size: 16),
              label: const Text(
                'Upload',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(),

            // ── Area Crop Interaktif ─────────────────────────────────────
            Center(
              child: SizedBox(
                width: cropSize,
                height: cropSize,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Canvas RepaintBoundary yang ditangkap saat menyimpan
                    RepaintBoundary(
                      key: _cropKey,
                      child: Container(
                        width: cropSize,
                        height: cropSize,
                        decoration: const BoxDecoration(color: Colors.black),
                        clipBehavior: Clip.hardEdge,
                        child: !_isImageLoaded
                            ? const Center(
                                child: CircularProgressIndicator(
                                  color: AppColors.primaryGreen,
                                ),
                              )
                            : InteractiveViewer(
                                transformationController: _transformController,
                                minScale: 0.5,
                                maxScale: 5.0,
                                constrained: false,
                                boundaryMargin: EdgeInsets.all(cropSize * 0.8),
                                clipBehavior: Clip.hardEdge,
                                child: SizedBox(
                                  width: isRotated ? displayH : displayW,
                                  height: isRotated ? displayW : displayH,
                                  child: RotatedBox(
                                    quarterTurns: _quarterTurns,
                                    child: Image.file(
                                      widget.imageFile,
                                      width: displayW,
                                      height: displayH,
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) {
                                        return const Center(
                                          child: Icon(Icons.broken_image_rounded,
                                              color: Colors.white54, size: 48),
                                        );
                                      },
                                    ),
                                  ),
                                ),
                              ),
                      ),
                    ),

                    // Masking overlay lingkaran transparan (bersih tanpa grid kisi)
                    IgnorePointer(
                      child: CustomPaint(
                        size: Size(cropSize, cropSize),
                        painter: const _CircleHolePainter(
                          borderColor: Colors.white,
                          borderWidth: 2.0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const Spacer(),

            // ── Petunjuk & Kontrol Pemotongan ────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.4),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.pinch_rounded,
                        color: Colors.white.withValues(alpha: 0.7),
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Geser dan cubit foto untuk mengatur posisi wajah',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Tombol Putar 90°
                      InkWell(
                        onTap: () => _rotate(cropSize),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.rotate_90_degrees_ccw_rounded, color: Colors.white, size: 18),
                              SizedBox(width: 8),
                              Text(
                                'Putar 90°',
                                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Tombol Reset
                      InkWell(
                        onTap: () => _reset(cropSize),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.restart_alt_rounded, color: Colors.white, size: 18),
                              SizedBox(width: 8),
                              Text(
                                'Reset',
                                style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── Tombol Utama: Upload & Simpan Foto ──────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _isProcessing ? null : _saveAndReturnCropped,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: _isProcessing
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.cloud_upload_rounded, size: 22),
                      label: Text(
                        _isProcessing ? 'Memproses Foto...' : 'Upload & Simpan Foto',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Painter untuk membuat lubang lingkaran di dalam kotak dengan overlay gelap bersih tanpa grid
class _CircleHolePainter extends CustomPainter {
  const _CircleHolePainter({
    required this.borderColor,
    required this.borderWidth,
  });

  final Color borderColor;
  final double borderWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Luar: persegi gelap, Dalam: lingkaran transparan bersih
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addOval(Rect.fromCircle(center: center, radius: radius))
      ..fillType = PathFillType.evenOdd;

    final darkPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.65)
      ..style = PaintingStyle.fill;

    canvas.drawPath(path, darkPaint);

    // Garis lingkaran putih pembatas yang bersih
    final borderPaint = Paint()
      ..color = borderColor.withValues(alpha: 0.9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    canvas.drawCircle(center, radius - (borderWidth / 2), borderPaint);
  }

  @override
  bool shouldRepaint(covariant _CircleHolePainter oldDelegate) => false;
}
