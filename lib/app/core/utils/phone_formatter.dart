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
