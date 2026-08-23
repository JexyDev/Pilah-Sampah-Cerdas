import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';

final programKerjaListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.read(kknRepositoryProvider);
  return repo.getProgramKerja();
});

class RiwayatProgramKerjaView extends ConsumerWidget {
  const RiwayatProgramKerjaView({super.key});

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
      label = 'Disetujui Oleh DPL';
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
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildPelaksanaanBadge(String? statusPelaksanaan, String? legacyStatus, String? waktuPelaksanaan) {
    String p = (statusPelaksanaan ?? '').toUpperCase();
    final leg = (legacyStatus ?? '').toUpperCase();
    if (p.isEmpty) {
      if (leg == 'SELESAI') {
        p = 'SELESAI';
      } else if (leg == 'SEDANG_BERJALAN' || leg == 'SEDANG_DILAKSANAKAN' || leg == 'BERJALAN') {
        p = 'SEDANG_BERJALAN';
      } else {
        p = 'BELUM_MULAI';
      }
    }

    bool isExpired = false;
    if (waktuPelaksanaan != null && waktuPelaksanaan.isNotEmpty) {
      // Coba parse tanggal terakhir (misal YYYY-MM-DD dari string '2026-08-08 s/d 2026-08-20')
      final yyyyMmDd = RegExp(r'(\d{4})-(\d{2})-(\d{2})');
      final matches = yyyyMmDd.allMatches(waktuPelaksanaan);
      if (matches.isNotEmpty) {
        final lastMatch = matches.last.group(0)!;
        final endDate = DateTime.tryParse(lastMatch);
        if (endDate != null && DateTime.now().isAfter(endDate.add(const Duration(days: 1)))) {
          isExpired = true;
        }
      }
    }

    if (isExpired && p != 'SELESAI') {
      p = 'BERAKHIR';
    }

    Color color;
    String label;

    if (p == 'SELESAI') {
      color = AppColors.primaryGreen;
      label = 'Selesai';
    } else if (p == 'BERAKHIR') {
      color = AppColors.dangerRed;
      label = 'Berakhir';
    } else if (p == 'SEDANG_BERJALAN' || p == 'SEDANG_DILAKSANAKAN' || p == 'BERJALAN') {
      color = AppColors.primaryBlue;
      label = 'Sedang Berlangsung';
    } else {
      color = AppColors.textSecondary;
      label = p.replaceAll('_', ' ');
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }

  Widget _buildKategoriBadge(String? kategori) {
    final raw = (kategori ?? 'Pemilahan').toLowerCase();
    Color color;
    String label;

    if (raw.contains('pemilahan') || raw.contains('pilah')) {
      color = AppColors.primaryGreen;
      label = 'Pemilahan';
    } else if (raw.contains('pengangkutan') || raw.contains('angkut')) {
      color = AppColors.primaryBlue;
      label = 'Pengangkutan';
    } else if (raw.contains('pengolahan') || raw.contains('olah')) {
      color = const Color(0xFF7C3AED); // Purple
      label = 'Pengolahan';
    } else if (raw.contains('pemanfaatan') || raw.contains('manfaat') || raw == 'fisik') {
      color = const Color(0xFF0D9488); // Teal
      label = 'Pemanfaatan';
    } else if (raw.contains('edukasi') || raw.contains('sosialisasi') || raw == 'non-fisik') {
      color = const Color(0xFFD97706); // Amber
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
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString);
      return "${date.day.toString().padLeft(2, '0')}-${date.month.toString().padLeft(2, '0')}-${date.year}";
    } catch (_) {
      return isoString.split('T').first;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prokerState = ref.watch(programKerjaListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Program Kerja KKN', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppColors.border, height: 1),
        ),
      ),
      body: prokerState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text(err.toString(), style: const TextStyle(color: AppColors.dangerRed))),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('Belum ada program kerja yang diajukan.'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.refresh(programKerjaListProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = list[index];
                final deskripsi = item['deskripsi'] ?? item['judul'] ?? '-';
                final statusUsulan = item['statusUsulan'] ?? item['status_usulan'];
                final statusPelaksanaan = item['statusPelaksanaan'] ?? item['status_pelaksanaan'];
                final legacyStatus = item['status']?.toString();
                final catatanDpl = item['catatanDpl'] ?? item['catatan_dpl'];
                final waktuPelaksanaanStr = item['waktuPelaksanaan']?.toString() ?? item['tanggal']?.toString() ?? '-';
                final createdAtStr = item['createdAt']?.toString() ?? item['dibuat_pada']?.toString();

                return Card(
                  elevation: 1.5,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                deskripsi,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            _buildKategoriBadge(item['kategori']),
                            _buildUsulanBadge(statusUsulan, legacyStatus),
                            _buildPelaksanaanBadge(statusPelaksanaan, legacyStatus, waktuPelaksanaanStr),
                          ],
                        ),
                        const SizedBox(height: 6),
                        if (createdAtStr != null)
                          Text(
                            '📅 Diajukan Pada: ${_formatDate(createdAtStr)}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        if (waktuPelaksanaanStr != '-')
                          Builder(
                            builder: (context) {
                              String mulai = waktuPelaksanaanStr;
                              String berakhir = '-';
                              if (waktuPelaksanaanStr.contains(' s/d ')) {
                                final parts = waktuPelaksanaanStr.split(' s/d ');
                                if (parts.length >= 2) {
                                  mulai = _formatDate(parts[0].trim());
                                  berakhir = _formatDate(parts[1].trim());
                                }
                              } else {
                                mulai = _formatDate(waktuPelaksanaanStr);
                                berakhir = mulai;
                              }
                              return Padding(
                                padding: const EdgeInsets.only(top: 4.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '🚀 Mulai: $mulai',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '🛑 Berakhir: $berakhir',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        if (catatanDpl != null && catatanDpl.toString().trim().isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.backgroundCanvas,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.feedback_outlined, size: 16, color: AppColors.dangerRed),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Catatan DPL: $catatanDpl',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
