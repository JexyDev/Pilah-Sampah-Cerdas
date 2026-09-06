import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Wrapper secure storage yang aman untuk platform Web (non-secure context / HTTP IP).
/// Menggunakan SharedPreferences sebagai fallback/utama di platform Web.
class SafeStorage {
  const SafeStorage();

  static const _secureStorage = FlutterSecureStorage();

  Future<String?> read({required String key}) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(key);
    }
    try {
      return await _secureStorage.read(key: key);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(key);
    }
  }

  Future<void> write({required String key, required String value}) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, value);
      return;
    }
    try {
      await _secureStorage.write(key: key, value: value);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, value);
    }
  }

  Future<void> delete({required String key}) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(key);
      return;
    }
    try {
      await _secureStorage.delete(key: key);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(key);
    }
  }

  Future<Map<String, String>> readAll() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final map = <String, String>{};
      for (final k in keys) {
        final val = prefs.getString(k);
        if (val != null) map[k] = val;
      }
      return map;
    }
    try {
      return await _secureStorage.readAll();
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final map = <String, String>{};
      for (final k in keys) {
        final val = prefs.getString(k);
        if (val != null) map[k] = val;
      }
      return map;
    }
  }
}
