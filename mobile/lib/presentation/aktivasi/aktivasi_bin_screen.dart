/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/bin_provider.dart';
import '../shared/widgets/app_loading.dart';
import '../shared/widgets/qr_scanner_widget.dart';

/// Aktivasi Tong Sampah — sesuai desain:
/// AppBar biru, QrScannerWidget (kamera native / input manual),
/// bottom sheet "Tong Terdeteksi!" dengan info card + tombol biru.
class AktivasiBinScreen extends ConsumerStatefulWidget {
  const AktivasiBinScreen({super.key});

  @override
  ConsumerState<AktivasiBinScreen> createState() => _AktivasiBinScreenState();
}

class _AktivasiBinScreenState extends ConsumerState<AktivasiBinScreen> {
  bool _binDetected = false;
  String _detectedQr = '';
  bool _isOrganic = true;

  void _onQrDetected(String qr) {
    setState(() {
      _detectedQr = qr.trim();
      _isOrganic = !_detectedQr.toUpperCase().contains('NON');
      _binDetected = true;
    });
  }

  Future<void> _onAktivasi() async {
    final user = ref.read(authProvider).user;
    await ref
        .read(aktivasiBinProvider.notifier)
        .aktivasi(
          qrSerial: _detectedQr,
          userId: user?.id ?? '',
          householdId: user?.householdId ?? '',
        );
    if (ref.read(aktivasiBinProvider).isSuccess) {
      ref.invalidate(binsProvider);
    }
  }

  String _mapError(String code, String? msg) {
    switch (code) {
      case 'BIN_ALREADY_ACTIVE':
        return 'Tong ini sudah aktif dan terdaftar.';
      case 'RESOURCE_NOT_FOUND':
        return 'QR Serial tidak ditemukan.';
      default:
        return msg ?? 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final aktivasiState = ref.watch(aktivasiBinProvider);

    ref.listen(aktivasiBinProvider, (_, next) {
      if (next.errorCode != null && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_mapError(next.errorCode!, next.errorMessage)),
            backgroundColor: AppColors.dangerRed,
          ),
        );
        ref.read(aktivasiBinProvider.notifier).reset();
        setState(() => _binDetected = false);
      }
    });

    if (aktivasiState.isLoading) {
      return const Scaffold(body: AppLoading(message: 'Mengaktivasi tong...'));
    }

    if (aktivasiState.isSuccess) {
      return _SuccessScreen(
        onBack: () {
          ref.read(aktivasiBinProvider.notifier).reset();
          Navigator.of(context).pop();
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Aktivasi Tong Sampah',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        elevation: 0,
      ),
      backgroundColor: Colors.black,
      body: Column(
        children: [
          // ── Area Scanner ──────────────────────────────────────────
          Expanded(
            child: _binDetected
                // Setelah tong terdeteksi — tampil konfirmasi
                ? Container(
                    color: const Color(0xFF3D4A3F),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.primaryGreen,
                            size: 72,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _detectedQr,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _isOrganic ? 'Tong Organik' : 'Tong Non-Organik',
                            style: TextStyle(
                              color: _isOrganic
                                  ? AppColors.primaryGreen
                                  : AppColors.nonOrganicColor,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextButton.icon(
                            onPressed: () =>
                                setState(() => _binDetected = false),
                            icon: const Icon(
                              Icons.refresh_rounded,
                              color: Colors.white54,
                            ),
                            label: const Text(
                              'Scan Ulang',
                              style: TextStyle(color: Colors.white54),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                // Belum terdeteksi — tampil QR scanner
                : Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: QrScannerWidget(
                        hint: 'PSC-DAGO-ORG-0042',
                        overlayColor: AppColors.primaryGreen,
                        onQrDetected: _onQrDetected,
                      ),
                    ),
                  ),
          ),

          // ── Bottom Sheet Putih ────────────────────────────────────
          SafeArea(
            top: false,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 16,
                    offset: Offset(0, -4),
                  ),
                ],
              ),
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              child: _binDetected ? _buildDetectedContent() : _buildScanPrompt(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanPrompt() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 36,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 16),
        const Icon(
          Icons.qr_code_scanner_rounded,
          color: AppColors.primaryGreen,
          size: 32,
        ),
        const SizedBox(height: 10),
        const Text(
          'Arahkan kamera ke QR Code\npada tong sampah Anda',
          style: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        const Text(
          'atau masukkan ID tong secara manual di atas',
          style: TextStyle(fontSize: 12, color: AppColors.textHint),
        ),
      ],
    );
  }

  Widget _buildDetectedContent() {
    final Color typeColor = _isOrganic
        ? AppColors.primaryGreen
        : AppColors.nonOrganicColor;
    final String displayId = _detectedQr.length > 12
        ? _detectedQr.substring(_detectedQr.length - 12)
        : _detectedQr;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                color: AppColors.primaryGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_rounded,
                color: Colors.white,
                size: 14,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Tong Terdeteksi!',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.primaryGreen,
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: () => setState(() => _binDetected = false),
              child: const Icon(
                Icons.close_rounded,
                color: AppColors.textHint,
                size: 20,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Info card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF5F7FA),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ID PERANGKAT',
                          style: TextStyle(
                            fontSize: 10,
                            color: AppColors.textHint,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          displayId.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'TIPE',
                          style: TextStyle(
                            fontSize: 10,
                            color: AppColors.textHint,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: typeColor,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              _isOrganic ? 'Organik' : 'Non-Organik',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: typeColor,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Divider(height: 1, color: Color(0xFFE5E7EB)),
              const SizedBox(height: 10),
              const Row(
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  SizedBox(width: 4),
                  Text(
                    'Area Komunal, RT 04/02',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Tombol AKTIVASI
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _onAktivasi,
            icon: const Icon(Icons.sensors_rounded, size: 18),
            label: const Text(
              'AKTIVASI TONG INI',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 10),
        const Center(
          child: Text(
            'Gunakan tong ini untuk mengumpulkan poin sampah\nrumah tangga Anda.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}

// ─── Success Screen ──────────────────────────────────────────────────────────

class _SuccessScreen extends StatelessWidget {
  const _SuccessScreen({required this.onBack});
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: onBack,
        ),
        title: const Text(
          'Aktivasi Tong Sampah',
          style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(
                  color: AppColors.primaryGreen,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: Colors.white,
                  size: 44,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Tong Berhasil Diaktivasi!',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryGreen,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Tong sampah Anda telah terhubung\ndengan akun rumah tangga.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onBack,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                  ),
                  child: const Text('Kembali ke Beranda'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
