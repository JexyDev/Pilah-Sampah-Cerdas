import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../controllers/kelompok_kkn_controller.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import '../controllers/posko_kkn_controller.dart';
import '../../../routes/app_routes.dart';

class KelompokKknView extends ConsumerWidget {
  const KelompokKknView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(kelompokKknProvider);
    final notifier = ref.read(kelompokKknProvider.notifier);
    final user = ref.watch(authProvider).user;

    final kel = user?.kelurahan.isNotEmpty == true ? user!.kelurahan : '-';
    final rw = user?.rw.isNotEmpty == true ? user!.rw : '-';
    final kelDisplay = kel.toLowerCase().startsWith('kel') ? kel : 'Kel. $kel';

    final KelompokKknData kelompokData = state.kelompok ?? KelompokKknData(
      groupId: user?.id ?? '',
      groupName: kel != '-' ? 'Kelompok KKN $kel RW $rw' : 'Kelompok KKN',
      poskoLocation: kel != '-' ? 'Posko KKN RW $rw, $kelDisplay' : '-',
      dosenPembimbing: '-',
      totalGroupPoints: 0,
      // Fallback hanya menampilkan user sendiri, tanpa menjadikannya Ketua
      // isLeader=false agar tidak misleading ketika data backend belum dimuat
      members: user != null ? [
        KelompokMemberData(
          userId: user.id,
          nim: user.nim.isNotEmpty ? user.nim : '-',
          name: user.name.isNotEmpty ? user.name : '-',
          jurusan: user.prodi.isNotEmpty ? user.prodi : (user.jurusan.isNotEmpty ? user.jurusan : '-'),
          individualPoints: 0,
          isLeader: false,
        ),
      ] : [],
    );

    // Deduplicate members by userId (bukan name) agar anggota dengan nama mirip tidak di-merge
    final uniqueMembers = <String, KelompokMemberData>{};
    for (final m in kelompokData.members) {
      // Gunakan userId sebagai key utama, fallback ke name jika userId kosong
      final key = m.userId.isNotEmpty ? m.userId : m.name.toLowerCase().trim();
      if (!uniqueMembers.containsKey(key) || m.isLeader) {
        uniqueMembers[key] = m;
      }
    }
    // Pastikan hanya ada satu Ketua (fix double KETUA badge bug)
    bool hasFoundLeader = false;
    final membersToDisplay = <KelompokMemberData>[];

    for (final m in uniqueMembers.values) {
      if (m.isLeader && !hasFoundLeader) {
        membersToDisplay.add(m);
        hasFoundLeader = true;
      } else if (m.isLeader && hasFoundLeader) {
        // Strip leader status dari anggota kedua yang isLeader=true
        membersToDisplay.add(m.copyWith(isLeader: false));
      } else {
        membersToDisplay.add(m);
      }
    }
    // Urutkan: Ketua di atas, sisanya berdasarkan urutan asli
    membersToDisplay.sort((a, b) {
      if (a.isLeader && !b.isLeader) return -1;
      if (!a.isLeader && b.isLeader) return 1;
      return 0;
    });

    final isCurrentUserLeader = user != null && membersToDisplay.any((m) => m.userId == user.id && m.isLeader);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Kelompok KKN',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: AppColors.primaryGreen,
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
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
                        colors: [AppColors.primaryGreen, AppColors.successDark],
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
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.groups_rounded, color: Colors.white, size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    kelompokData.groupName,
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
                                          kelompokData.poskoLocation,
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
                            const Icon(Icons.school_rounded, color: Colors.white, size: 20),
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
                                    kelompokData.dosenPembimbing,
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
                              '${kelompokData.calculatedTotalPoints} Poin',
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryGreen,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Penjumlahan poin individu ${membersToDisplay.length} anggota kelompok',
                              style: const TextStyle(fontSize: 11, color: Colors.black45),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                _buildPoskoCard(context, ref, isCurrentUserLeader),
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
                        '${membersToDisplay.length} Orang',
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
                  itemCount: membersToDisplay.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final member = membersToDisplay[index];
                    final isCurrentUser = user != null && (member.name.toLowerCase().trim() == user.name.toLowerCase().trim());
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
                            if (isCurrentUser)
                              Container(
                                margin: const EdgeInsets.only(left: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryBlue.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
                                ),
                                child: const Text(
                                  'ANDA',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryBlue,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        subtitle: Text(
                          member.nim.isNotEmpty ? member.nim : '-',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
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
                    color: AppColors.primaryBlue.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.2)),
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
  Widget _buildPoskoCard(BuildContext context, WidgetRef ref, bool isCurrentUserLeader) {
    final poskoState = ref.watch(poskoKknProvider);
    final posko = poskoState.poskoResponse?.posko;
    final isLeader = poskoState.poskoResponse?.isUserLeader ?? isCurrentUserLeader;

    if (poskoState.isLoading && posko == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue));
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(color: AppColors.primaryBlue.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.primaryBlue.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: const Icon(Icons.home_work_rounded, color: AppColors.primaryBlue, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Lokasi Posko KKN', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    if (posko != null)
                      Text(
                        posko.statusApproval == 'PENDING' ? 'Menunggu verifikasi RW' : 'Posko Aktif',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: posko.statusApproval == 'PENDING' ? AppColors.warningYellow : AppColors.primaryGreen,
                        ),
                      )
                    else
                      const Text('Belum Didaftarkan', style: TextStyle(fontSize: 12, color: AppColors.dangerRed, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (posko != null) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_rounded, size: 16, color: AppColors.textHint),
                const SizedBox(width: 8),
                Expanded(child: Text(posko.alamat.isNotEmpty ? posko.alamat : 'Alamat tidak tersedia', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary))),
              ],
            ),
            const SizedBox(height: 16),
          ],
          if (isLeader)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => Navigator.pushNamed(context, AppRoutes.registerPosko),
                icon: const Icon(Icons.edit_location_alt_rounded, size: 18),
                label: Text(posko != null ? 'Perbarui Posko' : 'Daftarkan Posko'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primaryBlue,
                  side: const BorderSide(color: AppColors.primaryBlue),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
