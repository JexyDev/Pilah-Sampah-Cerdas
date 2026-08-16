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

  String _normalizeRole(String role) {
    final r = role.toUpperCase().replaceAll('_', '').replaceAll(' ', '');
    if (r.contains('MAHASISWA') || r.contains('KKN')) return 'MAHASISWA';
    if (r.contains('PETUGAS') || r.contains('PEMILAHAN')) return 'PETUGAS';
    if (r.contains('WARGA')) return 'WARGA';
    return r;
  }

  String _getCacheKey(String userId, String role) {
    return '${userId}_${_normalizeRole(role)}';
  }

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
    final key = _getCacheKey(userId, role);
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
    final key = _getCacheKey(userId, role);
    return List.unmodifiable(_cache[key] ?? []);
  }

  final Map<String, Set<String>> _readStatusCache = {};

  /// Tandai semua notifikasi lokal user sebagai dibaca
  void markAllAsRead(String userId, String role) {
    final key = _getCacheKey(userId, role);
    final list = _cache[key];
    
    // Simpan penanda "semua dibaca pada waktu X" atau tandai per item
    if (list != null) {
      _cache[key] = list.map((n) {
        _readStatusCache.putIfAbsent(key, () => {}).add(n.id);
        return n.copyWith(isRead: true);
      }).toList();
    }
    
    // Spesial flag untuk mark all read global
    _readStatusCache.putIfAbsent(key, () => {}).add('ALL_READ_TIMESTAMP_${DateTime.now().millisecondsSinceEpoch}');
  }

  /// Cek apakah suatu ID notifikasi (seperti point_xxx) sudah ditandai dibaca
  bool isRead(String userId, String role, String notifId, [DateTime? notifTime]) {
    final key = _getCacheKey(userId, role);
    final readSet = _readStatusCache[key];
    if (readSet != null) {
      if (readSet.contains(notifId)) return true;
      
      if (notifTime != null) {
        for (final r in readSet) {
          if (r.startsWith('ALL_READ_TIMESTAMP_')) {
            final ts = int.tryParse(r.substring(19));
            if (ts != null && ts >= notifTime.millisecondsSinceEpoch) {
              return true;
            }
          }
        }
      }
    }
    
    // Cek juga list utamanya jika ada
    final list = _cache[key];
    if (list != null) {
      final item = list.firstWhere((n) => n.id == notifId, orElse: () => const NotificationEntity(id: '', type: '', title: '', desc: '', time: '', isRead: false, icon: ''));
      if (item.id.isNotEmpty && item.isRead) return true;
    }
    return false;
  }

  /// Tandai notifikasi lokal sebagai dibaca
  void markAsRead(String userId, String role, String notifId) {
    final key = _getCacheKey(userId, role);
    
    // Simpan ke set read status (untuk notif dinamis seperti point_xxx)
    _readStatusCache.putIfAbsent(key, () => {}).add(notifId);

    final list = _cache[key];
    if (list == null) return;

    _cache[key] = list.map((n) {
      if (n.id == notifId) {
        return n.copyWith(isRead: true);
      }
      return n;
    }).toList();
  }

  /// Reset cache saat logout
  void clear() {
    _cache.clear();
    _readStatusCache.clear();
  }

  String _resolveDefaultIcon(String type) {
    final typeUpper = type.toUpperCase();
    if (typeUpper.contains('POIN')) return 'star';
    if (typeUpper.contains('TONG') || typeUpper.contains('KRITIS')) return 'warning';
    if (typeUpper.contains('TIMBANGAN') || typeUpper.contains('PEMILAHAN')) return 'scale';
    if (typeUpper.contains('IZIN') || typeUpper.contains('DPL')) return 'assignment_turned_in';
    if (typeUpper.contains('PRESENSI')) return 'location_on';
    if (typeUpper.contains('AKTIVASI') || typeUpper.contains('BIN')) return 'qr_code_scanner';
    return 'info';
  }
}

