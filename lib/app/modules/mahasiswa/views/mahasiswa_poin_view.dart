import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/models/point_history_entity.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../riwayat/controllers/riwayat_controller.dart'
    show pointHistoryProvider;
import '../controllers/mahasiswa_controller.dart';
import '../controllers/riwayat_kkn_controller.dart';
import '../../../core/utils/input_sanitizer.dart';

/// Halaman Poin KKN Mahasiswa — Mengikuti gaya visual Page Poin Warga:
/// Header Putih Bersih, Total Poin KKN + Status Ranking, Stats 3 Kolom,
/// Banner Panduan Poin, dan List Riwayat Perolehan Poin KKN.
class MahasiswaPoinView extends ConsumerWidget {
  const MahasiswaPoinView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mhsState = ref.watch(mahasiswaControllerProvider);
    final user = ref.watch(authProvider).user;

    final personalPoints = mhsState.dashboard?.contributionPoints ?? 0;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(mahasiswaControllerProvider.notifier).fetchAll();
          if (user != null) {
            ref.invalidate(pointHistoryProvider);
            await ref.read(riwayatKknControllerProvider.notifier).refresh();
            ref.invalidate(pengajuanIzinCountProvider);
          }
        },
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          slivers: [
            // ── 1. Header Putih Bersih ──────────────────────────────
            SliverToBoxAdapter(
              child: _buildHeader(context, user?.name ?? '-', personalPoints),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ── 3. Info Banner Poin KKN ─────────────────────────
                  _buildInfoBanner(),
                  const SizedBox(height: 20),

                  // ── 4. Judul & List Riwayat Poin ────────────────────
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
                    _buildPoinHistoryList(ref.watch(pointHistoryProvider))
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

  Widget _buildHeader(BuildContext context, String name, int personalPoints) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white,
            Color(0xFFF8FAFC),
          ], // F8FAFC is typical backgroundCanvas
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        bottom: 24,
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
          const SizedBox(height: 20),
          Center(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Text(
                  'POIN PERSONAL',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      NumberFormat('#,###').format(personalPoints),
                      style: const TextStyle(
                        color: AppColors.primaryGreen,
                        fontSize: 40,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'PTS',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
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
      child: const Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: AppColors.primaryGreen,
            size: 20,
          ),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Poin KKN harian diperoleh dari Check-In (+4 PTS), Kepulangan/Durasi Terpenuhi (+3 PTS), dan Logbook Harian (+3 PTS) dengan total 10 PTS per hari.',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.primaryGreen,
                height: 1.3,
              ),
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
        // Filter logs that actually have points awarded for the Poin View
        final pointLogs = history.where((log) => log.points > 0).toList();

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

    // Map description to standardized title
    String title = InputSanitizer.cleanSystemMessage(item.description);
    IconData icon = Icons.check_circle_outline_rounded;

    if (title.toLowerCase().contains('aktivasi')) {
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
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primaryGreen, size: 20),
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
            '+${item.points} PTS',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }
}
