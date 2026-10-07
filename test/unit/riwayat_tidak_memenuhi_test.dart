import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/modules/mahasiswa/controllers/riwayat_tidak_memenuhi_controller.dart';

void main() {
  group('SesiTidakMemenuhi Unit Tests', () {
    test('Format durasi jam dan menit dihitung secara tepat', () {
      const sesi1 = SesiTidakMemenuhi(
        id: 'sesi-1',
        scheduleId: 'sch-1',
        scheduleTitle: 'Kegiatan Posko Dago',
        durationMinutes: 135, // 2 Jam 15 Menit
        targetMinutes: 240,   // 4 Jam
        shortageMinutes: 105, // 1 Jam 45 Menit
        status: 'HADIR_TIDAK_MEMENUHI',
        statusDisplay: 'Hadir & Tidak Memenuhi',
        keterangan: 'Durasi kurang dari target',
      );

      expect(sesi1.durationFormatted, '2 Jam 15 Menit');
      expect(sesi1.targetFormatted, '4 Jam');
      expect(sesi1.shortageFormatted, '1 Jam 45 Menit');
    });

    test('Format durasi murni menit (< 60 menit)', () {
      const sesi2 = SesiTidakMemenuhi(
        id: 'sesi-2',
        scheduleId: 'sch-2',
        scheduleTitle: 'Kegiatan Lapangan',
        durationMinutes: 45,
        targetMinutes: 60,
        shortageMinutes: 15,
        status: 'HADIR_TIDAK_MEMENUHI',
        statusDisplay: 'Hadir & Tidak Memenuhi',
        keterangan: 'Durasi kurang dari target',
      );

      expect(sesi2.durationFormatted, '45 Menit');
      expect(sesi2.targetFormatted, '1 Jam');
      expect(sesi2.shortageFormatted, '15 Menit');
    });

    test('Shortage 0 menit terformat secara konsisten', () {
      const sesi3 = SesiTidakMemenuhi(
        id: 'sesi-3',
        scheduleId: 'sch-3',
        scheduleTitle: 'Kegiatan Posko Lebak Gede',
        durationMinutes: 240,
        targetMinutes: 240,
        shortageMinutes: 0,
        status: 'HADIR_MEMENUHI',
        statusDisplay: 'Hadir & Memenuhi',
        keterangan: 'Target terpenuhi',
      );

      expect(sesi3.shortageFormatted, '0 Menit');
    });
  });
}
