import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';

import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/firebase_notification_service.dart';
import '../../../data/services/local_notification_cache_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

final Set<String> _petugasShownNotifIds = {};

/// Sanitasi string agar istilah lama 'Residu' digantikan dengan 'Pemilahan' dan istilah terlarang dieliminasi.
String _sanitizePetugasText(String text) {
  if (text.isEmpty) return text;
  return text
      .replaceAll(RegExp(r'Setoran\s+Manual\s+Residu', caseSensitive: false), 'Timbangan Pemilahan')
      .replaceAll(RegExp(r'residu\s+global', caseSensitive: false), 'pemilahan')
      .replaceAll(RegExp(r'timbangan\s+residu', caseSensitive: false), 'timbangan pemilahan')
      .replaceAll(RegExp(r'\bresidu\b', caseSensitive: false), 'pemilahan')
      .replaceAll(RegExp(r'\bResidu\b'), 'Pemilahan')
      .replaceAll(RegExp(r'tong\s+sampah', caseSensitive: false), 'Tempat Sampah')
      .replaceAll(RegExp(r'\btong\b', caseSensitive: false), 'Tempat Sampah');
}

bool _isPetugasPemilahanNotification(NotificationEntity notif) {
  final type = notif.type.toUpperCase();
  final title = notif.title.toUpperCase();
  final desc = notif.desc.toUpperCase();

  // Dilarang total untuk Petugas Pemilahan (Notifikasi Warga / Mahasiswa KKN / Penjemputan)
  final isForbidden =
      type.contains('JEMPUT') ||
      type.contains('KKN') ||
      type.contains('DPL') ||
      type.contains('IZIN') ||
      type.contains('PRESENSI') ||
      type.contains('SETORAN_WARGA') ||
      title.contains('JEMPUT') ||
      title.contains('PENJEMPUTAN') ||
      title.contains('SETORAN WARGA') ||
      desc.contains('JEMPUT') ||
      desc.contains('PENJEMPUTAN');

  if (isForbidden) return false;

  // Petugas Pemilahan menerima notifikasi:
  // 1. Pengajuan Pengosongan dari Warga & Tempat Sampah Kritis / Penuh di RW
  // 2. Input Timbangan Pemilahan & Perolehan Poin
  // 3. Verifikasi Akun / Whitelist
  final isPetugasTopic =
      type.contains('TIMBANGAN') ||
      type.contains('PEMILAHAN') ||
      type.contains('PENGOSONGAN') ||
      type.contains('PENGAJUAN') ||
      type.contains('RESET') ||
      type.contains('PENUH') ||
      type.contains('KRITIS') ||
      type == 'POIN_PETUGAS' ||
      type == 'POIN_BERTAMBAH' ||
      type == 'PUNISHMENT' ||
      type.contains('WHITELIST') ||
      type.contains('VERIFIKASI') ||
      type.contains('WELCOME_PETUGAS') ||
      title.contains('TIMBANGAN') ||
      title.contains('PEMILAHAN') ||
      title.contains('PENGOSONGAN') ||
      title.contains('PENGAJUAN') ||
      title.contains('TEMPAT SAMPAH') ||
      title.contains('KRITIS') ||
      title.contains('PETUGAS') ||
      title.contains('WHITELIST') ||
      title.contains('VERIFIKASI') ||
      title.contains('PENALTI') ||
      title.contains('KPI') ||
      title.contains('KINERJA') ||
      desc.contains('TIMBANGAN') ||
      desc.contains('PEMILAHAN') ||
      desc.contains('PENGOSONGAN') ||
      desc.contains('PENGAJUAN') ||
      desc.contains('TEMPAT SAMPAH') ||
      desc.contains('KPI') ||
      desc.contains('KINERJA') ||
      desc.contains('LOG TIMBANGAN');

  if (!isPetugasTopic) return false;

  // Hapus seed notifikasi palsu / dummy lama
  if (notif.id == 'seed-notif-1' || desc.contains('ORG004520')) {
    return false;
  }
  return true;
}

/// Provider khusus daftar notifikasi Petugas Pemilahan Hilir
final petugasPemilahanNotificationsProvider =
    FutureProvider<List<NotificationEntity>>((ref) async {
      final repo = ref.watch(notificationRepositoryProvider);
      final petugasRepo = ref.watch(petugasPemilahanRepositoryProvider);
      final user = ref.watch(authProvider).user;
      if (user == null) return [];

      final userId = user.id;
      final role = user.role.name;
      List<NotificationEntity> list = [];
      try {
        list = await repo.getNotifications();
      } catch (_) {
        list = [];
      }

      final prefs = await SharedPreferences.getInstance();
      final readList = prefs.getStringList('read_notifs_${userId}_$role') ?? [];
      final readSet = readList.toSet();
      final markAllTimestamp =
          prefs.getInt('mark_all_notifs_${userId}_$role') ?? 0;

      // Ambil pengajuan pengosongan aktif dari warga agar selalu muncul di notifikasi Petugas
      try {
        final pengajuanList = await petugasRepo.getDaftarPengajuanWarga();
        for (final p in pengajuanList) {
          final pId = p['id']?.toString() ?? '';
          if (pId.isEmpty) continue;

          final notifId = 'pengajuan_$pId';
          final createdAtRaw = p['createdAt']?.toString() ?? '';
          final dt = DateTime.tryParse(createdAtRaw) ?? DateTime.now();

          final isRead =
              readSet.contains(notifId) ||
              dt.millisecondsSinceEpoch <= markAllTimestamp ||
              LocalNotificationCacheService().isRead(userId, role, notifId, dt);

          final wargaName =
              (p['wargaName']?.toString().isNotEmpty == true)
                  ? p['wargaName'].toString()
                  : 'Warga';
          final category = p['category']?.toString() ?? 'Organik';
          final binCode = p['binCode']?.toString() ?? '';
          final locationParts = [
            if (p['rtRw'] != null && p['rtRw'].toString().isNotEmpty) p['rtRw'],
            if (p['kelurahan'] != null && p['kelurahan'].toString().isNotEmpty)
              p['kelurahan'],
          ].join(', ');
          final locSuffix = locationParts.isNotEmpty ? ' di $locationParts' : '';
          final codeSuffix = binCode.isNotEmpty ? ' ($binCode)' : '';
          final cleanDesc = _sanitizePetugasText(
            '$wargaName mengajukan pengosongan Tempat Sampah $category$codeSuffix$locSuffix.',
          );

          list.add(
            NotificationEntity(
              id: notifId,
              type: 'PENGAJUAN_PENGOSONGAN',
              title: 'Pengajuan Pengosongan Baru',
              desc: cleanDesc,
              isRead: isRead,
              time: dt
                  .toLocal()
                  .toIso8601String()
                  .substring(0, 16)
                  .replaceAll('T', ' '),
              icon: 'delete_sweep',
              createdAt: dt,
            ),
          );
        }
      } catch (_) {}

      // Tambahkan riwayat poin non-duplikat (PointHistory) agar tampil di Notification Page
      try {
        final pointRepo = ref.read(wasteLogRepositoryProvider);
        final pointHistory = await pointRepo.getPointHistoryByUser(userId);

        for (final ph in pointHistory) {
          if (ph.points != 0) {
            // Hindari duplikasi: log timbangan sudah dibuatkan notifikasi resmi oleh server
            final descLower = ph.description.toLowerCase();
            if (descLower.contains('setoran timbangan') ||
                descLower.contains('log timbangan')) {
              continue;
            }

            final notifId = 'point_${ph.id}';
            final isRead =
                readSet.contains(notifId) ||
                ph.createdAt.millisecondsSinceEpoch <= markAllTimestamp ||
                LocalNotificationCacheService().isRead(
                  userId,
                  role,
                  notifId,
                  ph.createdAt,
                );

            final isPunishment = ph.points < 0;
            final cleanDesc = _sanitizePetugasText(ph.description);

            list.add(
              NotificationEntity(
                id: notifId,
                type: isPunishment ? 'PUNISHMENT' : 'POIN_BERTAMBAH',
                title: isPunishment
                    ? 'Penalti Pengurangan Poin'
                    : 'Poin Insentif Bertambah!',
                desc: cleanDesc.isNotEmpty
                    ? cleanDesc
                    : (isPunishment
                          ? 'Anda mendapatkan penalti ${ph.points} poin.'
                          : 'Anda mendapatkan tambahan +${ph.points} poin.'),
                isRead: isRead,
                time: ph.createdAt
                    .toLocal()
                    .toIso8601String()
                    .substring(0, 16)
                    .replaceAll('T', ' '),
                icon: isPunishment ? 'warning' : 'star',
                createdAt: ph.createdAt,
              ),
            );
          }
        }
      } catch (_) {}

      final List<NotificationEntity> result = [];

      for (final notif in list) {
        if (!_isPetugasPemilahanNotification(notif)) continue;
        if (result.any((n) => n.id == notif.id)) continue;
        result.add(notif);

        final notifKey = 'petugas_${userId}_${notif.id}';
        if (!notif.isRead && !_petugasShownNotifIds.contains(notifKey)) {
          _petugasShownNotifIds.add(notifKey);
        }
      }

      // Ambil notifikasi dari Firebase local storage
      try {
        final firebaseNotifs = await FirebaseNotificationService()
            .getNotifications(userId, role);
        for (final fn in firebaseNotifs) {
          if (result.any(
            (n) =>
                n.id == fn.id ||
                (n.title == fn.title && n.desc == fn.desc && n.type == fn.type),
          )) {
            continue;
          }
          if (!_isPetugasPemilahanNotification(fn)) continue;

          result.add(fn);
        }
      } catch (_) {}

      final deleteAllTimestamp =
          prefs.getInt('delete_all_notifs_${userId}_$role') ?? 0;

      final List<NotificationEntity> finalResult = [];
      for (int i = 0; i < result.length; i++) {
        final dt = result[i].createdAt.toLocal();

        // Skip if deleted
        if (dt.millisecondsSinceEpoch <= deleteAllTimestamp) {
          continue;
        }

        var item = result[i];
        final isReadLocally =
            readSet.contains(item.id) ||
            dt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(userId, role, item.id, dt);

        item = item.copyWith(
          title: _sanitizePetugasText(item.title),
          desc: _sanitizePetugasText(item.desc),
          isRead: isReadLocally ? true : item.isRead,
        );
        finalResult.add(item);
      }

      // Urutkan: terbaru di atas
      finalResult.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      return finalResult;
    });

/// Provider jumlah notifikasi belum dibaca untuk Petugas Pemilahan Hilir
final petugasUnreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(petugasPemilahanNotificationsProvider);
  return notifAsync.when(
    skipLoadingOnReload: true,
    data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
