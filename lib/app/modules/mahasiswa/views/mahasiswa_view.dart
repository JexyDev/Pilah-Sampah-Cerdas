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
import '../../riwayat/controllers/riwayat_controller.dart'
    show pointHistoryProvider;
import 'data_logbook_harian_view.dart' show logbookListProvider;
import 'riwayat_pemanfaatan_view.dart' show riwayatPemanfaatanProvider;
import 'data_proker_view.dart' show prokerDataListProvider;

class MahasiswaView extends ConsumerStatefulWidget {
  const MahasiswaView({super.key});

  @override
  ConsumerState<MahasiswaView> createState() => _MahasiswaViewState();
}

class _MahasiswaViewState extends ConsumerState<MahasiswaView>
    with WidgetsBindingObserver {
  bool _isTimelineVisible = true;
  bool _isStatsVisible = true;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(mahasiswaControllerProvider.notifier).fetchAll();

      final kknState = ref.read(kknLocationProvider);
      if (!kknState.isTracking) {
        ref.read(locationPingControllerProvider.notifier).startTracking();
        // Cek status kegiatan KKN terbaru dari server. Jika ada yang aktif, otomatis resume.
        ref.read(kknLocationProvider.notifier).fetchKegiatanAktif();
      }
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
      if (!mounted) return;

      final kknState = ref.read(kknLocationProvider);
      if (kknState.isTracking) {
        ref.read(kknLocationProvider.notifier).forceLocationUpdate(context);
      } else {
        ref.read(kknLocationProvider.notifier).fetchKegiatanAktif();
      }

      ref.read(mahasiswaControllerProvider.notifier).refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    // [GRACE PERIOD] Pantau isGpsGlitching dari backend.
    // Saat backend mendeteksi GPS glitch (koordinat melenceng sesaat), backend
    // menyisipkan PENDING_PAUSE di jedaLogs tanpa mengubah status BERLANGSUNG.
    // Mobile menampilkan toast peringatan ringan agar mahasiswa tahu GPS-nya lemah.
    // Toast otomatis hilang saat GPS kembali normal (isGpsGlitching kembali false).
    ref.listen<LocationPingState>(locationPingControllerProvider, (
      previous,
      next,
    ) {
      if (!mounted) return;
      final wasGlitching = previous?.isGpsGlitching ?? false;
      final isGlitching = next.isGpsGlitching;

      if (!wasGlitching && isGlitching) {
        // GPS baru saja terdeteksi glitch oleh backend
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.gps_not_fixed, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Sinyal GPS tidak stabil. Pastikan Anda berada di area posko.',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
            backgroundColor: Color(0xFFE65100),
            duration: Duration(seconds: 5),
            behavior: SnackBarBehavior.floating,
            margin: EdgeInsets.all(12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(10)),
            ),
          ),
        );
      } else if (wasGlitching && !isGlitching) {
        // GPS kembali normal — tutup snackbar peringatan jika masih tampil
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
      }
    });

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
              onRefresh: () async {
                ref.invalidate(riwayatPemanfaatanProvider);
                ref.invalidate(prokerDataListProvider);
                ref.invalidate(logbookListProvider);
                ref.invalidate(pointHistoryProvider);
                await ref.read(mahasiswaControllerProvider.notifier).refresh();
              },
              color: AppColors.primaryGreen,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _buildHeader(state)),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _buildTargetKegiatan(
                          state,
                          locationState,
                          kknLocationState,
                        ),
                        const SizedBox(height: 8),
                        _buildActiveTimelineCard(),
                        const SizedBox(height: 8),
                        _buildKknStatsRow(context, ref),
                        const SizedBox(height: 8),
                        _buildQuickActions(kknLocationState),
                        const SizedBox(height: 8),
                        _buildWargaSection(state),
                        const SizedBox(height: 40),
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
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryGreen,
            ),
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
      errorWidget: (_, __, ___) => Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'M',
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryGreen,
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(MahasiswaState state) {
    final dashboard = state.dashboard;
    final user = ref.watch(authProvider).user;
    final unreadCount = ref.watch(mahasiswaUnreadNotificationCountProvider);
    final isOnline = ref.watch(isOnlineProvider);
    final kknLocationState = ref.watch(kknLocationProvider);
    final locationPingState = ref.watch(locationPingControllerProvider);

    final name = (user?.name != null && user!.name.trim().isNotEmpty)
        ? user.name
        : '-';
    final nim = (user?.nim != null && user!.nim.trim().isNotEmpty)
        ? user.nim
        : (dashboard != null && dashboard.nim.isNotEmpty ? dashboard.nim : '-');
    String jurusanRaw =
        (user?.jurusan != null && user!.jurusan.trim().isNotEmpty)
        ? user.jurusan
        : (user?.prodi != null && user!.prodi.trim().isNotEmpty
              ? user.prodi
              : (dashboard != null && dashboard.jurusan.isNotEmpty
                    ? dashboard.jurusan
                    : '-'));
    final kelurahan = user?.kelurahan.isNotEmpty == true
        ? user!.kelurahan
        : '-';
    final rw = user?.rw.isNotEmpty == true ? user!.rw : '-';
    final jenjang = user?.jenjangPendidikan.isNotEmpty == true
        ? user!.jenjangPendidikan
        : '-';

    // Hindari duplikasi S1 - S1 Sistem Informasi
    if (jenjang != '-' && jurusanRaw.startsWith('$jenjang ')) {
      jurusanRaw = jurusanRaw.substring(jenjang.length + 1).trim();
    }
    final jurusan = jurusanRaw;
    final fotoUrl = user?.fotoProfil;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 16,
        right: 16,
        bottom: 10,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Baris 1: Avatar + Info Mahasiswa + Trailing Actions (Online & Notifikasi)
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              GestureDetector(
                onTap: () =>
                    Navigator.pushNamed(context, AppRoutes.editProfilMahasiswa),
                behavior: HitTestBehavior.opaque,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.backgroundCanvas,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: _buildHeaderAvatar(fotoUrl, name),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.pushNamed(
                    context,
                    AppRoutes.editProfilMahasiswa,
                  ),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Sapaan + Badge MAHASISWA (Diposisikan di baris sapaan agar tidak mepet/nabrak status Online)
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
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 5,
                              vertical: 1.5,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.warningYellow,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'MAHASISWA',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      // Nama Mahasiswa memiliki baris horizontal penuh
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
                      const SizedBox(height: 2),
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
              ),
              const SizedBox(width: 8),
              // Status Online terpisah dengan margin rapi
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                decoration: BoxDecoration(
                  color: isOnline
                      ? AppColors.primaryGreen.withValues(alpha: 0.1)
                      : AppColors.dangerRed.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
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
                      width: 7,
                      height: 7,
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
                              blurRadius: 4,
                              spreadRadius: 1,
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isOnline ? 'Online' : 'Offline',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isOnline
                            ? AppColors.primaryGreen
                            : AppColors.dangerRed,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              // Notifikasi
              IconButton(
                padding: const EdgeInsets.all(6),
                constraints: const BoxConstraints(),
                onPressed: () =>
                    Navigator.pushNamed(context, AppRoutes.mahasiswaNotifikasi),
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Image.asset(
                      'assets/icons/notification.png',
                      color: AppColors.primaryGreen,
                      width: 22,
                      height: 22,
                    ),
                    if (unreadCount > 0)
                      Positioned(
                        top: -2,
                        right: -2,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          constraints: const BoxConstraints(
                            minWidth: 14,
                            minHeight: 14,
                          ),
                          decoration: const BoxDecoration(
                            color: AppColors.dangerRed,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            unreadCount > 99 ? '99+' : '$unreadCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
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
          const SizedBox(height: 8),
          // Baris 2: Lokasi Penugasan & GPS Card Terstruktur (2 Tier agar alamat tidak terpotong)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppColors.primaryGreen.withValues(alpha: 0.16),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Tier 1: Kelurahan, RW, & Tombol Perbarui Alamat
                Row(
                  children: [
                    const Icon(
                      Icons.location_on,
                      size: 13,
                      color: AppColors.primaryGreen,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '$kelurahan • RW $rw',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryGreen,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (!kknLocationState.isFetchingAddress &&
                        (kknLocationState.currentPosition != null ||
                            locationPingState.lastLatitude != null))
                      GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () {
                          final lat =
                              kknLocationState.currentPosition?.latitude ??
                              locationPingState.lastLatitude!;
                          final lng =
                              kknLocationState.currentPosition?.longitude ??
                              locationPingState.lastLongitude!;
                          ref
                              .read(kknLocationProvider.notifier)
                              .fetchAddress(lat, lng);
                        },
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.refresh_rounded,
                                size: 13,
                                color: AppColors.primaryBlue,
                              ),
                              SizedBox(width: 3),
                              Text(
                                'Perbarui',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primaryBlue,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                // Tier 2: Alamat Lengkap GPS (Multiline 2 Baris agar tidak terpotong)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 1),
                      child: Icon(
                        Icons.my_location_rounded,
                        size: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        kknLocationState.isFetchingAddress
                            ? 'Mencari alamat...'
                            : (kknLocationState.currentAddress ??
                                  ((kknLocationState.currentPosition != null ||
                                          locationPingState.lastLatitude !=
                                              null)
                                      ? '${(kknLocationState.currentPosition?.latitude ?? locationPingState.lastLatitude!).toStringAsFixed(4)}, ${(kknLocationState.currentPosition?.longitude ?? locationPingState.lastLongitude!).toStringAsFixed(4)}'
                                      : 'Menunggu GPS...')),
                        style: const TextStyle(
                          fontSize: 10.5,
                          color: AppColors.textSecondary,
                          height: 1.25,
                        ),
                        maxLines: 2,
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
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary Cards (3 cards)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildTargetKegiatan(
    MahasiswaState state,
    LocationPingState locationState,
    KknLocationState kknLocationState,
  ) {
    if (state.timesheetSummary == null) {
      return _buildLocationStatus(locationState, kknLocationState);
    }

    final summary = state.timesheetSummary!;
    final students = summary['students'] is List ? (summary['students'] as List) : [];
    if (students.isEmpty) {
      return _buildLocationStatus(locationState, kknLocationState);
    }

    final student = students.first is Map ? (students.first as Map) : {};
    final totalFormatted =
        student['totalFormatted']?.toString() ?? '0 Jam 0 Menit';
    final targetTotalHours =
        int.tryParse(student['targetTotalHours']?.toString() ?? '') ?? 100;
    final progressPercentage =
        double.tryParse(student['progressPercentage']?.toString() ?? '') ?? 0.0;

    final targetRules = summary['targetRules'] is Map ? (summary['targetRules'] as Map) : {};
    final targetTotalHari =
        int.tryParse(targetRules['targetTotalHari']?.toString() ?? '') ?? 50;
    final targetTotalPekan =
        int.tryParse(targetRules['targetTotalPekan']?.toString() ?? '') ?? 10;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.track_changes_rounded,
                  color: AppColors.primaryGreen,
                  size: 18,
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Target Kegiatan Lapangan',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildTargetItem(
                  icon: Icons.calendar_month_outlined,
                  value: '$targetTotalPekan',
                  unit: 'Pekan',
                  label: 'Periode Kegiatan',
                ),
              ),
              Container(width: 1, height: 32, color: Colors.grey.shade200),
              Expanded(
                child: _buildTargetItem(
                  icon: Icons.check_circle_outline_rounded,
                  value: '$targetTotalHari',
                  unit: 'Hari',
                  label: 'Total Hari Kegiatan',
                ),
              ),
              Container(width: 1, height: 32, color: Colors.grey.shade200),
              Expanded(
                child: _buildTargetItem(
                  icon: Icons.access_time_rounded,
                  value: '$targetTotalHours',
                  unit: 'Jam Target',
                  label: 'Minimal Kumulatif',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Tercapai: $totalFormatted / $targetTotalHours Jam',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${progressPercentage.toStringAsFixed(1)}%',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primaryGreen,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (progressPercentage / 100).clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: Colors.grey.shade200,
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.primaryGreen,
              ),
            ),
          ),
          const SizedBox(height: 12),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.blue.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.blue.withValues(alpha: 0.1)),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.timer_outlined,
                      size: 16,
                      color: AppColors.primaryBlue,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Sesi Hari Ini: ${kknLocationState.inZoneDurationSeconds} mnt / ${kknLocationState.targetDurationMinutes} mnt',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryBlue,
                        ),
                      ),
                    ),
                    if (kknLocationState.isTracking)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Aktif',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: kknLocationState.targetDurationMinutes > 0
                        ? (kknLocationState.inZoneDurationSeconds /
                                  kknLocationState.targetDurationMinutes)
                              .clamp(0.0, 1.0)
                        : 0.0,
                    minHeight: 4,
                    backgroundColor: AppColors.primaryBlue.withValues(
                      alpha: 0.15,
                    ),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.primaryBlue,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _buildLocationStatus(locationState, kknLocationState),
        ],
      ),
    );
  }

  Widget _buildTargetItem({
    required IconData icon,
    required String value,
    required String unit,
    required String label,
  }) {
    return Column(
      children: [
        Icon(icon, size: 18, color: AppColors.primaryGreen),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        Text(
          unit,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppColors.primaryGreen,
          ),
        ),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 9, color: AppColors.textHint),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Location Status Widget
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildLocationStatus(
    LocationPingState locationState,
    KknLocationState kknState,
  ) {
    final bool isInitializing =
        kknState.isTracking &&
        kknState.currentPosition == null &&
        kknState.error == null;
    final bool isInsideZone = kknState.isInsideRadius;
    final bool isOn =
        kknState.isTracking && kknState.error == null && isInsideZone;
    final lastPing = locationState.lastPingTime;

    Color boxColor;
    Color borderColor;
    IconData iconData;
    String statusTitle;
    String statusDesc;
    Color textColor;

    if (isInitializing) {
      boxColor = AppColors.primaryBlueLight.withValues(alpha: 0.1);
      borderColor = AppColors.primaryBlue.withValues(alpha: 0.3);
      iconData = Icons.satellite_alt_rounded;
      statusTitle = 'Memeriksa Lokasi...';
      statusDesc = 'Sedang mencari kordinat GPS Anda.';
      textColor = AppColors.primaryBlueDark;
    } else if (kknState.activeActivity == null ||
        kknState.activeActivity!.isEmpty) {
      boxColor = Colors.grey.withValues(alpha: 0.1);
      borderColor = Colors.grey.withValues(alpha: 0.5);
      iconData = Icons.info_outline_rounded;
      statusTitle = 'Tidak Ada Kegiatan Aktif';
      statusDesc = 'Jadwal KKN belum tersedia atau belum aktif.';
      textColor = Colors.grey[700]!;
    } else if (isOn) {
      boxColor = AppColors.success.withValues(alpha: 0.1);
      borderColor = AppColors.success.withValues(alpha: 0.3);
      iconData = Icons.location_on_rounded;
      statusTitle = 'Status: Aktif Memantau';
      statusDesc = 'Anda terdeteksi di dalam Area Wilayah KKN.';
      textColor = AppColors.successDark;
    } else {
      boxColor = AppColors.dangerRed.withValues(alpha: 0.1);
      borderColor = AppColors.dangerRed.withValues(alpha: 0.3);
      iconData = Icons.location_off_rounded;
      statusTitle = 'Status: Di Luar Area';
      statusDesc =
          kknState.error ??
          'Anda berada di luar Area Wilayah KKN. Durasi tidak bertambah.';
      textColor = AppColors.dangerRed;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: boxColor,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Icon(iconData, color: textColor, size: 22),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  statusTitle,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  statusDesc,
                  style: TextStyle(fontSize: 10, color: textColor),
                ),
                if (lastPing != null) ...[
                  const SizedBox(height: 1),
                  Text(
                    'Terakhir terdeteksi: ${DateFormat('HH:mm').format(lastPing)}',
                    style: TextStyle(
                      fontSize: 9,
                      color: isOn
                          ? AppColors.successDark.withValues(alpha: 0.7)
                          : AppColors.dangerRed.withValues(alpha: 0.7),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
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
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _MenuTileCard(
                  icon: Icons.groups_rounded,
                  iconAsset: 'assets/icons/employees.png',
                  title: 'Kelompok KKN',
                  subtitle: 'Lihat tim & DPL',
                  gradientColors: const [
                    AppColors.primaryBlueLight,
                    AppColors.primaryBlue,
                  ],
                  onTap: () =>
                      Navigator.pushNamed(context, AppRoutes.kelompokKkn),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _MenuTileCard(
                  icon: Icons.location_on_rounded,
                  iconAsset: 'assets/icons/verified-user.png',
                  title: 'Presensi',
                  subtitle:
                      'Presensi ${kknState.targetDurationMinutes % 60 == 0 ? '${kknState.targetDurationMinutes ~/ 60} jam' : '${kknState.targetDurationMinutes} menit'} Area Wilayah KKN',
                  gradientColors: const [
                    AppColors.primaryBlueLight,
                    AppColors.primaryBlue,
                  ],
                  onTap: () =>
                      Navigator.pushNamed(context, AppRoutes.kknAttendance),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _MenuTileCard(
                  icon: Icons.assignment_rounded,
                  iconAsset: 'assets/icons/activity.png',
                  title: 'Program & Aksi KKN',
                  subtitle: 'Proker, Logbook, Hasil',
                  gradientColors: const [
                    AppColors.primaryBlueLight,
                    AppColors.primaryBlue,
                  ],
                  onTap: () =>
                      Navigator.pushNamed(context, AppRoutes.dataProker),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _MenuTileCard(
                  icon: Icons.rule_rounded,
                  iconAsset: 'assets/icons/submission.png',
                  title: 'Pengajuan Izin',
                  subtitle: 'Izin/Sakit DPL',
                  gradientColors: const [
                    AppColors.primaryBlueLight,
                    AppColors.primaryBlue,
                  ],
                  onTap: () =>
                      Navigator.pushNamed(context, AppRoutes.pengajuanIzin),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _MenuTileCard(
                  icon: Icons.analytics_rounded,
                  iconAsset: 'assets/icons/view.png',
                  title: 'Monitoring Warga',
                  subtitle: 'Pantau poin & aktivitas',
                  gradientColors: const [
                    AppColors.primaryBlueLight,
                    AppColors.primaryBlue,
                  ],
                  onTap: () => Navigator.pushNamed(
                    context,
                    AppRoutes.monitoringWarga,
                    arguments: 'monitoring',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _MenuTileCard(
                  icon: Icons.add_business_rounded,
                  iconAsset: 'assets/icons/recycle-bin.png',
                  title: 'Fasilitas Tata Kelola Sampah',
                  subtitle: 'Daftar fasilitas baru',
                  gradientColors: const [
                    AppColors.primaryBlueLight,
                    AppColors.primaryBlue,
                  ],
                  onTap: () =>
                      Navigator.pushNamed(context, AppRoutes.registerFasilitas),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        // Logbook & Laporan Akhir Row
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () =>
                    Navigator.pushNamed(context, AppRoutes.dataLogbookHarian),
                icon: const Icon(Icons.edit_document, size: 18),
                label: const Text(
                  'Input Logbook',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 1.5,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () =>
                    Navigator.pushNamed(context, AppRoutes.inputLaporanAkhir),
                icon: const Icon(Icons.menu_book_rounded, size: 18),
                label: const Text(
                  'Laporan Akhir',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 1.5,
                ),
              ),
            ),
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
    final displayedWarga = state.wargaList.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Warga Dampingan Terbaru',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.only(
            left: 16,
            right: 16,
            bottom: 16,
            top: 8,
          ),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (state.wargaList.length > 3)
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: GestureDetector(
                      onTap: () => Navigator.pushNamed(
                        context,
                        AppRoutes.monitoringWarga,
                      ),
                      child: const Text(
                        'Lihat Selengkapnya',
                        style: TextStyle(
                          color: AppColors.primaryGreen,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),

              if (displayedWarga.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: const Column(
                    children: [
                      Icon(
                        Icons.people_outline,
                        size: 48,
                        color: AppColors.textHint,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Belum ada warga dampingan',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                )
              else
                ListView.separated(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: displayedWarga.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final w = displayedWarga[index];
                    return _WargaCard(
                      warga: w,
                      currentUserName: user?.name ?? '',
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          AppRoutes.detailWarga,
                          arguments: w,
                        );
                      },
                    );
                  },
                ),
            ],
          ),
        ),
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
              child: const Icon(
                Icons.cloud_off_rounded,
                size: 48,
                color: AppColors.dangerRed,
              ),
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
              onPressed: () =>
                  ref.read(mahasiswaControllerProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Coba Lagi'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Linimasa KKN Aktif
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildKknStatsRow(BuildContext context, WidgetRef ref) {
    final mhsState = ref.watch(mahasiswaControllerProvider);

    // 1. Ambil Angka Presensi Langsung dari Backend (Single Source of Truth)
    int hariTerpenuhi = 0;
    int hariTidakMemenuhi = 0;
    final Set<String> countedScheduleIds = {};

    if (mhsState.timesheetSummary != null) {
      final summary = mhsState.timesheetSummary!;
      final students = summary['students'] is List ? (summary['students'] as List) : [];
      if (students.isNotEmpty) {
        final student = students.first is Map ? (students.first as Map) : {};
        
        // Membaca key 'totalHariTerpenuhi' (Single Source of Truth Backend)
        hariTerpenuhi = int.tryParse(student['totalHariTerpenuhi']?.toString() ?? '') ?? 0;

        // Membaca key 'totalHariTidakMemenuhi'
        hariTidakMemenuhi =
            int.tryParse(student['totalHariTidakMemenuhi']?.toString() ?? '') ?? 0;

        final sessions = student['sessions'] is List ? (student['sessions'] as List) : [];
        for (final sess in sessions) {
          if (sess is Map && sess['scheduleId'] != null) {
            countedScheduleIds.add(sess['scheduleId'].toString());
          }
        }
      }
    }

    // Hitung kegiatan aktif yang belum teragregasi di timesheetSummary atau saat timesheet kosong
    for (final item in mhsState.kegiatanAktifList) {
      if (item is Map) {
        final schId = item['id']?.toString() ?? '';
        if (schId.isNotEmpty && countedScheduleIds.contains(schId)) {
          continue; // Sudah terhitung di timesheet
        }
        final status = (item['attendanceStatus'] ?? item['statusKehadiran'] ?? '').toString().toUpperCase();
        final isMemenuhi = item['isMemenuhiDurasi'] == true;
        if (status == 'HADIR_MEMENUHI' || (status == 'HADIR' && isMemenuhi)) {
          hariTerpenuhi++;
          if (schId.isNotEmpty) countedScheduleIds.add(schId);
        } else if (status == 'HADIR_TIDAK_MEMENUHI' ||
            (status.contains('HADIR') && !isMemenuhi && item['checkOutAt'] != null)) {
          hariTidakMemenuhi++;
          if (schId.isNotEmpty) countedScheduleIds.add(schId);
        }
      }
    }

    // 2. Hitung Total Warga Dampingan Personal & Agregasi Dashboard (BEND-MEMO/MOBILE-INTEGRATION/2026-09/007)
    final user = ref.watch(authProvider).user;
    final dashboardWargaStats = mhsState.dashboard?.wargaStats;

    // Filter lokal warga yang resmi didampingi akun ini (Personal Warga Dampingan)
    final personalWargaList = mhsState.wargaList.where((w) {
      if (w.role.isNotEmpty && w.role.toUpperCase() != 'WARGA') return false;
      final isMyId = w.mahasiswaId.isNotEmpty && w.mahasiswaId == user?.id;
      final isMyName = w.pendampingName.trim().isNotEmpty &&
          w.pendampingName.trim().toLowerCase() ==
              (user?.name ?? '').trim().toLowerCase();
      final isMyPendamping = (w.pendampingKkn != null &&
          ((w.pendampingKkn!.id.isNotEmpty && w.pendampingKkn!.id == user?.id) ||
              (user?.nim.isNotEmpty == true && w.pendampingKkn!.nim == user?.nim) ||
              (user?.name.isNotEmpty == true &&
                  w.pendampingKkn!.name.trim().toLowerCase() ==
                      user?.name.trim().toLowerCase())));
      return isMyId || isMyName || isMyPendamping;
    }).toList();

    // Kartu 1: Total Warga Dampingan Anda (Personal)
    final totalWarga = dashboardWargaStats?.totalWargaDampingan ?? personalWargaList.length;

    // Kartu 2: Tempat Sampah Aktif Terpasang pada Warga Dampingan Anda
    final wargaAktif = dashboardWargaStats?.wargaDampinganBinAktif ??
        personalWargaList.where((w) => w.isActivated).length;

    // 4. Hitung Data Pemanfaatan & Hasil Sampah
    final pemanfaatanAsync = ref.watch(riwayatPemanfaatanProvider);
    final laporanCount = pemanfaatanAsync.value?.length ?? 0;

    final prokerAsync = ref.watch(prokerDataListProvider);
    final prokerCount = prokerAsync.value?.length ?? 0;

    // 5. Hitung Pengajuan Izin & Sakit (Terpisah)
    final pengajuanAsync = ref.watch(pengajuanSummaryProvider);
    final izinCount = pengajuanAsync.value?.izinCount ?? 0;
    final sakitCount = pengajuanAsync.value?.sakitCount ?? 0;

    // 6. Hitung Logbook Harian Mahasiswa
    final logbookAsync = ref.watch(logbookListProvider);
    final logbookCount = logbookAsync.value?.length ?? 0;

    // 7. Total Poin Personal
    final personalPoints = mhsState.dashboard?.personalPoints ?? mhsState.dashboard?.contributionPoints ?? 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () => setState(() => _isStatsVisible = !_isStatsVisible),
            child: Row(
              children: [
                const Icon(
                  Icons.bar_chart_rounded,
                  color: AppColors.primaryGreen,
                  size: 20,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Statistik Aktivitas',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Icon(
                  _isStatsVisible
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: AppColors.textSecondary,
                ),
              ],
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            child: !_isStatsVisible
                ? const SizedBox.shrink()
                : Column(
                    children: [
                      const SizedBox(height: 16),
                      // ── Poin Personal Highlight Banner ─────────────────────────
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.primaryGreen, Color(0xFF1B8044)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryGreen.withValues(
                                alpha: 0.25,
                              ),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.stars_rounded,
                                color: Colors.white,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Poin Personal KKN',
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  Text(
                                    '$personalPoints PTS',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            InkWell(
                              onTap: () =>
                                  Navigator.pushNamed(context, AppRoutes.poin),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Riwayat',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primaryGreen,
                                      ),
                                    ),
                                    SizedBox(width: 2),
                                    Icon(
                                      Icons.chevron_right_rounded,
                                      size: 14,
                                      color: AppColors.primaryGreen,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),

                      // ── Baris 1: Presensi Terpenuhi & Tidak Memenuhi ──────────
                      Row(
                        children: [
                          Expanded(
                            child: _KknStatCard(
                              topText: 'Presensi',
                              middleText: '$hariTerpenuhi',
                              bottomText: 'Terpenuhi',
                              color: AppColors.primaryGreen,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _KknStatCard(
                              topText: 'Presensi',
                              middleText: '$hariTidakMemenuhi',
                              bottomText: 'Tidak Memenuhi',
                              color: AppColors.warningOrange,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // ── Baris 2: Warga Dampingan & Tempat Sampah Aktif ─────────
                      Row(
                        children: [
                          Expanded(
                            child: _KknStatCard(
                              topText: 'Total',
                              middleText: '$totalWarga',
                              bottomText: 'Warga Dampingan Anda',
                              color: AppColors.primaryGreen,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _KknStatCard(
                              topText: 'Tempat Sampah Warga',
                              middleText: '$wargaAktif/$totalWarga',
                              bottomText: 'Aktif Terpasang',
                              color: AppColors.primaryBlueDark,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // ── Baris 3: Pengajuan Izin & Pengajuan Sakit ───────────────
                      Row(
                        children: [
                          Expanded(
                            child: _KknStatCard(
                              topText: 'Pengajuan',
                              middleText: '$izinCount Kali',
                              bottomText: 'Izin Kegiatan',
                              color: AppColors.warningYellow,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _KknStatCard(
                              topText: 'Pengajuan',
                              middleText: '$sakitCount Kali',
                              bottomText: 'Izin Sakit',
                              color: const Color(0xFFE11D48),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // ── Baris 4: Pemanfaatan Sampah & Logbook Harian ────────────
                      Row(
                        children: [
                          Expanded(
                            child: _KknStatCard(
                              topText: 'Pemanfaatan Sampah',
                              middleText: '$laporanCount Laporan',
                              bottomText: prokerCount > 0
                                  ? 'Dari $prokerCount Proker Aktif'
                                  : 'Belum Ada Proker',
                              color: const Color(0xFF0D9488),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _KknStatCard(
                              topText: 'Logbook Harian',
                              middleText: '$logbookCount Catatan',
                              bottomText: 'Aktivitas KKN',
                              color: const Color(0xFF6366F1),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveTimelineCard() {
    final activeTimelineAsync = ref.watch(activeTimelineProvider);

    return activeTimelineAsync.when(
      data: (response) {
        if (!response.success || response.data == null) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: Text(
                'Tidak ada tahapan KKN yang sedang berlangsung saat ini.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            ),
          );
        }

        final data = response.data!;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              InkWell(
                onTap: () =>
                    setState(() => _isTimelineVisible = !_isTimelineVisible),
                child: Row(
                  children: [
                    const Icon(
                      Icons.timeline_rounded,
                      color: AppColors.primaryGreen,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Linimasa Saat Ini',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    Icon(
                      _isTimelineVisible
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color: AppColors.textSecondary,
                    ),
                  ],
                ),
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
                child: !_isTimelineVisible
                    ? const SizedBox.shrink()
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.border),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header: Minggu & Fase
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${data.tahapMinggu} • ${data.fase}',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primaryGreen,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 7,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.primaryGreen
                                            .withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      child: const Text(
                                        'Berlangsung',
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.primaryGreen,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  data.tanggal,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textHint,
                                  ),
                                ),
                                const SizedBox(height: 8),

                                // Progress Bar Fase
                                if (response.activeFaseSummary != null) ...[
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Expanded(
                                        child: Text(
                                          'Progress Fase',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: AppColors.textSecondary,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        '${response.activeFaseSummary!.progressPercentage}%',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primaryGreen,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: LinearProgressIndicator(
                                      value:
                                          response
                                              .activeFaseSummary!
                                              .progressPercentage /
                                          100,
                                      backgroundColor: AppColors.border,
                                      color: AppColors.primaryGreen,
                                      minHeight: 5,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                ],

                                // Kegiatan Utama
                                const Text(
                                  'Kegiatan Utama',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  data.kegiatanUtama,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 10),

                                // Rekomendasi Aksi
                                if (data.rekomendasiAksi.isNotEmpty) ...[
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryGreen.withValues(
                                        alpha: 0.04,
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: AppColors.primaryGreen
                                            .withValues(alpha: 0.2),
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Row(
                                          children: [
                                            Icon(
                                              Icons.lightbulb_outline,
                                              size: 15,
                                              color: AppColors.primaryGreen,
                                            ),
                                            SizedBox(width: 5),
                                            Text(
                                              'Rekomendasi Aksi',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.primaryGreen,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        ...data.rekomendasiAksi.map(
                                          (aksi) => Padding(
                                            padding: const EdgeInsets.only(
                                              bottom: 2,
                                            ),
                                            child: Row(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                const Text(
                                                  '•',
                                                  style: TextStyle(
                                                    color:
                                                        AppColors.primaryGreen,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                const SizedBox(width: 5),
                                                Expanded(
                                                  child: Text(
                                                    aksi,
                                                    style: const TextStyle(
                                                      fontSize: 11,
                                                      color:
                                                          AppColors.textPrimary,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
              ),
            ],
          ),
        );
      },
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      error: (e, st) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Center(
          child: Text(
            'Gagal memuat linimasa: ${e.toString()}',
            style: const TextStyle(color: AppColors.dangerRed, fontSize: 12),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Subwidgets
// ═══════════════════════════════════════════════════════════════════════════════

class _MenuTileCard extends StatelessWidget {
  const _MenuTileCard({
    required this.icon,
    this.iconAsset,
    required this.title,
    required this.subtitle,
    required this.gradientColors,
    required this.onTap,
  });

  final IconData icon;
  final String? iconAsset;
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
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: primaryColor.withValues(alpha: 0.07),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: gradientColors,
                        ),
                        borderRadius: BorderRadius.circular(9),
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withValues(alpha: 0.25),
                            blurRadius: 5,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: iconAsset != null
                          ? Padding(
                              padding: const EdgeInsets.all(6.0),
                              child: Image.asset(
                                iconAsset!,
                                color: Colors.white,
                              ),
                            )
                          : Icon(icon, color: Colors.white, size: 18),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 11,
                      color: AppColors.textHint,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.visible,
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
    final isActivated = warga.isActivated == true || warga.status == 'aktif';

    String activator = '';
    if (warga.pendampingName.isNotEmpty) {
      activator = warga.pendampingName;
    } else if (currentUserName.isNotEmpty) {
      activator = currentUserName;
    } else {
      activator = 'Mahasiswa';
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        constraints: const BoxConstraints(minHeight: 78),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.1),
              child: Text(
                (warga.wargaName.isNotEmpty ? warga.wargaName : 'W')[0]
                    .toUpperCase(),
                style: const TextStyle(
                  color: AppColors.primaryGreen,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    warga.wargaName.isNotEmpty
                        ? warga.wargaName
                        : 'Nama tidak tersedia',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (isActivated) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.verified_rounded,
                          size: 14,
                          color: AppColors.primaryBlueDark,
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Diaktivasi: $activator',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryBlueDark,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    warga.address.isNotEmpty
                        ? warga.address
                        : 'Alamat tidak tersedia',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textHint,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

class _KknStatCard extends StatelessWidget {
  const _KknStatCard({
    required this.topText,
    required this.middleText,
    required this.bottomText,
    required this.color,
  });

  final String topText;
  final String middleText;
  final String bottomText;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              topText,
              textAlign: TextAlign.center,
              maxLines: 1,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              middleText,
              textAlign: TextAlign.center,
              maxLines: 1,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              bottomText,
              textAlign: TextAlign.center,
              maxLines: 1,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
