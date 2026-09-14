import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../controllers/petugas_pemilahan_notifikasi_controller.dart';
import 'package:intl/intl.dart';
import '../../../data/models/notification_entity.dart';
import '../../../routes/app_routes.dart';

/// Halaman Notifikasi Khusus Petugas Pemilahan Hilir.
class PetugasNotificationView extends ConsumerStatefulWidget {
  const PetugasNotificationView({super.key});

  @override
  ConsumerState<PetugasNotificationView> createState() =>
      _PetugasNotificationViewState();
}

class _PetugasNotificationViewState
    extends ConsumerState<PetugasNotificationView> {

  bool _isTimbangan(NotificationEntity n) {
    final t = n.type.toUpperCase();
    final title = n.title.toLowerCase();
    final desc = n.desc.toLowerCase();
    return t.contains('TIMBANGAN') || t.contains('PEMILAHAN') || title.contains('timbangan') || title.contains('pemilahan') || desc.contains('timbangan') || desc.contains('pemilahan');
  }

  bool _isPengosongan(NotificationEntity n) {
    if (_isTimbangan(n)) return false;
    final t = n.type.toUpperCase();
    final title = n.title.toLowerCase();
    final desc = n.desc.toLowerCase();
    return t.contains('PENGOSONGAN') || t.contains('PENGAJUAN') || t.contains('RESET') || t.contains('PENUH') || t.contains('KRITIS') || t.contains('ANGKUT') || title.contains('pengosongan') || title.contains('pengajuan') || title.contains('tempat sampah') || title.contains('kritis') || title.contains('angkut') || title.contains('jadwal') || desc.contains('pengosongan') || desc.contains('pengajuan') || desc.contains('tempat sampah') || desc.contains('angkut');
  }

  bool _isPunishment(NotificationEntity n) {
    if (_isTimbangan(n)) return false;
    final t = n.type.toUpperCase();
    final title = n.title.toLowerCase();
    final desc = n.desc.toLowerCase();
    return t.contains('PUNISHMENT') || title.contains('penalti') || desc.contains('penalti');
  }

  bool _isPoin(NotificationEntity n) {
    if (_isTimbangan(n) || _isPengosongan(n) || _isPunishment(n)) return false;
    final t = n.type.toUpperCase();
    final title = n.title.toLowerCase();
    return t.contains('POIN') || n.icon == 'star' || t == 'POIN_BERTAMBAH' || title.contains('poin');
  }

  String _selectedFilter = 'Semua';
  final List<String> _filters = [
    'Semua',
    'Pengosongan',
    'Timbangan',
  ];

  @override
  Widget build(BuildContext context) {
    final notifAsync = ref.watch(petugasPemilahanNotificationsProvider);
    final markState = ref.watch(markReadProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        titleSpacing: 0,
        leadingWidth: 40,
        title: const FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Text(
            'Notifikasi Petugas',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: AppColors.primaryGreen,
            ),
          ),
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppColors.primaryGreen),
        elevation: 1,
        shadowColor: Colors.black12,
        actions: [
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            icon: const Icon(
              Icons.delete_sweep_rounded,
              color: AppColors.primaryGreen,
              size: 22,
            ),
            tooltip: 'Hapus Semua',
            onPressed: markState.isLoading
                ? null
                : () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (c) => AlertDialog(
                        title: const Text('Hapus Semua?'),
                        content: const Text(
                          'Apakah Anda yakin ingin menghapus semua notifikasi?',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(c, false),
                            child: const Text('Batal'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(c, true),
                            child: const Text('Hapus'),
                          ),
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
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            icon: const Icon(
              Icons.done_all_rounded,
              color: AppColors.primaryGreen,
              size: 22,
            ),
            tooltip: 'Tandai Semua Dibaca',
            onPressed: markState.isLoading
                ? null
                : () async {
                    await ref.read(markReadProvider.notifier).markAllRead();
                    ref.invalidate(petugasPemilahanNotificationsProvider);
                  },
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(6),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            icon: const Icon(
              Icons.refresh_rounded,
              color: AppColors.primaryGreen,
              size: 22,
            ),
            tooltip: 'Segarkan',
            onPressed: () =>
                ref.invalidate(petugasPemilahanNotificationsProvider),
          ),
          const SizedBox(width: 4),
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
                      showCheckmark: false,
                      visualDensity: VisualDensity.compact,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
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
                      side: BorderSide(
                        color: isSel
                            ? AppColors.primaryGreen
                            : AppColors.border,
                      ),
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
              onRefresh: () async =>
                  ref.invalidate(petugasPemilahanNotificationsProvider),
              child: notifAsync.when(
                skipLoadingOnReload: true,
                data: (list) {
                  final filteredList = list.where((n) {
                    if (_selectedFilter == 'Semua') return true;
                    final timbangan = _isTimbangan(n);
                    final pengosongan = _isPengosongan(n);
                    if (_selectedFilter == 'Pengosongan') return pengosongan || _isPoin(n);
                    if (_selectedFilter == 'Timbangan') return timbangan;
                    return true;
                  }).toList();

                  if (filteredList.isEmpty) {
                    return SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: MediaQuery.of(context).size.height * 0.6,
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 36),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.notifications_off_rounded,
                                  size: 56,
                                  color: AppColors.textSecondary.withValues(
                                    alpha: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'Belum Ada Notifikasi Petugas',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Pengajuan pengosongan warga & log timbangan akan muncul di sini.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
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
                            await ref
                                .read(markReadProvider.notifier)
                                .markRead(notif.id);
                            ref.invalidate(
                              petugasPemilahanNotificationsProvider,
                            );
                          }
                          if (context.mounted) {
                            final typeU = notif.type.toUpperCase();
                            final titleL = notif.title.toLowerCase();
                            final descL = notif.desc.toLowerCase();

                            final isTimbangan = typeU.contains('TIMBANGAN') ||
                                typeU.contains('PEMILAHAN') ||
                                titleL.contains('timbangan') ||
                                titleL.contains('pemilahan') ||
                                descL.contains('timbangan') ||
                                descL.contains('pemilahan');

                            final isPengosongan = !isTimbangan &&
                                (typeU.contains('PENGOSONGAN') ||
                                    typeU.contains('PENGAJUAN') ||
                                    typeU.contains('RESET') ||
                                    titleL.contains('pengosongan') ||
                                    titleL.contains('pengajuan') ||
                                    descL.contains('pengosongan') ||
                                    descL.contains('pengajuan'));

                            final isPunishment = !isTimbangan &&
                                (typeU.contains('PUNISHMENT') ||
                                    titleL.contains('penalti') ||
                                    descL.contains('penalti'));

                            final isPoin = !isTimbangan &&
                                !isPengosongan &&
                                !isPunishment &&
                                (typeU.contains('POIN') ||
                                    notif.icon == 'star' ||
                                    typeU == 'POIN_BERTAMBAH' ||
                                    titleL.contains('poin'));

                            // ponytail: route by notification category; upgrade when notification entity has custom payload url.
                            if (isTimbangan) {
                              Navigator.pushNamed(
                                context,
                                AppRoutes.riwayatPetugasPemilahan,
                              );
                            } else if (isPengosongan) {
                              Navigator.pushNamed(
                                context,
                                AppRoutes.pengajuanWarga,
                              );
                            } else if (isPoin || isPunishment) {
                              Navigator.pushNamed(context, AppRoutes.poin);
                            } else {
                              Navigator.pushNamed(
                                context,
                                AppRoutes.riwayatPetugasPemilahan,
                              );
                            }
                          }
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Builder(
                          builder: (context) {
                            final isPengosongan = _isPengosongan(notif);
                            final isPunishment = _isPunishment(notif);
                            final isPoin = _isPoin(notif);

                            final Color categoryBg = isPunishment
                                ? const Color(0xFFFEE2E2)
                                : isPengosongan
                                ? AppColors.warningOrange.withValues(alpha: 0.1)
                                : isPoin
                                ? AppColors.warningYellow.withValues(alpha: 0.15)
                                : AppColors.primaryGreen.withValues(alpha: 0.1);

                            return Container(
                              decoration: BoxDecoration(
                                color: notif.isRead
                                    ? Colors.white
                                    : AppColors.primaryGreen.withValues(alpha: 0.04),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: notif.isRead
                                      ? AppColors.border
                                      : AppColors.primaryGreen.withValues(alpha: 0.3),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.04),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 42,
                                      height: 42,
                                      decoration: BoxDecoration(
                                        color: categoryBg,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: isPunishment
                                          ? const Icon(
                                              Icons.warning_amber_rounded,
                                              color: Color(0xFFEF4444),
                                              size: 22,
                                            )
                                          : isPengosongan
                                          ? const Icon(
                                              Icons.delete_sweep_rounded,
                                              color: AppColors.warningOrange,
                                              size: 22,
                                            )
                                          : isPoin
                                          ? Padding(
                                              padding: const EdgeInsets.all(10.0),
                                              child: Image.asset(
                                                'assets/icons/medal.png',
                                                color: AppColors.warningYellow,
                                              ),
                                            )
                                          : const Icon(
                                              Icons.scale_rounded,
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
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  notif.title,
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    fontWeight: notif.isRead
                                                        ? FontWeight.w600
                                                        : FontWeight.bold,
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
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textSecondary,
                                              height: 1.3,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            '${DateFormat('d MMMM yyyy, HH:mm', 'id_ID').format(notif.createdAt.toLocal())} WIB',
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: AppColors.textHint,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                      },
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
