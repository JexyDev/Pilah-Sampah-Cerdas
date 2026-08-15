import '../models/notification_entity.dart';

/// Interface repository notifikasi.
/// Implementasi: ApiNotificationRepository (data layer).
abstract class NotificationRepository {
  /// Ambil semua notifikasi milik user yang login.
  /// GET /api/v1/notifications
  Future<List<NotificationEntity>> getNotifications();

  /// Tandai satu notifikasi sebagai sudah dibaca.
  /// PUT /api/v1/notifications/:id/read
  Future<void> markAsRead(String id);

  /// Tandai semua notifikasi sebagai sudah dibaca.
  /// PUT /api/v1/notifications/read-all
  Future<void> markAllAsRead();

  /// Simpan FCM device token ke server.
  /// POST /api/v1/notifications/device-token
  Future<void> registerDeviceToken(String token);

  /// Hapus FCM device token saat user logout.
  /// POST /api/v1/notifications/unregister-token
  Future<void> unregisterDeviceToken(String token);
}

/// Exception khusus notifikasi.
class NotificationException implements Exception {
  const NotificationException(this.code, [this.message]);

  final String code;
  final String? message;

  @override
  String toString() => message != null && message!.isNotEmpty ? message! : 'Gagal memuat notifikasi. Silakan coba beberapa saat lagi.';
}
