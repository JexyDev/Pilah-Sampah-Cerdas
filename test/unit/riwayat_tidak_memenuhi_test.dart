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

    test('Kasus 21 September 2026: Resolusi paradoks rentang 13:28 - 20:00 vs durasi posko 3 jam 57 menit', () {
      final attended = DateTime(2026, 9, 21, 13, 28);
      final checkOut = DateTime(2026, 9, 21, 20, 0);

      final sesi21Sept = SesiTidakMemenuhi(
        id: 'sesi-21sept',
        scheduleId: 'sch-dago-1',
        scheduleTitle: 'Pembersihan TPS Dago & Edukasi Warga',
        attendedAt: attended,
        checkOutAt: checkOut,
        durationMinutes: 237, // 3 Jam 57 Menit efektif di posko
        targetMinutes: 240,   // 4 Jam target minimal
        shortageMinutes: 3,   // 3 Menit kekurangan
        durasiJedaMenit: 155, // 2 Jam 35 Menit di luar zona
        status: 'HADIR_TIDAK_MEMENUHI',
        statusDisplay: 'Kurang Durasi',
        keterangan: 'Durasi presensi belum memenuhi target harian (4 Jam)',
      );

      expect(sesi21Sept.rentangTotalMenit, 392);
      expect(sesi21Sept.rentangTotalFormatted, '6 Jam 32 Menit');
      expect(sesi21Sept.durationFormatted, '3 Jam 57 Menit');
      expect(sesi21Sept.targetFormatted, '4 Jam');
      expect(sesi21Sept.shortageFormatted, '3 Menit');
      expect(sesi21Sept.jedaFormatted, '2 Jam 35 Menit');
    });

    test('Jeda di luar posko terhitung otomatis dari selisih attendedAt dan checkOutAt jika jedaMinutes 0', () {
      final attended = DateTime(2026, 9, 22, 8, 0);
      final checkOut = DateTime(2026, 9, 22, 12, 0); // 4 jam = 240 menit

      final sesiAutoJeda = SesiTidakMemenuhi(
        id: 'sesi-auto',
        scheduleId: 'sch-auto',
        scheduleTitle: 'Kegiatan Bank Sampah',
        attendedAt: attended,
        checkOutAt: checkOut,
        durationMinutes: 180, // 3 Jam di posko
        targetMinutes: 240,
        shortageMinutes: 60,
        durasiJedaMenit: 0,   // Diserahkan ke selisih 240 - 180 = 60 menit
        status: 'HADIR_TIDAK_MEMENUHI',
        statusDisplay: 'Kurang Durasi',
        keterangan: 'Durasi presensi belum memenuhi target harian',
      );

      expect(sesiAutoJeda.rentangTotalMenit, 240);
      expect(sesiAutoJeda.rentangTotalFormatted, '4 Jam');
      expect(sesiAutoJeda.durationFormatted, '3 Jam');
      expect(sesiAutoJeda.jedaFormatted, '1 Jam');
    });
  });
}
