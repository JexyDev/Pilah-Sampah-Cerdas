import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';

import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/firebase_notification_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

final Set<String> _petugasShownNotifIds = {};

bool _isPetugasPemilahanNotification(NotificationEntity notif) {
  final type = notif.type.toUpperCase();
  final title = notif.title.toUpperCase();
  final desc = notif.desc.toUpperCase();
  
  // Dilarang total untuk Petugas Pemilahan (Notifikasi Warga / Mahasiswa KKN / Penjemputan)
  final isForbidden = type.contains('JEMPUT') ||
      type.contains('KKN') ||
      type.contains('DPL') ||
      type.contains('IZIN') ||
      type.contains('PRESENSI') ||
      type.contains('SETORAN_WARGA') ||
      type.contains('RESET_BIN') ||
      title.contains('JEMPUT') ||
      title.contains('PENJEMPUTAN') ||
      title.contains('SETORAN WARGA') ||
      desc.contains('JEMPUT') ||
      desc.contains('PENJEMPUTAN');

  if (isForbidden) return false;

  // Petugas Pemilahan HANYA menerima notifikasi:
  // 1. Input Timbangan Pemilahan (Ke RW/TPS3R)
  // 2. Poin perolehan dari input timbangan
  // 3. Verifikasi Whitelist Akun Petugas
  // 4. Penalti, KPI, Kinerja, Jadwal Pengangkutan
  final isPetugasTopic = type.contains('TIMBANGAN') ||
      type.contains('PEMILAHAN') ||
      type.contains('POIN_PETUGAS') ||
      type.contains('PENGANGKUTAN') ||
      type.contains('WHITELIST') ||
      type.contains('VERIFIKASI') ||
      type.contains('WELCOME_PETUGAS') ||
      title.contains('TIMBANGAN') ||
      title.contains('PEMILAHAN') ||
      title.contains('POIN') ||
      title.contains('PETUGAS') ||
      title.contains('WHITELIST') ||
      title.contains('VERIFIKASI') ||
      title.contains('PENALTI') ||
      title.contains('KPI') ||
      title.contains('KINERJA') ||
      title.contains('JADWAL PENGANGKUTAN') ||
      title.contains('PENGANGKUTAN') ||
      desc.contains('TIMBANGAN') ||
      desc.contains('PEMILAHAN') ||
      desc.contains('KPI') ||
      desc.contains('KINERJA') ||
      desc.contains('LOG TIMBANGAN') ||
      desc.contains('PENGANGKUTAN');

  if (!isPetugasTopic) return false;

  // Hapus seed notifikasi palsu / dummy lama
  if (notif.id == 'seed-notif-1' || desc.contains('ORG004520')) {
    return false;
  }
  return true;
}

/// Provider khusus daftar notifikasi Petugas Pemilahan Hilir
final petugasPemilahanNotificationsProvider = FutureProvider<List<NotificationEntity>>((ref) async {
  final repo = ref.watch(notificationRepositoryProvider);
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

  // Tambahkan riwayat poin (PointHistory) agar tampil di Notification Page sesuai instruksi user
  try {
    final pointRepo = ref.read(wasteLogRepositoryProvider);
    final pointHistory = await pointRepo.getPointHistoryByUser(userId);
    
    final prefs = await SharedPreferences.getInstance();
    final readList = prefs.getStringList('read_notifs_${userId}_$role') ?? [];
    final readSet = readList.toSet();
    final markAllTimestamp = prefs.getInt('mark_all_notifs_${userId}_$role') ?? 0;
    
    for (final ph in pointHistory) {
      if (ph.points != 0) {
        final notifId = 'point_${ph.id}';
        final isRead = readSet.contains(notifId) || 
            ph.createdAt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(userId, role, notifId, ph.createdAt);
            
        final isPunishment = ph.points < 0;
            
        list.add(NotificationEntity(
          id: notifId,
          type: isPunishment ? 'PUNISHMENT' : 'POIN_BERTAMBAH',
          title: isPunishment ? 'Penalti Pengurangan Poin' : 'Poin Insentif Bertambah!',
          desc: ph.description.isNotEmpty ? ph.description : (isPunishment ? 'Anda mendapatkan penalti ${ph.points} poin.' : 'Anda mendapatkan tambahan +${ph.points} poin.'),
          isRead: isRead,
          time: ph.createdAt.toLocal().toIso8601String().substring(0, 16).replaceAll('T', ' '),
          icon: isPunishment ? 'warning' : 'star',
        ));
      }
    }
  } catch (_) {}

  final List<NotificationEntity> result = [];

  for (final notif in list) {
    if (!_isPetugasPemilahanNotification(notif)) continue;
    result.add(notif);

    final notifKey = 'petugas_${userId}_${notif.id}';
    if (!notif.isRead && !_petugasShownNotifIds.contains(notifKey)) {
      _petugasShownNotifIds.add(notifKey);
    }
  }

  // Gabungkan dengan LocalNotificationCacheService & FirebaseNotificationService
  final localNotifs = LocalNotificationCacheService().getNotifications(userId, role);
  for (final localItem in localNotifs) {
    if (!_isPetugasPemilahanNotification(localItem)) continue;

    if (!result.any((n) => n.id == localItem.id)) {
      result.insert(0, localItem);
    }
  }

  final firebaseNotifs = await FirebaseNotificationService().getNotifications(userId, role);
  for (final fbItem in firebaseNotifs) {
    if (!_isPetugasPemilahanNotification(fbItem)) continue;

    if (!result.any((n) => n.id == fbItem.id)) {
      result.insert(0, fbItem);
    }
  }

  return result;
});

/// Provider jumlah notifikasi belum dibaca untuk Petugas Pemilahan Hilir
final petugasUnreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(petugasPemilahanNotificationsProvider);
  return notifAsync.when(skipLoadingOnReload: true, data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});

