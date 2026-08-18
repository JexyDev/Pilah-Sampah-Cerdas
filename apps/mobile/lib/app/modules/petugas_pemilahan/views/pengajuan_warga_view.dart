import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../controllers/petugas_pemilahan_controller.dart';

/// Halaman dedicated Pengajuan Pengosongan Tempat Sampah dari Warga.
class PengajuanWargaView extends ConsumerWidget {
  const PengajuanWargaView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(petugasPemilahanControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primaryGreen,
        elevation: 1,
        shadowColor: Colors.black12,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Pengajuan Pengosongan',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
            ),
            Text(
              '${state.pengajuanList.length} antrean dari warga',
              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primaryGreen),
            onPressed: () => ref.read(petugasPemilahanControllerProvider.notifier).refreshAll(),
            tooltip: 'Refresh data',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(petugasPemilahanControllerProvider.notifier).refreshAll(),
        color: AppColors.primaryGreen,
        child: state.isLoading && state.pengajuanList.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.pengajuanList.isEmpty
                ? _buildEmptyState()
                : ListView.separated(
                    padding: const EdgeInsets.all(AppDimensions.md),
                    itemCount: state.pengajuanList.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (ctx, idx) {
                      final pengajuan = state.pengajuanList[idx];
                      return _buildPengajuanCard(context, ref, pengajuan);
                    },
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_rounded, size: 72, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            'Belum Ada Pengajuan',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            'Belum ada pengajuan pengosongan\ntempat sampah dari warga di wilayah RW Anda.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade500, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildPengajuanCard(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> pengajuan,
  ) {
    final wargaName = pengajuan['wargaName'] ?? 'Warga';
    final pengajuanId = pengajuan['id'] ?? '';
    final alasan = pengajuan['alasan'] ?? 'Pengajuan pengosongan bin penuh';
    final binCode = pengajuan['binCode'] ?? '-';
    final alamat = pengajuan['address'] ?? pengajuan['alamat'] ?? '';
    final createdAt = pengajuan['createdAt'] ?? '';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.warningOrange.withValues(alpha: 0.07),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.warningOrange,
                  child: Icon(Icons.person_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        wargaName,
                        style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary,
                        ),
                      ),
                      if (alamat.isNotEmpty)
                        Text(
                          alamat,
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.warningOrange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'MENUNGGU',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),

          // Detail
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDetailRow(Icons.delete_rounded, 'Kode Bin', binCode),
                const SizedBox(height: 8),
                _buildDetailRow(Icons.notes_rounded, 'Keterangan', alasan),
                if (createdAt.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _buildDetailRow(Icons.access_time_rounded, 'Waktu Pengajuan', createdAt),
                ],
                const SizedBox(height: 16),

                // Tombol Terima
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final ok = await ref
                          .read(petugasPemilahanControllerProvider.notifier)
                          .claimPengajuanReset(pengajuanId);
                      if (context.mounted) {
                        final errorMsg = ref.read(petugasPemilahanControllerProvider).errorMessage;
                        ScaffoldMessenger.of(context).clearSnackBars();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(ok
                                ? 'Pengajuan berhasil diterima & siap diproses!'
                                : (errorMsg ?? 'Gagal memproses pengajuan.')),
                            backgroundColor: ok ? AppColors.primaryGreen : AppColors.dangerRed,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.check_circle_rounded, size: 18),
                    label: const Text(
                      'Terima & Proses Sekarang',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
          ),
        ),
      ],
    );
  }
}
