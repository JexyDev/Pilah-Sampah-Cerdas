import 'package:dio/dio.dart';
import '../../../domain/entities/notification_entity.dart';
import '../../../domain/repositories/notification_repository.dart';
import '../network/api_client.dart';

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
      final response = await apiClient.dio.get('/notifications');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        return data
            .map((json) => _mapNotification(json as Map<String, dynamic>))
            .toList();
      }
      return [];
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
      await apiClient.dio.put('/notifications/$id/read');
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
      await apiClient.dio.put('/notifications/read-all');
    } on DioException catch (e) {
      throw NotificationException(
        'NETWORK_ERROR',
        'Gagal menandai semua notifikasi: ${e.message}',
      );
    }
  }

  // ─── Register FCM Device Token ────────────────────────────────────────────
  @override
  Future<void> registerDeviceToken(String token) async {
    try {
      await apiClient.dio.post(
        '/notifications/device-token',
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

  // ─── Helper ───────────────────────────────────────────────────────────────
  NotificationEntity _mapNotification(Map<String, dynamic> json) {
    return NotificationEntity(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'INFO',
      title: json['title']?.toString() ?? '',
      desc: json['desc']?.toString() ?? '',
      isRead: json['isRead'] as bool? ?? false,
      time: json['time']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'info',
    );
  }
}
