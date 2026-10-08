import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/providers/repository_providers.dart';

class KknAttendanceHistoryView extends ConsumerStatefulWidget {
  final String scheduleId;
  final Map<String, dynamic>? fallbackData;

  const KknAttendanceHistoryView({
    super.key,
    required this.scheduleId,
    this.fallbackData,
  });

  @override
  ConsumerState<KknAttendanceHistoryView> createState() =>
      _KknAttendanceHistoryViewState();
}

class _KknAttendanceHistoryViewState
    extends ConsumerState<KknAttendanceHistoryView>
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
      duration: const Duration(milliseconds: 1000),
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
    if (widget.scheduleId.isEmpty) {
      if (mounted) {
        setState(() {
          _historyData = widget.fallbackData;
          _isLoading = false;
        });
        if (_historyData != null) {
          _progressAnimController.forward();
        }
      }
      return;
    }

    try {
      final repo = ref.read(kknRepositoryProvider);
      final history = await repo.getPresensiHistory(widget.scheduleId);
      if (mounted) {
        setState(() {
          _historyData = history ?? widget.fallbackData;
          _isLoading = false;
        });
        if (_historyData != null) {
          _progressAnimController.forward();
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _historyData = widget.fallbackData;
          _isLoading = false;
        });
        if (_historyData != null) {
          _progressAnimController.forward();
        }
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
        return const Color(0xFFD97706);
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
        return const Color(0xFFD97706);
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
        return Icons.warning_amber_rounded;
      case 'ALPA':
      case 'TANPA_KETERANGAN':
        return Icons.cancel_outlined;
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
        return 'Hadir Memenuhi Target';
      case 'HADIR_TIDAK_MEMENUHI':
        return 'Tidak Terpenuhi (Kurang Jam)';
      case 'SELESAI_TELAT':
        return 'Durasi Belum Memenuhi';
      case 'ALPA':
      case 'TANPA_KETERANGAN':
        return 'Tanpa Keterangan';
      case 'LEPAS_RADIUS':
        return 'Presensi Dibatalkan';
      case 'IZIN':
        return 'Izin Resmi';
      case 'SAKIT':
        return 'Sakit';
      case 'BERLANGSUNG':
        return 'Sedang Berlangsung';
      case 'TERJEDA':
        return 'Sesi Dijeda';
      default:
        return status ?? '-';
    }
  }

  String _getKeteranganText(String? status) {
    switch ((status ?? '').toUpperCase()) {
      case 'HADIR_MEMENUHI':
        return 'Selamat! Anda telah menyelesaikan kegiatan posko dengan durasi memenuhi ketentuan minimum (minimal 4 jam/240 menit). Poin kehadiran penuh tercatat.';
      case 'HADIR_TIDAK_MEMENUHI':
        return 'Kehadiran Anda tercatat di posko KKN, namun akumulasi durasi belum mencapai target minimal 4 jam (240 menit) atau sesi tidak diselesaikan dengan check-out.';
      case 'SELESAI_TELAT':
        return 'Sesi kegiatan posko telah selesai, namun total durasi berada di bawah batas minimum yang dipersyaratkan.';
      case 'ALPA':
      case 'TANPA_KETERANGAN':
        return 'Tidak ada catatan kehadiran posko pada tanggal ini. Status dicatat sebagai Tanpa Keterangan (0 poin). Apabila Anda hadir atau terdapat kendala sistem, segera konfirmasi ke DPL.';
      case 'LEPAS_RADIUS':
        return 'Presensi dibatalkan otomatis karena perangkat berada di luar batas radius posko melebihi toleransi waktu.';
      case 'IZIN':
        return 'Anda tercatat memiliki izin resmi pada kegiatan ini. Status izin tidak mengurangi poin kedisiplinan.';
      case 'SAKIT':
        return 'Anda tercatat sakit pada kegiatan ini sesuai konfirmasi keterangan yang disetujui.';
      case 'BERLANGSUNG':
        return 'Sesi kegiatan posko hari ini sedang berjalan aktif.';
      case 'TERJEDA':
        return 'Sesi kegiatan sedang dijeda sementara. Silakan lanjutkan kembali sebelum jam operasional posko berakhir.';
      default:
        return 'Status kehadiran sedang diproses oleh sistem.';
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
      const days = [
        'Senin',
        'Selasa',
        'Rabu',
        'Kamis',
        'Jumat',
        'Sabtu',
        'Minggu',
      ];
      const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];
      final dayName = days[dt.weekday - 1];
      final monthName = months[dt.month - 1];
      return '$dayName, ${dt.day} $monthName ${dt.year}';
    } catch (_) {
      return '-';
    }
  }

  String _formatMethod(String? method) {
    final m = (method ?? '').toUpperCase().trim();
    if (m.isEmpty) return 'Sistem';
    if (m.contains('GPS')) return 'Presensi GPS Posko';
    if (m.contains('QR')) return 'Pindai QR Posko';
    if (m.contains('MANUAL')) return 'Presensi Mandiri';
    if (m.contains('ALPA') || m.contains('AUTO')) {
      return 'Pencatatan Otomatis Sistem';
    }
    return m;
  }

  // ─── Build ────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Detail Presensi',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
        ),
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
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primaryGreen),
            )
          : _historyData == null
          ? _buildEmpty()
          : _buildContent(),
    );
  }

  Widget _buildContent() {
    final history = _historyData!;
    final status =
        (history['statusKehadiran'] ?? history['status'] ?? '').toString();
    final isAlpha =
        status.toUpperCase() == 'ALPA' ||
        status.toUpperCase() == 'TANPA_KETERANGAN';

    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        bottomInset + 48,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHeroStatusCard(history),
          const SizedBox(height: 12),
          _buildWaktuRow(history),
          if (!isAlpha) ...[
            const SizedBox(height: 12),
            _buildDurasiProgress(history),
          ],
          const SizedBox(height: 12),
          _buildStatGrid(history),
          const SizedBox(height: 12),
          _buildKeteranganStatus(history),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ─── Section 1: Hero Status Card ────────────────────────────

  Widget _buildHeroStatusCard(Map<String, dynamic> history) {
    final status =
        (history['statusKehadiran'] ?? history['status'] ?? '').toString();
    final namaKegiatan =
        history['namaKegiatan'] as String? ?? 'Kegiatan Posko KKN';
    final jamMasuk = history['jamMasuk'] as String?;
    final method = history['method'] as String?;
    final color = _getStatusColor(status);
    final icon = _getStatusIcon(status);
    final label = _getStatusLabel(status);
    final isAlpha =
        status.toUpperCase() == 'ALPA' ||
        status.toUpperCase() == 'TANPA_KETERANGAN';
    final isMemenuhi = status.toUpperCase() == 'HADIR_MEMENUHI';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: color.withValues(alpha: 0.2)),
                      ),
                      child: Icon(icon, color: color, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            namaKegiatan,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.calendar_today_rounded,
                                size: 13,
                                color: AppColors.textHint,
                              ),
                              const SizedBox(width: 5),
                              Expanded(
                                child: Text(
                                  _formatDate(jamMasuk),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                  maxLines: 1,
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
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: color.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(icon, size: 14, color: color),
                      const SizedBox(width: 6),
                      Text(
                        label,
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.tune_rounded,
                      size: 14,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      _formatMethod(method),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: isAlpha
                        ? AppColors.dangerRed.withValues(alpha: 0.08)
                        : (isMemenuhi
                            ? AppColors.primaryGreen.withValues(alpha: 0.08)
                            : const Color(0xFFFEF3C7)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isAlpha
                        ? '0 Poin Kehadiran'
                        : (isMemenuhi ? '+7 Poin (Penuh)' : '+4 Poin (Dasar)'),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isAlpha
                          ? AppColors.dangerRed
                          : (isMemenuhi
                              ? AppColors.primaryGreen
                              : const Color(0xFFD97706)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Section 2: Waktu Masuk & Keluar ────────────────────────

  Widget _buildWaktuRow(Map<String, dynamic> history) {
    final status =
        (history['statusKehadiran'] ?? history['status'] ?? '').toString();
    final isAlpha =
        status.toUpperCase() == 'ALPA' ||
        status.toUpperCase() == 'TANPA_KETERANGAN';

    if (isAlpha) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.2)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.dangerRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.event_busy_rounded,
                size: 20,
                color: AppColors.dangerRed,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tidak Ada Presensi Masuk & Keluar',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.dangerRed,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Sistem tidak menemukan rekaman waktu check-in maupun check-out pada kegiatan ini.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    final jamMasuk = _formatTime(history['jamMasuk'] as String?);
    final jamPulang = _formatTime(history['jamPulang'] as String?);
    final isTanpaCheckOut = jamPulang == '-';

    return Row(
      children: [
        Expanded(
          child: _buildWaktuCard(
            label: 'Jam Masuk',
            time: jamMasuk != '-' ? '$jamMasuk WIB' : '—',
            subtitle: jamMasuk != '-' ? 'Check-in posko' : 'Tidak ada catatan',
            icon: Icons.login_rounded,
            color: const Color(0xFF0084DC),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildWaktuCard(
            label: 'Jam Keluar',
            time: isTanpaCheckOut ? '—' : '$jamPulang WIB',
            subtitle: isTanpaCheckOut ? 'Tanpa Check-Out' : 'Check-out posko',
            icon: Icons.logout_rounded,
            color: isTanpaCheckOut
                ? const Color(0xFFD97706)
                : AppColors.primaryGreen,
            isWarning: isTanpaCheckOut,
          ),
        ),
      ],
    );
  }

  Widget _buildWaktuCard({
    required String label,
    required String time,
    required String subtitle,
    required IconData icon,
    required Color color,
    bool isWarning = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isWarning
              ? const Color(0xFFD97706).withValues(alpha: 0.3)
              : AppColors.border,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
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
                child: Icon(icon, size: 15, color: color),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            time,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: isWarning
                  ? const Color(0xFFD97706)
                  : (time == '—' ? AppColors.textHint : AppColors.textPrimary),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isWarning ? FontWeight.w600 : FontWeight.normal,
              color: isWarning ? const Color(0xFFD97706) : AppColors.textHint,
            ),
          ),
        ],
      ),
    );
  }

  // ─── Section 3: Progress Bar Durasi ─────────────────────────

  Widget _buildDurasiProgress(Map<String, dynamic> history) {
    final aktualMenit =
        (history['durasiAktualMenit'] ?? history['durationMinutes'] ?? 0)
            as num;
    final targetMenit =
        (history['durasiTargetMenit'] ?? history['targetMinutes'] ?? 240)
            as num;
    final isMemenuhiDurasi =
        history['isMemenuhiDurasi'] == true ||
        (aktualMenit >= targetMenit && targetMenit > 0);
    final ratio = targetMenit > 0
        ? (aktualMenit / targetMenit).clamp(0.0, 1.0).toDouble()
        : 0.0;
    final persen = targetMenit > 0
        ? ((aktualMenit / targetMenit) * 100).round()
        : 0;
    final progressColor = isMemenuhiDurasi
        ? AppColors.primaryGreen
        : const Color(0xFFD97706);
    final sisaMenit = (targetMenit - aktualMenit).clamp(0, targetMenit).round();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.timer_outlined,
                size: 17,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Capaian Durasi Posko',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: progressColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$persen%',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: progressColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AnimatedBuilder(
            animation: _progressAnimation,
            builder: (context, _) {
              return ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: ratio * _progressAnimation.value,
                  minHeight: 10,
                  backgroundColor: const Color(0xFFF1F5F9),
                  color: progressColor,
                ),
              );
            },
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  '$aktualMenit menit tercatat dari target $targetMenit menit (4 jam)',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isMemenuhiDurasi
                        ? Icons.check_circle_rounded
                        : Icons.warning_amber_rounded,
                    size: 14,
                    color: progressColor,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isMemenuhiDurasi
                        ? 'Target Terpenuhi'
                        : 'Kurang $sisaMenit mnt',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: progressColor,
                    ),
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
    final status =
        (history['statusKehadiran'] ?? history['status'] ?? '').toString();
    final isAlpha =
        status.toUpperCase() == 'ALPA' ||
        status.toUpperCase() == 'TANPA_KETERANGAN';
    final aktualMenit =
        (history['durasiAktualMenit'] ?? history['durationMinutes'] ?? 0)
            as num;
    final targetMenit =
        (history['durasiTargetMenit'] ?? history['targetMinutes'] ?? 240)
            as num;
    final durasiJedaMenit = (history['durasiJedaMenit'] ?? 0) as num;
    final jedaFormatted =
        history['durasiJedaFormatted'] as String? ?? '${durasiJedaMenit}m';
    final isMemenuhi = status.toUpperCase() == 'HADIR_MEMENUHI';
    final method = _formatMethod(history['method'] as String?);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Row(
              children: [
                Icon(
                  Icons.insert_chart_outlined_rounded,
                  size: 17,
                  color: AppColors.textSecondary,
                ),
                SizedBox(width: 8),
                Text(
                  'Rincian Indikator Kehadiran',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.border),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildStatItem(
                        label: 'Target Minimal',
                        value: '$targetMenit Menit (4 Jam)',
                        icon: Icons.flag_outlined,
                        color: const Color(0xFF0084DC),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatItem(
                        label: isAlpha ? 'Status Presensi' : 'Durasi Tercatat',
                        value: isAlpha ? 'Tidak Hadir' : '$aktualMenit Menit',
                        icon: Icons.timer_outlined,
                        color: isAlpha
                            ? AppColors.dangerRed
                            : (isMemenuhi
                                ? AppColors.primaryGreen
                                : const Color(0xFFD97706)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatItem(
                        label: 'Metode Presensi',
                        value: method,
                        icon: Icons.my_location_rounded,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildStatItem(
                        label: 'Durasi Jeda',
                        value: isAlpha
                            ? '—'
                            : (durasiJedaMenit > 0 ? jedaFormatted : '0 Menit'),
                        icon: Icons.pause_circle_outline_rounded,
                        color: durasiJedaMenit > 0
                            ? const Color(0xFFD97706)
                            : AppColors.textSecondary,
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

  Widget _buildStatItem({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 15, color: color),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color:
                  color == const Color(0xFF64748B) ||
                      color == AppColors.textSecondary
                  ? AppColors.textPrimary
                  : color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // ─── Section 5: Keterangan Status ───────────────────────────

  Widget _buildKeteranganStatus(Map<String, dynamic> history) {
    final status =
        (history['statusKehadiran'] ?? history['status'] ?? '').toString();
    final color = _getStatusColor(status);
    final icon = _getStatusIcon(status);
    final keterangan = _getKeteranganText(status);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Keterangan & Evaluasi Kehadiran',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  keterangan,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
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
            child: const Icon(
              Icons.assignment_late_outlined,
              size: 48,
              color: AppColors.textHint,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Data Presensi Tidak Ditemukan',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Belum ada riwayat presensi untuk kegiatan ini.',
            style: TextStyle(fontSize: 13, color: AppColors.textHint),
          ),
        ],
      ),
    );
  }
}
