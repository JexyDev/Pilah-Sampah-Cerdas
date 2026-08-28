import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';

class InputLaporanAkhirView extends ConsumerStatefulWidget {
  const InputLaporanAkhirView({super.key});

  @override
  ConsumerState<InputLaporanAkhirView> createState() => _InputLaporanAkhirViewState();
}

class _InputLaporanAkhirViewState extends ConsumerState<InputLaporanAkhirView> {
  final _formKey = GlobalKey<FormState>();
  final _judulCtrl = TextEditingController();
  final _deskripsiCtrl = TextEditingController();
  
  File? _selectedPdf;
  bool _isLoading = false;

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
            const SnackBar(content: Text('Ukuran PDF melebihi batas maksimal 15MB!'), backgroundColor: AppColors.dangerRed),
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
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih file PDF Laporan Akhir terlebih dahulu!'), backgroundColor: Colors.red));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(kknRepositoryProvider);
      await repo.submitProgramKerja({
        'judul': _judulCtrl.text.trim(),
        'kategori': 'LAPORAN_AKHIR',
        'rencanaAnggaran': 0,
        'deskripsi': _deskripsiCtrl.text.trim(),
        'filePdfPath': _selectedPdf!.path,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Laporan Akhir berhasil disubmit!')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool hasUnsavedChanges() {
      return _judulCtrl.text.isNotEmpty ||
             _deskripsiCtrl.text.isNotEmpty ||
             _selectedPdf != null;
    }

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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Batalkan Input Laporan?', style: TextStyle(fontWeight: FontWeight.bold)),
              content: const Text('Perubahan ini akan terhapus jika Anda keluar dari halaman ini.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Lanjutkan Edit', style: TextStyle(color: AppColors.textSecondary)),
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
        title: const Text('Input Laporan Akhir', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
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
          )
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
              
              _buildSectionCard(
                title: 'Data Laporan',
                icon: Icons.article_rounded,
                children: [
                  const Text('Judul Laporan', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _judulCtrl,
                    decoration: _inputDecoration('Contoh: Laporan Akhir KKN Desa X'),
                    validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),
                  
                  const Text('Deskripsi Singkat', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _deskripsiCtrl,
                    maxLines: 3,
                    decoration: _inputDecoration('Deskripsikan secara singkat...'),
                    validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              _buildSectionCard(
                title: 'Dokumen Laporan',
                icon: Icons.picture_as_pdf_rounded,
                children: [
                  const Text('File Laporan Akhir (PDF)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: _pickPdf,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundCanvas,
                        border: Border.all(color: _selectedPdf != null ? AppColors.primaryGreen : AppColors.border),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.picture_as_pdf, color: Colors.red),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _selectedPdf != null ? _selectedPdf!.path.split('/').last : 'Pilih File PDF...',
                              style: TextStyle(
                                color: _selectedPdf != null ? AppColors.textPrimary : AppColors.textHint,
                                fontSize: 14
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (_selectedPdf != null)
                            const Icon(Icons.check_circle, color: AppColors.primaryGreen, size: 20),
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.send_rounded, size: 20),
                          SizedBox(width: 10),
                          Text('Submit Laporan Akhir', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
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
        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Unggah Laporan Akhir',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 14),
                ),
                SizedBox(height: 4),
                Text(
                  'Laporan akhir ini akan menjadi syarat kelulusan dan akan ditinjau oleh DPL Anda.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required List<Widget> children}) {
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
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
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
}

final programKerjaListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getProgramKerja();
});

class _RiwayatLaporanAkhirSheet extends ConsumerWidget {
  const _RiwayatLaporanAkhirSheet();

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return "${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year}";
    } catch (_) {
      return isoString.split('T').first;
    }
  }

  Widget _buildUsulanBadge(String? statusUsulan, String? legacyStatus) {
    String u = (statusUsulan ?? '').toUpperCase();
    final leg = (legacyStatus ?? '').toUpperCase();
    if (u.isEmpty) {
      if (leg == 'DISETUJUI') {
        u = 'DISETUJUI';
      } else if (leg == 'PERLU_REVISI' || leg == 'DITOLAK') {
        u = 'PERLU_REVISI';
      } else if (leg == 'BELUM_UNGGAH') {
        u = 'BELUM_UNGGAH';
      } else {
        u = 'MENUNGGU_TELAAH';
      }
    }

    Color color;
    String label;
    IconData icon;

    if (u == 'DISETUJUI' || u == 'DITERIMA') {
      color = AppColors.primaryGreen;
      label = 'Disetujui';
      icon = Icons.check_circle;
    } else if (u == 'PERLU_REVISI' || u == 'DITOLAK') {
      color = AppColors.dangerRed;
      label = 'Perlu Revisi';
      icon = Icons.error_outline;
    } else if (u == 'BELUM_UNGGAH') {
      color = Colors.grey;
      label = 'Belum Diunggah';
      icon = Icons.cloud_off;
    } else {
      color = AppColors.warningYellow;
      label = 'Menunggu Telaah';
      icon = Icons.access_time;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prokerState = ref.watch(programKerjaListProvider);

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
            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Riwayat Laporan Akhir', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.close, size: 20, color: AppColors.textSecondary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          Expanded(
            child: prokerState.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(child: Text(err.toString(), style: const TextStyle(color: AppColors.dangerRed))),
              data: (rawList) {
                final list = rawList.where((item) {
                  final kat = item['kategori']?.toString().toUpperCase() ?? '';
                  return kat == 'LAPORAN_AKHIR';
                }).toList();

                if (list.isEmpty) {
                  return const Center(child: Text('Belum ada laporan akhir yang diajukan.'));
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = list[index];
                    final judulStr = item['judul']?.toString() ?? '-';
                    final deskripsi = item['deskripsi']?.toString() ?? '-';
                    final statusUsulan = item['statusTelaah']?.toString() ?? item['status_telaah']?.toString() ?? item['statusUsulan']?.toString();
                    final legacyStatus = item['status']?.toString();
                    final catatanDpl = item['catatanDpl'] ?? item['catatan_dpl'];
                    final createdAtStr = item['createdAt']?.toString() ?? item['dibuat_pada']?.toString();
                    
                    final nilaiAkhir = item['nilaiAkhir'] ?? item['nilai'];
                    final predikat = item['predikat'] ?? item['predikatNilai'];
                    
                    final rubrikObj = item['rubrikScores'] ?? item['rubrik_scores'];
                    final rubrikSistematika = rubrikObj?['sistematika'] ?? item['rubrikSistematika'] ?? item['sistematika'];
                    final rubrikAnalisis = rubrikObj?['analisis'] ?? item['rubrikAnalisis'] ?? item['analisis'];
                    final rubrikCapaian = rubrikObj?['output'] ?? item['rubrikCapaian'] ?? item['capaian'];
                    final rubrikRefleksi = rubrikObj?['refleksi'] ?? item['rubrikRefleksi'] ?? item['refleksi'];
                    
                    final filePdfUrl = item['filePdfUrl'] ?? item['fileUrl'] ?? item['lampiranUrl'];

                    return Card(
                      elevation: 1.5,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(judulStr, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            const SizedBox(height: 4),
                            Text(deskripsi, style: const TextStyle(fontSize: 13, color: Colors.black87)),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: Colors.grey.withValues(alpha: 0.4)),
                                  ),
                                  child: const Text('LAPORAN_AKHIR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blueGrey)),
                                ),
                                _buildUsulanBadge(statusUsulan, legacyStatus),
                              ],
                            ),
                            const SizedBox(height: 6),
                            if (createdAtStr != null)
                              Row(
                                children: [
                                  const Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Diajukan Pada: ${_formatDate(createdAtStr)}',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            if (nilaiAkhir != null) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryGreen.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.2)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Nilai Akhir:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                                        if (predikat != null)
                                          Text(
                                            '$predikat',
                                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                                          ),
                                      ],
                                    ),
                                    Text(
                                      '$nilaiAkhir',
                                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: AppColors.primaryGreen),
                                    ),
                                  ],
                                ),
                              ),
                              if (rubrikSistematika != null || rubrikAnalisis != null || rubrikCapaian != null || rubrikRefleksi != null) ...[
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
                                      const Text('Rincian Penilaian Rubrik:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 6),
                                      if (rubrikSistematika != null) _buildRubrikRow('Sistematika Laporan (20%)', rubrikSistematika.toString()),
                                      if (rubrikAnalisis != null) _buildRubrikRow('Analisis Data & Masalah (30%)', rubrikAnalisis.toString()),
                                      if (rubrikCapaian != null) _buildRubrikRow('Capaian Output & Program (30%)', rubrikCapaian.toString()),
                                      if (rubrikRefleksi != null) _buildRubrikRow('Refleksi & Rekomendasi (20%)', rubrikRefleksi.toString()),
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
                                  border: Border.all(color: AppColors.warningYellow.withValues(alpha: 0.4)),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(Icons.feedback_outlined, size: 16, color: Colors.orange),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Ulasan DPL: $catatanDpl',
                                        style: const TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.w500),
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
                                  icon: const Icon(Icons.picture_as_pdf_rounded, size: 16, color: Colors.redAccent),
                                  label: const Text('Lihat Dokumen Laporan'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.textPrimary,
                                    side: BorderSide(color: Colors.grey.shade300),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  onPressed: () async {
                                    final url = Uri.parse(filePdfUrl.toString());
                                    if (await canLaunchUrl(url)) {
                                      await launchUrl(url, mode: LaunchMode.externalApplication);
                                    }
                                  },
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
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
          Expanded(child: Text(title, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary))),
          Text(score, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
