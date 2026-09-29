/// Parser cerdas khusus display timbangan digital 7-segment.
///
/// Menangani toleransi OCR umum pada display 7-segment,
/// normalisasi desimal, deteksi satuan, dan filter noise.
class ScaleDisplayParser {
  ScaleDisplayParser._();

  /// Karakter yang sering salah dibaca OCR dari display 7-segment.
  static const _charMap = {
    'O': '0', 'o': '0', 'D': '0',
    'I': '1', 'l': '1', '|': '1', '!': '1',
    'S': '5', 's': '5', '\$': '5',
    'B': '8',
    'Z': '2', 'z': '2',
  };

  /// Parse raw OCR text dari display timbangan → berat dalam kg.
  /// Returns null jika tidak dapat diparse.
  static double? parse(String rawText) {
    final lines = rawText.split(RegExp(r'[\n\r]+'));
    double? bestMatch;

    for (final line in lines) {
      final cleaned = _cleanLine(line);
      if (cleaned == null) continue;

      // Filter: skip tahun (2020-2030) dan jam (HH:MM)
      if (_isNoiseValue(cleaned)) continue;

      // Konversi gram ke kg jika ada unit 'g'
      final result = _convertIfGram(cleaned, line);
      if (result == null) continue;

      // Filter batas fisik wajar: 0.05 - 500 kg
      if (result < 0.05 || result > 500) continue;

      // Prioritas: angka yang berdekatan dengan 'kg'
      if (_hasKgUnit(line)) return result;
      bestMatch ??= result;
    }
    return bestMatch;
  }

  static String? _cleanLine(String line) {
    // Cari semua token angka-like di baris ini
    final tokens = RegExp(r'[\dOoDIl|!Ss\$Bz.,]+').allMatches(line);
    for (final token in tokens) {
      var s = token.group(0)!;
      // Terapkan karakter map 7-segment
      final buf = StringBuffer();
      for (final ch in s.split('')) {
        buf.write(_charMap[ch] ?? ch);
      }
      s = buf.toString();
      // Normalisasi koma Indonesia → titik desimal
      s = s.replaceAll(',', '.');
      // Hapus titik ganda / leading dots
      s = s.replaceAll(RegExp(r'\.{2,}'), '.');
      s = s.replaceAll(RegExp(r'^\.|\.$/'), '');
      if (s.isEmpty) continue;
      final val = double.tryParse(s);
      if (val != null && val > 0) return s;
    }
    return null;
  }

  static bool _isNoiseValue(String numStr) {
    final val = double.tryParse(numStr);
    if (val == null) return true;
    // Tahun: 2020-2030
    if (val >= 2020 && val <= 2030 && !numStr.contains('.')) return true;
    // Jam: cek pattern asli HH:MM sudah di-split oleh caller
    return false;
  }

  static bool _hasKgUnit(String line) {
    final lower = line.toLowerCase();
    // Toleransi OCR: kg, k9, k.g
    return RegExp(r'k\s*[g9.]').hasMatch(lower);
  }

  static double? _convertIfGram(String numStr, String rawLine) {
    final val = double.tryParse(numStr);
    if (val == null) return null;
    final lower = rawLine.toLowerCase().trim();
    // Jika ada unit 'g' (gram) tanpa 'kg'
    if (!_hasKgUnit(rawLine) &&
        RegExp(r'\d\s*g\b').hasMatch(lower) &&
        val > 50) {
      return val / 1000; // gram → kg
    }
    return val;
  }
}
