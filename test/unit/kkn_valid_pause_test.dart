import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/mahasiswa_kkn_models.dart';

void main() {
  group('calculateValidPauseMinutes & JedaLog Tests', () {
    test('Mengabaikan log jeda yang autoTriggered: true atau memuat Logout', () {
      final now = DateTime.now();
      final logs = [
        // Jeda manual resmi 15 menit
        JedaLog(
          waktuJeda: now.subtract(const Duration(minutes: 60)),
          waktuResume: now.subtract(const Duration(minutes: 45)),
          alasan: 'Istirahat makan siang',
          autoTriggered: false,
        ),
        // Jeda otomatis akibat sistem logout (harus diabaikan)
        JedaLog(
          waktuJeda: now.subtract(const Duration(minutes: 40)),
          waktuResume: now.subtract(const Duration(minutes: 10)),
          alasan: 'Pengguna Keluar / Logout Aplikasi',
          autoTriggered: true,
        ),
        // Jeda dengan kata 'LOGOUT' pada alasan (harus diabaikan)
        JedaLog(
          waktuJeda: now.subtract(const Duration(minutes: 30)),
          waktuResume: now.subtract(const Duration(minutes: 15)),
          alasan: 'LOGOUT',
          autoTriggered: false,
        ),
      ];

      final validPause = calculateValidPauseMinutes(logs);
      // Hanya jeda manual pertama (15 menit) yang dihitung
      expect(validPause, 15);
    });

    test('Memproses format Map/JSON dari respons API dengan filter logout', () {
      final now = DateTime.now();
      final rawLogs = [
        {
          'waktuJeda': now.subtract(const Duration(minutes: 100)).toIso8601String(),
          'waktuResume': now.subtract(const Duration(minutes: 80)).toIso8601String(),
          'alasan': 'Salat Ashar',
          'autoTriggered': false,
        },
        {
          'waktuJeda': now.subtract(const Duration(minutes: 70)).toIso8601String(),
          'waktuResume': now.subtract(const Duration(minutes: 20)).toIso8601String(),
          'alasan': 'Pengguna Keluar / Logout Aplikasi',
          'autoTriggered': true,
        },
      ];

      final validPause = calculateValidPauseMinutes(rawLogs);
      // Jeda 20 menit dari Salat Ashar dihitung, jeda logout 50 menit diabaikan
      expect(validPause, 20);
    });

    test('Mengembalikan 0 jika logs kosong atau null', () {
      expect(calculateValidPauseMinutes(null), 0);
      expect(calculateValidPauseMinutes([]), 0);
      expect(calculateValidPauseMinutes('bukan list'), 0);
    });
  });
}
