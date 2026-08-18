import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/repositories/notification_repository.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/local_notification_cache_service.dart';
import '../../mahasiswa/controllers/mahasiswa_notifikasi_controller.dart';
import '../../petugas_pemilahan/controllers/petugas_pemilahan_notifikasi_controller.dart';
import '../../../data/services/firebase_notification_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

final Set<String> _shownNotifIds = {};

bool _isWargaNotification(NotificationEntity notif) {
  final type = notif.type.toUpperCase();
  final title = notif.title.toUpperCase();
  final desc = notif.desc.toUpperCase();

  // Pengingat Buang Sampah Pagi (07:00) & Sore (16:00) untuk Warga diperbolehkan
  final isWargaReminder = title.contains('BUANG SAMPAH') || title.contains('PENGINGAT') || type.contains('REMINDER');
  if (isWargaReminder && !title.contains('HARUS DIAMBIL') && !desc.contains('HARUS DIAMBIL')) {
    return true;
  }

  // Dilarang total untuk Warga (Penjemputan Petugas, Mahasiswa KKN & Petugas Pemilahan)
  final isForbidden = type.contains('JEMPUT') ||
      type.contains('PENGANGKUTAN') ||
      type.contains('KKN') ||
      type.contains('DPL') ||
      type.contains('IZIN') ||
      type.contains('PRESENSI') ||
      type.contains('PEMANFAATAN') ||
      type.contains('TIMBANGAN_PEMILAHAN') ||
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

  if (isForbidden) return false;

  // Warga HANYA menerima:
  // 1. Pengajuan Pengosongan (Status disetujui / ditolak dll)
  // 2. Notifikasi Kepenuhan Tong (90%)
  // 3. Poin reward
  // 4. Penalti, Peringatan, Jadwal
  final isWargaTopic = type.contains('TONG_PENUH') ||
      type.contains('PENGAJUAN') ||
      type.contains('POIN') ||
      title.contains('PENUH') ||
      title.contains('TONG') ||
      title.contains('SAMPAH') ||
      title.contains('PENGAJUAN') ||
      title.contains('POIN') ||
      title.contains('PENALTI') ||
      title.contains('PERINGATAN') ||
      title.contains('JADWAL') ||
      desc.contains('SAMPAH') ||
      desc.contains('PENUH') ||
      desc.contains('PENALTI') ||
      desc.contains('JADWAL') ||
      desc.contains('POIN');

  if (isForbidden) return false;

  // Hapus seed notifikasi palsu / dummy lama (seperti seed ORG004520)
  if (notif.id == 'seed-notif-1' || desc.contains('ORG004520')) {
    return false;
  }

  return isWargaTopic;
}

/// Reset cache notifikasi lokal saat logout
void clearNotificationCache() {
  _shownNotifIds.clear();
}

// ─── Notifications List Provider ──────────────────────────────────────────────

/// Provider daftar notifikasi user yang login.
/// Memanggil GET /api/v1/notifications dari backend.
final notificationsProvider =
    FutureProvider<List<NotificationEntity>>((ref) async {
  final repo = ref.watch(notificationRepositoryProvider);
  // Pastikan user sudah login
  final user = ref.watch(authProvider).user;
  if (user == null) return [];
  List<NotificationEntity> list = [];
  try {
    list = await repo.getNotifications();
  } catch (_) {
    list = [];
  }

  // Tambahkan riwayat poin (PointHistory) agar tampil di Notification Page
  try {
    final pointRepo = ref.read(wasteLogRepositoryProvider);
    final pointHistory = await pointRepo.getPointHistoryByUser(user.id);
    
    final prefs = await SharedPreferences.getInstance();
    final readList = prefs.getStringList('read_notifs_${user.id}_${user.role.name}') ?? [];
    final readSet = readList.toSet();
    final markAllTimestamp = prefs.getInt('mark_all_notifs_${user.id}_${user.role.name}') ?? 0;
    
    for (final ph in pointHistory) {
      if (ph.points > 0) {
        final notifId = 'point_${ph.id}';
        final isRead = readSet.contains(notifId) || 
            ph.createdAt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(user.id, user.role.name, notifId);
        
        list.add(NotificationEntity(
          id: notifId,
          type: 'POIN',
          title: 'Poin Bertambah!',
          desc: ph.description.isNotEmpty ? ph.description : 'Anda mendapatkan +${ph.points} poin.',
          isRead: isRead,
          time: ph.createdAt.toLocal().toIso8601String().substring(0, 16).replaceAll('T', ' '),
          icon: 'star',
        ));
      }
    }
  } catch (_) {}

  // Otomatis tampilkan notifikasi belum dibaca dari backend di system notification tray (luar aplikasi / background)
  // Dikunci presisi per ID Mahasiswa & membuang notifikasi Warga jika role adalah Mahasiswa KKN.
  final userId = user.id;
  final roleName = user.role.name;

  final List<NotificationEntity> filteredList = [];

  for (final notif in list) {
    if (!_isWargaNotification(notif)) continue;
    filteredList.add(notif);

    // Otomatis tampilkan di system tray HANYA untuk notifikasi yang lolos filter role user
    final notifKey = '${userId}_${notif.id}';
    if (!notif.isRead && !_shownNotifIds.contains(notifKey)) {
      _shownNotifIds.add(notifKey);
    }
  }

  // Gabungkan dengan LocalNotificationCacheService & FirebaseNotificationService (hanya notifikasi Warga)
  final localNotifs = LocalNotificationCacheService().getNotifications(userId, roleName);
  for (final localItem in localNotifs) {
    if (!_isWargaNotification(localItem)) continue;
    if (!filteredList.any((n) => n.id == localItem.id)) {
      filteredList.insert(0, localItem);
    }
  }

  final firebaseNotifs = await FirebaseNotificationService().getNotifications(userId, roleName);
  for (final fbItem in firebaseNotifs) {
    if (!_isWargaNotification(fbItem)) continue;
    if (!filteredList.any((n) => n.id == fbItem.id)) {
      filteredList.insert(0, fbItem);
    }
  }

  return filteredList;
});

/// Provider jumlah notifikasi yang belum dibaca (badge count).
final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(notificationsProvider);
  return notifAsync.when(skipLoadingOnReload: true, data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});

// ─── Mark As Read (Single) ────────────────────────────────────────────────────

class MarkReadState {
  const MarkReadState({
    this.isLoading = false,
    this.errorCode,
    this.errorMessage,
  });

  final bool isLoading;
  final String? errorCode;
  final String? errorMessage;
}

class MarkReadNotifier extends StateNotifier<MarkReadState> {
  MarkReadNotifier(this._repo, this._ref) : super(const MarkReadState());

  final NotificationRepository _repo;
  final Ref _ref;

  /// Tandai satu notifikasi sebagai dibaca.
  Future<void> markRead(String id) async {
    state = const MarkReadState(isLoading: true);
    final user = _ref.read(authProvider).user;
    if (user != null) {
      LocalNotificationCacheService().markAsRead(user.id, user.role.name, id);
      await FirebaseNotificationService().markAsRead(user.id, user.role.name, id);
      
      final prefs = await SharedPreferences.getInstance();
      final key = 'read_notifs_${user.id}_${user.role.name}';
      final readList = prefs.getStringList(key) ?? [];
      if (!readList.contains(id)) {
        readList.add(id);
        await prefs.setStringList(key, readList);
      }
    }
    try {
      await _repo.markAsRead(id);
    } catch (_) {
      // Abaikan error jika ID notifikasi lokal/mock
    } finally {
      // Invalidate seluruh provider notifikasi agar UI Warga, Mahasiswa, & Petugas langsung ter-update
      _ref.invalidate(notificationsProvider);
      _ref.invalidate(mahasiswaNotificationsProvider);
      _ref.invalidate(petugasPemilahanNotificationsProvider);
      state = const MarkReadState();
    }
  }

  /// Tandai semua notifikasi sebagai dibaca.
  Future<void> markAllRead() async {
    state = const MarkReadState(isLoading: true);
    final user = _ref.read(authProvider).user;
    if (user != null) {
      LocalNotificationCacheService().markAllAsRead(user.id, user.role.name);
      await FirebaseNotificationService().markAllAsRead(user.id, user.role.name);
      
      final prefs = await SharedPreferences.getInstance();
      final key = 'mark_all_notifs_${user.id}_${user.role.name}';
      await prefs.setInt(key, DateTime.now().millisecondsSinceEpoch);
    }
    try {
      await _repo.markAllAsRead();
    } catch (_) {
      // Abaikan error jika backend bermasalah
    } finally {
      // Invalidate seluruh provider notifikasi agar UI Warga, Mahasiswa, & Petugas langsung ter-update
      _ref.invalidate(notificationsProvider);
      _ref.invalidate(mahasiswaNotificationsProvider);
      _ref.invalidate(petugasPemilahanNotificationsProvider);
      state = const MarkReadState();
    }
  }
}

final markReadProvider =
    StateNotifierProvider<MarkReadNotifier, MarkReadState>((ref) {
  return MarkReadNotifier(ref.watch(notificationRepositoryProvider), ref);
});

// ─── Register Device Token ────────────────────────────────────────────────────

/// Kirim FCM token ke backend (fire-and-forget, tidak perlu watch di UI).
Future<void> registerFcmToken(NotificationRepository repo, String token) async {
  try {
    await repo.registerDeviceToken(token);
  } catch (_) {
    // Non-critical — abaikan error, jangan crash app
  }
}

