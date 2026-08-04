import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/repositories/notification_repository.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/notification_engine.dart';

final Set<String> _shownNotifIds = {};

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
  final list = await repo.getNotifications();

  // Otomatis tampilkan notifikasi belum dibaca dari backend di system notification tray (luar aplikasi / background)
  // Dikunci presisi per ID Mahasiswa & membuang notifikasi Warga jika role adalah Mahasiswa KKN.
  final userId = user.id;
  final isMahasiswa = user.role.name.toUpperCase() == 'MAHASISWAKKN';

  for (final notif in list) {
    final notifKey = '${userId}_${notif.id}';
    final type = notif.type.toUpperCase();
    final title = notif.title.toLowerCase();

    // ❌ CANGGIH: Cegah notifikasi Warga (Pengosongan, Tong Kritis, Setor Sampah) masuk ke System Tray HP Mahasiswa
    if (isMahasiswa) {
      final isWargaNotif = type.contains('POIN_BERTAMBAH') ||
          type.contains('TONG_PENUH') ||
          type.contains('PENGOSONGAN') ||
          type.contains('SETOR') ||
          type.contains('RESIDU') ||
          type.contains('JADWAL') ||
          title.contains('pengosongan') ||
          title.contains('kapasitas tong') ||
          title.contains('setor sampah') ||
          title.contains('poin bertambah') ||
          title.contains('timbangan') ||
          title.contains('jemput') ||
          title.contains('penjemputan') ||
          title.contains('buang sampah');

      if (isWargaNotif) continue;
    }

    if (!notif.isRead && !_shownNotifIds.contains(notifKey)) {
      _shownNotifIds.add(notifKey);
      NotificationEngine().showGenericNotification(
        id: notif.id.hashCode,
        title: notif.title,
        body: notif.desc,
      );
    }
  }

  return list;
});

/// Provider jumlah notifikasi yang belum dibaca (badge count).
final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(notificationsProvider);
  return notifAsync.when(
    data: (list) => list.where((n) => !n.isRead).length,
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
    try {
      await _repo.markAsRead(id);
      // Refresh list supaya badge count dan UI update
      _ref.invalidate(notificationsProvider);
      state = const MarkReadState();
    } on NotificationException catch (e) {
      state = MarkReadState(errorCode: e.code, errorMessage: e.message);
    }
  }

  /// Tandai semua notifikasi sebagai dibaca.
  Future<void> markAllRead() async {
    state = const MarkReadState(isLoading: true);
    try {
      await _repo.markAllAsRead();
      _ref.invalidate(notificationsProvider);
      state = const MarkReadState();
    } on NotificationException catch (e) {
      state = MarkReadState(errorCode: e.code, errorMessage: e.message);
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
