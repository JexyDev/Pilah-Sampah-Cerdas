import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../routes/app_routes.dart';
import 'riwayat_pemanfaatan_view.dart' show riwayatPemanfaatanProvider;
import '../../riwayat/controllers/riwayat_controller.dart' show pointHistoryProvider;
import '../controllers/mahasiswa_controller.dart' show mahasiswaControllerProvider;
import '../controllers/kelompok_kkn_controller.dart' show kelompokKknProvider;

final prokerDataListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
      final repo = ref.read(kknRepositoryProvider);
      final list = await repo.getProgramKerja();
      final filtered = list.where((item) {
        final kat = item['kategori']?.toString().toUpperCase() ?? '';
        return kat != 'LAPORAN_AKHIR';
      }).toList();
      // Sort terbaru paling atas
      filtered.sort((a, b) {
        final dateA = a['createdAt']?.toString() ?? '';
        final dateB = b['createdAt']?.toString() ?? '';
        return dateB.compareTo(dateA);
      });
      return filtered;
    });

class DataProkerView extends ConsumerStatefulWidget {
  const DataProkerView({super.key});

  @override
  ConsumerState<DataProkerView> createState() => _DataProkerViewState();
}

class _DataProkerViewState extends ConsumerState<DataProkerView> {
  // Tracking loading state per proker id
  final Map<String, bool> _loadingStatus = {};
  int _selectedFilterIndex = 0; // 0: Semua, 1: Menunggu, 2: Berjalan, 3: Selesai

  int _getProkerStatusCategory(Map<String, dynamic> item) {
    final statusPl = (item['statusPelaksanaan'] ?? item['status_pelaksanaan'] ?? '')
        .toString()
        .toUpperCase();
    final legacy = (item['status'] ?? '').toString().toUpperCase();

    if (statusPl == 'SELESAI' || (statusPl.isEmpty && legacy == 'SELESAI')) {
      return 3; // Selesai
    }
    if (statusPl == 'SEDANG_BERJALAN' ||
        statusPl == 'SEDANG_DILAKSANAKAN' ||
        statusPl == 'BERJALAN' ||
        (statusPl.isEmpty &&
            (legacy == 'SEDANG_BERJALAN' || legacy == 'SEDANG_DILAKSANAKAN'))) {
      return 2; // Berjalan
    }
    return 1; // Menunggu
  }

  Widget _buildStatusFilter() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _filterChip('Semua', 0),
            const SizedBox(width: 8),
            _filterChip('Menunggu', 1),
            const SizedBox(width: 8),
            _filterChip('Berjalan', 2),
            const SizedBox(width: 8),
            _filterChip('Selesai', 3),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String label, int index) {
    final bool active = _selectedFilterIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilterIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: active ? AppColors.primaryGreen : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? AppColors.primaryGreen : AppColors.border,
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: AppColors.primaryGreen.withValues(alpha: 0.25),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildUsulanBadge(String? statusUsulan, String? legacyStatus) {
    String u = (statusUsulan ?? '').toUpperCase();
    final leg = (legacyStatus ?? '').toUpperCase();
    if (u.isEmpty) {
      if (leg == 'DITERIMA' ||
          leg == 'DISETUJUI' ||
          leg == 'SEDANG_BERJALAN' ||
          leg == 'SELESAI') {
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
      label = 'Disetujui DPL';
      icon = Icons.check_circle_rounded;
    } else if (u == 'DITOLAK' || u == 'TIDAK_DISETUJUI') {
      color = AppColors.dangerRed;
      label = 'Ditolak';
      icon = Icons.cancel_rounded;
    } else if (u == 'PERLU_REVISI_DPL') {
      color = Colors.orange;
      label = 'Perlu Revisi';
      icon = Icons.rate_review_rounded;
    } else if (u == 'KADALUARSA_OTOMATIS' || u == 'BATAL_OTOMATIS' || u == 'BATAL') {
      color = AppColors.dangerRed;
      label = 'Batal Otomatis';
      icon = Icons.event_busy_rounded;
    } else {
      color = AppColors.warningYellow;
      label = 'Menunggu';
      icon = Icons.access_time_rounded;
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
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKategoriBadge(String? kategori) {
    final raw = (kategori ?? 'Lainnya').toLowerCase();
    Color color;
    String label;
    if (raw.contains('pemilahan') || raw.contains('pilah')) {
      color = AppColors.primaryGreen;
      label = 'Pemilahan';
    } else if (raw.contains('pengangkutan') || raw.contains('angkut')) {
      color = AppColors.primaryBlue;
      label = 'Pengangkutan';
    } else if (raw.contains('pengolahan') || raw.contains('olah')) {
      color = const Color(0xFF7C3AED);
      label = 'Pengolahan';
    } else if (raw.contains('pemanfaatan') || raw.contains('manfaat')) {
      color = const Color(0xFF0D9488);
      label = 'Pemanfaatan';
    } else if (raw.contains('edukasi') || raw.contains('sosialisasi')) {
      color = const Color(0xFFD97706);
      label = 'Edukasi & Sosialisasi';
    } else {
      color = AppColors.textSecondary;
      label = kategori ?? 'Lainnya';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  bool _canEdit(String? statusUsulan, String? legacyStatus) {
    final u = (statusUsulan ?? '').toUpperCase();
    final l = (legacyStatus ?? '').toUpperCase();
    return u == 'BELUM_DISETUJUI' ||
        u == 'PERLU_REVISI_DPL' ||
        u == 'DITOLAK' ||
        u == 'TIDAK_DISETUJUI' ||
        (u.isEmpty && l == 'BELUM_DISETUJUI') ||
        (u.isEmpty && (l == 'DITOLAK' || l == 'TIDAK_DISETUJUI'));
  }

  // Bisa mulai kerjakan jika proker sudah disetujui DPL dan belum mulai
  bool _canMulai(
    String? statusUsulan,
    String? statusPelaksanaan,
    String? legacyStatus,
  ) {
    final u = (statusUsulan ?? '').toUpperCase();
    final p = (statusPelaksanaan ?? '').toUpperCase();
    final l = (legacyStatus ?? '').toUpperCase();
    final isDisetujui =
        u == 'DISETUJUI' ||
        u == 'DITERIMA' ||
        (u.isEmpty &&
            (l == 'DITERIMA' ||
                l == 'DISETUJUI' ||
                l == 'SEDANG_BERJALAN' ||
                l == 'SELESAI'));
    final belumMulai = p.isEmpty || p == 'BELUM_MULAI';
    return isDisetujui && belumMulai;
  }

  // Bisa selesaikan jika sedang berjalan
  bool _canSelesaikan(String? statusPelaksanaan, String? legacyStatus) {
    final p = (statusPelaksanaan ?? '').toUpperCase();
    final l = (legacyStatus ?? '').toUpperCase();
    return p == 'SEDANG_BERJALAN' ||
        p == 'SEDANG_DILAKSANAKAN' ||
        p == 'BERJALAN' ||
        p == 'SEDANG_BERLANGSUNG' ||
        p == 'BERLANGSUNG' ||
        (p.isEmpty && (l == 'SEDANG_BERJALAN' || l == 'SEDANG_DILAKSANAKAN'));
  }

  Future<void> _updateStatus(
    BuildContext context,
    String id,
    String statusBaru,
  ) async {
    setState(() => _loadingStatus[id] = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      final repo = ref.read(kknRepositoryProvider);
      final success = await repo.updateStatusPelaksanaan(id, statusBaru);
      if (!mounted) return;
      if (success) {
        final label = statusBaru == 'SEDANG_BERJALAN'
            ? 'dimulai'
            : 'diselesaikan';
        messenger.showSnackBar(
          SnackBar(
            content: Text('Program kerja berhasil $label!'),
            backgroundColor: AppColors.primaryGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
        ref.invalidate(prokerDataListProvider);
        ref.invalidate(pointHistoryProvider);
        ref.invalidate(kelompokKknProvider);
        ref.read(kelompokKknProvider.notifier).fetchKelompok();
        ref.read(mahasiswaControllerProvider.notifier).fetchDashboardData();
      } else {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Gagal memperbarui status. Coba lagi.'),
            backgroundColor: AppColors.dangerRed,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppColors.dangerRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _loadingStatus.remove(id));
    }
  }

  Future<void> _confirmAndUpdate(
    BuildContext context,
    String id,
    String statusBaru,
    String judul,
  ) async {
    final isMulai = statusBaru == 'SEDANG_BERJALAN';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              isMulai ? Icons.play_circle_rounded : Icons.check_circle_rounded,
              color: isMulai ? AppColors.primaryBlue : AppColors.primaryGreen,
              size: 22,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                isMulai ? 'Mulai Kerjakan?' : 'Selesaikan Proker?',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          isMulai
              ? 'Tandai program kerja "$judul" sebagai sedang dikerjakan?\n\n'
                '🚀 Seluruh anggota kelompok akan mendapatkan +2 Poin.'
              : 'Tandai program kerja "$judul" sebagai sudah selesai dilaksanakan?\n\n'
                '🎉 Seluruh anggota kelompok akan mendapatkan +2 Poin tambahan (Total +6 Poin).',
          style: const TextStyle(fontSize: 14, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Batal',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isMulai
                  ? AppColors.primaryBlue
                  : AppColors.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              elevation: 0,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(isMulai ? 'Ya, Mulai' : 'Ya, Selesai'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await _updateStatus(this.context, id, statusBaru);
    }
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '-';
    try {
      final d = DateTime.parse(raw);
      const months = [
        '',
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];
      return '${d.day} ${months[d.month]} ${d.year}';
    } catch (_) {
      return raw.split('T').first;
    }
  }

  Widget _buildProkerCard(BuildContext context, Map<String, dynamic> item) {
    final id = item['id']?.toString() ?? '';
    final judul = item['judul']?.toString() ?? '-';
    final deskripsi = item['deskripsi']?.toString() ?? '-';
    final statusUsulan =
        item['statusUsulan']?.toString() ?? item['status_usulan']?.toString();
    final statusPelaksanaan =
        item['statusPelaksanaan']?.toString() ??
        item['status_pelaksanaan']?.toString();
    final legacyStatus = item['status']?.toString();
    final catatanDpl =
        item['catatanDpl']?.toString() ?? item['catatan_dpl']?.toString() ?? '';
    final createdAtStr = item['createdAt']?.toString();
    final isRevisi = statusUsulan == 'PERLU_REVISI_DPL';
    final isDitolak =
        statusUsulan == 'DITOLAK' ||
        statusUsulan == 'TIDAK_DISETUJUI' ||
        legacyStatus == 'DITOLAK' ||
        legacyStatus == 'TIDAK_DISETUJUI';
    final canEdit = _canEdit(statusUsulan, legacyStatus);
    final canMulai = _canMulai(statusUsulan, statusPelaksanaan, legacyStatus);
    final canSelesaikan = _canSelesaikan(statusPelaksanaan, legacyStatus);
    final isSedangBerjalan =
        canSelesaikan; // SEDANG_BERJALAN = canSelesaikan sudah true
    final isLoading = _loadingStatus[id] == true;
    final hasActionRow = canEdit || canMulai || canSelesaikan;

    return Card(
      elevation: 1.5,
      shadowColor: Colors.black12,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isRevisi
              ? Colors.orange.shade200
              : isDitolak
              ? AppColors.dangerRed.withValues(alpha: 0.2)
              : AppColors.border,
          width: isRevisi || isDitolak ? 1.5 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: id.isNotEmpty
            ? () => Navigator.pushNamed(
                context,
                AppRoutes.prokerDetail,
                arguments: {'id': id},
              )
            : null,
        child: Padding(
          padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Badges baris atas
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                _buildKategoriBadge(item['kategori']),
                _buildUsulanBadge(statusUsulan, legacyStatus),
                if (isSedangBerjalan)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBlue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primaryBlue.withValues(alpha: 0.4),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.play_circle_rounded,
                          size: 11,
                          color: AppColors.primaryBlue,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'Sedang Berjalan',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryBlue,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              judul,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              deskripsi,
              style: const TextStyle(
                fontSize: 13,
                color: Colors.black87,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (createdAtStr != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(
                    Icons.calendar_today_rounded,
                    size: 12,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Diajukan: ${_formatDate(createdAtStr)}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
            if (catatanDpl.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: isRevisi
                      ? Colors.orange.shade50
                      : isDitolak
                      ? Colors.red.shade50
                      : Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isRevisi
                        ? Colors.orange.shade200
                        : isDitolak
                        ? Colors.red.shade200
                        : Colors.amber.shade300,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      isRevisi
                          ? Icons.rate_review_rounded
                          : isDitolak
                          ? Icons.cancel_rounded
                          : Icons.history_rounded,
                      size: 13,
                      color: isRevisi
                          ? Colors.orange.shade700
                          : isDitolak
                          ? Colors.red.shade700
                          : Colors.amber.shade800,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isRevisi
                                ? 'Catatan Revisi DPL:'
                                : isDitolak
                                ? 'Alasan Penolakan:'
                                : 'Catatan DPL Sebelumnya:',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isRevisi
                                  ? Colors.orange.shade700
                                  : isDitolak
                                  ? Colors.red.shade700
                                  : Colors.amber.shade800,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            catatanDpl,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textPrimary,
                              height: 1.3,
                            ),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (hasActionRow && id.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Divider(height: 1),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  // Tombol Edit / Revisi / Ajukan Ulang
                  if (canEdit)
                    TextButton.icon(
                      style: TextButton.styleFrom(
                        foregroundColor: isRevisi
                            ? Colors.orange.shade700
                            : isDitolak
                            ? Colors.red.shade700
                            : AppColors.primary,
                        backgroundColor:
                            (isRevisi
                                    ? Colors.orange
                                    : isDitolak
                                    ? Colors.red
                                    : AppColors.primary)
                                .withValues(alpha: 0.07),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        minimumSize: Size.zero,
                      ),
                      icon: Icon(
                        isRevisi
                            ? Icons.rate_review_rounded
                            : isDitolak
                            ? Icons.refresh_rounded
                            : Icons.edit_rounded,
                        size: 14,
                      ),
                      label: Text(
                        isRevisi
                            ? 'Revisi Sekarang'
                            : isDitolak
                            ? 'Ajukan Ulang'
                            : 'Edit Proker',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () async {
                        await Navigator.pushNamed(
                          context,
                          AppRoutes.editProgramKerja,
                          arguments: {'id': id},
                        );
                        ref.invalidate(prokerDataListProvider);
                      },
                    ),

                  // Spacer antar tombol jika ada dua tombol
                  if (canEdit && (canMulai || canSelesaikan))
                    const SizedBox(width: 8),

                  // Tombol Mulai Kerjakan
                  if (canMulai)
                    isLoading
                        ? const SizedBox(
                            width: 28,
                            height: 28,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primaryBlue,
                            ),
                          )
                        : ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryBlue,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              elevation: 0,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              minimumSize: Size.zero,
                            ),
                            icon: const Icon(
                              Icons.play_circle_rounded,
                              size: 14,
                            ),
                            label: const Text(
                              'Mulai Kerjakan',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            onPressed: () => _confirmAndUpdate(
                              context,
                              id,
                              'SEDANG_BERJALAN',
                              judul,
                            ),
                          ),

                  // Tombol Selesaikan
                  if (canSelesaikan)
                    isLoading
                        ? const SizedBox(
                            width: 28,
                            height: 28,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primaryGreen,
                            ),
                          )
                        : ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryGreen,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 6,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  elevation: 0,
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                  minimumSize: Size.zero,
                                ),
                                icon: const Icon(
                                  Icons.check_circle_rounded,
                                  size: 14,
                                ),
                                label: const Text(
                                  'Selesaikan',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                onPressed: () => _confirmAndUpdate(
                                  context,
                                  id,
                                  'SELESAI',
                                  judul,
                                ),
                              ),
                ],
              ),
            ],
          ],
        ),
      ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final listState = ref.watch(prokerDataListProvider);
    final pemanfaatanAsync = ref.watch(riwayatPemanfaatanProvider);
    final pemanfaatanCount = pemanfaatanAsync.value?.length ?? 0;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Program Kerja Saya',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
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
            icon: Badge(
              isLabelVisible: pemanfaatanCount > 0,
              label: Text(
                '$pemanfaatanCount',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              backgroundColor: AppColors.primaryGreen,
              child: const Icon(Icons.recycling_rounded),
            ),
            tooltip: 'Data Pemanfaatan & Hasil ($pemanfaatanCount Data)',
            onPressed: () async {
              await Navigator.pushNamed(context, AppRoutes.riwayatPemanfaatan);
              ref.invalidate(riwayatPemanfaatanProvider);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Muat Ulang',
            onPressed: () {
              ref.invalidate(prokerDataListProvider);
              ref.invalidate(riwayatPemanfaatanProvider);
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'fab_proker_new',
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 3,
        icon: const Icon(Icons.add_rounded),
        label: const Text(
          'Ajukan Proker',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        onPressed: () async {
          await Navigator.pushNamed(context, AppRoutes.pengajuanProgramKerja);
          ref.invalidate(prokerDataListProvider);
        },
      ),
      body: Column(
        children: [
          _buildStatusFilter(),
          Expanded(
            child: listState.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primaryGreen),
              ),
              error: (err, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.cloud_off_rounded,
                        size: 52,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        err.toString(),
                        style: const TextStyle(color: AppColors.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => ref.invalidate(prokerDataListProvider),
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
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(alpha: 0.08),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.assignment_rounded,
                            size: 48,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Belum ada program kerja',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 40),
                          child: Text(
                            'Tap tombol di bawah untuk mengajukan program kerja baru.',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 80),
                      ],
                    ),
                  );
                }

                final filteredList = _selectedFilterIndex == 0
                    ? list
                    : list
                        .where((item) =>
                            _getProkerStatusCategory(item) ==
                            _selectedFilterIndex)
                        .toList();

                if (filteredList.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _selectedFilterIndex == 1
                                ? Icons.pending_actions_rounded
                                : _selectedFilterIndex == 2
                                    ? Icons.play_circle_outline_rounded
                                    : Icons.task_alt_rounded,
                            size: 40,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          _selectedFilterIndex == 1
                              ? 'Tidak ada proker yang menunggu'
                              : _selectedFilterIndex == 2
                                  ? 'Tidak ada proker yang sedang berjalan'
                                  : 'Belum ada proker yang selesai',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Ganti filter atau ajukan program kerja baru.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 80),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(prokerDataListProvider);
                    ref.invalidate(riwayatPemanfaatanProvider);
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                    itemCount: filteredList.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) =>
                        _buildProkerCard(ctx, filteredList[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
