import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/firebase_notification_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

final Set<String> _wargaShownNotifIds = {};

/// Provider khusus daftar notifikasi Role Warga
final wargaNotificationsProvider = FutureProvider<List<NotificationEntity>>((ref) async {
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

  final List<NotificationEntity> result = [];

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
            
        result.add(NotificationEntity(
          id: notifId,
          type: isPunishment ? 'PUNISHMENT' : 'POIN_BERTAMBAH',
          title: isPunishment ? 'Penalti Pengurangan Poin' : 'Poin Bertambah!',
          desc: ph.description.isNotEmpty ? ph.description : (isPunishment ? 'Poin Anda dikurangi ${ph.points}.' : 'Anda mendapatkan tambahan +${ph.points} poin.'),
          isRead: isRead,
          time: ph.createdAt.toLocal().toIso8601String().substring(0, 16).replaceAll('T', ' '),
          icon: isPunishment ? 'warning' : 'star',
        ));
      }
    }
  } catch (_) {}

  for (final notif in list) {
    final type = notif.type.toUpperCase();
    final title = notif.title.toUpperCase();
    final desc = notif.desc.toUpperCase();

    final isWargaReminder = title.contains('BUANG SAMPAH') || title.contains('PENGINGAT') || type.contains('REMINDER');
    final isForbidden = type.contains('JEMPUT') ||
        type.contains('PENGANGKUTAN') ||
        type.contains('KKN') ||
        type.contains('DPL') ||
        type.contains('IZIN') ||
        type.contains('PRESENSI') ||
        type.contains('PEMANFAATAN') ||
        type.contains('TIMBANGAN_PEMILAHAN') ||
        type.contains('VIOLATION') ||
        type.contains('PELANGGARAN') ||
        type.contains('WHITELIST') ||
        title.contains('JEMPUT') ||
        title.contains('PENGANGKUTAN') ||
        title.contains('TERDAPAT TEMPAT SAMPAH WARGA') ||
        title.contains('HARUS DIAMBIL') ||
        title.contains('KKN') ||
        title.contains('DPL') ||
        title.contains('PRESENSI') ||
        title.contains('TIMBANGAN PEMILAHAN') ||
        title.contains('WHITELIST') ||
        desc.contains('JEMPUT') ||
        desc.contains('PENGANGKUTAN') ||
        desc.contains('HARUS DIAMBIL') ||
        desc.contains('PRESENSI GEOFENCE') ||
        desc.contains('AKUN PETUGAS');

    if (!isWargaReminder && isForbidden) continue;
    if (notif.id == 'seed-notif-1' || desc.contains('ORG004520')) continue;

    // Deduplikasi
    if (result.any((n) => n.id == notif.id || (n.title == notif.title && n.desc == notif.desc && n.type == notif.type))) continue;

    // Konversi UTC ke Lokal
    NotificationEntity finalNotif = notif;
    if (notif.time.endsWith('Z')) {
      final dt = DateTime.tryParse(notif.time);
      if (dt != null) {
        finalNotif = notif.copyWith(time: dt.toLocal().toIso8601String().substring(0, 16).replaceAll('T', ' '));
      }
    }

    result.add(finalNotif);

    final notifKey = 'warga_${userId}_${finalNotif.id}';
    if (!finalNotif.isRead && !_wargaShownNotifIds.contains(notifKey)) {
      _wargaShownNotifIds.add(notifKey);
    }
  }

  // Gabungkan dengan LocalNotificationCacheService & FirebaseNotificationService (hanya notifikasi Warga & tanpa dummy penjemputan)
  final localNotifs = LocalNotificationCacheService().getNotifications(userId, role);
  for (final localItem in localNotifs) {
    final type = localItem.type.toUpperCase();
    final title = localItem.title.toUpperCase();
    final desc = localItem.desc.toUpperCase();

    if (type.contains('JADWAL') || type.contains('JEMPUT') || type.contains('PENGANGKUTAN') ||
        title.contains('JEMPUT') || title.contains('HARUS DIAMBIL') || desc.contains('HARUS DIAMBIL') ||
        localItem.id == 'seed-notif-1' || localItem.id == 'seed-notif-3' || desc.contains('ORG004520')) {
      continue;
    }

    if (!result.any((n) => n.id == localItem.id || (n.title == localItem.title && n.desc == localItem.desc && n.type == localItem.type))) {
      result.insert(0, localItem);
    }
  }

  final firebaseNotifs = await FirebaseNotificationService().getNotifications(userId, role);
  for (final fbItem in firebaseNotifs) {
    final type = fbItem.type.toUpperCase();
    final title = fbItem.title.toUpperCase();
    final desc = fbItem.desc.toUpperCase();

    if (type.contains('JADWAL') || type.contains('JEMPUT') || type.contains('PENGANGKUTAN') ||
        title.contains('JEMPUT') || title.contains('HARUS DIAMBIL') || desc.contains('HARUS DIAMBIL') ||
        fbItem.id == 'seed-notif-1' || fbItem.id == 'seed-notif-3' || desc.contains('ORG004520')) {
      continue;
    }

    if (!result.any((n) => n.id == fbItem.id || (n.title == fbItem.title && n.desc == fbItem.desc && n.type == fbItem.type))) {
      result.insert(0, fbItem);
    }
  }

  return result;
});

/// Provider jumlah notifikasi belum dibaca untuk Warga
final wargaUnreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(wargaNotificationsProvider);
  return notifAsync.when(skipLoadingOnReload: true, data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});

