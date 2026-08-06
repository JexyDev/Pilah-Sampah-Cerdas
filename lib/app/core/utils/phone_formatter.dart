class PhoneFormatter {
  /// Memformat input untuk Login (Sesuai aturan: kirim apa adanya "08...", bersihkan simbol).
  /// TIDAK melakukan konversi paksa ke +62 atau format lain.
  static String prepareLoginPhoneInput(String raw) {
    if (raw.contains('@')) {
      return raw.trim();
    }
    // Hanya sisakan angka dan tanda + (jika ada)
    return raw.trim().replaceAll(RegExp(r'[^\d\+]'), '');
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
    } else if (phone.startsWith('+62')) {
      // Biarkan
    } else if (phone.startsWith('+')) {
      // Biarkan (jika kode negara lain)
    } else {
      // Jika aneh (e.g., 212...), asumsikan prepend +62
      phone = '+62$phone';
    }

    return phone;
  }
}
