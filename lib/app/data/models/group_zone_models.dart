import 'package:latlong2/latlong.dart';

class GroupZoneData {
  final String kelompokId;
  final String kelompokName;
  final String? kelurahan;
  final int totalPosko;
  final List<PoskoItem> poskoList;
  final AutoZoneData autoZone;

  GroupZoneData({
    required this.kelompokId,
    required this.kelompokName,
    this.kelurahan,
    required this.totalPosko,
    required this.poskoList,
    required this.autoZone,
  });

  factory GroupZoneData.fromJson(Map<String, dynamic> json) {
    return GroupZoneData(
      kelompokId: json['kelompokId'] ?? '',
      kelompokName: json['kelompokName'] ?? '',
      kelurahan: json['kelurahan'],
      totalPosko: json['totalPosko'] ?? 0,
      poskoList: json['poskoList'] != null
          ? (json['poskoList'] as List).map((e) => PoskoItem.fromJson(e)).toList()
          : [],
      autoZone: AutoZoneData.fromJson(json['autoZone'] ?? {}),
    );
  }
}

class PoskoItem {
  final String id;
  final String nama;
  final String alamat;
  final double latitude;
  final double longitude;
  final bool isUtama;
  final int radius;
  final String type; // "POSKO_UTAMA" | "POSKO_MULTI"
  final String? fotoUrl;
  final String? keterangan;

  PoskoItem({
    required this.id,
    required this.nama,
    required this.alamat,
    required this.latitude,
    required this.longitude,
    required this.isUtama,
    required this.radius,
    required this.type,
    this.fotoUrl,
    this.keterangan,
  });

  factory PoskoItem.fromJson(Map<String, dynamic> json) {
    return PoskoItem(
      id: json['id'] ?? '',
      nama: json['nama'] ?? '',
      alamat: json['alamat'] ?? '',
      latitude: (json['latitude'] ?? 0).toDouble(),
      longitude: (json['longitude'] ?? 0).toDouble(),
      isUtama: json['isUtama'] ?? false,
      radius: json['radius'] ?? 0,
      type: json['type'] ?? 'POSKO_UTAMA',
      fotoUrl: json['fotoUrl'],
      keterangan: json['keterangan'],
    );
  }
}

class AutoZoneData {
  final List<LatLng>? polygon;
  final DateTime? updatedAt;
  final int studentCount;
  final bool isActive;

  AutoZoneData({
    this.polygon,
    this.updatedAt,
    required this.studentCount,
    required this.isActive,
  });

  factory AutoZoneData.fromJson(Map<String, dynamic> json) {
    List<LatLng>? parsedPolygon;
    if (json['polygon'] != null) {
      parsedPolygon = (json['polygon'] as List).map((point) {
        return LatLng(
          (point['lat'] ?? 0).toDouble(),
          (point['lng'] ?? 0).toDouble(),
        );
      }).toList();
    }

    return AutoZoneData(
      polygon: parsedPolygon,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) : null,
      studentCount: json['studentCount'] ?? 0,
      isActive: json['isActive'] ?? false,
    );
  }
}

class SmartZoneStatus {
  final bool isInsideAnyZone;
  final String? matchedPosko;
  final String? matchedPoskoId;
  final String matchedMethod;
  final double? distanceToNearestPosko;
  final String? nearestPoskoName;
  final bool autoPolygonActive;

  SmartZoneStatus({
    required this.isInsideAnyZone,
    this.matchedPosko,
    this.matchedPoskoId,
    required this.matchedMethod,
    this.distanceToNearestPosko,
    this.nearestPoskoName,
    required this.autoPolygonActive,
  });

  factory SmartZoneStatus.fromJson(Map<String, dynamic> json) {
    return SmartZoneStatus(
      isInsideAnyZone: json['isInsideAnyZone'] ?? false,
      matchedPosko: json['matchedPosko'],
      matchedPoskoId: json['matchedPoskoId'],
      matchedMethod: json['matchedMethod'] ?? 'NONE',
      distanceToNearestPosko: json['distanceToNearestPosko']?.toDouble(),
      nearestPoskoName: json['nearestPoskoName'],
      autoPolygonActive: json['autoPolygonActive'] ?? false,
    );
  }
}
