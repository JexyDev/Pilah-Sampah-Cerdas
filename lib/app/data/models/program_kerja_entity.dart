class ProgramKerjaEntity {
  final String id;
  final String kelompokId;
  final String deskripsi;
  final String kategori;
  final String waktuPelaksanaan;
  final double kebutuhanBiaya;
  final String status;
  final String? catatanDpl;
  final DateTime createdAt;

  ProgramKerjaEntity({
    required this.id,
    required this.kelompokId,
    required this.deskripsi,
    required this.kategori,
    required this.waktuPelaksanaan,
    required this.kebutuhanBiaya,
    required this.status,
    this.catatanDpl,
    required this.createdAt,
  });

  factory ProgramKerjaEntity.fromJson(Map<String, dynamic> json) {
    return ProgramKerjaEntity(
      id: json['id']?.toString() ?? '',
      kelompokId: json['kelompokId']?.toString() ?? json['id_kelompok']?.toString() ?? '',
      deskripsi: json['deskripsi']?.toString() ?? '',
      kategori: json['kategori']?.toString() ?? 'LAINNYA',
      waktuPelaksanaan: json['waktuPelaksanaan']?.toString() ?? json['waktu_pelaksanaan']?.toString() ?? '-',
      kebutuhanBiaya: double.tryParse(json['kebutuhanBiaya']?.toString() ?? json['kebutuhan_biaya']?.toString() ?? '0') ?? 0.0,
      status: json['status']?.toString() ?? 'BELUM_DISETUJUI',
      catatanDpl: json['catatanDpl']?.toString() ?? json['catatan_dpl']?.toString(),
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now() 
          : DateTime.now(),
    );
  }
}
