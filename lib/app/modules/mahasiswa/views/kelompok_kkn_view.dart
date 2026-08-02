import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/kelompok_kkn_controller.dart';

class KelompokKknView extends ConsumerWidget {
  const KelompokKknView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(kelompokKknProvider);
    final notifier = ref.read(kelompokKknProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Kelompok KKN',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        centerTitle: true,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.primaryGreen, AppColors.primaryBlueDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: () => notifier.fetchKelompok(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => notifier.fetchKelompok(),
        color: AppColors.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (state.isLoading) ...[
                const SizedBox(height: 100),
                const Center(
                  child: CircularProgressIndicator(color: AppColors.primaryGreen),
                ),
              ] else if (state.kelompok == null) ...[
                // Empty state when student is not in any group yet
                const SizedBox(height: 40),
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.groups_outlined,
                            size: 64,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Belum Memiliki Kelompok',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Akun Anda belum ditempatkan dalam kelompok KKN oleh Admin. Silakan hubungi Koordinator KKN atau Admin DLH untuk penempatan lokasi posko dan kelompok.',
                          style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: () => notifier.fetchKelompok(),
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: const Text('Cek Ulang Status Kelompok'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryGreen,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                // Header Kelompok & Dosen Pembimbing
                Card(
                  elevation: 3,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Container(
                    padding: const EdgeInsets.all(18.0),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.primaryGreen.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.groups_rounded, color: AppColors.primaryGreen, size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    state.kelompok!.groupName,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, color: Colors.white70, size: 14),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          state.kelompok!.poskoLocation,
                                          style: const TextStyle(fontSize: 12, color: Colors.white70),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 14),
                          child: Divider(color: Colors.white24, height: 1),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.school_rounded, color: AppColors.primaryGreen, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Dosen Pembimbing Lapangan (DPL):',
                                    style: TextStyle(fontSize: 11, color: Colors.white60),
                                  ),
                                  Text(
                                    state.kelompok!.dosenPembimbing,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Card Total Poin Kelompok (Akumulasi)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.primaryGreen.withValues(alpha: 0.3)),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryGreen.withValues(alpha: 0.08),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.stars_rounded, color: AppColors.primaryGreen, size: 36),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Poin Akumulasi Kelompok',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${state.kelompok!.calculatedTotalPoints} Poin',
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryGreen,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Penjumlahan poin individu ${state.kelompok!.members.length} anggota kelompok',
                              style: const TextStyle(fontSize: 11, color: Colors.black45),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Subtitle Anggota
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Anggota Kelompok KKN',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${state.kelompok!.members.length} Orang',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // List Anggota Kelompok
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: state.kelompok!.members.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final member = state.kelompok!.members[index];
                    return Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        leading: CircleAvatar(
                          backgroundColor: member.isLeader
                              ? AppColors.primaryGreen
                              : AppColors.primaryBlueDark.withValues(alpha: 0.1),
                          foregroundColor: member.isLeader ? Colors.white : AppColors.primaryBlueDark,
                          child: Text(
                            member.name.isNotEmpty ? member.name[0].toUpperCase() : 'M',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(
                                member.name,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                            ),
                            if (member.isLeader)
                              Container(
                                margin: const EdgeInsets.only(left: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryGreen.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'KETUA',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryGreen,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        subtitle: Text(
                          'NIM: ${member.nim.isNotEmpty ? member.nim : "-"} • ${member.jurusan}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${member.individualPoints} Pts',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                            const Text(
                              'Individu',
                              style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Read-only notice
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline_rounded, color: AppColors.primaryBlueDark, size: 20),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Keanggotaan & DPL kelompok KKN dikelola oleh Admin DLH. Aplikasi mobile bersifat read-only.',
                          style: TextStyle(fontSize: 11, color: AppColors.primaryBlueDark),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
