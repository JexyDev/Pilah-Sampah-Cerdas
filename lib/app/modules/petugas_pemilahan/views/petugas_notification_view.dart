import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../controllers/petugas_pemilahan_notifikasi_controller.dart';
import 'package:intl/intl.dart';
import '../../../routes/app_routes.dart';

/// Halaman Notifikasi Khusus Petugas Pemilahan Hilir.
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
    'Notifikasi Pengangkutan & Penalti',
  ];

  @override
  Widget build(BuildContext context) {
    final notifAsync = ref.watch(petugasPemilahanNotificationsProvider);
    final markState = ref.watch(markReadProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Notifikasi Petugas Pemilahan',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18, color: AppColors.primaryGreen),
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppColors.primaryGreen),
        elevation: 2,
        shadowColor: Colors.black12,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_rounded, color: AppColors.primaryGreen),
            tooltip: 'Hapus Semua Notifikasi',
            onPressed: markState.isLoading
                ? null
                : () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (c) => AlertDialog(
                        title: const Text('Hapus Semua?'),
                        content: const Text('Apakah Anda yakin ingin menghapus semua notifikasi?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Batal')),
                          TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Hapus')),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      await ref.read(deleteAllProvider.notifier).deleteAll();
                      ref.invalidate(petugasPemilahanNotificationsProvider);
                    }
                  },
          ),
          IconButton(
            icon: const Icon(Icons.done_all_rounded, color: AppColors.primaryGreen),
            tooltip: 'Tandai Semua Dibaca',
            onPressed: markState.isLoading
                ? null
                : () async {
                    await ref.read(markReadProvider.notifier).markAllRead();
                    ref.invalidate(petugasPemilahanNotificationsProvider);
                  },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primaryGreen),
            onPressed: () => ref.invalidate(petugasPemilahanNotificationsProvider),
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
              onRefresh: () async => ref.invalidate(petugasPemilahanNotificationsProvider),
              child: notifAsync.when(skipLoadingOnReload: true, data: (list) {
                  final filteredList = list.where((n) {
                    if (_selectedFilter == 'Semua') return true;
                    final typeUpper = n.type.toUpperCase();
                    final titleLower = n.title.toLowerCase();

                    if (_selectedFilter == 'Input Timbangan') {
                      return typeUpper.contains('TIMBANGAN') || typeUpper.contains('PEMILAHAN') || titleLower.contains('timbangan') || titleLower.contains('pemilahan') || titleLower.contains('log') || typeUpper.contains('POIN');
                    }
                    if (_selectedFilter == 'Notifikasi Pengangkutan & Penalti') {
                      return typeUpper.contains('VIOLATION') ||
                          typeUpper.contains('PENGANGKUTAN') ||
                          titleLower.contains('pelanggaran') ||
                          titleLower.contains('anomali') ||
                          titleLower.contains('penalti') ||
                          titleLower.contains('kpi') ||
                          titleLower.contains('kinerja') ||
                          titleLower.contains('pengangkutan') ||
                          titleLower.contains('jadwal') ||
                          typeUpper.contains('WHITELIST') ||
                          typeUpper.contains('VERIFIKASI') ||
                          titleLower.contains('whitelist') ||
                          titleLower.contains('akun') ||
                          titleLower.contains('tugas');
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
                              Icon(Icons.notifications_off_rounded, size: 56, color: AppColors.textSecondary.withValues(alpha: 0.5)),
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
                      ref.invalidate(petugasPemilahanNotificationsProvider);
                    }
                    if (context.mounted) {
                      if (notif.type.toUpperCase() == 'POIN_BERTAMBAH' || notif.type.toUpperCase() == 'POIN' || notif.type.toUpperCase() == 'PUNISHMENT') {
                        Navigator.pushNamed(context, AppRoutes.poin);
                      } else {
                        Navigator.pushNamed(context, '/detail-notifikasi', arguments: notif);
                      }
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
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: notif.type.toUpperCase().contains('PUNISHMENT') 
                                ? const Color(0xFFFEE2E2) 
                                : (notif.icon == 'star' || notif.type.toUpperCase() == 'POIN_BERTAMBAH')
                                    ? AppColors.warningYellow.withValues(alpha: 0.15)
                                    : AppColors.primaryGreen.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: notif.type.toUpperCase().contains('PUNISHMENT') 
                              ? const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 22)
                              : notif.icon == 'star' || notif.type.toUpperCase() == 'POIN_BERTAMBAH'
                                  ? Padding(
                                      padding: const EdgeInsets.all(10.0),
                                      child: Image.asset('assets/icons/medal.png', color: AppColors.warningYellow),
                                    )
                                  : Icon(
                                      notif.icon == 'scale' ? Icons.scale_rounded : Icons.notifications_rounded,
                                      color: AppColors.primaryGreen,
                                      size: 22,
                                    ),
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
                                _formatDateTime(notif.time),
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

  String _formatDateTime(String? rawStr) {
    if (rawStr == null || rawStr.isEmpty || rawStr == '-') return '';
    try {
      final dt = DateTime.parse(rawStr).toLocal();
      return '${DateFormat('d MMMM yyyy, HH:mm', 'id_ID').format(dt)} WIB';
    } catch (_) {
      return rawStr;
    }
  }
}

