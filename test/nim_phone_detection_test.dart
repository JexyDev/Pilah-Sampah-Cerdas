import 'package:flutter_test/flutter_test.dart';

/// Helper function persis seperti di LoginView untuk deteksi & normalisasi login
String normalizeIdentifier(String raw) {
  String input = raw.trim().replaceAll(RegExp(r'[\s\-]'), '');
  final digitsOnly = input.replaceAll(RegExp(r'[^\d]'), '');
  if (digitsOnly.length >= 10 &&
      (input.startsWith('0') ||
          input.startsWith('8') ||
          input.startsWith('+62') ||
          input.startsWith('62'))) {
    if (!input.startsWith('0') && input.startsWith('8')) input = '0$input';
  }
  return input;
}

/// Helper validator persis seperti di LoginView
String? validateIdentifier(String? v) {
  if (v == null || v.trim().isEmpty) {
    return 'Nomor telepon atau NIM wajib diisi';
  }
  final clean = v.trim();
  final digits = clean.replaceAll(RegExp(r'[^\d]'), '');
  if (digits.length >= 10 && digits.length <= 13) {
    return null; // Phone number valid
  }
  if (clean.length >= 8 && clean.length <= 10) {
    return null; // NIM valid
  }
  return 'Format tidak valid (12 digit No. HP atau 8-10 digit NIM)';
}

void main() {
  group('Logic Deteksi Dual-Mode NIM vs Nomor HP Indonesia', () {
    test('12 Digit No HP diawali 08 dikembalikan sebagai format ter-normalisasi', () {
      const input = '0812 3456 7890';
      expect(validateIdentifier(input), isNull);
      expect(normalizeIdentifier(input), equals('081234567890'));
    });

    test('11 Digit No HP tanpa 0 di depan (81234567890) ditambahkan 0 di depan', () {
      const input = '812-3456-7890';
      expect(validateIdentifier(input), isNull);
      expect(normalizeIdentifier(input), equals('081234567890'));
    });

    test('8 Digit NIM ITB (13520001) dikenali sebagai NIM valid', () {
      const input = '13520001';
      expect(validateIdentifier(input), isNull);
      expect(normalizeIdentifier(input), equals('13520001'));
    });

    test('10 Digit NIM Telkom/Unpad (1301210001) dikenali sebagai NIM valid', () {
      const input = '1301210001';
      expect(validateIdentifier(input), isNull);
      expect(normalizeIdentifier(input), equals('1301210001'));
    });

    test('Input kosong mengembalikan pesan error wajib diisi dalam Bahasa Indonesia', () {
      expect(validateIdentifier(''), equals('Nomor telepon atau NIM wajib diisi'));
    });

    test('Input tidak valid (misal 5 digit) mengembalikan pesan format tidak valid', () {
      expect(
        validateIdentifier('12345'),
        equals('Format tidak valid (12 digit No. HP atau 8-10 digit NIM)'),
      );
    });
  });
}
