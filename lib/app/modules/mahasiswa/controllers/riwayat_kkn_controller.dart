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
    state = state.copyWith(isLoading: true, errorMessage: null);
    
    try {
      final kknRepo = ref.read(kknRepositoryProvider);
      
      final List<KknHistoryLog> parsedLogs = [];

      // 1. Ambil data Izin
      try {
        final izinList = await kknRepo.getPengajuanIzin();
        for (final izin in izinList) {
          final kategori = izin['kategori']?.toString() ?? 'Izin';
          final status = izin['status']?.toString().toUpperCase();
          final timestampStr = izin['createdAt']?.toString() ?? DateTime.now().toIso8601String();
          final timestamp = DateTime.tryParse(timestampStr) ?? DateTime.now();

          String title = 'Pengajuan Izin';
          String subtitle = 'Mengajukan $kategori';
          bool? isGpsActive;

          if (status == 'APPROVED') {
            title = 'Pengajuan Izin Disetujui';
            subtitle = 'DPL telah menyetujui pengajuan $kategori Anda';
            isGpsActive = true; // Use this to color it blue/green
          } else if (status == 'REJECTED') {
            title = 'Pengajuan Izin Ditolak';
            subtitle = 'DPL menolak pengajuan $kategori Anda';
            isGpsActive = false; // Use this to color it red
          } else {
            title = 'Pengajuan Izin (Menunggu)';
            subtitle = 'Pengajuan $kategori Anda sedang menunggu review DPL';
            isGpsActive = null;
          }

          parsedLogs.add(KknHistoryLog(
            title: title,
            subtitle: subtitle,
            timestamp: timestamp,
            type: KknHistoryType.izin,
            points: null,
            isGpsActive: isGpsActive,
          ));
        }
      } catch (_) {}

      // 2. Ambil data Activity Log (opsional, jika ada ping lokasi / dll)
      try {
        final rawData = await kknRepo.getActivityLog();
        for (final e in rawData) {
          final Map<String, dynamic> data = e as Map<String, dynamic>;
          
          final typeStr = data['type']?.toString().toLowerCase() ?? '';
          final type = typeStr == 'gps' || typeStr == 'location' ? KknHistoryType.gps : KknHistoryType.aktivasi;
          
          parsedLogs.add(KknHistoryLog(
            title: data['title']?.toString() ?? 'Riwayat Aktivitas',
            subtitle: data['subtitle']?.toString() ?? '',
            timestamp: DateTime.tryParse(data['timestamp']?.toString() ?? '') ?? DateTime.now(),
            type: type,
            points: null,
            isGpsActive: data['isGpsActive'] as bool?,
          ));
        }
      } catch (_) {}

      // Sort by descending timestamp
      parsedLogs.sort((a, b) => b.timestamp.compareTo(a.timestamp));

      state = state.copyWith(isLoading: false, logs: parsedLogs);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Gagal memuat riwayat: $e',
      );
    }
  }

  Future<void> refresh() => fetchHistory();
}

final riwayatKknControllerProvider = StateNotifierProvider<RiwayatKknNotifier, RiwayatKknState>((ref) {
  return RiwayatKknNotifier(ref);
});
