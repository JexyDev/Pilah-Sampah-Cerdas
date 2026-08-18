import 'package:equatable/equatable.dart';

/// Entitas Pengajuan Izin/Sakit Mahasiswa (A.11)
class PengajuanIzinMahasiswaEntity extends Equatable {
  const PengajuanIzinMahasiswaEntity({
    required this.id,
    required this.mahasiswaId,
    required this.kategori,
    required this.fotoBuktiUrl,
    required this.deskripsi,
    required this.tanggalKegiatanTerkait,
    required this.status,
    required this.createdAt,
    this.direviewOlehDplId,
    this.reviewedAt,
  });

  final String id;
  final String mahasiswaId;
  final KategoriIzin kategori; // sakit | izin (BUKAN tanpa keterangan)
  final String fotoBuktiUrl;
  final String deskripsi;
  final DateTime tanggalKegiatanTerkait;
  final StatusIzin status; // menunggu | disetujui | ditolak
  final DateTime createdAt;
  final String? direviewOlehDplId;
  final DateTime? reviewedAt;

  @override
  List<Object?> get props => [id, mahasiswaId, tanggalKegiatanTerkait];
}

enum KategoriIzin { sakit, izin }

extension KategoriIzinExt on KategoriIzin {
  String get displayName {
    switch (this) {
      case KategoriIzin.sakit:
        return 'Sakit';
      case KategoriIzin.izin:
        return 'Izin Kegiatan/Pribadi';
    }
  }
}

enum StatusIzin { menunggu, disetujui, ditolak, dibatalkan, menungguBatal, hadirOverride }

extension StatusIzinExt on StatusIzin {
  String get displayName {
    switch (this) {
      case StatusIzin.menunggu:
        return 'Menunggu Approval DPL';
      case StatusIzin.disetujui:
        return 'Disetujui';
      case StatusIzin.ditolak:
        return 'Ditolak';
      case StatusIzin.dibatalkan:
        return 'Dibatalkan';
      case StatusIzin.menungguBatal:
        return 'Menunggu Pembatalan DPL';
      case StatusIzin.hadirOverride:
        return 'Batal Izin (Hadir)';
    }
  }
}
