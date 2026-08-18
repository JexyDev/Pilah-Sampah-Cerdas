import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/models/petugas_pemilahan_models.dart';
import '../controllers/petugas_pemilahan_controller.dart';
class PetugasPemilahanView extends ConsumerWidget {
  const PetugasPemilahanView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(petugasPemilahanControllerProvider);
    final dashboard = state.dashboard;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primaryGreen,
        elevation: 2,
        shadowColor: Colors.black12,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Halo, ${user?.name ?? "-"} 👋',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
            ),
            Text(
              'Wilayah Tugas: ${user?.rw.isNotEmpty == true ? "RW ${user!.rw}" : (dashboard?.assignedZone ?? "-")}',
              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Image.asset('assets/icons/notification.png', color: AppColors.primaryGreen, width: 24, height: 24),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.petugasNotifikasi),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasPemilahanControllerProvider.notifier).refreshAll(),
        color: AppColors.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // â”€â”€ 2. Time Window Banner Indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              _buildTimeWindowBanner(context, state.isPickupWindowActive),

              // â”€â”€ 3. Quick Summary Cards & KPI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md, vertical: AppDimensions.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // KPI Badge Card
                    _buildKpiCard(dashboard?.kpiScore ?? 0.0),
                    const SizedBox(height: AppDimensions.md),

                    // Grid Stat Cards
                    Row(
                      children: [
                        _buildStatCard(
                          title: 'Siap Ditimbang',
                          value: '${dashboard?.totalJadwal ?? 0}',
                          unit: 'Lokasi',
                          icon: Icons.delete_outline_rounded,
                          color: AppColors.warningYellow,
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          title: 'Sudah Dicatat',
                          value: '${dashboard?.sudahDiambil ?? 0}',
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
                          title: 'Total Pemilahan',
                          value: '${dashboard?.totalWeightKg ?? 0.0}',
                          unit: 'Kg',
                          icon: Icons.scale_outlined,
                          color: AppColors.primaryBlue,
                        ),
                        const SizedBox(width: 12),
                        const Expanded(child: SizedBox()),
                      ],
                    ),
                    const SizedBox(height: AppDimensions.lg),
                    // Single Main Action Button: Input Timbangan Pemilahan
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => Navigator.pushNamed(context, AppRoutes.timbanganPemilahan),
                        icon: const Icon(Icons.scale_rounded, size: 22),
                        label: const Text('Input Timbangan Sampah Pemilahan RW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreen,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 2,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppDimensions.xl),

                    if (state.pengajuanList.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Daftar Pengajuan Warga',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.warningOrange,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${state.pengajuanList.length} Antrean',
                              style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ...state.pengajuanList.map((pengajuan) {
                        final wargaName = pengajuan['wargaName'] ?? 'Warga';
                        final pengajuanId = pengajuan['id'] ?? '';
                        final alasan = pengajuan['alasan'] ?? 'Pengajuan pengosongan bin penuh';
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const CircleAvatar(
                                    radius: 18,
                                    backgroundColor: AppColors.backgroundCanvas,
                                    child: Icon(Icons.person_outline_rounded, color: AppColors.warningOrange, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          wargaName,
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          alasan,
                                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton(
                                    onPressed: () async {
                                      final ok = await ref.read(petugasPemilahanControllerProvider.notifier).claimPengajuanReset(pengajuanId);
                                      if (context.mounted) {
                                        final errorMsg = ref.read(petugasPemilahanControllerProvider).errorMessage;
                                        ScaffoldMessenger.of(context).clearSnackBars();
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(ok ? 'Pengajuan berhasil diterima & diproses!' : (errorMsg ?? 'Gagal memproses pengajuan.')),
                                            backgroundColor: ok ? AppColors.primaryGreen : AppColors.dangerRed,
                                          ),
                                        );
                                      }
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primaryGreen,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    child: const Text('Terima', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: AppDimensions.xl),
                    ],

                    // Daftar Pemilahan RW Header
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Daftar Pemilahan RW (Input Timbangan)',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                        ),
                        Text(
                          'Volume >= 70%',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.warningOrange),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Schedule List Items
                    if (state.jadwalList.isEmpty)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24.0),
                          child: Text('Tidak ada tempat sampah pemilahan yang siap diinput timbangan saat ini.', style: TextStyle(color: AppColors.textSecondary)),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: state.jadwalList.length,
                        itemBuilder: (ctx, idx) {
                          final item = state.jadwalList[idx];
                          return _buildJadwalTile(context, item);
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
      color: isActive ? AppColors.primaryGreen.withValues(alpha: 0.1) : AppColors.warningYellow,
      padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md, vertical: 10),
      child: Row(
        children: [
          Icon(
            isActive ? Icons.access_time_filled_rounded : Icons.info_outline_rounded,
            color: isActive ? AppColors.primaryGreen : AppColors.warningYellow,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isActive
                  ? 'Window Input Timbangan Aktif (06:00â€“08:00 & 16:00â€“18:00)'
                  : 'Di Luar Window Waktu Input Timbangan (Status Read-Only)',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isActive ? AppColors.primaryGreen : AppColors.warningYellow,
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
            child: const Icon(Icons.stars_rounded, color: AppColors.warningYellow, size: 32),
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

  Widget _buildJadwalTile(BuildContext context, PemilahanBinPickup bin) {
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
                      color: bin.isPickedUp ? AppColors.primaryGreen : AppColors.warningOrange,
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
                    color: bin.isPickedUp ? AppColors.primaryGreen : AppColors.warningYellow,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: bin.isPickedUp ? AppColors.primaryGreen : AppColors.warningYellow,
                    ),
                  ),
                  child: Text(
                    bin.isPickedUp ? 'SUDAH DIAMBIL' : 'BELUM DIAMBIL',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: bin.isPickedUp ? AppColors.primaryGreen : AppColors.warningYellow,
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

            if (!bin.isPickedUp)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.timbanganPemilahan),
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

