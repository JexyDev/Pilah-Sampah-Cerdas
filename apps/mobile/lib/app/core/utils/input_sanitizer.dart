class InputSanitizer {
  /// Membersihkan input dari spasi berlebih di awal/akhir dan tag HTML (XSS)
  static String sanitize(String input) {
    if (input.isEmpty) return input;
    
    // Hapus spasi berlebih
    String cleaned = input.trim();
    
    // Hapus tag HTML dasar seperti <script>, <div>, dll
    cleaned = cleaned.replaceAll(RegExp(r'<[^>]*>|&[^;]+;'), '');
    
    return cleaned;
  }
}
