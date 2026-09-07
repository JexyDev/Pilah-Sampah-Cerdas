import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../shared/widgets/qr_scanner_widget.dart';
import '../controllers/petugas_pemilahan_controller.dart';

/// Halaman verifikasi fisik pengosongan tempat sampah warga oleh Petugas Pemilah.
/// Memastikan petugas memindai QR dinamis tempat sampah warga dan memotret tempat sampah kosong.
class VerifikasiPengosonganView extends ConsumerStatefulWidget {
  const VerifikasiPengosonganView({
    super.key,
    required this.pengajuan,
  });

  final Map<String, dynamic> pengajuan;

  @override
  ConsumerState<VerifikasiPengosonganView> createState() => _VerifikasiPengosonganViewState();
}

class _VerifikasiPengosonganViewState extends ConsumerState<VerifikasiPengosonganView> {
  final GlobalKey<QrScannerWidgetState> _scannerKey = GlobalKey<QrScannerWidgetState>();

  String? _scannedQr;
  bool _isQrMatched = false;
  String? _emptyBinPhotoPath;
  bool _isSubmitting = false;

  String get _pengajuanId => widget.pengajuan['id']?.toString() ?? '';
  String get _wargaName => widget.pengajuan['wargaName']?.toString() ?? 'Warga';
  String get _targetBinCode => widget.pengajuan['binCode']?.toString() ?? '';
  String get _targetBinId => widget.pengajuan['binId']?.toString() ?? '';
  String get _category => widget.pengajuan['category']?.toString() ?? 'Organik';
  String get _alamat => widget.pengajuan['address']?.toString() ?? '';
  String get _rtRw => widget.pengajuan['rtRw']?.toString() ?? '';

  bool get _canSubmit => _isQrMatched && _emptyBinPhotoPath != null && !_isSubmitting;

  Future<bool> _handleQrDetected(String code) async {
    final cleanScanned = code.trim().toLowerCase();
    final cleanTarget = _targetBinCode.trim().toLowerCase();
    final cleanTargetId = _targetBinId.trim().toLowerCase();

    // ponytail: dynamic QR matching. Checks exact bin code, id, or contained URL token.
    final bool isMatch = cleanScanned.isNotEmpty &&
        (cleanScanned == cleanTarget ||
            (cleanTarget.isNotEmpty && cleanScanned.contains(cleanTarget)) ||
            (cleanTargetId.isNotEmpty && cleanScanned == cleanTargetId));

    if (isMatch) {
      HapticFeedback.heavyImpact();
      setState(() {
        _scannedQr = code.trim();
        _isQrMatched = true;
      });
      return true;
    } else {
      HapticFeedback.vibrate();
      setState(() {
        _isQrMatched = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'QR tidak cocok! Terbaca: "$code". Diharapkan tempat sampah $_category milik $_wargaName ($_targetBinCode).',
            ),
            backgroundColor: AppColors.maroonRed,
            duration: const Duration(seconds: 4),
          ),
        );
      }
      return false;
    }
  }

  Future<void> _takeEmptyBinPhoto() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
        maxWidth: 1920,
        maxHeight: 1080,
      );
      if (file != null && mounted) {
        setState(() {
          _emptyBinPhotoPath = file.path;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengambil foto: $e'),
            backgroundColor: AppColors.maroonRed,
          ),
        );
      }
    }
  }

  void _showImagePreview(String path) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: InteractiveViewer(
                child: Image.file(
                  File(path),
                  fit: BoxFit.contain,
                ),
              ),
            ),
            IconButton(
              onPressed: () => Navigator.pop(ctx),
              icon: const CircleAvatar(
                backgroundColor: Colors.black54,
                child: Icon(Icons.close, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCelebrationDialog() async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          backgroundColor: Colors.white,
          elevation: 8,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 80,
                  height: 80,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 76,
                        height: 76,
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                      ),
                      Container(
                        width: 52,
                        height: 52,
                        decoration: const BoxDecoration(
                          color: AppColors.primaryGreen,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check_rounded, color: Colors.white, size: 32),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Pengosongan Selesai!',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Tempat sampah $_category milik $_wargaName telah berhasil diverifikasi dan kapasitas di-reset ke 0%.',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.stars_rounded, color: AppColors.primaryGreen, size: 18),
                      SizedBox(width: 6),
                      Text(
                        '+15 Poin Validasi Diperoleh',
                        style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Kembali ke Antrean', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _submitVerification() async {
    if (!_canSubmit) return;

    setState(() => _isSubmitting = true);

    final ok = await ref
        .read(petugasPemilahanControllerProvider.notifier)
        .claimPengajuanReset(_pengajuanId);

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (ok) {
      ref.read(authProvider.notifier).fetchProfile();
      await _showCelebrationDialog();
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } else {
      final errorMsg = ref.read(petugasPemilahanControllerProvider).errorMessage;
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMsg ?? 'Gagal memproses verifikasi pengosongan.'),
          backgroundColor: AppColors.maroonRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOrganik = _category.toLowerCase().contains('organik') && !_category.toLowerCase().contains('anorganik');
    final categoryColor = isOrganik ? AppColors.primaryGreen : AppColors.primaryBlue;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Verifikasi Pengosongan'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primaryGreen,
        elevation: 1,
        shadowColor: Colors.black12,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(AppDimensions.md, AppDimensions.md, AppDimensions.md, 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Target Info Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: categoryColor.withValues(alpha: 0.08),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: categoryColor.withValues(alpha: 0.2),
                          child: Icon(
                            isOrganik ? Icons.eco_rounded : Icons.recycling_rounded,
                            color: categoryColor,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _wargaName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                              ),
                              if (_alamat.isNotEmpty)
                                Text(
                                  _alamat,
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: categoryColor,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _category.toUpperCase(),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        const Icon(Icons.qr_code_2_rounded, size: 18, color: AppColors.primaryGreen),
                        const SizedBox(width: 8),
                        const Text('Target QR: ', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        Text(
                          _targetBinCode.isNotEmpty ? _targetBinCode : 'Kode Terdaftar',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                        ),
                        if (_rtRw.isNotEmpty) ...[
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              _rtRw,
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppDimensions.lg),

            // 1. Verifikasi QR Tempat Sampah
            Row(
              children: [
                _buildStepBadge(1, _isQrMatched),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    '1. Scan QR Tempat Sampah Warga',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                  ),
                ),
                if (_isQrMatched)
                  const Text(
                    'Valid ✓',
                    style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
              ],
            ),
            const SizedBox(height: 10),

            if (_isQrMatched)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primaryGreen, width: 1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: AppColors.primaryGreen,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.check_rounded, color: Colors.white, size: 16),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'QR Cocok & Terverifikasi!',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryGreen,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: () {
                            setState(() {
                              _isQrMatched = false;
                              _scannedQr = null;
                            });
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.primaryGreen),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.refresh_rounded, size: 13, color: AppColors.primaryGreen),
                                SizedBox(width: 4),
                                Text(
                                  'Pindai Ulang',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.qr_code_2_rounded, size: 16, color: AppColors.primaryGreen),
                          const SizedBox(width: 8),
                          const Text(
                            'Tempat Sampah: ',
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          Expanded(
                            child: Text(
                              _scannedQr ?? _targetBinCode,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else
              Container(
                height: 220,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    QrScannerWidget(
                      key: _scannerKey,
                      onQrDetected: _handleQrDetected,
                      hint: 'Arahkan kamera ke stiker QR tempat sampah $_category',
                    ),
                  ],
                ),
              ),
            const SizedBox(height: AppDimensions.lg),

            // 2. Foto Bukti Tempat Sampah Kosong
            Row(
              children: [
                _buildStepBadge(2, _emptyBinPhotoPath != null),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    '2. Foto Tempat Sampah yang Kosong',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                  ),
                ),
                if (_emptyBinPhotoPath != null)
                  const Text(
                    'Terambil ✓',
                    style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
              ],
            ),
            const SizedBox(height: 10),

            if (_emptyBinPhotoPath != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primaryGreen, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => _showImagePreview(_emptyBinPhotoPath!),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            Image.file(
                              File(_emptyBinPhotoPath!),
                              width: 64,
                              height: 64,
                              fit: BoxFit.cover,
                            ),
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: const BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.only(topLeft: Radius.circular(6)),
                              ),
                              child: const Icon(Icons.zoom_in_rounded, size: 12, color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Foto Bukti Kosong Terlampir',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryGreen),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Ketuk foto untuk perbesar.',
                            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.camera_alt_outlined, color: AppColors.primaryGreen, size: 20),
                      onPressed: _takeEmptyBinPhoto,
                      tooltip: 'Foto Ulang',
                      visualDensity: VisualDensity.compact,
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: AppColors.dangerRed, size: 20),
                      onPressed: () => setState(() => _emptyBinPhotoPath = null),
                      tooltip: 'Hapus Foto',
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
              )
            else
              GestureDetector(
                onTap: _takeEmptyBinPhoto,
                child: Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.camera_alt_rounded, size: 36, color: AppColors.primaryGreen),
                      SizedBox(height: 6),
                      Text(
                        'Ambil Foto Tempat Sampah Kosong',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryGreen),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Wajib memotret bagian dalam tempat sampah yang sudah dikosongkan',
                        style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.all(AppDimensions.md),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: _canSubmit ? _submitVerification : null,
              icon: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Icon(
                      _canSubmit
                          ? Icons.verified_rounded
                          : !_isQrMatched
                              ? Icons.qr_code_scanner_rounded
                              : Icons.camera_alt_outlined,
                      color: _canSubmit ? Colors.white : Colors.grey.shade600,
                    ),
              label: Text(
                _isSubmitting
                    ? 'Memproses Pengosongan...'
                    : !_isQrMatched
                        ? '1. Scan QR Tempat Sampah Warga'
                        : _emptyBinPhotoPath == null
                            ? '2. Ambil Foto Tempat Sampah Kosong'
                            : 'Konfirmasi Pengosongan Selesai',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: _canSubmit ? Colors.white : Colors.grey.shade600,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _canSubmit ? AppColors.primaryGreen : Colors.grey.shade400,
                disabledBackgroundColor: Colors.grey.shade300,
                elevation: _canSubmit ? 3 : 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStepBadge(int stepNumber, bool isCompleted) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: isCompleted ? AppColors.primaryGreen : Colors.grey.shade400,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: isCompleted
            ? const Icon(Icons.check, size: 14, color: Colors.white)
            : Text(
                '$stepNumber',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
              ),
      ),
    );
  }
}
