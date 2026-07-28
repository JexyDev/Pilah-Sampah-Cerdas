import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../providers/repository_providers.dart';
import '../providers/kkn_location_provider.dart';

class KknAttendanceScreen extends ConsumerStatefulWidget {
  const KknAttendanceScreen({super.key});

  @override
  ConsumerState<KknAttendanceScreen> createState() => _KknAttendanceScreenState();
}

class _KknAttendanceScreenState extends ConsumerState<KknAttendanceScreen> {
  List<dynamic> _schedules = [];
  bool _isLoadingSchedules = true;
  String? _selectedScheduleId;
  String? _selectedScheduleTitle;

  @override
  void initState() {
    super.initState();
    _fetchSchedules();
  }

  Future<void> _fetchSchedules() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.dio.get('/schedules');
      if (res.statusCode == 200) {
        setState(() {
          _schedules = res.data['data'] ?? [];
          _isLoadingSchedules = false;
        });
      }
    } catch (_) {
      setState(() {
        _isLoadingSchedules = false;
      });
    }
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
        actions: [
          if (_selectedScheduleId != null)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                locationNotifier.setActiveSchedule(_selectedScheduleId!);
              },
            )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: _selectedScheduleId == null
            ? _buildScheduleList()
            : _buildAttendanceDetail(locationState, locationNotifier),
      ),
    );
  }

  Widget _buildScheduleList() {
    if (_isLoadingSchedules) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen));
    }

    if (_schedules.isEmpty) {
      return const Center(
        child: Text(
          'Tidak ada jadwal kegiatan saat ini.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Pilih Kegiatan KKN Hari Ini:',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: ListView.builder(
            itemCount: _schedules.length,
            itemBuilder: (context, index) {
              final schedule = _schedules[index];
              final date = DateTime.tryParse(schedule['date'] ?? '')?.toLocal();
              final dateStr = date != null
                  ? '${date.day}/${date.month}/${date.year}'
                  : '-';

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _selectedScheduleId = schedule['id'];
                      _selectedScheduleTitle = schedule['title'];
                    });
                    ref.read(kknLocationProvider.notifier).setActiveSchedule(schedule['id']);
                    ref.read(kknLocationProvider.notifier).startTracking(context);
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(AppDimensions.md),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.calendar_today, color: AppColors.primaryGreen, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                schedule['title'] ?? '(Tanpa Judul)',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${schedule['category']} • $dateStr',
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                              if (schedule['location'] != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  schedule['location'],
                                  style: const TextStyle(fontSize: 11, color: AppColors.textHint),
                                ),
                              ]
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, color: AppColors.textHint)
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildAttendanceDetail(KknLocationState state, KknLocationNotifier notifier) {
    final activity = state.activeActivity;
    final pos = state.currentPosition;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header info
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
              onPressed: () {
                notifier.stopTracking();
                notifier.clearActiveSchedule();
                setState(() {
                  _selectedScheduleId = null;
                  _selectedScheduleTitle = null;
                });
              },
            ),
            Expanded(
              child: Text(
                _selectedScheduleTitle ?? 'Detail Kegiatan',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Error message if any
        if (state.error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withOpacity(0.1),
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
                              ? AppColors.primaryGreen.withOpacity(0.1)
                              : Colors.orange.withOpacity(0.1),
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
                            ? '${(activity['latitude'] as double).toStringAsFixed(5)}, ${(activity['longitude'] as double).toStringAsFixed(5)}'
                            : '-',
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
                        activity != null ? '${activity['radius']} meter' : '-',
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
                  ? AppColors.primaryGreen.withOpacity(0.1)
                  : Colors.orange.withOpacity(0.1),
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
                                ? AppColors.primaryGreen.withOpacity(0.8)
                                : Colors.orange.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Manual check-in button
          ElevatedButton(
            onPressed: state.isInsideRadius
                ? () {
                    notifier.recordAttendance('MANUAL');
                  }
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryGreen,
              disabledBackgroundColor: Colors.grey.shade300,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text(
              'Absen Manual Sekarang',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
            ),
          ),
          if (!state.isInsideRadius) ...[
            const SizedBox(height: 8),
            const Text(
              'Tombol absen manual dinonaktifkan karena Anda di luar radius toleransi.',
              style: TextStyle(fontSize: 11, color: AppColors.dangerRed, fontStyle: FontStyle.italic),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ],
    );
  }
}
