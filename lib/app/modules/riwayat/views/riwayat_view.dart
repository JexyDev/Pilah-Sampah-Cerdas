import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/waste_log_entity.dart';
import '../../../data/models/bin_entity.dart';
import '../../../data/models/notification_entity.dart';
import '../../riwayat/controllers/riwayat_controller.dart';
import '../../notifikasi/controllers/warga_notifikasi_controller.dart';
import '../../shared/widgets/skeleton_loading.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/weight_text.dart';
import '../../shared/controllers/connectivity_controller.dart';
import 'pemilahan_monitoring_dashboard_view.dart';

class RiwayatItemData {
  final DateTime date;
  final WasteLogEntity? wasteLog;
  final NotificationEntity? notif;
  RiwayatItemData({required this.date, this.wasteLog, this.notif});
}

/// Halaman riwayat pemilahan — sesuai desain:
/// Filter tabs, summary kg organik+anorganik, list TERVALIDASI.
class RiwayatView extends ConsumerStatefulWidget {
  const RiwayatView({super.key});

  @override
  ConsumerState<RiwayatView> createState() => _RiwayatViewState();
}

class _RiwayatViewState extends ConsumerState<RiwayatView> {
  int _categoryFilterIndex = 0; // 0=Semua, 1=Organik, 2=Anorganik, 3=Pengajuan, 4=Info
  int _timeFilterIndex = 0; // 0=Semua Waktu, 1=Hari Ini, 2=Minggu Ini, 3=Bulan Ini

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return const PemilahanMonitoringDashboardView();
    }
    final logsAsync = ref.watch(wasteLogsProvider);
    final notifsAsync = ref.watch(wargaNotificationsProvider);

    // Combine data if both are ready
    List<RiwayatItemData>? combinedData;
    bool isLoading = logsAsync.isLoading || notifsAsync.isLoading;
    bool hasError = logsAsync.hasError || notifsAsync.hasError;

    if (logsAsync.value != null && notifsAsync.value != null) {
      combinedData = [];
      for (var l in logsAsync.value!) {
        combinedData.add(RiwayatItemData(date: l.createdAt.toLocal(), wasteLog: l));
      }
      for (var n in notifsAsync.value!) {
        final type = n.type.toUpperCase();
        if (!type.contains('POIN') && !type.contains('PUNISHMENT')) {
          DateTime dt;
          try {
            dt = DateTime.parse(n.time).toLocal();
          } catch (_) {
            dt = DateTime.now();
          }
          combinedData.add(RiwayatItemData(date: dt, notif: n));
        }
      }
      combinedData.sort((a, b) => b.date.compareTo(a.date));
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        title: const Text('Riwayat Pemilahan', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18, color: AppColors.textPrimary)),
      ),
      body: Column(
        children: [
          // Header Bar Filter
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                // Baris 1: Tab Filter Kategori
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _filterTab('Semua', 0),
                      const SizedBox(width: 8),
                      _filterTab('Organik', 1),
                      const SizedBox(width: 8),
                      _filterTab('Anorganik', 2),
                      const SizedBox(width: 8),
                      _filterTab('Pengajuan', 3),
                      const SizedBox(width: 8),
                      _filterTab('Info', 4),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Baris 2: Filter Waktu
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Periode Riwayat',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.backgroundCanvas,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<int>(
                          value: _timeFilterIndex,
                          isDense: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primaryGreen, size: 20),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          items: const [
                            DropdownMenuItem(value: 0, child: Text('Semua Waktu')),
                            DropdownMenuItem(value: 1, child: Text('Hari Ini')),
                            DropdownMenuItem(value: 2, child: Text('Minggu Ini')),
                            DropdownMenuItem(value: 3, child: Text('Bulan Ini')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _timeFilterIndex = val);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                final isOnline = ref.read(isOnlineProvider);
                if (!isOnline) {
                  ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Anda sedang offline'),
                      backgroundColor: AppColors.dangerRed,
                      duration: Duration(seconds: 2),
                    ),
                  );
                  return;
                }
                ref.invalidate(wasteLogsProvider);
                ref.invalidate(wargaNotificationsProvider);
                await Future.delayed(const Duration(milliseconds: 500));
              },
              color: AppColors.primaryGreen,
              child: hasError
                  ? EmptyState(
                      message: 'Gagal memuat riwayat. Cek koneksi Anda.',
                      icon: Icons.error_outline_rounded,
                      buttonText: 'Coba Lagi',
                      onButtonPressed: () {
                        ref.invalidate(wasteLogsProvider);
                        ref.invalidate(wargaNotificationsProvider);
                      },
                    )
                  : isLoading || combinedData == null
                      ? ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: 4,
                          itemBuilder: (_, __) => const Padding(
                            padding: EdgeInsets.only(bottom: 12),
                            child: SkeletonLoading(
                              height: 80,
                              width: double.infinity,
                              borderRadius: BorderRadius.all(Radius.circular(12)),
                            ),
                          ),
                        )
                      : (() {
                          final filtered = _applyFilter(combinedData!);
                          return filtered.isEmpty
                              ? _buildEmpty()
                              : _buildContent(filtered);
                        })(),
            ),
          ),
        ],
      ),
    );
  }

  List<RiwayatItemData> _applyFilter(List<RiwayatItemData> items) {
    List<RiwayatItemData> result = List.from(items);

    // 1. Filter Kategori
    if (_categoryFilterIndex == 1) { // Organik
      result = result.where((l) => l.wasteLog != null && l.wasteLog!.wasteType == WasteType.organic).toList();
    } else if (_categoryFilterIndex == 2) { // Anorganik
      result = result.where((l) => l.wasteLog != null && l.wasteLog!.wasteType == WasteType.nonOrganic).toList();
    } else if (_categoryFilterIndex == 3) { // Pengajuan
      result = result.where((l) {
        if (l.notif == null) return false;
        final typeUpper = l.notif!.type.toUpperCase();
        final titleLower = l.notif!.title.toLowerCase();
        return typeUpper.contains('PENGAJUAN') || typeUpper.contains('PENGOSONGAN') || typeUpper.contains('RESET') || titleLower.contains('pengajuan') || titleLower.contains('pengosongan');
      }).toList();
    } else if (_categoryFilterIndex == 4) { // Info / Lainnya
      result = result.where((l) {
        if (l.notif == null) return false;
        final typeUpper = l.notif!.type.toUpperCase();
        final titleLower = l.notif!.title.toLowerCase();
        return !(typeUpper.contains('PENGAJUAN') || typeUpper.contains('PENGOSONGAN') || typeUpper.contains('RESET') || titleLower.contains('pengajuan') || titleLower.contains('pengosongan'));
      }).toList();
    }

    // 2. Filter Waktu (Dropdown)
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    if (_timeFilterIndex == 1) {
      // Hari Ini
      result = result.where((l) {
        return l.date.year == now.year && l.date.month == now.month && l.date.day == now.day;
      }).toList();
    } else if (_timeFilterIndex == 2) {
      // Minggu Ini
      final weekStart = todayStart.subtract(Duration(days: now.weekday - 1));
      result = result.where((l) {
        return !l.date.isBefore(weekStart);
      }).toList();
    } else if (_timeFilterIndex == 3) {
      // Bulan Ini
      result = result.where((l) {
        return l.date.month == now.month && l.date.year == now.year;
      }).toList();
    }

    return result;
  }

  Widget _filterTab(String label, int index) {
    final bool active = _categoryFilterIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _categoryFilterIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: active ? AppColors.primaryGreen : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? AppColors.primaryGreen : AppColors.border,
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: AppColors.primaryGreen.withValues(alpha: 0.25),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildContent(List<RiwayatItemData> items) {
    // Group by date label
    final Map<String, List<RiwayatItemData>> grouped = {};
    final now = DateTime.now();
    for (final item in items) {
      final String key = _groupLabel(item.date, now);
      grouped.putIfAbsent(key, () => []).add(item);
    }

    final List<dynamic> flatList = [];
    flatList.add('SUMMARY');
    for (final entry in grouped.entries) {
      flatList.add(entry.key);
      flatList.addAll(entry.value);
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80, top: 16),
      itemCount: flatList.length,
      itemBuilder: (context, index) {
        final item = flatList[index];

        if (item == 'SUMMARY') {
          return const Column(
            children: [
              _SummaryCard(),
              SizedBox(height: 16),
            ],
          );
        } else if (item is String) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8, top: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  item.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          );
        } else if (item is RiwayatItemData) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: item.wasteLog != null 
                ? _RiwayatItem(log: item.wasteLog!)
                : _NotificationHistoryItem(notif: item.notif!),
          );
        }
        return const SizedBox.shrink();
      },
    );
  }

  String _groupLabel(DateTime date, DateTime now) {
    if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day) {
      return 'Terbaru';
    }
    final yesterday = now.subtract(const Duration(days: 1));
    if (date.year == yesterday.year &&
        date.month == yesterday.month &&
        date.day == yesterday.day) {
      return 'Kemarin';
    }
    return DateFormat('d MMMM yyyy', 'id_ID').format(date);
  }

  Widget _buildEmpty() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        SizedBox(height: 80),
        EmptyState(
          message: 'Belum ada riwayat pemilahan yang sesuai filter.',
          icon: Icons.history_rounded,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard();

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, _) {
        final logsAsync = ref.watch(wasteLogsProvider);
        return logsAsync.when(
          data: (logs) {
            double org = 0;
            double anorg = 0;
            for (var l in logs) {
              if (l.wasteType == WasteType.organic) {
                org += l.weightKg;
              } else {
                anorg += l.weightKg;
              }
            }
            return Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildSummaryItem('Organik', org, AppColors.organicColor),
                  ),
                  Container(width: 1, height: 40, color: AppColors.border),
                  Expanded(
                    child: _buildSummaryItem('Anorganik', anorg, AppColors.nonOrganicColor),
                  ),
                ],
              ),
            );
          },
          loading: () => const Padding(
            padding: EdgeInsets.all(16.0),
            child: SkeletonLoading(height: 80, width: double.infinity, borderRadius: BorderRadius.all(Radius.circular(16))),
          ),
          error: (_, __) => const SizedBox.shrink(),
        );
      },
    );
  }

  Widget _buildSummaryItem(String label, double weight, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              weight.toStringAsFixed(1),
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color),
            ),
            const SizedBox(width: 4),
            const Padding(
              padding: EdgeInsets.only(bottom: 3),
              child: Text('kg', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            ),
          ],
        )
      ],
    );
  }
}

class _RiwayatItem extends ConsumerWidget {
  const _RiwayatItem({required this.log});
  final WasteLogEntity log;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool isOrganic = log.wasteType == WasteType.organic;
    final Color color = isOrganic
        ? AppColors.organicColor
        : AppColors.nonOrganicColor;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Image.asset('assets/icons/recycle-bin.png', color: color, width: 24, height: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOrganic ? 'Sampah Organik' : 'Sampah Anorganik',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      '${log.wasteType.displayName} • ',
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    ),
                    WeightText(
                      log.weightKg,
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(
                      Icons.schedule_rounded,
                      size: 13,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat('HH:mm', 'id_ID').format(log.createdAt.toLocal()),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textHint,
                        fontWeight: FontWeight.w500,
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
}

class _NotificationHistoryItem extends StatelessWidget {
  const _NotificationHistoryItem({required this.notif});
  final NotificationEntity notif;

  @override
  Widget build(BuildContext context) {
    final isPengajuan = notif.type.toUpperCase().contains('PENGAJUAN') || notif.type.toUpperCase().contains('RESET');
    final color = isPengajuan ? AppColors.primaryBlue : AppColors.textSecondary;
    final icon = isPengajuan ? Icons.mark_email_unread_rounded : Icons.info_rounded;
    DateTime dt = notif.createdAt.toLocal();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.5),
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
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notif.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  notif.desc,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.schedule_rounded,
                      size: 13,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat('HH:mm', 'id_ID').format(dt),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textHint,
                        fontWeight: FontWeight.w500,
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
}
