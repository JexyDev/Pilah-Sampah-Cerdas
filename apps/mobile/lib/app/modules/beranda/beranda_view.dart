import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/values/app_colors.dart';
import '../../core/values/app_config.dart';
import '../../core/values/app_dimensions.dart';
import '../../routes/app_routes.dart';
import '../../data/models/bin_entity.dart';
import '../../data/models/waste_log_entity.dart';
import '../../data/models/user_entity.dart';
import '../auth/controllers/auth_controller.dart';
import '../scan/controllers/scan_controller.dart';
import '../riwayat/controllers/riwayat_controller.dart';
import '../shared/controllers/connectivity_controller.dart';
import '../notifikasi/controllers/notifikasi_controller.dart';
import '../shared/widgets/app_error.dart';
import '../shared/widgets/skeleton_loading.dart';
import '../shared/widgets/empty_state.dart';
import '../../core/utils/scan_guard.dart';

/// Halaman beranda Ã¢â‚¬â€ sesuai desain:
/// Header biru, avatar+nama+RT/RW, stats card, Aksi Cepat, Riwayat.
class BerandaView extends ConsumerStatefulWidget {
  const BerandaView({
    super.key,
    this.onNavigateToHistory,
  });

  final VoidCallback? onNavigateToHistory;

  @override
  ConsumerState<BerandaView> createState() => _BerandaViewState();
}

class _BerandaViewState extends ConsumerState<BerandaView> {
  bool _hideFullBinAlert = false;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final totalPointsAsync = ref.watch(totalPointsProvider);
    final wasteLogsAsync = ref.watch(wasteLogsProvider);
    final bool isOnline = ref.watch(isOnlineProvider);
    final int unreadCount = ref.watch(unreadNotificationCountProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(binsProvider);
          ref.invalidate(totalPointsProvider);
          ref.invalidate(wasteLogsProvider);
          ref.invalidate(notificationsProvider);
          ref.invalidate(userLeaderboardRankProvider);
        },
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          slivers: [
            // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Header Biru Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
            SliverToBoxAdapter(
              child: _buildHeader(
                context,
                ref,
                user,
                isOnline,
                unreadCount,
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(AppDimensions.md),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Stats Card Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
                  totalPointsAsync.when(
                    data: (total) => _buildStatsCard(context, total),
                    loading: () => const SkeletonLoading(
                      height: 100,
                      width: double.infinity,
                      borderRadius: BorderRadius.all(Radius.circular(16)),
                    ),
                    error: (e, __) => AppError(
                      message: e.toString(),
                      onRetry: () => ref.invalidate(totalPointsProvider),
                    ),
                  ),
                  const SizedBox(height: AppDimensions.md),

                  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Aksi Cepat Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
                  const Text(
                    'Aksi Cepat',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: AppDimensions.sm),
                  _buildAksiCepat(context, ref, isOnline),

                  const SizedBox(height: AppDimensions.lg),

                  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Tong Sampah Anda Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Tempat Sampah Anda',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      TextButton(
                        onPressed: () => Navigator.of(context).pushNamed(AppRoutes.kelolaBin),
                        child: const Text(
                          'Kelola',
                          style: TextStyle(
                            color: AppColors.primaryGreen,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Consumer(
                    builder: (context, ref, _) {
                      return ref.watch(binsProvider).when(
                        data: (bins) {
                          if (bins.isEmpty) {
                            return Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Center(
                                child: Text(
                                  'Belum ada tempat sampah terdaftar.',
                                  style: TextStyle(color: AppColors.textSecondary),
                                ),
                              ),
                            );
                          }
                          return SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            clipBehavior: Clip.none,
                            child: Row(
                              children: bins.map((bin) {
                                return Padding(
                                  padding: const EdgeInsets.only(right: 12),
                                  child: SizedBox(
                                    width: MediaQuery.of(context).size.width * 0.42,
                                    child: _BerandaBinCard(bin: bin),
                                  ),
                                );
                              }).toList(),
                            ),
                          );
                        },
                        loading: () => const SizedBox(
                          height: 80,
                          child: Center(child: CircularProgressIndicator()),
                        ),
                        error: (_, __) => const SizedBox.shrink(),
                      );
                    }
                  ),

                  const SizedBox(height: AppDimensions.lg),

                  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Riwayat Terakhir Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
                        onPressed: widget.onNavigateToHistory,
                        child: const Text(
                          'Lihat Semua',
                          style: TextStyle(
                            color: AppColors.primaryGreen,
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
                    loading: () => Column(
                      children: List.generate(
                        3,
                        (index) => const Padding(
                          padding: EdgeInsets.only(bottom: 8.0),
                          child: SkeletonLoading(
                            height: 70,
                            width: double.infinity,
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                        ),
                      ),
                    ),
                    error: (_, __) => EmptyState(
                      message: 'Gagal memuat riwayat.',
                      icon: Icons.refresh_rounded,
                      buttonText: 'Coba Lagi',
                      onButtonPressed: () => ref.invalidate(wasteLogsProvider),
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

  Widget _buildHeaderAvatarImage(String? fotoPath) {
    if (fotoPath == null || fotoPath.isEmpty) {
      return const Center(
        child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28),
      );
    }
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      return Image.network(
        fotoPath,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28)),
      );
    }
    if (fotoPath.startsWith('/') || fotoPath.startsWith('file://') || fotoPath.contains(':\\') || fotoPath.contains(':/')) {
      final cleanPath = fotoPath.startsWith('file://') ? fotoPath.replaceFirst('file://', '') : fotoPath;
      final file = File(cleanPath);
      if (file.existsSync()) {
        return Image.file(file, fit: BoxFit.cover);
      }
    }
    return Image.network(
      '${AppConfig.baseUrl}$fotoPath',
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28)),
    );
  }

  Widget _buildHeader(
    BuildContext context,
    WidgetRef ref,
    UserEntity? user,
    bool isOnline,
    int unreadCount,
  ) {
    final name = user?.name ?? 'Warga';
    final rtRw = user?.rtRw ?? 'RT 04 / RW 02';
    final roleName = user?.role.displayName ?? 'Warga';
    final fotoUrl = user?.fotoProfil;
    return Container(
      color: Colors.white,
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
                  color: AppColors.backgroundCanvas,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                clipBehavior: Clip.antiAlias,
                child: _buildHeaderAvatarImage(fotoUrl),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getGreeting(),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            name,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.warningYellow,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            roleName,
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // ─── Bell icon with badge ───────────────────────────────
              GestureDetector(
                onTap: () => Navigator.of(context).pushNamed(AppRoutes.notifikasi),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.notifications_outlined,
                        color: AppColors.primaryGreen,
                        size: 22,
                      ),
                    ),
                    if (unreadCount > 0)
                      Positioned(
                        top: -4,
                        right: -4,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                          decoration: const BoxDecoration(
                            color: AppColors.dangerRed,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            unreadCount > 99 ? '99+' : "$unreadCount",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                            ),
                            textAlign: TextAlign.center,
                          ),
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
          
          final rankAsync = ref.watch(userLeaderboardRankProvider);
          final rankValue = rankAsync.maybeWhen(data: (r) => r, orElse: () => '-');

          return Row(
            children: [
              _StatItem(
                icon: Icons.star_border_rounded,
                iconColor: AppColors.primaryBlue,
                numericValue: daily,
                label: 'Hari Ini',
              ),
              _VerticalDivider(),
              _StatItem(
                icon: Icons.account_balance_wallet_outlined,
                iconColor: AppColors.primaryGreen,
                numericValue: totalPoints,
                label: 'Total Points',
                valueColor: AppColors.primaryGreen,
              ),
              _VerticalDivider(),
              _StatItem(
                icon: Icons.emoji_events_outlined,
                iconColor: AppColors.warningYellow,
                value: rankValue,
                label: 'Peringkat',
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAksiCepat(BuildContext context, WidgetRef ref, bool isOnline) {
    final user = ref.watch(authProvider).user;
    final role = user?.role ?? UserRole.warga;

    if (role == UserRole.mahasiswaKkn) {
      // Mahasiswa KKN Quick Actions (Harmonized with Warga style)
      return Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => Navigator.of(context).pushNamed(AppRoutes.ukurKapasitas),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryGreen.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    )
                  ],
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.sensors_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Aktivasi Sampah',
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
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () => Navigator.of(context).pushNamed(AppRoutes.kknAttendance),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primaryGreen, width: 1.5),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.location_on_rounded,
                      color: AppColors.primaryGreen,
                      size: 28,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Presensi KKN',
                      style: TextStyle(
                        color: AppColors.primaryGreen,
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
    } else if (role == UserRole.petugasResidu) {
      // Petugas Residu Quick Action: Timbang Residu
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.of(context).pushNamed(AppRoutes.timbanganResidu),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFE65100), Colors.orange],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.orange.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.scale_rounded,
                          color: Colors.white,
                          size: 32,
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Input Timbangan Residu',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Ringkasan Tong Penuh (Dummy data for UI)
          if (!_hideFullBinAlert)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 4.0),
                    child: Icon(Icons.warning_amber_rounded, color: AppColors.dangerRed, size: 28),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Peringatan Tong Penuh',
                          style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.dangerRed, fontSize: 14),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Ada 3 tong sampah yang mencapai kapasitas kritis dan perlu segera dikosongkan.',
                          style: TextStyle(fontSize: 12, color: AppColors.dangerRed),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppColors.dangerRed, size: 20),
                    onPressed: () {
                      setState(() {
                        _hideFullBinAlert = true;
                      });
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
        ],
      );
    }

    // Default: Warga
    return Row(
      children: [
        // Scan Sampah Ã¢â‚¬â€ hijau/biru gradient
        Expanded(
          child: GestureDetector(
            onTap: isOnline
                ? () => ScanGuard.handleScanNavigation(context, ref)
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
        // Minta Kosongkan Bin Ã¢â‚¬â€ outline merah/biru
        Expanded(
          child: GestureDetector(
            onTap: () => Navigator.of(context).pushNamed(AppRoutes.resetBin),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primaryGreen, width: 1.5),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.delete_sweep_rounded,
                    color: AppColors.primaryGreen,
                    size: 28,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Minta Kosongkan',
                    style: TextStyle(
                      color: AppColors.primaryGreen,
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
    return const EmptyState(
      message: 'Belum ada riwayat terakhir.',
      icon: Icons.history_rounded,
    );
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Sub-widgets Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.iconColor,
    this.value = '',
    this.numericValue,
    required this.label,
    this.valueColor,
  });

  final IconData icon;
  final Color iconColor;
  final String value;
  final int? numericValue;
  final String label;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            // Bisa diarahkan ke screen detail jika dibutuhkan
          },
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Column(
              children: [
                Icon(icon, color: iconColor, size: 26),
                const SizedBox(height: 4),
                if (numericValue != null)
                  TweenAnimationBuilder<int>(
                    tween: IntTween(begin: 0, end: numericValue!),
                    duration: const Duration(seconds: 2),
                    curve: Curves.easeOut,
                    builder: (context, val, child) {
                      return Text(
                        NumberFormat('#,###', 'id_ID').format(val),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: valueColor ?? AppColors.textPrimary,
                        ),
                      );
                    },
                  )
                else
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
          ),
        ),
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

class _RiwayatCard extends ConsumerWidget {
  const _RiwayatCard({required this.log});
  final WasteLogEntity log;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final String userLocation = (user != null && user.rtRw.isNotEmpty)
        ? '${user.rtRw}, Kel. ${user.kelurahan}'
        : 'RT 04 / RW 02';

    final String displayLocation = (log.kelurahan != null && log.kelurahan!.isNotEmpty && log.kelurahan != 'Lokasi tidak diketahui')
        ? log.kelurahan!
        : (log.binQrSerial != null && log.binQrSerial!.isNotEmpty ? log.binQrSerial! : userLocation);

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
          // Icon Tempat Sampah
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
                  'Dibuang pada: ${DateFormat('HH:mm', 'id_ID').format(log.createdAt.toLocal())} WIB',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
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
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.location_on_outlined,
                      color: AppColors.textSecondary,
                      size: 12,
                    ),
                    const SizedBox(width: 2),
                    Flexible(
                      child: Text(
                        displayLocation,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Status badge
          _buildScheduleBadge(log.createdAt.toLocal()),
        ],
      ),
    );
  }

  Widget _buildScheduleBadge(DateTime date) {
    final hour = date.hour;
    // Window Pagi: 07-08, Sore: 16-17. Tolerance until 08:59 and 17:59
    final isFullPoin = (hour >= 7 && hour < 9) || (hour >= 16 && hour < 18);
    
    if (isFullPoin) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.primaryGreen.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'FULL POIN',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: AppColors.primaryGreen,
          ),
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.warningYellow.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'SEBAGIAN',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: AppColors.warningYellow,
          ),
        ),
      );
    }
  }
}

class _BerandaBinCard extends StatelessWidget {
  const _BerandaBinCard({required this.bin});
  final BinEntity bin;

  @override
  Widget build(BuildContext context) {
    final bool isOrganic = bin.binType == WasteType.organic;
    final Color color = isOrganic ? AppColors.organicColor : AppColors.nonOrganicColor;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(Icons.delete_rounded, color: color, size: 24),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: bin.isActive ? AppColors.primaryGreen : AppColors.dangerRed,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            bin.binType.displayName,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            bin.qrSerial,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}



