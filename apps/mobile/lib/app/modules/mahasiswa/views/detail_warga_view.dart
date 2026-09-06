import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../controllers/detail_warga_controller.dart';

class DetailWargaView extends ConsumerStatefulWidget {
  const DetailWargaView({super.key});

  @override
  ConsumerState<DetailWargaView> createState() => _DetailWargaViewState();
}

class _DetailWargaViewState extends ConsumerState<DetailWargaView> {
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final warga = ModalRoute.of(context)?.settings.arguments as WargaDampingan?;
      if (warga != null) {
        Future.microtask(() {
          ref.read(detailWargaControllerProvider.notifier).setWarga(warga);
        });
      }
      _initialized = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(detailWargaControllerProvider);
    final warga = state.warga;

    if (warga == null) {
      return Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        appBar: AppBar(
          backgroundColor: AppColors.primaryGreen,
          foregroundColor: Colors.white,
          title: const Text('Detail Warga'),
        ),
        body: const Center(
          child: Text('Data warga tidak tersedia.', style: TextStyle(color: AppColors.textSecondary)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: CustomScrollView(
        slivers: [
          // ── App Bar + Header ────────────────────────────────
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: AppColors.primaryGreen,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primaryGreen,
                      AppColors.primaryBlueDark,
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            // Avatar besar
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  warga.wargaName.isNotEmpty
                                      ? warga.wargaName[0].toUpperCase()
                                      : '?',
                                  style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    warga.wargaName,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined,
                                          size: 14, color: Colors.white70),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          warga.address,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.white70,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            title: const Text(
              'Detail Warga',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
            ),
          ),

          // ── Content ────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.all(AppDimensions.md),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Status badge
                if (warga.needsReeducation)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: AppDimensions.md),
                    decoration: BoxDecoration(
                      color: AppColors.warningOrange.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
                      border: Border.all(color: AppColors.warningOrange.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded, color: AppColors.warningOrange, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Warga ini membutuhkan edukasi ulang. Tingkat kesalahan: ${warga.errorPercentage.toStringAsFixed(1)}%',
                            style: const TextStyle(fontSize: 12, color: AppColors.warningOrange, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Stat Cards
                _buildStatCards(warga, state),
                const SizedBox(height: AppDimensions.md),

                // Chart Section
                _buildChartSection(warga),
                const SizedBox(height: AppDimensions.md),

                // Riwayat Section
                _buildRiwayatSection(warga),
                const SizedBox(height: AppDimensions.lg),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Stat Cards
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildStatCards(WargaDampingan warga, DetailWargaState state) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  label: 'Total Aktivitas',
                  value: '${warga.totalActivities}',
                  color: AppColors.primaryGreen,
                  icon: Icons.analytics_outlined,
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.divider),
              Expanded(
                child: _StatItem(
                  label: 'Total Berat',
                  value: '${state.totalWeightKg.toStringAsFixed(1)} kg',
                  color: AppColors.primaryBlueDark,
                  icon: Icons.scale_outlined,
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: AppColors.divider),
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  label: 'Benar',
                  value: '${warga.correctCount} (${warga.correctPercentage.toStringAsFixed(0)}%)',
                  color: AppColors.success,
                  icon: Icons.check_circle_outline_rounded,
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.divider),
              Expanded(
                child: _StatItem(
                  label: 'Salah',
                  value: '${warga.incorrectCount} (${warga.errorPercentage.toStringAsFixed(0)}%)',
                  color: AppColors.dangerRed,
                  icon: Icons.cancel_outlined,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Chart Section (Horizontal Bar)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildChartSection(WargaDampingan warga) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Distribusi Pemilahan',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),

          // Bar — Benar
          _HorizontalBar(
            label: 'Pemilahan Benar',
            percentage: warga.correctPercentage,
            color: AppColors.success,
          ),
          const SizedBox(height: 12),

          // Bar — Salah
          _HorizontalBar(
            label: 'Pemilahan Salah',
            percentage: warga.errorPercentage,
            color: AppColors.dangerRed,
          ),

          const SizedBox(height: 16),

          // Kategori breakdown
          if (warga.recentLogs.isNotEmpty) ...[
            const Divider(color: AppColors.divider),
            const SizedBox(height: 8),
            const Text(
              'Distribusi Kategori',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            ..._buildCategoryBreakdown(warga),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildCategoryBreakdown(WargaDampingan warga) {
    final Map<String, int> categoryCount = {};
    for (final log in warga.recentLogs) {
      categoryCount[log.category] = (categoryCount[log.category] ?? 0) + 1;
    }
    final total = warga.recentLogs.length;

    return categoryCount.entries.map((entry) {
      final pct = total > 0 ? (entry.value / total) * 100 : 0.0;
      final isOrganic = entry.key.toUpperCase() == 'ORGANIK';
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: _HorizontalBar(
          label: entry.key,
          percentage: pct,
          color: isOrganic ? AppColors.success : AppColors.primaryBlue,
        ),
      );
    }).toList();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Riwayat Section
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildRiwayatSection(WargaDampingan warga) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Riwayat Pemilahan',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                '${warga.recentLogs.length} catatan',
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (warga.recentLogs.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text(
                  'Belum ada riwayat pemilahan',
                  style: TextStyle(color: AppColors.textHint, fontSize: 13),
                ),
              ),
            )
          else
            ...warga.recentLogs.map((log) => _RiwayatItem(log: log)),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Subwidgets
// ═══════════════════════════════════════════════════════════════════════════════

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}

class _HorizontalBar extends StatelessWidget {
  const _HorizontalBar({
    required this.label,
    required this.percentage,
    required this.color,
  });

  final String label;
  final double percentage;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            Text(
              '${percentage.toStringAsFixed(1)}%',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
          child: LinearProgressIndicator(
            value: percentage / 100,
            minHeight: 8,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}

class _RiwayatItem extends StatelessWidget {
  const _RiwayatItem({required this.log});

  final WasteLogEntry log;

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd/MM/yyyy').format(log.createdAt);
    final timeStr = DateFormat('HH:mm').format(log.createdAt);
    final isOrganic = log.category.toUpperCase() == 'ORGANIK';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.backgroundCanvas,
          borderRadius: BorderRadius.circular(AppDimensions.radiusSm),
        ),
        child: Row(
          children: [
            // Category icon
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isOrganic
                    ? AppColors.success.withValues(alpha: 0.1)
                    : AppColors.primaryBlue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                isOrganic ? Icons.eco_rounded : Icons.recycling_rounded,
                color: isOrganic ? AppColors.success : AppColors.primaryBlue,
                size: 18,
              ),
            ),
            const SizedBox(width: 10),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        log.category,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${log.weightKg.toStringAsFixed(1)} kg',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$dateStr • $timeStr',
                    style: const TextStyle(fontSize: 11, color: AppColors.textHint),
                  ),
                ],
              ),
            ),

            // Status
            Icon(
              log.isCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
              color: log.isCorrect ? AppColors.success : AppColors.dangerRed,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
