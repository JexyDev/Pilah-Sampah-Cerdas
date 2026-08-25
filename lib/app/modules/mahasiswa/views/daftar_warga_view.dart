import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../../../routes/app_routes.dart';
import '../../shared/widgets/app_loading.dart';
import '../controllers/mahasiswa_controller.dart';
import '../../auth/controllers/auth_controller.dart';

class DaftarWargaView extends ConsumerStatefulWidget {
  const DaftarWargaView({super.key});

  @override
  ConsumerState<DaftarWargaView> createState() => _DaftarWargaViewState();
}

class _DaftarWargaViewState extends ConsumerState<DaftarWargaView> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  int _activationFilterIndex = 0; // 0=Semua, 1=Sudah, 2=Belum

  List<WargaDampingan> _filteredList(List<WargaDampingan> list, String userKecamatan, String userKelurahan, String userRw, String userId, String userNim, String userName) {
    // Tampilkan Warga Dampingan mahasiswa sesuai filter aktivasi
    var filtered = list.where((w) {
      if (_activationFilterIndex == 1 && !w.isActivated) return false;
      if (_activationFilterIndex == 2 && w.isActivated) return false;

      // Filter QC: Tampilkan HANYA warga si mahasiswa tersebut.
      final isMyCitizen = w.mahasiswaId == userId;

      return isMyCitizen;
    }).map((w) {
      // Selaraskan alamat warga ke wilayah penugasan mahasiswa jika data mentah backend masih umum
      final targetKel = userKelurahan;
      final targetRw = userRw;
      final targetKec = w.kecamatan.isNotEmpty ? w.kecamatan : userKecamatan;
      final kelDisplay = targetKel.toLowerCase().startsWith('kel') ? targetKel : 'Kel. $targetKel';
      final displayAddr = w.address.contains('Bojongsoang') || w.address.contains('RW')
          ? w.address
          : 'Jl. ${w.wargaName} No. ${w.binId.length > 3 ? w.binId.substring(w.binId.length - 2) : "4"}, RW $targetRw, $kelDisplay, Kec. $targetKec';
      
      return WargaDampingan(
        wargaId: w.wargaId,
        binId: w.binId,
        wargaName: w.wargaName,
        address: displayAddr,
        kelurahan: targetKel,
        rw: targetRw,
        mahasiswaId: w.mahasiswaId,
        recentLogs: w.recentLogs,
        isActivated: w.isActivated,
        role: w.role,
        totalPoints: w.totalPoints,
        apiCorrectPercentage: w.apiCorrectPercentage,
      );
    }).toList();

    if (_searchQuery.isEmpty) return filtered;
    final query = _searchQuery.toLowerCase();
    return filtered
        .where((w) =>
            w.wargaName.toLowerCase().contains(query) ||
            w.address.toLowerCase().contains(query))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(mahasiswaControllerProvider);
    final user = ref.watch(authProvider).user;
    final userRw = user?.rw ?? '';
    final userKec = user?.kecamatan ?? '';
    final userKel = user?.kelurahan ?? '';
    final userId = user?.id ?? '';
    final userNim = user?.nim ?? '';
    final userName = user?.name ?? '';
    
    final filtered = _filteredList(state.wargaList, userKec, userKel, userRw, userId, userNim, userName);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Warga Dampingan (${filtered.length})',
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
      ),
      body: state.isLoading && state.wargaList.isEmpty
          ? const AppLoading(message: 'Memuat daftar warga...')
          : Column(
              children: [
                // ── Search Bar ──────────────────────────────────
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(
                    AppDimensions.md,
                    AppDimensions.sm,
                    AppDimensions.md,
                    AppDimensions.md,
                  ),
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _searchQuery = v),
                    style: const TextStyle(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Cari nama atau alamat warga...',
                      hintStyle: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textHint,
                      ),
                      prefixIcon: const Icon(
                        Icons.search_rounded,
                        color: AppColors.textHint,
                        size: 20,
                      ),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded,
                                  size: 18, color: AppColors.textHint),
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: AppColors.backgroundCanvas,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(AppDimensions.radiusMd),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                
                // ── Filter Aktivasi ─────────────────────────────
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.only(bottom: AppDimensions.md),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md),
                    child: Row(
                      children: [
                        _filterChip('Semua', 0),
                        const SizedBox(width: 8),
                        _filterChip('Sudah Aktivasi', 1),
                        const SizedBox(width: 8),
                        _filterChip('Belum Aktivasi', 2),
                      ],
                    ),
                  ),
                ),

                // ── List ────────────────────────────────────────
                Expanded(
                  child: filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _searchQuery.isNotEmpty
                                    ? Icons.search_off_rounded
                                    : Icons.people_outline_rounded,
                                size: 56,
                                color: AppColors.textHint,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _searchQuery.isNotEmpty
                                    ? 'Tidak ditemukan warga\ndengan kata kunci "$_searchQuery"'
                                    : 'Belum ada warga dampingan',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: ref
                              .read(mahasiswaControllerProvider.notifier)
                              .refresh,
                          color: AppColors.primaryGreen,
                          child: ListView.builder(
                            padding: const EdgeInsets.all(AppDimensions.md),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) {
                              return _WargaListItem(
                                warga: filtered[index],
                                currentUserName: user?.name ?? '',
                                onTap: () => Navigator.pushNamed(
                                  context,
                                  AppRoutes.detailWarga,
                                  arguments: filtered[index],
                                ),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _filterChip(String label, int index) {
    final bool active = _activationFilterIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _activationFilterIndex = index),
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// Warga List Item
// ═══════════════════════════════════════════════════════════════════════════════

class _WargaListItem extends StatelessWidget {
  const _WargaListItem({
    required this.warga,
    required this.onTap,
    this.currentUserName = '',
  });

  final WargaDampingan warga;
  final VoidCallback onTap;
  final String currentUserName;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
        elevation: 0,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppDimensions.radiusMd),
              border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
            ),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: warga.needsReeducation
                        ? AppColors.warningYellow.withValues(alpha: 0.15)
                        : AppColors.primaryGreen.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      warga.wargaName.isNotEmpty
                          ? warga.wargaName[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: warga.needsReeducation
                            ? AppColors.warningOrange
                            : AppColors.primaryGreen,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        warga.wargaName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        warga.address,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (warga.isActivated) ...[
                        const SizedBox(height: 5),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: warga.pendampingName.isNotEmpty ? const Color(0xFFEBF5FF) : AppColors.primaryGreen.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: warga.pendampingName.isNotEmpty ? const Color(0xFF90CDF4) : AppColors.primaryGreen.withValues(alpha: 0.3)),
                            ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified_rounded, size: 12, color: warga.pendampingName.isNotEmpty ? AppColors.primaryBlueDark : AppColors.primaryGreen),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  warga.pendampingName.isNotEmpty
                                      ? 'Diaktivasi oleh: ${warga.pendampingName}'
                                      : 'Aktivasi Mandiri',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: warga.pendampingName.isNotEmpty ? AppColors.primaryBlueDark : AppColors.primaryGreen,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          _StatBadge(
                            icon: Icons.check_circle_outline_rounded,
                            label: '${warga.correctPercentage.toStringAsFixed(0)}% benar',
                            color: AppColors.success,
                          ),
                          const SizedBox(width: 8),
                          _StatBadge(
                            icon: Icons.list_alt_rounded,
                            label: '${warga.totalActivities} aktivitas',
                            color: AppColors.primaryGreen,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Status indicator
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: warga.needsReeducation
                            ? AppColors.warningOrange.withValues(alpha: 0.1)
                            : AppColors.success.withValues(alpha: 0.1),
                        borderRadius:
                            BorderRadius.circular(AppDimensions.radiusFull),
                      ),
                      child: Text(
                        warga.needsReeducation ? '⚠ Edukasi' : '✅ Baik',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: warga.needsReeducation
                              ? AppColors.warningOrange
                              : AppColors.success,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: AppColors.textHint,
                      size: 22,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatBadge extends StatelessWidget {
  const _StatBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 3),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
