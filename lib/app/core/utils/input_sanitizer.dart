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

  /// Membersihkan teks notifikasi / riwayat dari ID teknis sistem backend
  /// seperti `[ReportID:493a8c31-c5e7-4ecb-8b8e-3dc6ee37d76f]` atau `[ID:xxx]`.
  static String cleanSystemMessage(String input) {
    if (input.isEmpty) return input;

    String cleaned = input;

    // 1. Hapus format bracket [ReportID:xxxx] atau [Report ID:xxxx] atau [report_id:xxxx] atau [ID:xxxx]
    cleaned = cleaned.replaceAll(
      RegExp(r'\s*\[\s*(Report\s*ID|report_?id|ReportID|ID|id)\s*:[^\]]+\]', caseSensitive: false),
      '',
    );

    // 2. Hapus format bracket UUID mentah [493a8c31-c5e7-4ecb-8b8e-3dc6ee37d76f]
    cleaned = cleaned.replaceAll(
      RegExp(r'\s*\[\s*[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\s*\]'),
      '',
    );

    // 3. Hapus format tanpa bracket seperti "ReportID: xxxx" atau "Report ID: xxxx"
    cleaned = cleaned.replaceAll(
      RegExp(r'\s*Report\s*ID\s*:\s*[a-zA-Z0-9\-_]+', caseSensitive: false),
      '',
    );

    // 4. Bersihkan spasi ganda dan trim
    cleaned = cleaned.replaceAll(RegExp(r'\s{2,}'), ' ').trim();

    return cleaned;
  }
}
