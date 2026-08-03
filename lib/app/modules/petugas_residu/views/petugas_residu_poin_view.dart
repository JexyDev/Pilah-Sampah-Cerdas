import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../controllers/petugas_residu_controller.dart';

class PetugasResiduPoinView extends ConsumerWidget {
  const PetugasResiduPoinView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(petugasResiduControllerProvider);
    final dashboard = state.dashboard;

    final int totalPoints = ((dashboard?.totalWeightKg ?? 42.5) * 2).toInt();

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Poin & Insentif Petugas',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
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
                  children: [
                    const Icon(Icons.monetization_on_rounded, color: Colors.amber, size: 48),
                    const SizedBox(height: 10),
                    const Text('Total Poin Insentif Residu', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(
                      '$totalPoints Pts',
                      style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Insentif Dihitung Otomatis oleh Server Backend Admin',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.lg),

              // Penjelasan Skema Poin Insentif
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primaryBlueLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: AppColors.primaryBlueDark, size: 24),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Poin insentif diberikan berbasis jumlah berat (Kg) timbangan residu yang berhasil diupload ke sistem. Rate formula diatur dari backend Admin DLH.',
                        style: TextStyle(fontSize: 12, color: AppColors.primaryBlueDark, height: 1.3),
                      ),
                    ),
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

              if (state.historyList.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Text('Belum ada log poin.', style: TextStyle(color: AppColors.textSecondary)),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.historyList.length,
                  itemBuilder: (ctx, idx) {
                    final item = state.historyList[idx];
                    final isViolation = item['type'] == 'PELANGGARAN';
                    final weight = (item['weightKg'] as num?)?.toDouble() ?? 10.0;
                    final points = (weight * 2).toInt();

                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 1,
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isViolation
                              ? AppColors.dangerRed.withValues(alpha: 0.1)
                              : Colors.amber.withValues(alpha: 0.15),
                          child: Icon(
                            isViolation ? Icons.remove_circle_outline : Icons.add_circle_outline,
                            color: isViolation ? AppColors.dangerRed : Colors.amber[800],
                          ),
                        ),
                        title: Text(
                          item['title']?.toString() ?? 'Timbangan Residu',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        subtitle: Text(
                          item['timestamp']?.toString() ?? '',
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                        trailing: Text(
                          isViolation ? '-${item['pointDeduction'] ?? 10} Pts' : '+$points Pts',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: isViolation ? AppColors.dangerRed : AppColors.primaryGreen,
                          ),
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
}
