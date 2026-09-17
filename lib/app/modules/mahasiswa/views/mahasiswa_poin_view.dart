import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/point_history_entity.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../riwayat/controllers/riwayat_controller.dart'
    show pointHistoryProvider;
import '../controllers/mahasiswa_controller.dart';
import '../controllers/riwayat_kkn_controller.dart';
import '../controllers/kelompok_kkn_controller.dart';
import 'data_proker_view.dart' show prokerDataListProvider;
import '../../../core/utils/input_sanitizer.dart';

/// Halaman Poin KKN Mahasiswa — Menampilkan:
/// 1. Poin Personal Mahasiswa (Presensi, Durasi, Logbook Harian)
/// 2. Skor Kelompok Proker KKN (Langsung dari backend totalGroupPoints atau 0.6 x Proker)
/// 3. Riwayat Perolehan Poin KKN (Bebas dari aktivitas non-poin pemanfaatan/panen)
class MahasiswaPoinView extends ConsumerWidget {
  const MahasiswaPoinView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    final mhsState = ref.watch(mahasiswaControllerProvider);
    final personalPoints = mhsState.dashboard?.personalPoints ?? 0;
    final int groupScoreProker = mhsState.dashboard?.prokerPoints ?? 0;
    final int totalProkerPoints = groupScoreProker; // untuk label total

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(mahasiswaControllerProvider.notifier).fetchAll();
          if (user != null) {
            ref.invalidate(pointHistoryProvider);
            ref.invalidate(prokerDataListProvider);
            ref.invalidate(kelompokKknProvider);
            await ref.read(riwayatKknControllerProvider.notifier).refresh();
          }
        },
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          slivers: [
            // ── 1. Header Putih Bersih dengan Poin Personal & Skor Kelompok ──
            SliverToBoxAdapter(
              child: _buildHeader(
                context,
                user?.name ?? '-',
                personalPoints,
                groupScoreProker,
                totalProkerPoints,
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ── 2. Info Banner Poin KKN ─────────────────────────
                  _buildInfoBanner(),
                  const SizedBox(height: 20),

                  // ── 3. Judul & List Riwayat Poin ────────────────────
                  const Text(
                    'Riwayat Perolehan Poin KKN',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (user != null)
                    _buildPoinHistoryList(
                      ref.watch(pointHistoryProvider),
                    )
                  else
                    const SizedBox.shrink(),
                  const SizedBox(height: 40),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    String name,
    int personalPoints,
    int groupScoreProker,
    int totalProkerPoints,
  ) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white,
            Color(0xFFF8FAFC),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 16,
        right: 16,
        bottom: 20,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (Navigator.canPop(context))
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: AppColors.textPrimary,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              Text(
                'Poin KKN Mahasiswa',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              // Kartu Poin Personal
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                    horizontal: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primaryGreen.withValues(alpha: 0.25),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'POIN PERSONAL',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 10,
                          letterSpacing: 0.8,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            NumberFormat('#,###').format(personalPoints),
                            style: const TextStyle(
                              color: AppColors.primaryGreen,
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(width: 3),
                          const Text(
                            'PTS',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Milik Pribadi',
                        style: TextStyle(
                          color: AppColors.textHint,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Kartu Skor Kelompok Proker
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                    horizontal: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primaryBlue.withValues(alpha: 0.25),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'SKOR PROKER KELOMPOK',
                        style: TextStyle(
                          color: AppColors.primaryBlue,
                          fontSize: 10,
                          letterSpacing: 0.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            groupScoreProker.toString(),
                            style: const TextStyle(
                              color: AppColors.primaryBlue,
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(width: 3),
                          const Text(
                            'PTS',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$totalProkerPoints PTS Total Proker',
                        style: const TextStyle(
                          color: AppColors.textHint,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }


  Widget _buildInfoBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primaryGreen.withValues(alpha: 0.2),
        ),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline_rounded,
                color: AppColors.primaryGreen,
                size: 18,
              ),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Panduan Sistem Poin & Skor KKN:',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryGreen,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 6),
          Text(
            '• Poin Personal (100% Milik Anda): Didapat dari Presensi (+4), Durasi (+3), dan Logbook (+3). Poin ini murni milik Anda dan tidak akan hilang/hangus, melainkan dikumpulkan untuk menyumbang bobot Rata-Rata Kumulatif (40%) ke Poin kelompok.\n\n'
            '• Skor Proker Kelompok (60%): Didapat dari progres kelompok (Diajukan +2, Berjalan +2, Selesai +2). Poin langsung diakumulasikan (cair bertahap) dengan 40% Rata-Rata Kumulatif Anggota tanpa harus menunggu proker 100% selesai.',
            style: TextStyle(
              fontSize: 11,
              color: AppColors.textPrimary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPoinHistoryList(
    AsyncValue<List<PointHistoryEntity>> asyncHistory,
  ) {
    return asyncHistory.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(32),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primaryGreen),
        ),
      ),
      error: (err, stack) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            const Icon(
              Icons.error_outline,
              size: 40,
              color: AppColors.dangerRed,
            ),
            const SizedBox(height: 8),
            Text(
              'Gagal memuat riwayat poin.\n$err',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
      data: (history) {
        final List<PointHistoryEntity> pointLogs = history.where((log) {
          if (log.points == 0) return false;
          final kat = (log.kategori ?? '').toUpperCase();
          if (kat == 'REDUKSI_TONASE') return false; // Pemanfaatan/Panen dipindah ke Riwayat non-poin
          return true;
        }).toList();
        
        pointLogs.sort((a, b) => b.createdAt.compareTo(a.createdAt));

        if (pointLogs.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Column(
              children: [
                Icon(
                  Icons.monetization_on_outlined,
                  size: 40,
                  color: AppColors.textHint,
                ),
                SizedBox(height: 8),
                Text(
                  'Belum ada riwayat perolehan poin.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        }

        return Column(
          children: pointLogs
              .map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _PoinHistoryItem(item: item),
                ),
              )
              .toList(),
        );
      },
    );
  }
}


class _PoinHistoryItem extends StatelessWidget {
  const _PoinHistoryItem({required this.item});

  final PointHistoryEntity item;

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat(
      'dd MMM yyyy, HH:mm',
    ).format(item.createdAt.toLocal());

    final int points = item.points;
    final bool isPenalty = points < 0;
    final String pointsText = isPenalty ? '$points PTS' : '+$points PTS';
    final Color badgeColor =
        isPenalty ? AppColors.dangerRed : AppColors.primaryGreen;

    String title = InputSanitizer.cleanSystemMessage(item.description);
    IconData icon = isPenalty
        ? Icons.warning_amber_rounded
        : Icons.check_circle_outline_rounded;
    Color iconColor = isPenalty ? AppColors.dangerRed : AppColors.primaryGreen;

    if (title.toLowerCase().contains('program kerja') || item.kategori == 'KKN_PROKER') {
      icon = Icons.emoji_events_rounded;
      iconColor = AppColors.primaryBlue;
    } else if (title.toLowerCase().contains('aktivasi')) {
      title = 'Aktivasi Tempat Sampah Warga';
      icon = Icons.qr_code_scanner_rounded;
    } else if (title.toLowerCase().contains('pemanfaatan')) {
      if (!title.toLowerCase().startsWith('laporan')) {
        title = 'Laporan Pemanfaatan Sampah: $title';
      }
      icon = Icons.recycling_rounded;
    } else if (title.toLowerCase().contains('geofence') ||
        title.toLowerCase().contains('presensi')) {
      title = 'Ping Lokasi Posko / Presensi';
      icon = Icons.location_on_rounded;
    } else if (title.toLowerCase().contains('registrasi')) {
      title = 'Bonus Registrasi Akun Mahasiswa KKN';
      icon = Icons.card_giftcard_rounded;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  formattedDate,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            pointsText,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: badgeColor,
            ),
          ),
        ],
      ),
    );
  }
}
