import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../auth/controllers/auth_controller.dart';

final Set<String> _mhsShownNotifIds = {};

/// Provider khusus daftar notifikasi Mahasiswa KKN
final mahasiswaNotificationsProvider = FutureProvider<List<NotificationEntity>>((ref) async {
  final repo = ref.watch(notificationRepositoryProvider);
  final user = ref.watch(authProvider).user;
  if (user == null) return [];

  final list = await repo.getNotifications();
  final userId = user.id;
  final List<NotificationEntity> result = [];

  for (final notif in list) {
    final type = notif.type.toUpperCase();
    final title = notif.title.toLowerCase();

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

    if (!isMahasiswaType) continue;
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
