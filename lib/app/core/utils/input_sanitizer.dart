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
  /// seperti `[ReportID:493a8c31-c5e7-4ecb-8b8e-3dc6ee37d76f]` atau `[ID:xxx]`,
  /// UUID mentah `[1acbfbae-...]`, serta tag teknis `(GPS_ACTIVITY)`.
  static String cleanSystemMessage(String input) {
    if (input.isEmpty) return input;

    String cleaned = input;

    // 1. Hapus prefix "Poin " di awal jika ada
    cleaned = cleaned.replaceAll(RegExp(r'^Poin\s+', caseSensitive: false), '');

    // 2. Hapus format bracket [ReportID:xxxx] atau [ID:xxxx] atau [ScheduleID:xxxx]
    cleaned = cleaned.replaceAll(
      RegExp(
        r'\s*\[\s*(Report\s*ID|report_?id|ReportID|ProkerID|proker_?id|ScheduleID|schedule_?id|ID|id)\s*:[^\]]+\]',
        caseSensitive: false,
      ),
      '',
    );

    // 3. Hapus format bracket UUID mentah [493a8c31-c5e7-4ecb-8b8e-3dc6ee37d76f] atau hex ID
    cleaned = cleaned.replaceAll(
      RegExp(
        r'\s*\[\s*[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\s*\]',
      ),
      '',
    );
    cleaned = cleaned.replaceAll(
      RegExp(r'\s*\[\s*[0-9a-fA-F\-]{16,}\s*\]'),
      '',
    );

    // 4. Hapus flag teknis dalam kurung seperti (GPS_ACTIVITY), (GPS_MANUAL), (QR_SCAN), dll.
    cleaned = cleaned.replaceAll(
      RegExp(
        r'\s*\((GPS_ACTIVITY|GPS_MANUAL|GPS|QR_SCAN|MANUAL|SYSTEM|AUTO|BACKGROUND|API|ACTIVITY)[^)]*\)',
        caseSensitive: false,
      ),
      '',
    );

    // 5. Hapus format tanpa bracket seperti "ReportID: xxxx" atau "Report ID: xxxx"
    cleaned = cleaned.replaceAll(
      RegExp(r'\s*Report\s*ID\s*:\s*[a-zA-Z0-9\-_]+', caseSensitive: false),
      '',
    );

    // 6. Penggantian istilah lama agar konsisten "Tempat Sampah"
    cleaned = cleaned
        .replaceAll(RegExp(r'tong\s+sampah', caseSensitive: false), 'Tempat Sampah')
        .replaceAll(RegExp(r'\btong\b', caseSensitive: false), 'Tempat Sampah');

    // 7. Normalisasi teks setoran sampah warga dari kg ke Liter
    cleaned = cleaned.replaceAllMapped(
      RegExp(r'seberat\s+([0-9.,]+)\s*kg', caseSensitive: false),
      (match) => 'sebanyak ${match.group(1)} Liter',
    );

    // 8. Bersihkan spasi ganda dan trim
    cleaned = cleaned.replaceAll(RegExp(r'\s{2,}'), ' ').trim();

    // 9. Pastikan huruf pertama kapital (contoh: "kehadiran KKN" -> "Kehadiran KKN")
    if (cleaned.isNotEmpty) {
      cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
    }

    return cleaned;
  }
}
