import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class UserLocationState {
  final Position? currentPosition;
  final String? currentAddress;
  final bool isFetchingAddress;

  UserLocationState({
    this.currentPosition,
    this.currentAddress,
    this.isFetchingAddress = false,
  });

  UserLocationState copyWith({
    Position? currentPosition,
    String? currentAddress,
    bool? isFetchingAddress,
  }) {
    return UserLocationState(
      currentPosition: currentPosition ?? this.currentPosition,
      currentAddress: currentAddress ?? this.currentAddress,
      isFetchingAddress: isFetchingAddress ?? this.isFetchingAddress,
    );
  }
}

class UserLocationNotifier extends StateNotifier<UserLocationState> {
  UserLocationNotifier() : super(UserLocationState());

  Future<void> fetchAddress() async {
    state = state.copyWith(isFetchingAddress: true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          state = state.copyWith(
            currentAddress: 'Izin lokasi ditolak',
            isFetchingAddress: false,
          );
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        state = state.copyWith(
          currentAddress: 'Izin lokasi ditolak permanen',
          isFetchingAddress: false,
        );
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          timeLimit: Duration(seconds: 10),
        ),
      );

      state = state.copyWith(currentPosition: pos);

      List<Placemark> placemarks = await Geocoding().placemarkFromCoordinates(
        pos.latitude,
        pos.longitude,
      );

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
          List<String> parts = [];
          if (p.subLocality != null && p.subLocality!.isNotEmpty) {
            parts.add(p.subLocality!);
          }
          if (p.locality != null && p.locality!.isNotEmpty) {
            parts.add(p.locality!);
          }
          address = parts.join(', ');
        }
        if (address.isEmpty) address = 'Lokasi tidak diketahui';
        state = state.copyWith(
          currentAddress: address,
          isFetchingAddress: false,
        );
      } else {
        state = state.copyWith(
          currentAddress: 'Lokasi tidak ditemukan',
          isFetchingAddress: false,
        );
      }
    } catch (e) {
      state = state.copyWith(
        currentAddress: 'Gagal memuat alamat',
        isFetchingAddress: false,
      );
    }
  }
}

final userLocationProvider =
    StateNotifierProvider<UserLocationNotifier, UserLocationState>((ref) {
      return UserLocationNotifier();
    });
