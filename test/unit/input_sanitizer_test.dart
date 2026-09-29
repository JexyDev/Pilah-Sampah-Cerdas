import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/core/utils/input_sanitizer.dart';

void main() {
  test('InputSanitizer dynamically cleans UUIDs and technical tags from title', () {
    const raw1 =
        'kehadiran KKN (Check-In): Kegiatan Harian Posko KKN Kelompok TEST [1acbfbae-cfb8-442c-bdca-c10152830b1c] (GPS_ACTIVITY)';
    final result1 = InputSanitizer.cleanSystemMessage(raw1);
    expect(
      result1,
      'Kehadiran KKN (Check-In): Kegiatan Harian Posko KKN Kelompok TEST',
    );

    const raw2 =
        'kehadiran KKN (Check-In): Kegiatan Evaluasi Malam Posko [9e54bbb4-450e-4ded-8517-a2e785f96536] (GPS_ACTIVITY)';
    final result2 = InputSanitizer.cleanSystemMessage(raw2);
    expect(
      result2,
      'Kehadiran KKN (Check-In): Kegiatan Evaluasi Malam Posko',
    );

    const raw3 = 'Poin kehadiran KKN: Proker A [ReportID:12345]';
    final result3 = InputSanitizer.cleanSystemMessage(raw3);
    expect(result3, 'Kehadiran KKN: Proker A');
  });
}
