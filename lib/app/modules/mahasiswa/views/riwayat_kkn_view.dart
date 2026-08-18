import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/riwayat_kkn_controller.dart';

// Model
enum KknHistoryType { aktivasi, gps }

class KknHistoryLog {
  final String title;
  final String subtitle;
  final DateTime timestamp;
  final KknHistoryType type;
  final int? points; // For aktivasi
  final bool? isGpsActive; // For gps

  KknHistoryLog({
    required this.title,
    required this.subtitle,
    required this.timestamp,
    required this.type,
    this.points,
    this.isGpsActive,
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
    if (_filterIndex == 1) {
      return logs.where((l) => l.type == KknHistoryType.aktivasi).toList();
    } else if (_filterIndex == 2) {
      return logs.where((l) => l.type == KknHistoryType.gps).toList();
    }
    return logs;
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(riwayatKknControllerProvider);
    final filteredLogs = _getFilteredLogs(state.logs);
    final totalPoints = state.logs.fold<int>(0, (sum, log) => sum + (log.points ?? 0));

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Riwayat Aktivitas KKN', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: Colors.white)),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: Column(
        children: [
          // Total Points Banner
          Container(
            color: AppColors.primaryGreen,
            width: double.infinity,
            padding: const EdgeInsets.only(bottom: 24, left: 24, right: 24),
            child: Column(
              children: [
                const Text('Total Poin Terkumpul', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 4),
                Text(
                  '$totalPoints',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          // Filter Tabs
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _filterTab('Semua', 0),
                const SizedBox(width: 8),
                _filterTab('Aktivasi Warga', 1),
                const SizedBox(width: 8),
                _filterTab('Ping Lokasi', 2),
              ],
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
                              padding: const EdgeInsets.all(16),
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
    final isAktivasi = log.type == KknHistoryType.aktivasi;
    
    IconData iconData;
    Color iconColor;
    Color bgColor;
    
    if (isAktivasi) {
      iconData = Icons.qr_code_scanner_rounded;
      iconColor = AppColors.success;
      bgColor = AppColors.success.withValues(alpha: 0.1);
    } else {
      iconData = Icons.location_on_rounded;
      iconColor = (log.isGpsActive == true) ? AppColors.primaryBlue : AppColors.dangerRed;
      bgColor = (log.isGpsActive == true) ? AppColors.primaryBlue.withValues(alpha: 0.1) : AppColors.dangerRed.withValues(alpha: 0.1);
    }

    return Container(
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
          if (isAktivasi && log.points != null)
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
