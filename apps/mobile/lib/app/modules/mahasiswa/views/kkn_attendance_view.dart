import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';

import '../controllers/kkn_location_controller.dart';
import '../controllers/kelompok_kkn_controller.dart';
import '../../auth/controllers/auth_controller.dart';

class KknAttendanceView extends ConsumerStatefulWidget {
  const KknAttendanceView({super.key});

  @override
  ConsumerState<KknAttendanceView> createState() => _KknAttendanceViewState();
}

class _KknAttendanceViewState extends ConsumerState<KknAttendanceView> with WidgetsBindingObserver {
  final TextEditingController _rtRwCtrl = TextEditingController();
  final TextEditingController _kodeZonaCtrl = TextEditingController(text: '');
  String _selectedKelurahan = '';
  bool _showingTrackingDetail = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authProvider).user;
      if (user != null) {
        _rtRwCtrl.text = user.rw.isNotEmpty ? user.rw : '';
        if (user.kelurahan.isNotEmpty) {
          _selectedKelurahan = user.kelurahan;
        }
      }

      // Fetch daftar kegiatan hari ini & periksa auto-start jika berada di zona
      ref.read(kknLocationProvider.notifier).fetchKegiatanAktif(
        autoStartIfInZone: true,
        context: context,
      );
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
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

    // Tampilkan dialog konflik (409) jika ada
    if (locationState.conflictKegiatan != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showConflictDialog(locationState, locationNotifier);
      });
    }

    final isTrackingActive = locationState.isTracking && locationState.selectedKegiatan != null;
    final isSuccess = locationState.isSuccessAttendance;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: Text(
          (isTrackingActive || _showingTrackingDetail)
              ? 'Detail Tracking GPS'
              : 'Presensi KKN',
          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: AppColors.primaryGreen,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () {
            if (_showingTrackingDetail && !isTrackingActive) {
              setState(() {
                _showingTrackingDetail = false;
              });
            } else {
              Navigator.pop(context);
            }
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            tooltip: 'Perbarui Data Kegiatan',
            onPressed: () async {
              ScaffoldMessenger.of(context).clearSnackBars();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Memperbarui daftar kegiatan & lokasi GPS...'),
                  duration: Duration(seconds: 1),
                ),
              );
              await locationNotifier.fetchKegiatanAktif(autoStartIfInZone: true, context: context);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => locationNotifier.fetchKegiatanAktif(autoStartIfInZone: true, context: context),
        color: AppColors.primaryGreen,
        child: Padding(
          padding: const EdgeInsets.all(AppDimensions.md),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: _buildBodyContent(locationState, locationNotifier),
          ),
        ),
      ),
    );
  }

  Widget _buildBodyContent(KknLocationState state, KknLocationNotifier notifier) {
    // State 5: Presensi Berhasil
    if (state.isSuccessAttendance) {
      return _buildSuccessState(state, notifier);
    }

    // State 4: Sedang Tracking Aktif atau Membuka Detail Tracking
    if (state.isTracking && state.selectedKegiatan != null) {
      return _buildTrackingDetailState(state, notifier);
    }

    // State 1: Loading
    if (state.isLoadingKegiatan && state.kegiatanList.isEmpty) {
      return _buildLoadingState();
    }

    // State 3: Tidak Ada Kegiatan
    if (state.kegiatanList.isEmpty) {
      return _buildEmptyState(notifier);
    }

    // State 2: Daftar Kegiatan Tersedia
    return _buildKegiatanListState(state, notifier);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE 1: LOADING SKELETON
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildLoadingState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 64.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: AppColors.primaryGreen),
            const SizedBox(height: 16),
            const Text(
              'Memuat kegiatan KKN hari ini...',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE 2: DAFTAR KEGIATAN KKN
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildKegiatanListState(KknLocationState state, KknLocationNotifier notifier) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header info
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Kegiatan Hari Ini (${state.kegiatanList.length})',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            if (state.isAutoStarting)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  children: [
                    SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen),
                    ),
                    SizedBox(width: 6),
                    Text(
                      'Auto-Starting...',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),

        // Error Banner jika ada
        if (state.error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline_rounded, color: AppColors.dangerRed, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    state.error!,
                    style: const TextStyle(color: AppColors.dangerRed, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // List kartu kegiatan
        ...state.kegiatanList.map((kegiatan) => _buildKegiatanCard(kegiatan, state, notifier)),
      ],
    );
  }

  Widget _buildKegiatanCard(KegiatanKknItem kegiatan, KknLocationState state, KknLocationNotifier notifier) {
    Color statusBadgeColor = Colors.grey;
    String statusBadgeText = kegiatan.status;
    IconData statusIcon = Icons.schedule_rounded;

    if (kegiatan.isAktif) {
      statusBadgeColor = AppColors.primaryGreen;
      statusBadgeText = 'AKTIF';
      statusIcon = Icons.play_circle_fill_rounded;
    } else if (kegiatan.isBelumMulai) {
      statusBadgeColor = AppColors.primaryBlue;
      statusBadgeText = 'BELUM MULAI';
      statusIcon = Icons.access_time_rounded;
    } else if (kegiatan.isSelesai) {
      statusBadgeColor = Colors.grey;
      statusBadgeText = 'SELESAI';
      statusIcon = Icons.check_circle_outline_rounded;
    } else if (kegiatan.isLibur) {
      statusBadgeColor = AppColors.warningOrange;
      statusBadgeText = 'LIBUR';
      statusIcon = Icons.beach_access_rounded;
    }

    return Card(
      color: Colors.white,
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shadowColor: Colors.black.withValues(alpha: 0.08),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBadgeColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusBadgeColor.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(statusIcon, color: statusBadgeColor, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        statusBadgeText,
                        style: TextStyle(
                          color: statusBadgeColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                if (kegiatan.statusKehadiran != null)
                  _buildKehadiranBadge(kegiatan.statusKehadiran!),
              ],
            ),
            const SizedBox(height: 12),

            // Nama kegiatan
            Text(
              kegiatan.namaKegiatan,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),

            // Info baris lokasi
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    kegiatan.lokasi.alamat,
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Info baris waktu & durasi
            Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Text(
                  '${kegiatan.jamMulai} - ${kegiatan.jamSelesai} WIB',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.timer_outlined, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Text(
                  'Wajib: ${(kegiatan.durasiWajibMenit / 60).toStringAsFixed(kegiatan.durasiWajibMenit % 60 == 0 ? 0 : 1)} Jam',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Tombol Aksi
            _buildActionButtonForKegiatan(kegiatan, state, notifier),
          ],
        ),
      ),
    );
  }

  Widget _buildKehadiranBadge(String status) {
    Color badgeColor = AppColors.primaryGreen;
    String label = status;

    if (status == 'HADIR') {
      badgeColor = AppColors.primaryGreen;
      label = 'HADIR';
    } else if (status == 'IZIN') {
      badgeColor = AppColors.primaryBlue;
      label = 'IZIN';
    } else if (status == 'SAKIT') {
      badgeColor = AppColors.warningOrange;
      label = 'SAKIT';
    } else if (status == 'ALPA') {
      badgeColor = AppColors.dangerRed;
      label = 'ALPA';
    } else if (status == 'BERLANGSUNG') {
      badgeColor = Colors.orange;
      label = 'BERLANGSUNG';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
      ),
      child: Text(
        '• $label',
        style: TextStyle(color: badgeColor, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildActionButtonForKegiatan(KegiatanKknItem kegiatan, KknLocationState state, KknLocationNotifier notifier) {
    // 1. Jika sudah selesai presensi / izin / sakit / alpa
    if (kegiatan.isHadir) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.primaryGreen.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.primaryGreen, size: 18),
            SizedBox(width: 8),
            Text(
              'Presensi Berhasil (Hadir)',
              style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ],
        ),
      );
    }

    if (kegiatan.isIzin || kegiatan.isSakit || kegiatan.isAlpa) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.grey.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Text(
            'Status: ${kegiatan.statusKehadiran}',
            style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 13),
          ),
        ),
      );
    }

    // 2. Jika sedang berlangsung / tracking aktif pada kegiatan ini
    if (state.isTracking && state.selectedKegiatan?.id == kegiatan.id) {
      return ElevatedButton.icon(
        onPressed: () {
          setState(() {
            _showingTrackingDetail = true;
          });
        },
        icon: const Icon(Icons.radar_rounded, color: Colors.white, size: 18),
        label: const Text('Lanjutkan Tracking 📡', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryBlue,
          minimumSize: const Size(double.infinity, 44),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }

    // 3. Jika kegiatan AKTIF dan belum presensi
    if (kegiatan.isAktif) {
      return ElevatedButton.icon(
        onPressed: () async {
          await notifier.selectAndStartKegiatan(kegiatan, context: context);
        },
        icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
        label: const Text('Mulai Kegiatan 🚀', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryGreen,
          minimumSize: const Size(double.infinity, 44),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }

    // 4. Jika BELUM MULAI
    if (kegiatan.isBelumMulai) {
      return OutlinedButton.icon(
        onPressed: null,
        icon: const Icon(Icons.hourglass_top_rounded, size: 16),
        label: const Text('Belum Dimulai ⏳'),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 44),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }

    // 5. Jika SELESAI / LIBUR
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Center(
        child: Text(
          'Kegiatan Telah Berakhir',
          style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE 3: KOSONG (TIDAK ADA KEGIATAN)
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildEmptyState(KknLocationNotifier notifier) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48.0, horizontal: 24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.event_busy_rounded, color: Colors.grey, size: 64),
            ),
            const SizedBox(height: 20),
            const Text(
              'Tidak Ada Kegiatan KKN Hari Ini',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            const Text(
              'Jadwal kegiatan KKN aktif belum tersedia untuk kelompok Anda hari ini. Silakan cek kembali nanti atau hubungi DPL Anda.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => notifier.fetchKegiatanAktif(autoStartIfInZone: true, context: context),
              icon: const Icon(Icons.refresh_rounded, color: Colors.white),
              label: const Text('Muat Ulang', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE 4: DETAIL TRACKING AKTIF (GEOFENCE & TIMER)
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildTrackingDetailState(KknLocationState state, KknLocationNotifier notifier) {
    final kegiatan = state.selectedKegiatan;
    final pos = state.currentPosition;
    final lat = pos?.latitude.toStringAsFixed(5) ?? '-';
    final lng = pos?.longitude.toStringAsFixed(5) ?? '-';

    final durasiMenit = state.inZoneDurationSeconds ~/ 60;
    final durasiDetik = state.inZoneDurationSeconds % 60;
    final targetMenit = state.targetDurationMinutes;
    final remainingMenit = (targetMenit - durasiMenit) > 0 ? (targetMenit - durasiMenit) : 0;

    final isInside = state.isInsideRadius;
    final dist = state.distanceToTarget;
    final radius = kegiatan?.lokasi.radiusMeter ?? 150.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Error message if any
        if (state.error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline_rounded, color: AppColors.dangerRed, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    state.error!,
                    style: const TextStyle(color: AppColors.dangerRed, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Warning banner / Out-of-zone penalty warning
        if (state.zoneResetWarning != null && state.zoneResetWarning!.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: state.outOfZoneViolationRecorded ? AppColors.dangerRed.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: state.outOfZoneViolationRecorded ? AppColors.dangerRed : Colors.orange),
            ),
            child: Row(
              children: [
                Icon(
                  state.outOfZoneViolationRecorded ? Icons.warning_amber_rounded : Icons.info_outline_rounded,
                  color: state.outOfZoneViolationRecorded ? AppColors.dangerRed : Colors.orange[800],
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    state.zoneResetWarning!,
                    style: TextStyle(
                      color: state.outOfZoneViolationRecorded ? AppColors.dangerRed : Colors.orange[800],
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

        // Card Detail GPS & Target
        Card(
          color: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header status
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.satellite_alt_rounded, color: AppColors.primaryGreen, size: 22),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              kegiatan?.namaKegiatan ?? 'Kegiatan KKN',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            Text(
                              '${kegiatan?.jamMulai ?? "08:00"} - ${kegiatan?.jamSelesai ?? "16:00"} WIB',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.circle, color: AppColors.primaryGreen, size: 8),
                          SizedBox(width: 4),
                          Text('LIVE', style: TextStyle(color: AppColors.primaryGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24),

                // Posisi & Target
                _buildTrackingRow(Icons.my_location_rounded, 'Posisi Anda', '$lat, $lng'),
                const SizedBox(height: 10),
                _buildTrackingRow(Icons.location_on_rounded, 'Target Lokasi', kegiatan?.lokasi.alamat ?? '-'),
                const SizedBox(height: 10),
                _buildTrackingRow(
                  Icons.radar_rounded,
                  'Jarak ke Target',
                  dist < 900000 ? '${dist.round()} Meter (${isInside ? "Di dalam zona" : "Di luar zona"})' : 'Memindai...',
                ),
                const SizedBox(height: 10),
                _buildTrackingRow(Icons.radio_button_checked_rounded, 'Radius Toleransi', '${radius.round()} Meter'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Status Geofence Box
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isInside ? AppColors.primaryGreen.withValues(alpha: 0.1) : AppColors.dangerRed.withValues(alpha: 0.1),
            border: Border.all(color: isInside ? AppColors.primaryGreen.withValues(alpha: 0.4) : AppColors.dangerRed.withValues(alpha: 0.4)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(
                isInside ? Icons.check_circle_rounded : Icons.cancel_rounded,
                color: isInside ? AppColors.primaryGreen : AppColors.dangerRed,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isInside ? 'Dalam Zona Kegiatan ✅' : 'Di Luar Zona Kegiatan ⚠️',
                      style: TextStyle(
                        color: isInside ? AppColors.primaryGreen : AppColors.dangerRed,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isInside ? 'Durasi presensi terus terakumulasi.' : 'Durasi dijeda. Masuk ke area untuk melanjutkan.',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Durasi Progress Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Durasi Terdeteksi di Zona', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${targetMenit > 0 ? ((durasiMenit / targetMenit) * 100).clamp(0, 100).toStringAsFixed(0) : 0}%',
                      style: const TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '$durasiMenit mnt $durasiDetik dtk',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '/ $targetMenit mnt',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              LinearProgressIndicator(
                value: targetMenit > 0 ? (durasiMenit / targetMenit).clamp(0.0, 1.0) : 0,
                backgroundColor: Colors.grey[200],
                color: AppColors.primaryGreen,
                minHeight: 8,
                borderRadius: BorderRadius.circular(4),
              ),
              const SizedBox(height: 8),
              Text(
                state.isEligibleForAttendance
                    ? 'Waktu durasi telah terpenuhi! Tombol presensi siap digunakan.'
                    : 'Waktu tersisa: $remainingMenit menit lagi di dalam zona sebelum tombol presensi terbuka.',
                style: TextStyle(
                  fontSize: 12,
                  color: state.isEligibleForAttendance ? AppColors.primaryGreen : AppColors.textSecondary,
                  fontWeight: state.isEligibleForAttendance ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Tombol Absen Sekarang
        SizedBox(
          height: 50,
          child: ElevatedButton.icon(
            onPressed: state.isEligibleForAttendance
                ? () async => await _showAbsenConfirmation(state, notifier)
                : null,
            icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
            label: Text(
              state.isEligibleForAttendance ? 'Absen Sekarang ✅' : 'Absen Sekarang (Durasi Belum Cukup)',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              disabledBackgroundColor: Colors.grey[300],
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Tombol Berhenti Tracking
        SizedBox(
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () async => await _showStopTrackingDialog(notifier),
            icon: const Icon(Icons.stop_circle_outlined, color: AppColors.dangerRed),
            label: const Text(
              'Berhenti Tracking',
              style: TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.dangerRed),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTrackingRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.primaryGreen),
        const SizedBox(width: 8),
        SizedBox(
          width: 110,
          child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        ),
        const Text(': ', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE 5: PRESENSI BERHASIL
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildSuccessState(KknLocationState state, KknLocationNotifier notifier) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 36.0, horizontal: 16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primaryGreen.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppColors.primaryGreen, size: 72),
            ),
            const SizedBox(height: 20),
            const Text(
              'Presensi Berhasil Tercatat! 🎉',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              state.selectedKegiatan?.namaKegiatan ?? 'Kegiatan KKN',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.primaryGreen),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  _buildPopupRow('Waktu Absen', state.attendanceTime ?? DateTime.now().toLocal().toString().substring(11, 16)),
                  const SizedBox(height: 8),
                  _buildPopupRow('Status', 'HADIR ✅'),
                  const SizedBox(height: 8),
                  _buildPopupRow('GPS Service', 'Dinonaktifkan Otomatis 🛑'),
                ],
              ),
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: () {
                notifier.resetSuccessState();
                notifier.fetchKegiatanAktif(autoStartIfInZone: false);
              },
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              label: const Text(
                'Kembali ke Daftar Kegiatan ↩️',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIALOGS: KONFIRMASI ABSEN & BERHENTI TRACKING & KONFLIK
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _showAbsenConfirmation(KknLocationState state, KknLocationNotifier notifier) async {
    final user = ref.read(authProvider).user;
    final kelompokState = ref.read(kelompokKknProvider);

    final bool confirm = await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.assignment_turned_in_rounded, color: AppColors.primaryGreen, size: 26),
                  SizedBox(width: 8),
                  Text('Konfirmasi Presensi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPopupRow('Kegiatan', state.selectedKegiatan?.namaKegiatan ?? '-'),
                  const SizedBox(height: 6),
                  _buildPopupRow('Nama', user?.name ?? '-'),
                  const SizedBox(height: 6),
                  _buildPopupRow('NIM', user?.nim ?? '-'),
                  const SizedBox(height: 6),
                  _buildPopupRow('Kelompok', kelompokState.kelompok?.groupName ?? '-'),
                  const SizedBox(height: 6),
                  _buildPopupRow('Durasi', '${state.inZoneDurationSeconds ~/ 60} Menit'),
                  const SizedBox(height: 14),
                  const Text(
                    'Apakah Anda yakin ingin menyelesaikan absensi pada kegiatan ini sekarang?',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Batal', style: TextStyle(color: AppColors.textHint)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Kirim Presensi', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        ) ??
        false;

    if (confirm) {
      await notifier.recordAttendance(
        method: 'GPS_ACTIVITY_VALIDATED',
        kodeZona: _kodeZonaCtrl.text.trim(),
        rw: _rtRwCtrl.text.trim(),
        kelurahan: _selectedKelurahan,
      );
    }
  }

  Future<void> _showStopTrackingDialog(KknLocationNotifier notifier) async {
    final bool confirm = await showDialog<bool>(
          context: context,
          builder: (ctx) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: AppColors.dangerRed, size: 26),
                  SizedBox(width: 8),
                  Text('Berhenti Tracking?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
              content: const Text(
                'Tracking GPS akan dihentikan dan waktu di zona tidak akan bertambah lagi. Anda bisa memulai kembali nanti jika jam kegiatan masih aktif.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Lanjut Tracking', style: TextStyle(color: AppColors.textPrimary)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.dangerRed,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Ya, Berhenti', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        ) ??
        false;

    if (confirm) {
      await notifier.berhentiTracking(alasan: 'MANUAL_STOP');
    }
  }

  Future<void> _showConflictDialog(KknLocationState state, KknLocationNotifier notifier) async {
    final newKegiatan = state.conflictKegiatan;
    if (newKegiatan == null) return;

    final currentKegiatan = state.selectedKegiatan ??
        state.kegiatanList.where((k) => k.isBerlangsung).firstOrNull ??
        const KegiatanKknItem(
          id: 'OLD',
          namaKegiatan: 'Kegiatan Sebelumnya',
          tanggal: '',
          jamMulai: '',
          jamSelesai: '',
          durasiWajibMenit: 60,
          lokasi: KegiatanKknLokasi(alamat: '', latitude: 0, longitude: 0, radiusMeter: 150),
          status: 'AKTIF',
          kelompok: KegiatanKknKelompok(id: '', nama: ''),
        );

    final bool confirm = await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.swap_horiz_rounded, color: AppColors.primaryBlue, size: 26),
                  SizedBox(width: 8),
                  Text('Pindah Kegiatan KKN?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    state.conflictErrorMessage ??
                        'Anda masih aktif pada kegiatan lain. Ingin berpindah ke kegiatan ${newKegiatan.namaKegiatan}?',
                    style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Kegiatan sebelumnya akan diakhiri secara otomatis dan tracking untuk kegiatan baru akan dimulai.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    notifier.state = notifier.state.copyWith(clearConflict: true);
                    Navigator.pop(ctx, false);
                  },
                  child: const Text('Batal', style: TextStyle(color: AppColors.textHint)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlue,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Ya, Pindah Kegiatan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        ) ??
        false;

    if (confirm) {
      await notifier.switchKegiatan(
        oldKegiatan: currentKegiatan,
        newKegiatan: newKegiatan,
        context: context,
      );
    }
  }

  Widget _buildPopupRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textSecondary)),
        ),
        const Text(': ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textSecondary)),
        Expanded(
          child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        ),
      ],
    );
  }
}
