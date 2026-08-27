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
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Input Laporan Akhir'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
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
              TextFormField(
                controller: _judulCtrl,
                decoration: const InputDecoration(labelText: 'Judul Laporan', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _deskripsiCtrl,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Deskripsi Singkat', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: _pickPdf,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.picture_as_pdf, color: Colors.red),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _selectedPdf != null ? _selectedPdf!.path.split('/').last : 'Pilih File PDF Laporan',
                          style: TextStyle(color: _selectedPdf != null ? Colors.black : Colors.grey[600]),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Submit Laporan Akhir', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
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
      if (leg == 'DITERIMA' || leg == 'DISETUJUI' || leg == 'SEDANG_BERJALAN' || leg == 'SELESAI') {
        u = 'DISETUJUI';
      } else if (leg == 'DITOLAK' || leg == 'TIDAK_DISETUJUI') {
        u = 'DITOLAK';
      } else {
        u = 'BELUM_DISETUJUI';
      }
    }

    Color color;
    String label;
    IconData icon;

    if (u == 'DISETUJUI' || u == 'DITERIMA') {
      color = AppColors.primaryGreen;
      label = 'Disetujui';
      icon = Icons.check_circle;
    } else if (u == 'DITOLAK' || u == 'TIDAK_DISETUJUI') {
      color = AppColors.dangerRed;
      label = 'Ditolak';
      icon = Icons.cancel;
    } else {
      color = AppColors.warningYellow;
      label = 'Menunggu';
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
                    final statusUsulan = item['statusUsulan'] ?? item['status_usulan'];
                    final legacyStatus = item['status']?.toString();
                    final catatanDpl = item['catatanDpl'] ?? item['catatan_dpl'];
                    final createdAtStr = item['createdAt']?.toString() ?? item['dibuat_pada']?.toString();
                    
                    final nilaiAkhir = item['nilaiAkhir'] ?? item['nilai'];
                    final rubrikScore = item['rubrikScore'];
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
                                    const Text('Nilai Laporan:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                                    Row(
                                      children: [
                                        Text(
                                          '$nilaiAkhir',
                                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.primaryGreen),
                                        ),
                                        if (rubrikScore != null)
                                          Text(
                                            ' ($rubrikScore)',
                                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
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
                            ]
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
}

