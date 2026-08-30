import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../mahasiswa/controllers/kkn_map_controller.dart';
import '../../mahasiswa/controllers/kelompok_kkn_controller.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import 'multi_posko_form_view.dart';

class MultiPoskoListView extends ConsumerWidget {
  const MultiPoskoListView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mapState = ref.watch(kknMapProvider);
    final user = ref.watch(authProvider).user;
    final kelompokState = ref.watch(kelompokKknProvider);
    final kelompokData = kelompokState.kelompok;
    bool isKetua = false;

    if (user != null && kelompokData != null) {
      final me = kelompokData.members.firstWhere(
        (m) => m.userId == user.id || m.nim == user.nim,
        orElse: () => const KelompokMemberData(
          userId: '',
          nim: '',
          name: '',
          jurusan: '',
          fakultas: '',
          individualPoints: 0,
          isLeader: false,
          statusPenugasanRw: '',
        ),
      );
      isKetua = me.isLeader;
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Daftar Posko KKN',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 18,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: Colors.white,
        shadowColor: Colors.black12,
        surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.refresh_rounded,
              color: AppColors.textPrimary,
            ),
            tooltip: 'Perbarui Data Posko',
            onPressed: () {
              ref.read(kknMapProvider.notifier).fetchWilayahKelompok();
            },
          ),
        ],
      ),
      floatingActionButton: isKetua
          ? SizedBox(
              height: 44,
              child: FloatingActionButton.extended(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MultiPoskoFormView(),
                    ),
                  ).then((_) {
                    ref.read(kknMapProvider.notifier).fetchWilayahKelompok();
                  });
                },
                backgroundColor: AppColors.primaryGreen,
                elevation: 2,
                icon: const Icon(
                  Icons.add_rounded,
                  size: 20,
                  color: Colors.white,
                ),
                label: const Text(
                  'Tambah Posko',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                extendedPadding: const EdgeInsets.symmetric(horizontal: 16),
              ),
            )
          : null,
      body: _buildBody(context, ref, mapState, isKetua),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    KknMapState state,
    bool isKetua,
  ) {
    if (state.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primaryGreen),
      );
    }

    if (state.error != null) {
      return Center(
        child: Text(
          'Error: ${state.error}',
          style: const TextStyle(color: AppColors.dangerRed),
        ),
      );
    }

    final groupZone = state.groupZone;
    if (groupZone == null || groupZone.poskoList.isEmpty) {
      return const Center(
        child: Text(
          'Belum ada data posko',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: groupZone.poskoList.length,
      itemBuilder: (context, index) {
        final posko = groupZone.poskoList[index];
        final isUtama = posko.type == 'POSKO_UTAMA';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        posko.nama,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (isUtama)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primaryGreen.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Utama',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryGreen,
                          ),
                        ),
                      )
                    else if (isKetua)
                      TextButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => MultiPoskoFormView(posko: posko),
                            ),
                          ).then((_) {
                            ref
                                .read(kknMapProvider.notifier)
                                .fetchWilayahKelompok();
                          });
                        },
                        // icon: const Icon(Icons.edit_rounded, size: 16),
                        label: const Text(
                          'Edit Posko',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.warningYellow,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          // backgroundColor: Colors.blue.withValues(alpha: 0.1),
                          // shape: RoundedRectangleBorder(
                          //   borderRadius: BorderRadius.circular(8),
                          // ),
                          // minimumSize: Size.zero,
                          // tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.location_on,
                        size: 16,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Lokasi Posko',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            posko.alamat,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.radar_rounded,
                        size: 16,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Radius Presensi:',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${posko.radius} meter',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
