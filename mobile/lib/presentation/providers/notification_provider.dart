import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/notification_entity.dart';
import '../../domain/repositories/notification_repository.dart';
import 'repository_providers.dart';
import 'auth_provider.dart';

// ─── Notifications List Provider ──────────────────────────────────────────────

/// Provider daftar notifikasi user yang login.
/// Memanggil GET /api/v1/notifications dari backend.
final notificationsProvider =
    FutureProvider<List<NotificationEntity>>((ref) async {
  final repo = ref.watch(notificationRepositoryProvider);
  // Pastikan user sudah login
  final user = ref.watch(authProvider).user;
  if (user == null) return [];
  return repo.getNotifications();
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
  MarkReadNotifier(this._repo) : super(const MarkReadState());

  final NotificationRepository _repo;

  /// Tandai satu notifikasi sebagai dibaca.
  Future<void> markRead(String id, WidgetRef ref) async {
    state = const MarkReadState(isLoading: true);
    try {
      await _repo.markAsRead(id);
      // Refresh list supaya badge count dan UI update
      ref.invalidate(notificationsProvider);
      state = const MarkReadState();
    } on NotificationException catch (e) {
      state = MarkReadState(errorCode: e.code, errorMessage: e.message);
    }
  }

  /// Tandai semua notifikasi sebagai dibaca.
  Future<void> markAllRead(WidgetRef ref) async {
    state = const MarkReadState(isLoading: true);
    try {
      await _repo.markAllAsRead();
      ref.invalidate(notificationsProvider);
      state = const MarkReadState();
    } on NotificationException catch (e) {
      state = MarkReadState(errorCode: e.code, errorMessage: e.message);
    }
  }
}

final markReadProvider =
    StateNotifierProvider<MarkReadNotifier, MarkReadState>((ref) {
  return MarkReadNotifier(ref.watch(notificationRepositoryProvider));
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
