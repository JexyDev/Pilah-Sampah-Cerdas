import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/wilayah_kelompok_model.dart';
import '../../../data/providers/repository_providers.dart';

import '../../../data/models/group_zone_models.dart';

class KknMapState {
  final bool isLoading;
  final WilayahKelompokModel? wilayahKelompok;
  final GroupZoneData? groupZone;
  final String? error;

  KknMapState({
    this.isLoading = false,
    this.wilayahKelompok,
    this.groupZone,
    this.error,
  });

  KknMapState copyWith({
    bool? isLoading,
    WilayahKelompokModel? wilayahKelompok,
    GroupZoneData? groupZone,
    String? error,
    bool clearError = false,
  }) {
    return KknMapState(
      isLoading: isLoading ?? this.isLoading,
      wilayahKelompok: wilayahKelompok ?? this.wilayahKelompok,
      groupZone: groupZone ?? this.groupZone,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class KknMapController extends StateNotifier<KknMapState> {
  final Ref _ref;

  KknMapController(this._ref) : super(KknMapState()) {
    fetchWilayahKelompok();
  }

  Future<void> fetchWilayahKelompok() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final repo = _ref.read(kknRepositoryProvider);
      
      // Fetch data wilayah kelompok dasar
      final data = await repo.getWilayahKelompok();
      
      // Fetch Smart Multi-Zone (group zone data)
      GroupZoneData? groupZone;
      try {
        final zoneRaw = await repo.syncGroupZones();
        groupZone = GroupZoneData.fromJson(zoneRaw);
      } catch (e) {
        // If syncing group zones fails, we don't necessarily want to block the map from loading.
        // It might be unavailable or have network issues.
        debugPrint('[KknMapController] Failed to sync group zones: $e');
      }

      if (data != null) {
        state = state.copyWith(
          isLoading: false, 
          wilayahKelompok: data,
          groupZone: groupZone,
        );
      } else {
        state = state.copyWith(
            isLoading: false, error: 'Data wilayah tidak ditemukan');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final kknMapProvider =
    StateNotifierProvider<KknMapController, KknMapState>((ref) {
  return KknMapController(ref);
});
