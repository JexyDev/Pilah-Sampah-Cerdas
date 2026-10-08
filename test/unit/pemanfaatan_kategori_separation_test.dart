import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/data/models/mahasiswa_kkn_models.dart';
import 'package:mobile_app_sampah/app/data/models/pemanfaatan_entity.dart';

void main() {
  group('Pemanfaatan Kategori Separation Tests', () {
    test('PemanfaatanSampahRequest serializes kategori correctly', () {
      const reqOrganik = PemanfaatanSampahRequest(
        jenisPemanfaatan: 'Kompos Organik (Buruan Sae)',
        kategoriSampah: 'Sisa Sayur',
        jumlah: 15.5,
        satuan: 'kg',
        wilayahDampingan: 'RW 01',
        deskripsi: 'Pengolahan kompos',
        kategori: 'ORGANIK',
      );

      final jsonOrganik = reqOrganik.toJson();
      expect(jsonOrganik['kategori'], 'ORGANIK');
      expect(jsonOrganik['jenisPemanfaatan'], 'Kompos Organik (Buruan Sae)');

      const reqAnorganik = PemanfaatanSampahRequest(
        jenisPemanfaatan: 'Penyetoran Bank Sampah',
        kategoriSampah: 'Botol Plastik',
        jumlah: 8.0,
        satuan: 'kg',
        wilayahDampingan: 'RW 01',
        deskripsi: 'Penyetoran anorganik',
        kategori: 'ANORGANIK',
      );

      final jsonAnorganik = reqAnorganik.toJson();
      expect(jsonAnorganik['kategori'], 'ANORGANIK');
      expect(jsonAnorganik['jenisPemanfaatan'], 'Penyetoran Bank Sampah');
    });

    test('PemanfaatanProgramEntity correctly parses backend kategoriBahan', () {
      final jsonFromBackend = {
        'id': 'pem-123',
        'namaProgram': 'Pengolahan Sampah',
        'jenisProgram': 'Kompos Organik (Buruan Sae)',
        'kategoriBahan': 'ORGANIK',
        'jumlahBahanMasukKg': 25.0,
        'jumlahHasilKg': 5.0,
        'unitHasil': 'kg',
        'status': 'PROSES',
        'tanggalPencatatan': '2026-10-08T09:00:00.000Z',
        'rwId': 1,
      };

      final entity = PemanfaatanProgramEntity.fromJson(jsonFromBackend);
      expect(entity.kategoriBahan, 'ORGANIK');
      expect(entity.jenisProgram, 'Kompos Organik (Buruan Sae)');
      expect(entity.jumlahBahanMasukKg, 25.0);
    });
  });
}
