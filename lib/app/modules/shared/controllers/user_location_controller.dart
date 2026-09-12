import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../data/services/location_service.dart';
import '../../auth/controllers/auth_controller.dart';

/// State lokasi dan alamat untuk Warga & Petugas Pemilah
class UserLocationState {
  final Position? position;
  final String? address;
  final bool isFetchingAddress;
  final String? error;

  const UserLocationState({
    this.position,
    this.address,
    this.isFetchingAddress = false,
    this.error,
  });

  UserLocationState copyWith({
    Position? position,
    String? address,
    bool? isFetchingAddress,
    String? error,
    bool clearError = false,
  }) {
    return UserLocationState(
      position: position ?? this.position,
      address: address ?? this.address,
      isFetchingAddress: isFetchingAddress ?? this.isFetchingAddress,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

/// Controller untuk memperbarui lokasi GPS dan mengonversi koordinat ke alamat
class UserLocationNotifier extends StateNotifier<UserLocationState> {
  final Ref? _ref;
  UserLocationNotifier([this._ref]) : super(const UserLocationState());

  /// Ambil lokasi GPS terkini dan konversi ke nama alamat (reverse geocoding)
  Future<void> refreshLocation({BuildContext? context, String? role}) async {
    // ponytail: geocoding reverse lookup; fallback ke lat/long desimal jika provider gagal
    state = state.copyWith(isFetchingAddress: true, clearError: true);
    try {
      if (context != null && context.mounted) {
        final currentRole = role ?? _ref?.read(authProvider).user?.role.name;
        final permission =
            await LocationService.instance.checkAndRequestPermission(
          context,
          role: currentRole,
        );
        if (permission == LocationPermission.denied ||
            permission == LocationPermission.deniedForever) {
          state = state.copyWith(
            isFetchingAddress: false,
            error: 'Izin lokasi tidak diberikan',
          );
          return;
        }
      }

      final pos = await LocationService.instance.getCurrentLocation();
      if (pos == null) {
        state = state.copyWith(
          isFetchingAddress: false,
          error: 'Lokasi tidak terdeteksi. Aktifkan GPS Anda.',
        );
        return;
      }

      state = state.copyWith(position: pos);

      final address = await LocationService.instance.getAddressFromCoordinates(
        pos.latitude,
        pos.longitude,
      );

      state = state.copyWith(
        position: pos,
        address: address,
        isFetchingAddress: false,
        clearError: true,
      );
    } catch (e) {
      state = state.copyWith(
        isFetchingAddress: false,
        error: 'Gagal memperbarui alamat',
      );
    }
  }
}

/// Provider shared lokasi & reverse geocoding alamat
final userLocationProvider =
    StateNotifierProvider<UserLocationNotifier, UserLocationState>((ref) {
  return UserLocationNotifier(ref);
});
