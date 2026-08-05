import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
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
    final title = notif.title.toLowerCase();

    final isKknNotif = type.contains('KKN') ||
        type.contains('POIN_KKN') ||
        type.contains('IZIN') ||
        type.contains('DPL') ||
        type.contains('PRESENSI') ||
        type.contains('AKTIVASI') ||
        title.contains('kkn') ||
        title.contains('dpl') ||
        title.contains('posko') ||
        title.contains('presensi');

    final isPetugasNotif = type.contains('RESIDU') ||
        type.contains('TIMBANGAN') ||
        type.contains('VIOLATION') ||
        title.contains('timbangan') ||
        title.contains('residu') ||
        title.contains('pelanggaran');

    // Warga hanya menerima notifikasi Warga (Setoran, Poin, Bin, Status Terbina)
    if (isKknNotif || isPetugasNotif) continue;
    result.add(notif);

    final notifKey = 'warga_${userId}_${notif.id}';
    if (!notif.isRead && !_wargaShownNotifIds.contains(notifKey)) {
      _wargaShownNotifIds.add(notifKey);
      NotificationEngine().showGenericNotification(
        id: notif.id.hashCode,
        title: notif.title,
        body: notif.desc,
      );
    }
  }

  // Gabungkan dengan LocalNotificationCacheService & FirebaseNotificationService (agar push tray & disk store selalu masuk riwayat)
  final localNotifs = LocalNotificationCacheService().getNotifications(userId, role);
  for (final localItem in localNotifs) {
    if (!result.any((n) => n.id == localItem.id)) {
      result.insert(0, localItem);
    }
  }

  final firebaseNotifs = await FirebaseNotificationService().getNotifications(userId, role);
  for (final fbItem in firebaseNotifs) {
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
