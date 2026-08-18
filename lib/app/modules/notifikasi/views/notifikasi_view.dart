import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/notification_entity.dart';
import '../controllers/notifikasi_controller.dart';
import '../controllers/warga_notifikasi_controller.dart';
import '../../shared/widgets/app_loading.dart';
import '../../poin/poin_view.dart';

/// Halaman daftar notifikasi Warga.
class NotifikasiView extends ConsumerStatefulWidget {
  const NotifikasiView({super.key});

  @override
  ConsumerState<NotifikasiView> createState() => _NotifikasiViewState();
}

class _NotifikasiViewState extends ConsumerState<NotifikasiView> {
  String _selectedFilter = 'Semua';
  final List<String> _filters = [
    'Semua',
    'Setoran & Poin',
    'Kapasitas Tempat Sampah',
    'Pengajuan Pengosongan',
    'Pengumuman',
  ];

  @override
  Widget build(BuildContext context) {
    // Listener untuk error marking read
    ref.listen<MarkReadState>(markReadProvider, (previous, next) {
      if (next.errorCode != null && !next.isLoading) {
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage ?? 'Gagal menandai notifikasi'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    });

    final notifAsync = ref.watch(wargaNotificationsProvider);
    final markState = ref.watch(markReadProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Notifikasi Warga',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded, color: Colors.white),
            tooltip: 'Tandai Semua Dibaca',
            onPressed: markState.isLoading
                ? null
                : () async {
                    await ref.read(markReadProvider.notifier).markAllRead();
                    ref.invalidate(wargaNotificationsProvider);
                  },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: () => ref.invalidate(wargaNotificationsProvider),
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
              onRefresh: () async => ref.invalidate(wargaNotificationsProvider),
              color: AppColors.primaryGreen,
              child: notifAsync.when(skipLoadingOnReload: true, loading: () => const AppLoading(message: 'Memuat notifikasi...'),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.wifi_off_rounded,
                        size: 48,
                        color: AppColors.textHint,
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Gagal memuat notifikasi',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () => ref.invalidate(wargaNotificationsProvider),
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                ),
                data: (list) {
                  final filteredList = list.where((n) {
                    if (_selectedFilter == 'Semua') return true;
                    final typeUpper = n.type.toUpperCase();
                    final titleLower = n.title.toLowerCase();

                    if (_selectedFilter == 'Setoran & Poin') {
                      return typeUpper.contains('SETOR') || typeUpper.contains('POIN') || titleLower.contains('setor') || titleLower.contains('poin') || titleLower.contains('sampah');
                    }
                    if (_selectedFilter == 'Kapasitas Tempat Sampah') {
                      return typeUpper.contains('KAPASITAS') || typeUpper.contains('TONG') || typeUpper.contains('PENUH') || titleLower.contains('kapasitas') || titleLower.contains('tong') || titleLower.contains('penuh');
                    }
                    if (_selectedFilter == 'Pengajuan Pengosongan') {
                      return typeUpper.contains('RESET') || typeUpper.contains('PENGOSONGAN') || typeUpper.contains('PENGAJUAN') || titleLower.contains('pengosongan') || titleLower.contains('reset') || titleLower.contains('pengajuan');
                    }
                    if (_selectedFilter == 'Pengumuman') {
                      return typeUpper.contains('INFO') || typeUpper.contains('ANUM') || titleLower.contains('info') || titleLower.contains('pengumuman');
                    }
                    return true;
                  }).toList();

                  if (filteredList.isEmpty) {
                    return ListView(
                      children: const [
                        SizedBox(height: 100),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.notifications_off_outlined, size: 56, color: AppColors.textHint),
                              SizedBox(height: 12),
                              Text(
                                'Belum Ada Notifikasi Warga',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Notifikasi setoran, poin, & pengajuan akan muncul di sini',
                                style: TextStyle(fontSize: 12, color: AppColors.textHint),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: AppDimensions.sm),
                    itemCount: filteredList.length,
                    separatorBuilder: (_, __) => const Divider(
                      height: 1,
                      indent: 72,
                      color: AppColors.divider,
                    ),
                    itemBuilder: (context, index) {
                      final item = filteredList[index];
                      return _NotificationTile(
                        item: item,
                        onTap: () {
                          if (!item.isRead) {
                            ref
                                .read(markReadProvider.notifier)
                                .markRead(item.id);
                            ref.invalidate(wargaNotificationsProvider);
                          }

                          Navigator.pushNamed(
                            context,
                            '/detail-notifikasi',
                            arguments: item,
                          );
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Notification Tile ────────────────────────────────────────────────────────

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.item, required this.onTap});

  final NotificationEntity item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final typeUpper = item.type.toUpperCase();
    final titleUpper = item.title.toUpperCase();
    final isPunishment = typeUpper.contains('PUNISHMENT') || 
                         typeUpper.contains('PENALTI') || 
                         titleUpper.contains('PENALTI') || 
                         titleUpper.contains('TERLEWAT') || 
                         titleUpper.contains('JADWAL BUANG');


    final iconColor = isPunishment ? const Color(0xFFEF4444) : _resolveIconColor(item.type);
    final iconBg = isPunishment ? const Color(0xFFFEE2E2) : _resolveIconBg(item.type);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        color: item.isRead ? Colors.transparent : AppColors.primaryGreen.withValues(alpha: 0.05),
        padding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.md,
          vertical: 14,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Icon Bulat ─────────────────────────────────────────────
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: _buildIconWidget(item.icon, item.type, iconColor),
            ),
            const SizedBox(width: 12),

            // ─── Konten ─────────────────────────────────────────────────
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: item.isRead
                                ? FontWeight.w500
                                : FontWeight.w700,
                            color: isPunishment ? const Color(0xFFEF4444) : AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (!item.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(left: 6),
                          decoration: const BoxDecoration(
                            color: AppColors.primaryGreen,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    item.desc,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.time,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIconWidget(String iconName, String type, Color iconColor) {
    final typeUpper = type.toUpperCase();
    if (typeUpper.contains('PUNISHMENT') || typeUpper.contains('PENALTI')) {
      return Icon(Icons.warning_amber_rounded, color: iconColor, size: 22);
    }
    if (iconName == 'star' || typeUpper == 'POIN_BERTAMBAH') {
      return Padding(
        padding: const EdgeInsets.all(10.0),
        child: Image.asset('assets/icons/medal.png', color: iconColor),
      );
    }
    if (typeUpper.contains('PENGAJUAN') || iconName == 'local_shipping' || iconName == 'rule') {
      return Padding(
        padding: const EdgeInsets.all(10.0),
        child: Image.asset('assets/icons/submission.png', color: iconColor),
      );
    }
    return Icon(_resolveIcon(iconName), color: iconColor, size: 22);
  }

  IconData _resolveIcon(String iconName) {
    switch (iconName) {
      case 'star':
        return Icons.star_rounded;
      case 'warning':
        return Icons.warning_amber_rounded;
      case 'delete_sweep':
        return Icons.delete_sweep_rounded;
      case 'check_circle':
        return Icons.check_circle_rounded;
      case 'local_shipping':
        return Icons.local_shipping_rounded;
      default:
        return Icons.info_rounded;
    }
  }

  Color _resolveIconColor(String type) {
    switch (type) {
      case 'POIN_BERTAMBAH':
        return const Color(0xFFF59E0B); // amber
      case 'TONG_PENUH':
        return const Color(0xFFEF4444); // red
      case 'PENGAJUAN_PENGOSONGAN':
        return const Color(0xFFF97316); // orange
      case 'PENGAJUAN_DISETUJUI':
        return const Color(0xFF10B981); // green
      case 'PENGAJUAN_DITOLAK':
        return const Color(0xFFEF4444);
      default:
        return AppColors.primaryGreen;
    }
  }

  Color _resolveIconBg(String type) {
    switch (type) {
      case 'POIN_BERTAMBAH':
        return const Color(0xFFFEF3C7);
      case 'TONG_PENUH':
        return const Color(0xFFFEE2E2);
      case 'PENGAJUAN_PENGOSONGAN':
        return const Color(0xFFFFEDD5);
      case 'PENGAJUAN_DISETUJUI':
        return const Color(0xFFD1FAE5);
      case 'PENGAJUAN_DITOLAK':
        return const Color(0xFFFEE2E2);
      default:
        return AppColors.primaryGreen.withValues(alpha: 0.1);
    }
  }
}
