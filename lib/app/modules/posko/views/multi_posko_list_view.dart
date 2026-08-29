import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../mahasiswa/controllers/kkn_map_controller.dart';
import '../../mahasiswa/controllers/kelompok_kkn_controller.dart';
import '../../../data/models/group_zone_models.dart';
import '../../../data/models/mahasiswa_kkn_models.dart';
import 'multi_posko_form_view.dart';
import '../../../data/providers/repository_providers.dart';

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
        orElse: () => const KelompokMemberData(userId: '', nim: '', name: '', jurusan: '', fakultas: '', individualPoints: 0, isLeader: false, statusPenugasanRw: ''),
      );
      isKetua = me.isLeader;
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Daftar Posko KKN',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(kknMapProvider.notifier).fetchWilayahKelompok();
            },
          )
        ],
      ),
      floatingActionButton: isKetua
          ? FloatingActionButton.extended(
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
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text('Tambah Posko', style: TextStyle(color: Colors.white)),
            )
          : null,
      body: _buildBody(context, ref, mapState, isKetua),
    );
  }

  Widget _buildBody(BuildContext context, WidgetRef ref, KknMapState state, bool isKetua) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryGreen));
    }

    if (state.error != null) {
      return Center(
        child: Text('Error: ${state.error}', style: const TextStyle(color: AppColors.dangerRed)),
      );
    }

    final groupZone = state.groupZone;
    if (groupZone == null || groupZone.poskoList.isEmpty) {
      return const Center(
        child: Text('Belum ada data posko', style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: groupZone.poskoList.length,
      itemBuilder: (context, index) {
        final posko = groupZone.poskoList[index];
        final isUtama = posko.type == 'POSKO_UTAMA';

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.blue, size: 20),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => MultiPoskoFormView(posko: posko),
                                ),
                              ).then((_) {
                                ref.read(kknMapProvider.notifier).fetchWilayahKelompok();
                              });
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete, color: AppColors.dangerRed, size: 20),
                            onPressed: () => _confirmDelete(context, ref, posko),
                          ),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on, size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        posko.alamat,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Radius: ${posko.radius} meter',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, PoskoItem posko) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Posko?'),
        content: Text('Apakah Anda yakin ingin menghapus ${posko.nama}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final repo = ref.read(kknRepositoryProvider);
                await repo.deleteMultiPosko(posko.id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Posko berhasil dihapus'), backgroundColor: AppColors.primaryGreen),
                  );
                  ref.read(kknMapProvider.notifier).fetchWilayahKelompok();
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: AppColors.dangerRed),
                  );
                }
              }
            },
            child: const Text('Hapus', style: TextStyle(color: AppColors.dangerRed)),
          ),
        ],
      ),
    );
  }
}
