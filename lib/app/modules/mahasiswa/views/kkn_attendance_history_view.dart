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
  ConsumerState<KknAttendanceHistoryView> createState() =>
      _KknAttendanceHistoryViewState();
}

class _KknAttendanceHistoryViewState
    extends ConsumerState<KknAttendanceHistoryView> {
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

  // Format durasi panjang: "3 Jam 45 Menit" | "45 Menit" | "0 Menit"
  String _formatDurasi(int menit) {
    if (menit <= 0) return '0 Menit';
    final jam = menit ~/ 60;
    final sisa = menit % 60;
    if (jam > 0 && sisa > 0) return '$jam Jam $sisa Menit';
    if (jam > 0) return '$jam Jam';
    return '$menit Menit';
  }

  // Format durasi singkat untuk label rasio: "3j 45m"
  String _formatDurasiSingkat(int menit) {
    if (menit <= 0) return '0 mnt';
    final jam = menit ~/ 60;
    final sisa = menit % 60;
    if (jam > 0 && sisa > 0) return '${jam}j ${sisa}m';
    if (jam > 0) return '${jam}j';
    return '${menit}m';
  }

  // Format jam dari ISO string => "08.30 WIB"
  String _formatJam(String? isoStr) {
    if (isoStr == null) return '-';
    try {
      final dt = DateTime.parse(isoStr).toLocal();
      final jam = dt.hour.toString().padLeft(2, '0');
      final mnt = dt.minute.toString().padLeft(2, '0');
      return '$jam.$mnt WIB';
    } catch (_) {
      return '-';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Riwayat Presensi KKN',
          style: TextStyle(color: Colors.black),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primaryGreen),
            )
          : _historyData == null
              ? const Center(child: Text('Data riwayat tidak ditemukan.'))
              : _buildHistoryContent(),
    );
  }

  Widget _buildHistoryContent() {
    final history = _historyData!;

    final jamMasuk = _formatJam(history['jamMasuk'] as String?);
    final jamSelesai = _formatJam(history['jamPulang'] as String?);

    // DA = JP - JM (Durasi Aktual dalam menit)
    final durasiAktualMenit =
        (history['durasiAktualMenit'] as num?)?.toInt() ?? 0;

    // TM = Target Minimal / Hari (dalam menit)
    final targetMenit =
        (history['targetDurationMinutes'] as num?)?.toInt() ??
        (((history['targetHours'] as num?)?.toInt() ?? 4) * 60);

    // Rasio = DA / TM * 100
    final rasio = targetMenit > 0
        ? ((durasiAktualMenit / targetMenit) * 100).clamp(0, 999).toInt()
        : 0;

    final isHadir = history['isHadir'] == true;
    final isMemenuhi = durasiAktualMenit >= targetMenit && durasiAktualMenit > 0;

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
              // ── Header Status ─────────────────────────────────────────────
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isHadir
                          ? AppColors.primaryGreen.withValues(alpha: 0.1)
                          : AppColors.dangerRed.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isHadir ? Icons.verified_rounded : Icons.cancel_rounded,
                      color: isHadir
                          ? AppColors.primaryGreen
                          : AppColors.dangerRed,
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
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                        Text(
                          isHadir
                              ? 'Selesai & Memenuhi Syarat'
                              : 'Tidak Memenuhi Syarat (Alpa)',
                          style: TextStyle(
                            color: isHadir
                                ? AppColors.primaryGreen
                                : AppColors.dangerRed,
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

              // ── Jam Masuk & Jam Pulang ─────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildTimeDetail(
                    Icons.login_rounded,
                    'Jam Masuk (JM)',
                    jamMasuk,
                    Colors.blue,
                  ),
                  _buildTimeDetail(
                    Icons.logout_rounded,
                    'Jam Pulang (JP)',
                    jamSelesai,
                    Colors.orange,
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ── DA = JP - JM ────────────────────────────────────────────────
              _buildMetricBox(
                label: 'Durasi Aktual (DA)',
                subLabel: 'DA = JP - JM',
                valuePrimary: _formatDurasi(durasiAktualMenit),
                valueSecondary: '$durasiAktualMenit menit',
                color: AppColors.primaryGreen,
              ),
              const SizedBox(height: 8),

              // ── Target Minimal/Hari (TM) ────────────────────────────────────
              _buildMetricBox(
                label: 'Target Minimal/Hari (TM)',
                subLabel: 'Durasi wajib harian',
                valuePrimary: _formatDurasi(targetMenit),
                valueSecondary: '$targetMenit menit',
                color: AppColors.textPrimary,
              ),
              const SizedBox(height: 8),

              // ── Rasio DA/TM x 100% ─────────────────────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 14,
                  horizontal: 16,
                ),
                decoration: BoxDecoration(
                  color: isMemenuhi
                      ? AppColors.primaryGreen.withValues(alpha: 0.05)
                      : AppColors.dangerRed.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isMemenuhi
                        ? AppColors.primaryGreen.withValues(alpha: 0.3)
                        : AppColors.dangerRed.withValues(alpha: 0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Rasio  (DA / TM x 100)',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: isMemenuhi
                                ? AppColors.primaryGreen
                                : AppColors.dangerRed,
                          ),
                        ),
                        Text(
                          '$rasio%',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                            color: isMemenuhi
                                ? AppColors.primaryGreen
                                : AppColors.dangerRed,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // _formatDurasiSingkat dipakai di sini (fix: unused_element warning)
                    Text(
                      '${_formatDurasiSingkat(durasiAktualMenit)} / ${_formatDurasiSingkat(targetMenit)}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (rasio / 100).clamp(0.0, 1.0),
                        minHeight: 8,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isMemenuhi ? AppColors.primaryGreen : Colors.orange,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      isMemenuhi
                          ? 'Memenuhi Target Harian'
                          : 'Kurang dari Target Harian',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isMemenuhi
                            ? AppColors.primaryGreen
                            : AppColors.dangerRed,
                      ),
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

  Widget _buildTimeDetail(
    IconData icon,
    String title,
    String time,
    Color iconColor,
  ) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                time,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricBox({
    required String label,
    required String subLabel,
    required String valuePrimary,
    required String valueSecondary,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE9ECEF)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subLabel,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                valuePrimary,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: color,
                  fontSize: 15,
                ),
              ),
              Text(
                valueSecondary,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
