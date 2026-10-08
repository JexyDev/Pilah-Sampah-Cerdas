import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/values/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../../shared/widgets/qr_scanner_widget.dart';

class VerifikasiKomunalView extends StatefulWidget {
  final String binId;
  final String binCode;
  final String category;
  final String wargaName;

  const VerifikasiKomunalView({
    super.key,
    required this.binId,
    required this.binCode,
    required this.category,
    required this.wargaName,
  });

  @override
  State<VerifikasiKomunalView> createState() => _VerifikasiKomunalViewState();
}

class _VerifikasiKomunalViewState extends State<VerifikasiKomunalView> {
  final GlobalKey<QrScannerWidgetState> _scannerKey = GlobalKey<QrScannerWidgetState>();
  bool _isProcessing = false;

  Future<bool> _handleQrDetected(String code) async {
    if (_isProcessing) return false;

    final rawScanned = code.trim();
    if (rawScanned.isEmpty) return false;

    String cleanScanned = rawScanned.toLowerCase();
    if (cleanScanned.startsWith('http://') || cleanScanned.startsWith('https://')) {
      try {
        final uri = Uri.parse(cleanScanned);
        final q = uri.queryParameters['qr'] ??
            uri.queryParameters['code'] ??
            uri.queryParameters['bin'] ??
            uri.queryParameters['data'];
        if (q != null && q.isNotEmpty) {
          cleanScanned = q.toLowerCase();
        } else if (uri.pathSegments.isNotEmpty) {
          cleanScanned = uri.pathSegments.last.toLowerCase();
        }
      } catch (_) {}
    }

    final cleanTargetCode = widget.binCode.toLowerCase();
    final cleanTargetId = widget.binId.toLowerCase();

    bool isMatch = false;

    // Strict matching
    if (cleanScanned == cleanTargetCode || cleanScanned == cleanTargetId) {
      isMatch = true;
    } else {
      // Relaxed matching inside URL or JSON
      try {
        if (cleanScanned.contains(cleanTargetCode) || cleanScanned.contains(cleanTargetId)) {
          isMatch = true;
        }
      } catch (_) {}
    }

    if (isMatch) {
      setState(() => _isProcessing = true);
      HapticFeedback.heavyImpact();
      
      // Berhasil cocok, arahkan ke timbangan
      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          AppRoutes.timbanganPemilahan,
          arguments: {
            'binId': widget.binId,
            'binCode': widget.binCode,
            'category': widget.category,
            'wargaName': widget.wargaName,
          },
        );
      }
      return true;
    }

    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Scan QR Komunal'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: QrScannerWidget(
              key: _scannerKey,
              onQrDetected: _handleQrDetected,
              hint: 'Arahkan kamera ke stiker QR ${widget.binCode}',
              isFullScreen: true,
              overlayColor: AppColors.primaryGreen,
            ),
          ),
          Container(
            color: Colors.black,
            padding: const EdgeInsets.all(16),
            child: const Text(
              'Untuk mengosongkan, Petugas diwajibkan untuk memindai QR fisik pada Tempat Sampah Komunal.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
