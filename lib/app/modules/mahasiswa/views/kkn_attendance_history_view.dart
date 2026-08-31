import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';

class KknAttendanceHistoryView extends ConsumerStatefulWidget {
  final String scheduleId;

  const KknAttendanceHistoryView({
    super.key,
    required this.scheduleId,
  });

  @override
  ConsumerState<KknAttendanceHistoryView> createState() => _KknAttendanceHistoryViewState();
}

class _KknAttendanceHistoryViewState extends ConsumerState<KknAttendanceHistoryView> {
  bool _isLoading = true;
  Map<String, dynamic>? _historyData;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    final repo = ref.read(kknRepositoryProvider);
    final history = await repo.getPresensiHistory(widget.scheduleId);
    if (mounted) {
      setState(() {
        _historyData = history;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Riwayat Presensi KKN', style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : _historyData == null
              ? const Center(child: Text('Data riwayat tidak ditemukan.'))
              : _buildHistoryContent(),
    );
  }

  Widget _buildHistoryContent() {
    final history = _historyData!;
    final jamMasuk = history['jamMasuk'] != null
        ? DateTime.parse(history['jamMasuk']).toLocal().toString().substring(11, 16)
        : '-';
    final jamSelesai = history['jamPulang'] != null
        ? DateTime.parse(history['jamPulang']).toLocal().toString().substring(11, 16)
        : '-';
    final durasiMenit = history['durasiAktualMenit'] ?? 0;
    final isHadir = history['isHadir'] == true;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Card(
        color: Colors.white,
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isHadir ? AppColors.primaryGreen.withValues(alpha: 0.1) : AppColors.dangerRed.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isHadir ? Icons.verified_rounded : Icons.cancel_rounded,
                      color: isHadir ? AppColors.primaryGreen : AppColors.dangerRed,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Hasil Kegiatan',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                        Text(
                          isHadir ? 'Selesai & Memenuhi Syarat' : 'Tidak Memenuhi Syarat (Alpa)',
                          style: TextStyle(
                            color: isHadir ? AppColors.primaryGreen : AppColors.dangerRed,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(height: 1, color: Color(0xFFEEEEEE)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildHistoryTimeDetail(Icons.login_rounded, 'Jam Masuk', jamMasuk, Colors.blue),
                  _buildHistoryTimeDetail(Icons.logout_rounded, 'Jam Keluar', jamSelesai, Colors.orange),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE9ECEF)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Durasi Aktual', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    Text(
                      '$durasiMenit Menit',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryGreen, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryTimeDetail(IconData icon, String title, String time, Color iconColor) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              Text(time, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
        ],
      ),
    );
  }
}
