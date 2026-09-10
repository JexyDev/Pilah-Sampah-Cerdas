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
}
