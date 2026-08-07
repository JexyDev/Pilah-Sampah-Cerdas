import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/providers/repository_providers.dart';

import '../../../data/services/notification_engine.dart';
import '../../../data/services/local_notification_cache_service.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/petugas_residu_notifikasi_controller.dart';

class PetugasResiduFcmService {
  PetugasResiduFcmService(this.ref);

  final Ref ref;

  /// Registrasi FCM Token saat login Petugas Residu
  Future<void> registerFcmToken() async {
    try {
      final messaging = FirebaseMessaging.instance;

      // Minta izin notifikasi (khusus iOS/Android 13+)
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        debugPrint('[PetugasResiduFCM] Permission denied by user');
        return;
      }

      final token = await messaging.getToken();
      if (token != null && token.isNotEmpty) {
        await _sendTokenToBackend(token);
      }

      // Listen perubahan token secara berkala
      messaging.onTokenRefresh.listen((newToken) {
        _sendTokenToBackend(newToken);
      });

      // Meneruskan pesan FCM (Push Notification) yang masuk ke NotificationEngine & Cache
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[PetugasResiduFCM] Menerima pesan di foreground: ${message.messageId}');
        
        final title = message.notification?.title ?? 'Info Petugas';
        final body = message.notification?.body ?? 'Ada pembaruan data';
        final type = (message.data['event']?.toString() ?? message.data['type']?.toString() ?? 'TIMBANGAN_RESIDU').toUpperCase();
        
        final user = ref.read(authProvider).user;
        if (user != null) {
          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: 'PETUGAS_RESIDU',
            title: title,
            desc: body,
            type: type,
            id: message.messageId,
          );
        }

        ref.invalidate(petugasResiduNotificationsProvider);

        NotificationEngine().showGenericNotification(
          id: message.messageId.hashCode,
          title: title,
          body: body,
        );
      });

    } catch (e) {
      debugPrint('[PetugasResiduFCM] Error registering FCM token: $e');
    }
  }

  /// Unregister FCM Token saat logout Petugas Residu
  Future<void> unregisterFcmToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        final apiClient = ref.read(apiClientProvider);
        await apiClient.dio.post(
          '/notifications/fcm-token/unregister',
          data: {
            'fcmToken': token,
            'role': 'PETUGAS_RESIDU',
          },
        );
        debugPrint('[PetugasResiduFCM] Successfully unregistered FCM token');
      }
    } catch (e) {
      debugPrint('[PetugasResiduFCM] Failed to unregister token: $e');
    }
  }

  Future<void> _sendTokenToBackend(String token) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.dio.post(
        '/notifications/device-token',
        data: {
          'token': token,
          'role': 'PETUGAS_RESIDU',
        },
      );
      debugPrint('[PetugasResiduFCM] FCM Token registered: ${token.substring(0, 10)}...');
    } catch (e) {
      debugPrint('[PetugasResiduFCM] Failed to send token to backend: $e');
    }
  }
}

final petugasResiduFcmServiceProvider = Provider<PetugasResiduFcmService>((ref) {
  return PetugasResiduFcmService(ref);
});
