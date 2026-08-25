import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/detail_warga_controller.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/kelompok_kkn_controller.dart';

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
      final rawArgs = ModalRoute.of(context)?.settings.arguments;
      WargaDampingan? targetWarga;

      if (rawArgs is WargaDampingan) {
        targetWarga = rawArgs;
      } else if (rawArgs is Map<String, dynamic>) {
        try {
          final wargaMap = rawArgs['warga'] as Map<String, dynamic>? ?? rawArgs;
          targetWarga = WargaDampingan.fromJson(wargaMap);
        } catch (_) {}
      } else if (rawArgs is String && rawArgs.isNotEmpty) {
        final all = ref.read(mahasiswaControllerProvider).wargaList;
        targetWarga = all.where((w) => w.wargaId == rawArgs).firstOrNull;
      }

      if (targetWarga != null) {
        Future.microtask(() {
          ref.read(detailWargaControllerProvider.notifier).setWarga(targetWarga!);
        });
      }
      _initialized = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(detailWargaControllerProvider);
    final warga = state.warga;
    final currentUser = ref.watch(authProvider).user;
    final kelompokState = ref.watch(kelompokKknProvider);

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
            expandedHeight: 205,
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
                      AppColors.successDark,
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
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.delete_outline_rounded,
                                          size: 14, color: Colors.white70),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          warga.binId.isEmpty || warga.binId == 'Belum Ada Tempat Sampah'
                                              ? 'Belum Ada Tempat Sampah'
                                              : 'ID Tempat Sampah: ${warga.binId}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.white,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (warga.isActivated) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withValues(alpha: 0.2),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: Colors.white38),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.verified_rounded, size: 12, color: Colors.white),
                                              const SizedBox(width: 4),
                                              Flexible(
                                                child: Builder(builder: (_) {
                                                  String mName = warga.pendampingName;
                                                  if (mName.isEmpty && warga.mahasiswaId.isNotEmpty) {
                                                    final mem = kelompokState.kelompok?.members.where((m) => m.userId == warga.mahasiswaId).firstOrNull;
                                                    if (mem != null) mName = mem.name;
                                                  }
                                                  return Text(
                                                    mName.isNotEmpty
                                                        ? 'Diaktivasi oleh: $mName'
                                                        : 'Aktivasi Mandiri',
                                                    style: const TextStyle(
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.bold,
                                                      color: Colors.white,
                                                    ),
                                                    overflow: TextOverflow.ellipsis,
                                                  );
                                                }),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (warga.pendampingName.isEmpty && warga.mahasiswaId.isEmpty) ...[
                                          const SizedBox(width: 8),
                                          InkWell(
                                            onTap: () async {
                                              final confirm = await showDialog<bool>(
                                                context: context,
                                                builder: (ctx) => AlertDialog(
                                                  title: const Text('Klaim Warga', style: TextStyle(fontWeight: FontWeight.bold)),
                                                  content: const Text('Apakah Anda yakin ingin mengklaim warga ini sebagai warga dampingan Anda?'),
                                                  actions: [
                                                    TextButton(
                                                      onPressed: () => Navigator.of(ctx).pop(false),
                                                      child: const Text('Batal', style: TextStyle(color: Colors.grey)),
                                                    ),
                                                    ElevatedButton(
                                                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen),
                                                      onPressed: () => Navigator.of(ctx).pop(true),
                                                      child: const Text('Ya, Klaim', style: TextStyle(color: Colors.white)),
                                                    ),
                                                  ],
                                                ),
                                              );

                                              if (confirm == true && context.mounted) {
                                                ref.read(detailWargaControllerProvider.notifier).claimWarga(context);
                                              }
                                            },
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Text(
                                                'Klaim Warga',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppColors.primaryGreen,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
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
