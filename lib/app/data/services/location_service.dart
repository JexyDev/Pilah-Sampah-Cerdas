import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

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
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    Geolocator.openLocationSettings();
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

  /// Mengonversi koordinat (lat, lng) ke nama alamat ringkas (reverse geocoding)
  /// Format disesuaikan dengan standar tampilan di modul Mahasiswa.
  Future<String?> getAddressFromCoordinates(double lat, double lng) async {
    // ponytail: reverse geocoding placemark; fallback jika gagal/offline
    try {
      final placemarks = await Geocoding().placemarkFromCoordinates(lat, lng);
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
        if (address.isEmpty) address = 'Lokasi tidak diketahui';
        return address;
      }
      return 'Lokasi tidak ditemukan';
    } catch (_) {
      return 'Gagal memuat alamat';
    }
  }
}
