import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification_entity.dart';

/// Service Notifikasi Firebase dengan Persistensi Disk (SharedPreferences).
/// Memastikan setiap notifikasi yang diterima via FCM (Push Notification)
/// atau dipemicu oleh aksi lokal tersimpan secara permanen di memori HP per user & role.
class FirebaseNotificationService {
  static final FirebaseNotificationService _instance =
      FirebaseNotificationService._internal();
  factory FirebaseNotificationService() => _instance;
  FirebaseNotificationService._internal();

  static const String _keyPrefix = 'notif_store_v2_';

  String _normalizeRole(String role) {
    final r = role.toUpperCase().replaceAll('_', '').replaceAll(' ', '');
    if (r.contains('MAHASISWA') || r.contains('KKN')) return 'MAHASISWA';
    if (r.contains('PETUGAS') || r.contains('RESIDU')) return 'PETUGAS';
    if (r.contains('WARGA')) return 'WARGA';
    return r;
  }

  /// Format Storage Key: `notif_store_v2_${userId}_${role}`
  String _getStoreKey(String userId, String role) {
    return '$_keyPrefix${userId}_${_normalizeRole(role)}';
  }

  /// Simpan notifikasi baru ke SharedPreferences disk storage
  Future<void> saveNotification({
    required String userId,
    required String role,
    required String title,
    required String desc,
    required String type,
    String? id,
    String? icon,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storeKey = _getStoreKey(userId, role);
      final rawList = prefs.getStringList(storeKey) ?? [];

      final notifId = id ?? 'fcm_${DateTime.now().millisecondsSinceEpoch}';

      // Cek duplikasi berdasarkan ID
      final existingIds = rawList.map((item) {
        try {
          final json = jsonDecode(item) as Map<String, dynamic>;
          return json['id']?.toString() ?? '';
        } catch (_) {
          return '';
        }
      }).toSet();

      if (existingIds.contains(notifId)) {
        return;
      }

      final newNotifMap = {
        'id': notifId,
        'type': type,
        'title': title,
        'desc': desc,
        'isRead': false,
        'time': 'Baru saja',
        'icon': icon ?? _resolveIcon(type),
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };

      rawList.insert(0, jsonEncode(newNotifMap));

      // Batasi maksimal 100 riwayat notifikasi terbaru per role
      if (rawList.length > 100) {
        rawList.removeRange(100, rawList.length);
      }

      await prefs.setStringList(storeKey, rawList);
      debugPrint('[FirebaseNotifService] Saved notification for $role ($userId): $title');
    } catch (e) {
      debugPrint('[FirebaseNotifService] Error saving notification: $e');
    }
  }

  /// Ambil seluruh riwayat notifikasi tersimpan dari SharedPreferences
  Future<List<NotificationEntity>> getNotifications(String userId, String role) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storeKey = _getStoreKey(userId, role);
      final rawList = prefs.getStringList(storeKey) ?? [];

      final List<NotificationEntity> result = [];
      for (final item in rawList) {
        try {
          final map = jsonDecode(item) as Map<String, dynamic>;
          result.add(NotificationEntity(
            id: map['id']?.toString() ?? '',
            type: map['type']?.toString() ?? 'INFO',
            title: map['title']?.toString() ?? 'Notifikasi',
            desc: map['desc']?.toString() ?? '',
            isRead: map['isRead'] as bool? ?? false,
            time: map['time']?.toString() ?? 'Baru saja',
            icon: map['icon']?.toString() ?? 'info',
          ));
        } catch (e) { debugPrint('Silenced error: $e'); }
      }
      return result;
    } catch (e) {
      debugPrint('[FirebaseNotifService] Error fetching stored notifications: $e');
      return [];
    }
  }

  /// Tandai notifikasi tertentu sebagai sudah dibaca
  Future<void> markAsRead(String userId, String role, String notifId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storeKey = _getStoreKey(userId, role);
      final rawList = prefs.getStringList(storeKey) ?? [];

      final updatedList = rawList.map((item) {
        try {
          final map = jsonDecode(item) as Map<String, dynamic>;
          if (map['id']?.toString() == notifId) {
            map['isRead'] = true;
            return jsonEncode(map);
          }
        } catch (e) { debugPrint('Silenced error: $e'); }
        return item;
      }).toList();

      await prefs.setStringList(storeKey, updatedList);
    } catch (e) {
      debugPrint('[FirebaseNotifService] Error marking read: $e');
    }
  }

  /// Tandai semua notifikasi milik user sebagai sudah dibaca
  Future<void> markAllAsRead(String userId, String role) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final storeKey = _getStoreKey(userId, role);
      final rawList = prefs.getStringList(storeKey) ?? [];

      final updatedList = rawList.map((item) {
        try {
          final map = jsonDecode(item) as Map<String, dynamic>;
          map['isRead'] = true;
          return jsonEncode(map);
        } catch (_) {
          return item;
        }
      }).toList();

      await prefs.setStringList(storeKey, updatedList);
    } catch (e) {
      debugPrint('[FirebaseNotifService] Error marking all read: $e');
    }
  }

  String _resolveIcon(String type) {
    final t = type.toUpperCase();
    if (t.contains('POIN')) return 'star';
    if (t.contains('TONG') || t.contains('KRITIS')) return 'warning';
    if (t.contains('TIMBANGAN') || t.contains('RESIDU')) return 'scale';
    if (t.contains('IZIN') || t.contains('DPL')) return 'assignment_turned_in';
    if (t.contains('PRESENSI')) return 'location_on';
    if (t.contains('AKTIVASI') || t.contains('BIN')) return 'qr_code_scanner';
    return 'info';
  }
}
