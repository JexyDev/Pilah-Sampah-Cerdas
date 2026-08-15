import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/providers/repository_providers.dart';

import '../../../data/services/notification_engine.dart';
import '../../../data/services/local_notification_cache_service.dart';
import '../../auth/controllers/auth_controller.dart';
import '../controllers/petugas_pemilahan_notifikasi_controller.dart';

class PetugasPemilahanFcmService {
  PetugasPemilahanFcmService(this.ref);

  final Ref ref;

  /// Registrasi FCM Token saat login Petugas Pemilahan
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
        debugPrint('[PetugasPemilahanFCM] Permission denied by user');
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
        debugPrint('[PetugasPemilahanFCM] Menerima pesan di foreground: ${message.messageId}');
        
        final title = message.notification?.title ?? 'Info Petugas';
        final body = message.notification?.body ?? 'Ada pembaruan data';
        final type = (message.data['event']?.toString() ?? message.data['type']?.toString() ?? 'TIMBANGAN_PEMILAHAN').toUpperCase();
        
        final user = ref.read(authProvider).user;
        if (user != null) {
          LocalNotificationCacheService().addNotification(
            userId: user.id,
            role: 'PETUGAS_PEMILAHAN',
            title: title,
            desc: body,
            type: type,
            id: message.messageId,
          );
        }

        ref.invalidate(petugasPemilahanNotificationsProvider);

        NotificationEngine().showGenericNotification(
          id: message.messageId.hashCode,
          title: title,
          body: body,
        );
      });

    } catch (e) {
      debugPrint('[PetugasPemilahanFCM] Error registering FCM token: $e');
    }
  }

  /// Unregister FCM Token saat logout Petugas Pemilahan
  Future<void> unregisterFcmToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        final apiClient = ref.read(apiClientProvider);
        await apiClient.dio.post(
          '/notifications/fcm-token/unregister',
          data: {
            'fcmToken': token,
            'role': 'PETUGAS_PEMILAHAN',
          },
        );
        debugPrint('[PetugasPemilahanFCM] Successfully unregistered FCM token');
      }
    } catch (e) {
      debugPrint('[PetugasPemilahanFCM] Failed to unregister token: $e');
    }
  }

  Future<void> _sendTokenToBackend(String token) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.dio.post(
        '/notifications/device-token',
        data: {
          'token': token,
          'role': 'PETUGAS_PEMILAHAN',
        },
      );
      debugPrint('[PetugasPemilahanFCM] FCM Token registered: ${token.substring(0, 10)}...');
    } catch (e) {
      debugPrint('[PetugasPemilahanFCM] Failed to send token to backend: $e');
    }
  }
}

final petugasPemilahanFcmServiceProvider = Provider<PetugasPemilahanFcmService>((ref) {
  return PetugasPemilahanFcmService(ref);
});

