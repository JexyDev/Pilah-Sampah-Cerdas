import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/utils/platform_utils.dart';

class LocationService {
  LocationService._();

  static final LocationService instance = LocationService._();

  /// Meminta izin lokasi dengan alert dialog edukasi sesuai peran pengguna
  Future<LocationPermission> checkAndRequestPermission(
    BuildContext context, {
    String? role,
    String? customMessage,
    bool mandatory = false,
  }) async {
    if (!PlatformUtils.isMobile) {
      return LocationPermission.always;
    }

    bool serviceEnabled;
    LocationPermission permission;

    // Test if location services are enabled.
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (context.mounted) {
        await showDialog(
          context: context,
          barrierDismissible: !mandatory,
          builder: (ctx) => PopScope(
            canPop: !mandatory,
            child: AlertDialog(
              title: const Text(
                'GPS Tidak Aktif',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: const Text(
                'Layanan GPS pada HP Anda sedang mati. Silakan aktifkan GPS agar dapat menggunakan aplikasi.',
              ),
              actions: [
                if (!mandatory)
                  TextButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    child: const Text('Batal', style: TextStyle(color: Colors.grey)),
                  ),
                ElevatedButton(
                  onPressed: () async {
                    Navigator.of(ctx).pop();
                    final isNowEnabled =
                        await Geolocator.isLocationServiceEnabled();
                    if (!isNowEnabled) {
                      Geolocator.openLocationSettings();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Aktifkan GPS'),
                ),
              ],
            ),
          ),
        );
      }
      return LocationPermission.unableToDetermine;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      // Tampilkan dialog penjelasan sesuai role
      if (context.mounted) {
        String message;
        if (customMessage != null && customMessage.isNotEmpty) {
          message = customMessage;
        } else {
          final r =
              role?.toLowerCase().replaceAll('_', '').replaceAll(' ', '') ?? '';
          if (r.contains('petugas')) {
            message =
                'Izin lokasi digunakan untuk memvalidasi lokasi penimbangan sampah dan pencatatan operasional pemilahan sampah.';
          } else if (r.contains('mahasiswa') || r.contains('kkn')) {
            message =
                'Lokasi kamu dipantau selama aplikasi dibuka untuk keperluan absensi kegiatan KKN secara real-time berdasarkan radius kegiatan.';
          } else {
            // Role Warga (role default di mobile)
            message =
                'Izin lokasi digunakan untuk mendeteksi alamat tempat sampah dan memverifikasi setoran pemilahan sampah Anda secara akurat.';
          }
        }

        await showDialog(
          context: context,
          barrierDismissible: !mandatory,
          builder: (ctx) => PopScope(
            canPop: !mandatory,
            child: AlertDialog(
              title: const Text(
                'Izin Lokasi Diperlukan',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: Text(message),
              actions: [
                ElevatedButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text(
                    'Lanjutkan & Izinkan',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        );
      }

      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return LocationPermission.denied;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      if (context.mounted) {
        await showDialog(
          context: context,
          barrierDismissible: !mandatory,
          builder: (ctx) => PopScope(
            canPop: !mandatory,
            child: AlertDialog(
              title: const Text(
                'Izin Lokasi Diblokir',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              content: const Text(
                'Fitur ini wajib menggunakan GPS. Silakan buka Pengaturan HP Anda dan izinkan akses lokasi.',
              ),
              actions: [
                if (!mandatory)
                  TextButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    child: const Text(
                      'Batal',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    Geolocator.openAppSettings();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Buka Pengaturan'),
                ),
              ],
            ),
          ),
        );
      }
      return LocationPermission.deniedForever;
    }

    return permission;
  }

  /// Mendapatkan koordinat saat ini
  Future<Position?> getCurrentLocation() async {
    if (PlatformUtils.isMobile) {
      try {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (serviceEnabled) {
          LocationPermission permission = await Geolocator.checkPermission();
          if (permission != LocationPermission.denied &&
              permission != LocationPermission.deniedForever) {
            Position? pos;
            try {
              pos = await Geolocator.getCurrentPosition(
                locationSettings: const LocationSettings(
                  accuracy: LocationAccuracy.medium,
                  distanceFilter: 0,
                ),
              ).timeout(const Duration(seconds: 10));
            } catch (_) {
              try {
                pos = await Geolocator.getCurrentPosition(
                  locationSettings: const LocationSettings(
                    accuracy: LocationAccuracy.low,
                    distanceFilter: 0,
                  ),
                ).timeout(const Duration(seconds: 6));
              } catch (_) {
                pos = await Geolocator.getLastKnownPosition();
              }
            }
            if (pos != null) return pos;
          }
        }
      } catch (_) {}
    }

    // Fallback: IP Geolocation untuk platform desktop/Linux atau saat hardware GPS tidak tersedia
    try {
      final uri = Uri.parse('http://ip-api.com/json');
      final data = await _httpGetJson(uri);
      if (data is Map<String, dynamic> && data['status'] == 'success') {
        final lat = (data['lat'] as num).toDouble();
        final lon = (data['lon'] as num).toDouble();
        return Position(
          longitude: lon,
          latitude: lat,
          timestamp: DateTime.now(),
          accuracy: 100,
          altitude: 0,
          altitudeAccuracy: 0,
          heading: 0,
          headingAccuracy: 0,
          speed: 0,
          speedAccuracy: 0,
        );
      }
    } catch (_) {}

    return null;
  }

  /// Mengonversi koordinat (lat, lng) ke nama alamat ringkas (reverse geocoding)
  /// Format disesuaikan dengan standar tampilan di modul Mahasiswa.
  Future<String?> getAddressFromCoordinates(double lat, double lng) async {
    // 1. Coba native Geocoding (Android & iOS)
    if (PlatformUtils.isMobile) {
      try {
        final placemarks = await Geocoding()
            .placemarkFromCoordinates(lat, lng)
            .timeout(const Duration(seconds: 5));
        if (placemarks.isNotEmpty) {
          final p = placemarks.first;
          String address = '';
          if (p.street != null && p.street!.isNotEmpty) {
            address = p.street!;
            if (p.country != null && p.country!.isNotEmpty) {
              address = address.replaceAll(', ${p.country!}', '').trim();
              if (address.endsWith(',')) {
                address = address.substring(0, address.length - 1);
              }
            }
          } else {
            final parts = <String>[];
            if (p.subLocality != null && p.subLocality!.isNotEmpty) {
              parts.add(p.subLocality!);
            }
            if (p.locality != null && p.locality!.isNotEmpty) {
              parts.add(p.locality!);
            }
            address = parts.join(', ');
          }
          if (address.isNotEmpty) return address;
        }
      } catch (_) {
        // Native geocoding tidak tersedia / gagal
      }
    }

    // 2. Fallback OpenStreetMap (Nominatim) Reverse Geocoding (Semua Platform termasuk Linux & Web)
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1',
      );
      final data = await _httpGetJson(
        uri,
        headers: {'User-Agent': 'BersekaMobile/1.0'},
      );

      if (data is Map<String, dynamic>) {
        final addr = data['address'] as Map<String, dynamic>?;
        if (addr != null) {
          final road = addr['road'] ?? addr['pedestrian'] ?? addr['neighbourhood'] ?? addr['suburb'];
          final village = addr['village'] ?? addr['suburb'] ?? addr['city_district'];
          final city = addr['city'] ?? addr['county'] ?? addr['state'];
          final parts = [road, village, city]
              .where((e) => e != null && e.toString().trim().isNotEmpty)
              .toList();
          if (parts.isNotEmpty) {
            return parts.join(', ');
          }
        }
        final displayName = data['display_name'] as String?;
        if (displayName != null && displayName.isNotEmpty) {
          final parts = displayName.split(',');
          if (parts.length > 3) {
            return parts.take(3).join(',').trim();
          }
          return displayName;
        }
      }
    } catch (_) {}

    return 'Koordinat GPS: ${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
  }

  Future<dynamic> _httpGetJson(Uri uri, {Map<String, String>? headers}) async {
    HttpClient? client;
    try {
      client = HttpClient()..connectionTimeout = const Duration(seconds: 5);
      final request = await client.getUrl(uri);
      headers?.forEach((k, v) => request.headers.set(k, v));
      final response = await request.close().timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final body = await response.transform(utf8.decoder).join();
        return jsonDecode(body);
      }
    } catch (_) {
      return null;
    } finally {
      client?.close(force: true);
    }
    return null;
  }
}
