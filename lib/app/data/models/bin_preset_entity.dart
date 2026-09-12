class BinPresetEntity {
  final String id;
  final String label;
  final double capacity;
  final double d;
  final double t;
  final double p;
  final double l;

  BinPresetEntity({
    required this.id,
    required this.label,
    required this.capacity,
    this.d = 0.0,
    this.t = 0.0,
    this.p = 0.0,
    this.l = 0.0,
  });

  factory BinPresetEntity.fromJson(Map<String, dynamic> json) {
    return BinPresetEntity(
      id: json['id'] ?? '',
      label: json['label'] ?? '',
      capacity: (json['capacity'] ?? 0).toDouble(),
      d: (json['diameter'] ?? 0).toDouble(), // API uses "diameter"
      t: (json['tinggi'] ?? 0).toDouble(),   // API uses "tinggi"
      p: (json['panjang'] ?? 0).toDouble(),  // API uses "panjang"
      l: (json['lebar'] ?? 0).toDouble(),    // API uses "lebar"
    );
  }

  String get capacityLabel =>
      '${capacity.toStringAsFixed(capacity.truncateToDouble() == capacity ? 0 : 1)} L';

  /// Ukuran standar baku resmi tempat sampah bentuk tabung/bulat (SNI/Standar Berseka)
  static List<BinPresetEntity> get defaultTabungPresets => [
        BinPresetEntity(
          id: 'preset-t-1',
          label: 'Kecil',
          capacity: 10.0,
          d: 23,
          t: 24,
        ),
        BinPresetEntity(
          id: 'preset-t-2',
          label: 'Sedang',
          capacity: 20.0,
          d: 29,
          t: 30,
        ),
        BinPresetEntity(
          id: 'preset-t-3',
          label: 'Besar',
          capacity: 40.0,
          d: 36,
          t: 39,
        ),
        BinPresetEntity(
          id: 'preset-t-4',
          label: 'Jumbo',
          capacity: 60.0,
          d: 40,
          t: 48,
        ),
      ];

  /// Ukuran standar baku resmi tempat sampah bentuk kotak/balok (SNI/Standar Berseka)
  static List<BinPresetEntity> get defaultKotakPresets => [
        BinPresetEntity(
          id: 'preset-k-1',
          label: 'Kecil',
          capacity: 12.0,
          p: 25,
          l: 20,
          t: 24,
        ),
        BinPresetEntity(
          id: 'preset-k-2',
          label: 'Sedang',
          capacity: 25.0,
          p: 40,
          l: 25,
          t: 25,
        ),
        BinPresetEntity(
          id: 'preset-k-3',
          label: 'Besar',
          capacity: 50.0,
          p: 40,
          l: 35,
          t: 36,
        ),
        BinPresetEntity(
          id: 'preset-k-4',
          label: 'Jumbo',
          capacity: 70.0,
          p: 45,
          l: 35,
          t: 45,
        ),
      ];
}
