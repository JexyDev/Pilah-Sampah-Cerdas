import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../data/providers/repository_providers.dart';
import '../views/riwayat_kkn_view.dart'; // Import models from view

class RiwayatKknState {
  final bool isLoading;
  final String? errorMessage;
  final List<KknHistoryLog> logs;
  final Map<String, dynamic>? timesheetSummary;

  RiwayatKknState({
    this.isLoading = false,
    this.errorMessage,
    this.logs = const [],
    this.timesheetSummary,
  });

  RiwayatKknState copyWith({
    bool? isLoading,
    String? errorMessage,
    List<KknHistoryLog>? logs,
    Map<String, dynamic>? timesheetSummary,
  }) {
    return RiwayatKknState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      logs: logs ?? this.logs,
      timesheetSummary: timesheetSummary ?? this.timesheetSummary,
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

      // 1. Ambil data Izin & Sakit (Aktivitas Non-Poin)
      try {
        final izinList = await kknRepo.getPengajuanIzin();
        for (final izin in izinList) {
          final rawKategori = izin['kategori']?.toString() ?? 'Izin';
          final status = (izin['status']?.toString() ?? '').toUpperCase();
          final timestampStr =
              izin['createdAt']?.toString() ?? DateTime.now().toIso8601String();
          final timestamp = (DateTime.tryParse(timestampStr) ?? DateTime.now())
              .toLocal();

          final isSakit = rawKategori.toUpperCase().contains('SAKIT');
          final jenis = isSakit ? 'Sakit' : 'Izin';
          final labelKategori = isSakit ? 'SAKIT' : 'IZIN';

          String title;
          String subtitle;
          bool? isGpsActive;

          if (status == 'APPROVED' || status == 'DISETUJUI') {
            title = 'Pengajuan $jenis Disetujui';
            subtitle = 'DPL telah menyetujui pengajuan $labelKategori Anda';
            isGpsActive = true; // Indikator ACC (hijau)
          } else if (status == 'REJECTED' || status == 'DITOLAK') {
            title = 'Pengajuan $jenis Ditolak';
            subtitle = 'DPL menolak pengajuan $labelKategori Anda';
            isGpsActive = false; // Indikator ditolak (merah)
          } else {
            title = 'Pengajuan $jenis (Menunggu)';
            subtitle =
                'Pengajuan $labelKategori Anda sedang menunggu review DPL';
            isGpsActive = null; // Indikator pending (oranye)
          }

          parsedLogs.add(
            KknHistoryLog(
              title: title,
              subtitle: subtitle,
              timestamp: timestamp,
              type: KknHistoryType.izin,
              points: null, // Murni Non-Poin
              isGpsActive: isGpsActive,
            ),
          );
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

          parsedLogs.add(
            KknHistoryLog(
              title: data['title']?.toString() ?? 'Riwayat Aktivitas',
              subtitle: data['subtitle']?.toString() ?? '',
              timestamp:
                  (DateTime.tryParse(data['timestamp']?.toString() ?? '') ??
                          DateTime.now())
                      .toLocal(),
              type: type,
              points: null,
              isGpsActive: data['isGpsActive'] as bool?,
              statusKehadiran:
                  data['statusKehadiran']?.toString() ??
                  data['status']?.toString(),
              durationFormatted:
                  data['durationFormatted']?.toString() ??
                  data['durasiFormatted']?.toString(),
              scheduleId:
                  data['scheduleId']?.toString() ??
                  data['kegiatanId']?.toString(),
              isMemenuhiDurasi: data['isMemenuhiDurasi'] as bool?,
              statusDisplay: data['statusDisplay']?.toString(),
              durasiAktualMenit: data['durasiAktualMenit'] as int?,
              durasiTargetMenit: data['durasiTargetMenit'] as int?,
              rawData: data,
            ),
          );
        }
      } catch (_) {}

      // 3. (Dihapus) getKknHistory redundan karena endpoint /history dan /activity-log di-mapping ke fungsi yang sama di backend.

      // 4. Ambil data Kegiatan Aktif (karena kegiatan selesai masih direturn di sini)
      try {
        final kegiatanAktif = await kknRepo.getKegiatanAktif();
        for (final data in kegiatanAktif) {
          final attStatus = data['attendanceStatus']?.toString() ?? '';
          if (data['status'] == 'SELESAI' ||
              attStatus == 'HADIR' ||
              attStatus == 'SELESAI' ||
              attStatus == 'HADIR_MEMENUHI' ||
              attStatus == 'HADIR_TIDAK_MEMENUHI' ||
              attStatus == 'SELESAI_TELAT') {
            final title =
                data['nama']?.toString() ??
                data['namaKegiatan']?.toString() ??
                'Riwayat Kegiatan';
            var dateStr =
                data['tanggal']?.toString() ??
                data['tanggalKegiatan']?.toString() ??
                '';
            var timeStr =
                data['time']?.toString() ??
                data['jamKegiatan']?.toString() ??
                '';

            DateTime parsedDate = DateTime.tryParse(dateStr) ?? DateTime.now();
            if (timeStr.isNotEmpty) {
              var startTime = timeStr.split('-').first.trim();
              var parts = startTime.split(':');
              if (parts.length == 2) {
                var h = int.tryParse(parts[0]) ?? 0;
                var m = int.tryParse(parts[1]) ?? 0;
                parsedDate = DateTime(
                  parsedDate.year,
                  parsedDate.month,
                  parsedDate.day,
                  h,
                  m,
                );
              }
            }
            final timestamp = parsedDate.toLocal();

            parsedLogs.add(
              KknHistoryLog(
                title: title,
                subtitle: 'Kegiatan Selesai',
                timestamp: timestamp,
                type: KknHistoryType.gps,
                points: null, // Murni Non-Poin
                isGpsActive: true,
                statusKehadiran: data['attendanceStatus']?.toString(),
                durationFormatted: null,
                scheduleId:
                    data['id']?.toString() ?? data['scheduleId']?.toString(),
                isMemenuhiDurasi: data['isMemenuhiDurasi'] as bool?,
                statusDisplay: data['statusDisplay']?.toString(),
                durasiAktualMenit: data['durasiAktualMenit'] as int?,
                durasiTargetMenit: data['durasiTargetMenit'] as int?,
              ),
            );
          }
        }
      } catch (e) {
        debugPrint('[RiwayatKknNotifier] getKegiatanAktif error: $e');
      }

      // 5. Ambil data Logbook Harian (Agar logbook muncul di tab Riwayat Non-Poin terlepas dari limit poin)
      try {
        final logbookList = await kknRepo.getLogbookList();
        for (final lb in logbookList) {
          const title = 'Logbook Harian';
          final desc =
              lb['deskripsi']?.toString() ?? 'Laporan aktivitas harian';
          // Prioritaskan createdAt agar jam submission aktual muncul (sama seperti di Riwayat Poin)
          final dateStr =
              lb['createdAt']?.toString() ??
              lb['tanggalKegiatan']?.toString() ??
              '';
          final timestamp =
              DateTime.tryParse(dateStr)?.toLocal() ?? DateTime.now();

          parsedLogs.add(
            KknHistoryLog(
              title: title,
              subtitle: desc,
              timestamp: timestamp,
              type: KknHistoryType.aktivasi,
              points: null, // Murni Non-Poin di tab Riwayat
              statusKehadiran: lb['statusApproval']?.toString() ?? 'PENDING',
              rawData: lb,
            ),
          );
        }
      } catch (e) {
        debugPrint('[RiwayatKknNotifier] getLogbookList error: $e');
      }

      // Ambil data Program Kerja dan masukkan ke Riwayat
      try {
        final prokerList = await kknRepo.getProgramKerja();
        for (final p in prokerList) {
          final statusUsulan = p['statusUsulan']?.toString() ?? p['status']?.toString() ?? 'BELUM_DISETUJUI';
          
          final judul = p['judul']?.toString() ?? 'Program Kerja';
          final statusPelaksanaan = p['statusPelaksanaan']?.toString() ?? '';
          final dateStr = p['tanggal']?.toString() ?? p['createdAt']?.toString() ?? '';
          final timestamp = (DateTime.tryParse(dateStr) ?? DateTime.now()).toLocal();
          
          String sub = 'Proker Diajukan (Menunggu ACC)';
          if (statusUsulan == 'DITOLAK' || statusUsulan == 'TIDAK_DISETUJUI') {
            sub = 'Proker Perlu Revisi / Ditolak';
          } else if (statusUsulan == 'DISETUJUI' || statusUsulan == 'DITERIMA' || statusUsulan == 'SELESAI') {
            sub = 'Proker Disetujui (ACC)';
            if (statusPelaksanaan == 'SEDANG_BERJALAN') sub = 'Proker Sedang Berjalan';
            if (statusPelaksanaan == 'SELESAI') sub = 'Proker Selesai (Menunggu Klaim 60%)';
          }

          parsedLogs.add(
            KknHistoryLog(
              title: judul,
              subtitle: sub,
              timestamp: timestamp,
              type: KknHistoryType.proker,
              points: null,
              isGpsActive: false,
              scheduleId: 'proker_${p['id']}',
              rawData: p,
            ),
          );
        }
      } catch (e) {
        debugPrint('[RiwayatKknNotifier] getProgramKerja error: $e');
      }

      // 6. Ambil data Laporan Pemanfaatan Sampah & Catat Hasil Panen (Aktivitas Non-Poin)
      try {
        final pemanfaatanList = await kknRepo.getPemanfaatanLogs();
        for (final item in pemanfaatanList) {
          final teknologi =
              item['teknologi']?.toString() ?? 'Pemanfaatan Sampah';
          final bahanBaku = item['bahanBaku']?.toString().trim() ?? '';
          final rawBerat =
              item['volumeBahanBaku'] ??
              item['jumlahBahanMasukKg'] ??
              item['beratInputKg'] ??
              item['beratBahan'];
          final num? beratNum = (rawBerat is num)
              ? rawBerat
              : (rawBerat != null ? num.tryParse(rawBerat.toString()) : null);
          final String beratFormatted = (beratNum != null && beratNum > 0)
              ? (beratNum % 1 == 0
                    ? '${beratNum.toInt()}'
                    : beratNum.toStringAsFixed(1))
              : '';

          final hasil = item['hasil'];
          final nilaiEkonomi = item['nilaiEkonomi'] ?? item['luasLahanM2'];
          final dateStr =
              item['createdAt']?.toString() ??
              item['tanggal']?.toString() ??
              '';
          final timestamp = (DateTime.tryParse(dateStr) ?? DateTime.now())
              .toLocal();
          final id = item['id']?.toString() ?? '';

          final parsedHasilNum = (hasil is num) ? hasil : (num.tryParse(hasil?.toString() ?? '0') ?? 0);
          final hasHarvest =
              parsedHasilNum > 0 || (item['hasHarvested'] == true);

          if (hasHarvest) {
            final hasilStr = parsedHasilNum % 1 == 0
                ? '${parsedHasilNum.toInt()}'
                : parsedHasilNum.toStringAsFixed(1);
            final subText = (nilaiEkonomi != null && (nilaiEkonomi as num) > 0)
                ? 'Hasil panen: $hasilStr kg • Nilai: Rp ${NumberFormat('#,###').format(nilaiEkonomi)}'
                : 'Hasil panen: $hasilStr kg';
            parsedLogs.add(
              KknHistoryLog(
                title: 'Panen Hasil: $teknologi',
                subtitle: subText,
                timestamp: timestamp,
                type: KknHistoryType.laporan,
                points: null, // Murni Non-Poin
                isGpsActive: true,
                scheduleId: 'panen_$id',
                rawData: item,
              ),
            );
          } else {
            String subText;
            if (bahanBaku.isNotEmpty && beratFormatted.isNotEmpty) {
              subText = 'Bahan: $bahanBaku ($beratFormatted kg)';
            } else if (bahanBaku.isNotEmpty) {
              subText = 'Bahan: $bahanBaku';
            } else if (beratFormatted.isNotEmpty) {
              subText = 'Bahan baku: $beratFormatted kg';
            } else {
              subText = 'Pencatatan inovasi olahan sampah';
            }
            parsedLogs.add(
              KknHistoryLog(
                title: 'Laporan Pemanfaatan: $teknologi',
                subtitle: subText,
                timestamp: timestamp,
                type: KknHistoryType.laporan,
                points: null, // Murni Non-Poin
                isGpsActive: true,
                scheduleId: 'pemanfaatan_$id',
                rawData: item,
              ),
            );
          }
        }
      } catch (_) {}

      // 7. Ambil Data Presensi dari PointHistory
      // Karena backend sudah menghapus data presensi dari /activity-log, kita ambil manual dari endpoint poin
      try {
        final pointRepo = ref.read(wasteLogRepositoryProvider);
        final pointHistory = await pointRepo.getPointHistoryByUser('me');
        for (final log in pointHistory) {
          final kat = (log.kategori ?? '').toUpperCase();
          if (kat == 'KKN_PRESENSI_HADIR' || kat == 'KKN_DURASI_MEMENUHI') {
            final isCheckIn = kat == 'KKN_PRESENSI_HADIR';
            // Hindari duplikasi teks "Poin" di tab non-poin
            final title = log.description.replaceAll(RegExp(r'Poin ', caseSensitive: false), ''); 
            parsedLogs.add(
              KknHistoryLog(
                title: title,
                subtitle: isCheckIn ? 'Telah melakukan check-in presensi lokasi' : 'Telah menyelesaikan durasi target harian',
                timestamp: log.createdAt.toLocal(),
                type: KknHistoryType.gps, // Agar icon lokasi/presensi sinkron
                points: null, // Tab non-poin tidak perlu nampilin poinnya
                isGpsActive: true,
              ),
            );
          }
        }
      } catch (e) {
        debugPrint('[RiwayatKknNotifier] getPointHistory error: $e');
      }

      // Sort by descending timestamp
      parsedLogs.sort((a, b) => b.timestamp.compareTo(a.timestamp));

      // Remove duplicates (same type and scheduleId/timestamp)
      final List<KknHistoryLog> uniqueLogs = [];
      final Set<String> seen = {};
      for (final log in parsedLogs) {
        final key =
            '${log.type}_${log.scheduleId}_${log.title}_${log.timestamp.toIso8601String()}';
        if (!seen.contains(key)) {
          seen.add(key);
          uniqueLogs.add(log);
        }
      }
      // 6. Ambil data Timesheet Summary
      Map<String, dynamic>? summaryData;
      try {
        summaryData = await kknRepo.getTimesheetSummary();
      } catch (_) {}

      state = state.copyWith(
        isLoading: false,
        logs: uniqueLogs,
        timesheetSummary: summaryData,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Gagal memuat riwayat: $e',
      );
    }
  }

  Future<void> refresh() => fetchHistory();
}

final riwayatKknControllerProvider =
    StateNotifierProvider<RiwayatKknNotifier, RiwayatKknState>((ref) {
      return RiwayatKknNotifier(ref);
    });
