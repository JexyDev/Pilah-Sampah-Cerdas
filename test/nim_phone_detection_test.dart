import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/utils/phone_formatter.dart';

/// Validator persis seperti di LoginView
String? validatePhone(String? v) {
  if (v == null || v.trim().isEmpty) {
    return 'Nomor telepon wajib diisi';
  }
  final clean = v.trim().replaceAll(RegExp(r'[^\d]'), '');
  if (clean.length >= 8 && clean.length <= 15) {
    return null; // Valid
  }
  return 'Format nomor telepon tidak valid (8-15 digit)';
}

/// Validator password persis seperti di LoginView
String? validatePassword(String? v) {
  if (v == null || v.isEmpty) {
    return 'Kata sandi wajib diisi';
  }
  if (v.length < 8) {
    return 'Kata sandi minimal 8 karakter';
  }
  return null;
}

void main() {
  group('Logic Normalisasi Nomor Telepon Murni (Tanpa NIM) & Validasi Login', () {
    test('Format no HP 081234567890 dinormalisasi ke +6281234567890', () {
      const input = '081234567890';
      expect(validatePhone(input), isNull);
      expect(
        PhoneFormatter.prepareLoginPhoneInput(input),
        equals('+6281234567890'),
      );
    });

    test('Format no HP awalan 81234567890 (prefix +62 di UI) dinormalisasi ke +6281234567890', () {
      const input = '81234567890';
      expect(validatePhone(input), isNull);
      expect(
        PhoneFormatter.prepareLoginPhoneInput(input),
        equals('+6281234567890'),
      );
    });

    test('Format no HP 6281234567890 dinormalisasi ke +6281234567890', () {
      const input = '6281234567890';
      expect(validatePhone(input), isNull);
      expect(
        PhoneFormatter.prepareLoginPhoneInput(input),
        equals('+6281234567890'),
      );
    });

    test('Input no telepon kosong mengembalikan error wajib diisi', () {
      expect(validatePhone(''), equals('Nomor telepon wajib diisi'));
      expect(validatePhone(null), equals('Nomor telepon wajib diisi'));
    });

    test('Input no telepon kurang dari 8 digit tidak valid', () {
      expect(
        validatePhone('12345'),
        equals('Format nomor telepon tidak valid (8-15 digit)'),
      );
    });

    test('Kata sandi minimal 8 karakter', () {
      expect(validatePassword(''), equals('Kata sandi wajib diisi'));
      expect(validatePassword('123456'), equals('Kata sandi minimal 8 karakter'));
      expect(validatePassword('1234567'), equals('Kata sandi minimal 8 karakter'));
      expect(validatePassword('12345678'), isNull);
      expect(validatePassword('rahasia123'), isNull);
    });
  });
}
