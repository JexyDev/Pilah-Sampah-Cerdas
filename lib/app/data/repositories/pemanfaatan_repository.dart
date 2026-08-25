import '../models/pemanfaatan_entity.dart';

/// Kontrak Repository untuk fitur Hasil Olahan & Evaluasi Warga (Pemanfaatan)
abstract class PemanfaatanRepository {
  /// Mengambil daftar semua program pemanfaatan dan rekapitulasi hasil olahan
  Future<List<PemanfaatanProgramEntity>> getPrograms({String? search, String? kategori});

  /// Mengambil detail satu program pemanfaatan berdasarkan ID
  Future<PemanfaatanProgramEntity?> getProgramById(String id);

  /// Mengambil daftar aspirasi, kritik, dan evaluasi kepuasan warga
  Future<List<FeedbackPemanfaatanEntity>> getFeedbackList({String? status, String? kategori, String? search});

  /// Mengirimkan kritik & saran baru dari warga/pengguna
  Future<FeedbackPemanfaatanEntity> createFeedback({
    required String judul,
    required String isiKritikSaran,
    String? kategori,
    int? rating,
    String? fotoBuktiUrl,
    String? imagePath,
    int? rwId,
  });

  /// Memberikan tanggapan resmi dari pihak pengelola/RW/Admin
  Future<FeedbackPemanfaatanEntity> respondFeedback({
    required String id,
    required String tanggapan,
    String? status,
  });

  /// Menghapus kritik/saran (hanya pemilik atau admin)
  Future<bool> deleteFeedback(String id);
}
