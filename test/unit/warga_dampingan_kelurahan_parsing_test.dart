import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/mahasiswa_kkn_models.dart';

void main() {
  group('WargaDampingan Kelurahan Parsing Test', () {
    test('parses Cipaganti correctly from address when kelurahan field is empty', () {
      final json = {
        'id': 'warga-cip-1',
        'name': 'Imas Supriatin',
        'alamat': 'Jl. Bapa Husen Dalam No. 12, RW 04, Cipaganti',
        'isActivated': true,
      };

      final warga = WargaDampingan.fromJson(json);
      expect(warga.kelurahan, 'Cipaganti');
      expect(warga.rw, '04');
    });

    test('parses Dago correctly from address when kelurahan field is empty', () {
      final json = {
        'id': 'warga-dago-1',
        'name': 'Bani',
        'alamat': 'Jl. Dago Elos RW 02, Dago, Bandung',
        'isActivated': true,
      };

      final warga = WargaDampingan.fromJson(json);
      expect(warga.kelurahan, 'Dago');
      expect(warga.rw, '02');
    });

    test('parses Lebak Siliwangi correctly from address', () {
      final json = {
        'id': 'warga-ls-1',
        'name': 'Warga LS',
        'alamat': 'Jl. Ganesa RW 01, Lebak Siliwangi',
        'isActivated': true,
      };

      final warga = WargaDampingan.fromJson(json);
      expect(warga.kelurahan, 'Lebak Siliwangi');
      expect(warga.rw, '01');
    });

    test('prefers explicit kelurahan field over address fallback', () {
      final json = {
        'id': 'warga-exp-1',
        'name': 'Pipit',
        'kelurahan': 'Cipaganti',
        'alamat': 'Jl. Sadang Serang No. 5',
        'isActivated': true,
      };

      final warga = WargaDampingan.fromJson(json);
      expect(warga.kelurahan, 'Cipaganti');
    });
  });
}
