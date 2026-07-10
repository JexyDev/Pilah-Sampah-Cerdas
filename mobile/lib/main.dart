import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';

void main() {
  runApp(const PilahSampahMobileApp());
}

class PilahSampahMobileApp extends StatelessWidget {
  const PilahSampahMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'pilahsampah.id Warga',
      theme: ThemeData.dark().copyWith(
        primaryColor: const Color(0xFF10B981),
        scaffoldBackgroundColor: const Color(0xFF0A0E17),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF3B82F6),
          error: Color(0xFFEF4444),
        ),
      ),
      home: const WasteSubmissionScreen(),
    );
  }
}

class WasteSubmissionScreen extends StatefulWidget {
  const WasteSubmissionScreen({super.key});

  @override
  State<WasteSubmissionScreen> createState() => _WasteSubmissionScreenState();
}

class _WasteSubmissionScreenState extends State<WasteSubmissionScreen> {
  // Application State
  int _currentStep = 0; // 0: Take Photo, 1: Compress & Detect, 2: Scan QR, 3: Completed
  bool _isLoading = false;
  String? _statusMessage;
  String _userId = "user-jeremy";
  String _householdId = "hh-01";
  
  // Simulated File Info
  int _originalImageSize = 3145728; // ~3.0 MB
  int _compressedImageSize = 3145728;
  bool _isCompressed = false;
  
  // AI Response Data
  String? _requestId;
  String? _detectedType;
  double? _estimatedVolume;
  
  // QR Scan Code Result
  String? _scannedQrCode;

  final String _backendUrl = "http://localhost:3000/api/v1";

  // Step 1: Simulate taking camera photo
  void _takePhoto() {
    setState(() {
      _isLoading = true;
      _statusMessage = "Membuka Kamera & Mengambil Foto...";
    });

    Timer(const Duration(milliseconds: 1200), () {
      setState(() {
        _isLoading = false;
        _originalImageSize = (Random().nextDouble() * 2000000 + 1500000).toInt(); // 1.5MB - 3.5MB
        _compressedImageSize = _originalImageSize;
        _isCompressed = false;
        _currentStep = 1;
        _statusMessage = "Foto berhasil diambil (${(_originalImageSize / (1024 * 1024)).toStringAsFixed(2)} MB).";
      });
    });
  }

  // Step 2: Image Compression & AI Verification
  Future<void> _compressAndDetect() async {
    setState(() {
      _isLoading = true;
      _statusMessage = "Mengompresi Gambar (Target < 1MB)...";
    });

    // Simulate flutter_image_compress
    await Future.delayed(const Duration(milliseconds: 800));
    
    setState(() {
      _isCompressed = true;
      // Guarantee compressed output is under 1MB (e.g., 650KB)
      _compressedImageSize = (Random().nextDouble() * 300000 + 500000).toInt(); 
      _statusMessage = "Kompresi Selesai! Ukuran Baru: ${(_compressedImageSize / 1024).toStringAsFixed(0)} KB (Sebelumnya: ${(_originalImageSize / (1024 * 1024)).toStringAsFixed(2)} MB)";
    });

    await Future.delayed(const Duration(milliseconds: 800));

    setState(() {
      _statusMessage = "Mengirim data gambar ke backend AI...";
    });

    // HTTP Call to express server detect-mock
    try {
      final uuid = const Uuid().v4();
      final response = await http.post(
        Uri.parse("$_backendUrl/waste/detect-mock"),
        headers: {
          "Content-Type": "application/json",
          "x-request-id": uuid
        },
        body: jsonEncode({"userId": _userId})
      ).timeout(const Duration(seconds: 3));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        setState(() {
          _requestId = data['requestId'];
          _detectedType = data['data']['detectedType'];
          _estimatedVolume = data['data']['volumeEstimate'];
          _currentStep = 2;
          _isLoading = false;
          _statusMessage = "Deteksi Sukses! Jenis: $_detectedType, Estimasi: $_estimatedVolume L. Silakan pindai QR Tong.";
        });
      } else if (response.statusCode == 422) {
        // IMAGE_UNREADABLE / BLURRY
        _showErrorDialog("Gambar Buram/Tidak Terbaca", 
          "AI gagal memproses gambar Anda karena terdeteksi buram (is_blurry = true) atau tidak teridentifikasi. Silakan foto ulang.\n\nKuota harian Anda tidak dikurangi.");
        _resetToStep0();
      } else if (response.statusCode == 429) {
        _showErrorDialog("Kuota Habis", data['message']);
        _resetToStep0();
      } else {
        _showErrorDialog("Kesalahan Server", "Gagal memproses gambar. Silakan coba kembali.");
        _resetToStep0();
      }
    } catch (e) {
      // Mock mode fallback if server is offline
      setState(() {
        _requestId = const Uuid().v4();
        _detectedType = Random().nextBool() ? "ORGANIC" : "NON_ORGANIC";
        _estimatedVolume = double.parse((Random().nextDouble() * 4.0 + 2.0).toStringAsFixed(1));
        _currentStep = 2;
        _isLoading = false;
        _statusMessage = "[MOCK MODE] Deteksi Offline: $_detectedType (${_estimatedVolume}L). Silakan scan QR.";
      });
    }
  }

  // Step 3: Scan QR Code & Commit Transaction
  Future<void> _scanQrAndCommit() async {
    setState(() {
      _isLoading = true;
      _statusMessage = "Memindai QR Code Tong Sampah...";
    });

    await Future.delayed(const Duration(milliseconds: 1000));
    final String simulatedQrCode = "QR-BIN-WARGA-${_detectedType == "ORGANIC" ? "ORGANIK" : "ANORGANIK"}";

    setState(() {
      _scannedQrCode = simulatedQrCode;
      _statusMessage = "QR Terbaca: $_scannedQrCode. Mengirim data transaksi...";
    });

    try {
      final response = await http.post(
        Uri.parse("$_backendUrl/bins/scan"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "qrCode": _scannedQrCode,
          "userId": _userId,
          "detectedType": _detectedType,
          "estimatedVolume": _estimatedVolume,
          "householdId": _householdId
        })
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        setState(() {
          _currentStep = 3;
          _isLoading = false;
          _statusMessage = "Transaksi Berhasil! Anda mendapatkan ${data['data']['pointsAwarded']} poin.";
        });
      } else {
        // Handle Bin Overflow or Invalid Bin Type
        _showErrorDialog("Transaksi Ditolak", data['message'] ?? "Terjadi kesalahan.");
        _resetToStep0();
      }
    } catch (e) {
      // Offline fallback mock success
      setState(() {
        _currentStep = 3;
        _isLoading = false;
        _statusMessage = "[MOCK MODE SUCCESS] Transaksi berhasil disimpan di database lokal.";
      });
    }
  }

  void _resetToStep0() {
    setState(() {
      _currentStep = 0;
      _isLoading = false;
      _isCompressed = false;
      _requestId = null;
      _detectedType = null;
      _estimatedVolume = null;
      _scannedQrCode = null;
    });
  }

  void _showErrorDialog(String title, String content) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: TextStyle(color: Theme.of(context).colorScheme.error, fontWeight: FontWeight.bold)),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("OK", style: TextStyle(color: Color(0xFF10B981))),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('pilahsampah.id - Setor Sampah', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF10B981),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _resetToStep0,
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status bar
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withOpacity(0.07)),
              ),
              child: Text(
                _statusMessage ?? "Silakan ambil foto sampah Anda untuk memulai.",
                style: const TextStyle(fontSize: 14, fontStyle: FontStyle.italic),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 20),

            // Progress Stepper
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStepIndicator(0, 'Kamera', Icons.camera_alt),
                _buildStepLine(),
                _buildStepIndicator(1, 'Kompres & AI', Icons.cloud_upload),
                _buildStepLine(),
                _buildStepIndicator(2, 'Scan QR', Icons.qr_code_scanner),
                _buildStepLine(),
                _buildStepIndicator(3, 'Selesai', Icons.check_circle),
              ],
            ),
            const SizedBox(height: 30),

            // Step Content Panels
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Center(
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Color(0xFF10B981))
                      : _buildStepContent(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepIndicator(int stepIndex, String title, IconData icon) {
    bool isActive = _currentStep >= stepIndex;
    return Column(
      children: [
        CircleAvatar(
          radius: 22,
          backgroundColor: isActive ? const Color(0xFF10B981) : Colors.white.withOpacity(0.08),
          child: Icon(icon, color: isActive ? Colors.black : Colors.white60, size: 20),
        ),
        const SizedBox(height: 6),
        Text(title, style: TextStyle(fontSize: 10, color: isActive ? const Color(0xFF10B981) : Colors.white38)),
      ],
    );
  }

  Widget _buildStepLine() {
    return Expanded(
      child: Container(
        height: 2,
        color: Colors.white.withOpacity(0.08),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.camera_alt, size: 80, color: Colors.white30),
            const SizedBox(height: 16),
            const Text(
              "Ambil Foto Sampah Anda Terlebih Dahulu",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text("Sistem akan mengompres berkas otomatis ke < 1MB", style: TextStyle(fontSize: 12, color: Colors.white38)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              icon: const Icon(Icons.camera),
              label: const Text("Buka Kamera"),
              onPressed: _takePhoto,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        );
      case 1:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo, size: 80, color: const Color(0xFF10B981).withOpacity(0.5)),
            const SizedBox(height: 16),
            Text("File Image Size: ${(_compressedImageSize/1024).toStringAsFixed(0)} KB"),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _compressAndDetect,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              ),
              child: const Text("Kirim Ke AI Detector"),
            ),
          ],
        );
      case 2:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.qr_code, size: 80, color: Color(0xFF3B82F6)),
            const SizedBox(height: 16),
            Text("Hasil AI: $_detectedType | Volume: $_estimatedVolume Liter"),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text("Scan QR Code Tong Sampah"),
              onPressed: _scanQrAndCommit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        );
      case 3:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle, size: 80, color: Color(0xFF10B981)),
            const SizedBox(height: 16),
            const Text(
              "Setoran Sukses Terkirim!",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _resetToStep0,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white12,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              ),
              child: const Text("Setor Sampah Lagi"),
            ),
          ],
        );
      default:
        return const Text("Unknown State");
    }
  }
}
