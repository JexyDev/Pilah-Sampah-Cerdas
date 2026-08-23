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
  });
}

class RiwayatKknView extends ConsumerStatefulWidget {
  const RiwayatKknView({super.key});

  @override
  ConsumerState<RiwayatKknView> createState() => _RiwayatKknViewState();
}

class _RiwayatKknViewState extends ConsumerState<RiwayatKknView> {
  int _filterIndex = 0; // 0=Semua, 1=Aktivasi, 2=GPS

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('id_ID', null);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(riwayatKknControllerProvider.notifier).fetchHistory();
    });
  }

  List<KknHistoryLog> _getFilteredLogs(List<KknHistoryLog> logs) {
    return logs.where((log) {
      if (_filterIndex == 0) return true; // Semua
      if (_filterIndex == 1) return log.points == null || log.points == 0; // Non Poin
      if (_filterIndex == 2) return log.points != null && log.points! > 0; // Poin
      return true;
    }).toList();
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
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _filterTab('Semua', 0),
                const SizedBox(width: 8),
                _filterTab('Riwayat Non Poin', 1),
                const SizedBox(width: 8),
                _filterTab('Riwayat Poin', 2),
              ],
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    _filterIndex == 0 ? 'Semua Aktivitas' : _filterIndex == 1 ? 'Riwayat Aktivitas (Non Poin)' : 'Riwayat Perolehan Poin',
                    style: const TextStyle(
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

  Widget _filterTab(String label, int index) {
    final bool active = _filterIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _filterIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AppColors.primaryGreen : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: active ? null : Border.all(color: AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: active ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
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
      if (log.statusKehadiran == 'SELESAI_TELAT') {
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
                const SizedBox(height: 4),
                Text(
                  log.subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (log.statusKehadiran == 'SELESAI_TELAT') ...[
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
