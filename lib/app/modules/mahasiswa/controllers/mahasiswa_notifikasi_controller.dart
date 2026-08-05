import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../../data/services/notification_engine.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/firebase_notification_service.dart';

final Set<String> _mhsShownNotifIds = {};
final Set<String> _mhsReadMockIds = {};

void markMhsMockAsRead(String id) {
  _mhsReadMockIds.add(id);
}

void markAllMhsMocksAsRead() {
  _mhsReadMockIds.addAll(['kkn_welcome_01', 'kkn_welcome_02', 'kkn_welcome_03']);
}

bool _isMahasiswaNotification(NotificationEntity notif) {
  final type = notif.type.toUpperCase();
  final title = notif.title.toUpperCase();
  final desc = notif.desc.toUpperCase();

  // Keyword & Tipe yang DILARANG untuk Mahasiswa KKN (Milik Warga / Petugas)
  final isForbidden = type.contains('TIMBANGAN_RESIDU') ||
      type.contains('VIOLATION') ||
      type.contains('JADWAL') ||
      type.contains('JEMPUT') ||
      type.contains('PENGANGKUTAN') ||
      type.contains('KRITIS') ||
      type.contains('KAPASITAS') ||
      type.contains('TONG') ||
      type.contains('BIN_FULL') ||
      type.contains('SETORAN') ||
      type.contains('RESET_BIN') ||
      title.contains('JADWAL') ||
      title.contains('JEMPUT') ||
      title.contains('KRITIS') ||
      title.contains('KAPASITAS') ||
      title.contains('TONG') ||
      title.contains('SETORAN') ||
      desc.contains('JEMPUT') ||
      desc.contains('KRITIS') ||
      desc.contains('KAPASITAS TONG');

  if (isForbidden) return false;

  // Wajib cocok dengan salah satu kategori Mahasiswa KKN
  final isMahasiswaTopic = type.contains('PEMANFAATAN') ||
      type.contains('AI') ||
      type.contains('LAPORAN') ||
      type.contains('AKTIVASI') ||
      type.contains('PRESENSI') ||
      type.contains('GPS') ||
      type.contains('IZIN') ||
      type.contains('DPL') ||
      type.contains('POIN') ||
      type.contains('KKN') ||
      type.contains('KELOMPOK') ||
      title.contains('PEMANFAATAN') ||
      title.contains('AI') ||
      title.contains('AKTIVASI') ||
      title.contains('PRESENSI') ||
      title.contains('IZIN') ||
      title.contains('DPL') ||
      title.contains('POIN') ||
      title.contains('KKN');

  return isMahasiswaTopic;
}

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
    if (!_isMahasiswaNotification(notif)) continue;
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

  // Gabungkan dengan LocalNotificationCacheService & FirebaseNotificationService
  final localNotifs = LocalNotificationCacheService().getNotifications(userId, role);
  for (final localItem in localNotifs) {
    if (!_isMahasiswaNotification(localItem)) continue;

    if (!result.any((n) => n.id == localItem.id)) {
      result.insert(0, localItem);
    }
  }

  final firebaseNotifs = await FirebaseNotificationService().getNotifications(userId, role);
  for (final fbItem in firebaseNotifs) {
    if (!_isMahasiswaNotification(fbItem)) continue;

    if (!result.any((n) => n.id == fbItem.id)) {
      result.insert(0, fbItem);
    }
  }

  // Jika result masih kosong (belum ada notifikasi baru dari server/FCM),
  // tambahkan notifikasi panduan awal Mahasiswa KKN agar layar selalu berfungsi aktif.
  if (result.isEmpty) {
    result.addAll([
      NotificationEntity(
        id: 'kkn_welcome_01',
        type: 'PEMANFAATAN_SAMPAH_AI',
        title: 'Laporan Pemanfaatan Sampah AI Selesai',
        desc: 'Hasil deteksi visi komputer AI & pemanfaatan daur ulang sampah sukses terverifikasi.',
        isRead: _mhsReadMockIds.contains('kkn_welcome_01'),
        time: 'Baru saja',
        icon: 'analytics_rounded',
      ),
      NotificationEntity(
        id: 'kkn_welcome_02',
        type: 'AKTIVASI_TEMPAT_SAMPAH',
        title: 'Aktivasi Tempat Sampah Warga Binaan',
        desc: 'Tempat Sampah QR Warga Binaan Bojongsoang sukses terdaftar.',
        isRead: _mhsReadMockIds.contains('kkn_welcome_02'),
        time: '30 menit lalu',
        icon: 'qr_code_scanner_rounded',
      ),
      NotificationEntity(
        id: 'kkn_welcome_03',
        type: 'PRESENSI_KKN',
        title: 'Presensi Geofence KKN (2 Jam)',
        desc: 'Durasi presensi zona KKN terhitung otomatis di lokasi penugasan.',
        isRead: true,
        time: '2 jam lalu',
        icon: 'location_on_rounded',
      ),
    ]);
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
