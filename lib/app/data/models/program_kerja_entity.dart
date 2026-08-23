class ProgramKerjaEntity {
  final String id;
  final String kelompokId;
  final String? judul;
  final String deskripsi;
  final String kategori;
  final String waktuPelaksanaan;
  final double kebutuhanBiaya;
  final String status;
  final String statusUsulan;
  final String statusPelaksanaan;
  final String? catatanDpl;
  final DateTime createdAt;

  // Deteksi Usulan DPL dari pola JSON backend:
  // Proker buatan mahasiswa selalu diprefix '**Judul**\n\n' oleh backend KKN service.
  // Jika tidak ada prefix itu, judul & deskripsi yang dikembalikan API akan sama persis (buatan DPL).
  bool get isUsulanDpl => judul != null && deskripsi.isNotEmpty && judul == deskripsi;

  ProgramKerjaEntity({
    required this.id,
    required this.kelompokId,
    this.judul,
    required this.deskripsi,
    required this.kategori,
    required this.waktuPelaksanaan,
    required this.kebutuhanBiaya,
    required this.status,
    this.statusUsulan = 'BELUM_DISETUJUI',
    this.statusPelaksanaan = 'BELUM_MULAI',
    this.catatanDpl,
    required this.createdAt,
  });

  factory ProgramKerjaEntity.fromJson(Map<String, dynamic> json) {
    final legacyStatus = json['status']?.toString() ?? 'BELUM_DISETUJUI';
    
    // Resolve statusUsulan
    String resolvedUsulan = json['statusUsulan']?.toString() ?? json['status_usulan']?.toString() ?? '';
    if (resolvedUsulan.isEmpty) {
      final leg = legacyStatus.toUpperCase();
      if (leg == 'DITERIMA' || leg == 'DISETUJUI' || leg == 'SEDANG_BERJALAN' || leg == 'SELESAI') {
        resolvedUsulan = 'DISETUJUI';
      } else if (leg == 'DITOLAK' || leg == 'TIDAK_DISETUJUI') {
        resolvedUsulan = 'DITOLAK';
      } else {
        resolvedUsulan = 'BELUM_DISETUJUI';
      }
    }

    // Resolve statusPelaksanaan
    String resolvedPelaksanaan = json['statusPelaksanaan']?.toString() ?? json['status_pelaksanaan']?.toString() ?? '';
    if (resolvedPelaksanaan.isEmpty) {
      final leg = legacyStatus.toUpperCase();
      if (leg == 'SELESAI') {
        resolvedPelaksanaan = 'SELESAI';
      } else if (leg == 'SEDANG_BERJALAN' || leg == 'SEDANG_DILAKSANAKAN' || leg == 'BERJALAN') {
        resolvedPelaksanaan = 'SEDANG_BERJALAN';
      } else {
        resolvedPelaksanaan = 'BELUM_MULAI';
      }
    }

    return ProgramKerjaEntity(
      id: json['id']?.toString() ?? '',
      kelompokId: json['kelompokId']?.toString() ?? json['id_kelompok']?.toString() ?? '',
      judul: json['judul']?.toString(),
      deskripsi: json['deskripsi']?.toString() ?? '',
      kategori: json['kategori']?.toString() ?? 'LAINNYA',
      waktuPelaksanaan: json['waktuPelaksanaan']?.toString() ?? json['waktu_pelaksanaan']?.toString() ?? '-',
      kebutuhanBiaya: double.tryParse(json['kebutuhanBiaya']?.toString() ?? json['kebutuhan_biaya']?.toString() ?? '0') ?? 0.0,
      status: legacyStatus,
      statusUsulan: resolvedUsulan,
      statusPelaksanaan: resolvedPelaksanaan,
      catatanDpl: json['catatanDpl']?.toString() ?? json['catatan_dpl']?.toString(),
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now() 
          : DateTime.now(),
    );
  }
}
