import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/notification_entity.dart';
import '../controllers/notifikasi_controller.dart';
import '../controllers/warga_notifikasi_controller.dart';
import '../../shared/widgets/app_loading.dart';
import '../../shared/widgets/empty_state.dart';
import '../../poin/poin_view.dart';

/// Halaman daftar notifikasi Warga.
class NotifikasiView extends ConsumerWidget {
  const NotifikasiView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Listener untuk error marking read
    ref.listen<MarkReadState>(markReadProvider, (previous, next) {
      if (next.errorCode != null && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
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
          'Notifikasi',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        actions: [
          notifAsync.maybeWhen(
            data: (list) {
              final hasUnread = list.any((n) => !n.isRead);
              if (!hasUnread) return const SizedBox.shrink();
              return TextButton(
                onPressed: markState.isLoading
                    ? null
                    : () => ref
                        .read(markReadProvider.notifier)
                        .markAllRead(),
                child: const Text(
                  'Tandai Semua',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsProvider),
        color: AppColors.primaryGreen,
        child: notifAsync.when(
          loading: () => const AppLoading(message: 'Memuat notifikasi...'),
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
                  onPressed: () => ref.invalidate(notificationsProvider),
                  child: const Text('Coba Lagi'),
                ),
              ],
            ),
          ),
          data: (list) {
            if (list.isEmpty) {
              return const EmptyState(
                icon: Icons.notifications_off_outlined,
                message: 'Belum ada notifikasi.\nNotifikasi poin, tempat sampah penuh, dan pengajuan\nakan muncul di sini.',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: AppDimensions.sm),
              itemCount: list.length,
              separatorBuilder: (_, __) => const Divider(
                height: 1,
                indent: 72,
                color: AppColors.divider,
              ),
              itemBuilder: (context, index) {
                return _NotificationTile(
                  item: list[index],
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Membuka detail...'), duration: Duration(milliseconds: 500)),
                    );

                    if (!list[index].isRead) {
                      ref
                          .read(markReadProvider.notifier)
                          .markRead(list[index].id);
                    }
                    
                    final type = list[index].type.toLowerCase();
                    final title = list[index].title.toLowerCase();
                    
                    debugPrint('Tapped Notification - Type: $type, Title: $title');

                    if (type.contains('penuh') || 
                        type.contains('setuju') || 
                        type.contains('tolak') || 
                        title.contains('penuh') || 
                        title.contains('pengajuan') ||
                        title.contains('kritis')) {
                      Navigator.pushNamed(context, '/reset-bin');
                    } else if (type.contains('poin') || 
                               type.contains('punishment') ||
                               type.contains('penalti') ||
                               type.contains('pengurangan') ||
                               title.contains('poin') || 
                               title.contains('penalti') ||
                               title.contains('punishment') ||
                               title.contains('berkurang') ||
                               title.contains('potong') ||
                               title.contains('berhasil') ||
                               title.contains('sukses') ||
                               title.contains('setor') ||
                               title.contains('sampah')) {
                      // Navigate to PoinView
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const PoinView()));
                    } else {
                      // Fallback: Jika tidak terdeteksi, lempar saja ke PoinView agar aman untuk QC
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Fallback Route: Tipe tidak dikenali ($type)')),
                      );
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const PoinView()));
                    }
                  },
                );
              },
            );
          },
        ),
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
    final iconData = _resolveIcon(item.icon);
    final iconColor = _resolveIconColor(item.type);
    final iconBg = _resolveIconBg(item.type);

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
              child: Icon(iconData, color: iconColor, size: 22),
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
                            color: AppColors.textPrimary,
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
