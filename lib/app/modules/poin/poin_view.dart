import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/values/app_colors.dart';
import '../../data/models/point_history_entity.dart';
import '../riwayat/controllers/riwayat_controller.dart';
import '../shared/widgets/skeleton_loading.dart';
import 'views/poin_history_views.dart';
import 'views/marketplace_view.dart';

/// Halaman Poin — Header total poin + ranking + stats,
/// lalu 3 card navigasi: Riwayat, Mutasi, Belanja.
class PoinView extends ConsumerWidget {
  const PoinView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalAsync = ref.watch(totalPointsProvider);
    final historyAsync = ref.watch(pointHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(totalPointsProvider);
          ref.invalidate(pointHistoryProvider);
          ref.invalidate(userLeaderboardRankProvider);
        },
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          slivers: [
            // ─── Header ────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: totalAsync.when(
                skipLoadingOnReload: true,
                data: (total) => _buildHeader(context, ref, total),
                loading: () => const SkeletonLoading(
                  height: 180,
                  width: double.infinity,
                  borderRadius: BorderRadius.zero,
                ),
                error: (_, __) => const SkeletonLoading(
                  height: 180,
                  width: double.infinity,
                  borderRadius: BorderRadius.zero,
                ),
              ),
            ),

            // ─── Stats Row ─────────────────────────────────────────────
            SliverToBoxAdapter(
              child: historyAsync.when(
                skipLoadingOnReload: true,
                data: _buildStatsRow,
                loading: () => _buildStatsRow([]),
                error: (_, __) => _buildStatsRow([]),
              ),
            ),

            // ─── 3 Card Navigasi ───────────────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const SizedBox(height: 8),
                  const Text(
                    'Menu Poin',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Card: Riwayat Poin
                      _MenuCard(
                        icon: Icons.trending_up_rounded,
                        iconColor: AppColors.primaryGreen,
                        iconBg: AppColors.primaryGreen,
                        title: 'Riwayat\nPoin',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const PoinRiwayatView(),
                          ),
                        ),
                      ),
                      // Card: Mutasi Poin
                      _MenuCard(
                        icon: Icons.swap_horiz_rounded,
                        iconColor: AppColors.warningOrange,
                        iconBg: AppColors.warningOrange,
                        title: 'Mutasi\nPoin',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const PoinMutasiView(),
                          ),
                        ),
                      ),
                      // Card: Belanja Marketplace
                      _MenuCard(
                        icon: Icons.storefront_rounded,
                        iconColor: AppColors.primaryBlue,
                        iconBg: AppColors.primaryBlue,
                        title: 'Belanja\nPoin',
                        badge: 'Baru',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MarketplaceView(),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Info card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primaryGreen.withValues(alpha: 0.2),
                      ),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_rounded,
                            color: AppColors.primaryGreen, size: 18),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Poin akan Anda dapatkan setelah menyetor sampah menggunakan tempat sampah yang sesuai.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.primaryGreen,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 80),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, int total) {
    final rankAsync = ref.watch(userLeaderboardRankProvider);

    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        bottom: 20,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (Navigator.canPop(context))
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () => Navigator.pop(context),
                child: const Row(
                  children: [
                    Icon(Icons.arrow_back_rounded,
                        size: 24, color: AppColors.textPrimary),
                    SizedBox(width: 8),
                    Text('Kembali',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          const Text(
            'Poin Saya',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'TOTAL POIN TERKUMPUL',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11,
              letterSpacing: 0.5,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                NumberFormat('#,###').format(total),
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(left: 6, bottom: 4),
                child: Text(
                  'PTS',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.emoji_events_rounded,
                        color: AppColors.warningYellow, size: 16),
                    const SizedBox(width: 4),
                    rankAsync.when(
                      skipLoadingOnReload: true,
                      data: (rank) => Text(
                        rank,
                        style: const TextStyle(
                          color: AppColors.primaryGreen,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      loading: () => const SizedBox(
                        width: 40,
                        height: 12,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primaryGreen,
                        ),
                      ),
                      error: (_, __) => const Text('-',
                          style: TextStyle(
                              color: AppColors.primaryGreen, fontSize: 12)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (total / 5000).clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: AppColors.backgroundCanvas,
              valueColor: const AlwaysStoppedAnimation<Color>(
                  AppColors.primaryGreen),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(List<PointHistoryEntity> history) {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final weekStart = todayStart.subtract(Duration(days: now.weekday - 1));
    final monthStart = DateTime(now.year, now.month, 1);

    int todayPts = 0;
    int weekPts = 0;
    int monthPts = 0;

    for (final h in history.where((h) => h.points > 0)) {
      final d = h.createdAt.toLocal();
      if (!d.isBefore(todayStart)) todayPts += h.points;
      if (!d.isBefore(weekStart)) weekPts += h.points;
      if (!d.isBefore(monthStart)) monthPts += h.points;
    }

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Row(
        children: [
          _StatsCard(label: 'Hari Ini', value: '$todayPts', sub: 'Poin'),
          const SizedBox(width: 8),
          _StatsCard(
              label: 'Minggu Ini',
              value: '$weekPts',
              sub: 'Poin',
              underline: true),
          const SizedBox(width: 8),
          _StatsCard(label: 'Bulan Ini', value: '$monthPts', sub: 'Poin'),
        ],
      ),
    );
  }
}

// ─── Menu Card ─────────────────────────────────────────────────────────────────
class _MenuCard extends StatelessWidget {
  const _MenuCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: iconBg.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: iconColor, size: 28),
                  ),
                  if (badge != null)
                    Positioned(
                      top: -4,
                      right: -8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primaryBlue,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                        child: Text(
                          badge!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  height: 1.2,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
class _StatsCard extends StatelessWidget {
  const _StatsCard({
    required this.label,
    required this.value,
    required this.sub,
    this.underline = false,
  });

  final String label;
  final String value;
  final String sub;
  final bool underline;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(label,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary)),
            const SizedBox(height: 4),
            Text(value,
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            Text(sub,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.primaryGreen)),
          ],
        ),
      ),
    );
  }
}
