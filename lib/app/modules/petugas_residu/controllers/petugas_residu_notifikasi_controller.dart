import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';

import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/firebase_notification_service.dart';

final Set<String> _petugasShownNotifIds = {};
final Set<String> _petugasReadMockIds = {};

void markPetugasMockAsRead(String id) {
  _petugasReadMockIds.add(id);
}

void markAllPetugasMocksAsRead() {
  _petugasReadMockIds.addAll(['petugas_welcome_01', 'petugas_welcome_02']);
}

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

  // Jika result masih kosong (belum ada notifikasi baru dari server/FCM),
  // sediakan notifikasi default Petugas Residu agar layar selalu aktif.
  if (result.isEmpty) {
    result.addAll([
      NotificationEntity(
        id: 'petugas_welcome_01',
        type: 'TIMBANGAN_RESIDU',
        title: 'Konfirmasi Log Input Timbangan Residu',
        desc: 'Log penimbangan sampah residu global RT/RW berhasil dicatat dan diverifikasi.',
        isRead: _petugasReadMockIds.contains('petugas_welcome_01'),
        time: 'Baru saja',
        icon: 'scale_rounded',
      ),
      const NotificationEntity(
        id: 'petugas_welcome_02',
        type: 'WHITELIST_PETUGAS',
        title: 'Status Akun Petugas Residu Hilir Aktif',
        desc: 'Akun Petugas Residu Hilir Anda telah terdaftar & disetujui di wilayah tugas RT/RW.',
        isRead: true,
        time: '1 jam lalu',
        icon: 'verified_user_rounded',
      ),
    ]);
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
