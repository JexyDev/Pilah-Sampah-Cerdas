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
    
    // Check if it's likely a NIM. NIMs are 8-16 digits and usually don't start with 08.
    String digitsOnly = phone.replaceAll('+', '');
    bool isNimLength = digitsOnly.length >= 8 && digitsOnly.length <= 16;
    bool isPhoneNumberPrefix = digitsOnly.startsWith('08') || digitsOnly.startsWith('628') || (digitsOnly.startsWith('8') && digitsOnly.length >= 9 && digitsOnly.length <= 14);
    
    if (isNimLength && !isPhoneNumberPrefix) {
      return phone; // Return NIM as-is
    }

    // 2. Normalisasi format ke +62
    if (phone.startsWith('0')) {
      phone = '+62${phone.substring(1)}';
    } else if (phone.startsWith('62')) {
      phone = '+$phone';
    } else if (phone.startsWith('8')) {
      phone = '+62$phone';
    } else if (phone.startsWith('+62') || phone.startsWith('+')) {
      // Biarkan
    } else {
      // Kemungkinan ini adalah NIM (misal: 130119...) atau format lain.
      // Kita kembalikan as-is saja agar tidak rusak, biar backend yang validasi.
      return phone;
    }

    return phone;
  }
}

/// TextInputFormatter untuk menghapus awalan '0' atau '62' secara otomatis saat user mengetik,
/// karena UI sudah memiliki prefix '+62' permanen.
class PhonePrefixFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
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
