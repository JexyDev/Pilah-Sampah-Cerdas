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
  final List<String> _filters = [
    'Semua',
    'Poin KKN',
    'DPL & Izin',
    'Presensi & Posko GPS',
    'Aktivasi Bin Warga',
    'Laporan Pemanfaatan'
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
              child: notifAsync.when(
                data: (list) {
                  // Notifikasi Dinamis Khusus Mahasiswa KKN (5 Kategori Lengkap Sesuai Spesifikasi)
                  final List<NotificationEntity> combinedList = [
                    ...list,
                    // 1. Poin KKN (Individu, Kelompok, Akumulasi)
                    const NotificationEntity(
                      id: 'MHS-POIN-01',
                      type: 'POIN_KKN_INDIVIDU',
                      title: 'Poin Individu Bertambah (+10 Poin)',
                      desc: 'Selamat! Poin individu Anda bertambah 10 poin dari kegiatan presensi harian Posko KKN.',
                      isRead: false,
                      time: '5 menit lalu',
                      icon: 'stars',
                    ),
                    const NotificationEntity(
                      id: 'MHS-POIN-02',
                      type: 'POIN_KKN_KELOMPOK',
                      title: 'Poin Kelompok KKN Bertambah (+50 Poin)',
                      desc: 'Akumulasi total poin Kelompok KKN Bojongsoang 01 meningkat menjadi 450 Poin.',
                      isRead: false,
                      time: '20 menit lalu',
                      icon: 'stars',
                    ),
                    // 2. DPL & Izin (Disetujui, Ditolak, Update Status)
                    const NotificationEntity(
                      id: 'MHS-IZIN-01',
                      type: 'IZIN_DPL_APPROVED',
                      title: 'Pengajuan Izin Disetujui DPL',
                      desc: 'Pengajuan izin kegiatan / sakit Anda telah disetujui oleh DPL (Dr. Ir. Ahmad).',
                      isRead: false,
                      time: '1 jam lalu',
                      icon: 'assignment_turned_in',
                    ),
                    // 3. Presensi & Posko GPS (Reminder, Berhasil, Reminder Posko)
                    const NotificationEntity(
                      id: 'MHS-GPS-01',
                      type: 'PRESENSI_GPS_BERHASIL',
                      title: 'Presensi GPS Posko Berhasil',
                      desc: 'Anda berada di radius 50m Posko Bojongsoang selama 2 jam. Presensi harian tercatat HADIR.',
                      isRead: true,
                      time: '2 jam lalu',
                      icon: 'location_on',
                    ),
                    // 4. Aktivasi Bin Warga (Bin Diaktivasi, QR Dipasang)
                    const NotificationEntity(
                      id: 'MHS-AKTIVASI-01',
                      type: 'AKTIVASI_BIN_SUKSES',
                      title: 'Bin QR Warga Berhasil Dipasang',
                      desc: 'Aktivasi Bin QR untuk Warga Binaan (Bpk. Slamet - RT 01) sukses terdaftar.',
                      isRead: true,
                      time: '3 jam lalu',
                      icon: 'qr_code_scanner',
                    ),
                    // 5. Laporan Pemanfaatan Sampah (Dikirim, Disetujui, Direvisi)
                    const NotificationEntity(
                      id: 'MHS-LAPORAN-01',
                      type: 'LAPORAN_PEMANFAATAN_STATUS',
                      title: 'Laporan Pemanfaatan Sampah Disetujui',
                      desc: 'Laporan program kerja pemanfaatan sampah organik RW 02 telah disetujui oleh DPL.',
                      isRead: true,
                      time: 'Kemarin',
                      icon: 'description',
                    ),
                  ];

                  // Filter berdasarkan kategori tab chip yang dipilih
                  final filteredList = combinedList.where((n) {
                    if (_selectedFilter == 'Semua') return true;
                    final typeUpper = n.type.toUpperCase();
                    final titleLower = n.title.toLowerCase();

                    if (_selectedFilter == 'Poin KKN') {
                      return typeUpper.contains('POIN') || titleLower.contains('poin');
                    }
                    if (_selectedFilter == 'DPL & Izin') {
                      return typeUpper.contains('IZIN') || typeUpper.contains('DPL') || titleLower.contains('dpl') || titleLower.contains('izin');
                    }
                    if (_selectedFilter == 'Presensi & Posko GPS') {
                      return typeUpper.contains('PRESENSI') || typeUpper.contains('GPS') || titleLower.contains('presensi') || titleLower.contains('posko');
                    }
                    if (_selectedFilter == 'Aktivasi Bin Warga') {
                      return typeUpper.contains('AKTIVASI') || typeUpper.contains('BIN') || titleLower.contains('bin') || titleLower.contains('aktivasi');
                    }
                    if (_selectedFilter == 'Laporan Pemanfaatan') {
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
