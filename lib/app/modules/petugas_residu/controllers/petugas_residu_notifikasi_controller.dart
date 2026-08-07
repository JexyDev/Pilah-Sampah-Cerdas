import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';

import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/firebase_notification_service.dart';

final Set<String> _petugasShownNotifIds = {};

bool _isPetugasResiduNotification(NotificationEntity notif) {
  final type = notif.type.toUpperCase();
  final title = notif.title.toUpperCase();
  final desc = notif.desc.toUpperCase();

  // Dilarang total untuk Petugas Residu (Notifikasi Warga / Mahasiswa KKN / Penjemputan)
  final isForbidden = type.contains('JADWAL') ||
      type.contains('JEMPUT') ||
      type.contains('PENGANGKUTAN') ||
      type.contains('KKN') ||
      type.contains('DPL') ||
      type.contains('IZIN') ||
      type.contains('PRESENSI') ||
      type.contains('SETORAN_WARGA') ||
      type.contains('RESET_BIN') ||
      title.contains('JADWAL') ||
      title.contains('JEMPUT') ||
      title.contains('PENJEMPUTAN') ||
      title.contains('SETORAN WARGA') ||
      desc.contains('JEMPUT') ||
      desc.contains('PENJEMPUTAN');

  if (isForbidden) return false;

  // Petugas Residu HANYA menerima notifikasi:
  // 1. Input Timbangan Residu (Ke RW/TPS3R)
  // 2. Poin perolehan dari input timbangan
  // 3. Verifikasi Whitelist Akun Petugas
  final isPetugasTopic = type.contains('TIMBANGAN') ||
      type.contains('RESIDU') ||
      type.contains('POIN_PETUGAS') ||
      type.contains('WHITELIST') ||
      type.contains('VERIFIKASI') ||
      type.contains('WELCOME_PETUGAS') ||
      title.contains('TIMBANGAN') ||
      title.contains('RESIDU') ||
      title.contains('POIN') ||
      title.contains('PETUGAS') ||
      title.contains('WHITELIST') ||
      desc.contains('TIMBANGAN') ||
      desc.contains('RESIDU') ||
      desc.contains('LOG TIMBANGAN');

  return isPetugasTopic;
}

/// Provider khusus daftar notifikasi Petugas Residu Hilir
final petugasResiduNotificationsProvider = FutureProvider<List<NotificationEntity>>((ref) async {
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
    if (!_isPetugasResiduNotification(notif)) continue;
    result.add(notif);

    final notifKey = 'petugas_${userId}_${notif.id}';
    if (!notif.isRead && !_petugasShownNotifIds.contains(notifKey)) {
      _petugasShownNotifIds.add(notifKey);
    }
  }

  // Gabungkan dengan LocalNotificationCacheService & FirebaseNotificationService
  final localNotifs = LocalNotificationCacheService().getNotifications(userId, role);
  for (final localItem in localNotifs) {
    if (!_isPetugasResiduNotification(localItem)) continue;

    if (!result.any((n) => n.id == localItem.id)) {
      result.insert(0, localItem);
    }
  }

  final firebaseNotifs = await FirebaseNotificationService().getNotifications(userId, role);
  for (final fbItem in firebaseNotifs) {
    if (!_isPetugasResiduNotification(fbItem)) continue;

    if (!result.any((n) => n.id == fbItem.id)) {
      result.insert(0, fbItem);
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
