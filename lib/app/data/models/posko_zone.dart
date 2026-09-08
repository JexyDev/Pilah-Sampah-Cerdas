class PoskoZone {
  final String id;
  final String nama;
  final String alamat;
  final double latitude;
  final double longitude;
  final double radius;
  final bool isUtama;

  PoskoZone({
    required this.id,
    required this.nama,
    required this.alamat,
    required this.latitude,
    required this.longitude,
    required this.radius,
    required this.isUtama,
  });

  factory PoskoZone.fromJson(Map<String, dynamic> json) {
    return PoskoZone(
      id: json['id']?.toString() ?? '',
      nama: json['nama']?.toString() ?? 'Posko KKN',
      alamat: json['alamat']?.toString() ?? '-',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      radius: (json['radius'] as num?)?.toDouble() ?? 200.0,
      isUtama: json['isUtama'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nama': nama,
      'alamat': alamat,
      'latitude': latitude,
      'longitude': longitude,
      'radius': radius,
      'isUtama': isUtama,
    };
  }
}
