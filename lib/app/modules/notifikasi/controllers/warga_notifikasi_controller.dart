import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/firebase_notification_service.dart';

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
        type.contains('TIMBANGAN_RESIDU') ||
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
        title.contains('TIMBANGAN RESIDU') ||
        title.contains('WHITELIST') ||
        desc.contains('JEMPUT') ||
        desc.contains('PENGANGKUTAN') ||
        desc.contains('HARUS DIAMBIL') ||
        desc.contains('PRESENSI GEOFENCE') ||
        desc.contains('AKUN PETUGAS');

    if (!isWargaReminder && isForbidden) continue;
    if (notif.id == 'seed-notif-1' || desc.contains('ORG004520')) continue;

    result.add(notif);

    final notifKey = 'warga_${userId}_${notif.id}';
    if (!notif.isRead && !_wargaShownNotifIds.contains(notifKey)) {
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

    if (!result.any((n) => n.id == localItem.id)) {
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

    if (!result.any((n) => n.id == fbItem.id)) {
      result.insert(0, fbItem);
    }
  }

  return result;
});

/// Provider jumlah notifikasi belum dibaca untuk Warga
final wargaUnreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(wargaNotificationsProvider);
  return notifAsync.when(
    data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
