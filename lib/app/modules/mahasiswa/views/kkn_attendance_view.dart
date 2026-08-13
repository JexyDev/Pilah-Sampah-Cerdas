import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';

import '../../../routes/app_routes.dart';
import '../controllers/kkn_location_controller.dart';
import '../../auth/controllers/auth_controller.dart';

class KknAttendanceView extends ConsumerStatefulWidget {
  const KknAttendanceView({super.key});

  @override
  ConsumerState<KknAttendanceView> createState() => _KknAttendanceViewState();
}

class _KknAttendanceViewState extends ConsumerState<KknAttendanceView> {
  final String _selectedScheduleId = 'SCH-TODAY';
  final String _selectedScheduleTitle = 'Kegiatan KKN Posko';
  
  final TextEditingController _rtRwCtrl = TextEditingController();
  final TextEditingController _kodeZonaCtrl = TextEditingController(text: 'ZONA-KKN-POSKO');
  String _selectedKelurahan = 'Bojongsoang';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authProvider).user;
      if (user != null) {
        _rtRwCtrl.text = user.rw.isNotEmpty ? user.rw : '';
        if (user.kelurahan.isNotEmpty) {
          _selectedKelurahan = user.kelurahan;
        }
      }
    });
  }
  
  @override
  void dispose() {
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
            color: AppColors.primaryGreenLight,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Icon(Icons.check_circle, color: AppColors.primaryGreen, size: 64),
                  const SizedBox(height: 16),
                  const Text(
                    'Presensi Berhasil Tercatat!',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreen),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Waktu Presensi: ${state.attendanceTime}',
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
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Validasi Zona',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Pilih zona presensi sesuai lokasi kegiatan Anda saat ini.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedKelurahan,
                    decoration: InputDecoration(
                      labelText: 'Kelurahan',
                      prefixIcon: const Icon(Icons.location_city_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Bojongsoang', child: Text('Bojongsoang')),
                      DropdownMenuItem(value: 'Bojongsari', child: Text('Bojongsari')),
                      DropdownMenuItem(value: 'Cipagalo', child: Text('Cipagalo')),
                      DropdownMenuItem(value: 'Lengkong', child: Text('Lengkong')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _selectedKelurahan = val);
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _rtRwCtrl,
                    decoration: InputDecoration(
                      labelText: 'RW',
                      prefixIcon: const Icon(Icons.tag_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _kodeZonaCtrl,
                    decoration: InputDecoration(
                      labelText: 'Kode Zona',
                      prefixIcon: const Icon(Icons.pin_drop_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Manual check-in button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () async {
                if (_rtRwCtrl.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Harap isi RW.')));
                  return;
                }
                await notifier.recordAttendance(
                  method: 'MANUAL_ZONA',
                  kodeZona: _kodeZonaCtrl.text.trim(),
                  rw: _rtRwCtrl.text.trim(),
                  kelurahan: _selectedKelurahan,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.location_on_rounded, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Kirim Presensi Sekarang',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
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
                foregroundColor: AppColors.warningOrange,
                side: const BorderSide(color: AppColors.warningOrange, width: 1.5),
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
}
