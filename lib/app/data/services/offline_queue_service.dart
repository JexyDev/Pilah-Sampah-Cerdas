import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Antrean offline untuk transaksi timbangan pemilahan.
///
/// Menyimpan transaksi ke SharedPreferences saat offline,
/// lalu flush FIFO saat koneksi kembali.
/// ponytail: upgrade ke SQLite jika perlu query/index per collector
class OfflineQueueService {
  static const _queueKey = 'offline_queue_timbangan_pemilahan';

  /// Tambah transaksi ke antrean offline.
  static Future<void> enqueue(Map<String, dynamic> transaction) async {
    final prefs = await SharedPreferences.getInstance();
    final list = _getQueue(prefs);
    list.add(transaction);
    await prefs.setString(_queueKey, jsonEncode(list));
    debugPrint('[OfflineQueue] Enqueued. Queue size: ${list.length}');
  }

  /// Ambil semua transaksi dalam antrean (FIFO order).
  static Future<List<Map<String, dynamic>>> getAll() async {
    final prefs = await SharedPreferences.getInstance();
    return _getQueue(prefs);
  }

  /// Hapus transaksi pertama (setelah berhasil sync).
  static Future<void> dequeue() async {
    final prefs = await SharedPreferences.getInstance();
    final list = _getQueue(prefs);
    if (list.isNotEmpty) {
      list.removeAt(0);
      await prefs.setString(_queueKey, jsonEncode(list));
    }
  }

  /// Cek apakah ada transaksi menunggu.
  static Future<bool> get hasItems async {
    final prefs = await SharedPreferences.getInstance();
    return _getQueue(prefs).isNotEmpty;
  }

  /// Jumlah item dalam antrean.
  static Future<int> get count async {
    final prefs = await SharedPreferences.getInstance();
    return _getQueue(prefs).length;
  }

  static List<Map<String, dynamic>> _getQueue(SharedPreferences prefs) {
    final raw = prefs.getString(_queueKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      debugPrint('[OfflineQueue] Parse error: $e');
      return [];
    }
  }
}
