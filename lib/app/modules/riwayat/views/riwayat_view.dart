import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/waste_log_entity.dart';
import '../../../data/models/bin_entity.dart';
import '../../riwayat/controllers/riwayat_controller.dart';
import '../../shared/widgets/skeleton_loading.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/weight_text.dart';
import '../../shared/controllers/connectivity_controller.dart';
import '../../auth/controllers/auth_controller.dart';

/// Halaman riwayat pemilahan — sesuai desain:
/// Filter tabs, summary kg organik+anorganik, list TERVALIDASI.
class RiwayatView extends ConsumerStatefulWidget {
  const RiwayatView({super.key});

  @override
  ConsumerState<RiwayatView> createState() => _RiwayatViewState();
}

class _RiwayatViewState extends ConsumerState<RiwayatView> {
  int _categoryFilterIndex = 0; // 0=Semua, 1=Organik, 2=Non-Organik
  int _timeFilterIndex = 0; // 0=Semua Waktu, 1=Hari Ini, 2=Minggu Ini, 3=Bulan Ini

  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(wasteLogsProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(title: const Text('Riwayat Pemilahan')),
      body: Column(
        children: [
          // Filter Tabs (Seamless canvas background)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
            child: Row(
              children: [
                _filterTab('Semua', 0),
                const SizedBox(width: 8),
                _filterTab('Organik', 1),
                const SizedBox(width: 8),
                _filterTab('Non-Organik', 2),
              ],
            ),
          ),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                final isOnline = ref.read(isOnlineProvider);
                if (!isOnline) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Anda sedang offline'),
                      backgroundColor: AppColors.dangerRed,
                      duration: Duration(seconds: 2),
                    ),
                  );
                  return;
                }
                ref.invalidate(wasteLogsProvider);
                await Future.delayed(const Duration(milliseconds: 500));
              },
              color: AppColors.primaryGreen,
              child: logsAsync.when(
                data: (logs) {
                  final filtered = _applyFilter(logs);
                  return filtered.isEmpty
                      ? _buildEmpty()
                      : _buildContent(filtered);
                },
                loading: () => ListView.builder(
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
                ),
                error: (_, __) => EmptyState(
                  message: 'Gagal memuat riwayat. Cek koneksi Anda.',
                  icon: Icons.error_outline_rounded,
                  buttonText: 'Coba Lagi',
                  onButtonPressed: () => ref.invalidate(wasteLogsProvider),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<WasteLogEntity> _applyFilter(List<WasteLogEntity> logs) {
    List<WasteLogEntity> result = logs;

    // 1. Filter Kategori
    if (_categoryFilterIndex == 1) {
      result = result.where((l) => l.wasteType == WasteType.organic).toList();
    } else if (_categoryFilterIndex == 2) {
      result = result.where((l) => l.wasteType == WasteType.nonOrganic).toList();
    }

    // 2. Filter Waktu (Dropdown)
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    if (_timeFilterIndex == 1) {
      // Hari Ini
      result = result.where((l) => l.createdAt.toLocal().isAfter(todayStart)).toList();
    } else if (_timeFilterIndex == 2) {
      // Minggu Ini
      final weekStart = todayStart.subtract(Duration(days: now.weekday - 1));
      result = result.where((l) => l.createdAt.toLocal().isAfter(weekStart)).toList();
    } else if (_timeFilterIndex == 3) {
      // Bulan Ini
      result = result.where((l) {
        final local = l.createdAt.toLocal();
        return local.month == now.month && local.year == now.year;
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

  Widget _buildContent(List<WasteLogEntity> logs) {
    // Hitung total kg
    double organicKg = 0;
    double nonOrganicKg = 0;
    for (final log in logs) {
      if (log.wasteType == WasteType.organic) {
        organicKg += log.weightKg;
      } else {
        nonOrganicKg += log.weightKg;
      }
    }

    // Group by date label
    final Map<String, List<WasteLogEntity>> grouped = {};
    final now = DateTime.now();
    for (final log in logs) {
      final String key = _groupLabel(log.createdAt.toLocal(), now);
      grouped.putIfAbsent(key, () => []).add(log);
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Summary row
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                icon: Icons.delete_rounded,
                iconColor: AppColors.organicColor,
                bgColor: AppColors.organicColor.withValues(alpha: 0.12),
                label: 'Organik',
                valueWidget: WeightText(
                  organicKg,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                value: '',
                valueColor: AppColors.organicColor,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _SummaryCard(
                icon: Icons.delete_rounded,
                iconColor: AppColors.nonOrganicColor,
                bgColor: AppColors.nonOrganicColor.withValues(alpha: 0.12),
                label: 'Anorganik',
                valueWidget: WeightText(
                  nonOrganicKg,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                value: '',
                valueColor: AppColors.nonOrganicColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Grouped entries
        ...grouped.entries.map(
          (entry) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 8, top: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      entry.key.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    if (entry.key == grouped.keys.first)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<int>(
                            value: _timeFilterIndex,
                            isDense: true,
                            icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primaryGreen, size: 18),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
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
              ),
              ...entry.value.map(
                (log) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _RiwayatItem(log: log),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 80),
      ],
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
    return const EmptyState(
      message: 'Belum ada riwayat pemilahan.',
      icon: Icons.history_rounded,
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.value,
    required this.valueColor,
    this.valueWidget,
  });

  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final String value;
  final Color valueColor;
  final Widget? valueWidget;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
              valueWidget ?? Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: valueColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RiwayatItem extends ConsumerWidget {
  const _RiwayatItem({required this.log});
  final WasteLogEntity log;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final String userLocation = (user != null && user.rtRw.isNotEmpty)
        ? '${user.rtRw}, Kel. ${user.kelurahan}'
        : 'RT 04 / RW 02';

    final String displayLocation = (log.kelurahan != null && log.kelurahan!.isNotEmpty && log.kelurahan != 'Lokasi tidak diketahui' && log.kelurahan != 'null')
        ? log.kelurahan!
        : (log.binQrSerial != null && log.binQrSerial!.isNotEmpty ? log.binQrSerial! : userLocation);

    final bool isOrganic = log.wasteType == WasteType.organic;
    final Color color = isOrganic
        ? AppColors.organicColor
        : AppColors.nonOrganicColor;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.delete_rounded, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOrganic ? 'Sampah Organik' : 'Sampah Non Organik',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      '${log.wasteType.displayName} • ',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    WeightText(
                      log.weightKg,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(
                      Icons.star_rounded,
                      color: AppColors.warningYellow,
                      size: 13,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      '+${log.pointsAwarded} Poin',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.warningYellow,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      color: AppColors.textSecondary,
                      size: 11,
                    ),
                    const SizedBox(width: 3),
                    Flexible(
                      child: Text(
                        displayLocation,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_today_outlined,
                      size: 11,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      DateFormat('d MMM, HH:mm', 'id_ID').format(log.createdAt.toLocal()),
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textHint,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Schedule badge
          _buildScheduleBadge(log.createdAt.toLocal()),
        ],
      ),
    );
  }

  Widget _buildScheduleBadge(DateTime date) {
    final hour = date.hour;
    // Window Pagi: 07-08, Sore: 16-17. Tolerance until 08:59 and 17:59
    final isFullPoin = (hour >= 7 && hour < 9) || (hour >= 16 && hour < 18);
    
    if (isFullPoin) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.primaryGreen.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'FULL POIN',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: AppColors.primaryGreen,
          ),
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.warningYellow.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text(
          'SEBAGIAN',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: AppColors.warningYellow,
          ),
        ),
      );
    }
  }
}
