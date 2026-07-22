/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../domain/entities/waste_log_entity.dart';
import '../../domain/entities/bin_entity.dart';
import '../providers/waste_log_provider.dart';
import '../shared/widgets/skeleton_loading.dart';
import '../shared/widgets/empty_state.dart';

/// Halaman riwayat pemilahan — sesuai desain:
/// Filter tabs, summary kg organik+anorganik, list TERVALIDASI.
class RiwayatScreen extends ConsumerStatefulWidget {
  const RiwayatScreen({super.key});

  @override
  ConsumerState<RiwayatScreen> createState() => _RiwayatScreenState();
}

class _RiwayatScreenState extends ConsumerState<RiwayatScreen> {
  int _filterIndex = 0; // 0=Semua, 1=Minggu Ini, 2=Bulan Ini

  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(wasteLogsProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(title: const Text('Riwayat Pemilahan')),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _filterTab('Semua', 0),
                const SizedBox(width: 8),
                _filterTab('Minggu Ini', 1),
                const SizedBox(width: 8),
                _filterTab('Bulan Ini', 2),
              ],
            ),
          ),

          Expanded(
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
                message: 'Gagal memuat riwayat.',
                icon: Icons.error_outline_rounded,
                buttonText: 'Coba Lagi',
                onButtonPressed: () => ref.invalidate(wasteLogsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<WasteLogEntity> _applyFilter(List<WasteLogEntity> logs) {
    final now = DateTime.now();
    switch (_filterIndex) {
      case 1: // Minggu ini
        final start = now.subtract(Duration(days: now.weekday - 1));
        return logs
            .where(
              (l) => l.createdAt.isAfter(
                DateTime(start.year, start.month, start.day),
              ),
            )
            .toList();
      case 2: // Bulan ini
        return logs
            .where(
              (l) =>
                  l.createdAt.month == now.month &&
                  l.createdAt.year == now.year,
            )
            .toList();
      default:
        return logs;
    }
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
      final String key = _groupLabel(log.createdAt, now);
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
                value: '${organicKg.toStringAsFixed(1)} kg',
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
                value: '${nonOrganicKg.toStringAsFixed(1)} kg',
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
                child: Text(
                  entry.key.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.5,
                  ),
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
  });

  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final String value;
  final Color valueColor;

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
              Text(
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

class _RiwayatItem extends StatelessWidget {
  const _RiwayatItem({required this.log});
  final WasteLogEntity log;

  @override
  Widget build(BuildContext context) {
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
                Text(
                  '${log.wasteType.displayName} • ${log.weightKg.toStringAsFixed(1)} kg',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_today_outlined,
                      size: 11,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      DateFormat('d MMM, HH:mm', 'id_ID').format(log.createdAt),
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
          // TERVALIDASI badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.statusTervalidasiBg,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.check_circle_rounded,
                  color: AppColors.statusTervalidasi,
                  size: 12,
                ),
                SizedBox(width: 3),
                Text(
                  'TERVALIDASI',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AppColors.statusTervalidasi,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
