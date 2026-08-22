import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';

import '../controllers/kkn_location_controller.dart';
import '../controllers/kelompok_kkn_controller.dart';
import '../../auth/controllers/auth_controller.dart';
import 'package:permission_handler/permission_handler.dart';

class KknAttendanceView extends ConsumerStatefulWidget {
  const KknAttendanceView({super.key});

  @override
  ConsumerState<KknAttendanceView> createState() => _KknAttendanceViewState();
}

class _KknAttendanceViewState extends ConsumerState<KknAttendanceView>
    with WidgetsBindingObserver {
  final TextEditingController _rtRwCtrl = TextEditingController();
  final TextEditingController _kodeZonaCtrl = TextEditingController(text: '');
  String _selectedKelurahan = '';
  bool _showDetail = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Fetch target lokasi (jadwal) di awal agar UI bisa menampilkan tombol "Mulai Tracking"
      // atau pesan "Tidak ada jadwal" sebelum user klik apapun.
      await ref.read(kknLocationProvider.notifier).checkActiveSchedule();
      await ref.read(kknLocationProvider.notifier).fetchKegiatanAktif();

      final user = ref.read(authProvider).user;
      if (user != null) {
        _rtRwCtrl.text = user.rw.isNotEmpty ? user.rw : '';
        if (user.kelurahan.isNotEmpty) {
          _selectedKelurahan = user.kelurahan;
        }
      }
      ref.read(kelompokKknProvider.notifier).fetchKelompok();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (!mounted) return;
      ref.read(kknLocationProvider.notifier).forceLocationUpdate(context);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _rtRwCtrl.dispose();
    _kodeZonaCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(kknLocationProvider);
    final locationNotifier = ref.read(kknLocationProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Presensi KKN',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18, color: AppColors.textPrimary),
        ),
        backgroundColor: Colors.white,  shadowColor: Colors.black12, surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.textPrimary),
            tooltip: 'Perbarui Lokasi GPS',
            onPressed: () async {
              ScaffoldMessenger.of(context).clearSnackBars();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Memperbarui koordinat GPS & wilayah...'),
                  duration: Duration(seconds: 1),
                ),
              );
              await locationNotifier.forceLocationUpdate(context);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => locationNotifier.forceLocationUpdate(context),
        color: AppColors.primaryGreen,
        child: Padding(
          padding: const EdgeInsets.all(AppDimensions.md),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: _buildAttendanceDetail(locationState, locationNotifier),
          ),
        ),
      ),
    );
  }

  Future<void> _showAbsenDialog(
    KknLocationState state,
    KknLocationNotifier notifier,
  ) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;

    final kelompokState = ref.read(kelompokKknProvider);
    final kelompokName =
        (kelompokState.kelompok?.groupName != null &&
            kelompokState.kelompok!.groupName.isNotEmpty)
        ? kelompokState.kelompok!.groupName
        : (user.kelompokName.isNotEmpty
              ? user.kelompokName
              : 'Kelompok 1 Cipaganti');
    final dplName =
        (kelompokState.kelompok?.dosenPembimbing != null &&
            kelompokState.kelompok!.dosenPembimbing.isNotEmpty)
        ? kelompokState.kelompok!.dosenPembimbing
        : (user.dplName.isNotEmpty ? user.dplName : 'DPL KKN');

    final bool confirm =
        await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Row(
                children: [
                  Icon(
                    Icons.assignment_turned_in_rounded,
                    color: AppColors.primaryGreen,
                    size: 28,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Konfirmasi Kehadiran',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPopupRow(
                    'Kegiatan',
                    state.activeActivity?['namaKegiatan'] ??
                        state.activeActivity?['nama'] ??
                        '',
                  ),
                  const SizedBox(height: 8),
                  _buildPopupRow(
                    'Waktu',
                    DateTime.now().toLocal().toString().substring(0, 16),
                  ),
                  const SizedBox(height: 8),
                  _buildPopupRow('Nama', user.name),
                  const SizedBox(height: 8),
                  _buildPopupRow('NIM', user.nim.isNotEmpty ? user.nim : '-'),
                  const SizedBox(height: 8),
                  _buildPopupRow('Kelompok', kelompokName),
                  const SizedBox(height: 8),
                  _buildPopupRow('DPL', dplName),
                  const SizedBox(height: 16),
                  const Text(
                    'Apakah Anda yakin ingin melakukan absensi sekarang?',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text(
                    'Batal',
                    style: TextStyle(color: AppColors.textHint),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text(
                    'Absen',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            );
          },
        ) ??
        false;

    if (confirm) {
      final success = await notifier.recordAttendance(
        method: 'GPS_VALIDATED',
        kodeZona: _kodeZonaCtrl.text.trim(),
        rw: _rtRwCtrl.text.trim(),
        kelurahan: _selectedKelurahan,
      );
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Presensi Mulai Kegiatan berhasil! (+10 Poin)'),
              backgroundColor: AppColors.primaryGreen,
              behavior: SnackBarBehavior.floating,
            ),
          );
        } else {
          final err =
              ref.read(kknLocationProvider).error ??
              'Gagal melakukan presensi. Silakan periksa GPS & koneksi internet Anda.';
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(err),
              backgroundColor: AppColors.dangerRed,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Widget _buildPopupRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        const Text(
          ': ',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDashedDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final boxWidth = constraints.constrainWidth();
          const dashWidth = 4.0;
          const dashHeight = 1.0;
          final dashCount = (boxWidth / (2 * dashWidth)).floor();
          return Flex(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            direction: Axis.horizontal,
            children: List.generate(dashCount, (_) {
              return SizedBox(
                width: dashWidth,
                height: dashHeight,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: Colors.grey.shade300),
                ),
              );
            }),
          );
        },
      ),
    );
  }

  Widget _buildIconDetailRow({
    required IconData icon,
    required String title,
    required String value,
    Widget? trailing,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primaryGreen.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.primaryGreen, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
        if (trailing != null) trailing,
      ],
    );
  }

  Widget _buildBoxDetail(IconData icon, String title, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primaryGreen, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceDetail(
    KknLocationState state,
    KknLocationNotifier notifier,
  ) {
    if (state.isLoadingKegiatan) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: CircularProgressIndicator(color: AppColors.primaryGreen),
        ),
      );
    }

    if (state.kegiatanList.isEmpty && state.activeActivity == null) {
      return Card(
        color: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            children: [
              Icon(Icons.event_busy_rounded, color: Colors.grey, size: 56),
              SizedBox(height: 12),
              Text(
                'Tidak Ada Kegiatan KKN',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Hari ini tidak ada kegiatan KKN aktif atau kegiatan belum diaktifkan oleh Dosen Pembimbing Lapangan (DPL).',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    if (!_showDetail) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Kegiatan KKN Hari Ini',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          if (state.error != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.dangerRed.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    color: AppColors.dangerRed,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      state.error!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.dangerRed,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ...state.kegiatanList.map((kegiatan) {
            return KegiatanKknCard(
              kegiatan: kegiatan,
              onMulai: (id) async {
                final isTrackingThis = state.activeActivity != null &&
                    (state.activeActivity!['id']?.toString() == id || state.activeActivity!['scheduleId']?.toString() == id);
                
                if (isTrackingThis) {
                  setState(() => _showDetail = true);
                  return;
                }

                final isAlreadyActive = (state.isTracking || state.activeActivity != null) && !state.isSuccessAttendance;
                if (isAlreadyActive) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Anda masih memiliki kegiatan KKN aktif. Silakan keluar dari kegiatan sebelumnya terlebih dahulu!'),
                      backgroundColor: AppColors.dangerRed,
                    ));
                  }
                  return;
                }

                final result = await notifier.mulaiKegiatan(id);
                if (result == null) {
                  // Sukses
                  if (mounted) {
                    ref.read(authProvider.notifier).fetchProfile();
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('+10 Poin berhasil didapatkan dari Presensi Masuk!'),
                      backgroundColor: AppColors.primaryGreen,
                    ));
                    setState(() => _showDetail = true);
                  }
                } else if (mounted && result != 'CONFLICT') {
                  // Bug #3 fix: tampilkan pesan error spesifik ke user
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text(result),
                    backgroundColor: AppColors.dangerRed,
                    behavior: SnackBarBehavior.floating,
                  ));
                }
              },
            );
          }),
        ],
      );
    }

    final pos = state.currentPosition;
    final lat = pos?.latitude.toStringAsFixed(5) ?? '-';
    final lng = pos?.longitude.toStringAsFixed(5) ?? '-';
    final isGpsActive = state.isTracking;

    final durasiMenit = state.inZoneDurationSeconds ~/ 60;
    final durasiDetik = state.inZoneDurationSeconds % 60;
    final targetMenit = state.targetDurationMinutes;
    final remainingMenit = targetMenit - durasiMenit;

    final bool isDisabled =
        state.zoneResetWarning != null &&
        (state.zoneResetWarning!.toLowerCase().contains('izin') ||
            state.zoneResetWarning!.toLowerCase().contains('sakit'));

    final bool isAlpa =
        state.zoneResetWarning != null &&
        state.zoneResetWarning!.toLowerCase().contains('tanpa keterangan') &&
        !state.isSuccessAttendance;
    final bool isSuccess = state.isSuccessAttendance;

    final act = state.selectedKegiatan ?? state.activeActivity;
    // Normalize: hapus suffix WIB/WITA, coba semua field yang ada
    final String rawTimeLabel =
        act?['time']?.toString().isNotEmpty == true
            ? act!['time'].toString()
            : act?['jamKegiatan']?.toString().isNotEmpty == true
                ? act!['jamKegiatan'].toString()
                : (act?['jamMulai'] != null && act?['jamSelesai'] != null
                    ? '${act!["jamMulai"]} - ${act["jamSelesai"]}'
                    : '');
    final String timeLabel = rawTimeLabel
        .replaceAll(RegExp(r'\s*(WIB|WITA|WIT)\s*', caseSensitive: false), '')
        .replaceAllMapped(RegExp(r'(\d{2})\.(\d{2})'), (m) => '${m[1]}:${m[2]}')
        .trim();

    Widget content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
              onPressed: () => setState(() => _showDetail = false),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
            const SizedBox(width: 8),
            const Text(
              'Detail Kegiatan',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (state.outOfZoneSeconds > 0)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.dangerRed.withValues(alpha: 0.5),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.warning_amber_rounded,
                  color: AppColors.dangerRed,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Anda berada di luar Area! Toleransi sisa: ${300 - state.outOfZoneSeconds} detik sebelum sesi dibatalkan.',
                    style: const TextStyle(
                      color: AppColors.dangerRed,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

        if (state.error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppColors.dangerRed.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: AppColors.dangerRed,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    state.error!,
                    style: const TextStyle(
                      color: AppColors.dangerRed,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (state.error!.toLowerCase().contains('izin') ||
                    state.error!.toLowerCase().contains('ditolak'))
                  TextButton(
                    onPressed: () => openAppSettings(),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                    child: const Text(
                      'Pengaturan',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.dangerRed,
                      ),
                    ),
                  )
                else
                  TextButton(
                    onPressed: () => notifier.forceLocationUpdate(context),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      visualDensity: VisualDensity.compact,
                    ),
                    child: const Text(
                      'Coba Lagi',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.dangerRed,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        if (state.zoneResetWarning != null &&
            state.zoneResetWarning!.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSuccess
                  ? AppColors.primaryGreen.withValues(alpha: 0.1)
                  : (isAlpa
                        ? AppColors.dangerRed.withValues(alpha: 0.1)
                        : Colors.orange.withValues(alpha: 0.1)),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSuccess
                    ? AppColors.primaryGreen
                    : (isAlpa ? AppColors.dangerRed : Colors.orange),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isSuccess
                      ? Icons.check_circle_rounded
                      : (isAlpa
                            ? Icons.cancel_rounded
                            : Icons.info_outline_rounded),
                  color: isSuccess
                      ? AppColors.primaryGreen
                      : (isAlpa ? AppColors.dangerRed : Colors.orange),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    state.zoneResetWarning!,
                    style: TextStyle(
                      color: isSuccess
                          ? AppColors.primaryGreen
                          : (isAlpa ? AppColors.dangerRed : Colors.orange[800]),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        Card(
          color: Colors.white,
          elevation: 2,
          shadowColor: Colors.black.withValues(alpha: 0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(
                              alpha: 0.1,
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.location_on_outlined,
                            color: AppColors.primaryGreen,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'GPS Tracking',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              'Lokasi sedang dipantau',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isGpsActive
                            ? AppColors.primaryGreen.withValues(alpha: 0.1)
                            : Colors.grey.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isGpsActive
                                  ? AppColors.primaryGreen
                                  : Colors.grey,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isGpsActive ? 'AKTIF' : 'NON-AKTIF',
                            style: TextStyle(
                              color: isGpsActive
                                  ? AppColors.primaryGreen
                                  : Colors.grey,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.my_location_rounded,
                  title: 'Posisi Anda',
                  value: pos != null ? '$lat, $lng' : '-',
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.location_on_rounded,
                  title: 'Target Lokasi',
                  value: act != null
                      ? (act['address'] ??
                            act['targetLokasi'] ??
                            act['lokasi']?['alamat'] ??
                            act['location'] ??
                            '-')
                      : '-',
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildBoxDetail(
                        Icons.radar,
                        'Radius Toleransi',
                        act != null
                            ? '${act['radius'] ?? act['radiusMeter'] ?? 100} Meter'
                            : '-',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildBoxDetail(
                        Icons.access_time_rounded,
                        'Jam Kegiatan',
                        timeLabel.isNotEmpty
                            ? timeLabel.toUpperCase()
                            : (act != null
                                  ? '08:00 - 16:00'
                                  : '-'),
                      ),
                    ),
                  ],
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.groups_rounded,
                  title: 'Nama Kegiatan',
                  value: act != null
                      ? (act['namaKegiatan'] ??
                            act['zoneName'] ??
                            act['title'] ??
                            '-')
                      : '-',
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.timer_outlined,
                  title: 'Durasi Kegiatan',
                  value: act != null ? '$targetMenit Menit' : '-',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        if (act == null || act.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.1),
              border: Border.all(color: Colors.grey.withValues(alpha: 0.5)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.grey,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.info_outline_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tidak ada jadwal aktif saat ini',
                        style: TextStyle(
                          color: Colors.grey,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Jadwal kegiatan KKN belum tersedia atau lokasi belum diset.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )
        else if (isSuccess)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.12),
              border: Border.all(
                color: AppColors.primaryGreen.withValues(alpha: 0.4),
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: AppColors.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Presensi Kehadiran Terverifikasi',
                        style: TextStyle(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Status kehadiran Anda telah berhasil dicatat & disinkronkan ke server.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )
        else if (!isAlpa && !isDisabled && !state.isEligibleForAttendance)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: state.isInsideRadius
                  ? AppColors.primaryGreen.withValues(alpha: 0.1)
                  : AppColors.dangerRed.withValues(alpha: 0.1),
              border: Border.all(
                color: state.isInsideRadius
                    ? AppColors.primaryGreen.withValues(alpha: 0.5)
                    : AppColors.dangerRed.withValues(alpha: 0.5),
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: state.isInsideRadius
                        ? AppColors.primaryGreen
                        : AppColors.dangerRed,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    state.isInsideRadius
                        ? Icons.check_rounded
                        : Icons.close_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        state.isInsideRadius
                            ? 'Kamu berada di dalam radius lokasi'
                            : 'Kamu berada di luar radius lokasi',
                        style: TextStyle(
                          color: state.isInsideRadius
                              ? AppColors.primaryGreen
                              : AppColors.dangerRed,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        state.isInsideRadius
                            ? 'Sinyal GPS stabil dan lokasi terdeteksi.'
                            : 'Pergerakan absensi dihentikan sementara.',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

        if (act != null && act.isNotEmpty) ...[
          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.05),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.5)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Colors.orange,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.timer_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Durasi Terdeteksi di Area',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '$durasiMenit mnt $durasiDetik dtk',
                                style: const TextStyle(
                                  color: Colors.orange,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '/ $targetMenit mnt',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${targetMenit > 0 ? ((durasiMenit / targetMenit) * 100).toStringAsFixed(1) : 0}%',
                        style: const TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                LinearProgressIndicator(
                  value: targetMenit > 0
                      ? (durasiMenit / targetMenit).clamp(0.0, 1.0)
                      : 0,
                  backgroundColor: Colors.grey[300],
                  color: isSuccess ? AppColors.primaryGreen : Colors.orange,
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(3),
                ),
                const SizedBox(height: 12),
                Text(
                  isSuccess
                      ? 'Waktu terpenuhi! Presensi Anda resmi terdaftar.'
                      : (remainingMenit > 0
                            ? 'Waktu tersisa: $remainingMenit menit lagi sebelum tombol absen terbuka.'
                            : 'Waktu terpenuhi! Tombol absen sudah terbuka.'),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed:
                  (state.isEligibleForAttendance && !isSuccess && !isAlpa)
                  ? () async {
                      await _showAbsenDialog(state, notifier);
                    }
                  : null,
              icon: Icon(
                isSuccess
                    ? Icons.check_circle_rounded
                    : (isAlpa
                          ? Icons.cancel_rounded
                          : Icons.location_on_rounded),
                color: Colors.white,
                size: 20,
              ),
              label: Text(
                isSuccess
                    ? 'Presensi Selesai (Hadir)'
                    : (isAlpa
                          ? 'Tanpa Keterangan (Waktu Habis)'
                          : 'Selesai Kegiatan (Presensi Pulang)'),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Colors.white,
                ),
              ),
              style:
                  ElevatedButton.styleFrom(
                    backgroundColor: isSuccess
                        ? AppColors.primaryGreen
                        : (isAlpa ? AppColors.dangerRed : Colors.grey[300]),
                    disabledBackgroundColor: isSuccess
                        ? AppColors.primaryGreen
                        : (isAlpa ? AppColors.dangerRed : Colors.grey[300]),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ).copyWith(
                    backgroundColor: WidgetStateProperty.resolveWith((states) {
                      if (isSuccess) return AppColors.primaryGreen;
                      if (isAlpa) return AppColors.dangerRed;
                      if (states.contains(WidgetState.disabled)) {
                        return Colors.grey[300];
                      }
                      return AppColors.primaryGreen; // Active color
                    }),
                  ),
            ),
          ),
          const SizedBox(height: 8),
          if (!state.isEligibleForAttendance && !isSuccess && !isAlpa)
            Text(
              targetMenit >= 60
                  ? 'Presensi baru dapat dilakukan setelah Anda berada di lokasi kegiatan selama ${targetMenit ~/ 60} jam tanpa putus.'
                  : 'Presensi baru dapat dilakukan setelah durasi kehadiran mencapai minimum $targetMenit menit.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: AppColors.dangerRed),
            ),
          const SizedBox(height: 16),
            if (!isSuccess && !isAlpa && state.isTracking)
              StopTrackingButton(
                onStop: (String alasan) async {
                  final isSuccess = await notifier.jedaKegiatan(alasan);
                  if (mounted) {
                    setState(() => _showDetail = false);
                    ref.read(authProvider.notifier).fetchProfile();
                    
                    ScaffoldMessenger.of(context).clearSnackBars();
                    if (isSuccess) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('Kegiatan berhasil dijeda sementara.'),
                        backgroundColor: AppColors.primary,
                      ));
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('Gagal menjeda kegiatan.'),
                        backgroundColor: AppColors.dangerRed,
                      ));
                    }
                  }
                },
              ),
        ],
        SizedBox(height: MediaQuery.of(context).padding.bottom + 40),
      ],
    );

    if (isDisabled) {
      return AbsorbPointer(
        absorbing: true,
        child: ColorFiltered(
          colorFilter: const ColorFilter.matrix([
            0.2126,
            0.7152,
            0.0722,
            0,
            0,
            0.2126,
            0.7152,
            0.0722,
            0,
            0,
            0.2126,
            0.7152,
            0.0722,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
          ]),
          child: content,
        ),
      );
    }

    return content;
  }
}

class KegiatanKknCard extends StatelessWidget {
  final Map<String, dynamic> kegiatan;
  final Function(String) onMulai;

  const KegiatanKknCard({
    super.key,
    required this.kegiatan,
    required this.onMulai,
  });

  @override
  Widget build(BuildContext context) {
    final isAktif =
        (kegiatan['status'] ?? '').toString().toUpperCase() == 'AKTIF';
    final String? statusKehadiran = kegiatan['statusKehadiran']?.toString().toUpperCase();
    final bool canStart = isAktif && (statusKehadiran == null || statusKehadiran == 'BERLANGSUNG');

    final jamMulai = kegiatan['jamMulai'] ?? '-';
    final jamSelesai = kegiatan['jamSelesai'] ?? '-';
    final durasiWajib = kegiatan['durasiWajibMenit'] ?? 120;
    final lokasi = kegiatan['lokasi'] != null
        ? (kegiatan['lokasi']['alamat'] ?? kegiatan['lokasi']['address'] ?? '-')
        : '-';

    String statusText;
    Color badgeColor;
    Color textColor;
    String buttonText;

    if (statusKehadiran == 'HADIR') {
      statusText = '✅ HADIR';
      badgeColor = AppColors.primaryGreen.withValues(alpha: 0.1);
      textColor = AppColors.primaryGreen;
      buttonText = 'Sudah Presensi (HADIR)';
    } else if (statusKehadiran == 'BERLANGSUNG') {
      statusText = '⏱️ BERLANGSUNG';
      badgeColor = Colors.orange.withValues(alpha: 0.1);
      textColor = Colors.orange;
      buttonText = 'Lanjutkan Sesi';
    } else if (statusKehadiran == 'SELESAI') {
      statusText = '🏁 SELESAI';
      badgeColor = Colors.blue.withValues(alpha: 0.1);
      textColor = Colors.blue;
      buttonText = 'Sesi Berakhir (Hadir)';
    } else if (statusKehadiran == 'SELESAI_TELAT') {
      statusText = '⚠️ SELESAI (DURASI KURANG)';
      badgeColor = Colors.deepOrange.withValues(alpha: 0.1);
      textColor = Colors.deepOrange;
      buttonText = 'Sesi Berakhir';
    } else if (statusKehadiran == 'LEPAS_RADIUS') {
      statusText = '❌ LEPAS RADIUS';
      badgeColor = AppColors.dangerRed.withValues(alpha: 0.1);
      textColor = AppColors.dangerRed;
      buttonText = 'Kehadiran Digagalkan';
    } else if (statusKehadiran == 'IZIN' || statusKehadiran == 'SAKIT') {
      statusText = '📝 $statusKehadiran';
      badgeColor = Colors.amber.withValues(alpha: 0.1);
      textColor = Colors.amber.shade800;
      buttonText = 'Izin / Sakit';
    } else if (statusKehadiran == 'ALPA' || statusKehadiran == 'TANPA_KETERANGAN') {
      statusText = '⚠️ TANPA KETERANGAN';
      badgeColor = AppColors.dangerRed.withValues(alpha: 0.1);
      textColor = AppColors.dangerRed;
      buttonText = 'Tanpa Keterangan (Tidak Hadir)';
    } else {
      statusText = isAktif ? '🟢 AKTIF' : '🔵 AKAN DATANG';
      badgeColor = isAktif
          ? AppColors.primaryGreen.withValues(alpha: 0.1)
          : Colors.blue.withValues(alpha: 0.1);
      textColor = isAktif ? AppColors.primaryGreen : Colors.blue;
      buttonText = isAktif ? 'Mulai Kegiatan (Presensi Masuk)' : 'Mendatang (Belum Masuk Waktu)';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              kegiatan['namaKegiatan'] ?? 'Kegiatan KKN',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            _buildPopupRow('Lokasi', lokasi.toString()),
            const SizedBox(height: 4),
            _buildPopupRow('Waktu', '$jamMulai - $jamSelesai'),
            const SizedBox(height: 4),
            _buildPopupRow('Durasi Wajib', '$durasiWajib menit'),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ElevatedButton(
                    onPressed: canStart
                        ? () => onMulai(kegiatan['id'].toString())
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      buttonText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  // Bug #13 fix: tampilkan alasan tombol disabled agar user tidak bingung
                  if (!canStart) ...[
                    const SizedBox(height: 6),
                    Text(
                      statusKehadiran == 'HADIR' || statusKehadiran == 'SELESAI'
                          ? 'Anda sudah tercatat hadir pada kegiatan ini.'
                          : (statusKehadiran == 'ALPA' || statusKehadiran == 'TANPA_KETERANGAN')
                              ? 'Waktu kegiatan telah berakhir. Status: Tanpa Keterangan.'
                              : statusKehadiran == 'IZIN' || statusKehadiran == 'SAKIT'
                                  ? 'Anda memiliki pengajuan $statusKehadiran yang aktif.'
                                  : statusKehadiran == 'SELESAI_TELAT'
                                      ? 'Sesi berakhir (durasi kurang dari target).'
                                      : !isAktif
                                          ? 'Kegiatan belum dimulai sesuai jadwal.'
                                          : 'Tombol tidak tersedia saat ini.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPopupRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        const Text(
          ': ',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

class StopTrackingButton extends StatelessWidget {
  final Function(String) onStop;

  const StopTrackingButton({super.key, required this.onStop});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        onPressed: () {
          final TextEditingController alasanCtrl = TextEditingController();
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Jeda Kegiatan'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Silakan masukkan alasan Anda menjeda atau keluar sementara dari kegiatan.'),
                  const SizedBox(height: 12),
                  TextField(
                    controller: alasanCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Alasan Jeda',
                      hintText: 'Misal: Baterai habis, izin ke kampus...',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Batal'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final alasan = alasanCtrl.text.trim();
                    if (alasan.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Alasan tidak boleh kosong.')),
                      );
                      return;
                    }
                    Navigator.pop(ctx);
                    onStop(alasan);
                  },
                  child: const Text('Jeda'),
                ),
              ],
            ),
          );
        },
        icon: const Icon(Icons.pause_circle_filled, color: AppColors.primary),
        label: const Text(
          'Keluar Sementara (Jeda)',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
