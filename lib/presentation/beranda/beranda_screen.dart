import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_assets.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../../core/router/app_router.dart';
import '../../domain/entities/bin_entity.dart';
import '../../domain/entities/waste_log_entity.dart';
import '../providers/auth_provider.dart';
import '../providers/bin_provider.dart';
import '../providers/waste_log_provider.dart';
import '../providers/connectivity_provider.dart';
import '../shared/widgets/app_loading.dart';
import '../shared/widgets/app_error.dart';

/// Halaman beranda — sesuai desain:
/// Header biru, avatar+nama+RT/RW, stats card, Aksi Cepat, Riwayat.
class BerandaScreen extends ConsumerWidget {
  const BerandaScreen({
    super.key,
    this.onNavigateToHistory,
  });

  final VoidCallback? onNavigateToHistory;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final totalPointsAsync = ref.watch(totalPointsProvider);
    final wasteLogsAsync = ref.watch(wasteLogsProvider);
    final bool isOnline = ref.watch(isOnlineProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(binsProvider);
          ref.invalidate(totalPointsProvider);
          ref.invalidate(wasteLogsProvider);
        },
        color: AppColors.primaryBlue,
        child: CustomScrollView(
          slivers: [
            // ─── Header Biru ─────────────────────────────────────────────
            SliverToBoxAdapter(
              child: _buildHeader(
                context,
                user?.name ?? 'Warga',
                user?.rtRw ?? 'RT 04 / RW 02',
                isOnline,
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(AppDimensions.md),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ─── Stats Card ──────────────────────────────────────
                  totalPointsAsync.when(
                    data: (total) => _buildStatsCard(context, total),
                    loading: () => const AppLoading(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                  const SizedBox(height: AppDimensions.md),

                  // ─── Aksi Cepat ──────────────────────────────────────
                  const Text(
                    'Aksi Cepat',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: AppDimensions.sm),
                  _buildAksiCepat(context, isOnline),

                  const SizedBox(height: AppDimensions.lg),

                  // ─── Riwayat Terakhir ────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Riwayat Terakhir',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      TextButton(
                        onPressed: onNavigateToHistory,
                        child: const Text(
                          'Lihat Semua',
                          style: TextStyle(
                            color: AppColors.primaryBlue,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppDimensions.sm),

                  wasteLogsAsync.when(
                    data: (logs) => logs.isEmpty
                        ? _buildEmptyLogs(context)
                        : Column(
                            children: logs
                                .take(5)
                                .map(
                                  (log) => Padding(
                                    padding: const EdgeInsets.only(
                                      bottom: AppDimensions.sm,
                                    ),
                                    child: _RiwayatCard(log: log),
                                  ),
                                )
                                .toList(),
                          ),
                    loading: () => const AppLoading(),
                    error: (_, __) => AppError(
                      message: 'Gagal memuat riwayat.',
                      onRetry: () => ref.invalidate(wasteLogsProvider),
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

  Widget _buildHeader(
    BuildContext context,
    String name,
    String rtRw,
    bool isOnline,
  ) {
    return Container(
      color: AppColors.primaryBlue,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 16,
        right: 16,
        bottom: 24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Baris atas: Avatar + Nama + RT/RW
          Row(
            children: [
              // Avatar logo
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.asset(
                  AppAssets.logo,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.person, color: AppColors.primaryBlue),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getGreeting(),
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // RT/RW chip
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      color: Colors.white,
                      size: 13,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      rtRw,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getGreeting() {
    final h = DateTime.now().hour;
    if (h < 11) return 'Selamat Pagi,';
    if (h < 15) return 'Selamat Siang,';
    if (h < 18) return 'Selamat Sore,';
    return 'Selamat Malam,';
  }

  Widget _buildStatsCard(BuildContext context, int totalPoints) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Consumer(
        builder: (context, ref, _) {
          final dailyAsync = ref.watch(dailyPointsProvider);
          final daily = dailyAsync.maybeWhen(data: (v) => v, orElse: () => 0);
          return Row(
            children: [
              _StatItem(
                icon: Icons.star_border_rounded,
                iconColor: AppColors.primaryBlue,
                value: daily.toString(),
                label: 'Hari Ini',
              ),
              _VerticalDivider(),
              _StatItem(
                icon: Icons.account_balance_wallet_outlined,
                iconColor: AppColors.primaryGreen,
                value: NumberFormat('#,###').format(totalPoints),
                label: 'Total Points',
                valueColor: AppColors.primaryGreen,
              ),
              _VerticalDivider(),
              const _StatItem(
                icon: Icons.emoji_events_outlined,
                iconColor: AppColors.warningYellow,
                value: '-',
                label: 'Peringkat',
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAksiCepat(BuildContext context, bool isOnline) {
    return Row(
      children: [
        // Scan Sampah — hijau/biru gradient
        Expanded(
          child: GestureDetector(
            onTap: isOnline
                ? () => Navigator.of(context).pushNamed(AppRoutes.scan)
                : null,
            child: AnimatedOpacity(
              opacity: isOnline ? 1.0 : 0.5,
              duration: const Duration(milliseconds: 200),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 18,
                  horizontal: 16,
                ),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1B5E20), Color(0xFF4CAF50)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.qr_code_scanner_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Scan Sampah',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Aktivasi Bin — outline biru
        Expanded(
          child: GestureDetector(
            onTap: () => Navigator.of(context).pushNamed(AppRoutes.aktivasiBin),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primaryBlue, width: 1.5),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.sensors_rounded,
                    color: AppColors.primaryBlue,
                    size: 28,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Aktivasi Bin',
                    style: TextStyle(
                      color: AppColors.primaryBlue,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyLogs(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Belum ada riwayat.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
    this.valueColor,
  });

  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 26),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: valueColor ?? AppColors.textPrimary,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 50,
      color: AppColors.border,
      margin: const EdgeInsets.symmetric(horizontal: 8),
    );
  }
}

class _RiwayatCard extends StatelessWidget {
  const _RiwayatCard({required this.log});
  final WasteLogEntity log;

  @override
  Widget build(BuildContext context) {
    final bool isOrganic = log.wasteType == WasteType.organic;
    final Color bgColor = isOrganic
        ? AppColors.organicColor
        : AppColors.nonOrganicColor;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6),
        ],
      ),
      child: Row(
        children: [
          // Icon tong
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: bgColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.delete_rounded, color: bgColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOrganic ? 'Sampah Organik' : 'Sampah Non-Organik',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Dibuang pada: ${DateFormat('HH:mm', 'id_ID').format(log.createdAt)} WIB',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                Row(
                  children: [
                    const Icon(
                      Icons.star_rounded,
                      color: AppColors.warningYellow,
                      size: 13,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      '+${log.pointsAwarded} Poin',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.warningYellow,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.statusSelesaiBg,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'SELESAI',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: AppColors.statusSelesai,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
