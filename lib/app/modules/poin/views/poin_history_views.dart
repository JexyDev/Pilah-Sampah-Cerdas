import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/point_history_entity.dart';
import '../../../data/models/bin_entity.dart';
import '../../riwayat/controllers/riwayat_controller.dart';
import '../../shared/widgets/skeleton_loading.dart';
import '../../shared/widgets/empty_state.dart';

/// Halaman Riwayat Poin — menampilkan poin masuk (positif) dari backend.
class PoinRiwayatView extends ConsumerWidget {
  const PoinRiwayatView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(pointHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Riwayat Poin',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primaryGreen),
            onPressed: () => ref.invalidate(pointHistoryProvider),
          ),
        ],
      ),
      body: historyAsync.when(
        skipLoadingOnReload: true,
        data: (history) {
          final filtered = history.where((h) => h.points > 0).toList();
          if (filtered.isEmpty) {
            return const Center(
              child: EmptyState(
                message: 'Belum ada poin yang diperoleh.',
                icon: Icons.trending_up_rounded,
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(pointHistoryProvider),
            color: AppColors.primaryGreen,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _PoinHistoryItem(item: filtered[i]),
            ),
          );
        },
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 5,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, __) => const SkeletonLoading(
            height: 72,
            width: double.infinity,
            borderRadius: BorderRadius.all(Radius.circular(12)),
          ),
        ),
        error: (_, __) => Center(
          child: EmptyState(
            message: 'Gagal memuat data riwayat poin.',
            icon: Icons.refresh_rounded,
            buttonText: 'Coba Lagi',
            onButtonPressed: () => ref.invalidate(pointHistoryProvider),
          ),
        ),
      ),
    );
  }
}

/// Halaman Mutasi Poin — menampilkan poin keluar (negatif) dari backend.
class PoinMutasiView extends ConsumerWidget {
  const PoinMutasiView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(pointHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Mutasi Poin',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primaryGreen),
            onPressed: () => ref.invalidate(pointHistoryProvider),
          ),
        ],
      ),
      body: historyAsync.when(
        skipLoadingOnReload: true,
        data: (history) {
          final filtered = history.where((h) => h.points < 0).toList();
          if (filtered.isEmpty) {
            return const Center(
              child: EmptyState(
                message: 'Belum ada mutasi (pengeluaran) poin.',
                icon: Icons.swap_horiz_rounded,
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(pointHistoryProvider),
            color: AppColors.primaryGreen,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) => _PoinHistoryItem(item: filtered[i]),
            ),
          );
        },
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 5,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, __) => const SkeletonLoading(
            height: 72,
            width: double.infinity,
            borderRadius: BorderRadius.all(Radius.circular(12)),
          ),
        ),
        error: (_, __) => Center(
          child: EmptyState(
            message: 'Gagal memuat data mutasi poin.',
            icon: Icons.refresh_rounded,
            buttonText: 'Coba Lagi',
            onButtonPressed: () => ref.invalidate(pointHistoryProvider),
          ),
        ),
      ),
    );
  }
}

// ─── Riwayat Item Widget ──────────────────────────────────────────────────────
class _PoinHistoryItem extends StatelessWidget {
  const _PoinHistoryItem({required this.item});
  final PointHistoryEntity item;

  @override
  Widget build(BuildContext context) {
    final String descLower = item.description.toLowerCase();

    bool isAktivasi =
        descLower.contains('aktivasi') || descLower.contains('activation');
    bool isPunishment =
        item.points < 0 ||
        descLower.contains('penalti') ||
        descLower.contains('punishment');
    bool isRedeem =
        descLower.contains('redeem') || descLower.contains('tukar');
    bool isPresensi =
        descLower.contains('presensi') || descLower.contains('geofence');
    bool isMarketplace =
        descLower.contains('marketplace') || descLower.contains('belanja');

    if (!isAktivasi && !isPunishment && !isRedeem && !isPresensi) {
      if (item.points == 10 &&
          !descLower.contains('setor') &&
          !descLower.contains('sampah')) {
        isAktivasi = true;
      }
    }

    final bool isOrganic = item.wasteType == WasteType.organic;

    final Color color = isPunishment
        ? AppColors.dangerRed
        : isMarketplace
            ? AppColors.warningOrange
            : (isAktivasi || isPresensi
                ? Colors.blue
                : (isOrganic
                    ? AppColors.organicColor
                    : AppColors.nonOrganicColor));

    final IconData iconData = isMarketplace
        ? Icons.storefront_rounded
        : isPunishment
            ? Icons.warning_rounded
            : (isAktivasi
                ? Icons.qr_code_scanner_rounded
                : (isPresensi
                    ? Icons.location_on_rounded
                    : Icons.delete_rounded));

    String title =
        isOrganic ? 'Setor Sampah Organik' : 'Setor Sampah Anorganik';
    if (isMarketplace) {
      title = 'Belanja Marketplace';
    } else if (isAktivasi) {
      title = 'Aktivasi Tempat Sampah Berhasil';
    } else if (isPunishment) {
      title = 'Penalti Pengurangan Poin';
    } else if (isPresensi) {
      title = 'Presensi Berhasil';
    } else if (isRedeem) {
      title = 'Penukaran Poin';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: iconData == Icons.delete_rounded
                ? Image.asset(
                    'assets/icons/recycle-bin.png',
                    color: color,
                    width: 24,
                    height: 24,
                  )
                : Icon(iconData, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.schedule_rounded,
                        size: 13, color: AppColors.textHint),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat('d MMM yyyy • HH:mm', 'id_ID')
                          .format(item.createdAt.toLocal()),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textHint,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Row(
            children: [
              Text(
                isPunishment
                    ? '-${item.points.abs()}'
                    : '+${item.points.abs()}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isPunishment
                      ? AppColors.dangerRed
                      : AppColors.primaryGreen,
                ),
              ),
              const SizedBox(width: 2),
              const Text(
                'pts',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
