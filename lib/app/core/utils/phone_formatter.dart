import 'package:flutter/services.dart';

class PhoneFormatter {
  /// Memformat input untuk Login (Sesuai aturan baru: WAJIB format "+62" disamakan dengan OTP).
  static String prepareLoginPhoneInput(String raw) {
    return convertToInternationalFormat(raw);
  }

  /// Memformat input untuk OTP (Sesuai aturan: WAJIB format "+62").
  /// Digunakan untuk Registrasi, Request OTP, Verify OTP, Reset Password.
  static String convertToInternationalFormat(String raw) {
    if (raw.contains('@')) {
      // Jika input adalah email, biarkan apa adanya (tidak diformat jadi nomor telepon)
      return raw.trim();
    }

    // 1. Bersihkan semua karakter selain digit dan +
    String phone = raw.trim().replaceAll(RegExp(r'[^\d\+]'), '');
    if (phone.isEmpty) return phone;

    // 2. Normalisasi format ke +62 murni nomor telepon (tanpa deteksi NIM)
    if (phone.startsWith('+62')) {
      return phone;
    } else if (phone.startsWith('0')) {
      return '+62${phone.substring(1)}';
    } else if (phone.startsWith('62')) {
      return '+$phone';
    } else if (phone.startsWith('+')) {
      return phone;
    } else {
      return '+62$phone';
    }
  }

  /// Memformat input untuk tampilan awal di UI (dari format internasional kembali ke format lokal '08').
  static String convertToLocalFormat(String raw) {
    if (raw.isEmpty) return raw;
    String phone = raw.trim().replaceAll(RegExp(r'[^\d\+]'), '');

    if (phone.startsWith('+62')) {
      return '0${phone.substring(3)}';
    } else if (phone.startsWith('62')) {
      return '0${phone.substring(2)}';
    }

    return phone;
  }
}

/// TextInputFormatter untuk menghapus awalan '0' atau '62' secara otomatis saat user mengetik,
/// karena UI sudah memiliki prefix '+62' permanen.
class PhonePrefixFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String text = newValue.text;

    // Gunakan regex untuk menghapus kombinasi awalan '0' dan '62' berulang kali.
    // Contoh: '0812', '62812', '0062812', '620812' semuanya akan jadi '812'.
    String newText = text.replaceFirst(RegExp(r'^(0|62)+'), '');

    if (newText != newValue.text) {
      return TextEditingValue(
        text: newText,
        selection: TextSelection.collapsed(offset: newText.length),
      );
    }
    return newValue;
  }
}
