import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/values/app_config.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../routes/app_routes.dart';
import '../../shared/widgets/app_loading.dart';
import '../controllers/mahasiswa_controller.dart';
import '../controllers/location_ping_controller.dart';
import '../controllers/kkn_location_controller.dart';
import '../controllers/mahasiswa_notifikasi_controller.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../shared/controllers/connectivity_controller.dart';

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
      ref.read(locationPingControllerProvider.notifier).startTracking();
      final kknNotifier = ref.read(kknLocationProvider.notifier);
      kknNotifier.startTracking(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(mahasiswaControllerProvider);
    final locationState = ref.watch(locationPingControllerProvider);
    final kknLocationState = ref.watch(kknLocationProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: state.isLoading && state.dashboard == null
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
                            _buildLocationStatus(locationState, kknLocationState),
                            const SizedBox(height: AppDimensions.lg),
                            _buildQuickActions(kknLocationState),
                            const SizedBox(height: AppDimensions.lg),
                            _buildWargaSection(state),
                            const SizedBox(height: 80),
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

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 3 && hour < 11) return 'Selamat Pagi, 👋';
    if (hour >= 11 && hour < 15) return 'Selamat Siang, 👋';
    if (hour >= 15 && hour < 18) return 'Selamat Sore, 👋';
    return 'Selamat Malam, 👋';
  }

  Widget _buildHeaderAvatar(String? fotoPath, String name) {
    if (fotoPath == null || fotoPath.trim().isEmpty) {
      return Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'M',
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryGreen,
          ),
        ),
      );
    }

    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      return CachedNetworkImage(
        imageUrl: fotoPath,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => Center(
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : 'M',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
          ),
        ),
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
      errorWidget: (_, __, ___) => Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'M',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar(MahasiswaState state) {
    final dashboard = state.dashboard;
    final user = ref.watch(authProvider).user;
    final unreadCount = ref.watch(mahasiswaUnreadNotificationCountProvider);
    final isOnline = ref.watch(isOnlineProvider);

    final name = (user?.name != null && user!.name.trim().isNotEmpty)
        ? user.name
        : '-';
    final nim = (user?.nim != null && user!.nim.trim().isNotEmpty)
        ? user.nim
        : (dashboard != null && dashboard.nim.isNotEmpty ? dashboard.nim : '-');
    final jurusan = (user?.jurusan != null && user!.jurusan.trim().isNotEmpty)
        ? user.jurusan
        : (user?.prodi != null && user!.prodi.trim().isNotEmpty
            ? user.prodi
            : (dashboard != null && dashboard.jurusan.isNotEmpty ? dashboard.jurusan : '-'));
    final kelurahan = user?.kelurahan.isNotEmpty == true ? user!.kelurahan : '-';
    final rw = user?.rw.isNotEmpty == true ? user!.rw : '-';
    final jenjang = user?.jenjangPendidikan.isNotEmpty == true ? user!.jenjangPendidikan : '-';
    final fotoUrl = user?.fotoProfil;

    return SliverAppBar(
      expandedHeight: 195,
      pinned: true,
      backgroundColor: Colors.white,
      foregroundColor: AppColors.textPrimary,
      elevation: 0.5,
      actions: [
        // Online Indicator
        Center(
          child: Container(
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
          ),
        ),
        IconButton(
          onPressed: () => Navigator.pushNamed(context, AppRoutes.mahasiswaNotifikasi),
          icon: Stack(
            clipBehavior: Clip.none,
            children: [
              const Icon(Icons.notifications_outlined, color: AppColors.primaryGreen, size: 24),
              if (unreadCount > 0)
                Positioned(
                  top: -2,
                  right: -2,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    decoration: const BoxDecoration(
                      color: AppColors.dangerRed,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      unreadCount > 99 ? '99+' : '$unreadCount',
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: 8),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          color: Colors.white,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 52, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, AppRoutes.editProfilMahasiswa),
                    behavior: HitTestBehavior.opaque,
                    child: Row(
                      children: [
                        // Avatar profil gaya halaman Warga (Klik untuk Edit Profil / Lihat Foto)
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.backgroundCanvas,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _buildHeaderAvatar(fotoUrl, name),
                        ),
                        const SizedBox(width: 14),
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
                              const SizedBox(height: 3),
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
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.warningYellow,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'MAHASISWA',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$nim • $jenjang - $jurusan',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.textSecondary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: AppColors.textHint, size: 22),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Sub-info NIM, Jurusan & Lokasi
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: AppColors.primaryGreen),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '$kelurahan • RW $rw',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primaryGreen,
                            ),
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
      ),
      title: const Text(
        'Dashboard KKN',
        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: AppColors.textPrimary),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary Cards (3 cards)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildSummaryCards(MahasiswaState state) {
    final d = state.dashboard;
    final user = ref.watch(authProvider).user;
    final userName = user?.name ?? '';
    final userRw = user?.rw ?? '-';

    // Total Warga Dampingan Mahasiswa ini
    final myWargaList = state.wargaList.where((w) {
      if (w.role != 'WARGA') return false;
      
      final cleanWargaRw = w.rw.trim().replaceFirst(RegExp(r'^0+'), '');
      final cleanUserRw = userRw.trim().replaceFirst(RegExp(r'^0+'), '');
      
      final isMyCitizen = w.pendampingName.trim().toLowerCase() == userName.trim().toLowerCase();
      final isMyRw = cleanUserRw.isEmpty || cleanWargaRw == cleanUserRw;

      return isMyCitizen && isMyRw;
    }).toList();

    final totalWarga = myWargaList.length;

    // Aktivasi Tempat Sampah: Warga dampingan mahasiswa ini yang tempat sampahnya sudah aktif
    final wargaAktif = myWargaList.where((w) => w.isActivated).length;

    return Row(
      children: [
        Expanded(
          child: _SummaryCard(
            icon: Icons.people_alt_rounded,
            label: 'Total Warga',
            value: '$totalWarga',
            color: AppColors.primaryGreen,
          ),
        ),
        const SizedBox(width: AppDimensions.sm),
        Expanded(
          child: _SummaryCard(
            icon: Icons.verified_user_rounded,
            label: 'Tempat Sampah Aktif',
            value: '$wargaAktif',
            color: AppColors.primaryBlueDark,
          ),
        ),
        const SizedBox(width: AppDimensions.sm),
        Expanded(
          child: _SummaryCard(
            icon: Icons.stars_rounded,
            label: 'Poin Personal',
            value: '${d?.contributionPoints ?? 0}',
            color: AppColors.success,
          ),
        ),
      ],
    );
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // Location Status Widget
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildLocationStatus(LocationPingState locationState, KknLocationState kknState) {
    final bool isGpsOk = locationState.gpsEnabled && locationState.permissionGranted && locationState.errorMessage == null;
    final bool isInsideZone = kknState.isInsideRadius;
    final bool isOn = locationState.isTracking && isGpsOk && isInsideZone;
    final lastPing = locationState.lastPingTime;
    final durationMins = (kknState.inZoneDurationSeconds / 60).floor();

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.md,
        vertical: 16,
      ),
      decoration: BoxDecoration(
        color: isOn
            ? AppColors.success.withValues(alpha: 0.1)
            : AppColors.dangerRed.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        border: Border.all(
          color: isOn
              ? AppColors.success.withValues(alpha: 0.3)
              : AppColors.dangerRed.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isOn ? Icons.location_on_rounded : Icons.location_off_rounded,
            color: isOn ? AppColors.success : AppColors.dangerRed,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOn ? 'Status: ZONA AKTIF' : 'Status: ZONA TIDAK AKTIF',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: isOn ? AppColors.successDark : AppColors.dangerRed,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isOn 
                      ? 'Anda terdeteksi di dalam zona KKN ($durationMins / 120 Menit).' 
                      : 'Anda berada di luar zona geofence KKN. Durasi tidak bertambah.',
                  style: TextStyle(
                    fontSize: 11,
                    color: isOn ? AppColors.successDark : AppColors.dangerRed,
                  ),
                ),
                if (lastPing != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Terakhir terdeteksi: ${DateFormat('HH:mm').format(lastPing)}',
                    style: TextStyle(
                      fontSize: 10,
                      color: isOn
                          ? AppColors.successDark.withValues(alpha: 0.7)
                          : AppColors.dangerRed.withValues(alpha: 0.7),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ]
              ],
            ),
          ),
          Icon(
            isOn ? Icons.my_location_rounded : Icons.location_off_rounded,
            color: isOn ? AppColors.success : AppColors.dangerRed,
            size: 24,
          )
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Quick Actions
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildQuickActions(KknLocationState kknState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Menu Utama KKN',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _MenuTileCard(
                icon: Icons.groups_rounded,
                title: 'Kelompok KKN',
                subtitle: 'Lihat tim & DPL',
                gradientColors: const [AppColors.primaryBlueLight, AppColors.primaryBlue],
                onTap: () => Navigator.pushNamed(context, AppRoutes.kelompokKkn),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MenuTileCard(
                icon: Icons.qr_code_scanner_rounded,
                title: 'Aktivasi Tempat Sampah',
                subtitle: 'Pindai barcode warga',
                gradientColors: const [AppColors.primaryBlue, AppColors.primaryBlueDark],
                onTap: () {
                  Navigator.pushNamed(
                    context, 
                    AppRoutes.monitoringWarga, 
                    arguments: 'aktivasi_bin',
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _MenuTileCard(
                icon: Icons.location_on_rounded,
                title: 'Presensi GPS KKN',
                subtitle: 'Presensi ${kknState.targetDurationMinutes % 60 == 0 ? '${kknState.targetDurationMinutes ~/ 60} jam' : '${kknState.targetDurationMinutes} menit'} zona KKN',
                gradientColors: const [AppColors.primaryBlueLight, AppColors.primaryBlue],
                onTap: () => Navigator.pushNamed(context, AppRoutes.kknAttendance),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MenuTileCard(
                icon: Icons.recycling_rounded,
                title: 'Kegiatan Mahasiswa',
                subtitle: 'Individu & Pemanfaatan',
                gradientColors: const [AppColors.primaryBlue, AppColors.primaryBlueDark],
                onTap: () => Navigator.pushNamed(context, AppRoutes.pemanfaatanSampah),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _MenuTileCard(
                icon: Icons.rule_rounded,
                title: 'Pengajuan Izin',
                subtitle: 'Izin/Sakit DPL',
                gradientColors: const [Color(0xFFF59E0B), Color(0xFFD97706)],
                onTap: () => Navigator.pushNamed(context, AppRoutes.pengajuanIzin),
              ),
            ),
            const SizedBox(width: 12),
            const Spacer(),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Warga Dampingan Section (list terakhir)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildWargaSection(MahasiswaState state) {
    final user = ref.watch(authProvider).user;
    final userKel = user?.kelurahan ?? '-';
    final userRw = user?.rw ?? '-';

    final userName = user?.name ?? '';

    // Filter QC: Tampilkan HANYA warga si mahasiswa tersebut (berdasarkan nama)
    // dan pastikan sesuai dengan RW penugasan mahasiswa.
    final list = state.wargaList.where((w) {
      if (!w.isActivated) return false;
      
      final cleanWargaRw = w.rw.trim().replaceFirst(RegExp(r'^0+'), '');
      final cleanUserRw = userRw.trim().replaceFirst(RegExp(r'^0+'), '');
      
      final isMyCitizen = w.pendampingName.trim().toLowerCase() == userName.trim().toLowerCase();
      final isMyRw = cleanUserRw.isEmpty || cleanWargaRw == cleanUserRw;

      return isMyCitizen && isMyRw;
    }).map((w) {
      final displayAddr = w.address.contains('Bojongsoang') || w.address.contains('RW')
          ? w.address
          : 'Jl. ${w.wargaName} No. ${w.binId.length > 3 ? w.binId.substring(w.binId.length - 2) : "4"}, RW $userRw, $userKel';
      return WargaDampingan(
        wargaId: w.wargaId,
        binId: w.binId,
        wargaName: w.wargaName,
        address: displayAddr,
        kelurahan: userKel,
        rw: userRw,
        mahasiswaId: w.mahasiswaId,
        recentLogs: w.recentLogs,
        isActivated: w.isActivated,
        role: w.role,
        totalPoints: w.totalPoints,
        apiCorrectPercentage: w.apiCorrectPercentage,
      );
    }).toList();
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
                currentUserName: user?.name ?? '',
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
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
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
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _MenuTileCard extends StatelessWidget {
  const _MenuTileCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.gradientColors,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primaryColor = gradientColors.first;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: primaryColor.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: gradientColors,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withValues(alpha: 0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(icon, color: Colors.white, size: 22),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.textHint),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  title,
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
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _WargaCard extends StatelessWidget {
  const _WargaCard({
    required this.warga,
    required this.onTap,
    this.currentUserName = '',
  });

  final WargaDampingan warga;
  final VoidCallback onTap;
  final String currentUserName;

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
                      if (warga.isActivated) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEBF5FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF90CDF4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.verified_rounded, size: 11, color: AppColors.primaryBlueDark),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  warga.pendampingName.isNotEmpty 
                                      ? 'Diaktivasi: ${warga.pendampingName}' 
                                      : (currentUserName.isNotEmpty ? 'Diaktivasi: $currentUserName' : 'Diaktivasi Mahasiswa'),
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryBlueDark,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
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
