import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_config.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/user_entity.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/petugas_residu_controller.dart';
import '../controllers/petugas_residu_notifikasi_controller.dart';
import '../widgets/petugas_whitelist_guard_widget.dart';
import 'petugas_notification_view.dart';

import '../../shared/controllers/connectivity_controller.dart';

class PetugasResiduDashboardView extends ConsumerStatefulWidget {
  const PetugasResiduDashboardView({super.key});

  @override
  ConsumerState<PetugasResiduDashboardView> createState() => _PetugasResiduDashboardViewState();
}

class _PetugasResiduDashboardViewState extends ConsumerState<PetugasResiduDashboardView> with WidgetsBindingObserver {
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Silent reload on first load
    Future.microtask(() => ref.read(petugasResiduControllerProvider.notifier).refreshAll());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Silent reload on resume
      ref.read(petugasResiduControllerProvider.notifier).refreshAll();
    }
  }

  String _formatDateTime(String? rawStr) {
    if (rawStr == null || rawStr.isEmpty || rawStr == '-') return '';
    try {
      final dt = DateTime.parse(rawStr).toLocal();
      return '${DateFormat('d MMMM yyyy, HH:mm', 'id_ID').format(dt)} WIB';
    } catch (_) {
      return '';
    }
  }

  Widget _buildHeaderAvatarImage(String? fotoPath) {
    if (fotoPath == null || fotoPath.isEmpty) {
      return const Center(
        child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28),
      );
    }
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      return CachedNetworkImage(
        imageUrl: fotoPath,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => const Center(child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28)),
      );
    }
    if (fotoPath.startsWith('/') || fotoPath.startsWith('file://') || fotoPath.contains(':\\') || fotoPath.contains(':/')) {
      final cleanPath = fotoPath.startsWith('file://') ? fotoPath.replaceFirst('file://', '') : fotoPath;
      final file = File(cleanPath);
      if (file.existsSync()) {
        return Image.file(file, fit: BoxFit.cover);
      }
    }
    return CachedNetworkImage(
      imageUrl: '${AppConfig.baseUrl}$fotoPath',
      fit: BoxFit.cover,
      errorWidget: (_, __, ___) => const Center(child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28)),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Selamat Pagi,';
    if (hour < 15) return 'Selamat Siang,';
    if (hour < 18) return 'Selamat Sore,';
    return 'Selamat Malam,';
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, UserEntity? user, int unreadCount) {
    final name = user?.name ?? 'Petugas Residu';
    const roleName = 'Petugas Residu';
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
          Row(
            children: [
              // Avatar
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
                        fontSize: 11,
                      ),
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
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.warningOrange,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        roleName,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Online Indicator
              Consumer(
                builder: (context, ref, child) {
                  final isOnline = ref.watch(isOnlineProvider);
                  return Container(
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isOnline ? AppColors.primaryGreen.withValues(alpha: 0.1) : AppColors.dangerRed.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isOnline ? AppColors.primaryGreen.withValues(alpha: 0.3) : AppColors.dangerRed.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isOnline ? AppColors.primaryGreen : AppColors.dangerRed,
                            boxShadow: [
                              if (isOnline)
                                BoxShadow(
                                  color: AppColors.primaryGreen.withValues(alpha: 0.4),
                                  blurRadius: 4,
                                  spreadRadius: 1,
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          isOnline ? 'Online' : 'Offline',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isOnline ? AppColors.primaryGreen : AppColors.dangerRed,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              // Notifikasi
              GestureDetector(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const PetugasNotificationView()),
                ),
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
    );
  }

  Widget _buildKpiCard(double kpiScore) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryBlueDark, AppColors.primaryBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryBlue.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Indeks Kinerja (KPI)', style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 4),
              Text(
                '${kpiScore.toStringAsFixed(1)} / 100',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Colors.white),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                child: const Text('Kinerja Sangat Baik', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const Icon(Icons.stars_rounded, color: Colors.white, size: 48),
        ],
      ),
    );
  }

  Widget _buildStatCard({required String title, required String value, required String unit, required IconData icon, required Color color}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppDimensions.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary)),
                  const SizedBox(width: 4),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Text(unit, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(petugasResiduControllerProvider);
    final unreadCount = ref.watch(petugasUnreadNotificationCountProvider);
    final dashboard = state.dashboard;

    final bool isApproved = dashboard?.isApproved ?? true;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _buildHeader(context, ref, user, unreadCount),
            ),
            
            SliverPadding(
              padding: const EdgeInsets.all(AppDimensions.md),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (!isApproved) ...[
                    PetugasWhitelistGuardWidget(
                      statusText: dashboard?.whitelistStatus.name ?? 'PENDING',
                      onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
                    ),
                    const SizedBox(height: AppDimensions.md),
                  ],

                  // Banner
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md, vertical: 12),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Pencatatan timbangan residu fisik terakumulasi otomatis ke Tempat Sampah Residu Global RW.',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primaryBlueDark,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Kinerja KPI
                  _buildKpiCard(dashboard?.kpiScore ?? 93.8),
                  const SizedBox(height: 18),

                  // Matriks Statistik: Kg Hari Ini & Akumulasi Bin (2 Kolom Rapi)
                  Row(
                    children: [
                      _buildStatCard(
                        title: 'Kg Hari Ini',
                        value: '${dashboard?.totalWeightKg ?? 24.5}',
                        unit: 'Kg',
                        icon: Icons.scale_rounded,
                        color: AppColors.primaryGreen,
                      ),
                      const SizedBox(width: 14),
                      _buildStatCard(
                        title: 'Akumulasi Tempat Sampah',
                        value: '540.2',
                        unit: 'Kg Global',
                        icon: Icons.delete_sweep_rounded,
                        color: AppColors.warningOrange,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Riwayat Aktivitas Terbaru
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Aktivitas Input Terbaru',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary),
                      ),
                      TextButton(
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: () => Navigator.pushNamed(context, AppRoutes.riwayatPetugasResidu),
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
                  const SizedBox(height: 8),
                  
                  if (state.historyList.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24.0),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text(
                          'Belum ada aktivitas timbangan yang tercatat hari ini.',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ),
                    )
                  else
                    ListView.builder(
                      padding: EdgeInsets.zero,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: state.historyList.length > 5 ? 5 : state.historyList.length,
                      itemBuilder: (ctx, idx) {
                        final item = state.historyList[idx];
                        
                        final title = item['title']?.toString() ?? item['classification']?.toString() ?? item['kategori']?.toString() ?? 'Setoran Timbangan';
                        final subtitle = item['subtitle']?.toString() ?? item['wargaName']?.toString() ?? item['namaWarga']?.toString() ?? item['binCode']?.toString() ?? '';
                        final weight = item['weightKg'] ?? item['actualWeightKg'] ?? item['weight'] ?? 0;
                        
                        final rawDate = item['timestamp']?.toString() ?? item['submittedAt']?.toString() ?? item['createdAt']?.toString();
                        final formattedDate = _formatDateTime(rawDate);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 5,
                                offset: const Offset(0, 2),
                              )
                            ]
                          ),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.1),
                              child: const Icon(
                                Icons.scale_rounded,
                                color: AppColors.primaryGreen,
                                size: 20,
                              ),
                            ),
                            title: Text(
                              title,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (subtitle.isNotEmpty) ...[
                                  Text(
                                    subtitle,
                                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 4),
                                ],
                                if (formattedDate.isNotEmpty)
                                  Text(
                                    formattedDate,
                                    style: const TextStyle(fontSize: 11, color: AppColors.textHint),
                                  ),
                              ],
                            ),
                            trailing: Text(
                              '$weight Kg',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 40), // Spasi bawah sebelum bottom bar
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
