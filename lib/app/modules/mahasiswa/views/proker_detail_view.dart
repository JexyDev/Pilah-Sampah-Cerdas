import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../routes/app_routes.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

final prokerDetailProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) async {
  final repo = ref.read(kknRepositoryProvider);
  final detail = await repo.getProgramKerjaDetail(id);
  if (detail == null) throw Exception('Data program kerja tidak ditemukan.');
  return detail;
});

// ─────────────────────────────────────────────────────────────────────────────
// View
// ─────────────────────────────────────────────────────────────────────────────

class ProkerDetailView extends ConsumerWidget {
  final String prokerId;
  const ProkerDetailView({super.key, required this.prokerId});

  // ── Helpers ────────────────────────────────────────────────────────────────

  String _formatTanggal(String? iso) {
    if (iso == null || iso.isEmpty) return '-';
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat('dd MMM yyyy', 'id_ID').format(dt);
    } catch (_) {
      return iso.split('T').first;
    }
  }

  String _formatRupiah(num? value) {
    if (value == null || value == 0) return '-';
    final fmt = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    return fmt.format(value);
  }

  String _formatKg(num? value) {
    if (value == null) return '0 Kg';
    return '${value % 1 == 0 ? value.toInt() : value} Kg';
  }

  /// Hitung progress hari berdasarkan rentang waktuPelaksanaan
  /// Format input: "YYYY-MM-DD s/d YYYY-MM-DD"
  ({int hari, int totalHari, double persen}) _hitungProgress(String? waktu) {
    if (waktu == null || !waktu.contains(' s/d ')) {
      return (hari: 0, totalHari: 0, persen: 0.0);
    }
    try {
      final parts = waktu.split(' s/d ');
      final mulai = DateTime.parse(parts[0].trim());
      final selesai = DateTime.parse(parts[1].trim());
      final now = DateTime.now();
      final totalHari = selesai.difference(mulai).inDays + 1;
      final hariJalan = now.isBefore(mulai)
          ? 0
          : now.isAfter(selesai)
              ? totalHari
              : now.difference(mulai).inDays + 1;
      final persen = totalHari > 0 ? (hariJalan / totalHari).clamp(0.0, 1.0) : 0.0;
      return (hari: hariJalan, totalHari: totalHari, persen: persen);
    } catch (_) {
      return (hari: 0, totalHari: 0, persen: 0.0);
    }
  }

  Color _statusColor(String? status) {
    switch ((status ?? '').toUpperCase()) {
      case 'PANEN':
        return AppColors.primaryGreen;
      case 'PROSES':
        return AppColors.primaryBlue;
      default:
        return AppColors.textSecondary;
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(prokerDetailProvider(prokerId));

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Detail Program Kerja',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppColors.border, height: 1),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Muat Ulang',
            onPressed: () => ref.invalidate(prokerDetailProvider(prokerId)),
          ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen)),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_rounded, size: 52, color: AppColors.textSecondary),
                const SizedBox(height: 12),
                Text(err.toString(), textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.textSecondary)),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => ref.invalidate(prokerDetailProvider(prokerId)),
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Coba Lagi'),
                ),
              ],
            ),
          ),
        ),
        data: (data) => _buildContent(context, ref, data),
      ),
      // FAB: Catat Pemanfaatan — hanya tampil saat SEDANG_BERJALAN
      floatingActionButton: state.whenOrNull(
        data: (data) {
          final pl = (data['statusPelaksanaan'] ?? '').toString().toUpperCase();
          if (pl != 'SEDANG_BERJALAN' && pl != 'SEDANG_DILAKSANAKAN') return null;
          return FloatingActionButton.extended(
            heroTag: 'fab_catat_pemanfaatan',
            backgroundColor: AppColors.primaryGreen,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.add_rounded),
            label: const Text('Catat Pemanfaatan', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () async {
              await Navigator.pushNamed(
                context,
                AppRoutes.logbookPemanfaatan,
                arguments: {'prokerId': prokerId},
              );
              ref.invalidate(prokerDetailProvider(prokerId));
            },
          );
        },
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, Map<String, dynamic> data) {
    final judul = data['judul']?.toString() ?? '-';
    final kategori = data['kategori']?.toString() ?? '-';
    final waktu = data['waktuPelaksanaan']?.toString() ?? '';
    final statusPl = (data['statusPelaksanaan'] ?? '').toString().toUpperCase();
    final pemanfaatan = data['pemanfaatan'] as Map<String, dynamic>?;
    final progress = _hitungProgress(waktu);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(prokerDetailProvider(prokerId)),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          // ── Header Info Proker ────────────────────────────────────────────
          _buildHeaderCard(judul, kategori, waktu, statusPl, progress),
          const SizedBox(height: 12),

          // ── Ringkasan Pemanfaatan ─────────────────────────────────────────
          if (pemanfaatan != null) ...[
            _buildRingkasanCard(pemanfaatan),
            const SizedBox(height: 12),

            // ── Per Teknologi ───────────────────────────────────────────────
            if ((pemanfaatan['perTeknologi'] as List?)?.isNotEmpty == true) ...[
              _buildPerTeknologiSection(pemanfaatan['perTeknologi'] as List),
              const SizedBox(height: 12),
            ],

            // ── List Entri ──────────────────────────────────────────────────
            if ((pemanfaatan['entries'] as List?)?.isNotEmpty == true)
              _buildEntriesSection(context, pemanfaatan['entries'] as List)
            else
              _buildEmptyEntri(),
          ] else
            _buildEmptyEntri(),
        ],
      ),
    );
  }

  // ── Header Card ────────────────────────────────────────────────────────────

  Widget _buildHeaderCard(
    String judul,
    String kategori,
    String waktu,
    String statusPl,
    ({int hari, int totalHari, double persen}) progress,
  ) {
    Color plColor;
    String plLabel;
    IconData plIcon;
    switch (statusPl) {
      case 'SEDANG_BERJALAN':
      case 'SEDANG_DILAKSANAKAN':
        plColor = AppColors.primaryBlue;
        plLabel = 'Sedang Berjalan';
        plIcon = Icons.play_circle_rounded;
        break;
      case 'SELESAI':
        plColor = AppColors.primaryGreen;
        plLabel = 'Selesai';
        plIcon = Icons.check_circle_rounded;
        break;
      default:
        plColor = AppColors.textSecondary;
        plLabel = statusPl.replaceAll('_', ' ');
        plIcon = Icons.circle_outlined;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Kategori + status
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(kategori,
                    style: const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: plColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(plIcon, size: 11, color: plColor),
                    const SizedBox(width: 4),
                    Text(plLabel,
                        style: TextStyle(
                            fontSize: 11, fontWeight: FontWeight.bold, color: plColor)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(judul,
              style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          if (waktu.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.calendar_month_rounded, size: 13, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(waktu,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ],
          // Progress bar hari
          if (progress.totalHari > 0) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Hari ke-${progress.hari} dari ${progress.totalHari}',
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                Text('${(progress.persen * 100).toStringAsFixed(0)}%',
                    style: const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryBlue)),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress.persen,
                minHeight: 7,
                backgroundColor: AppColors.border,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryBlue),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Ringkasan Card ─────────────────────────────────────────────────────────

  Widget _buildRingkasanCard(Map<String, dynamic> pemanfaatan) {
    final totalInput = (pemanfaatan['totalBeratInputKg'] as num?) ?? 0;
    final totalOutput = (pemanfaatan['totalBeratOutputKg'] as num?) ?? 0;
    final totalNilai = (pemanfaatan['totalNilaiEkonomi'] as num?) ?? 0;
    final totalEntri = (pemanfaatan['totalEntri'] as num?) ?? 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Ringkasan Pemanfaatan',
              style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildStatTile('Total Entri', '$totalEntri sesi',
                  Icons.list_alt_rounded, AppColors.primaryBlue)),
              const SizedBox(width: 10),
              Expanded(child: _buildStatTile('Bahan Masuk', _formatKg(totalInput),
                  Icons.input_rounded, const Color(0xFF7C3AED))),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _buildStatTile('Total Hasil', _formatKg(totalOutput),
                  Icons.eco_rounded, const Color(0xFF0D9488))),
              const SizedBox(width: 10),
              Expanded(child: _buildStatTile('Nilai Ekonomi', _formatRupiah(totalNilai),
                  Icons.payments_rounded, AppColors.primaryGreen)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatTile(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                const SizedBox(height: 2),
                Text(value,
                    style: TextStyle(
                        fontSize: 12, fontWeight: FontWeight.bold, color: color),
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Per Teknologi ──────────────────────────────────────────────────────────

  Widget _buildPerTeknologiSection(List perTeknologi) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Per Teknologi',
              style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 10),
          ...perTeknologi.map((t) {
            final item = t as Map<String, dynamic>;
            final tek = item['teknologi']?.toString() ?? '-';
            final input = (item['totalBeratInputKg'] as num?) ?? 0;
            final output = (item['totalBeratOutputKg'] as num?) ?? 0;
            final nilai = (item['totalNilaiEkonomi'] as num?) ?? 0;
            final count = (item['count'] as num?) ?? 0;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.backgroundCanvas,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.science_rounded, size: 14, color: AppColors.primaryGreen),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(tek,
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary)),
                      ),
                      Text('$count entri',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 12,
                    children: [
                      _buildTeknologiChip('Masuk', _formatKg(input), const Color(0xFF7C3AED)),
                      _buildTeknologiChip('Hasil', _formatKg(output), const Color(0xFF0D9488)),
                      if (nilai > 0)
                        _buildTeknologiChip('Nilai', _formatRupiah(nilai), AppColors.primaryGreen),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildTeknologiChip(String label, String value, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$label: ', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        Text(value,
            style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  // ── List Entri ─────────────────────────────────────────────────────────────

  Widget _buildEntriesSection(BuildContext context, List entries) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text('Riwayat Entri',
              style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        ),
        ...entries.map((e) => _buildEntriCard(e as Map<String, dynamic>)),
      ],
    );
  }

  Widget _buildEntriCard(Map<String, dynamic> entry) {
    final tek = entry['teknologi']?.toString() ?? '-';
    final bahan = entry['bahanBaku']?.toString() ?? '-';
    final inputKg = (entry['beratInputKg'] ?? entry['volumeBahanBaku']) as num?;
    final outputKg = (entry['beratOutputKg'] ?? entry['hasil']) as num?;
    final nilai = entry['nilaiEkonomiRp'] as num?;
    final status = entry['status']?.toString() ?? '';
    final tanggal = _formatTanggal(entry['tanggalPencatatan']?.toString());
    final fotoUrl = entry['fotoDokumentasiUrl']?.toString();
    final rwName = entry['rwName']?.toString();
    final isPanen = status.toUpperCase() == 'PANEN';
    final statusColor = _statusColor(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isPanen
              ? AppColors.primaryGreen.withValues(alpha: 0.3)
              : AppColors.border,
        ),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Baris atas: teknologi + status badge + tanggal
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(tek,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary)),
                    if (bahan != '-') ...[
                      const SizedBox(height: 2),
                      Text(bahan,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      isPanen ? 'Sudah Panen' : 'Dalam Proses',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: statusColor),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(tanggal,
                      style: const TextStyle(
                          fontSize: 10, color: AppColors.textSecondary)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Metric row
          Wrap(
            spacing: 16,
            runSpacing: 6,
            children: [
              if (inputKg != null && inputKg > 0)
                _buildMetricItem(Icons.input_rounded, 'Masuk', _formatKg(inputKg),
                    const Color(0xFF7C3AED)),
              if (outputKg != null && outputKg > 0)
                _buildMetricItem(Icons.eco_rounded, 'Hasil', _formatKg(outputKg),
                    const Color(0xFF0D9488)),
              if (nilai != null && nilai > 0)
                _buildMetricItem(Icons.payments_rounded, 'Nilai',
                    _formatRupiah(nilai), AppColors.primaryGreen),
              if (rwName != null)
                _buildMetricItem(Icons.location_on_rounded, 'RW', rwName,
                    AppColors.primaryBlue),
            ],
          ),
          // Foto thumbnail jika ada
          if (fotoUrl != null && fotoUrl.isNotEmpty) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                fotoUrl,
                height: 100,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 60,
                  color: AppColors.backgroundCanvas,
                  child: const Center(
                    child: Icon(Icons.broken_image_rounded,
                        color: AppColors.textSecondary),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMetricItem(IconData icon, String label, String value, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Text('$label: ', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        Text(value,
            style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────

  Widget _buildEmptyEntri() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.recycling_rounded, size: 36, color: AppColors.primaryGreen),
          ),
          const SizedBox(height: 12),
          const Text('Belum ada catatan pemanfaatan',
              style: TextStyle(
                  fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 6),
          const Text(
            'Tap tombol "Catat Pemanfaatan" di bawah\nuntuk mulai mencatat kegiatan harian.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
          ),
        ],
      ),
    );
  }
}
