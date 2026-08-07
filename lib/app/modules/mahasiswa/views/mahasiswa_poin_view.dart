import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/point_history_entity.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/mahasiswa_controller.dart';
import '../../riwayat/controllers/riwayat_controller.dart';

/// Halaman Poin KKN Mahasiswa — Mengikuti gaya visual Page Poin Warga:
/// Header Putih Bersih, Total Poin KKN + Status Ranking, Stats 3 Kolom,
/// Banner Panduan Poin, dan List Riwayat Perolehan Poin KKN.
class MahasiswaPoinView extends ConsumerWidget {
  const MahasiswaPoinView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mhsState = ref.watch(mahasiswaControllerProvider);
    final user = ref.watch(authProvider).user;
    final totalPoints = mhsState.dashboard?.contributionPoints ?? 0;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(mahasiswaControllerProvider.notifier).fetchAll();
          if (user != null) {
            ref.invalidate(pointHistoryProvider);
          }
        },
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          slivers: [
            // ── 1. Header Putih Bersih ──────────────────────────────
            SliverToBoxAdapter(
              child: _buildHeader(context, user?.name ?? 'Mahasiswa KKN', totalPoints),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ── 2. Stats 3 Kolom ──────────────────────────────
                  _buildStatsRow(mhsState),
                  const SizedBox(height: 16),

                  // ── 3. Info Banner Poin KKN ─────────────────────────
                  _buildInfoBanner(),
                  const SizedBox(height: 20),

                  // ── 4. Judul & List Riwayat Poin ────────────────────
                  const Text(
                    'Riwayat Perolehan Poin KKN',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
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

  Widget _buildHeader(BuildContext context, String name, int totalPoints) {
    return Container(
      color: Colors.white,
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
                    icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              const Text(
                'Poin KKN Mahasiswa',
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
            'TOTAL POIN KKN TERKUMPUL',
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
                NumberFormat('#,###').format(totalPoints),
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
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(MahasiswaState mhsState) {
    final wargaCount = mhsState.wargaList.where((w) => w.isActivated).length;
    final points = mhsState.dashboard?.contributionPoints ?? 0;

    return Row(
      children: [
        Expanded(
          child: _StatCard(
            title: 'Presensi',
            value: '${(points / 10).floor()} Hari',
            icon: Icons.location_on_rounded,
            color: AppColors.primaryGreen,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCard(
            title: 'Tempat Sampah Aktif',
            value: '$wargaCount Warga',
            icon: Icons.qr_code_scanner_rounded,
            color: AppColors.primaryBlueDark,
          ),
        ),
        const SizedBox(width: 8),
        const Expanded(
          child: _StatCard(
            title: 'Pemanfaatan',
            value: 'Laporan',
            icon: Icons.recycling_rounded,
            color: AppColors.warningOrange,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.2)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Poin KKN diperoleh dari presensi geofence (+10 PTS), aktivasi tempat sampah warga (+15 PTS), dan laporan pemanfaatan daur ulang.',
              style: TextStyle(fontSize: 11, color: AppColors.primaryGreen, height: 1.3),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPoinHistoryList(AsyncValue<List<PointHistoryEntity>> asyncHistory) {
    return asyncHistory.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(32),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primaryGreen),
        ),
      ),
      error: (err, _) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            const Icon(Icons.error_outline, size: 40, color: AppColors.dangerRed),
            const SizedBox(height: 8),
            Text(
              'Gagal memuat riwayat poin.\n$err',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
      data: (history) {
        if (history.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: const Column(
              children: [
                Icon(Icons.monetization_on_outlined, size: 40, color: AppColors.textHint),
                SizedBox(height: 8),
                Text(
                  'Belum ada riwayat perolehan poin.',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          );
        }

        return Column(
          children: history
              .map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _PoinHistoryItem(item: item),
                  ))
              .toList(),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _PoinHistoryItem extends StatelessWidget {
  const _PoinHistoryItem({required this.item});

  final PointHistoryEntity item;

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(item.createdAt);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.add_circle_outline_rounded,
              color: AppColors.primaryGreen,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.description,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
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
