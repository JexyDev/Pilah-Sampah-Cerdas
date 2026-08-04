import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_config.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../../../data/models/user_entity.dart';
import '../controllers/petugas_residu_controller.dart';
import '../widgets/petugas_whitelist_guard_widget.dart';

class PetugasResiduDashboardView extends ConsumerWidget {
  const PetugasResiduDashboardView({super.key});

  Widget _buildHeaderAvatarImage(String? fotoPath) {
    if (fotoPath == null || fotoPath.isEmpty) {
      return const Center(
        child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28),
      );
    }
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
      return Image.network(
        fotoPath,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28)),
      );
    }
    if (fotoPath.startsWith('/') || fotoPath.startsWith('file://') || fotoPath.contains(':\\') || fotoPath.contains(':/')) {
      final cleanPath = fotoPath.startsWith('file://') ? fotoPath.replaceFirst('file://', '') : fotoPath;
      final file = File(cleanPath);
      if (file.existsSync()) {
        return Image.file(file, fit: BoxFit.cover);
      }
    }
    return Image.network(
      '${AppConfig.baseUrl}$fotoPath',
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.person_rounded, color: AppColors.primaryGreen, size: 28)),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Selamat Pagi,';
    if (hour < 15) return 'Selamat Siang,';
    if (hour < 18) return 'Selamat Sore,';
    return 'Selamat Malam,';
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, UserEntity? user, int unreadCount) {
    final name = user?.name ?? 'Petugas Residu';
    final rtRw = user?.rtRw.isNotEmpty == true ? user!.rtRw : '01 / 02';
    final kelurahan = user?.kelurahan.isNotEmpty == true ? user!.kelurahan : 'Bojongsoang';
    final roleName = 'Petugas Residu';
    final fotoUrl = user?.fotoProfil;

    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 16,
        right: 16,
        bottom: 24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Avatar
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.backgroundCanvas,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                clipBehavior: Clip.antiAlias,
                child: _buildHeaderAvatarImage(fotoUrl),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getGreeting(),
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            name,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.warningYellow,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            roleName,
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'RT $rtRw • Kel. $kelurahan',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              // Notifikasi
              GestureDetector(
                onTap: () => Navigator.of(context).pushNamed(AppRoutes.notifikasi),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.notifications_outlined,
                        color: AppColors.primaryGreen,
                        size: 22,
                      ),
                    ),
                    if (unreadCount > 0)
                      Positioned(
                        top: -4,
                        right: -4,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                          decoration: const BoxDecoration(
                            color: AppColors.dangerRed,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            unreadCount > 99 ? '99+' : "$unreadCount",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAksiCepat(BuildContext context, bool isApproved) {
    return Container(
      padding: const EdgeInsets.all(AppDimensions.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildActionItem(
            context,
            icon: Icons.scale_rounded,
            label: 'Input\nTimbangan',
            color: AppColors.primaryGreen,
            onTap: isApproved ? () => Navigator.pushNamed(context, AppRoutes.timbanganResidu) : null,
          ),
          _buildActionItem(
            context,
            icon: Icons.history_rounded,
            label: 'Riwayat\nBulan Ini',
            color: AppColors.primaryBlue,
            onTap: isApproved ? () => Navigator.pushNamed(context, AppRoutes.riwayatPetugasResidu) : null,
          ),
          _buildActionItem(
            context,
            icon: Icons.warning_amber_rounded,
            label: 'SOP\nKerja',
            color: AppColors.warningOrange,
            onTap: isApproved ? () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('SOP Kerja Petugas Residu belum tersedia.'))
              );
            } : null,
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem(BuildContext context, {required IconData icon, required String label, required Color color, VoidCallback? onTap}) {
    final isDisabled = onTap == null;
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: isDisabled ? Colors.grey.withValues(alpha: 0.1) : color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: isDisabled ? Colors.grey : color, size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDisabled ? Colors.grey : AppColors.textPrimary,
              height: 1.2,
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
            color: AppColors.primaryBlue.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Indeks Kinerja (KPI)', style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 4),
              Text(
                '${kpiScore.toStringAsFixed(1)} / 100',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Colors.white),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                child: const Text('Kinerja Sangat Baik', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const Icon(Icons.stars_rounded, color: Colors.white, size: 48),
        ],
      ),
    );
  }

  Widget _buildStatCard({required String title, required String value, required String unit, required IconData icon, required Color color}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppDimensions.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary)),
                  const SizedBox(width: 4),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Text(unit, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(petugasResiduControllerProvider);
    final unreadCount = ref.watch(unreadNotificationCountProvider);
    final dashboard = state.dashboard;

    final bool isApproved = dashboard?.isApproved ?? true;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _buildHeader(context, ref, user, unreadCount),
            ),
            
            SliverPadding(
              padding: const EdgeInsets.all(AppDimensions.md),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (!isApproved) ...[
                    PetugasWhitelistGuardWidget(
                      statusText: dashboard?.whitelistStatus.name ?? 'PENDING',
                      onRefresh: () => ref.read(petugasResiduControllerProvider.notifier).refreshAll(),
                    ),
                    const SizedBox(height: AppDimensions.md),
                  ],

                  // Banner
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md, vertical: 12),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Pencatatan timbangan residu fisik terakumulasi otomatis ke Bin Residu Global RT/RW.',
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
                  const SizedBox(height: AppDimensions.md),

                  // Kinerja & Matriks
                  _buildKpiCard(dashboard?.kpiScore ?? 93.8),
                  const SizedBox(height: AppDimensions.md),
                  
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
                        title: 'Akumulasi Bin',
                        value: '540.2',
                        unit: 'Kg Global',
                        icon: Icons.delete_sweep_rounded,
                        color: AppColors.warningOrange,
                      ),
                      const SizedBox(width: 12),
                      const Expanded(child: SizedBox()), // Placeholder agar grid tetap rata
                    ],
                  ),
                  const SizedBox(height: AppDimensions.lg),

                  // Aksi Cepat
                  const Text(
                    'Aksi Cepat',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: AppDimensions.sm),
                  _buildAksiCepat(context, isApproved),
                  const SizedBox(height: AppDimensions.lg),

                  // Riwayat
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Aktivitas Input Terbaru',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.textPrimary),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pushNamed(context, AppRoutes.riwayatPetugasResidu),
                        child: const Text(
                          'Lihat Semua',
                          style: TextStyle(
                            color: AppColors.primaryGreen,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  if (state.historyList.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24.0),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
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
                      itemCount: state.historyList.length > 5 ? 5 : state.historyList.length,
                      itemBuilder: (ctx, idx) {
                        final item = state.historyList[idx];
                        
                        final title = item['title']?.toString() ?? item['classification']?.toString() ?? item['kategori']?.toString() ?? 'Setoran Timbangan';
                        final subtitle = item['subtitle']?.toString() ?? item['wargaName']?.toString() ?? item['namaWarga']?.toString() ?? item['binCode']?.toString() ?? '';
                        final weight = item['weightKg'] ?? item['actualWeightKg'] ?? item['weight'] ?? 0;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 5,
                                offset: const Offset(0, 2),
                              )
                            ]
                          ),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.1),
                              child: const Icon(
                                Icons.scale_rounded,
                                color: AppColors.primaryGreen,
                                size: 20,
                              ),
                            ),
                            title: Text(
                              title,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                            subtitle: Text(
                              subtitle,
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                            trailing: Text(
                              '$weight Kg',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 40), // Spasi bawah sebelum bottom bar
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
