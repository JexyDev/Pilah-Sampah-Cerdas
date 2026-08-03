import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/petugas_residu_controller.dart';
import '../widgets/petugas_whitelist_guard_widget.dart';

class PetugasResiduDashboardView extends ConsumerWidget {
  const PetugasResiduDashboardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(petugasResiduControllerProvider);
    final dashboard = state.dashboard;

    final bool isApproved = dashboard?.isApproved ?? true;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Halo, ${user?.name ?? "Petugas Residu"} 👋',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Petugas RT ${user?.rtRw.isNotEmpty == true ? user!.rtRw : "01/02"} • Kel. ${user?.kelurahan.isNotEmpty == true ? user!.kelurahan : "Bojongsoang"}',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.notifikasi),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
        color: AppColors.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Guard Whitelist State UI Jika PENDING/REJECTED
              if (!isApproved) ...[
                PetugasWhitelistGuardWidget(
                  statusText: dashboard?.whitelistStatus.name ?? 'PENDING',
                  onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
                ),
              ],

              // 2. Banner Informasi Peran Petugas Residu RT/RW
              Container(
                width: double.infinity,
                color: AppColors.primaryGreen.withValues(alpha: 0.1),
                padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md, vertical: 10),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Pencatatan timbangan residu fisik akan langsung terakumulasi ke Bin Residu Global RT/RW.',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryBlueDark,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // 3. Ringkasan Kinerja & Quick Stats
              Padding(
                padding: const EdgeInsets.all(AppDimensions.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Card KPI Score
                    _buildKpiCard(dashboard?.kpiScore ?? 93.8),
                    const SizedBox(height: AppDimensions.md),

                    // Grid 4 Stat Cards
                    Row(
                      children: [
                        _buildStatCard(
                          title: 'Kg Hari Ini',
                          value: '${dashboard?.totalWeightKg ?? 24.5}',
                          unit: 'Kg',
                          icon: Icons.scale_rounded,
                          color: AppColors.primaryGreen,
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          title: 'Total Entry',
                          value: '${dashboard?.sudahDiambil ?? 4}',
                          unit: 'Upload',
                          icon: Icons.upload_file_rounded,
                          color: AppColors.primaryBlue,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildStatCard(
                          title: 'Pelanggaran',
                          value: '${dashboard?.pelanggaranCount ?? 1}',
                          unit: 'Laporan',
                          icon: Icons.report_problem_outlined,
                          color: AppColors.dangerRed,
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          title: 'Akumulasi Bin',
                          value: '540.2',
                          unit: 'Kg Global',
                          icon: Icons.delete_sweep_rounded,
                          color: AppColors.warningOrange,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppDimensions.lg),

                    // Quick Actions (Input Timbangan & Lapor Pelanggaran)
                    const Text(
                      'Aksi Cepat Input',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: isApproved
                                ? () => Navigator.pushNamed(context, AppRoutes.timbanganResidu)
                                : null,
                            icon: const Icon(Icons.scale_rounded, size: 18),
                            label: const Text('Input Timbangan'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryGreen,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: isApproved
                                ? () => Navigator.pushNamed(context, AppRoutes.laporPelanggaran)
                                : null,
                            icon: const Icon(Icons.warning_amber_rounded, size: 18),
                            label: const Text('Lapor Violation'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.dangerRed,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppDimensions.xl),

                    // Log Aktivitas Input Terakhir Header
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Aktivitas Input Terbaru',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                        ),
                        Text(
                          'Audit Trail RT/RW',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // History Items List
                    if (state.historyList.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24.0),
                          child: Text(
                            'Belum ada aktivitas timbangan yang tercatat hari ini.',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
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
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 1,
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isViolation
                                    ? AppColors.dangerRed.withValues(alpha: 0.1)
                                    : AppColors.primaryGreen.withValues(alpha: 0.1),
                                child: Icon(
                                  isViolation ? Icons.report_problem_rounded : Icons.scale_rounded,
                                  color: isViolation ? AppColors.dangerRed : AppColors.primaryGreen,
                                  size: 20,
                                ),
                              ),
                              title: Text(
                                item['title']?.toString() ?? 'Timbangan Residu',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              subtitle: Text(
                                item['subtitle']?.toString() ?? '',
                                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                              trailing: Text(
                                isViolation ? item['severity']?.toString() ?? 'LOW' : '${item['weightKg'] ?? 0} Kg',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKpiCard(double kpiScore) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryBlueDark, AppColors.primaryBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryBlue.withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.stars_rounded, color: Colors.amber, size: 32),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Skor Kinerja Petugas (KPI)', style: TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 2),
                Text(
                  '${kpiScore.toStringAsFixed(1)}% / Sangat Baik',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text('GRADE A', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String unit,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppDimensions.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      const SizedBox(width: 3),
                      Text(unit, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
