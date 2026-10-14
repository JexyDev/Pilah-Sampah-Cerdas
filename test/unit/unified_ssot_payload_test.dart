import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/mahasiswa_kkn_models.dart';
import 'package:mobile_app_sampah/app/data/models/user_entity.dart';

void main() {
  group('Unified SSOT Payload Test', () {
    test('UserEntity parses unified SSOT fields accurately', () {
      final json = {
        'id': 'user-123',
        'name': 'Acef Kiki',
        'phone': '+62812345678',
        'role': 'MAHASISWA_KKN',
        'isKetua': true,
        'kknTerritory': {
          'kelompokId': 'grp-6',
          'kelompokName': 'Kelompok 06',
          'kecamatan': 'Coblong',
          'kelurahan': 'Sadang Serang',
          'cakupanRw': ['03', '04'],
          'assignedRw': 'RW 03',
          'posko': {
            'id': 'posko-1',
            'name': 'Posko 06',
            'address': 'Jl. Titimplik',
            'latitude': -6.88,
            'longitude': 107.61,
            'radiusMeter': 500,
          },
          'dpl': {
            'id': 'dpl-1',
            'name': 'Dr. Dosen',
            'phone': '081111',
            'nip': '19800101',
          },
        },
        'wargaDampinganAggregation': {
          'totalWargaDampingan': 15,
          'wargaDampinganBinAktif': 12,
          'totalPhysicalBins': 24,
          'wargaLengkapDuaWadah': 10,
          'wargaMandiriRwBelumKlaim': 30,
          'totalWargaRw': 45,
        },
        'todayAttendanceSummary': {
          'scheduleId': 'sch-1',
          'date': '2026-10-14',
          'status': 'HADIR',
          'hasCheckedIn': true,
          'hasCheckedOut': false,
          'accumulatedMinutes': 210,
          'targetMinutes': 250,
          'isMemenuhiTarget': false,
          'remainingMinutes': 40,
          'activeZone': 'Zone 1',
        },
        'activeBinResetRequests': [
          {
            'requestId': 'req-1',
            'binId': 'bin-1',
            'qrCode': 'BSK-OGN-001',
            'status': 'PENDING',
          }
        ],
      };

      final user = UserEntity.fromJson(json);

      expect(user.id, 'user-123');
      expect(user.isKetua, isTrue);
      expect(user.kknTerritory, isNotNull);
      expect(user.kknTerritory!.kelompokName, 'Kelompok 06');
      expect(user.kknTerritory!.cakupanRw, ['03', '04']);
      expect(user.kknTerritory!.posko?.name, 'Posko 06');
      expect(user.kknTerritory!.dpl?.nip, '19800101');

      expect(user.wargaAggregation, isNotNull);
      expect(user.wargaAggregation!.totalWargaDampingan, 15);
      expect(user.wargaAggregation!.totalPhysicalBins, 24);

      expect(user.attendanceSummary, isNotNull);
      expect(user.attendanceSummary!.accumulatedMinutes, 210);
      expect(user.attendanceSummary!.isMemenuhiTarget, isFalse);

      expect(user.activeResetRequests.length, 1);
      expect(user.activeResetRequests.first.qrCode, 'BSK-OGN-001');
    });

    test('KknDashboardData parses wargaAggregation accurately', () {
      final json = {
        'totalRegisteredBins': 20,
        'wargaDampinganAggregation': {
          'totalWargaDampingan': 10,
          'wargaDampinganBinAktif': 8,
          'totalPhysicalBins': 16,
          'wargaLengkapDuaWadah': 6,
        },
      };

      final data = KknDashboardData.fromJson(json);
      expect(data.totalRegisteredBins, 20);
      expect(data.wargaAggregation, isNotNull);
      expect(data.wargaAggregation!.totalWargaDampingan, 10);
      expect(data.wargaAggregation!.totalPhysicalBins, 16);
    });
  });
}
