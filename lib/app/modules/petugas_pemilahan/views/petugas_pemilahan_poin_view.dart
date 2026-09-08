import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../controllers/petugas_pemilahan_controller.dart';

class PetugasPemilahanPoinView extends ConsumerWidget {
  const PetugasPemilahanPoinView({super.key});

  String _formatDateTime(String? rawStr) {
    if (rawStr == null || rawStr.isEmpty || rawStr == '-') return '';
    try {
      final dt = DateTime.parse(rawStr).toLocal();
      return '${DateFormat('d MMMM yyyy, HH:mm', 'id_ID').format(dt)} WIB';
    } catch (_) {
      return '';
    }
  }

  String _sanitizeTitle(String? raw) {
    if (raw == null || raw.isEmpty) return 'Timbangan Pemilahan';
    return raw
        .replaceAll(RegExp(r'Setoran\s+Manual\s+Residu', caseSensitive: false), 'Timbangan Pemilahan')
        .replaceAll(RegExp(r'residu\s+global', caseSensitive: false), 'pemilahan')
        .replaceAll(RegExp(r'\bresidu\b', caseSensitive: false), 'pemilahan')
        .replaceAll(RegExp(r'\bResidu\b'), 'Pemilahan')
        .replaceAll(RegExp(r'tong\s+sampah', caseSensitive: false), 'Tempat Sampah')
        .replaceAll(RegExp(r'\btong\b', caseSensitive: false), 'Tempat Sampah');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(petugasPemilahanControllerProvider);
    final pointHistoryAsync = ref.watch(petugasPointHistoryProvider);
    final dashboard = state.dashboard;

    final int totalPoints = dashboard?.totalPoints ?? 0;
    final pointItems = state.historyList.where((item) {
      final points = (item['points'] ?? item['pointsEarned'] ?? 0).toInt();
      return points > 0;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        automaticallyImplyLeading: Navigator.canPop(context),
        foregroundColor: AppColors.primaryGreen,
        title: const Text('Poin & Performa', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18, color: AppColors.primaryGreen)),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasPemilahanControllerProvider.notifier).refreshAll(),
        color: AppColors.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppDimensions.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card Poin
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primaryGreen, AppColors.primaryBlueDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryGreen.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Text(
                      'Total Poin Insentif Pemilahan',
                      style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.warningYellow.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.warningYellow.withValues(alpha: 0.6), width: 1.5),
                      ),
                      child: const Icon(Icons.monetization_on_rounded, color: AppColors.warningYellow, size: 48),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '$totalPoints Pts',
                      style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Poin Otomatis Diperoleh dari Timbangan & Validasi RW',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // Penjelasan Skema Poin Insentif
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primaryBlueLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.info_outline_rounded, color: AppColors.primaryBlueDark, size: 24),
                        SizedBox(width: 12),
                        Text(
                          'Skema Insentif Poin',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlueDark),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildPoinRuleRow(Icons.scale_rounded, 'Timbangan Sampah', '1 Kg = 2 Poin'),
                    _buildPoinRuleRow(Icons.camera_alt_rounded, 'Bonus Foto Bukti Valid', '+10 Poin / Input'),
                    _buildPoinRuleRow(Icons.check_circle_outline_rounded, 'Validasi Pengosongan RW', '+15 Poin / Pengajuan Warga'),
                    _buildPoinRuleRow(Icons.event_available_rounded, 'Penyelesaian Jadwal RW', 'Bonus Insentif Harian'),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // Riwayat Perolehan Poin
              const Text(
                'Riwayat Perolehan Poin',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 10),

              pointHistoryAsync.when(
                data: (histories) {
                  if (histories.isEmpty) {
                    if (pointItems.isEmpty) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24.0),
                          child: Text(
                            'Belum ada riwayat perolehan poin yang tercatat.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        ),
                      );
                    }
                    return _buildPointFallbackList(pointItems);
                  }

                  return ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: histories.length,
                    itemBuilder: (ctx, idx) {
                      final item = histories[idx];
                      final isPositive = item.points >= 0;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 1,
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isPositive
                                ? AppColors.warningYellow.withValues(alpha: 0.15)
                                : const Color(0xFFFEE2E2),
                            child: Icon(
                              isPositive
                                  ? Icons.monetization_on_rounded
                                  : Icons.warning_amber_rounded,
                              color: isPositive
                                  ? AppColors.warningYellow
                                  : const Color(0xFFEF4444),
                            ),
                          ),
                          title: Text(
                            _sanitizeTitle(item.description),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          subtitle: Text(
                            _formatDateTime(item.createdAt.toIso8601String()),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          trailing: Text(
                            isPositive ? '+${item.points} Pts' : '${item.points} Pts',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: isPositive
                                  ? AppColors.primaryGreen
                                  : const Color(0xFFEF4444),
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: CircularProgressIndicator(color: AppColors.primaryGreen),
                  ),
                ),
                error: (_, __) {
                  if (pointItems.isNotEmpty) {
                    return _buildPointFallbackList(pointItems);
                  }
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Text(
                        'Belum ada riwayat perolehan poin yang tercatat.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPointFallbackList(List<Map<String, dynamic>> pointItems) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: pointItems.length,
      itemBuilder: (ctx, idx) {
        final item = pointItems[idx];
        final points = (item['points'] ?? item['pointsEarned'] ?? 0).toInt();

        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 1,
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: AppColors.warningYellow.withValues(alpha: 0.15),
              child: const Icon(
                Icons.monetization_on_rounded,
                color: AppColors.warningYellow,
              ),
            ),
            title: Text(
              _sanitizeTitle(item['title']?.toString()),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            subtitle: Text(
              _formatDateTime(item['timestamp']?.toString()),
              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
            trailing: Text(
              '+$points Pts',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: AppColors.primaryGreen,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPoinRuleRow(IconData icon, String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppColors.primaryBlueDark.withValues(alpha: 0.7)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(title, style: const TextStyle(fontSize: 12, color: AppColors.primaryBlueDark)),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerRight,
              child: Text(
                value,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlueDark),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

