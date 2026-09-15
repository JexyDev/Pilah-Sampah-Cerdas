import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
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
import '../notifikasi/controllers/warga_notifikasi_controller.dart';
import '../shared/widgets/app_error.dart';
import '../shared/widgets/skeleton_loading.dart';
import '../shared/widgets/empty_state.dart';
import '../../core/utils/network_exception_helper.dart';
import '../../core/utils/scan_guard.dart';
import '../mahasiswa/controllers/location_ping_controller.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/utils/platform_utils.dart';
import '../../data/services/location_service.dart';
import '../shared/controllers/user_location_controller.dart';
import '../shared/widgets/user_location_card.dart';

/// Halaman beranda — sesuai desain:
/// Header biru, avatar+nama+RW, stats card, Aksi Cepat, Riwayat.
class BerandaView extends ConsumerStatefulWidget {
  const BerandaView({super.key, this.onNavigateToHistory});

  final VoidCallback? onNavigateToHistory;

  @override
  ConsumerState<BerandaView> createState() => _BerandaViewState();
}

class _BerandaViewState extends ConsumerState<BerandaView>
    with WidgetsBindingObserver {
  bool _isCheckingLocation = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkLocationIfNeeded();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkLocationIfNeeded();
    }
  }

  Future<void> _checkLocationIfNeeded() async {
    if (!mounted || _isCheckingLocation) return;
    final user = ref.read(authProvider).user;
    if (user?.role == UserRole.mahasiswaKkn) {
      ref.read(locationPingControllerProvider.notifier).startTracking();
      return;
    }

    if (PlatformUtils.isMobile && user?.role == UserRole.warga) {
      _isCheckingLocation = true;
      try {
        final perm = await LocationService.instance.checkAndRequestPermission(
          context,
          role: 'warga',
          mandatory: true,
        );
        if (perm == LocationPermission.whileInUse ||
            perm == LocationPermission.always) {
          if (mounted) {
            ref.read(userLocationProvider.notifier).refreshLocation();
          }
        }
      } finally {
        if (mounted) {
          _isCheckingLocation = false;
        }
      }
    } else {
      ref.read(userLocationProvider.notifier).refreshLocation();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final totalPointsAsync = ref.watch(totalPointsProvider);
    final wasteLogsAsync = ref.watch(wasteLogsProvider);
    final bool isOnline = ref.watch(isOnlineProvider);
    final int unreadCount = ref.watch(wargaUnreadNotificationCountProvider);
    final hasActiveBin =
        ref.watch(binsProvider).value?.any((bin) => bin.isActive) ?? false;
    final isCommunityMember =
        user != null &&
        user.lifecycleState != WargaLifecycle.registered &&
        (user.householdId ?? '').isNotEmpty;
    try {
      return Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        body: RefreshIndicator(
          onRefresh: () async {
            ref.read(userLocationProvider.notifier).refreshLocation();
            ref.invalidate(binsProvider);
            ref.invalidate(totalPointsProvider);
            ref.invalidate(dailyPointsProvider);
            ref.invalidate(pointHistoryProvider);
            ref.invalidate(wasteLogsProvider);
            ref.invalidate(notificationsProvider);
            ref.invalidate(wargaNotificationsProvider);
            ref.invalidate(wargaUnreadNotificationCountProvider);
            ref.invalidate(userLeaderboardRankProvider);
          },
          color: AppColors.primaryGreen,
          child: CustomScrollView(
            slivers: [
              // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Header Biru ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
              SliverToBoxAdapter(
                child: _buildHeader(context, ref, user, isOnline, unreadCount),
              ),

              SliverPadding(
                padding: const EdgeInsets.all(AppDimensions.md),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ──────────────── Stats Card ─────────────────────────────────
                    totalPointsAsync.when(
                      skipLoadingOnReload: true,
                      data: (total) => _buildStatsCard(context, total),
                      loading: () => const SkeletonLoading(
                        height: 100,
                        width: double.infinity,
                        borderRadius: BorderRadius.all(Radius.circular(16)),
                      ),
                      error: (e, __) => AppError(
                        message: NetworkExceptionHelper.getErrorMessage(e),
                        onRetry: () => ref.invalidate(totalPointsProvider),
                      ),
                    ),
                    const SizedBox(height: AppDimensions.md),

                    // ─── Statistik Saya ──────────────────────────────────────────
                    const Text(
                      'Statistik Saya',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: AppDimensions.sm),
                    wasteLogsAsync.when(
                      skipLoadingOnReload: true,
                      data: (logs) => _buildStatistikSaya(context, logs),
                      loading: () => const SkeletonLoading(
                        height: 120,
                        width: double.infinity,
                        borderRadius: BorderRadius.all(Radius.circular(16)),
                      ),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                    const SizedBox(height: AppDimensions.lg),

                    // ──────────────── Aksi Cepat ─────────────────────────────────
                    if (user?.lifecycleState != WargaLifecycle.registered) ...[
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
                    ],

                    // ──────────────── Tempat Sampah Anda ─────────────────────────
                    Consumer(
                      builder: (context, ref, _) {
                        return ref
                            .watch(binsProvider)
                            .when(
                              skipLoadingOnReload: true,
                              data: (bins) {
                                final activeBins = bins
                                    .where((bin) => bin.isActive)
                                    .toList();
                                if (user?.role == UserRole.warga ||
                                    user?.role == UserRole.unknown) {
                                  final isRegisteredOrNoHh =
                                      user?.lifecycleState ==
                                          WargaLifecycle.registered ||
                                      (user?.householdId ?? '').isEmpty;
                                  if (isRegisteredOrNoHh) {
                                    return _GabungKomunitasCard();
                                  } else if (user?.lifecycleState ==
                                          WargaLifecycle.communityActiveNoBin ||
                                      activeBins.isEmpty) {
                                    return _TempatSampahBelumTerpasangCard();
                                  }
                                } else if (activeBins.isEmpty) {
                                  return Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
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
                                            onPressed: () => Navigator.of(
                                              context,
                                            ).pushNamed(AppRoutes.kelolaBin),
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
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.all(16),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFFBEB),
                                          border: Border.all(
                                            color: AppColors.warningYellow
                                                .withValues(alpha: 0.5),
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            16,
                                          ),
                                        ),
                                        child: const Row(
                                          children: [
                                            Icon(
                                              Icons.warning_amber_rounded,
                                              color: AppColors.warningYellow,
                                              size: 28,
                                            ),
                                            SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    'Belum Aktivasi Tempat Sampah',
                                                    style: TextStyle(
                                                      color:
                                                          AppColors.textPrimary,
                                                      fontWeight:
                                                          FontWeight.w700,
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  SizedBox(height: 2),
                                                  Text(
                                                    'Silakan ketuk "Kelola" untuk menambah.',
                                                    style: TextStyle(
                                                      color: AppColors
                                                          .textSecondary,
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  );
                                }

                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
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
                                          onPressed: () => Navigator.of(
                                            context,
                                          ).pushNamed(AppRoutes.kelolaBin),
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
                                    SingleChildScrollView(
                                      scrollDirection: Axis.horizontal,
                                      clipBehavior: Clip.none,
                                      child: Row(
                                        children: activeBins.map((bin) {
                                          return Padding(
                                            padding: const EdgeInsets.only(
                                              right: 12,
                                            ),
                                            child: SizedBox(
                                              width:
                                                  (MediaQuery.of(
                                                            context,
                                                          ).size.width *
                                                          0.42)
                                                      .clamp(140.0, 180.0),
                                              child: _BerandaBinCard(bin: bin),
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                    ),
                                    Builder(
                                      builder: (context) {
                                        final hasOrganic = activeBins.any(
                                          (b) => b.binType == WasteType.organic,
                                        );
                                        final hasNonOrganic = activeBins.any(
                                          (b) =>
                                              b.binType == WasteType.nonOrganic,
                                        );
                                        final isMissingOne =
                                            (hasOrganic && !hasNonOrganic) ||
                                            (!hasOrganic && hasNonOrganic);
                                        if (!isMissingOne) {
                                          return const SizedBox.shrink();
                                        }

                                        final missingName = hasOrganic
                                            ? 'Anorganik (Kuning)'
                                            : 'Organik (Hijau)';
                                        final targetType = hasOrganic
                                            ? 'non_organic'
                                            : 'organic';

                                        return Container(
                                          margin: const EdgeInsets.only(
                                            top: 10,
                                          ),
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 10,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFFFBEB),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            border: Border.all(
                                              color: AppColors.warningYellow
                                                  .withValues(alpha: 0.6),
                                            ),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.info_outline_rounded,
                                                color: AppColors.warningYellow,
                                                size: 20,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  'Lengkapi tempat sampah $missingName Anda agar dapat mulai memilah sampah.',
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    color:
                                                        AppColors.textPrimary,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ),
                                              TextButton(
                                                onPressed: () =>
                                                    Navigator.of(
                                                      context,
                                                    ).pushNamed(
                                                      AppRoutes.ukurKapasitas,
                                                      arguments: {
                                                        'targetType':
                                                            targetType,
                                                      },
                                                    ),
                                                style: TextButton.styleFrom(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                      ),
                                                  visualDensity:
                                                      VisualDensity.compact,
                                                ),
                                                child: const Text(
                                                  'Aktivasi',
                                                  style: TextStyle(
                                                    color:
                                                        AppColors.primaryGreen,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                  ],
                                );
                              },
                              loading: () => const SizedBox(
                                height: 80,
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              ),
                              error: (_, __) => const SizedBox.shrink(),
                            );
                      },
                    ),

                    if (hasActiveBin) ...[
                      const SizedBox(height: AppDimensions.lg),

                      // ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ Riwayat Terakhir ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬Â Ã¢â€šÂ¬
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Text(
                              'Riwayat Terakhir',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
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
                        skipLoadingOnReload: true,
                        data: (logs) => logs.isEmpty
                            ? _buildEmptyLogs(context)
                            : SizedBox(
                                height:
                                    180, // Membatasi tinggi agar tidak expand penuh
                                child: ListView.separated(
                                  padding: EdgeInsets.zero,
                                  physics: const BouncingScrollPhysics(),
                                  itemCount: logs.length > 5 ? 5 : logs.length,
                                  separatorBuilder: (context, index) =>
                                      const SizedBox(height: 12),
                                  itemBuilder: (context, index) {
                                    return _RiwayatCard(log: logs[index]);
                                  },
                                ),
                              ),
                        loading: () => SizedBox(
                          height: 180,
                          child: ListView.separated(
                            padding: EdgeInsets.zero,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: 3,
                            separatorBuilder: (context, index) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              return const SkeletonLoading(
                                height: 70,
                                width: double.infinity,
                                borderRadius: BorderRadius.all(
                                  Radius.circular(12),
                                ),
                              );
                            },
                          ),
                        ),
                        error: (_, __) => EmptyState(
                          message: 'Gagal memuat riwayat.',
                          icon: Icons.refresh_rounded,
                          buttonText: 'Coba Lagi',
                          onButtonPressed: () =>
                              ref.invalidate(wasteLogsProvider),
                        ),
                      ),
                    ],
                    const SizedBox(height: AppDimensions.lg),
                    _buildBeritaSection(context, isCommunityMember),
                    const SizedBox(height: 80),
                  ]),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e, st) {
      debugPrint('[BerandaView] Fatal build error: $e\n$st');
      return Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    color: AppColors.dangerRed,
                    size: 48,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Gagal Memuat Beranda',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '$e',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => setState(() {}),
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
  }

  Widget _buildStatistikSaya(BuildContext context, List<WasteLogEntity> logs) {
    if (logs.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Center(
          child: Text(
            'Belum ada riwayat aktivitas.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    final totalActivities = logs.length;
    final correctCount = logs.where((l) => l.isCorrect).length;
    final incorrectCount = totalActivities - correctCount;

    final correctPercentage = totalActivities > 0
        ? (correctCount / totalActivities) * 100
        : 0.0;
    final errorPercentage = totalActivities > 0
        ? (incorrectCount / totalActivities) * 100
        : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Distribusi Pemilahan Sampah',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Total Aktivitas: $totalActivities',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),

          // Bar — Benar
          _HorizontalBar(
            label: 'Pemilahan Benar ($correctCount)',
            percentage: correctPercentage,
            color: AppColors.success,
          ),
          const SizedBox(height: 12),

          // Bar — Salah
          _HorizontalBar(
            label: 'Pemilahan Salah ($incorrectCount)',
            percentage: errorPercentage,
            color: AppColors.dangerRed,
          ),
          const SizedBox(height: 12),

          Builder(
            builder: (context) {
              final validLogs = logs.where((l) => l.aiConfidence > 0).toList();
              final avgConfidence = validLogs.isNotEmpty
                  ? validLogs
                            .map((l) => l.aiConfidence)
                            .reduce((a, b) => a + b) /
                        validLogs.length
                  : 0.0;
              final displayPercentage = avgConfidence > 1.0
                  ? avgConfidence
                  : avgConfidence * 100;

              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Text(
                      'Akurasi AI (Rata-rata)',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    validLogs.isEmpty
                        ? 'N/A'
                        : '${displayPercentage.toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: validLogs.isEmpty
                          ? AppColors.textHint
                          : AppColors.primaryGreen,
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBeritaSection(BuildContext context, bool isCommunityMember) {
    final listBerita = [
      _BeritaData(
        title: 'Rilis Fitur Baru: Kenali Tempat Sampah Pintar Berseka',
        description:
            'Berseka kini hadir dengan fitur AI untuk mengenali jenis sampah secara otomatis.',
      ),
      _BeritaData(
        title: 'Pasar Berseka: Tukar Poinmu!',
        description:
            'Segera bergabung menjadi member komunitas untuk bisa mengakses Pasar Berseka dan menukarkan poinmu dengan kebutuhan harian!',
        isPasarBerseka: true,
      ),
      _BeritaData(
        title: 'Dampak Lingkungan Nyata',
        description:
            'Lihat bagaimana kontribusimu membantu mengurangi emisi karbon setiap harinya.',
      ),
      _BeritaData(
        title: 'Tips Memilah Sampah',
        description:
            'Kenali perbedaan sampah organik dan anorganik untuk proses daur ulang yang optimal.',
      ),
    ];

    final displayedBerita = listBerita;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Informasi & Berita',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 160,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: displayedBerita.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              return _BeritaCard(data: displayedBerita[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildHeaderAvatarImage(String? fotoPath) {
    if (fotoPath == null || fotoPath.isEmpty) {
      return const Center(
        child: Icon(
          Icons.person_rounded,
          color: AppColors.primaryGreen,
          size: 28,
        ),
      );
    }
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      return CachedNetworkImage(
        imageUrl: fotoPath,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => const Center(
          child: Icon(
            Icons.person_rounded,
            color: AppColors.primaryGreen,
            size: 28,
          ),
        ),
      );
    }
    if (fotoPath.startsWith('/') ||
        fotoPath.startsWith('file://') ||
        fotoPath.contains(':\\') ||
        fotoPath.contains(':/')) {
      final cleanPath = fotoPath.startsWith('file://')
          ? fotoPath.replaceFirst('file://', '')
          : fotoPath;
      final file = File(cleanPath);
      if (file.existsSync()) {
        return Image.file(file, fit: BoxFit.cover);
      }
    }
    return CachedNetworkImage(
      imageUrl: AppConfig.getImageUrl(fotoPath),
      fit: BoxFit.cover,
      errorWidget: (_, __, ___) => const Center(
        child: Icon(
          Icons.person_rounded,
          color: AppColors.primaryGreen,
          size: 28,
        ),
      ),
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
    final roleName = user?.role.displayName ?? 'Warga';
    final fotoUrl = user?.fotoProfil;
    final isCompact = MediaQuery.of(context).size.width < 360;

    final isUnjoined =
        (user?.role == UserRole.warga || user?.role == UserRole.unknown) &&
        (user?.lifecycleState == WargaLifecycle.registered ||
            (user?.householdId ?? '').isEmpty);

    String displayRole = roleName;
    if (user?.role == UserRole.warga || user?.role == UserRole.unknown) {
      if (isUnjoined) {
        displayRole = '';
      } else {
        displayRole = 'Warga Berseka';
      }
    }

    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: isCompact ? 12 : 16,
        right: isCompact ? 12 : 16,
        bottom: 24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Baris atas: Avatar + Nama + RW
          Row(
            children: [
              // Avatar logo
              Container(
                width: isCompact ? 42 : 48,
                height: isCompact ? 42 : 48,
                decoration: BoxDecoration(
                  color: AppColors.backgroundCanvas,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                clipBehavior: Clip.antiAlias,
                child: _buildHeaderAvatarImage(fotoUrl),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _getGreeting(),
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                        if (displayRole.isNotEmpty) ...[
                          const SizedBox(width: 5),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 5,
                              vertical: 1.5,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.warningYellow,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              displayRole,
                              style: const TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      name,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: isUnjoined
                            ? AppColors.warningYellow.withValues(alpha: 0.1)
                            : AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: isUnjoined
                              ? AppColors.warningYellow.withValues(alpha: 0.3)
                              : AppColors.primaryGreen.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        isUnjoined ? 'Belum Bergabung' : 'Sudah Bergabung',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: isUnjoined
                              ? AppColors.warningYellow
                              : AppColors.primaryGreen,
                        ),
                      ),
                    ),
                    if (!isUnjoined &&
                        user?.komunitasId != null &&
                        user!.komunitasId!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'ID: ${user.komunitasId}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 4),
              // ─── Online Indicator & Bell icon ───────────────────────────
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    margin: EdgeInsets.only(right: isCompact ? 6 : 8),
                    padding: EdgeInsets.symmetric(
                      horizontal: isCompact ? 5 : 6,
                      vertical: 2.5,
                    ),
                    decoration: BoxDecoration(
                      color: isOnline
                          ? AppColors.primaryGreen.withValues(alpha: 0.1)
                          : AppColors.dangerRed.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isOnline
                            ? AppColors.primaryGreen.withValues(alpha: 0.3)
                            : AppColors.dangerRed.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isOnline
                                ? AppColors.primaryGreen
                                : AppColors.dangerRed,
                            boxShadow: [
                              if (isOnline)
                                BoxShadow(
                                  color: AppColors.primaryGreen.withValues(
                                    alpha: 0.4,
                                  ),
                                  blurRadius: 3,
                                  spreadRadius: 0.5,
                                ),
                            ],
                          ),
                        ),
                        if (!isCompact) ...[
                          const SizedBox(width: 4),
                          Text(
                            isOnline ? 'Online' : 'Offline',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: isOnline
                                  ? AppColors.primaryGreen
                                  : AppColors.dangerRed,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () =>
                        Navigator.of(context).pushNamed(AppRoutes.notifikasi),
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(
                              alpha: 0.1,
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Image.asset(
                              'assets/icons/notification.png',
                              color: AppColors.primaryGreen,
                            ),
                          ),
                        ),
                        if (unreadCount > 0)
                          Positioned(
                            top: -4,
                            right: -4,
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              constraints: const BoxConstraints(
                                minWidth: 18,
                                minHeight: 18,
                              ),
                              decoration: const BoxDecoration(
                                color: AppColors.dangerRed,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                unreadCount > 99 ? '99+' : '$unreadCount',
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
          const SizedBox(height: 10),
          // Baris 2: Lokasi Domisili & GPS Card Terstruktur Warga (2 Tier)
          Consumer(
            builder: (context, ref, _) {
              final locState = ref.watch(userLocationProvider);
              final isUnjoined =
                  (user?.role == UserRole.warga ||
                      user?.role == UserRole.unknown) &&
                  (user?.lifecycleState == WargaLifecycle.registered ||
                      (user?.householdId ?? '').isEmpty);
              final rawRw = user?.formattedRw ?? user?.rw ?? '';
              final rwText = rawRw.isNotEmpty && rawRw != '-'
                  ? 'RW $rawRw'
                  : '';
              final rawKel = user?.kelurahan ?? '';
              final kelText = rawKel.isNotEmpty && rawKel != '-'
                  ? (rawKel.toLowerCase().startsWith('kel')
                        ? rawKel
                        : 'Kel. $rawKel')
                  : '';
              final wilayahList = [
                kelText,
                rwText,
              ].where((s) => s.isNotEmpty).toList();
              final wilayahTitle = isUnjoined
                  ? 'Data lokasi belum diketahui, Ayo Gabung Komunitas'
                  : (wilayahList.isNotEmpty
                        ? wilayahList.join(' • ')
                        : 'Wilayah Warga');

              final registeredAddress = (user?.address ?? '').trim();
              final displayAddress = locState.address ?? registeredAddress;

              return UserLocationCard(
                wilayahTitle: wilayahTitle,
                isFetchingAddress:
                    locState.isFetchingAddress,
                address: displayAddress,
                position: locState.position,
                isHomeAddress:
                    false, // Menandakan bahwa ini adalah live location, bukan fixed home address
                onRefresh: () => ref
                    .read(userLocationProvider.notifier)
                    .refreshLocation(context: context),
              );
            },
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
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Consumer(
        builder: (context, ref, _) {
          final dailyAsync = ref.watch(dailyPointsProvider);
          final daily = dailyAsync.maybeWhen(data: (v) => v, orElse: () => 0);

          final setoranAsync = ref.watch(totalSetoranProvider);
          final setoranValue = setoranAsync.maybeWhen(
            data: (v) => v,
            orElse: () => 0,
          );

          return Row(
            children: [
              _StatItem(
                icon: Icons.star_rounded,
                iconColor: AppColors.primaryBlue,
                numericValue: daily,
                label: 'Poin hari ini',
              ),
              _VerticalDivider(),
              _StatItem(
                icon: Icons.account_balance_wallet_rounded,
                iconColor: AppColors.primaryGreen,
                numericValue: totalPoints,
                label: 'Total Points',
                valueColor: AppColors.primaryGreen,
              ),
              _VerticalDivider(),
              _StatItem(
                icon: Icons.sync_alt_rounded,
                iconColor: AppColors.primaryGreen,
                numericValue: setoranValue,
                label: 'Total Setoran',
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
              onTap: () =>
                  Navigator.of(context).pushNamed(AppRoutes.ukurKapasitas),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 18,
                  horizontal: 16,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryGreen.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.sensors_rounded, color: Colors.white, size: 28),
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
              onTap: () =>
                  Navigator.of(context).pushNamed(AppRoutes.kknAttendance),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 18,
                  horizontal: 16,
                ),
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
    } else if (role == UserRole.petugasPemilahan) {
      // Petugas Pemilahan Quick Action: Timbang Pemilahan
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.of(
                    context,
                  ).pushNamed(AppRoutes.timbanganPemilahan),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: 24,
                      horizontal: 16,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.dangerRed, Color(0xFFB91C1C)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.dangerRed.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
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
                          'Input Timbangan Pemilahan',
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
        ],
      );
    }

    // Default: Warga
    return Row(
      children: [
        // Primary CTA: Scan Sampah
        Expanded(
          child: GestureDetector(
            onTap: isOnline
                ? () {
                    if (user?.role == UserRole.warga &&
                        user?.lifecycleState != WargaLifecycle.fullyActive) {
                      Navigator.of(context).pushNamed(AppRoutes.ukurKapasitas);
                      return;
                    }
                    ScanGuard.handleScanNavigation(context, ref);
                  }
                : null,
            child: AnimatedOpacity(
              opacity: isOnline ? 1.0 : 0.5,
              duration: const Duration(milliseconds: 200),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 14,
                  horizontal: 8,
                ),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primaryGreen, Color(0xFF15803D)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryGreen.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.qr_code_scanner_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                    SizedBox(width: 6),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Scan Sampah',
                          maxLines: 1,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        // Secondary CTA: Pengosongan
        Expanded(
          child: GestureDetector(
            onTap: isOnline
                ? () {
                    Navigator.of(context).pushNamed(AppRoutes.resetBin);
                  }
                : null,
            child: AnimatedOpacity(
              opacity: isOnline ? 1.0 : 0.5,
              duration: const Duration(milliseconds: 200),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 14,
                  horizontal: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset(
                      'assets/icons/waste.png',
                      color: AppColors.primaryGreen,
                      width: 18,
                      height: 18,
                    ),
                    const SizedBox(width: 6),
                    const Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Pengosongan',
                          maxLines: 1,
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
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

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Sub-widgets ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.iconColor,
    // ignore: unused_element_parameter
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

  String _formatNumber(int val) {
    return val.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }

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
                      return FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          _formatNumber(val),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: valueColor ?? AppColors.textPrimary,
                          ),
                        ),
                      );
                    },
                  )
                else
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      value,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: valueColor ?? AppColors.textPrimary,
                      ),
                    ),
                  ),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
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
    final bool isOrganic = log.wasteType == WasteType.organic;
    final Color bgColor = isOrganic
        ? AppColors.organicColor
        : AppColors.nonOrganicColor;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Icon Container
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: bgColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isOrganic ? Icons.eco_rounded : Icons.recycling_rounded,
              color: bgColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  isOrganic ? 'Sampah Organik' : 'Sampah Anorganik',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${DateFormat('dd MMM yyyy, HH:mm', 'id_ID').format(log.createdAt.toLocal())} WIB',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Points
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.star_rounded,
                  color: AppColors.primaryBlue,
                  size: 14,
                ),
                const SizedBox(width: 4),
                Text(
                  '+${log.pointsAwarded}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primaryBlue,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BerandaBinCard extends StatefulWidget {
  const _BerandaBinCard({required this.bin});
  final BinEntity bin;

  @override
  State<_BerandaBinCard> createState() => _BerandaBinCardState();
}

class _BerandaBinCardState extends State<_BerandaBinCard> {
  String _address = 'Memuat lokasi...';

  @override
  void initState() {
    super.initState();
    _fetchAddress();
  }

  Future<void> _fetchAddress() async {
    try {
      final addr = await LocationService.instance.getAddressFromCoordinates(
        widget.bin.lat,
        widget.bin.lng,
      );
      if (mounted) {
        setState(() {
          _address = addr ?? 'Lokasi tidak diketahui';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _address = 'Gagal memuat lokasi';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bin = widget.bin;
    final bool isOrganic = bin.binType == WasteType.organic;
    final Color color = isOrganic
        ? AppColors.organicColor
        : AppColors.nonOrganicColor;

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
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Image.asset(
                'assets/icons/recycle-bin.png',
                color: color,
                width: 24,
                height: 24,
              ),
              if (bin.isResetPending)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.warningYellow.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: AppColors.warningYellow.withValues(alpha: 0.5),
                    ),
                  ),
                  child: const Text(
                    'MENUNGGU',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: AppColors.warningYellow,
                    ),
                  ),
                )
              else
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: bin.isActive
                        ? AppColors.primaryGreen
                        : AppColors.dangerRed,
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
          const SizedBox(height: 12),
          // Indikator Kapasitas
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: bin.isActive ? bin.capacityPercent.clamp(0.0, 1.0) : 0.0,
              minHeight: 6,
              backgroundColor: bin.isActive
                  ? AppColors.border
                  : Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation<Color>(
                bin.isActive ? color : Colors.grey,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            bin.isResetPending
                ? 'Menunggu diproses'
                : '${(bin.capacityPercent * 100).toStringAsFixed(0)}% terisi',
            style: const TextStyle(fontSize: 10, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          // Lokasi Koordinat (Reverse Geocoding)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.location_on_rounded,
                size: 12,
                color: AppColors.textHint,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  _address,
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textHint,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
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
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
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

// ─── Card: Gabung Komunitas Berseka (Guest Mode) ──────────────────────────────
class _GabungKomunitasCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF16A34A), Color(0xFF15803D)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryGreen.withValues(alpha: 0.28),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon + Title
            const Row(
              children: [
                Text('🌿', style: TextStyle(fontSize: 26)),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Gabung Komunitas Berseka',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      height: 1.2,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Deskripsi Singkat
            const Text(
              'Aplikasi Berseka hadir untuk mendorong budaya memilah sampah dari rumah melalui teknologi cerdas. Bergabunglah dengan komunitas untuk mulai berkontribusi nyata menjaga lingkungan sekaligus mendapatkan berbagai keuntungan eksklusif.',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 13,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 16),

            // Daftar Manfaat & Fitur
            const Text(
              'Manfaat & Fitur:',
              style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            _buildBenefitItem(
              Icons.qr_code_scanner_rounded,
              'Pindai Sampah Cerdas',
              'Deteksi jenis & estimasi berat sampah otomatis dengan AI.',
            ),
            const SizedBox(height: 8),
            _buildBenefitItem(
              Icons.monetization_on_rounded,
              'Kumpulkan Poin',
              'Dapatkan poin yang bisa ditukar dari setiap sampah yang kamu pilah.',
            ),
            const SizedBox(height: 8),
            _buildBenefitItem(
              Icons.nature_people_rounded,
              'Dampak Lingkungan',
              'Pantau kontribusimu dalam menjaga kebersihan lingkungan sekitar.',
            ),
            const SizedBox(height: 20),

            // Tombol CTA
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(
                  context,
                ).pushNamed(AppRoutes.komunitasOnboarding),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primaryGreen,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.eco_rounded, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Gabung Sekarang',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.arrow_forward_rounded, size: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBenefitItem(IconData icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.white, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Card: Tempat Sampah Belum Terpasang (Reset Bin) ─────────────────────────
class _TempatSampahBelumTerpasangCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB), // Light warning yellow background
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.warningYellow.withValues(alpha: 0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.warningYellow.withValues(alpha: 0.1),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon + Title
            const Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: AppColors.warningYellow,
                  size: 28,
                ),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Tempat Sampah Belum Terpasang',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      height: 1.2,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Deskripsi
            const Text(
              'Anda sudah bergabung dalam komunitas, tetapi tempat sampah Anda belum dipasang atau telah di-reset. Anda belum bisa mendapatkan poin. Silakan scan QR code di tempat sampah yang baru untuk melanjutkan.',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 16),

            // Tombol CTA
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () =>
                    Navigator.of(context).pushNamed(AppRoutes.ukurKapasitas),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warningYellow,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.qr_code_scanner_rounded, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Scan QR Tempat Sampah',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BeritaData {
  final String title;
  final String description;
  final bool isPasarBerseka;

  _BeritaData({
    required this.title,
    required this.description,
    this.isPasarBerseka = false,
  });
}

class _BeritaCard extends StatelessWidget {
  final _BeritaData data;

  const _BeritaCard({required this.data});

  void _showDetail(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      data.isPasarBerseka
                          ? Icons.storefront_rounded
                          : Icons.article_rounded,
                      color: data.isPasarBerseka
                          ? AppColors.warningYellow
                          : AppColors.primaryGreen,
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        data.isPasarBerseka
                            ? 'Eksklusif Member'
                            : 'Info Berseka',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: data.isPasarBerseka
                              ? AppColors.warningYellow
                              : AppColors.primaryGreen,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  data.title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  data.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text(
                      'Tutup',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 240,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showDetail(context),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      data.isPasarBerseka
                          ? Icons.storefront_rounded
                          : Icons.article_rounded,
                      color: data.isPasarBerseka
                          ? AppColors.warningYellow
                          : AppColors.primaryGreen,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        data.isPasarBerseka
                            ? 'Eksklusif Member'
                            : 'Info Berseka',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: data.isPasarBerseka
                              ? AppColors.warningYellow
                              : AppColors.primaryGreen,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  data.title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        data.description,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Spacer(),
                      const Text(
                        'Lihat selengkapnya...',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryGreen,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
