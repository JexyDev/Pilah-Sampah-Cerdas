class WilayahKelompokModel {
  final String kelompokId;
  final String namaKelompok;
  final Map<String, double>? posko;
  final String tipeArea;
  final List<Map<String, double>>? polygonKoordinat;
  final double? radiusMeters;

  WilayahKelompokModel({
    required this.kelompokId,
    required this.namaKelompok,
    this.posko,
    required this.tipeArea,
    this.polygonKoordinat,
    this.radiusMeters,
  });

  factory WilayahKelompokModel.fromJson(Map<String, dynamic> json) {
    return WilayahKelompokModel(
      kelompokId: json['kelompokId'] ?? '',
      namaKelompok: json['namaKelompok'] ?? '',
      posko: json['posko'] != null
          ? {
              'latitude': (json['posko']['latitude'] as num).toDouble(),
              'longitude': (json['posko']['longitude'] as num).toDouble(),
            }
          : null,
      tipeArea: json['tipeArea'] ?? 'RADIUS',
      polygonKoordinat: json['polygonKoordinat'] != null
          ? (json['polygonKoordinat'] as List)
              .map((e) => {
                    'lat': (e['lat'] as num).toDouble(),
                    'lng': (e['lng'] as num).toDouble(),
                  })
              .toList()
          : null,
      radiusMeters: json['radiusMeters'] != null
          ? (json['radiusMeters'] as num).toDouble()
          : null,
    );
  }
}
