import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../routes/app_routes.dart';

final logbookListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getLogbookList();
});

class DataLogbookHarianView extends ConsumerWidget {
  const DataLogbookHarianView({super.key});

  Widget _buildStatusBadge(String? status) {
    final s = (status ?? '').toUpperCase();
    Color color;
    String label;
    IconData icon;

    switch (s) {
      case 'DISETUJUI_DPL':
      case 'DISETUJUI':
        color = AppColors.primaryGreen;
        label = 'Disetujui';
        icon = Icons.check_circle_rounded;
      case 'PERLU_REVISI_DPL':
        color = Colors.orange;
        label = 'Perlu Revisi';
        icon = Icons.rate_review_rounded;
      case 'DITOLAK_KETUA':
        color = AppColors.dangerRed;
        label = 'Ditolak Ketua';
        icon = Icons.cancel_rounded;
      case 'MENUNGGU_VERIFIKASI_DPL':
        color = Colors.amber.shade700;
        label = 'Menunggu DPL';
        icon = Icons.hourglass_empty_rounded;
      case 'MENUNGGU_VERIFIKASI_KETUA':
        color = AppColors.primaryBlue;
        label = 'Menunggu Ketua';
        icon = Icons.hourglass_top_rounded;
      default:
        color = AppColors.textSecondary;
        label = s.isEmpty ? 'Draft' : s.replaceAll('_', ' ');
        icon = Icons.circle_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  bool _canEdit(String? status) {
    final s = (status ?? '').toUpperCase();
    return s != 'DISETUJUI_DPL' && s != 'DISETUJUI';
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '-';
    try {
      final d = DateTime.parse(raw);
      const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${d.day} ${months[d.month]} ${d.year}';
    } catch (_) {
      return raw.split('T').first;
    }
  }

  String _fmtTime(String? t) {
    if (t == null || t.isEmpty) return '';
    final parts = t.split(':');
    if (parts.length >= 2) return '${parts[0]}:${parts[1]}';
    return t;
  }

  Widget _buildLogbookCard(BuildContext context, WidgetRef ref, Map<String, dynamic> item) {
    final id = item['id']?.toString() ?? '';
    final tanggal = _formatDate(item['tanggalKegiatan']?.toString() ?? item['tanggal']?.toString());
    final tempat = item['tempat']?.toString() ?? '-';
    final deskripsi = item['deskripsi']?.toString() ?? '-';
    final mulai = _fmtTime(item['waktuMulai']?.toString());
    final selesai = _fmtTime(item['waktuSelesai']?.toString());
    final prokerNama = item['programKerja'] is Map ? item['programKerja']['judul']?.toString() : item['namaProker']?.toString();
    final status = item['statusApproval']?.toString();
    final catatanDpl = item['catatanDpl']?.toString() ?? '';
    final catatanKetua = item['catatanKetua']?.toString() ?? '';
    final catatan = catatanDpl.isNotEmpty ? catatanDpl : catatanKetua;
    final canEdit = _canEdit(status);
    final isRevisi = status == 'PERLU_REVISI_DPL';
    final isDitolak = status == 'DITOLAK_KETUA';

    return Card(
      elevation: 1.5,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isRevisi ? Colors.orange.shade200 : isDitolak ? AppColors.dangerRed.withValues(alpha: 0.2) : AppColors.border,
          width: isRevisi || isDitolak ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tanggal, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      if (mulai.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text('$mulai${selesai.isNotEmpty ? ' – $selesai' : ''}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _buildStatusBadge(status),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on_rounded, size: 13, color: AppColors.primaryGreen),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(tempat, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(deskripsi, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.4), maxLines: 2, overflow: TextOverflow.ellipsis),
            if (prokerNama != null && prokerNama.isNotEmpty) ...[  
              const SizedBox(height: 5),
              Row(
                children: [
                  Icon(Icons.link_rounded, size: 12, color: AppColors.primary.withValues(alpha: 0.7)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text('Proker: $prokerNama', style: TextStyle(fontSize: 11, color: AppColors.primary.withValues(alpha: 0.8), fontStyle: FontStyle.italic), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ],
            if (catatan.isNotEmpty && (isRevisi || isDitolak)) ...[  
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: isRevisi ? Colors.orange.shade50 : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: isRevisi ? Colors.orange.shade200 : Colors.red.shade200),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(isRevisi ? Icons.rate_review_rounded : Icons.cancel_rounded, size: 12, color: isRevisi ? Colors.orange.shade700 : Colors.red.shade700),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(catatan, style: TextStyle(fontSize: 11, color: isRevisi ? Colors.orange.shade800 : Colors.red.shade800, height: 1.3), maxLines: 2, overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
              ),
            ],
            if (canEdit && id.isNotEmpty) ...[  
              const SizedBox(height: 8),
              const Divider(height: 1),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  style: TextButton.styleFrom(
                    foregroundColor: isRevisi ? Colors.orange.shade700 : AppColors.primary,
                    backgroundColor: (isRevisi ? Colors.orange : AppColors.primary).withValues(alpha: 0.07),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    minimumSize: Size.zero,
                  ),
                  icon: Icon(isRevisi ? Icons.rate_review_rounded : Icons.edit_rounded, size: 14),
                  label: Text(isRevisi ? 'Revisi Sekarang' : 'Edit Logbook', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  onPressed: () async {
                    await Navigator.pushNamed(
                      context,
                      AppRoutes.editLogbookKkn,
                      arguments: {'id': id},
                    );
                    ref.invalidate(logbookListProvider);
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listState = ref.watch(logbookListProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Logbook Harian Saya', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(color: AppColors.border, height: 1)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Muat Ulang',
            onPressed: () => ref.invalidate(logbookListProvider),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab_logbook_new',
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 3,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Input Logbook', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () async {
          await Navigator.pushNamed(context, AppRoutes.inputLogbookKkn);
          ref.invalidate(logbookListProvider);
        },
      ),
      body: listState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_rounded, size: 52, color: AppColors.textSecondary),
                const SizedBox(height: 12),
                Text(err.toString(), style: const TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => ref.invalidate(logbookListProvider),
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Coba Lagi'),
                ),
              ],
            ),
          ),
        ),
        data: (list) {
          if (list.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(color: AppColors.primaryGreen.withValues(alpha: 0.08), shape: BoxShape.circle),
                    child: const Icon(Icons.edit_document, size: 48, color: AppColors.primaryGreen),
                  ),
                  const SizedBox(height: 16),
                  const Text('Belum ada logbook harian', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 40),
                    child: Text('Tap tombol di bawah untuk mulai mencatat aktivitas harian.', style: TextStyle(fontSize: 13, color: AppColors.textSecondary), textAlign: TextAlign.center),
                  ),
                  const SizedBox(height: 80),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(logbookListProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (ctx, i) => _buildLogbookCard(ctx, ref, list[i]),
            ),
          );
        },
      ),
    );
  }
}
