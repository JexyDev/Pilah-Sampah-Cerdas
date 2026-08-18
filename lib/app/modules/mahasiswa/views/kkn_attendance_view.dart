import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';

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
      // Hapus auto-start: User harus menekan tombol "Mulai Tracking" secara manual
      // if (!ref.read(kknLocationProvider).isTracking) {
      //   ref.read(kknLocationProvider.notifier).startTracking(context);
      // }
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

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Presensi KKN',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: AppColors.primaryGreen,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            tooltip: 'Perbarui Lokasi GPS',
            onPressed: () async {
              ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Memperbarui koordinat GPS & zonasi...'),
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


  Future<void> _showAbsenDialog(KknLocationState state, KknLocationNotifier notifier) async {
    final user = ref.read(authProvider).user;
    if (user == null) return;
    
    final kelompokState = ref.read(kelompokKknProvider);
    final kelompokName = kelompokState.kelompok?.groupName ?? '-';

    final bool confirm = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.assignment_turned_in_rounded, color: AppColors.primaryGreen, size: 28),
              SizedBox(width: 8),
              Text('Konfirmasi Kehadiran', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPopupRow('Kegiatan', state.activeActivity?['namaKegiatan'] ?? state.activeActivity?['nama'] ?? ''),
              const SizedBox(height: 8),
              _buildPopupRow('Waktu', DateTime.now().toLocal().toString().substring(0, 16)),
              const SizedBox(height: 8),
              _buildPopupRow('Nama', user.name),
              const SizedBox(height: 8),
              _buildPopupRow('NIM', user.nim),
              const SizedBox(height: 8),
              _buildPopupRow('Kelompok', kelompokName),
              const SizedBox(height: 8),
              _buildPopupRow('DPL', kelompokState.kelompok?.dosenPembimbing ?? '-'),
              const SizedBox(height: 16),
              const Text('Apakah Anda yakin ingin melakukan absensi sekarang?', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
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
              child: const Text('Absen', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    ) ?? false;

    if (confirm) {
      await notifier.recordAttendance(
        method: 'GPS_VALIDATED',
        kodeZona: _kodeZonaCtrl.text.trim(),
        rw: _rtRwCtrl.text.trim(),
        kelurahan: _selectedKelurahan,
      );
    }
  }

  Widget _buildPopupRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 70, child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textSecondary))),
        const Text(': ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textSecondary)),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
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
              Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
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
                Text(title, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceDetail(KknLocationState state, KknLocationNotifier notifier) {
    final pos = state.currentPosition;
    final lat = pos?.latitude.toStringAsFixed(5) ?? '-';
    final lng = pos?.longitude.toStringAsFixed(5) ?? '-';
    final isGpsActive = state.isTracking;

    final durasiMenit = state.inZoneDurationSeconds ~/ 60;
    final durasiDetik = state.inZoneDurationSeconds % 60;
    final targetMenit = state.targetDurationMinutes;
    final remainingMenit = targetMenit - durasiMenit;
    
    final bool isDisabled = state.zoneResetWarning != null && 
        (state.zoneResetWarning!.toLowerCase().contains('izin') || state.zoneResetWarning!.toLowerCase().contains('sakit'));
    
    final bool isAlpa = state.zoneResetWarning != null && state.zoneResetWarning!.toLowerCase().contains('tanpa keterangan') && !state.isSuccessAttendance;
    final bool isSuccess = state.isSuccessAttendance;

    final bool isLibur = state.activeActivity != null && 
        (state.activeActivity!['hasActiveZone'] == false || state.activeActivity!['status'] == 'libur');

    if (isLibur) {
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
                'Tidak Ada Kegiatan Aktif (Libur)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
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

    // Ambil string waktu asli dari data jadwal (misal: "11:00 - 13:00 WIB")
    final String? timeLabel = state.activeActivity?['time']?.toString();
    
    // Tampilan jika belum mulai tracking
    if (!state.isTracking && !isSuccess && !isAlpa && state.error == null && state.activeActivity != null) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 48),
          const Icon(Icons.location_on_rounded, size: 80, color: AppColors.primaryGreen),
          const SizedBox(height: 24),
          const Text(
            'Siap Memulai KKN?',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          const Text(
            'Tekan tombol di bawah untuk mulai memantau lokasi dan menghitung waktu kehadiran Anda di area KKN.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => notifier.startTracking(context),
            icon: const Icon(Icons.play_arrow_rounded, color: Colors.white),
            label: const Text('Mulai Tracking', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      );
    }

    Widget content = Column(
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
                TextButton(
                  onPressed: () => notifier.forceLocationUpdate(context),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    visualDensity: VisualDensity.compact,
                  ),
                  child: const Text('Coba Lagi', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.dangerRed)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        if (state.zoneResetWarning != null && state.zoneResetWarning!.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSuccess ? AppColors.primaryGreen.withValues(alpha: 0.1) : (isAlpa ? AppColors.dangerRed.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1)),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: isSuccess ? AppColors.primaryGreen : (isAlpa ? AppColors.dangerRed : Colors.orange)),
            ),
            child: Row(
              children: [
                Icon(
                  isSuccess ? Icons.check_circle_rounded : (isAlpa ? Icons.cancel_rounded : Icons.info_outline_rounded),
                  color: isSuccess ? AppColors.primaryGreen : (isAlpa ? AppColors.dangerRed : Colors.orange),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    state.zoneResetWarning!,
                    style: TextStyle(
                      color: isSuccess ? AppColors.primaryGreen : (isAlpa ? AppColors.dangerRed : Colors.orange[800]),
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

        // Detail GPS Card
        Card(
          color: Colors.white,
          elevation: 2,
          shadowColor: Colors.black.withValues(alpha: 0.1),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                            color: AppColors.primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.location_on_outlined, color: AppColors.primaryGreen, size: 24),
                        ),
                        const SizedBox(width: 12),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('GPS Tracking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Text('Lokasi sedang dipantau', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isGpsActive ? AppColors.primaryGreen.withValues(alpha: 0.1) : Colors.grey.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isGpsActive ? AppColors.primaryGreen : Colors.grey,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isGpsActive ? 'AKTIF' : 'NON-AKTIF',
                            style: TextStyle(
                              color: isGpsActive ? AppColors.primaryGreen : Colors.grey,
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
                  value: state.activeActivity != null ? (state.activeActivity!['address'] ?? state.activeActivity!['targetLokasi'] ?? state.activeActivity!['location'] ?? '-') : '-',
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildBoxDetail(Icons.radar, 'Radius Toleransi', state.activeActivity != null ? '${state.activeActivity!['radius'] ?? state.activeActivity!['radiusMeter'] ?? 100} Meter' : '-')),
                    const SizedBox(width: 12),
                    Expanded(child: _buildBoxDetail(Icons.access_time_rounded, 'Jam Kegiatan', (timeLabel != null && timeLabel.isNotEmpty) ? timeLabel.toUpperCase() : (state.activeActivity != null ? (state.activeActivity!['jamKegiatan'] ?? state.activeActivity!['time'] ?? '08:00 - 16:00') : '-'))),
                  ],
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.groups_rounded,
                  title: 'Nama Kegiatan',
                  value: state.activeActivity != null ? (state.activeActivity!['namaKegiatan'] ?? state.activeActivity!['zoneName'] ?? state.activeActivity!['title'] ?? '-') : '-',
                ),
                _buildDashedDivider(),
                _buildIconDetailRow(
                  icon: Icons.timer_outlined,
                  title: 'Durasi Kegiatan',
                  value: state.activeActivity != null ? '$targetMenit Menit' : '-',
                  trailing: const Icon(Icons.map_rounded, size: 48, color: AppColors.primaryGreen),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Status Inside Radius
        if (state.activeActivity == null || state.activeActivity!.isEmpty)
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
                  child: const Icon(Icons.info_outline_rounded, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tidak ada jadwal aktif saat ini',
                        style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Jadwal kegiatan KKN belum tersedia atau lokasi belum diset.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )
        else
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: state.isInsideRadius ? AppColors.primaryGreen.withValues(alpha: 0.1) : AppColors.dangerRed.withValues(alpha: 0.1),
              border: Border.all(color: state.isInsideRadius ? AppColors.primaryGreen.withValues(alpha: 0.5) : AppColors.dangerRed.withValues(alpha: 0.5)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: state.isInsideRadius ? AppColors.primaryGreen : AppColors.dangerRed,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    state.isInsideRadius ? Icons.check_rounded : Icons.close_rounded,
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
                        state.isInsideRadius ? 'Kamu berada di dalam radius lokasi' : 'Kamu berada di luar radius lokasi',
                        style: TextStyle(
                          color: state.isInsideRadius ? AppColors.primaryGreen : AppColors.dangerRed,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        state.isInsideRadius ? 'Sinyal GPS stabil dan lokasi terdeteksi.' : 'Pergerakan absensi dihentikan sementara.',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 16),

        // Durasi Card
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
                    child: const Icon(Icons.timer_rounded, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Durasi Terdeteksi di Zona', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                        const SizedBox(height: 4),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('$durasiMenit mnt $durasiDetik dtk', style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 18)),
                            const SizedBox(width: 4),
                            Text('/ $targetMenit mnt', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${targetMenit > 0 ? ((durasiMenit / targetMenit) * 100).toStringAsFixed(1) : 0}%',
                      style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              LinearProgressIndicator(
                value: targetMenit > 0 ? (durasiMenit / targetMenit).clamp(0.0, 1.0) : 0,
                backgroundColor: Colors.grey[300],
                color: Colors.orange,
                minHeight: 6,
                borderRadius: BorderRadius.circular(3),
              ),
              const SizedBox(height: 12),
              Text(
                remainingMenit > 0 
                    ? 'Waktu tersisa: $remainingMenit menit lagi sebelum tombol absen terbuka.'
                    : 'Waktu terpenuhi! Tombol absen sudah terbuka.',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Absen Sekarang Button
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: (state.isEligibleForAttendance && !isSuccess && !isAlpa) ? () async {
              await _showAbsenDialog(state, notifier);
            } : null,
            icon: Icon(
              isSuccess ? Icons.check_circle_rounded : (isAlpa ? Icons.cancel_rounded : Icons.location_on_rounded), 
              color: (state.isEligibleForAttendance || isSuccess || isAlpa) ? Colors.white : Colors.grey[500],
              size: 20,
            ),
            label: Text(
              isSuccess 
                  ? 'Berhasil Absen' 
                  : (isAlpa ? 'Tanpa Keterangan (Waktu Habis)' : 'Absen Sekarang'),
              style: TextStyle(
                fontWeight: FontWeight.bold, 
                fontSize: 15, 
                color: (state.isEligibleForAttendance || isSuccess || isAlpa) ? Colors.white : Colors.grey[500]
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: isSuccess ? AppColors.primaryGreen : (isAlpa ? AppColors.dangerRed : Colors.grey[300]),
              disabledBackgroundColor: Colors.grey[300],
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ).copyWith(
              backgroundColor: WidgetStateProperty.resolveWith((states) {
                if (isSuccess) return AppColors.primaryGreen;
                if (isAlpa) return AppColors.dangerRed;
                if (states.contains(WidgetState.disabled)) return Colors.grey[300];
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
      ],
    );

    if (isDisabled) {
      return AbsorbPointer(
        absorbing: true,
        child: ColorFiltered(
          colorFilter: const ColorFilter.matrix([
            0.2126, 0.7152, 0.0722, 0, 0,
            0.2126, 0.7152, 0.0722, 0, 0,
            0.2126, 0.7152, 0.0722, 0, 0,
            0,      0,      0,      1, 0,
          ]),
          child: content,
        ),
      );
    }

    return content;
  }

}
