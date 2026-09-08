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

class MahasiswaView extends ConsumerStatefulWidget {
  const MahasiswaView({super.key});

  @override
  ConsumerState<MahasiswaView> createState() => _MahasiswaViewState();
}

class _MahasiswaViewState extends ConsumerState<MahasiswaView>
    with WidgetsBindingObserver {
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
                        _buildSummaryCards(state),
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
    final students = summary['students'] as List?;
    if (students == null || students.isEmpty) {
      return _buildLocationStatus(locationState, kknLocationState);
    }

    final student = students.first as Map<String, dynamic>;
    final totalFormatted =
        student['totalFormatted']?.toString() ?? '0 Jam 0 Menit';
    final targetTotalHours =
        (student['targetTotalHours'] as num?)?.toInt() ?? 100;
    final progressPercentage =
        (student['progressPercentage'] as num?)?.toDouble() ?? 0.0;

    final targetRules = summary['targetRules'] as Map<String, dynamic>?;
    final targetTotalHari = targetRules?['targetTotalHari'] as int? ?? 50;
    final targetTotalPekan = targetRules?['targetTotalPekan'] as int? ?? 10;

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
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tercapai: $totalFormatted',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
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
          const SizedBox(height: 4),
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
          const SizedBox(height: 10),
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

  Widget _buildSummaryCards(MahasiswaState state) {
    final d = state.dashboard;

    final user = ref.watch(authProvider).user;
    final userRwSet = (user?.rw ?? '')
        .split(',')
        .map(
          (s) => s
              .replaceAll(RegExp(r'[^\d]'), '')
              .replaceFirst(RegExp(r'^0+'), ''),
        )
        .where((s) => s.isNotEmpty)
        .toSet();

    // Total Warga Dampingan Mahasiswa ini (dari endpoint kknWarga)
    final myWargaList = state.wargaList.where((w) {
      if (w.role.isNotEmpty && w.role.toUpperCase() != 'WARGA') return false;

      final cleanWargaRw = w.rw
          .trim()
          .replaceAll(RegExp(r'[^\d]'), '')
          .replaceFirst(RegExp(r'^0+'), '');
      final isMyRw = userRwSet.isNotEmpty && userRwSet.contains(cleanWargaRw);

      // Jika backend mengirim mahasiswaId, cocokkan. Jika tidak, minimal harus satu RW dengan mahasiswa
      final isMyId = w.mahasiswaId.isNotEmpty && w.mahasiswaId == user?.id;
      final isMyName =
          w.pendampingName.trim().toLowerCase() ==
          (user?.name ?? '').trim().toLowerCase();

      return isMyId || isMyName || isMyRw;
    }).toList();

    final totalWarga = myWargaList.length;

    // Aktivasi Tempat Sampah dihitung murni dari pointHistory agar 100% akurat sesuai riwayat poin pengguna
    final asyncHistory = ref.watch(pointHistoryProvider);
    int wargaAktif = 0;

    if (asyncHistory.hasValue && asyncHistory.value != null) {
      for (final ph in asyncHistory.value!) {
        final lowerTitle = ph.description.toLowerCase();
        if (lowerTitle.contains('aktivasi')) {
          wargaAktif++;
        }
      }
    }

    return Row(
      children: [
        Expanded(
          child: _SummaryCard(
            icon: Icons.people_alt_rounded,
            iconAsset: 'assets/icons/employees.png',
            label: 'Total Warga',
            value: '$totalWarga',
            color: AppColors.primaryGreen,
          ),
        ),
        const SizedBox(width: AppDimensions.sm),
        Expanded(
          child: _SummaryCard(
            icon: Icons.verified_user_rounded,
            iconAsset: 'assets/icons/trash-check.png',
            label: 'Tempat Sampah Aktif',
            value: '$wargaAktif',
            color: AppColors.primaryBlueDark,
          ),
        ),
        const SizedBox(width: AppDimensions.sm),
        Expanded(
          child: _SummaryCard(
            icon: Icons.stars_rounded,
            iconAsset: 'assets/icons/trophy-star.png',
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
        Row(
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
        const SizedBox(height: 8),
        Row(
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
                onTap: () => Navigator.pushNamed(context, AppRoutes.dataProker),
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
        const SizedBox(height: 8),
        Row(
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
                title: 'Fasilitas Warga',
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

    // Tampilkan warga yang diaktivasi oleh mahasiswa ini berdasarkan mahasiswaId
    final userId = user?.id ?? '';
    final list = state.wargaList
        .where((w) {
          if (!w.isActivated) return false;
          if (userId.isEmpty) return false;
          return w.mahasiswaId == userId;
        })
        .map((w) {
          return WargaDampingan(
            wargaId: w.wargaId,
            binId: w.binId,
            wargaName: w.wargaName,
            address: w.address,
            kelurahan: w.kelurahan,
            rw: w.rw,
            mahasiswaId: w.mahasiswaId,
            pendampingName: w.pendampingName,
            recentLogs: w.recentLogs,
            isActivated: w.isActivated,
            role: w.role,
            totalPoints: w.totalPoints,
            apiCorrectPercentage: w.apiCorrectPercentage,
          );
        })
        .toList();

    // Remove duplicates based on wargaId
    final uniqueMap = <String, WargaDampingan>{};
    for (final w in list) {
      uniqueMap[w.wargaId] = w;
    }
    final uniqueList = uniqueMap.values.toList();

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
            if (uniqueList.length > 5)
              GestureDetector(
                onTap: () =>
                    Navigator.pushNamed(context, AppRoutes.daftarWarga),
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
        if (uniqueList.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppDimensions.xl),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
            ),
            child: const Column(
              children: [
                Icon(Icons.people_rounded, size: 48, color: AppColors.textHint),
                SizedBox(height: 8),
                Text(
                  'Belum ada warga dampingan.\nDaftarkan warga pertama Anda!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          )
        else
          ...uniqueList
              .take(5)
              .map(
                (w) => _WargaCard(
                  warga: w,
                  currentUserName: user?.name ?? '',
                  onTap: () => Navigator.pushNamed(
                    context,
                    AppRoutes.detailWarga,
                    arguments: w,
                  ),
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

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Linimasa Saat Ini',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                          color: AppColors.primaryGreen.withValues(alpha: 0.1),
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
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Progress Fase',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
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
                            response.activeFaseSummary!.progressPercentage /
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
                        color: AppColors.primaryGreen.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppColors.primaryGreen.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
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
                              padding: const EdgeInsets.only(bottom: 2),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    '•',
                                    style: TextStyle(
                                      color: AppColors.primaryGreen,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(width: 5),
                                  Expanded(
                                    child: Text(
                                      aksi,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textPrimary,
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.icon,
    this.iconAsset,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String? iconAsset;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppDimensions.radiusSm),
                  ),
                  child: iconAsset != null
                      ? Image.asset(
                          iconAsset!,
                          width: 18,
                          height: 18,
                          color: color,
                        )
                      : Icon(icon, color: color, size: 18),
                ),
                const SizedBox(height: 5),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 17,
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
                    fontSize: 10,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
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
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
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
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 36,
                  height: 36,
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
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: warga.needsReeducation
                            ? AppColors.warningOrange
                            : AppColors.primaryGreen,
                      ),
                    ),
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
                          Expanded(
                            child: Text(
                              warga.wargaName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (warga.needsReeducation)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.warningOrange.withValues(
                                  alpha: 0.12,
                                ),
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
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEBF5FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF90CDF4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.verified_rounded,
                                size: 11,
                                color: AppColors.primaryBlueDark,
                              ),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  warga.pendampingName.isNotEmpty
                                      ? 'Diaktivasi: ${warga.pendampingName}'
                                      : (currentUserName.isNotEmpty
                                            ? 'Diaktivasi: $currentUserName'
                                            : 'Diaktivasi Mahasiswa'),
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
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
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
                  size: 18,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
