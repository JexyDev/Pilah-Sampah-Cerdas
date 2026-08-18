import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provider status koneksi internet real-time.
/// Sesuai srs.md NFR-05 dan ui_ux_flow.md §5.3.
final connectivityProvider = StreamProvider<List<ConnectivityResult>>((ref) {
  return Connectivity().onConnectivityChanged;
});

/// Provider boolean — true jika ada koneksi internet aktif.
final isOnlineProvider = Provider<bool>((ref) {
  final connectivity = ref.watch(connectivityProvider);
  return connectivity.when(skipLoadingOnReload: true, data: (results) =>
        results.any((result) => result != ConnectivityResult.none),
    loading: () => true, // Asumsi online saat loading awal
    error: (_, __) => false,
  );
});
