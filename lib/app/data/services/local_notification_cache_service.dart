import 'package:flutter/foundation.dart';
import '../models/notification_entity.dart';

/// Service untuk menyimpan dan mengelola riwayat notifikasi lokal per user/role.
/// Memastikan notifikasi yang diterima via FCM (push tray) atau aksi lokal
/// langsung tercatat di Halaman Notification in-app meskipun backend belum menyimpannya.
class LocalNotificationCacheService {
  static final LocalNotificationCacheService _instance =
      LocalNotificationCacheService._internal();
  factory LocalNotificationCacheService() => _instance;
  LocalNotificationCacheService._internal();

  /// Key format: '${userId}_${role}' -> `List<NotificationEntity>`
  final Map<String, List<NotificationEntity>> _cache = {};

  /// Tambah notifikasi baru ke cache lokal user
  void addNotification({
    required String userId,
    required String role,
    required String title,
    required String desc,
    required String type,
    String? id,
    String? icon,
  }) {
    final key = '${userId}_${role.toUpperCase()}';
    final currentList = _cache[key] ?? [];

    final newNotif = NotificationEntity(
      id: id ?? 'local_${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      title: title,
      desc: desc,
      isRead: false,
      time: 'Baru saja',
      icon: icon ?? _resolveDefaultIcon(type),
    );

    // Cek agar tidak terduplikasi berdasarkan ID
    if (!currentList.any((n) => n.id == newNotif.id)) {
      _cache[key] = [newNotif, ...currentList];
      debugPrint('[LocalNotifCache] Notifikasi ditambahkan ke role $role: $title');
    }
  }

  /// Ambil seluruh notifikasi lokal milik user & role tertentu
  List<NotificationEntity> getNotifications(String userId, String role) {
    final key = '${userId}_${role.toUpperCase()}';
    return List.unmodifiable(_cache[key] ?? []);
  }

  /// Tandai notifikasi lokal sebagai dibaca
  void markAsRead(String userId, String role, String notifId) {
    final key = '${userId}_${role.toUpperCase()}';
    final list = _cache[key];
    if (list == null) return;

    _cache[key] = list.map((n) {
      if (n.id == notifId) {
        return n.copyWith(isRead: true);
      }
      return n;
    }).toList();
  }

  /// Tandai semua notifikasi lokal user sebagai dibaca
  void markAllAsRead(String userId, String role) {
    final key = '${userId}_${role.toUpperCase()}';
    final list = _cache[key];
    if (list == null) return;

    _cache[key] = list.map((n) => n.copyWith(isRead: true)).toList();
  }

  /// Reset cache saat logout
  void clear() {
    _cache.clear();
  }

  String _resolveDefaultIcon(String type) {
    final typeUpper = type.toUpperCase();
    if (typeUpper.contains('POIN')) return 'star';
    if (typeUpper.contains('TONG') || typeUpper.contains('KRITIS')) return 'warning';
    if (typeUpper.contains('TIMBANGAN') || typeUpper.contains('RESIDU')) return 'scale';
    if (typeUpper.contains('IZIN') || typeUpper.contains('DPL')) return 'assignment_turned_in';
    if (typeUpper.contains('PRESENSI')) return 'location_on';
    if (typeUpper.contains('AKTIVASI') || typeUpper.contains('BIN')) return 'qr_code_scanner';
    return 'info';
  }
}
