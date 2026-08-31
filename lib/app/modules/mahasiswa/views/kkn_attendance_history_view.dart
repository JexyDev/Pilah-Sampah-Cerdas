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

class _KknAttendanceHistoryViewState extends ConsumerState<KknAttendanceHistoryView>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  Map<String, dynamic>? _historyData;
  late AnimationController _progressAnimController;
  late Animation<double> _progressAnimation;

  @override
  void initState() {
    super.initState();
    _progressAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _progressAnimation = CurvedAnimation(
      parent: _progressAnimController,
      curve: Curves.easeOutCubic,
    );
    _fetchHistory();
  }

  @override
  void dispose() {
    _progressAnimController.dispose();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    final repo = ref.read(kknRepositoryProvider);
    final history = await repo.getPresensiHistory(widget.scheduleId);
    if (mounted) {
      setState(() {
        _historyData = history;
        _isLoading = false;
      });
      if (history != null) {
        _progressAnimController.forward();
      }
    }
  }

  // ─── Helpers ────────────────────────────────────────────────

  Color _getStatusColor(String? status) {
    switch ((status ?? '').toUpperCase()) {
      case 'HADIR_MEMENUHI':
        return AppColors.primaryGreen;
      case 'HADIR_TIDAK_MEMENUHI':
      case 'SELESAI_TELAT':
        return Colors.orange.shade700;
      case 'ALPA':
      case 'TANPA_KETERANGAN':
      case 'LEPAS_RADIUS':
        return AppColors.dangerRed;
      case 'IZIN':
      case 'SAKIT':
        return AppColors.primaryBlue;
      case 'BERLANGSUNG':
        return AppColors.primaryGreen;
      case 'TERJEDA':
        return Colors.amber.shade700;
      default:
        return AppColors.textSecondary;
    }
  }

  IconData _getStatusIcon(String? status) {
    switch ((status ?? '').toUpperCase()) {
      case 'HADIR_MEMENUHI':
        return Icons.verified_rounded;
      case 'HADIR_TIDAK_MEMENUHI':
      case 'SELESAI_TELAT':
        return Icons.check_circle_outline_rounded;
      case 'ALPA':
      case 'TANPA_KETERANGAN':
        return Icons.cancel_rounded;
      case 'LEPAS_RADIUS':
        return Icons.wrong_location_rounded;
      case 'IZIN':
        return Icons.event_note_rounded;
      case 'SAKIT':
        return Icons.local_hospital_rounded;
      case 'BERLANGSUNG':
        return Icons.radio_button_on_rounded;
      case 'TERJEDA':
        return Icons.pause_circle_rounded;
      default:
        return Icons.help_outline_rounded;
    }
  }

  String _getStatusLabel(String? status) {
    switch ((status ?? '').toUpperCase()) {
      case 'HADIR_MEMENUHI':
        return 'Hadir & Memenuhi Syarat';
      case 'HADIR_TIDAK_MEMENUHI':
        return 'Hadir & Tidak Memenuhi';
      case 'SELESAI_TELAT':
        return 'Selesai (Durasi Kurang)';
      case 'ALPA':
      case 'TANPA_KETERANGAN':
        return 'Tidak Hadir (Alpa)';
      case 'LEPAS_RADIUS':
        return 'Kehadiran Digagalkan';
      case 'IZIN':
        return 'Izin';
      case 'SAKIT':
        return 'Sakit';
      case 'BERLANGSUNG':
        return 'Sedang Berlangsung';
      case 'TERJEDA':
        return 'Dijeda';
      default:
        return status ?? '-';
    }
  }

  String _getKeteranganText(String? status) {
    switch ((status ?? '').toUpperCase()) {
      case 'HADIR_MEMENUHI':
        return 'Selamat! Anda berhasil menyelesaikan kegiatan dan durasi kehadiran Anda memenuhi syarat minimum yang ditetapkan.';
      case 'HADIR_TIDAK_MEMENUHI':
        return 'Anda hadir pada kegiatan ini, namun durasi kehadiran di zona kurang dari target minimum. Silakan konsultasikan dengan DPL Anda jika diperlukan.';
      case 'SELESAI_TELAT':
        return 'Anda menyelesaikan kegiatan namun durasi kehadiran di zona belum mencapai target minimum yang ditetapkan.';
      case 'ALPA':
      case 'TANPA_KETERANGAN':
        return 'Anda tidak tercatat hadir pada kegiatan ini. Jika ini adalah kekeliruan, segera hubungi DPL atau Ketua Kelompok Anda.';
      case 'LEPAS_RADIUS':
        return 'Kehadiran Anda digagalkan karena sistem mendeteksi Anda berada di luar radius zona kegiatan terlalu lama.';
      case 'IZIN':
        return 'Anda tercatat izin pada kegiatan ini. Status izin tidak dihitung sebagai pelanggaran kehadiran.';
      case 'SAKIT':
        return 'Anda tercatat sakit pada kegiatan ini. Status sakit tidak dihitung sebagai pelanggaran kehadiran.';
      case 'BERLANGSUNG':
        return 'Sesi kegiatan Anda saat ini masih aktif berlangsung.';
      case 'TERJEDA':
        return 'Sesi kegiatan Anda sedang dijeda. Silakan lanjutkan kembali dari halaman presensi.';
      default:
        return 'Status kehadiran Anda sedang diproses.';
    }
  }

  String _formatTime(String? isoString) {
    if (isoString == null) return '-';
    try {
      final dt = DateTime.parse(isoString).toLocal();
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m';
    } catch (_) {
      return '-';
    }
  }

  String _formatDate(String? isoString) {
    if (isoString == null) return '-';
    try {
      final dt = DateTime.parse(isoString).toLocal();
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      final dayName = days[dt.weekday - 1];
      final monthName = months[dt.month - 1];
      return '$dayName, ${dt.day} $monthName ${dt.year}';
    } catch (_) {
      return '-';
    }
  }

  String _formatMethod(String? method) {
    switch ((method ?? '').toUpperCase()) {
      case 'GPS':
        return 'GPS Tracking';
      case 'MANUAL':
        return 'Input Manual';
      case 'QR':
        return 'QR Code';
      default:
        return method ?? '-';
    }
  }

  // ─── Build ────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Detail Presensi'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
          : _historyData == null
              ? _buildEmpty()
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    final history = _historyData!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHeroStatusCard(history),
          const SizedBox(height: 12),
          _buildWaktuRow(history),
          const SizedBox(height: 12),
          _buildDurasiProgress(history),
          const SizedBox(height: 12),
          _buildStatGrid(history),
          const SizedBox(height: 12),
          _buildKeteranganStatus(history),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ─── Section 1: Hero Status Card ────────────────────────────

  Widget _buildHeroStatusCard(Map<String, dynamic> history) {
    final status = history['statusKehadiran'] as String?;
    final namaKegiatan = history['namaKegiatan'] as String? ?? 'Kegiatan KKN';
    final jamMasuk = history['jamMasuk'] as String?;
    final method = history['method'] as String?;
    final color = _getStatusColor(status);
    final icon = _getStatusIcon(status);
    final label = _getStatusLabel(status);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.12),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          // Top colored banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.08),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: color, size: 36),
                ),
                const SizedBox(height: 12),
                Text(
                  namaKegiatan,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Bottom meta info
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.textHint),
                const SizedBox(width: 6),
                Text(
                  _formatDate(jamMasuk),
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                if (method != null) ...[
                  const SizedBox(width: 16),
                  const Icon(Icons.gps_fixed_rounded, size: 14, color: AppColors.textHint),
                  const SizedBox(width: 6),
                  Text(
                    _formatMethod(method),
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Section 2: Waktu Masuk & Keluar ────────────────────────

  Widget _buildWaktuRow(Map<String, dynamic> history) {
    final jamMasuk = _formatTime(history['jamMasuk'] as String?);
    final jamPulang = _formatTime(history['jamPulang'] as String?);

    return Row(
      children: [
        Expanded(child: _buildWaktuCard('Jam Masuk', jamMasuk, Icons.login_rounded, const Color(0xFF3B82F6))),
        const SizedBox(width: 12),
        Expanded(child: _buildWaktuCard('Jam Keluar', jamPulang, Icons.logout_rounded, Colors.orange.shade700)),
      ],
    );
  }

  Widget _buildWaktuCard(String label, String time, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            time,
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: time == '-' ? AppColors.textHint : AppColors.textPrimary),
          ),
          Text('WIB', style: TextStyle(fontSize: 11, color: time == '-' ? AppColors.textHint : AppColors.textHint)),
        ],
      ),
    );
  }

  // ─── Section 3: Progress Bar Durasi ─────────────────────────

  Widget _buildDurasiProgress(Map<String, dynamic> history) {
    final aktualMenit = (history['durasiAktualMenit'] ?? 0) as num;
    final targetMenit = (history['durasiTargetMenit'] ?? 120) as num;
    final isMemenuhiDurasi = history['isMemenuhiDurasi'] == true;
    final ratio = targetMenit > 0 ? (aktualMenit / targetMenit).clamp(0.0, 1.0).toDouble() : 0.0;
    final persen = targetMenit > 0 ? ((aktualMenit / targetMenit) * 100).round() : 0;
    final progressColor = isMemenuhiDurasi ? AppColors.primaryGreen : Colors.orange.shade700;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.timer_rounded, size: 18, color: AppColors.textSecondary),
              const SizedBox(width: 8),
              const Text('Capaian Durasi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: progressColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$persen%',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: progressColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Animated progress bar
          AnimatedBuilder(
            animation: _progressAnimation,
            builder: (context, _) {
              return Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: ratio * _progressAnimation.value,
                      minHeight: 12,
                      backgroundColor: AppColors.border,
                      color: progressColor,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$aktualMenit menit dari $targetMenit menit target',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              Row(
                children: [
                  Icon(
                    isMemenuhiDurasi ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
                    size: 15,
                    color: progressColor,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isMemenuhiDurasi ? 'Terpenuhi' : 'Belum Memenuhi',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: progressColor),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Section 4: Grid Statistik ───────────────────────────────

  Widget _buildStatGrid(Map<String, dynamic> history) {
    final aktualMenit = (history['durasiAktualMenit'] ?? 0) as num;
    final targetMenit = (history['durasiTargetMenit'] ?? 120) as num;
    final method = _formatMethod(history['method'] as String?);
    final persen = targetMenit > 0 ? ((aktualMenit / targetMenit) * 100).round() : 0;
    final attendanceId = history['attendanceId'] as String? ?? '-';
    final shortId = attendanceId.length > 8 ? attendanceId.substring(0, 8).toUpperCase() : attendanceId.toUpperCase();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          // Header
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                Icon(Icons.bar_chart_rounded, size: 18, color: AppColors.textSecondary),
                SizedBox(width: 8),
                Text('Statistik Kegiatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: AppColors.border),
          // Grid 2x2
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _buildStatItem('Target Durasi', '$targetMenit menit', Icons.flag_rounded, AppColors.primaryBlue)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildStatItem('Aktual Durasi', '$aktualMenit menit', Icons.timer_outlined, AppColors.primaryGreen)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildStatItem('Metode Absen', method, Icons.gps_fixed_rounded, Colors.purple.shade400)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildStatItem('Capaian', '$persen%', Icons.percent_rounded, Colors.orange.shade600)),
                  ],
                ),
              ],
            ),
          ),
          // Footer: ID Presensi
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.backgroundCanvas,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
            ),
            child: Row(
              children: [
                const Icon(Icons.tag_rounded, size: 13, color: AppColors.textHint),
                const SizedBox(width: 4),
                Text('ID Presensi: $shortId...', style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  // ─── Section 5: Keterangan Status ───────────────────────────

  Widget _buildKeteranganStatus(Map<String, dynamic> history) {
    final status = history['statusKehadiran'] as String?;
    final color = _getStatusColor(status);
    final icon = _getStatusIcon(status);
    final keterangan = _getKeteranganText(status);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Keterangan', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                const SizedBox(height: 4),
                Text(keterangan, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Empty State ─────────────────────────────────────────────

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.border.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.assignment_late_outlined, size: 48, color: AppColors.textHint),
          ),
          const SizedBox(height: 16),
          const Text('Data Presensi Tidak Ditemukan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          const Text('Belum ada riwayat presensi untuk kegiatan ini.', style: TextStyle(fontSize: 13, color: AppColors.textHint)),
        ],
      ),
    );
  }
}
