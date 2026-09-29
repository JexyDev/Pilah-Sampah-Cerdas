import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/providers/repository_providers.dart';

import '../../../core/values/api_constants.dart';

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

      // ponytail: FCM foreground listener sudah terpusat di main.dart; tidak perlu listener dobel di sini
      debugPrint('[PetugasPemilahanFCM] Token registered. Foreground listener handled by main.dart.');
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
          ApiEndpoints.notificationsUnregisterToken,
          data: {'token': token, 'fcmToken': token, 'role': 'PETUGAS_PEMILAHAN'},
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
        ApiEndpoints.notificationsDeviceToken,
        data: {'token': token, 'role': 'PETUGAS_PEMILAHAN'},
      );
      debugPrint(
        '[PetugasPemilahanFCM] FCM Token registered: ${token.substring(0, 10)}...',
      );
    } catch (e) {
      debugPrint('[PetugasPemilahanFCM] Failed to send token to backend: $e');
    }
  }
}

final petugasPemilahanFcmServiceProvider = Provider<PetugasPemilahanFcmService>(
  (ref) {
    return PetugasPemilahanFcmService(ref);
  },
);
