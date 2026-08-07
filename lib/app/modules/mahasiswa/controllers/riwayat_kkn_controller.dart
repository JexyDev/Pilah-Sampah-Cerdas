import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/providers/repository_providers.dart';
import '../views/riwayat_kkn_view.dart'; // Import models from view

class RiwayatKknState {
  final bool isLoading;
  final String? errorMessage;
  final List<KknHistoryLog> logs;

  RiwayatKknState({
    this.isLoading = false,
    this.errorMessage,
    this.logs = const [],
  });

  RiwayatKknState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<KknHistoryLog>? logs,
  }) {
    return RiwayatKknState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      logs: logs ?? this.logs,
    );
  }
}

class RiwayatKknNotifier extends StateNotifier<RiwayatKknState> {
  RiwayatKknNotifier(this.ref) : super(RiwayatKknState()) {
    fetchHistory();
  }

  final Ref ref;

  Future<void> fetchHistory() async {
    final repo = ref.read(kknRepositoryProvider);
    
    // 1. Tampilkan cache jika ada
    final cachedData = await repo.getCachedActivityLog();
    if (cachedData != null && cachedData.isNotEmpty) {
      final List<KknHistoryLog> parsedLogs = cachedData.map((e) {
        final Map<String, dynamic> data = e as Map<String, dynamic>;
        final typeStr = data['type']?.toString().toLowerCase() ?? '';
        final type = typeStr == 'gps' ? KknHistoryType.gps : KknHistoryType.aktivasi;
        return KknHistoryLog(
          title: data['title']?.toString() ?? 'Riwayat Aktivitas',
          subtitle: data['subtitle']?.toString() ?? '',
          timestamp: DateTime.tryParse(data['timestamp']?.toString() ?? '') ?? DateTime.now(),
          type: type,
          points: data['points'] != null ? int.tryParse(data['points'].toString()) : null,
          isGpsActive: data['isGpsActive'] as bool?,
        );
      }).toList();
      state = state.copyWith(logs: parsedLogs);
    } else {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }
    
    try {
      final rawData = await repo.getActivityLog();
      
      final List<KknHistoryLog> parsedLogs = rawData.map((e) {
        final Map<String, dynamic> data = e as Map<String, dynamic>;
        
        // Parse type
        final typeStr = data['type']?.toString().toLowerCase() ?? '';
        final type = typeStr == 'gps' ? KknHistoryType.gps : KknHistoryType.aktivasi;
        
        return KknHistoryLog(
          title: data['title']?.toString() ?? 'Riwayat Aktivitas',
          subtitle: data['subtitle']?.toString() ?? '',
          timestamp: DateTime.tryParse(data['timestamp']?.toString() ?? '') ?? DateTime.now(),
          type: type,
          points: data['points'] != null ? int.tryParse(data['points'].toString()) : null,
          isGpsActive: data['isGpsActive'] as bool?,
        );
      }).toList();

      state = state.copyWith(isLoading: false, logs: parsedLogs);
    } catch (e) {
      if (cachedData != null) {
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Gagal memuat riwayat: $e',
        );
      }
    }
  }

  Future<void> refresh() => fetchHistory();
}

final riwayatKknControllerProvider = StateNotifierProvider<RiwayatKknNotifier, RiwayatKknState>((ref) {
  return RiwayatKknNotifier(ref);
});
