import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/repositories/notification_repository.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../auth/controllers/auth_controller.dart';

final Set<String> _petugasShownNotifIds = {};

/// Provider khusus daftar notifikasi Petugas Residu Hilir
final petugasResiduNotificationsProvider = FutureProvider<List<NotificationEntity>>((ref) async {
  final repo = ref.watch(notificationRepositoryProvider);
  final user = ref.watch(authProvider).user;
  if (user == null) return [];

  final list = await repo.getNotifications();
  final userId = user.id;
  final List<NotificationEntity> result = [];

  for (final notif in list) {
    final type = notif.type.toUpperCase();
    final title = notif.title.toLowerCase();

    final isPetugasType = type.contains('RESIDU') ||
        type.contains('TIMBANGAN') ||
        type.contains('VIOLATION') ||
        title.contains('timbangan') ||
        title.contains('residu') ||
        title.contains('pelanggaran') ||
        title.contains('sukses');

    if (!isPetugasType) continue;
    result.add(notif);

    final notifKey = 'petugas_${userId}_${notif.id}';
    if (!notif.isRead && !_petugasShownNotifIds.contains(notifKey)) {
      _petugasShownNotifIds.add(notifKey);
      NotificationEngine().showGenericNotification(
        id: notif.id.hashCode,
        title: notif.title,
        body: notif.desc,
      );
    }
  }

  return result;
});

/// Provider jumlah notifikasi belum dibaca untuk Petugas Residu Hilir
final petugasUnreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(petugasResiduNotificationsProvider);
  return notifAsync.when(
    data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
