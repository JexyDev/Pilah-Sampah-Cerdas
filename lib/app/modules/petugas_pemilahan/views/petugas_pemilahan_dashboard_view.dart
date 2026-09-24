import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_config.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/user_entity.dart';
import '../../../data/models/petugas_pemilahan_models.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/petugas_pemilahan_controller.dart';
import '../controllers/petugas_pemilahan_notifikasi_controller.dart';
import 'petugas_notification_view.dart';
import 'pengajuan_warga_view.dart';
import '../widgets/petugas_whitelist_guard_widget.dart';

import '../../shared/controllers/connectivity_controller.dart';
import '../../shared/controllers/user_location_controller.dart';

class PetugasPemilahanDashboardView extends ConsumerStatefulWidget {
  const PetugasPemilahanDashboardView({super.key});

  @override
  ConsumerState<PetugasPemilahanDashboardView> createState() => _PetugasPemilahanDashboardViewState();
}

class _PetugasPemilahanDashboardViewState extends ConsumerState<PetugasPemilahanDashboardView> with WidgetsBindingObserver {
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Silent reload on first load
    Future.microtask(() {
      ref.read(petugasPemilahanControllerProvider.notifier).refreshAll();
      ref.read(userLocationProvider.notifier).refreshLocation();
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
      // Silent reload on resume
      ref.read(petugasPemilahanControllerProvider.notifier).refreshAll();
      ref.read(userLocationProvider.notifier).refreshLocation();
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

  String _sanitizeTitle(String? raw) {
    if (raw == null || raw.isEmpty) return 'Timbangan Pemilahan';
    return raw
        .replaceAll(RegExp(r'Setoran\s+Manual\s+Residu', caseSensitive: false), 'Timbangan Pemilahan')
        .replaceAll(RegExp(r'\bResidu\b', caseSensitive: false), 'Pemilahan');
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
      imageUrl: AppConfig.getImageUrl(fotoPath),
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
    final name = user?.name ?? '-';
    const roleName = 'Petugas Berseka';
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
                    const SizedBox(height: 8),
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
                  final isCompact = MediaQuery.of(context).size.width < 360;
                  return Container(
                    margin: EdgeInsets.only(right: isCompact ? 8 : 12),
                    padding: EdgeInsets.symmetric(horizontal: isCompact ? 6 : 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isOnline ? AppColors.primaryGreen.withValues(alpha: 0.1) : AppColors.maroonRed.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isOnline ? AppColors.primaryGreen.withValues(alpha: 0.3) : AppColors.maroonRed.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isOnline ? AppColors.primaryGreen : AppColors.maroonRed,
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
                        if (!isCompact) ...[
                          const SizedBox(width: 6),
                          Text(
                            isOnline ? 'Online' : 'Offline',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isOnline ? AppColors.primaryGreen : AppColors.maroonRed,
                            ),
                          ),
                        ],
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
                          constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                          decoration: const BoxDecoration(
                            color: AppColors.maroonRed,
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

  Widget _buildInfoCard(BuildContext context, WidgetRef ref, UserEntity? user) {
    final rwText = user?.formattedRw.isNotEmpty == true && user?.formattedRw != '-'
        ? 'RW ${user!.formattedRw}'
        : (user?.rw.isNotEmpty == true && user?.rw != '-' ? 'RW ${user!.rw}' : '');
    final kelText = user?.kelurahan.isNotEmpty == true && user?.kelurahan != '-'
        ? (user!.kelurahan.toLowerCase().startsWith('kel') ? user.kelurahan : 'Kel. ${user.kelurahan}')
        : '';
    final wilayahBadge = [rwText, kelText].where((s) => s.isNotEmpty).join(', ');

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            // Area Penugasan
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.assignment_ind_rounded, color: AppColors.primaryGreen, size: 16),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Area Penugasan',
                        style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                      ),
                      Text(
                        wilayahBadge.isNotEmpty ? wilayahBadge : 'Belum diatur',
                        style: const TextStyle(
                          fontSize: 12, // Adjusted for readability
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Divider(height: 1, color: Colors.grey[200], thickness: 1),
            ),

            // Posisi Saat Ini
            Consumer(
              builder: (context, ref, _) {
                final locState = ref.watch(userLocationProvider);
                final isFinding = locState.isFetchingAddress;
                return GestureDetector(
                  onTap: () => ref.read(userLocationProvider.notifier).refreshLocation(context: context),
                  behavior: HitTestBehavior.opaque,
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.primaryBlue.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: isFinding 
                            ? const SizedBox(
                                width: 16, height: 16, 
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryBlue)
                              )
                            : const Icon(Icons.my_location_rounded, color: AppColors.primaryBlue, size: 16),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Posisi Saat Ini',
                              style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                            ),
                            Text(
                              isFinding 
                                  ? 'Mencari...' 
                                  : (locState.address ?? 'Ketuk untuk update'),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: isFinding ? AppColors.textSecondary : AppColors.primaryBlue,
                              ),
                              maxLines: 2, // Allow 2 lines for address if needed
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.refresh_rounded, size: 14, color: AppColors.textHint),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPointsCard(BuildContext context, int totalPoints, String? userName) {
    // Ambil nama depan saja agar tidak terlalu panjang
    final firstName = (userName ?? '').split(' ').first;
    final poinLabel = firstName.isNotEmpty ? 'Poin $firstName' : 'Poin Anda';

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, AppRoutes.poin),
      child: Container(
        padding: const EdgeInsets.all(AppDimensions.md),
        decoration: BoxDecoration(
          color: AppColors.primaryGreen,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.primaryGreen.withValues(alpha: 0.25),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.monetization_on_rounded, color: AppColors.warningYellow, size: 16),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          poinLabel,
                          style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        '$totalPoints',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 30, color: Colors.white),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Poin',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.warningYellow),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Hasil Timbangan & Pengosongan Tempat Sampah',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.stars_rounded, color: AppColors.warningYellow, size: 40),
          ),
        ],
      ),
    ),
  );
}



  Widget _buildJadwalSection(BuildContext context, List<PemilahanBinPickup> jadwalList) {
    const sectionTitle = 'Monitoring Tempat Sampah Warga';

    final criticalCount = jadwalList.where((item) => item.volumePercentage >= 70).length;
    final isAllSafe = criticalCount == 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sectionTitle,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Pantau kapasitas dan kondisi tempat sampah warga',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: isAllSafe
                    ? AppColors.primaryGreen.withValues(alpha: 0.1)
                    : AppColors.warningOrange.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                isAllSafe ? 'Semua Aman' : '$criticalCount Butuh Tindakan',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isAllSafe ? AppColors.primaryGreen : AppColors.warningOrange,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (jadwalList.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: const Row(
              children: [
                Icon(Icons.check_circle_outline_rounded, color: AppColors.primaryGreen, size: 22),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Semua tempat sampah warga dalam kondisi aman.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ),
              ],
            ),
          )
        else
          Column(
            children: jadwalList.map((item) {
              final isOrganik = item.wasteCategory.toUpperCase().contains('ORGANIK') &&
                  !item.wasteCategory.toUpperCase().contains('ANORGANIK');
              final categoryColor = isOrganik ? AppColors.primaryGreen : AppColors.warningOrange;
              final pct = item.volumePercentage.clamp(0.0, 100.0);
              final statusColor = pct >= 100
                  ? AppColors.maroonRed
                  : (pct >= 70 ? AppColors.warningOrange : AppColors.primaryGreen);

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: categoryColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isOrganik ? Icons.eco_rounded : Icons.recycling_rounded,
                            color: categoryColor,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.wargaName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${item.binCode} • ${item.wasteCategory.toUpperCase() == "NON_ORGANIC" ? "Anorganik" : item.wasteCategory.toUpperCase() == "ORGANIC" ? "Organik" : item.wasteCategory}',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: categoryColor),
                              ),
                              if (item.address.isNotEmpty || item.rw.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  item.address.isNotEmpty
                                      ? (item.rw.isNotEmpty && !item.address.contains(item.rw)
                                          ? '${item.address} (${item.rw})'
                                          : item.address)
                                      : item.rw,
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (pct >= 70)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: statusColor.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Text(
                              pct >= 100 ? 'Penuh' : 'Kritis',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: statusColor,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: pct / 100,
                              backgroundColor: Colors.grey.shade200,
                              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                              minHeight: 6,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${pct.toStringAsFixed(0)}%',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(petugasPemilahanControllerProvider);
    final unreadCount = ref.watch(petugasUnreadNotificationCountProvider);
    final dashboard = state.dashboard;

    if (dashboard != null && !dashboard.isApproved) {
      return Scaffold(
        backgroundColor: AppColors.backgroundCanvas,
        body: RefreshIndicator(
          onRefresh: () async {
            ref.read(userLocationProvider.notifier).refreshLocation();
            await ref.read(petugasPemilahanControllerProvider.notifier).refreshAll();
          },
          color: AppColors.primaryGreen,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              _buildHeader(context, ref, user, unreadCount),
              PetugasWhitelistGuardWidget(
                onRefresh: () => ref.read(petugasPemilahanControllerProvider.notifier).refreshAll(),
                statusText: dashboard.whitelistStatus == WhitelistStatus.rejected ? 'REJECTED' : 'PENDING',
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.read(userLocationProvider.notifier).refreshLocation();
          await ref.read(petugasPemilahanControllerProvider.notifier).refreshAll();
        },
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                children: [
                  _buildHeader(context, ref, user, unreadCount),
                  const SizedBox(height: 12),
                  _buildInfoCard(context, ref, user),
                ],
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(AppDimensions.md),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Poin Insentif Petugas
                  _buildPointsCard(context, dashboard?.totalPoints ?? 0, user?.name),
                  const SizedBox(height: 18),

                  // ── 📊 Berat Sampah Terkumpul ──────────────────────────────
                  const Row(
                    children: [
                      Icon(Icons.scale_rounded, size: 18, color: AppColors.primaryGreen),
                      SizedBox(width: 8),
                      Text('Berat Sampah Terkumpul', style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary,
                      )),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Akumulasi sampah yang Anda timbang',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      // ── Hari Ini ──
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border, width: 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.today_rounded, color: AppColors.primaryGreen, size: 14),
                                  SizedBox(width: 4),
                                  Expanded(
                                    child: Text('Hari Ini', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    dashboard == null ? '-' : dashboard.totalWeightKg.toStringAsFixed(1),
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(width: 2),
                                  const Text('Kg', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      
                      // ── Minggu Ini ──
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border, width: 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.date_range_rounded, color: AppColors.primaryBlue, size: 14),
                                  SizedBox(width: 4),
                                  Expanded(
                                    child: Text('Minggu Ini', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    dashboard == null ? '-' : dashboard.weeklyWeightKg.toStringAsFixed(1),
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(width: 2),
                                  const Text('Kg', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // ── Bulan Ini ──
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border, width: 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.calendar_month_rounded, color: AppColors.warningOrange, size: 14),
                                  SizedBox(width: 4),
                                  Expanded(
                                    child: Text('Bulan Ini', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    dashboard == null ? '-' : dashboard.monthlyWeightKg.toStringAsFixed(1),
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(width: 2),
                                  const Text('Kg', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // ── 📋 Menu Tugas ──────────────────────────────────────────
                  const Row(
                    children: [
                      Icon(Icons.assignment_rounded, size: 18, color: AppColors.primaryGreen),
                      SizedBox(width: 6),
                      Text('Menu Tugas', style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary,
                      )),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Kelola pengajuan dan antrean warga',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 10),
                  // ── Menu Pengajuan Pengosongan Warga ────────────────────────
                  GestureDetector(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const PengajuanWargaView()),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border, width: 1),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.warningOrange.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.delete_sweep_rounded, color: AppColors.warningOrange, size: 24),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Pengajuan Pengosongan Tempat Sampah Warga',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  state.pengajuanList.isEmpty
                                      ? 'Tidak ada pengajuan baru dari warga'
                                      : '${state.pengajuanList.length} warga meminta pengosongan sampah',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: state.pengajuanList.isEmpty
                                        ? AppColors.textSecondary
                                        : AppColors.warningOrange,
                                    fontWeight: state.pengajuanList.isEmpty
                                        ? FontWeight.normal
                                        : FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (state.pengajuanList.isNotEmpty)
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.warningOrange,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${state.pengajuanList.length}',
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          const Icon(Icons.chevron_right_rounded, color: AppColors.textHint, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // ── Monitoring Tempat Sampah Warga ─────────────────────────────
                  _buildJadwalSection(context, state.jadwalList),
                  const SizedBox(height: 20),

                  // Riwayat Aktivitas Terbaru
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.history_rounded, size: 18, color: AppColors.primaryGreen),
                                SizedBox(width: 6),
                                Text(
                                  'Riwayat Timbangan Sampah',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Catatan sampah yang sudah Anda input',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: () => Navigator.pushNamed(context, AppRoutes.riwayatPetugasPemilahan),
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
                          'Belum ada sampah yang ditimbang hari ini.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ),
                    )
                  else
                    Column(
                      children: state.historyList.take(5).map((item) {
                        final rawTitle = item['title']?.toString() ?? item['classification']?.toString() ?? item['kategori']?.toString() ?? 'Timbangan Pemilahan';
                        final title = _sanitizeTitle(rawTitle);
                        final subtitle = item['subtitle']?.toString() ?? item['wargaName']?.toString() ?? item['namaWarga']?.toString() ?? item['binCode']?.toString() ?? '';
                        final weight = item['weightKg'] ?? item['actualWeightKg'] ?? item['weight'] ?? 0;
                        
                        final rawDate = item['timestamp']?.toString() ?? item['submittedAt']?.toString() ?? item['createdAt']?.toString();
                        final formattedDate = _formatDateTime(rawDate);

                        final isPengosongan = item['type'] == 'PENGAJUAN_RESET' ||
                            (rawTitle.toLowerCase().contains('pengosongan'));

                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border, width: 1),
                          ),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: (isPengosongan ? AppColors.warningOrange : AppColors.primaryGreen).withValues(alpha: 0.1),
                              child: Icon(
                                isPengosongan ? Icons.delete_sweep_rounded : Icons.scale_rounded,
                                color: isPengosongan ? AppColors.warningOrange : AppColors.primaryGreen,
                                size: 20,
                              ),
                            ),
                            title: Text(
                              isPengosongan ? 'Pengosongan Tempat Sampah' : title,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (subtitle.isNotEmpty) ...[
                                  Text(
                                    subtitle,
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
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
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primaryGreen.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                isPengosongan ? 'Terverifikasi' : '$weight Kg',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: AppColors.primaryGreen,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  const SizedBox(height: 100), // Spasi bawah agar konten dapat di-scroll bebas dari floating button & bottom bar
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

