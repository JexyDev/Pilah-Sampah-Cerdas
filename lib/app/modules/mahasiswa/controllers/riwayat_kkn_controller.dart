import 'package:flutter/foundation.dart';
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
          final timestamp = (DateTime.tryParse(timestampStr) ?? DateTime.now()).toLocal();

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
          KknHistoryType type;
          if (typeStr == 'gps' || typeStr == 'location') {
            type = KknHistoryType.gps;
          } else if (typeStr == 'laporan') {
            type = KknHistoryType.laporan;
          } else {
            type = KknHistoryType.aktivasi;
          }
          
          parsedLogs.add(KknHistoryLog(
            title: data['title']?.toString() ?? 'Riwayat Aktivitas',
            subtitle: data['subtitle']?.toString() ?? '',
            timestamp: (DateTime.tryParse(data['timestamp']?.toString() ?? '') ?? DateTime.now()).toLocal(),
            type: type,
            points: null,
            isGpsActive: data['isGpsActive'] as bool?,
            statusKehadiran: data['statusKehadiran']?.toString() ?? data['status']?.toString(),
            durationFormatted: data['durationFormatted']?.toString() ?? data['durasiFormatted']?.toString(),
            scheduleId: data['scheduleId']?.toString() ?? data['kegiatanId']?.toString(),
          ));
        }
      } catch (_) {}

      // 3. Ambil data Riwayat Kegiatan
      try {
        final historyData = await kknRepo.getKknHistory();
        for (final e in historyData) {
          final Map<String, dynamic> data = e as Map<String, dynamic>;
          
          final typeStr = data['type']?.toString().toLowerCase() ?? '';
          final type = (typeStr == 'aktivasi') ? KknHistoryType.aktivasi : KknHistoryType.gps;
          
          String title = data['title']?.toString() ?? 'Riwayat Kegiatan';
          if (data['kegiatan'] != null && data['kegiatan'] is Map) {
              title = data['kegiatan']['name']?.toString() ?? title;
          }
          
          parsedLogs.add(KknHistoryLog(
            title: title,
            subtitle: data['subtitle']?.toString() ?? data['statusKehadiran']?.toString() ?? 'Presensi KKN',
            timestamp: (DateTime.tryParse(data['timestamp']?.toString() ?? data['createdAt']?.toString() ?? '') ?? DateTime.now()).toLocal(),
            type: type,
            points: data['points'] as int?,
            isGpsActive: data['isGpsActive'] as bool?,
            statusKehadiran: data['statusKehadiran']?.toString() ?? data['status']?.toString(),
            durationFormatted: data['durationFormatted']?.toString() ?? data['durasiFormatted']?.toString(),
            scheduleId: data['scheduleId']?.toString() ?? data['kegiatanId']?.toString() ?? data['id']?.toString(),
          ));
        }
      } catch (e) {
        // Abaikan jika error / endpoint belum siap
      }

      // 4. Ambil data Kegiatan Aktif (karena kegiatan selesai masih direturn di sini)
      try {
        final kegiatanAktif = await kknRepo.getKegiatanAktif();
        for (final data in kegiatanAktif) {
          if (data['status'] == 'SELESAI' || data['attendanceStatus'] == 'HADIR' || data['attendanceStatus'] == 'SELESAI') {
            final title = data['nama']?.toString() ?? data['namaKegiatan']?.toString() ?? 'Riwayat Kegiatan';
            parsedLogs.add(KknHistoryLog(
              title: title,
              subtitle: 'Kegiatan Selesai',
              timestamp: (DateTime.tryParse(data['tanggal']?.toString() ?? data['tanggalKegiatan']?.toString() ?? '') ?? DateTime.now()).toLocal(),
              type: KknHistoryType.gps,
              points: null,
              isGpsActive: true,
              statusKehadiran: data['attendanceStatus']?.toString(),
              durationFormatted: null,
              scheduleId: data['id']?.toString(),
            ));
          }
        }
      } catch (e) {
        debugPrint('[RiwayatKknNotifier] getKegiatanAktif error: $e');
      }

      // Sort by descending timestamp
      parsedLogs.sort((a, b) => b.timestamp.compareTo(a.timestamp));

      // Remove duplicates (same type and scheduleId/timestamp)
      final List<KknHistoryLog> uniqueLogs = [];
      final Set<String> seen = {};
      for (final log in parsedLogs) {
        final key = '${log.type}_${log.scheduleId}_${log.title}_${log.timestamp.toIso8601String()}';
        if (!seen.contains(key)) {
          seen.add(key);
          uniqueLogs.add(log);
        }
      }

      state = state.copyWith(isLoading: false, logs: uniqueLogs);
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
