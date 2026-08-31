import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../controllers/riwayat_kkn_controller.dart';

// Model
enum KknHistoryType { aktivasi, gps, izin, laporan }

class KknHistoryLog {
  final String title;
  final String subtitle;
  final DateTime timestamp;
  final KknHistoryType type;
  final int? points; // For aktivasi
  final bool? isGpsActive; // For gps
  final String? statusKehadiran;
  final String? durationFormatted;
  final String? scheduleId;
  final bool? isMemenuhiDurasi;
  final String? statusDisplay;
  final int? durasiAktualMenit;
  final int? durasiTargetMenit;
  final Map<String, dynamic>? rawData;

  KknHistoryLog({
    required this.title,
    required this.subtitle,
    required this.timestamp,
    required this.type,
    this.points,
    this.isGpsActive,
    this.statusKehadiran,
    this.durationFormatted,
    this.scheduleId,
    this.isMemenuhiDurasi,
    this.statusDisplay,
    this.durasiAktualMenit,
    this.durasiTargetMenit,
    this.rawData,
  });
}

class RiwayatKknView extends ConsumerStatefulWidget {
  const RiwayatKknView({super.key});

  @override
  ConsumerState<RiwayatKknView> createState() => _RiwayatKknViewState();
}

class _RiwayatKknViewState extends ConsumerState<RiwayatKknView> {
  @override
  void initState() {
    super.initState();
    initializeDateFormatting('id_ID', null);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(riwayatKknControllerProvider.notifier).fetchHistory();
    });
  }

  List<KknHistoryLog> _getFilteredLogs(List<KknHistoryLog> logs) {
    return logs.where((log) => log.points == null || log.points == 0 || log.type == KknHistoryType.gps).toList();
  }



  @override
  Widget build(BuildContext context) {
    final state = ref.watch(riwayatKknControllerProvider);
    final filteredLogs = _getFilteredLogs(state.logs);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Riwayat Aktivitas KKN'),
      ),
      body: Column(
        children: [

          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Aktivitas', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      const SizedBox(height: 4),
                      Text(
                        '${state.logs.length} Aktivitas',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.primaryGreen.withValues(alpha: 0.1), shape: BoxShape.circle),
                  child: const Icon(Icons.history_rounded, color: AppColors.primaryGreen, size: 28),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(left: 16, right: 16, top: 24, bottom: 8),
                  child: Text(
                    'Riwayat Aktivitas',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                Expanded(
                  child: state.isLoading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen))
                      : state.errorMessage != null
                          ? Center(child: Text(state.errorMessage!, style: const TextStyle(color: AppColors.dangerRed)))
                          : filteredLogs.isEmpty
                              ? _buildEmpty()
                              : RefreshIndicator(
                                  color: AppColors.primaryGreen,
                                  onRefresh: () => ref.read(riwayatKknControllerProvider.notifier).refresh(),
                                  child: ListView.separated(
                                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                                    itemCount: filteredLogs.length,
                                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                                    itemBuilder: (context, index) {
                                      final log = filteredLogs[index];
                                      return _buildLogCard(log);
                                    },
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

  String _formatSubtitle(String subtitle) {
    if (subtitle == 'MENUNGGU_VERIFIKASI_DPL') return '⏳ Menunggu Verifikasi DPL';
    if (subtitle == 'DISETUJUI') return '✅ Disetujui';
    if (subtitle == 'DITOLAK') return '❌ Ditolak';
    if (subtitle == 'MENUNGGU_VERIFIKASI_KETUA') return '⏳ Menunggu Verifikasi';
    // Replace underscores with spaces for any other generic status
    if (subtitle.contains('_')) {
      return subtitle.replaceAll('_', ' ');
    }
    return subtitle;
  }

  Widget _buildLogCard(KknHistoryLog log) {
    final hasPoints = log.points != null;
    
    IconData iconData;
    Color iconColor;
    Color bgColor;
    
    if (log.type == KknHistoryType.aktivasi) {
      iconData = Icons.person_add_alt_1_rounded;
      iconColor = AppColors.success;
      bgColor = AppColors.success.withValues(alpha: 0.1);
    } else if (log.type == KknHistoryType.laporan) {
      iconData = Icons.assignment_turned_in_rounded;
      iconColor = AppColors.primaryGreen;
      bgColor = AppColors.primaryGreen.withValues(alpha: 0.1);
    } else if (log.type == KknHistoryType.gps) {
      iconData = Icons.location_on_rounded;
      if (log.statusKehadiran == 'HADIR_TIDAK_MEMENUHI' || log.isMemenuhiDurasi == false) {
        iconColor = Colors.orange.shade700;
        bgColor = Colors.orange.shade700.withValues(alpha: 0.1);
      } else if (log.statusKehadiran == 'SELESAI_TELAT') {
        iconColor = Colors.deepOrange;
        bgColor = Colors.deepOrange.withValues(alpha: 0.1);
      } else if (log.statusKehadiran == 'LEPAS_RADIUS' || log.statusKehadiran == 'ALPA' || log.statusKehadiran == 'TANPA_KETERANGAN' || log.isGpsActive == false) {
        iconColor = AppColors.dangerRed;
        bgColor = AppColors.dangerRed.withValues(alpha: 0.1);
      } else {
        iconColor = AppColors.primaryGreen;
        bgColor = AppColors.primaryGreen.withValues(alpha: 0.1);
      }
    } else {
      iconData = Icons.assignment_rounded;
      if (log.isGpsActive == true) { // approved
        iconColor = AppColors.success;
        bgColor = AppColors.success.withValues(alpha: 0.1);
      } else if (log.isGpsActive == false) { // rejected
        iconColor = AppColors.dangerRed;
        bgColor = AppColors.dangerRed.withValues(alpha: 0.1);
      } else { // pending
        iconColor = AppColors.warningOrange;
        bgColor = AppColors.warningOrange.withValues(alpha: 0.1);
      }
    }

    return GestureDetector(
      onTap: () {
        if (log.type == KknHistoryType.gps && log.scheduleId != null) {
          Navigator.pushNamed(
            context,
            AppRoutes.kknAttendanceHistory,
            arguments: {'scheduleId': log.scheduleId},
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(iconData, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  log.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (log.type == KknHistoryType.laporan && (log.statusKehadiran == 'BELUM_DISETUJUI' || log.statusKehadiran == 'MENUNGGU_VERIFIKASI_DPL'))
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: InkWell(
                      onTap: () {
                        if (log.rawData != null) {
                          Navigator.pushNamed(
                            context,
                            AppRoutes.inputLogbookKkn,
                            arguments: log.rawData,
                          ).then((_) => ref.refresh(riwayatKknControllerProvider.notifier).refresh());
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.edit_rounded, size: 14, color: AppColors.primaryGreen),
                            SizedBox(width: 4),
                            Text('Edit Logbook', style: TextStyle(fontSize: 11, color: AppColors.primaryGreen, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 4),
                Text(
                  _formatSubtitle(log.subtitle),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (log.statusKehadiran == 'HADIR_MEMENUHI' || log.isMemenuhiDurasi == true) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      log.statusDisplay ?? 'Hadir & Memenuhi',
                      style: const TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Durasi kehadiran Anda memenuhi syarat minimal.',
                    style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                  ),
                ] else if (log.statusKehadiran == 'HADIR_TIDAK_MEMENUHI' || log.isMemenuhiDurasi == false) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade700.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      log.statusDisplay ?? 'Hadir & Tidak Memenuhi',
                      style: TextStyle(color: Colors.orange.shade700, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Durasi kehadiran kurang dari durasi minimal kegiatan.',
                    style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                  ),
                ] else if (log.statusKehadiran == 'SELESAI_TELAT') ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.deepOrange.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Selesai (Durasi Kurang)${log.durationFormatted != null ? ' - ${log.durationFormatted}' : ''}',
                      style: const TextStyle(color: Colors.deepOrange, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Text(
                  DateFormat('dd MMM yyyy, HH:mm', 'id_ID').format(log.timestamp),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textHint,
                  ),
                ),
              ],
            ),
          ),
          if (hasPoints)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.warningOrange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.stars_rounded, color: AppColors.warningOrange, size: 14),
                  const SizedBox(width: 4),
                  Text(
                    '+${log.points}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.warningOrange,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
      ),
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history_rounded, size: 64, color: AppColors.textHint),
          SizedBox(height: 16),
          Text(
            'Belum ada riwayat aktivitas',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
