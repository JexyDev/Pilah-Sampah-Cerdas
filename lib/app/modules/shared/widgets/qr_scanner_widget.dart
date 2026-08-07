import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/utils/platform_utils.dart';

/// Widget QR Scanner terpusat — scan QR tempat sampah & aktivasi bin.
///
/// - Android/iOS: MobileScanner dengan permission request runtime
/// - Web/Desktop: Input manual fallback
class QrScannerWidget extends StatefulWidget {
  const QrScannerWidget({
    super.key,
    required this.onQrDetected,
    this.hint,
    this.overlayColor,
    this.isFullScreen = false,
  });

  final Future<bool> Function(String qrCode) onQrDetected;
  final String? hint;
  final Color? overlayColor;
  final bool isFullScreen;

  @override
  State<QrScannerWidget> createState() => QrScannerWidgetState();
}

class QrScannerWidgetState extends State<QrScannerWidget>
    with WidgetsBindingObserver {
  MobileScannerController? _controller;
  bool _scanned = false;
  _QrState _state = _QrState.loading;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (PlatformUtils.supportsNativeQrScanner) {
      _requestPermissionAndStart();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_controller == null) return;
    if (state == AppLifecycleState.paused) {
      _controller?.stop();
    } else if (state == AppLifecycleState.resumed && !_scanned) {
      _controller?.start();
    }
  }

  Future<void> _requestPermissionAndStart() async {
    if (kIsWeb) return;

    // Request permission kamera runtime
    final PermissionStatus status = await Permission.camera.request();

    if (!mounted) return;

    if (status.isGranted) {
      _startScanner();
    } else if (status.isPermanentlyDenied) {
      setState(() => _state = _QrState.permDenied);
    } else {
      setState(() => _state = _QrState.denied);
    }
  }

  void _startScanner() {
    _controller?.dispose();
    _controller = MobileScannerController(
      facing: CameraFacing.back,
      autoStart: true,
      detectionSpeed: DetectionSpeed.noDuplicates,
    );
    if (mounted) setState(() => _state = _QrState.ready);
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_scanned) return;
    final String? code = capture.barcodes.firstOrNull?.rawValue;
    if (code != null && code.isNotEmpty) {
      setState(() => _scanned = true);
      
      // Feedback instan saat barcode terbaca
      HapticFeedback.vibrate();
      
      if (!mounted) return;
      
      // Panggil callback
      await widget.onQrDetected(code);
      
      // Reset state agar siap menscan ulang jika parent belum berpindah/unmount
      if (mounted) {
        setState(() => _scanned = false);
      }
    }
  }
  
  // Method to reset scanner externally
  void resetScanner() {
    if (!mounted) return;
    setState(() {
      _scanned = false;
      _state = _QrState.ready;
    });
    // Controller will automatically resume when MobileScanner is rebuilt
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!PlatformUtils.supportsNativeQrScanner) {
      return _buildManualInput();
    }

    switch (_state) {
      case _QrState.loading:
        return _buildLoading();
      case _QrState.denied:
        return _buildDenied(permanent: false);
      case _QrState.permDenied:
        return _buildDenied(permanent: true);
      case _QrState.ready:
        return _buildScanner();
    }
  }

  // ─── Scanner aktif ────────────────────────────────────────────────────────

  Widget _buildScanner() {
    final Color frameColor = widget.overlayColor ?? AppColors.primaryGreen;

    if (widget.isFullScreen) {
      return Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: _controller!,
            onDetect: _onDetect,
            errorBuilder: (ctx, error, child) {
              return Container(
                color: Colors.black,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: AppColors.dangerRed,
                        size: 36,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Error: ${error.errorDetails?.message ?? 'Kamera gagal'}',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _state = _QrState.loading;
                            _scanned = false;
                          });
                          _requestPermissionAndStart();
                        },
                        child: const Text(
                          'Coba Lagi',
                          style: TextStyle(
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          // Overlay frame full screen
          CustomPaint(
            painter: _ScanOverlayPainter(color: frameColor, isFullScreen: true),
            child: const SizedBox.expand(),
          ),
          // Flash button
          Positioned(
            top: 24,
            right: 20,
            child: SafeArea(
              child: _FlashButton(controller: _controller!),
            ),
          ),
          // Floating Label (positioned neatly below scan box with generous spacing above bottom card)
          Positioned(
            bottom: 265,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white24),
                ),
                child: const Text(
                  'Posisikan QR Code di dalam kotak',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
          if (_scanned)
            Container(
              color: Colors.black87,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.primaryGreen,
                      size: 56,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'QR Terdeteksi!',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: AspectRatio(
            aspectRatio: 1.0,
            child: Stack(
              children: [
                // MobileScanner selalu ada di widget tree agar stream tidak putus
                MobileScanner(
                  controller: _controller!,
                  onDetect: _onDetect,
                  errorBuilder: (ctx, error, child) {
                    return Container(
                      color: Colors.black,
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.error_outline_rounded,
                              color: AppColors.dangerRed,
                              size: 36,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Error: ${error.errorDetails?.message ?? 'Kamera gagal'}',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _state = _QrState.loading;
                                  _scanned = false;
                                });
                                _requestPermissionAndStart();
                              },
                              child: const Text(
                                'Coba Lagi',
                                style: TextStyle(
                                  color: AppColors.primaryGreen,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                // Overlay frame
                CustomPaint(
                  painter: _ScanOverlayPainter(color: frameColor),
                  child: const SizedBox.expand(),
                ),
                // Flash button
                Positioned(
                  top: 12,
                  right: 12,
                  child: _FlashButton(controller: _controller!),
                ),
                // Label
                const Positioned(
                  bottom: 14,
                  left: 0,
                  right: 0,
                  child: Text(
                    'Posisikan QR Code di dalam kotak',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      shadows: [Shadow(color: Colors.black54, blurRadius: 4)],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                // Konfirmasi QR terdeteksi ditaruh di paling atas
                if (_scanned)
                  Container(
                    color: Colors.black87,
                    child: const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.primaryGreen,
                            size: 56,
                          ),
                          SizedBox(height: 8),
                          Text(
                            'QR Terdeteksi!',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
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
      ],
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  Widget _buildLoading() {
    return const SizedBox(
      height: 200,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
              strokeWidth: 2.5,
            ),
            SizedBox(height: 12),
            Text(
              'Mempersiapkan kamera...',
              style: TextStyle(color: Colors.white60, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Permission denied ────────────────────────────────────────────────────

  Widget _buildDenied({required bool permanent}) {
    return SizedBox(
      height: 220,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.camera_alt_outlined,
                color: Colors.white38,
                size: 44,
              ),
              const SizedBox(height: 12),
              Text(
                permanent
                    ? 'Izin kamera ditolak permanen.\nBuka Pengaturan untuk mengaktifkan.'
                    : 'Izin kamera diperlukan\nuntuk scan QR Code.',
                style: const TextStyle(color: Colors.white70, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              permanent
                  ? TextButton.icon(
                      onPressed: openAppSettings,
                      icon: const Icon(
                        Icons.settings_rounded,
                        color: AppColors.primaryGreen,
                      ),
                      label: const Text(
                        'Buka Pengaturan',
                        style: TextStyle(color: AppColors.primaryGreen),
                      ),
                    )
                  : TextButton.icon(
                      onPressed: () {
                        setState(() => _state = _QrState.loading);
                        _requestPermissionAndStart();
                      },
                      icon: const Icon(
                        Icons.refresh_rounded,
                        color: AppColors.primaryGreen,
                      ),
                      label: const Text(
                        'Coba Lagi',
                        style: TextStyle(color: AppColors.primaryGreen),
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Input manual (Desktop/Web) ───────────────────────────────────────────

  Widget _buildManualInput() {
    final textCtrl = TextEditingController();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: double.infinity,
          height: 180,
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            border: Border.all(
              color: widget.overlayColor ?? AppColors.primaryGreen,
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.qr_code_rounded,
                  color: Colors.white.withValues(alpha: 0.2),
                  size: 56,
                ),
                const SizedBox(height: 8),
                Text(
                  '${PlatformUtils.platformName}: Input manual',
                  style: const TextStyle(color: Colors.white38, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: textCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: widget.hint ?? 'Masukkan kode QR',
                    hintStyle: const TextStyle(color: Colors.white38),
                    fillColor: Colors.black.withValues(alpha: 0.4),
                    filled: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  textCapitalization: TextCapitalization.characters,
                  onSubmitted: (v) async {
                    if (v.trim().isNotEmpty) {
                      final success = await widget.onQrDetected(v.trim());
                      if (success) textCtrl.clear();
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () async {
                  final v = textCtrl.text.trim();
                  if (v.isNotEmpty) {
                    final success = await widget.onQrDetected(v);
                    if (success) textCtrl.clear();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  minimumSize: const Size(52, 48),
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Icon(
                  Icons.send_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Enum ─────────────────────────────────────────────────────────────────────

enum _QrState { loading, ready, denied, permDenied }

// ─── Flash Button ─────────────────────────────────────────────────────────────

class _FlashButton extends StatefulWidget {
  const _FlashButton({required this.controller});
  final MobileScannerController controller;

  @override
  State<_FlashButton> createState() => _FlashButtonState();
}

class _FlashButtonState extends State<_FlashButton> {
  bool _on = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await widget.controller.toggleTorch();
        if (mounted) setState(() => _on = !_on);
      },
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: _on
              ? AppColors.warningYellow.withValues(alpha: 0.85)
              : Colors.black54,
          shape: BoxShape.circle,
        ),
        child: Icon(
          _on ? Icons.flashlight_on_rounded : Icons.flashlight_off_rounded,
          color: Colors.white,
          size: 20,
        ),
      ),
    );
  }
}

// ─── Scan Overlay Painter ─────────────────────────────────────────────────────

class _ScanOverlayPainter extends CustomPainter {
  _ScanOverlayPainter({required this.color, this.isFullScreen = false});
  final Color color;
  final bool isFullScreen;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    const cLen = 32.0;
    const sw = 3.5;

    Rect scanRect;
    if (isFullScreen) {
      final double boxSize = (w - 80).clamp(240.0, 300.0);
      final double left = (w - boxSize) / 2;
      final double top = (h - boxSize) / 2 - 70; // Shifted up to give generous breathing room above label & bottom card
      scanRect = Rect.fromLTWH(left, top, boxSize, boxSize);
    } else {
      const m = 48.0;
      scanRect = Rect.fromLTWH(m, m, w - m * 2, h - m * 2);
    }

    // Overlay gelap dengan hole transparan di tengah
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, w, h))
      ..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(12)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, Paint()..color = Colors.black.withValues(alpha: 0.55));

    // Border scan area
    canvas.drawRRect(
      RRect.fromRectAndRadius(scanRect, const Radius.circular(12)),
      Paint()
        ..color = color.withValues(alpha: 0.6)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke,
    );

    // Corner aksen
    final cp = Paint()
      ..color = color
      ..strokeWidth = sw
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final left = scanRect.left;
    final top = scanRect.top;
    final right = scanRect.right;
    final bottom = scanRect.bottom;

    final corners = [
      [left, top + cLen, left, top, left + cLen, top],
      [right - cLen, top, right, top, right, top + cLen],
      [left, bottom - cLen, left, bottom, left + cLen, bottom],
      [right - cLen, bottom, right, bottom, right, bottom - cLen],
    ];

    for (final c in corners) {
      canvas.drawPath(
        Path()
          ..moveTo(c[0], c[1])
          ..lineTo(c[2], c[3])
          ..lineTo(c[4], c[5]),
        cp,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ScanOverlayPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.isFullScreen != isFullScreen;
}

