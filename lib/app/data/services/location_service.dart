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
      if (context.mounted) {
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Izin Lokasi Diblokir', style: TextStyle(fontWeight: FontWeight.bold)),
            content: const Text('Fitur ini wajib menggunakan GPS. Silakan buka Pengaturan HP Anda dan izinkan akses lokasi.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Batal', style: TextStyle(color: Colors.grey)),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Geolocator.openAppSettings();
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                child: const Text('Pengaturan'),
              ),
            ],
          ),
        );
      }
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

      Position? pos;
      // FIX: Timeout diperpanjang ke 15 detik & gunakan medium accuracy
      // (menggabungkan Cell Tower + Wi-Fi + GPS) untuk cold-start lebih cepat.
      // Jika masih timeout, coba ulang dengan low accuracy (network-only),
      // lalu fallback ke last known position.
      try {
        pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            distanceFilter: 0,
          ),
        ).timeout(const Duration(seconds: 15));
      } catch (_) {
        // Retry dengan akurasi lebih rendah (network-only, lebih cepat)
        try {
          pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.low,
              distanceFilter: 0,
            ),
          ).timeout(const Duration(seconds: 8));
        } catch (_) {
          pos = await Geolocator.getLastKnownPosition();
        }
      }
      return pos;
    } catch (_) {
      return null;
    }
  }
}
