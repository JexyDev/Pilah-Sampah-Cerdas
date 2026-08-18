import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/notification_entity.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';
import '../controllers/mahasiswa_notifikasi_controller.dart';
import 'mahasiswa_poin_view.dart';
import 'package:intl/intl.dart';

/// Halaman Notifikasi Khusus Mahasiswa KKN.
/// Terpisah sepenuhnya dari Halaman Notifikasi Warga & Petugas.
class MahasiswaNotifikasiView extends ConsumerStatefulWidget {
  const MahasiswaNotifikasiView({super.key});

  @override
  ConsumerState<MahasiswaNotifikasiView> createState() => _MahasiswaNotifikasiViewState();
}

class _MahasiswaNotifikasiViewState extends ConsumerState<MahasiswaNotifikasiView> {
  String _selectedFilter = 'Semua';
  final List<String> _filters = [
    'Semua',
    'Poin KKN',
    'Pengajuan Izin',
    'Ping Lokasi Posko',
    'Aktivasi Tempat Sampah Warga',
    'Laporan Pemanfaatan Sampah'
  ];

  @override
  Widget build(BuildContext context) {
    final notifAsync = ref.watch(mahasiswaNotificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      appBar: AppBar(
        title: const Text(
          'Notifikasi KKN Mahasiswa',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: AppColors.primaryGreen,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded, color: Colors.white),
            tooltip: 'Tandai Semua Dibaca',
            onPressed: () async {
              await ref.read(markReadProvider.notifier).markAllRead();
              ref.invalidate(mahasiswaNotificationsProvider);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: () => ref.invalidate(mahasiswaNotificationsProvider),
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
              onRefresh: () async => ref.invalidate(mahasiswaNotificationsProvider),
              color: AppColors.primaryGreen,
              child: notifAsync.when(skipLoadingOnReload: true, data: (list) {
                  // Filter berdasarkan kategori tab chip yang dipilih
                  final filteredList = list.where((n) {
                    if (_selectedFilter == 'Semua') return true;
                    final typeUpper = n.type.toUpperCase();
                    final titleLower = n.title.toLowerCase();

                    if (_selectedFilter == 'Poin KKN') {
                      return typeUpper.contains('POIN') || titleLower.contains('poin');
                    }
                    if (_selectedFilter == 'Pengajuan Izin') {
                      return typeUpper.contains('IZIN') || titleLower.contains('dpl');
                    }
                    if (_selectedFilter == 'Ping Lokasi Posko') {
                      return typeUpper.contains('PRESENSI') || typeUpper.contains('GPS');
                    }
                    if (_selectedFilter == 'Aktivasi Tempat Sampah Warga') {
                      return typeUpper.contains('AKTIVASI') || typeUpper.contains('BIN') || titleLower.contains('bin') || titleLower.contains('aktivasi') || titleLower.contains('tempat sampah');
                    }
                    if (_selectedFilter == 'Laporan Pemanfaatan Sampah') {
                      return typeUpper.contains('LAPORAN') || typeUpper.contains('PEMANFAATAN') || titleLower.contains('laporan') || titleLower.contains('pemanfaatan');
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
                                'Belum Ada Notifikasi Mahasiswa KKN',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Notifikasi persetujuan DPL & presensi akan muncul di sini',
                                style: TextStyle(fontSize: 12, color: AppColors.textHint),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredList.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (ctx, i) {
                      final item = filteredList[i];
                      return _MahasiswaNotificationCard(
                        item: item,
                        onTap: () async {
                          if (!item.isRead) {
                            await ref.read(markReadProvider.notifier).markRead(item.id);
                            ref.invalidate(mahasiswaNotificationsProvider);
                          }
                          if (context.mounted) {
                            if (item.type.toUpperCase() == 'POIN_KKN' || item.type.toUpperCase() == 'PUNISHMENT') {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const MahasiswaPoinView(),
                                ),
                              );
                            } else {
                              Navigator.pushNamed(context, '/detail-notifikasi', arguments: item);
                            }
                          }
                        },
                      );
                    },
                  );
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primaryGreen),
                ),
                error: (err, _) => ListView(
                  children: [
                    const SizedBox(height: 80),
                    Center(
                      child: Column(
                        children: [
                          const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.dangerRed),
                          const SizedBox(height: 12),
                          Text('Gagal Memuat Notifikasi: $err', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen),
                            onPressed: () => ref.invalidate(mahasiswaNotificationsProvider),
                            child: const Text('Coba Lagi', style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MahasiswaNotificationCard extends StatelessWidget {
  const _MahasiswaNotificationCard({
    required this.item,
    required this.onTap,
  });

  final NotificationEntity item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    IconData iconData = Icons.notifications_rounded;
    String? iconAsset;
    Color iconColor = AppColors.primaryGreen;
    Color iconBg = AppColors.primaryGreen.withValues(alpha: 0.1);

    final type = item.type.toUpperCase();
    if (type.contains('PEMANFAATAN') || type.contains('AI') || type.contains('LAPORAN')) {
      iconData = Icons.psychology_rounded;
      iconColor = const Color(0xFF8E24AA);
      iconBg = const Color(0xFF8E24AA).withValues(alpha: 0.12);
    } else if (type.contains('POIN_KKN') || item.title.toLowerCase().contains('poin')) {
      iconData = Icons.stars_rounded;
      iconAsset = 'assets/icons/medal.png';
      iconColor = AppColors.warningOrange;
      iconBg = AppColors.warningOrange.withValues(alpha: 0.15);
    } else if (type.contains('IZIN') || item.title.toLowerCase().contains('dpl') || type.contains('SAKIT') || item.title.toLowerCase().contains('sakit') || item.title.toLowerCase().contains('pengajuan')) {
      iconData = Icons.assignment_turned_in_rounded;
      iconAsset = 'assets/icons/submission.png';
      iconColor = AppColors.primaryBlueDark;
      iconBg = AppColors.primaryBlueDark.withValues(alpha: 0.1);
    } else if (type.contains('PRESENSI')) {
      iconData = Icons.location_on_rounded;
      iconColor = AppColors.primaryGreen;
      iconBg = AppColors.primaryGreen.withValues(alpha: 0.1);
    } else if (type.contains('KELOMPOK')) {
      iconData = Icons.group_rounded;
      iconColor = AppColors.warningOrange;
      iconBg = AppColors.warningOrange.withValues(alpha: 0.1);
    } else if (type.contains('WARGA') || type.contains('BIN') || type.contains('AKTIVASI')) {
      iconData = Icons.qr_code_scanner_rounded;
      iconColor = AppColors.primaryGreen;
      iconBg = AppColors.primaryGreen.withValues(alpha: 0.1);
    }

    return Container(
      decoration: BoxDecoration(
        color: item.isRead ? Colors.white : AppColors.primaryGreen.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: item.isRead ? AppColors.border : AppColors.primaryGreen.withValues(alpha: 0.3),
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(10)),
                  child: iconAsset != null 
                    ? Padding(padding: const EdgeInsets.all(10.0), child: Image.asset(iconAsset, color: iconColor))
                    : Icon(iconData, color: iconColor, size: 22),
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
                              item.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: item.isRead ? FontWeight.w600 : FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          if (!item.isRead)
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
                        item.desc,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _formatDateTime(item.time),
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
        ),
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
