import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../../../data/models/notification_entity.dart';
import '../../notifikasi/controllers/notifikasi_controller.dart';

/// Provider khusus untuk Notifikasi Mahasiswa KKN
final mahasiswaNotificationsProvider = FutureProvider<List<NotificationEntity>>((ref) async {
  final notifList = await ref.watch(notificationsProvider.future);

  // Filter ketat: Membuang 100% notifikasi khas Warga (Setor Sampah, Tong Penuh)
  return notifList.where((n) {
    final type = n.type.toUpperCase();
    final title = n.title.toLowerCase();

    // ❌ EXCLUDE KETAT NOTIFIKASI WARGA
    final isWargaNotif = type == 'POIN_BERTAMBAH' ||
        type.contains('TONG_PENUH') ||
        type.contains('PENGOSONGAN') ||
        type.contains('SETOR') ||
        type.contains('RESIDU') ||
        type.contains('JADWAL') ||
        title.contains('pengosongan') ||
        title.contains('kapasitas tong') ||
        title.contains('setor sampah') ||
        title.contains('timbangan') ||
        title.contains('jemput') ||
        title.contains('penjemputan') ||
        title.contains('buang sampah');

    if (isWargaNotif) return false;

    // ✅ KHUSUS NOTIFIKASI MAHASISWA KKN (Poin KKN, DPL, Izin, Kelompok, Presensi GPS, Aktivasi Bin Warga)
    final isMahasiswaType = type.contains('KKN') ||
        type.contains('POIN_KKN') ||
        type.contains('IZIN') ||
        type.contains('DPL') ||
        type.contains('PRESENSI') ||
        type.contains('AKTIVASI') ||
        type.contains('PEMANFAATAN') ||
        title.contains('kkn') ||
        title.contains('poin') ||
        title.contains('dpl') ||
        title.contains('izin') ||
        title.contains('sakit') ||
        title.contains('presensi') ||
        title.contains('posko') ||
        title.contains('aktivasi');

    return isMahasiswaType;
  }).toList();
});

/// Halaman Notifikasi Khusus Mahasiswa KKN.
/// Terpisah sepenuhnya dari Halaman Notifikasi Warga & Petugas.
class MahasiswaNotifikasiView extends ConsumerStatefulWidget {
  const MahasiswaNotifikasiView({super.key});

  @override
  ConsumerState<MahasiswaNotifikasiView> createState() => _MahasiswaNotifikasiViewState();
}

class _MahasiswaNotifikasiViewState extends ConsumerState<MahasiswaNotifikasiView> {
  String _selectedFilter = 'Semua';
  final List<String> _filters = ['Semua', 'Poin KKN', 'DPL & Izin', 'Kelompok KKN', 'Presensi GPS', 'Aktivasi Bin'];

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
              child: notifAsync.when(
                data: (list) {
                  // Notifikasi Dinamis Khusus Mahasiswa KKN (Notifikasi Poin & Notifikasi Biasa KKN)
                  final List<NotificationEntity> combinedList = [
                    ...list,
                    // 1. Notifikasi Poin Presensi KKN
                    const NotificationEntity(
                      id: 'MHS-POIN-01',
                      type: 'POIN_KKN_PRESENSI',
                      title: 'Poin Presensi KKN Bertambah (+10 Poin)',
                      desc: 'Selamat! Anda memperoleh 10 Poin KKN setelah menyelesaikan presensi GPS 2 jam di zona Posko KKN Bojongsoang.',
                      isRead: false,
                      time: '5 menit lalu',
                      icon: 'stars',
                    ),
                    // 2. Notifikasi Poin Aktivasi Bin Warga
                    const NotificationEntity(
                      id: 'MHS-POIN-02',
                      type: 'POIN_KKN_AKTIVASI',
                      title: 'Poin Aktivasi Bin Warga (+15 Poin)',
                      desc: 'Selamat! Anda mendapatkan +15 Poin KKN atas keberhasilan mengaktivasi pasang tong QR warga dampingan.',
                      isRead: false,
                      time: '30 menit lalu',
                      icon: 'stars',
                    ),
                    // 3. Notifikasi Status Pengajuan Izin/Sakit DPL
                    const NotificationEntity(
                      id: 'MHS-NOTIF-01',
                      type: 'IZIN_DPL',
                      title: 'Status Pengajuan Izin / Sakit DPL',
                      desc: 'Pengajuan izin kegiatan Anda telah diterima dan diteruskan ke DPL (Dosen Pembimbing Lapangan) untuk diverifikasi.',
                      isRead: false,
                      time: '1 jam lalu',
                      icon: 'assignment_turned_in',
                    ),
                    // 4. Notifikasi Presensi GPS Geofence 2 Jam
                    const NotificationEntity(
                      id: 'MHS-NOTIF-02',
                      type: 'PRESENSI_GPS',
                      title: 'Presensi Kelompok KKN Berhasil',
                      desc: 'Anda telah berada di radius zona posko KKN Bojongsoang selama 2 jam. Status presensi Anda tercatat HADIR.',
                      isRead: true,
                      time: '2 jam lalu',
                      icon: 'location_on',
                    ),
                    // 5. Notifikasi Pembaruan Kelompok & DPL
                    const NotificationEntity(
                      id: 'MHS-NOTIF-03',
                      type: 'KELOMPOK_KKN',
                      title: 'Pembaruan Kelompok KKN',
                      desc: 'Anggota kelompok KKN Bojongsoang 01 & DPL terkait telah diperbarui oleh Super Admin.',
                      isRead: true,
                      time: 'Kemarin',
                      icon: 'group',
                    ),
                  ];

                  // Filter berdasarkan kategori tab chip yang dipilih
                  final filteredList = combinedList.where((n) {
                    if (_selectedFilter == 'Semua') return true;
                    if (_selectedFilter == 'Poin KKN') {
                      return n.type.contains('POIN_KKN') || n.title.toLowerCase().contains('poin');
                    }
                    if (_selectedFilter == 'DPL & Izin') {
                      return n.type.contains('IZIN') || n.title.toLowerCase().contains('dpl') || n.title.toLowerCase().contains('izin');
                    }
                    if (_selectedFilter == 'Kelompok KKN') {
                      return n.type.contains('KELOMPOK') || n.title.toLowerCase().contains('kelompok');
                    }
                    if (_selectedFilter == 'Presensi GPS') {
                      return n.type.contains('PRESENSI') || n.title.toLowerCase().contains('presensi');
                    }
                    if (_selectedFilter == 'Aktivasi Bin') {
                      return n.type.contains('AKTIVASI') || n.title.toLowerCase().contains('warga') || n.title.toLowerCase().contains('bin');
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
    Color iconColor = AppColors.primaryGreen;
    Color iconBg = AppColors.primaryGreen.withValues(alpha: 0.1);

    final type = item.type.toUpperCase();
    if (type.contains('POIN_KKN') || item.title.toLowerCase().contains('poin')) {
      iconData = Icons.stars_rounded;
      iconColor = AppColors.warningOrange;
      iconBg = AppColors.warningOrange.withValues(alpha: 0.15);
    } else if (type.contains('IZIN') || item.title.toLowerCase().contains('dpl')) {
      iconData = Icons.assignment_turned_in_rounded;
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
                  child: Icon(iconData, color: iconColor, size: 22),
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
                        item.time,
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
}
