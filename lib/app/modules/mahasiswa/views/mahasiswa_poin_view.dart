import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/point_history_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/mahasiswa_controller.dart';
import '../../riwayat/controllers/riwayat_controller.dart';

final pengajuanIzinCountProvider = FutureProvider.autoDispose<int>((ref) async {
  try {
    final repo = ref.read(kknRepositoryProvider);
    final list = await repo.getPengajuanIzin();
    return list.length;
  } catch (e) {
    return 0;
  }
});

/// Halaman Poin KKN Mahasiswa — Mengikuti gaya visual Page Poin Warga:
/// Header Putih Bersih, Total Poin KKN + Status Ranking, Stats 3 Kolom,
/// Banner Panduan Poin, dan List Riwayat Perolehan Poin KKN.
class MahasiswaPoinView extends ConsumerWidget {
  const MahasiswaPoinView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mhsState = ref.watch(mahasiswaControllerProvider);
    final user = ref.watch(authProvider).user;
    
    final personalPoints = mhsState.dashboard?.contributionPoints ?? 0;

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(mahasiswaControllerProvider.notifier).fetchAll();
          if (user != null) {
            ref.invalidate(pointHistoryProvider);
            ref.invalidate(pengajuanIzinCountProvider);
          }
        },
        color: AppColors.primaryGreen,
        child: CustomScrollView(
          slivers: [
            // ── 1. Header Putih Bersih ──────────────────────────────
            SliverToBoxAdapter(
              child: _buildHeader(context, user?.name ?? '-', personalPoints),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ── 2. Stats 3 Kolom ──────────────────────────────
                  _buildStatsRow(mhsState, ref),
                  const SizedBox(height: 16),

                  // ── 3. Info Banner Poin KKN ─────────────────────────
                  _buildInfoBanner(),
                  const SizedBox(height: 20),

                  // ── 4. Judul & List Riwayat Poin ────────────────────
                  const Text(
                    'Riwayat Perolehan Poin KKN',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 12),
                  if (user != null)
                    _buildPoinHistoryList(ref.watch(pointHistoryProvider))
                  else
                    const SizedBox.shrink(),
                  const SizedBox(height: 40),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String name, int personalPoints) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        bottom: 24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (Navigator.canPop(context))
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              const Text(
                'Poin KKN Mahasiswa',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Center(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Text(
                  'POIN PERSONAL',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                    letterSpacing: 1.0,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      NumberFormat('#,###').format(personalPoints),
                      style: const TextStyle(
                        color: AppColors.primaryGreen,
                        fontSize: 40,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'PTS',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
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

  Widget _buildStatsRow(MahasiswaState mhsState, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final userName = user?.name ?? '';
    final userRw = user?.rw ?? '-';

    // Warga dampingan mahasiswa ini
    final myWargaList = mhsState.wargaList.where((w) {
      if (w.role != 'WARGA') return false;
      
      final cleanWargaRw = w.rw.trim().replaceFirst(RegExp(r'^0+'), '');
      final cleanUserRw = userRw.trim().replaceFirst(RegExp(r'^0+'), '');
      
      final isMyCitizen = w.pendampingName.trim().toLowerCase() == userName.trim().toLowerCase();
      final isMyRw = cleanUserRw.isEmpty || cleanWargaRw == cleanUserRw;

      return isMyCitizen && isMyRw;
    }).toList();

    final wargaCount = myWargaList.where((w) => w.isActivated).length;
    final points = mhsState.dashboard?.contributionPoints ?? 0;
    
    final asyncHistory = ref.watch(pointHistoryProvider);
    int laporanCount = 0;
    if (asyncHistory.value != null) {
      final list = asyncHistory.value!;
      laporanCount = list.where((h) => h.description.toLowerCase().contains('pemanfaatan')).length;
    }

    final izinCount = ref.watch(pengajuanIzinCountProvider).value ?? 0;

    // Total Input = Laporan Pemanfaatan Sampah + Warga Binaan yang Diaktivasi
    final totalInputCount = laporanCount + wargaCount;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StatCard(
                topText: 'Hari',
                middleText: '${(points / 10).floor()}',
                bottomText: 'Presensi',
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatCard(
                topText: 'Warga',
                middleText: '$wargaCount',
                bottomText: 'Tempat Sampah',
                color: AppColors.primaryBlueDark,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatCard(
                topText: 'Laporan',
                middleText: '$laporanCount',
                bottomText: 'Pemanfaatan',
                color: AppColors.warningOrange,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // ── Requirement B: Statistik Tambahan (Pengajuan Izin & Total Input Data) ──
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.warningYellow.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.note_alt_rounded, color: AppColors.warningYellow, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'IZIN / SAKIT',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$izinCount Kali',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.post_add_rounded, color: AppColors.primaryGreen, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TOTAL INPUT',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$totalInputCount Kali',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.2)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline_rounded, color: AppColors.primaryGreen, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Poin KKN diperoleh dari presensi geofence (+10 PTS), aktivasi tempat sampah warga (+15 PTS), dan laporan pemanfaatan daur ulang.',
              style: TextStyle(fontSize: 11, color: AppColors.primaryGreen, height: 1.3),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPoinHistoryList(AsyncValue<List<PointHistoryEntity>> asyncHistory) {
    return asyncHistory.when(skipLoadingOnReload: true, loading: () => const Padding(
        padding: EdgeInsets.all(32),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primaryGreen),
        ),
      ),
      error: (err, _) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            const Icon(Icons.error_outline, size: 40, color: AppColors.dangerRed),
            const SizedBox(height: 8),
            Text(
              'Gagal memuat riwayat poin.\n$err',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
      data: (history) {
        if (history.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: const Column(
              children: [
                Icon(Icons.monetization_on_outlined, size: 40, color: AppColors.textHint),
                SizedBox(height: 8),
                Text(
                  'Belum ada riwayat perolehan poin.',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          );
        }

        return Column(
          children: history
              .map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _PoinHistoryItem(item: item),
                  ))
              .toList(),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.topText,
    required this.middleText,
    required this.bottomText,
    required this.color,
  });

  final String topText;
  final String middleText;
  final String bottomText;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            topText,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.bold, // 1: Bold
            ),
          ),
          const SizedBox(height: 4),
          Text(
            middleText,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600, // 2: Semi-bold
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            bottomText,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w400, // 3: Regular
            ),
          ),
        ],
      ),
    );
  }
}

class _PoinHistoryItem extends StatelessWidget {
  const _PoinHistoryItem({required this.item});

  final PointHistoryEntity item;

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(item.createdAt);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.add_circle_outline_rounded,
              color: AppColors.primaryGreen,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.description,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  formattedDate,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '+${item.points} PTS',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }
}
