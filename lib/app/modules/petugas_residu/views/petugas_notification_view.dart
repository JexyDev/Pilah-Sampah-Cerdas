import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../controllers/petugas_residu_notifikasi_controller.dart';

/// Halaman Notifikasi Khusus Petugas Residu Hilir.
class PetugasNotificationView extends ConsumerStatefulWidget {
  const PetugasNotificationView({super.key});

  @override
  ConsumerState<PetugasNotificationView> createState() => _PetugasNotificationViewState();
}

class _PetugasNotificationViewState extends ConsumerState<PetugasNotificationView> {
  String _selectedFilter = 'Semua';
  final List<String> _filters = [
    'Semua',
    'Input Timbangan',
    'Pelanggaran & Anomali',
    'Status Whitelist',
  ];

  @override
  Widget build(BuildContext context) {
    final notifAsync = ref.watch(petugasResiduNotificationsProvider);
    final markState = ref.watch(markReadProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Notifikasi Petugas Residu',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreen),
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppColors.primaryGreen),
        elevation: 2,
        shadowColor: Colors.black12,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded, color: AppColors.primaryGreen),
            tooltip: 'Tandai Semua Dibaca',
            onPressed: markState.isLoading
                ? null
                : () async {
                    await ref.read(markReadProvider.notifier).markAllRead();
                    ref.invalidate(petugasResiduNotificationsProvider);
                  },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: () => ref.invalidate(petugasResiduNotificationsProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // ─── Filter Chips Bar ──────────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filters.map((filter) {
                  final isSel = _selectedFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        filter,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                          color: isSel ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      selected: isSel,
                      selectedColor: AppColors.primaryGreen,
                      backgroundColor: AppColors.backgroundCanvas,
                      onSelected: (val) {
                        if (val) setState(() => _selectedFilter = filter);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const Divider(height: 1),

          // ─── Body List Notifikasi ──────────────────────────────────────────
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(petugasResiduNotificationsProvider),
              child: notifAsync.when(
                data: (list) {
                  final filteredList = list.where((n) {
                    if (_selectedFilter == 'Semua') return true;
                    final typeUpper = n.type.toUpperCase();
                    final titleLower = n.title.toLowerCase();

                    if (_selectedFilter == 'Input Timbangan') {
                      return typeUpper.contains('TIMBANGAN') || typeUpper.contains('RESIDU') || titleLower.contains('timbangan') || titleLower.contains('residu') || titleLower.contains('log');
                    }
                    if (_selectedFilter == 'Pelanggaran & Anomali') {
                      return typeUpper.contains('VIOLATION') || typeUpper.contains('PELANGGARAN') || titleLower.contains('pelanggaran') || titleLower.contains('anomali');
                    }
                    if (_selectedFilter == 'Status Whitelist') {
                      return typeUpper.contains('WHITELIST') || typeUpper.contains('VERIFIKASI') || titleLower.contains('whitelist') || titleLower.contains('akun') || titleLower.contains('tugas');
                    }
                    return true;
                  }).toList();

                  if (filteredList.isEmpty) {
                    return SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: MediaQuery.of(context).size.height * 0.6,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.scale_outlined, size: 64, color: AppColors.textSecondary.withValues(alpha: 0.5)),
                              const SizedBox(height: 12),
                              const Text(
                                'Belum Ada Notifikasi Petugas',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Konfirmasi log penimbangan & whitelist akan muncul di sini.',
                                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredList.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final notif = filteredList[index];
                return InkWell(
                  onTap: () async {
                    if (!notif.isRead) {
                      await ref.read(markReadProvider.notifier).markRead(notif.id);
                      ref.invalidate(petugasResiduNotificationsProvider);
                    }
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: notif.isRead ? Colors.white : AppColors.primaryGreen.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: notif.isRead ? AppColors.border : AppColors.primaryGreen.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.scale_rounded, color: AppColors.primaryGreen, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      notif.title,
                                      style: TextStyle(
                                        fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                        fontSize: 14,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                  if (!notif.isRead)
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: AppColors.primaryGreen,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                notif.desc,
                                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                notif.time,
                                style: TextStyle(fontSize: 10, color: AppColors.textSecondary.withValues(alpha: 0.7)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text('Error: $err')),
        ),
      ),
    ),
  ],
),
    );
  }
}
