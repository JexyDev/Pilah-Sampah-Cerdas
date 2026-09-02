import 'dart:math' as math;

/// Hasil evaluasi posisi geofence
class GeofenceResult {
  final bool isInside;
  final double distanceToTargetMeters;
  final double? targetLat;
  final double? targetLng;
  final String methodUsed; // 'POLYGON' | 'RADIUS' | 'NO_TARGET'
  final DateTime evaluatedAt;

  const GeofenceResult({
    required this.isInside,
    required this.distanceToTargetMeters,
    this.targetLat,
    this.targetLng,
    required this.methodUsed,
    required this.evaluatedAt,
  });

  Map<String, dynamic> toJson() => {
        'isInside': isInside,
        'distanceToTargetMeters': distanceToTargetMeters,
        'targetLat': targetLat,
        'targetLng': targetLng,
        'methodUsed': methodUsed,
        'evaluatedAt': evaluatedAt.toIso8601String(),
      };
}

/// Standar Target Minimum Waktu KKN
class KknTargetRules {
  /// Target minimal jam kegiatan KKN mahasiswa (200 Jam)
  static const int minTargetKknHours = 200;
  static const int minTargetKknMinutes = minTargetKknHours * 60; // 12.000 menit
  static const int minTargetKknSeconds = minTargetKknMinutes * 60; // 720.000 detik

  /// Cek apakah mahasiswa telah memenuhi target minimal 200 jam
  static bool hasMetMinimumTarget(int accumulatedSeconds) {
    return accumulatedSeconds >= minTargetKknSeconds;
  }

  /// Hitung persentase pencapaian terhadap target minimal 200 jam
  static double calculateTargetProgress(int accumulatedSeconds) {
    if (minTargetKknSeconds <= 0) return 1.0;
    return (accumulatedSeconds / minTargetKknSeconds).clamp(0.0, 1.0);
  }
}

/// Engine Geofence Modular untuk validasi lokasi inbound/outbound mahasiswa KKN
class GeofenceZoneEngine {
  /// Menghitung jarak antara dua koordinat GPS menggunakan formula Haversine (dalam meter)
  static double calculateHaversineDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const earthRadiusMeters = 6371000.0;
    final dLat = _degToRad(lat2 - lat1);
    final dLon = _degToRad(lon2 - lon1);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_degToRad(lat1)) *
            math.cos(_degToRad(lat2)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  static double _degToRad(double deg) => deg * (math.pi / 180.0);

  /// Algoritma Ray Casting untuk mengecek apakah titik (lat, lng) berada dalam poligon
  static bool isPointInPolygon(
    double pointLat,
    double pointLng,
    List<List<double>> polygon,
  ) {
    if (polygon.length < 3) return false;

    bool inside = false;
    int j = polygon.length - 1;

    for (int i = 0; i < polygon.length; i++) {
      final xi = polygon[i][0];
      final yi = polygon[i][1];
      final xj = polygon[j][0];
      final yj = polygon[j][1];

      final intersect = ((yi > pointLng) != (yj > pointLng)) &&
          (pointLat < (xj - xi) * (pointLng - yi) / (yj - yi) + xi);

      if (intersect) {
        inside = !inside;
      }
      j = i;
    }

    return inside;
  }

  /// Menghitung titik tengah (centroid) dari sekumpulan koordinat poligon
  static Map<String, double> calculateCentroid(List<List<double>> polygon) {
    if (polygon.isEmpty) return {'lat': 0.0, 'lng': 0.0};
    double sumLat = 0.0;
    double sumLng = 0.0;
    for (final p in polygon) {
      sumLat += p[0];
      sumLng += p[1];
    }
    return {
      'lat': sumLat / polygon.length,
      'lng': sumLng / polygon.length,
    };
  }

  /// Evaluasi lengkap apakah posisi mahasiswa berada dalam zona target yang valid
  static GeofenceResult evaluatePosition({
    required double userLat,
    required double userLng,
    double? targetLat,
    double? targetLng,
    double radiusMeters = 500.0,
    List<List<double>>? polygon,
  }) {
    final now = DateTime.now();

    // 1. Cek Polygon (Prioritas tertinggi jika data polygon RW/Posko tersedia)
    if (polygon != null && polygon.length >= 3) {
      final inside = isPointInPolygon(userLat, userLng, polygon);
      final centroid = calculateCentroid(polygon);
      final dist = calculateHaversineDistance(
        userLat,
        userLng,
        centroid['lat']!,
        centroid['lng']!,
      );

      return GeofenceResult(
        isInside: inside,
        distanceToTargetMeters: dist,
        targetLat: centroid['lat'],
        targetLng: centroid['lng'],
        methodUsed: 'POLYGON',
        evaluatedAt: now,
      );
    }

    // 2. Cek Radius Geofence (Fallback jika target koordinat ditentukan)
    if (targetLat != null && targetLng != null && (targetLat != 0.0 || targetLng != 0.0)) {
      final dist = calculateHaversineDistance(
        userLat,
        userLng,
        targetLat,
        targetLng,
      );
      final inside = dist <= radiusMeters;

      return GeofenceResult(
        isInside: inside,
        distanceToTargetMeters: dist,
        targetLat: targetLat,
        targetLng: targetLng,
        methodUsed: 'RADIUS',
        evaluatedAt: now,
      );
    }

    // 3. Tidak ada target zona yang ditentukan
    return GeofenceResult(
      isInside: false,
      distanceToTargetMeters: 999999.0,
      methodUsed: 'NO_TARGET',
      evaluatedAt: now,
    );
  }
}
