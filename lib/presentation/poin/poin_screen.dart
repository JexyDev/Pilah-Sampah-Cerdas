import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../domain/entities/point_history_entity.dart';
import '../../domain/entities/bin_entity.dart';
import '../providers/waste_log_provider.dart';
import '../shared/widgets/skeleton_loading.dart';
import '../shared/widgets/empty_state.dart';

/// Halaman poin — sesuai desain:
/// Header biru besar, total poin + ranking, stats 3 kolom, riwayat poin, info poin.
class PoinScreen extends ConsumerWidget {
  const PoinScreen({super.key});

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
            // ─── Header biru besar ─────────────────────────────────────
            SliverToBoxAdapter(
              child: totalAsync.when(
                data: (total) => _buildHeader(context, ref, total),
                loading: () => _buildHeaderSkeleton(context),
                error: (_, __) => _buildHeaderSkeleton(context),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ─── Stats 3 kolom ──────────────────────────────────
                  _buildStatsRow(historyAsync.value ?? []),
                  const SizedBox(height: 20),

                  // ─── Riwayat Poin ───────────────────────────────────
                  const Text(
                    'Riwayat Poin',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),

                  historyAsync.when(
                    data: (history) => history.isEmpty
                        ? const EmptyState(
                            message: 'Belum ada riwayat poin.',
                            icon: Icons.monetization_on_outlined,
                          )
                        : Column(
                            children: history
                                .take(8)
                                .map(
                                  (ph) => Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: _PoinHistoryItem(item: ph),
                                  ),
                                )
                                .toList(),
                          ),
                    loading: () => Column(
                      children: List.generate(
                        3,
                        (index) => const Padding(
                          padding: EdgeInsets.only(bottom: 8.0),
                          child: SkeletonLoading(
                            height: 60,
                            width: double.infinity,
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                        ),
                      ),
                    ),
                    error: (_, __) => EmptyState(
                      message: 'Gagal memuat riwayat poin.',
                      icon: Icons.refresh_rounded,
                      buttonText: 'Coba Lagi',
                      onButtonPressed: () => ref.invalidate(pointHistoryProvider),
                    ),
                  ),

                  const SizedBox(height: 16),
                  // Info Poin card
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
                        Icon(
                          Icons.info_outline_rounded,
                          color: AppColors.primaryGreen,
                          size: 18,
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Poin akan anda dapatkan setelah Setor Sampah menggunakan Bin yang sesuai.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.primaryGreen,
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
        bottom: 28,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Poin Saya',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
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
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.emoji_events_rounded,
                      color: AppColors.warningYellow,
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    rankAsync.when(
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
                      error: (_, __) => const Text(
                        '-',
                        style: TextStyle(
                          color: AppColors.primaryGreen,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (total / 5000).clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: AppColors.backgroundCanvas,
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.primaryGreen,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderSkeleton(BuildContext context) {
    return const SkeletonLoading(
      height: 180,
      width: double.infinity,
      borderRadius: BorderRadius.zero,
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

    for (final h in history) {
      if (!h.createdAt.isBefore(todayStart)) {
        todayPts += h.points;
      }
      if (!h.createdAt.isBefore(weekStart)) {
        weekPts += h.points;
      }
      if (!h.createdAt.isBefore(monthStart)) {
        monthPts += h.points;
      }
    }

    return Row(
      children: [
        _StatsCard(label: 'Hari Ini', value: '$todayPts', sub: 'Poin'),
        const SizedBox(width: 8),
        _StatsCard(
          label: 'Minggu Ini',
          value: '$weekPts',
          sub: 'Poin',
          underline: true,
        ),
        const SizedBox(width: 8),
        _StatsCard(label: 'Bulan Ini', value: '$monthPts', sub: 'Poin'),
      ],
    );
  }
}

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
          border: underline
              ? const Border(
                  bottom: BorderSide(color: AppColors.primaryGreen, width: 2.5),
                )
              : null,
        ),
        child: Column(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            Text(
              sub,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.primaryGreen,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PoinHistoryItem extends StatelessWidget {
  const _PoinHistoryItem({required this.item});
  final PointHistoryEntity item;

  @override
  Widget build(BuildContext context) {
    final bool isOrganic = item.wasteType == WasteType.organic;
    final Color color = isOrganic
        ? AppColors.organicColor
        : AppColors.nonOrganicColor;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.delete_rounded, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOrganic ? 'Setor Sampah Organik' : 'Setor Sampah Anorganik',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  DateFormat(
                    'd MMM yyyy • HH:mm',
                    'id_ID',
                  ).format(item.createdAt.toLocal()),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textHint,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '+${item.points}',
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.primaryGreen,
            ),
          ),
          const SizedBox(width: 2),
          const Text(
            'pts',
            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
