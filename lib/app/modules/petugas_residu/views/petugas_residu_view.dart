import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/models/petugas_residu_models.dart';
import '../controllers/petugas_residu_controller.dart';
import '../widgets/petugas_whitelist_guard_widget.dart';

class PetugasResiduView extends ConsumerWidget {
  const PetugasResiduView({super.key});

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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Halo, ${user?.name ?? "Petugas Residu"} 👋',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              'Wilayah Tugas: ${user?.rtRw.isNotEmpty == true ? "RT ${user!.rtRw}" : (dashboard?.assignedZone ?? "RT 01/RW 02")}',
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
              // ── 1. Guard Whitelist State UI Jika PENDING/REJECTED ─────────────────
              if (!isApproved) ...[
                PetugasWhitelistGuardWidget(
                  statusText: dashboard?.whitelistStatus.name ?? 'PENDING',
                  onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
                ),
              ],

              // ── 2. Time Window Banner Indicator ───────────────────────────
              _buildTimeWindowBanner(context, state.isPickupWindowActive),

              // ── 3. Quick Summary Cards & KPI ──────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md, vertical: AppDimensions.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // KPI Badge Card
                    _buildKpiCard(dashboard?.kpiScore ?? 93.8),
                    const SizedBox(height: AppDimensions.md),

                    // Grid 4 Stat Cards
                    Row(
                      children: [
                        _buildStatCard(
                          title: 'Perlu Diambil',
                          value: '${dashboard?.totalJadwal ?? 8}',
                          unit: 'Lokasi',
                          icon: Icons.delete_outline_rounded,
                          color: AppColors.warningYellow,
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          title: 'Sudah Diambil',
                          value: '${dashboard?.sudahDiambil ?? 3}',
                          unit: 'Selesai',
                          icon: Icons.task_alt_rounded,
                          color: AppColors.primaryGreen,
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
                          title: 'Kg Terkumpul',
                          value: '${dashboard?.totalWeightKg ?? 42.5}',
                          unit: 'Kg',
                          icon: Icons.scale_rounded,
                          color: AppColors.primaryBlue,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppDimensions.lg),

                    // Quick Actions
                    const Text('Aksi Cepat Task', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: isApproved
                                ? () => Navigator.pushNamed(context, AppRoutes.timbanganResidu)
                                : null,
                            icon: const Icon(Icons.scale_rounded, size: 18),
                            label: const Text('Ambil Sampah'),
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

                    // Jadwal Penjemputan Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Jadwal Penjemputan Hilir',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                        ),
                        Text(
                          'Volume >= 70%',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.warningYellow[900]),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Schedule List Items
                    if (state.jadwalList.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24.0),
                          child: Text('Tidak ada tempat sampah residu yang memerlukan penjemputan saat ini.', style: TextStyle(color: AppColors.textSecondary)),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: state.jadwalList.length,
                        itemBuilder: (ctx, idx) {
                          final item = state.jadwalList[idx];
                          return _buildJadwalTile(context, item, isApproved);
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

  Widget _buildTimeWindowBanner(BuildContext context, bool isActive) {
    return Container(
      width: double.infinity,
      color: isActive ? AppColors.primaryGreen.withValues(alpha: 0.1) : Colors.amber[50],
      padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md, vertical: 10),
      child: Row(
        children: [
          Icon(
            isActive ? Icons.access_time_filled_rounded : Icons.info_outline_rounded,
            color: isActive ? AppColors.primaryGreen : Colors.amber[900],
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isActive
                  ? 'Jadwal Penjemputan Aktif (Window 06:00–08:00 & 16:00–18:00)'
                  : 'Di Luar Window Waktu Penjemputan (Status Read-Only)',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isActive ? AppColors.primaryGreen : Colors.amber[900],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard(double kpiScore) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
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
              child: Icon(icon, color: color, size: 24),
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
                      Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      const SizedBox(width: 4),
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

  Widget _buildJadwalTile(BuildContext context, ResiduBinPickup bin, bool isApproved) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.delete_rounded,
                      color: bin.isPickedUp ? AppColors.primaryGreen : AppColors.warningYellow[900],
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      bin.binCode,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: bin.isPickedUp ? Colors.green[50] : Colors.amber[50],
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: bin.isPickedUp ? AppColors.primaryGreen : Colors.amber[400]!,
                    ),
                  ),
                  child: Text(
                    bin.isPickedUp ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: bin.isPickedUp ? AppColors.primaryGreen : Colors.amber[900],
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            Text(bin.wargaName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 2),
            Text(bin.address, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 12),

            // Progress Volume Bar
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: bin.volumePercentage / 100.0,
                      minHeight: 8,
                      backgroundColor: Colors.grey[200],
                      color: bin.volumePercentage >= 80
                          ? AppColors.dangerRed
                          : (bin.volumePercentage >= 70 ? AppColors.warningYellow : AppColors.primaryGreen),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${bin.volumePercentage.toInt()}% Vol',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (!bin.isPickedUp && isApproved)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.timbanganResidu),
                  icon: const Icon(Icons.scale_rounded, size: 16),
                  label: const Text('Input Timbangan Fisik'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
