import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';

import '../../../routes/app_routes.dart';
import '../controllers/kkn_location_controller.dart';

class KknAttendanceView extends ConsumerStatefulWidget {
  const KknAttendanceView({super.key});

  @override
  ConsumerState<KknAttendanceView> createState() => _KknAttendanceViewState();
}

class _KknAttendanceViewState extends ConsumerState<KknAttendanceView> {
  final String _selectedScheduleId = 'SCH-TODAY';
  final String _selectedScheduleTitle = 'Kegiatan KKN Posko';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final notifier = ref.read(kknLocationProvider.notifier);
      notifier.startTracking(context);
      notifier.setActiveSchedule(_selectedScheduleId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(kknLocationProvider);
    final locationNotifier = ref.read(kknLocationProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Absensi Radius KKN',
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
            icon: const Icon(Icons.refresh),
            onPressed: () {
              locationNotifier.setActiveSchedule(_selectedScheduleId);
            },
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: SingleChildScrollView(
          child: _buildAttendanceDetail(locationState, locationNotifier),
        ),
      ),
    );
  }


  Widget _buildAttendanceDetail(KknLocationState state, KknLocationNotifier notifier) {
    final activity = state.activeActivity;
    final pos = state.currentPosition;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header info
        Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Text(
            _selectedScheduleTitle,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
        ),
        const SizedBox(height: 12),

        // Error message if any
        if (state.error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              state.error!,
              style: const TextStyle(color: AppColors.dangerRed, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Success attendance
        if (state.isSuccessAttendance) ...[
          Card(
            color: Colors.green.shade50,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 64),
                  const SizedBox(height: 16),
                  const Text(
                    'Absensi Berhasil Tercatat!',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Waktu Absen: ${state.attendanceTime}',
                    style: const TextStyle(fontSize: 13, color: Colors.black54),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Poin bonus +10 sudah ditambahkan ke akun Anda.',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black45),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ] else ...[
          // Warning Reset
          if (state.zoneResetWarning != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.dangerRed),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.dangerRed, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      state.zoneResetWarning!,
                      style: const TextStyle(fontSize: 12, color: AppColors.dangerRed, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Tracking state card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Status GPS Tracking:',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: state.isTracking
                              ? AppColors.primaryGreen.withValues(alpha: 0.1)
                              : Colors.orange.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          state.isTracking ? 'AKTIF' : 'NON-AKTIF',
                          style: TextStyle(
                            color: state.isTracking ? AppColors.primaryGreen : Colors.orange,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),

                  // Coordinates info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Posisi Anda:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      Text(
                        pos != null
                            ? '${pos.latitude.toStringAsFixed(5)}, ${pos.longitude.toStringAsFixed(5)}'
                            : 'Mencari lokasi...',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Target Location Coordinates info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Target Lokasi:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      Text(
                        activity != null
                            ? '${((activity['latitude'] as num?)?.toDouble() ?? -6.96772).toStringAsFixed(5)}, ${((activity['longitude'] as num?)?.toDouble() ?? 107.65906).toStringAsFixed(5)}'
                            : '-6.96772, 107.65906',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Radius
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Radius Toleransi:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      Text(
                        activity != null ? '${activity['radius'] ?? 500} meter' : '500 meter',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Geofence status banner
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
            decoration: BoxDecoration(
              color: state.isInsideRadius
                  ? AppColors.primaryGreen.withValues(alpha: 0.1)
                  : Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: state.isInsideRadius ? AppColors.primaryGreen : Colors.orange,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  state.isInsideRadius ? Icons.verified_user : Icons.warning_amber_rounded,
                  color: state.isInsideRadius ? AppColors.primaryGreen : Colors.orange,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        state.isInsideRadius
                            ? 'Kamu berada di dalam radius lokasi'
                            : 'Kamu belum berada di lokasi kegiatan',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: state.isInsideRadius ? AppColors.primaryGreen : Colors.orange,
                        ),
                      ),
                      if (pos != null && activity != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Jarak Anda: ${state.distanceToTarget.toStringAsFixed(1)}m dari titik pusat',
                          style: TextStyle(
                            fontSize: 11,
                            color: state.isInsideRadius
                                ? AppColors.primaryGreen.withValues(alpha: 0.8)
                                : Colors.orange.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Live Duration Progress Bar (2-Hour Validation)
          if (state.isInsideRadius) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: state.isEligibleForAttendance
                      ? AppColors.primaryGreen
                      : AppColors.warningOrange,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            state.isEligibleForAttendance
                                ? Icons.check_circle_rounded
                                : Icons.timer_rounded,
                            color: state.isEligibleForAttendance
                                ? AppColors.primaryGreen
                                : AppColors.warningOrange,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Durasi Terdeteksi di Zona:',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      Text(
                        '${(state.inZoneDurationSeconds / 60).floor()} / 120 Menit',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: state.isEligibleForAttendance
                              ? AppColors.primaryGreen
                              : AppColors.warningOrange,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: (state.inZoneDurationSeconds / 7200).clamp(0.0, 1.0),
                      minHeight: 8,
                      backgroundColor: Colors.grey.shade200,
                      color: state.isEligibleForAttendance
                          ? AppColors.primaryGreen
                          : AppColors.warningOrange,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    state.isEligibleForAttendance
                        ? '✓ Syarat durasi 2 jam kontinu telah terpenuhi. Silakan tekan tombol Absen.'
                        : 'Waktu tersisa: ${((7200 - state.inZoneDurationSeconds) / 60).ceil()} menit lagi sebelum tombol absen terbuka.',
                    style: TextStyle(
                      fontSize: 11,
                      color: state.isEligibleForAttendance
                          ? AppColors.primaryGreen
                          : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Manual check-in button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: state.isEligibleForAttendance
                  ? () => _showWilayahDialog(notifier, state)
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                disabledBackgroundColor: Colors.grey.shade300,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.location_on_rounded, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Absen Sekarang (Kirim ke DPL)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
          if (!state.isInsideRadius) ...[
            const SizedBox(height: 8),
            const Text(
              'Tombol absen dinonaktifkan karena Anda berada di luar radius lokasi.',
              style: TextStyle(fontSize: 11, color: AppColors.dangerRed, fontStyle: FontStyle.italic),
              textAlign: TextAlign.center,
            ),
          ],

          const SizedBox(height: 16),
          // Tombol Pengajuan Tidak Hadir / Sakit / Izin
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  AppRoutes.pengajuanIzin,
                  arguments: {
                    'scheduleId': _selectedScheduleId,
                    'scheduleTitle': _selectedScheduleTitle,
                  },
                );
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.orange.shade800,
                side: BorderSide(color: Colors.orange.shade400, width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.event_busy_rounded, size: 20),
              label: const Text(
                'Tidak Hadir / Ajukan Izin / Sakit',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
        ],
      ],
    );
  }

  void _showWilayahDialog(KknLocationNotifier notifier, KknLocationState state) {
    final activity = state.activeActivity;
    final activityTitle = activity?['title']?.toString() ?? 'Kegiatan KKN';
    
    final kodeZonaCtrl = TextEditingController(text: activity?['kodeZona']?.toString() ?? 'ZONA-KKN-TERKUNCI');
    final rtRwCtrl = TextEditingController(text: activity?['rtRw']?.toString() ?? 'Sesuai Penugasan');
    final selectedKelurahan = activity?['kelurahan']?.toString() ?? 'Bojongsoang';
    
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                20,
                20,
                20,
                MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Data Wilayah Terkunci API',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Anda berada di zona: $activityTitle.\nData wilayah telah disesuaikan dengan koordinat GPS Anda.',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      initialValue: selectedKelurahan,
                      readOnly: true,
                      enabled: false,
                      decoration: InputDecoration(
                        labelText: 'Kelurahan (Terkunci)',
                        prefixIcon: const Icon(Icons.location_city_rounded),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: rtRwCtrl,
                      readOnly: true,
                      enabled: false,
                      decoration: InputDecoration(
                        labelText: 'RT / RW (Terkunci)',
                        prefixIcon: const Icon(Icons.tag_rounded),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: kodeZonaCtrl,
                      readOnly: true,
                      enabled: false,
                      decoration: InputDecoration(
                        labelText: 'Kode Zona (Terkunci)',
                        prefixIcon: const Icon(Icons.pin_drop_rounded),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          if (!formKey.currentState!.validate()) return;
                          Navigator.pop(context);
                          await notifier.recordAttendance(
                            method: 'GEOFENCE_2HRS',
                            kodeZona: kodeZonaCtrl.text.trim(),
                            rtRw: rtRwCtrl.text.trim(),
                            kelurahan: selectedKelurahan,
                          );
                        },
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.send_rounded, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'KIRIM ABSENSI SEKARANG',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
