import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_colors.dart';

/// Kamera inline di dalam app — foto tanpa keluar ke kamera sistem.
///
/// - Android/iOS: Live preview CameraPreview + tombol capture
/// - Web/Desktop: File picker fallback (image_picker)
class InlineCameraWidget extends StatefulWidget {
  const InlineCameraWidget({super.key, required this.onImageCaptured});

  final void Function(String path, double sizeKB) onImageCaptured;

  @override
  State<InlineCameraWidget> createState() => _InlineCameraWidgetState();
}

class _InlineCameraWidgetState extends State<InlineCameraWidget>
    with WidgetsBindingObserver {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];
  bool _isInitialized = false;
  bool _isCapturing = false;
  bool _isFrontCamera = false;
  String? _errorMessage;
  String? _capturedPath;
  double _capturedSizeKB = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (!kIsWeb) _initCamera();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_controller == null || !_controller!.value.isInitialized) return;
    if (state == AppLifecycleState.inactive) {
      _controller?.dispose();
      _controller = null;
      if (mounted) setState(() => _isInitialized = false);
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  Future<void> _initCamera({bool front = false}) async {
    // Dispose controller lama dulu
    await _controller?.dispose();
    _controller = null;
    if (mounted) setState(() => _isInitialized = false);

    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        if (mounted) {
          setState(() => _errorMessage = 'Tidak ada kamera tersedia.');
        }
        return;
      }

      final CameraDescription cam = front
          ? _cameras.firstWhere(
              (c) => c.lensDirection == CameraLensDirection.front,
              orElse: () => _cameras.first,
            )
          : _cameras.firstWhere(
              (c) => c.lensDirection == CameraLensDirection.back,
              orElse: () => _cameras.first,
            );

      final ctrl = CameraController(
        cam,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await ctrl.initialize();

      if (mounted) {
        setState(() {
          _controller = ctrl;
          _isInitialized = true;
          _isFrontCamera = front;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => _errorMessage =
              'Kamera tidak dapat dibuka.\nPastikan izin kamera sudah diberikan.',
        );
      }
    }
  }

  Future<void> _capture() async {
    if (_controller == null ||
        !_controller!.value.isInitialized ||
        _isCapturing) {
      return;
    }

    setState(() => _isCapturing = true);
    try {
      final XFile photo = await _controller!.takePicture();
      final double sizeKB = (await File(photo.path).length()) / 1024;

      if (mounted) {
        setState(() {
          _capturedPath = photo.path;
          _capturedSizeKB = sizeKB;
          _isCapturing = false;
        });
        widget.onImageCaptured(photo.path, sizeKB);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isCapturing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengambil foto: $e'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    }
  }

  Future<void> _switchCamera() async {
    await _initCamera(front: !_isFrontCamera);
  }

  Future<void> _pickGallery() async {
    try {
      final XFile? file = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
      );
      if (file != null && mounted) {
        final double sizeKB = kIsWeb
            ? (await file.readAsBytes()).length / 1024
            : (await File(file.path).length()) / 1024;

        setState(() {
          _capturedPath = file.path;
          _capturedSizeKB = sizeKB;
        });
        widget.onImageCaptured(file.path, sizeKB);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal membuka galeri: $e'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    }
  }

  void _retake() {
    setState(() {
      _capturedPath = null;
      _capturedSizeKB = 0;
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) return _buildWebFallback();
    if (_capturedPath != null) return _buildPreview();
    if (_errorMessage != null) return _buildError();
    if (!_isInitialized) return _buildLoading();
    return _buildLiveCamera();
  }

  // ─── Live kamera ──────────────────────────────────────────────────────────

  Widget _buildLiveCamera() {
    return Column(
      children: [
        // Preview kamera mengisi semua ruang yang tersedia
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SizedBox(
                width: constraints.maxWidth,
                height: constraints.maxHeight,
                child: CameraPreview(_controller!),
              );
            },
          ),
        ),

        // Kontrol bawah — compact
        Container(
          color: Colors.black,
          padding: const EdgeInsets.fromLTRB(32, 14, 32, 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // Galeri
              _ControlButton(
                icon: Icons.photo_library_outlined,
                onTap: _pickGallery,
              ),

              // Tombol capture
              GestureDetector(
                onTap: _isCapturing ? null : _capture,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 120),
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3.5),
                    color: _isCapturing
                        ? Colors.white.withValues(alpha: 0.5)
                        : Colors.white,
                  ),
                  child: _isCapturing
                      ? const Padding(
                          padding: EdgeInsets.all(20),
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.primaryBlue,
                            ),
                          ),
                        )
                      : Container(
                          margin: const EdgeInsets.all(7),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primaryBlue,
                          ),
                        ),
                ),
              ),

              // Flip kamera
              _ControlButton(
                icon: Icons.flip_camera_android_rounded,
                onTap: _switchCamera,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ─── Preview setelah foto ─────────────────────────────────────────────────

  Widget _buildPreview() {
    return Column(
      children: [
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.file(File(_capturedPath!), fit: BoxFit.cover),
              Positioned(
                bottom: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '✅ ${_capturedSizeKB.toStringAsFixed(0)} KB'
                    '${_capturedSizeKB < 1024 ? ' (< 1MB ✓)' : ' ⚠️ > 1MB'}',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          color: Colors.black,
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 20),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _retake,
              icon: const Icon(
                Icons.refresh_rounded,
                color: Colors.white,
                size: 18,
              ),
              label: const Text(
                'Foto Ulang',
                style: TextStyle(color: Colors.white),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.white38),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
            strokeWidth: 2.5,
          ),
          SizedBox(height: 14),
          Text(
            'Membuka kamera...',
            style: TextStyle(color: Colors.white60, fontSize: 13),
          ),
        ],
      ),
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.camera_alt_outlined,
              color: Colors.white38,
              size: 48,
            ),
            const SizedBox(height: 12),
            Text(
              _errorMessage ?? 'Kamera tidak tersedia.',
              style: const TextStyle(color: Colors.white70, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _errorMessage = null;
                  _isInitialized = false;
                });
                _initCamera();
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
            TextButton.icon(
              onPressed: _pickGallery,
              icon: const Icon(
                Icons.photo_library_outlined,
                color: Colors.white54,
                size: 18,
              ),
              label: const Text(
                'Pilih dari Galeri',
                style: TextStyle(color: Colors.white54, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Web Fallback ─────────────────────────────────────────────────────────

  Widget _buildWebFallback() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.upload_file_rounded,
            color: Colors.white38,
            size: 52,
          ),
          const SizedBox(height: 12),
          const Text(
            'Upload foto sampah',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Pilih foto dari perangkat Anda',
            style: TextStyle(color: Colors.white38, fontSize: 12),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _pickGallery,
            icon: const Icon(Icons.photo_library_outlined, size: 18),
            label: const Text('Pilih Foto'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlue,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Helper Widget ────────────────────────────────────────────────────────────

class _ControlButton extends StatelessWidget {
  const _ControlButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.white, size: 24),
      ),
    );
  }
}
