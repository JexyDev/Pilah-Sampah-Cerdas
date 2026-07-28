import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../routes/app_routes.dart';
import '../../shared/widgets/app_loading.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/location_ping_controller.dart';

class MahasiswaView extends ConsumerStatefulWidget {
  const MahasiswaView({super.key});

  @override
  ConsumerState<MahasiswaView> createState() => _MahasiswaViewState();
}

class _MahasiswaViewState extends ConsumerState<MahasiswaView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(mahasiswaControllerProvider.notifier).fetchAll();
      // Auto-start location tracking saat masuk dashboard
      ref.read(locationPingControllerProvider.notifier).startTracking();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(mahasiswaControllerProvider);
    final locationState = ref.watch(locationPingControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: state.isLoading
          ? const AppLoading(message: 'Memuat dashboard KKN...')
          : state.errorMessage != null
              ? _buildError(state.errorMessage!)
              : RefreshIndicator(
                  onRefresh: ref.read(mahasiswaControllerProvider.notifier).refresh,
                  color: AppColors.primaryGreen,
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      _buildAppBar(state),
                      SliverPadding(
                        padding: const EdgeInsets.all(AppDimensions.md),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _buildSummaryCards(state),
                            const SizedBox(height: AppDimensions.md),
                            _buildProgressSection(state),
                            const SizedBox(height: AppDimensions.md),
                            _buildLocationStatus(locationState),
                            if (state.wargaNeedReeducation.isNotEmpty) ...[
                              const SizedBox(height: AppDimensions.md),
                              _buildReeducationAlert(state.wargaNeedReeducation),
                            ],
                            const SizedBox(height: AppDimensions.lg),
                            _buildQuickActions(),
                            const SizedBox(height: AppDimensions.lg),
                            _buildWargaSection(state),
                          ]),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AppBar (SliverAppBar)
  // ═══════════════════════════════════════════════════════════════════════════

  SliverAppBar _buildAppBar(MahasiswaState state) {
    final dashboard = state.dashboard;
    return SliverAppBar(
      expandedHeight: 140,
      pinned: true,
      backgroundColor: AppColors.primaryGreen,
      foregroundColor: Colors.white,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.primaryGreen,
                AppColors.primaryGreen.withValues(alpha: 0.85),
                AppColors.primaryBlueDark,
              ],
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 50, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    dashboard != null ? 'NIM: ${dashboard.nim}' : 'Mahasiswa KKN',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    dashboard?.jurusan ?? 'Memuat...',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      title: const Text(
        'Dashboard KKN',
        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary Cards (3 cards)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildSummaryCards(MahasiswaState state) {
    final d = state.dashboard;
    return Row(
      children: [
        Expanded(
          child: _SummaryCard(
            icon: Icons.people_alt_rounded,
            label: 'Warga',
            value: '${d?.totalRegisteredBins ?? 0}',
            color: AppColors.primaryGreen,
          ),
        ),
        const SizedBox(width: AppDimensions.sm),
        Expanded(
          child: _SummaryCard(
            icon: Icons.assignment_rounded,
            label: 'Sisa Kuota',
            value: '${d?.remainingQuota ?? 0}',
            color: AppColors.warningOrange,
          ),
        ),
        const SizedBox(width: AppDimensions.sm),
        Expanded(
          child: _SummaryCard(
            icon: Icons.stars_rounded,
            label: 'Poin',
            value: '${d?.contributionPoints ?? 0}',
            color: AppColors.success,
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Progress Section
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildProgressSection(MahasiswaState state) {
    final progress = state.dashboard?.progressPercentage ?? 0;
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
                'Progres Penugasan',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                '${progress.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: progress >= 75
                      ? AppColors.success
                      : progress >= 50
                          ? AppColors.warningOrange
                          : AppColors.primaryGreen,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppDimensions.sm),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
            child: LinearProgressIndicator(
              value: progress / 100,
              minHeight: 10,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation<Color>(
                progress >= 75
                    ? AppColors.success
                    : progress >= 50
                        ? AppColors.warningOrange
                        : AppColors.primaryGreen,
              ),
            ),
          ),
          const SizedBox(height: AppDimensions.xs),
          Text(
            '${state.dashboard?.totalRegisteredBins ?? 0} dari ${state.dashboard?.assignmentLimit ?? 0} target',
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Location Status Widget
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildLocationStatus(LocationPingState locationState) {
    final isOn = locationState.isTracking;
    final lastPing = locationState.lastPingTime;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.md,
        vertical: 12,
      ),
      decoration: BoxDecoration(
        color: isOn
            ? AppColors.success.withValues(alpha: 0.08)
            : AppColors.dangerRed.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        border: Border.all(
          color: isOn
              ? AppColors.success.withValues(alpha: 0.3)
              : AppColors.dangerRed.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: isOn ? AppColors.success : AppColors.dangerRed,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: (isOn ? AppColors.success : AppColors.dangerRed)
                      .withValues(alpha: 0.4),
                  blurRadius: 6,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOn ? 'Tracking Lokasi Aktif' : 'Tracking Lokasi Nonaktif',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isOn ? AppColors.successDark : AppColors.dangerRed,
                  ),
                ),
                if (lastPing != null)
                  Text(
                    'Terakhir: ${DateFormat('HH:mm:ss').format(lastPing)}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          Icon(
            Icons.location_on_rounded,
            color: isOn ? AppColors.success : AppColors.dangerRed,
            size: 20,
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Reeducation Alert
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildReeducationAlert(List<WargaDampingan> wargaList) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: AppColors.warningYellow.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        border: Border.all(
          color: AppColors.warningYellow.withValues(alpha: 0.4),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: AppColors.warningOrange, size: 20),
              SizedBox(width: 8),
              Text(
                'Perlu Edukasi Ulang',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.warningOrange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...wargaList.take(3).map((w) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    const Icon(Icons.person_outline, size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        w.wargaName,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.dangerRed.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
                      ),
                      child: Text(
                        '${w.errorPercentage.toStringAsFixed(0)}% salah',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.dangerRed,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
          if (wargaList.length > 3)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                '+${wargaList.length - 3} warga lainnya',
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
            ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Quick Actions
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _ActionButton(
            icon: Icons.person_add_alt_1_rounded,
            label: 'Registrasi Warga',
            color: AppColors.primaryGreen,
            onTap: () => Navigator.pushNamed(context, AppRoutes.registrasiWarga),
          ),
        ),
        const SizedBox(width: AppDimensions.sm),
        Expanded(
          child: _ActionButton(
            icon: Icons.groups_rounded,
            label: 'Lihat Semua Warga',
            color: AppColors.primaryBlueDark,
            onTap: () => Navigator.pushNamed(context, AppRoutes.daftarWarga),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Warga Dampingan Section (list terakhir)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildWargaSection(MahasiswaState state) {
    final list = state.wargaList;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Warga Dampingan Terbaru',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            if (list.length > 5)
              GestureDetector(
                onTap: () => Navigator.pushNamed(context, AppRoutes.daftarWarga),
                child: const Text(
                  'Lihat Semua',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryGreen,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: AppDimensions.sm),
        if (list.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppDimensions.xl),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
            ),
            child: const Column(
              children: [
                Icon(Icons.people_outline_rounded, size: 48, color: AppColors.textHint),
                SizedBox(height: 8),
                Text(
                  'Belum ada warga dampingan.\nDaftarkan warga pertama Anda!',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
              ],
            ),
          )
        else
          ...list.take(5).map((w) => _WargaCard(
                warga: w,
                onTap: () => Navigator.pushNamed(
                  context,
                  AppRoutes.detailWarga,
                  arguments: w,
                ),
              )),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Error State
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildError(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.cloud_off_rounded, size: 48, color: AppColors.dangerRed),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => ref.read(mahasiswaControllerProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Coba Lagi'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Subwidgets
// ═══════════════════════════════════════════════════════════════════════════════

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppDimensions.radiusSm),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WargaCard extends StatelessWidget {
  const _WargaCard({required this.warga, required this.onTap});

  final WargaDampingan warga;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final lastLog = warga.recentLogs.isNotEmpty ? warga.recentLogs.first : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppDimensions.sm),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: warga.needsReeducation
                        ? AppColors.warningYellow.withValues(alpha: 0.15)
                        : AppColors.primaryGreen.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      warga.wargaName.isNotEmpty
                          ? warga.wargaName[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: warga.needsReeducation
                            ? AppColors.warningOrange
                            : AppColors.primaryGreen,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              warga.wargaName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (warga.needsReeducation)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.warningOrange.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                '⚠ Edukasi',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.warningOrange,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        warga.address,
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (lastLog != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              lastLog.isCorrect
                                  ? Icons.check_circle_rounded
                                  : Icons.cancel_rounded,
                              size: 14,
                              color: lastLog.isCorrect
                                  ? AppColors.success
                                  : AppColors.dangerRed,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${lastLog.category} ${lastLog.weightKg.toStringAsFixed(1)}kg',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),

                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.textHint,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
