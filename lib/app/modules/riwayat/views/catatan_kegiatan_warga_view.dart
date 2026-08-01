import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/waste_log_entity.dart';
import '../controllers/riwayat_controller.dart';
import '../../shared/widgets/skeleton_loading.dart';
import '../../shared/widgets/empty_state.dart';

/// Halaman Read-Only: "Catatan Kegiatan Pemilahan Sampah" / "Riwayat Kegiatan Warga" (Audit Trail)
/// Dikelompokkan per warga dengan detail per entry:
/// timestamp, identitas warga, kategori, volume Kg, foto bukti, titik lokasi scan.
class CatatanKegiatanWargaView extends ConsumerWidget {
  const CatatanKegiatanWargaView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(wasteLogsProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text('Catatan Kegiatan Pemilahan Sampah'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(wasteLogsProvider),
          ),
        ],
      ),
      body: logsAsync.when(
        data: (logs) {
          if (logs.isEmpty) {
            return const EmptyState(
              message: 'Belum ada catatan kegiatan warga.',
              icon: Icons.history_rounded,
            );
          }

          // Group entries by Warga
          final Map<String, List<WasteLogEntity>> grouped = {};
          for (final log in logs) {
            final key = '${log.wargaName ?? "Warga #${log.userId.substring(0, 6)}"} — ${log.wilayah ?? "RT 01/RW 03"}';
            grouped.putIfAbsent(key, () => []).add(log);
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: grouped.keys.length,
            itemBuilder: (context, index) {
              final citizenHeader = grouped.keys.elementAt(index);
              final citizenLogs = grouped[citizenHeader]!;

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: ExpansionTile(
                  initiallyExpanded: true,
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.primaryGreen,
                    child: Icon(Icons.person_rounded, color: Colors.white, size: 20),
                  ),
                  title: Text(
                    citizenHeader,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  subtitle: Text('${citizenLogs.length} Aktivitas Pemilahan', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  children: citizenLogs.map((entry) {
                    final isOrganik = entry.wasteType.name.toLowerCase().contains('organ');
                    final dateStr = DateFormat('dd MMM yyyy, HH:mm WIB').format(entry.createdAt);

                    return Container(
                      decoration: const BoxDecoration(
                        border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                      ),
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(dateStr, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
                              Chip(
                                label: Text(isOrganik ? 'Organik' : 'Anorganik'),
                                backgroundColor: isOrganik ? const Color(0xFFDCFCE7) : const Color(0xFFE0F2FE),
                                labelStyle: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isOrganik ? const Color(0xFF166534) : const Color(0xFF075985),
                                ),
                                padding: EdgeInsets.zero,
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.scale_rounded, size: 16, color: AppColors.textSecondary),
                              const SizedBox(width: 4),
                              Text('Volume: ${entry.weightKg.toStringAsFixed(1)} Kg', style: const TextStyle(fontSize: 13)),
                              const SizedBox(width: 16),
                              const Icon(Icons.location_on_rounded, size: 16, color: AppColors.dangerRed),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'Titik Lokasi QR: ${entry.location ?? "-6.8915, 107.6107 (Coblong)"}',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            icon: const Icon(Icons.image_outlined, size: 16),
                            label: const Text('Lihat Foto Bukti', style: TextStyle(fontSize: 12)),
                            onPressed: () {
                              showDialog(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: const Text('Foto Bukti Setoran'),
                                  content: Image.network(
                                    entry.photoUrl ?? 'https://via.placeholder.com/300?text=Foto+Bukti+Pemilahan',
                                    errorBuilder: (_, __, ___) => const Icon(Icons.broken_image_rounded, size: 80, color: Colors.grey),
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(ctx),
                                      child: const Text('Tutup'),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              );
            },
          );
        },
        loading: () => const Padding(
          padding: EdgeInsets.all(16),
          child: SkeletonLoading(height: 200, width: double.infinity),
        ),
        error: (_, __) => const EmptyState(
          message: 'Gagal memuat catatan kegiatan warga.',
          icon: Icons.error_outline_rounded,
        ),
      ),
    );
  }
}
