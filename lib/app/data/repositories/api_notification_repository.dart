import 'package:dio/dio.dart';
import '../models/notification_entity.dart';
import 'notification_repository.dart';
import '../providers/api_client.dart';
import '../../core/values/api_constants.dart';

/// Implementasi NotificationRepository yang terhubung ke backend Express.js.
///
/// Endpoint yang digunakan:
///   GET  /api/v1/notifications              — list notifikasi user
///   PUT  /api/v1/notifications/:id/read     — tandai 1 notifikasi dibaca
///   PUT  /api/v1/notifications/read-all     — tandai semua dibaca
///   POST /api/v1/notifications/device-token — simpan FCM token
class ApiNotificationRepository implements NotificationRepository {
  const ApiNotificationRepository({required this.apiClient});

  final ApiClient apiClient;

  // ─── Get Notifications ────────────────────────────────────────────────────
  @override
  Future<List<NotificationEntity>> getNotifications() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.notifications);

      List<NotificationEntity> result = [];
      if (response.statusCode == 200 && response.data != null) {
        final rawData = response.data['data'] ?? response.data['notifications'] ?? response.data;
        if (rawData is List) {
          result = rawData
              .map((json) => _mapNotification(json as Map<String, dynamic>))
              .toList();
        }
      }

      return result;
    } on DioException catch (e) {
      throw NotificationException(
        'NETWORK_ERROR',
        'Gagal memuat notifikasi: ${e.message}',
      );
    } catch (e) {
      if (e is NotificationException) rethrow;
      throw NotificationException('UNKNOWN_ERROR', e.toString());
    }
  }

  // ─── Mark Single Notification Read ───────────────────────────────────────
  @override
  Future<void> markAsRead(String id) async {
    try {
      await apiClient.dio.put(ApiEndpoints.notificationsRead(id));
    } on DioException catch (e) {
      throw NotificationException(
        'NETWORK_ERROR',
        'Gagal menandai notifikasi: ${e.message}',
      );
    }
  }

  // ─── Mark All Read ────────────────────────────────────────────────────────
  @override
  Future<void> markAllAsRead() async {
    try {
      await apiClient.dio.put(ApiEndpoints.notificationsReadAll);
    } on DioException catch (e) {
      throw NotificationException(
        'NETWORK_ERROR',
        'Gagal menandai semua notifikasi: ${e.message}',
      );
    }
  }

  // ─── Delete All Notifications ─────────────────────────────────────────────
  @override
  Future<void> deleteAllNotifications() async {
    try {
      await apiClient.dio.delete('/notifications/all');
    } on DioException catch (e) {
      throw NotificationException(
        'NETWORK_ERROR',
        'Gagal menghapus semua notifikasi: ${e.message}',
      );
    }
  }

  // ─── Register FCM Device Token ────────────────────────────────────────────
  @override
  Future<void> registerDeviceToken(String token) async {
    try {
      await apiClient.dio.post(
        ApiEndpoints.notificationsDeviceToken,
        data: {'token': token},
      );
    } on DioException catch (e) {
      // Non-critical — silently fail, log only
      throw NotificationException(
        'NETWORK_ERROR',
        'Gagal menyimpan device token: ${e.message}',
      );
    }
  }

  // ─── Unregister FCM Device Token ──────────────────────────────────────────
  @override
  Future<void> unregisterDeviceToken(String token) async {
    try {
      await apiClient.dio.post(
        ApiEndpoints.notificationsUnregisterToken,
        data: {'token': token},
      );
    } on DioException catch (e) {
      // Non-critical on logout — log warning only
      throw NotificationException(
        'NETWORK_ERROR',
        'Gagal menghapus device token saat logout: ${e.message}',
      );
    }
  }

  // ─── Helper ───────────────────────────────────────────────────────────────
  NotificationEntity _mapNotification(Map<String, dynamic> json) {
    final rawDesc = json['desc']?.toString() ??
        json['description']?.toString() ??
        json['pesan']?.toString() ??
        json['body']?.toString() ??
        '';

    final rawTitle = json['title']?.toString() ??
        json['judul']?.toString() ??
        json['subject']?.toString() ??
        'Notifikasi Mahasiswa';

    final rawType = json['type']?.toString() ??
        json['kategori']?.toString() ??
        json['category']?.toString() ??
        'INFO';

    // Kita prioritaskan createdAt/timestamp yang biasanya berupa format ISO 8601 yang valid
    final rawCreatedAt = json['createdAt']?.toString() ?? json['timestamp']?.toString() ?? DateTime.now().toUtc().toIso8601String();
    final dt = DateTime.tryParse(rawCreatedAt) ?? DateTime.now();

    final displayTime = json['time']?.toString() ?? 'Baru saja';

    return NotificationEntity(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? json['notificationId']?.toString() ?? '',
      type: rawType,
      title: rawTitle,
      desc: rawDesc,
      isRead: json['isRead'] as bool? ?? json['read'] as bool? ?? json['is_read'] as bool? ?? false,
      time: displayTime,
      icon: json['icon']?.toString() ?? 'info',
      createdAt: dt,
    );
  }
}
