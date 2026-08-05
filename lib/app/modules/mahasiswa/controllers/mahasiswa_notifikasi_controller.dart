import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/firebase_notification_service.dart';

final Set<String> _mhsShownNotifIds = {};

/// Provider khusus daftar notifikasi Mahasiswa KKN
final mahasiswaNotificationsProvider = FutureProvider<List<NotificationEntity>>((ref) async {
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

    final isPetugasOnly = type.contains('TIMBANGAN_RESIDU') || type.contains('VIOLATION_REPORTED');
    if (isPetugasOnly) continue;
    result.add(notif);

    final notifKey = 'mhs_${userId}_${notif.id}';
    if (!notif.isRead && !_mhsShownNotifIds.contains(notifKey)) {
      _mhsShownNotifIds.add(notifKey);
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

/// Provider jumlah notifikasi belum dibaca untuk Mahasiswa KKN
final mahasiswaUnreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(mahasiswaNotificationsProvider);
  return notifAsync.when(
    data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
