import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_config.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/notification_engine.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/mahasiswa_notifikasi_controller.dart';
import '../controllers/riwayat_kkn_controller.dart';

final laporanAkhirMeProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getLaporanAkhirMe();
});

final laporanAkhirHistoryProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getLaporanAkhirHistory();
});

class InputLaporanAkhirView extends ConsumerStatefulWidget {
  const InputLaporanAkhirView({super.key});

  @override
  ConsumerState<InputLaporanAkhirView> createState() =>
      _InputLaporanAkhirViewState();
}

class _InputLaporanAkhirViewState extends ConsumerState<InputLaporanAkhirView> {
  final _formKey = GlobalKey<FormState>();
  final _judulCtrl = TextEditingController();
  final _deskripsiCtrl = TextEditingController();

  File? _selectedPdf;
  bool _isLoading = false;

  @override
  void dispose() {
    _judulCtrl.dispose();
    _deskripsiCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPdf() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    if (result != null && result.files.single.path != null) {
      final file = File(result.files.single.path!);
      if (file.lengthSync() > 15 * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ukuran PDF melebihi batas maksimal 15MB!'),
              backgroundColor: AppColors.dangerRed,
            ),
          );
        }
        return;
      }
      setState(() {
        _selectedPdf = file;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedPdf == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pilih file PDF Laporan Akhir terlebih dahulu!'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.submitLaporanAkhir(
        judul: _judulCtrl.text.trim(),
        deskripsi: _deskripsiCtrl.text.trim(),
        filePdfPath: _selectedPdf!.path,
      );
      if (mounted) {
        NotificationEngine().showGenericNotification(
          id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
          title: 'Laporan Akhir Terkirim 📄',
          body:
              'Laporan akhir berhasil diajukan dan diteruskan ke DPL untuk ditelaah.',
          color: AppColors.primaryGreen,
        );

        final user = ref.read(authProvider).user;
        if (user != null) {
          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: user.role.name,
            title: 'Laporan Akhir Terkirim 📄',
            desc:
                'Laporan akhir berhasil diajukan dan diteruskan ke DPL untuk ditelaah.',
            type: 'LAPORAN_AKHIR_SUBMITTED',
            id: 'local_lap_${DateTime.now().millisecondsSinceEpoch}',
          );
        }

        ref.invalidate(laporanAkhirMeProvider);
        ref.invalidate(laporanAkhirHistoryProvider);
        ref.invalidate(riwayatKknControllerProvider);
        ref.invalidate(mahasiswaNotificationsProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Laporan Akhir berhasil disubmit ke DPL!'),
            backgroundColor: AppColors.primaryGreen,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final laporanMeAsync = ref.watch(laporanAkhirMeProvider);

    Map<String, dynamic>? myLatestLaporan;
    laporanMeAsync.whenData((res) {
      if (res['hasSubmitted'] == true && res['data'] is Map<String, dynamic>) {
        myLatestLaporan = res['data'] as Map<String, dynamic>;
      } else if (res['data'] is Map<String, dynamic> &&
          res['data']['judul'] != null) {
        // ponytail: fallback jika backend mengirimkan payload secara flat
        myLatestLaporan = res['data'] as Map<String, dynamic>;
      }
    });

    bool hasUnsavedChanges() {
      return _judulCtrl.text.isNotEmpty ||
          _deskripsiCtrl.text.isNotEmpty ||
          _selectedPdf != null;
    }

    final isRevisi = myLatestLaporan != null &&
        (myLatestLaporan!['statusTelaah'] == 'PERLU_REVISI');

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;

        if (!hasUnsavedChanges()) {
          if (context.mounted) Navigator.pop(context);
          return;
        }

        final bool? shouldPop = await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Text(
                'Batalkan Input Laporan?',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: const Text(
                'Perubahan ini akan terhapus jika Anda keluar dari halaman ini.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text(
                    'Lanjutkan Edit',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.dangerRed,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () => Navigator.of(context).pop(true),
                  child: const Text('Keluar'),
                ),
              ],
            );
          },
        );

        if (shouldPop == true && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(
          title: const Text(
            'Input Laporan Akhir',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
          centerTitle: true,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(color: AppColors.border, height: 1),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.history, color: AppColors.primaryGreen),
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (ctx) => const _RiwayatLaporanAkhirSheet(),
                );
              },
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildHeaderBanner(),
                const SizedBox(height: 16),
                if (myLatestLaporan != null) ...[
                  _buildLaporanItemCard(
                    myLatestLaporan!,
                    isLatestCard: true,
                    onHistoryTap: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (ctx) => const _RiwayatLaporanAkhirSheet(),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                ] else ...[
                  _buildRiwayatShortcutButton(),
                  const SizedBox(height: 16),
                ],

                _buildSectionCard(
                  title: isRevisi
                      ? 'Revisi Dokumen Laporan'
                      : 'Data Laporan Akhir',
                  icon: Icons.article_rounded,
                  children: [
                    const Text(
                      'Judul Laporan',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _judulCtrl,
                      decoration: _inputDecoration(
                        'Contoh: Laporan Akhir KKN Mahasiswa...',
                      ),
                      validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Deskripsi Singkat',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _deskripsiCtrl,
                      maxLines: 3,
                      decoration: _inputDecoration(
                        'Ringkasan atau abstrak kegiatan...',
                      ),
                      validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                _buildSectionCard(
                  title: 'Dokumen Berkas (PDF)',
                  icon: Icons.picture_as_pdf_rounded,
                  children: [
                    const Text(
                      'File Dokumen Laporan (Maks. 15MB, .pdf)',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: _pickPdf,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.backgroundCanvas,
                          border: Border.all(
                            color: _selectedPdf != null
                                ? AppColors.primaryGreen
                                : AppColors.border,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.picture_as_pdf, color: Colors.red),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _selectedPdf != null
                                    ? _selectedPdf!.path.split(RegExp(r'[/\\]')).last
                                    : 'Pilih File PDF...',
                                style: TextStyle(
                                  color: _selectedPdf != null
                                      ? AppColors.textPrimary
                                      : AppColors.textHint,
                                  fontSize: 14,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (_selectedPdf != null)
                              const Icon(
                                Icons.check_circle,
                                color: AppColors.primaryGreen,
                                size: 20,
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              isRevisi ? Icons.update_rounded : Icons.send_rounded,
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Text(
                              isRevisi
                                  ? 'Unggah Revisi Laporan'
                                  : 'Submit Laporan Akhir',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primaryGreen.withValues(alpha: 0.3),
        ),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: AppColors.primaryGreen,
            size: 24,
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Laporan Akhir KKN Mandiri',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Laporan akhir KKN bersifat mandiri per-individu mahasiswa. Berkas PDF yang diunggah akan langsung diteruskan kepada DPL untuk dinilai secara individual.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                Icon(icon, size: 20, color: AppColors.primaryGreen),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
      filled: true,
      fillColor: AppColors.backgroundCanvas,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.dangerRed),
      ),
    );
  }

  Widget _buildRiwayatShortcutButton() {
    return InkWell(
      onTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (ctx) => const _RiwayatLaporanAkhirSheet(),
        );
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: const Row(
          children: [
            Icon(
              Icons.history_rounded,
              size: 18,
              color: AppColors.primaryGreen,
            ),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Lihat Riwayat Laporan Akhir Saya',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            Icon(
              Icons.arrow_forward_ios_rounded,
              size: 12,
              color: AppColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

Widget _buildLaporanItemCard(
  Map<String, dynamic> item, {
  bool isLatestCard = false,
  VoidCallback? onHistoryTap,
}) {
  final judul = item['judul']?.toString() ?? 'Laporan Akhir';
  final deskripsi = item['deskripsi']?.toString();
  final statusUsulan = item['statusTelaah']?.toString() ??
      item['status_telaah']?.toString() ??
      item['statusUsulan']?.toString() ??
      'MENUNGGU_TELAAH';
  final legacyStatus = item['status']?.toString();
  final createdAtStr = item['submittedAt']?.toString() ??
      item['createdAt']?.toString() ??
      item['dibuat_pada']?.toString();
  final dpl = item['dpl'] as Map<String, dynamic>?;
  final dplNama = dpl?['nama']?.toString();

  final nilaiAkhir =
      item['nilaiAkhir'] ?? item['nilai'] ?? item['skorPenilaian'];
  final predikat = item['predikat'] ?? item['predikatNilai'];
  final catatanDpl = item['catatanDpl'] ?? item['catatan_dpl'];

  final rawAspek = item['aspekPenilaian'];
  final Map<String, dynamic>? parsedAspek =
      rawAspek is Map<String, dynamic> ? rawAspek : null;
  final rubrikObj = item['rubrikScores'] ??
      item['rubrik_scores'] ??
      parsedAspek?['rubrikScores'] ??
      parsedAspek;
  final rubrikSistematika = rubrikObj?['sistematika'] ??
      item['rubrikSistematika'] ??
      item['sistematika'];
  final rubrikAnalisis = rubrikObj?['analisis'] ??
      item['rubrikAnalisis'] ??
      item['analisis'];
  final rubrikCapaian = rubrikObj?['output'] ??
      item['rubrikCapaian'] ??
      item['capaian'];
  final rubrikRefleksi = rubrikObj?['refleksi'] ??
      item['rubrikRefleksi'] ??
      item['refleksi'];

  final filePdfUrl = item['fileUrl'] ??
      item['attachmentFile'] ??
      item['filePdfUrl'] ??
      item['linkGoogleDrive'] ??
      item['lampiranUrl'];

  return Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(
        color: isLatestCard
            ? AppColors.primaryGreen.withValues(alpha: 0.3)
            : AppColors.border,
      ),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: isLatestCard ? 0.04 : 0.02),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(
                  isLatestCard
                      ? Icons.check_circle_outline_rounded
                      : Icons.article_outlined,
                  size: 16,
                  color: AppColors.primaryGreen,
                ),
                const SizedBox(width: 6),
                Text(
                  isLatestCard
                      ? 'Laporan Terakhir Diajukan'
                      : 'Laporan Mandiri',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            _buildLaporanUsulanBadge(statusUsulan, legacyStatus),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          judul,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (deskripsi != null && deskripsi.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            deskripsi,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
        if (createdAtStr != null) ...[
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(
                Icons.calendar_today,
                size: 13,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                'Diajukan pada: ${_formatLaporanDate(createdAtStr)}',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
        if (dplNama != null && dplNama.isNotEmpty) ...[
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.person_outline,
                size: 13,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                'DPL: $dplNama',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
        if (nilaiAkhir != null) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppColors.primaryGreen.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Nilai Akhir:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (predikat != null)
                      Text(
                        'Predikat $predikat',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                  ],
                ),
                Text(
                  '$nilaiAkhir',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 24,
                    color: AppColors.primaryGreen,
                  ),
                ),
              ],
            ),
          ),
          if (rubrikSistematika != null ||
              rubrikAnalisis != null ||
              rubrikCapaian != null ||
              rubrikRefleksi != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Rincian Penilaian Rubrik:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (rubrikSistematika != null)
                    _buildRubrikRow(
                      'Sistematika Laporan (20%)',
                      rubrikSistematika.toString(),
                    ),
                  if (rubrikAnalisis != null)
                    _buildRubrikRow(
                      'Analisis Data & Masalah (30%)',
                      rubrikAnalisis.toString(),
                    ),
                  if (rubrikCapaian != null)
                    _buildRubrikRow(
                      'Capaian Output & Program (30%)',
                      rubrikCapaian.toString(),
                    ),
                  if (rubrikRefleksi != null)
                    _buildRubrikRow(
                      'Refleksi & Rekomendasi (20%)',
                      rubrikRefleksi.toString(),
                    ),
                ],
              ),
            ),
          ],
        ],
        if (catatanDpl != null && catatanDpl.toString().trim().isNotEmpty) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.warningYellow.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppColors.warningYellow.withValues(alpha: 0.4),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.feedback_outlined,
                  size: 16,
                  color: Colors.orange,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Ulasan DPL: $catatanDpl',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.black87,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        if (filePdfUrl != null && filePdfUrl.toString().isNotEmpty) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(
                Icons.picture_as_pdf_rounded,
                size: 16,
                color: Colors.redAccent,
              ),
              label: const Text('Lihat Dokumen Laporan (PDF)'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.textPrimary,
                side: BorderSide(color: Colors.grey.shade300),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
              onPressed: () async {
                final raw = filePdfUrl.toString().trim();
                final fullUrl =
                    raw.startsWith('http://') || raw.startsWith('https://')
                        ? raw
                        : AppConfig.getImageUrl(raw);
                final url = Uri.parse(fullUrl);
                if (await canLaunchUrl(url)) {
                  await launchUrl(
                    url,
                    mode: LaunchMode.externalApplication,
                  );
                }
              },
            ),
          ),
        ],
        if (isLatestCard && onHistoryTap != null) ...[
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.history_rounded, size: 16),
              label: const Text('Buka Riwayat & Versi Dokumen'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primaryGreen,
                side: const BorderSide(color: AppColors.primaryGreen),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
              onPressed: onHistoryTap,
            ),
          ),
        ],
      ],
    ),
  );
}

String _formatLaporanDate(String isoString) {
  try {
    final date = DateTime.parse(isoString);
    return "${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year}";
  } catch (_) {
    return isoString.split('T').first;
  }
}

Widget _buildLaporanUsulanBadge(String? statusUsulan, String? legacyStatus) {
  String u = (statusUsulan ?? '').toUpperCase().trim();
  final leg = (legacyStatus ?? '').toUpperCase().trim();
  if (u.isEmpty) {
    if (leg == 'DISETUJUI' || leg == 'DITERIMA' || leg == 'SELESAI') {
      u = 'DISETUJUI';
    } else if (leg == 'PERLU_REVISI' || leg == 'DITOLAK') {
      u = 'PERLU_REVISI';
    } else if (leg == 'BELUM_UNGGAH') {
      u = 'BELUM_UNGGAH';
    } else {
      u = 'MENUNGGU_TELAAH';
    }
  }

  Color bg;
  Color border;
  Color text;
  String label;
  IconData icon;

  if (u == 'DISETUJUI' || u == 'DITERIMA' || u == 'SELESAI') {
    bg = const Color(0xFFECFDF5);
    border = const Color(0xFFA7F3D0);
    text = const Color(0xFF047857);
    label = 'Disetujui DPL';
    icon = Icons.check_circle_rounded;
  } else if (u == 'PERLU_REVISI' || u == 'DITOLAK') {
    bg = const Color(0xFFFEF2F2);
    border = const Color(0xFFFECACA);
    text = const Color(0xFFB91C1C);
    label = 'Perlu Revisi';
    icon = Icons.assignment_late_rounded;
  } else if (u == 'BELUM_UNGGAH') {
    bg = const Color(0xFFF3F4F6);
    border = const Color(0xFFE5E7EB);
    text = const Color(0xFF4B5563);
    label = 'Belum Diunggah';
    icon = Icons.upload_file_rounded;
  } else {
    // Elegant warm amber theme for pending review
    bg = const Color(0xFFFFFBEB);
    border = const Color(0xFFFDE68A);
    text = const Color(0xFFB45309);
    label = 'Menunggu Telaah DPL';
    icon = Icons.hourglass_top_rounded;
  }

  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: border, width: 1),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: text),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: text,
            letterSpacing: 0.2,
          ),
        ),
      ],
    ),
  );
}

Widget _buildRubrikRow(String title, String score) {
  return Padding(
    padding: const EdgeInsets.only(bottom: 4.0),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        Text(
          score,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    ),
  );
}

class _RiwayatLaporanAkhirSheet extends ConsumerWidget {
  const _RiwayatLaporanAkhirSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyState = ref.watch(laporanAkhirHistoryProvider);

    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Riwayat Versi Laporan Akhir',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.close,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async =>
                  ref.refresh(laporanAkhirHistoryProvider.future),
              child: historyState.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (err, _) => ListView(
                  children: [
                    const SizedBox(height: 100),
                    Center(
                      child: Text(
                        err.toString().replaceAll('Exception: ', ''),
                        style: const TextStyle(color: AppColors.dangerRed),
                      ),
                    ),
                  ],
                ),
                data: (list) {
                  if (list.isEmpty) {
                    return ListView(
                      children: const [
                        SizedBox(height: 120),
                        Center(
                          child: Text(
                            'Belum ada riwayat dokumen laporan akhir yang diajukan.',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    );
                  }

                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return _buildLaporanItemCard(list[index]);
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
