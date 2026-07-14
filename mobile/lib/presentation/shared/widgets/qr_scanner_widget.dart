import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/platform_utils.dart';

/// Widget QR Scanner terpusat — scan QR tong & aktivasi bin.
///
/// - Android/iOS: MobileScanner dengan permission request runtime
/// - Web/Desktop: Input manual fallback
class QrScannerWidget extends StatefulWidget {
  const QrScannerWidget({
    super.key,
    required this.onQrDetected,
    this.hint,
    this.overlayColor,
  });

  final void Function(String qrCode) onQrDetected;
  final String? hint;
  final Color? overlayColor;

  @override
  State<QrScannerWidget> createState() => _QrScannerWidgetState();
}

class _QrScannerWidgetState extends State<QrScannerWidget>
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
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      autoStart: true,
    );
    if (mounted) setState(() => _state = _QrState.ready);
  }

  void _onDetect(BarcodeCapture capture) {
    if (_scanned) return;
    final String? code = capture.barcodes.firstOrNull?.rawValue;
    if (code != null && code.isNotEmpty) {
      setState(() => _scanned = true);
      _controller?.stop();
      widget.onQrDetected(code);
    }
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

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            width: double.infinity,
            height: 300,
            child: Stack(
              children: [
                if (_scanned)
                  // Konfirmasi QR terdeteksi
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
                  )
                else ...[
                  // MobileScanner
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
                ],
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
                  onSubmitted: (v) {
                    if (v.trim().isNotEmpty) widget.onQrDetected(v.trim());
                  },
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  final v = textCtrl.text.trim();
                  if (v.isNotEmpty) widget.onQrDetected(v);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlue,
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
  _ScanOverlayPainter({required this.color});
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    const m = 48.0;
    const cLen = 32.0;
    const sw = 3.5;

    // Overlay gelap dengan hole transparan di tengah
    final scanRect = Rect.fromLTWH(m, m, w - m * 2, h - m * 2);
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, w, h))
      ..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(8)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, Paint()..color = Colors.black.withValues(alpha: 0.5));

    // Border scan area
    canvas.drawRRect(
      RRect.fromRectAndRadius(scanRect, const Radius.circular(8)),
      Paint()
        ..color = color.withValues(alpha: 0.5)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke,
    );

    // Corner aksen
    final cp = Paint()
      ..color = color
      ..strokeWidth = sw
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final corners = [
      [m, m + cLen, m, m, m + cLen, m],
      [w - m - cLen, m, w - m, m, w - m, m + cLen],
      [m, h - m - cLen, m, h - m, m + cLen, h - m],
      [w - m - cLen, h - m, w - m, h - m, w - m, h - m - cLen],
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
  bool shouldRepaint(covariant CustomPainter _) => false;
}
