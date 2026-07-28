import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class LocationService {
  LocationService._();

  static final LocationService instance = LocationService._();

  /// Meminta izin lokasi dengan alert dialog edukasi sebelumnya
  Future<LocationPermission> checkAndRequestPermission(BuildContext context) async {
    bool serviceEnabled;
    LocationPermission permission;

    // Test if location services are enabled.
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return LocationPermission.unableToDetermine;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      // Tampilkan dialog penjelasan terlebih dahulu
      if (context.mounted) {
        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Text(
              'Izin Lokasi Diperlukan',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            content: const Text(
              'Lokasi kamu dipantau selama aplikasi dibuka untuk keperluan absensi kegiatan KKN secara real-time berdasarkan radius kegiatan.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Saya Mengerti', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      }

      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return LocationPermission.denied;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return LocationPermission.deniedForever;
    }

    return permission;
  }

  /// Mendapatkan koordinat saat ini
  Future<Position?> getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      );
    } catch (_) {
      return null;
    }
  }
}
