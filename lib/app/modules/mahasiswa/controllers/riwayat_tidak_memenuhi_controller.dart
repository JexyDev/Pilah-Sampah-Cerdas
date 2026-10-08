import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/utils/input_sanitizer.dart';
import '../../../data/models/user_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';

class SesiTidakMemenuhi {
  final String id;
  final String scheduleId;
  final String scheduleTitle;
  final DateTime? attendedAt;
  final DateTime? checkOutAt;
  final int durationMinutes; // Durasi Efektif di Posko
  final int targetMinutes;   // Target Minimal Harian
  final int shortageMinutes; // Kekurangan dari Target
  final int durasiJedaMenit; // Waktu di Luar Posko / Jeda Akumulasi
  final String? durasiJedaFormatted;
  final double? rasioKehadiran;
  final String status;
  final String statusDisplay;
  final String keterangan;
  final Map<String, dynamic>? rawData;

  const SesiTidakMemenuhi({
    required this.id,
    required this.scheduleId,
    required this.scheduleTitle,
    this.attendedAt,
    this.checkOutAt,
    required this.durationMinutes,
    required this.targetMinutes,
    required this.shortageMinutes,
    this.durasiJedaMenit = 0,
    this.durasiJedaFormatted,
    this.rasioKehadiran,
    required this.status,
    required this.statusDisplay,
    required this.keterangan,
    this.rawData,
  });

  /// Durasi efektif di posko (contoh: "3 Jam 57 Menit")
  String get durationFormatted {
    final hours = durationMinutes ~/ 60;
    final mins = durationMinutes % 60;
    if (hours > 0) {
      return mins > 0 ? '$hours Jam $mins Menit' : '$hours Jam';
    }
    return '$mins Menit';
  }

  /// Target durasi (contoh: "4 Jam" atau "4 Jam 0 Menit")
  String get targetFormatted {
    final hours = targetMinutes ~/ 60;
    final mins = targetMinutes % 60;
    if (hours > 0) {
      return mins > 0 ? '$hours Jam $mins Menit' : '$hours Jam';
    }
    return '$mins Menit';
  }

  /// Kekurangan dari target (contoh: "3 Menit" atau "1 Jam 45 Menit")
  String get shortageFormatted {
    final hours = shortageMinutes ~/ 60;
    final mins = shortageMinutes % 60;
    if (hours > 0) {
      return mins > 0 ? '$hours Jam $mins Menit' : '$hours Jam';
    }
    return '$mins Menit';
  }

  /// Total rentang jam dinding (selisih check-in dan check-out)
  int get rentangTotalMenit {
    if (attendedAt != null && checkOutAt != null) {
      final diff = checkOutAt!.difference(attendedAt!).inMinutes;
      if (diff > 0) return diff;
    }
    return durationMinutes + durasiJedaMenit;
  }

  String get rentangTotalFormatted {
    final total = rentangTotalMenit;
    final hours = total ~/ 60;
    final mins = total % 60;
    if (hours > 0) {
      return mins > 0 ? '$hours Jam $mins Menit' : '$hours Jam';
    }
    return '$mins Menit';
  }

  /// Durasi jeda / berada di luar posko (contoh: "2 Jam 35 Menit")
  String get jedaFormatted {
    if (durasiJedaFormatted != null && durasiJedaFormatted!.isNotEmpty) {
      return durasiJedaFormatted!;
    }
    int jeda = durasiJedaMenit;
    if (jeda <= 0 && attendedAt != null && checkOutAt != null) {
      jeda = (rentangTotalMenit - durationMinutes).clamp(0, 1440);
    }
    if (jeda <= 0) return '0 Menit';
    final hours = jeda ~/ 60;
    final mins = jeda % 60;
    if (hours > 0) {
      return mins > 0 ? '$hours Jam $mins Menit' : '$hours Jam';
    }
    return '$mins Menit';
  }
}

class RiwayatTidakMemenuhiState {
  final bool isLoading;
  final String? errorMessage;
  final DateTime? startDate;
  final DateTime? endDate;
  final List<SesiTidakMemenuhi> items;
  final int totalTidakMemenuhi;
  final int targetHarianMenit;

  const RiwayatTidakMemenuhiState({
    this.isLoading = false,
    this.errorMessage,
    this.startDate,
    this.endDate,
    this.items = const [],
    this.totalTidakMemenuhi = 0,
    this.targetHarianMenit = 240,
  });

  RiwayatTidakMemenuhiState copyWith({
    bool? isLoading,
    String? errorMessage,
    DateTime? startDate,
    DateTime? endDate,
    bool clearDates = false,
    List<SesiTidakMemenuhi>? items,
    int? totalTidakMemenuhi,
    int? targetHarianMenit,
  }) {
    return RiwayatTidakMemenuhiState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      startDate: clearDates ? null : (startDate ?? this.startDate),
      endDate: clearDates ? null : (endDate ?? this.endDate),
      items: items ?? this.items,
      totalTidakMemenuhi: totalTidakMemenuhi ?? this.totalTidakMemenuhi,
      targetHarianMenit: targetHarianMenit ?? this.targetHarianMenit,
    );
  }
}

class RiwayatTidakMemenuhiNotifier
    extends StateNotifier<RiwayatTidakMemenuhiState> {
  RiwayatTidakMemenuhiNotifier(this.ref)
      : super(const RiwayatTidakMemenuhiState()) {
    fetchData();
  }

  final Ref ref;

  Future<void> fetchData({DateTime? start, DateTime? end}) async {
    final user = ref.read(authProvider).user;
    if (user != null && user.role != UserRole.mahasiswaKkn) {
      if (mounted) {
        state = state.copyWith(isLoading: false, items: const []);
      }
      return;
    }

    final queryStart = start ?? state.startDate;
    final queryEnd = end ?? state.endDate;

    final startStr = queryStart != null
        ? DateFormat('yyyy-MM-dd').format(queryStart)
        : null;
    final endStr =
        queryEnd != null ? DateFormat('yyyy-MM-dd').format(queryEnd) : null;

    state = state.copyWith(
      isLoading: true,
      errorMessage: null,
      startDate: queryStart,
      endDate: queryEnd,
    );

    try {
      final kknRepo = ref.read(kknRepositoryProvider);
      final currentUserId = user?.id;
      final currentUserNim = user?.nim;

      int targetMenit = 240;
      final List<SesiTidakMemenuhi> parsedList = [];
      final Set<String> countedScheduleIds = {};

      // 1. Coba ambil dari endpoint Laporan Presensi resmi backend (Opsi B: server-side filter & scoping)
      try {
        final laporan = await kknRepo.getLaporanPresensi(
          status: 'HADIR_TIDAK_MEMENUHI',
          startDate: startStr,
          endDate: endStr,
        );

        if (laporan['items'] is List && (laporan['items'] as List).isNotEmpty) {
          final items = laporan['items'] as List;
          for (final item in items) {
            if (item is! Map) continue;
            final schId = item['scheduleId']?.toString() ?? '';
            final id = item['id']?.toString() ?? schId;
            if (schId.isNotEmpty) {
              countedScheduleIds.add(schId);
            }
            if (id.isNotEmpty) {
              countedScheduleIds.add(id);
            }

            final durationMins = int.tryParse(
                  item['durasiMenit']?.toString() ??
                      item['durasiAktualMenit']?.toString() ??
                      item['actualInZoneMinutes']?.toString() ??
                      '',
                ) ??
                0;
            final itemTarget = int.tryParse(
                  item['targetMinMenit']?.toString() ??
                      item['targetDurationMinutes']?.toString() ??
                      '',
                ) ??
                targetMenit;
            targetMenit = itemTarget;
            final shortage = (itemTarget - durationMins).clamp(0, itemTarget);

            final jedaMins = int.tryParse(
                  item['durasiJedaMenit']?.toString() ??
                      item['jedaMenit']?.toString() ??
                      '',
                ) ??
                0;
            final jedaFormattedStr = item['durasiJedaFormatted']?.toString() ??
                item['jedaFormatted']?.toString();
            final rasio = double.tryParse(
              item['rasioKehadiran']?.toString() ??
                  item['rasio']?.toString() ??
                  '',
            );

            final rawTitle = item['namaKegiatan'] ??
                item['poskoName'] ??
                'Kegiatan KKN';
            final title =
                InputSanitizer.cleanSystemMessage(rawTitle.toString());

            final tanggalStr = item['tanggal']?.toString() ?? '';
            final jamMasukStr = item['jamMasuk']?.toString() ?? '';
            final jamPulangStr = item['jamPulang']?.toString() ?? '';
            DateTime? attendedAt;
            if (item['attendedAt'] != null) {
              attendedAt =
                  DateTime.tryParse(item['attendedAt'].toString())?.toLocal();
            } else if (tanggalStr.isNotEmpty &&
                tanggalStr != '-' &&
                jamMasukStr.isNotEmpty &&
                jamMasukStr != '-') {
              attendedAt =
                  DateTime.tryParse('${tanggalStr}T$jamMasukStr:00')?.toLocal();
            }

            DateTime? checkOutAt;
            if (item['checkOutAt'] != null) {
              checkOutAt =
                  DateTime.tryParse(item['checkOutAt'].toString())?.toLocal();
            } else if (tanggalStr.isNotEmpty &&
                tanggalStr != '-' &&
                jamPulangStr.isNotEmpty &&
                jamPulangStr != '-') {
              checkOutAt =
                  DateTime.tryParse('${tanggalStr}T$jamPulangStr:00')?.toLocal();
            }

            if (attendedAt != null) {
              final dKey =
                  '${attendedAt.year}-${attendedAt.month.toString().padLeft(2, '0')}-${attendedAt.day.toString().padLeft(2, '0')}';
              countedScheduleIds.add(dKey);
            }

            final status = (item['status'] ?? 'HADIR_TIDAK_MEMENUHI')
                .toString()
                .toUpperCase();
            final statusDisplay = item['statusDisplay']?.toString() ??
                (status == 'SELESAI_TELAT'
                    ? 'Selesai Lebih Cepat'
                    : 'Hadir & Tidak Memenuhi');

            String keterangan;
            if (shortage > 0) {
              if (jedaMins > 0 || jedaFormattedStr != null) {
                keterangan =
                    'Durasi efektif di posko ($durationMins menit) kurang $shortage menit dari target $itemTarget menit. Terdeteksi ${jedaFormattedStr ?? "$jedaMins menit"} di luar zona posko/jeda. Status kehadiran tercatat Tidak Memenuhi & bonus +3 Poin Durasi tidak diberikan.';
              } else {
                keterangan =
                    'Durasi efektif di posko ($durationMins menit) kurang $shortage menit dari target $itemTarget menit. Status kehadiran tercatat Tidak Memenuhi & bonus +3 Poin Durasi tidak diberikan.';
              }
            } else {
              keterangan =
                  'Durasi kehadiran tercatat belum memenuhi syarat target presensi harian.';
            }

            parsedList.add(
              SesiTidakMemenuhi(
                id: id,
                scheduleId: schId,
                scheduleTitle: title,
                attendedAt: attendedAt,
                checkOutAt: checkOutAt,
                durationMinutes: durationMins,
                targetMinutes: itemTarget,
                shortageMinutes: shortage,
                durasiJedaMenit: jedaMins,
                durasiJedaFormatted: jedaFormattedStr,
                rasioKehadiran: rasio,
                status: status,
                statusDisplay: statusDisplay,
                keterangan: keterangan,
                rawData: Map<String, dynamic>.from(item),
              ),
            );
          }
        }
      } catch (e) {
        debugPrint(
            '[RiwayatTidakMemenuhi] getLaporanPresensi fallback ke timesheet: $e');
      }

      // 2. Selaraskan dengan Timesheet Summary (SSOT Backend)
      try {
        final summary = await kknRepo.getTimesheetSummary(
          studentId: currentUserId,
          startDate: startStr,
          endDate: endStr,
        );

        if (summary['targetRules'] is Map) {
          final targetRules = summary['targetRules'] as Map;
          final targetHours = num.tryParse(
            targetRules['targetHarianMinJam']?.toString() ?? '',
          );
          if (targetHours != null && targetHours > 0) {
            targetMenit = (targetHours * 60).round();
          }
        }

        if (summary['students'] is List) {
          final students = summary['students'] as List;
          final dynamic matchedStudent = students.firstWhere(
            (s) =>
                s is Map &&
                ((currentUserId != null &&
                        currentUserId.isNotEmpty &&
                        (s['studentId']?.toString() == currentUserId ||
                            s['userId']?.toString() == currentUserId)) ||
                    (currentUserNim != null &&
                        currentUserNim.isNotEmpty &&
                        s['nim']?.toString() == currentUserNim)),
            orElse: () => const <String, dynamic>{},
          );

          if (matchedStudent is Map) {
            final student = matchedStudent;
            final sessions =
                student['sessions'] is List ? (student['sessions'] as List) : [];

            for (final sess in sessions) {
              if (sess is! Map) continue;
              final status = (sess['status'] ?? '').toString().toUpperCase();
              final isTargetMet = sess['isTargetMet'] == true ||
                  sess['isMinTargetMet'] == true;
              final isAlpa = status == 'ALPA' ||
                  status == 'TANPA_KETERANGAN' ||
                  sess['isAlpa'] == true;
              final isApprovedLeave = sess['isApprovedLeave'] == true ||
                  status == 'IZIN' ||
                  status == 'SAKIT';

              // Kategori "Hadir Tidak Memenuhi" per Task MBL-QC-01:
              // isTargetMet == false && !isAlpa && !isApprovedLeave
              // atau status eksplisit HADIR_TIDAK_MEMENUHI / SELESAI_TELAT
              final isTidakMemenuhi = (!isTargetMet && !isAlpa && !isApprovedLeave) ||
                  status == 'HADIR_TIDAK_MEMENUHI' ||
                  status == 'SELESAI_TELAT' ||
                  (status.contains('HADIR') && !isTargetMet && sess['checkOutAt'] != null);

              if (!isTidakMemenuhi) continue;

              final schId = sess['scheduleId']?.toString() ?? '';
              final sessId = sess['id']?.toString() ?? '';
              final attendedAtStr = sess['attendedAt']?.toString();
              final checkOutAtStr = sess['checkOutAt']?.toString();
              final attendedAt = attendedAtStr != null
                  ? DateTime.tryParse(attendedAtStr)?.toLocal()
                  : null;
              final checkOutAt = checkOutAtStr != null
                  ? DateTime.tryParse(checkOutAtStr)?.toLocal()
                  : null;

              final dateKey = attendedAt != null
                  ? '${attendedAt.year}-${attendedAt.month.toString().padLeft(2, '0')}-${attendedAt.day.toString().padLeft(2, '0')}'
                  : '';

              final isAlreadyCounted = (schId.isNotEmpty && countedScheduleIds.contains(schId)) ||
                  (sessId.isNotEmpty && countedScheduleIds.contains(sessId)) ||
                  (dateKey.isNotEmpty && countedScheduleIds.contains(dateKey));

              if (isAlreadyCounted) {
                // Enrich existing item if missing jeda info
                final existingIdx = parsedList.indexWhere((p) =>
                    (schId.isNotEmpty && p.scheduleId == schId) ||
                    (sessId.isNotEmpty && p.id == sessId) ||
                    (attendedAt != null &&
                        p.attendedAt != null &&
                        p.attendedAt!.year == attendedAt.year &&
                        p.attendedAt!.month == attendedAt.month &&
                        p.attendedAt!.day == attendedAt.day));
                if (existingIdx != -1) {
                  final existing = parsedList[existingIdx];
                  final jedaMins = int.tryParse(sess['durasiJedaMenit']?.toString() ??
                          sess['jedaMenit']?.toString() ?? '') ?? 0;
                  final jedaFormattedStr = sess['durasiJedaFormatted']?.toString() ??
                      sess['jedaFormatted']?.toString();
                  if (existing.durasiJedaMenit <= 0 && jedaMins > 0) {
                    parsedList[existingIdx] = SesiTidakMemenuhi(
                      id: existing.id,
                      scheduleId: existing.scheduleId,
                      scheduleTitle: existing.scheduleTitle,
                      attendedAt: existing.attendedAt,
                      checkOutAt: existing.checkOutAt,
                      durationMinutes: existing.durationMinutes,
                      targetMinutes: existing.targetMinutes,
                      shortageMinutes: existing.shortageMinutes,
                      durasiJedaMenit: jedaMins,
                      durasiJedaFormatted: jedaFormattedStr ?? existing.durasiJedaFormatted,
                      rasioKehadiran: existing.rasioKehadiran,
                      status: existing.status,
                      statusDisplay: existing.statusDisplay,
                      keterangan: existing.keterangan,
                      rawData: existing.rawData,
                    );
                  }
                }
                continue;
              }

              if (schId.isNotEmpty) countedScheduleIds.add(schId);
              if (sessId.isNotEmpty) countedScheduleIds.add(sessId);
              if (dateKey.isNotEmpty) countedScheduleIds.add(dateKey);

              final durationMins =
                  int.tryParse(sess['durationMinutes']?.toString() ??
                      sess['durasiMenit']?.toString() ?? '') ?? 0;
              final sessTarget = int.tryParse(sess['targetMinutes']?.toString() ??
                      sess['targetMinMenit']?.toString() ?? '') ?? targetMenit;
              final shortage = (sessTarget - durationMins).clamp(0, sessTarget);

              final jedaMins = int.tryParse(sess['durasiJedaMenit']?.toString() ??
                      sess['jedaMenit']?.toString() ?? '') ?? 0;
              final jedaFormattedStr = sess['durasiJedaFormatted']?.toString() ??
                  sess['jedaFormatted']?.toString();
              final rasio = double.tryParse(sess['rasioKehadiran']?.toString() ??
                  sess['rasio']?.toString() ?? '');

              final rawTitle = sess['scheduleTitle']?.toString() ??
                  sess['namaKegiatan']?.toString() ??
                  'Kegiatan KKN';
              final title = InputSanitizer.cleanSystemMessage(rawTitle);

              String keterangan;
              if (shortage > 0) {
                if (jedaMins > 0 || jedaFormattedStr != null) {
                  keterangan =
                      'Durasi efektif di posko ($durationMins menit) kurang $shortage menit dari target $sessTarget menit. Terdeteksi ${jedaFormattedStr ?? "$jedaMins menit"} di luar zona posko/jeda. Status kehadiran tercatat Tidak Memenuhi & tidak memperoleh +3 Poin Durasi.';
                } else {
                  keterangan =
                      'Durasi efektif di posko ($durationMins menit) kurang $shortage menit dari target $sessTarget menit. Status kehadiran tercatat Tidak Memenuhi & tidak memperoleh +3 Poin Durasi.';
                }
              } else {
                keterangan =
                    'Durasi kehadiran tercatat belum memenuhi syarat target presensi harian.';
              }

              parsedList.add(
                SesiTidakMemenuhi(
                  id: sessId.isNotEmpty ? sessId : '${schId}_${attendedAt?.millisecondsSinceEpoch}',
                  scheduleId: schId,
                  scheduleTitle: title,
                  attendedAt: attendedAt,
                  checkOutAt: checkOutAt,
                  durationMinutes: durationMins,
                  targetMinutes: sessTarget,
                  shortageMinutes: shortage,
                  durasiJedaMenit: jedaMins,
                  durasiJedaFormatted: jedaFormattedStr,
                  rasioKehadiran: rasio,
                  status: status.isNotEmpty ? status : 'HADIR_TIDAK_MEMENUHI',
                  statusDisplay: status == 'SELESAI_TELAT'
                      ? 'Selesai Lebih Cepat'
                      : 'Hadir & Tidak Memenuhi',
                  keterangan: keterangan,
                  rawData: Map<String, dynamic>.from(sess),
                ),
              );
            }
          }
        }
      } catch (e) {
        debugPrint('[RiwayatTidakMemenuhi] getTimesheetSummary sync error: $e');
      }

      // 3. Ambil juga kegiatan aktif selesai hari ini yang mungkin belum teragregasi di timesheet
      try {
        final kegiatanAktif = await kknRepo.getKegiatanAktif();
        final now = DateTime.now();
        final todayStr = DateFormat('yyyy-MM-dd').format(now);

        for (final item in kegiatanAktif) {
          final schId =
              item['id']?.toString() ?? item['scheduleId']?.toString() ?? '';
          final itemDate = (item['tanggal'] ?? item['date'] ?? '').toString();

          if (schId.isNotEmpty && countedScheduleIds.contains(schId)) {
            continue;
          }
          if (itemDate.isNotEmpty && !itemDate.startsWith(todayStr)) {
            continue;
          }

          final status = (item['attendanceStatus'] ??
                  item['statusKehadiran'] ??
                  item['status'] ??
                  '')
              .toString()
              .toUpperCase();
          final isMemenuhi = item['isMemenuhiDurasi'] == true;
          final checkOutAtStr = item['checkOutAt']?.toString();

          final isTidakMemenuhi = status == 'HADIR_TIDAK_MEMENUHI' ||
              status == 'SELESAI_TELAT' ||
              (status.contains('HADIR') &&
                  !isMemenuhi &&
                  checkOutAtStr != null);

          if (!isTidakMemenuhi) continue;

          final durationMins = int.tryParse(
                item['actualInZoneMinutes']?.toString() ??
                    item['durasiAktualMenit']?.toString() ??
                    '',
              ) ??
              0;
          final attendedAtStr = item['attendedAt']?.toString() ??
              item['checkInTime']?.toString();
          final attendedAt = attendedAtStr != null
              ? DateTime.tryParse(attendedAtStr)?.toLocal()
              : null;
          final checkOutAt = checkOutAtStr != null
              ? DateTime.tryParse(checkOutAtStr)?.toLocal()
              : null;

          final rawTitle = item['nama'] ??
              item['namaKegiatan'] ??
              item['title'] ??
              'Kegiatan KKN';
          final title = InputSanitizer.cleanSystemMessage(rawTitle.toString());
          final shortage = (targetMenit - durationMins).clamp(0, targetMenit);

          final jedaMins = int.tryParse(item['durasiJedaMenit']?.toString() ??
                  item['jedaMenit']?.toString() ?? '') ?? 0;
          final jedaFormattedStr = item['durasiJedaFormatted']?.toString() ??
              item['jedaFormatted']?.toString();

          parsedList.add(
            SesiTidakMemenuhi(
              id: '${schId}_today',
              scheduleId: schId,
              scheduleTitle: title,
              attendedAt: attendedAt,
              checkOutAt: checkOutAt,
              durationMinutes: durationMins,
              targetMinutes: targetMenit,
              shortageMinutes: shortage,
              durasiJedaMenit: jedaMins,
              durasiJedaFormatted: jedaFormattedStr,
              status: status,
              statusDisplay: 'Hadir & Tidak Memenuhi',
              keterangan: shortage > 0
                  ? 'Durasi efektif di posko ($durationMins menit) kurang $shortage menit dari target $targetMenit menit. Status kehadiran tercatat Tidak Memenuhi & tidak memperoleh +3 Poin Durasi.'
                  : 'Durasi kehadiran belum memenuhi target harian minimum.',
              rawData: Map<String, dynamic>.from(item),
            ),
          );
        }
      } catch (e) {
        debugPrint('[RiwayatTidakMemenuhi] getKegiatanAktif error: $e');
      }


      // Sort by newest attendedAt descending
      parsedList.sort((a, b) {
        final aTime = a.attendedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        final bTime = b.attendedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        return bTime.compareTo(aTime);
      });

      // Filter lokal berdasarkan rentang tanggal jika ada
      final filteredList = parsedList.where((item) {
        if (queryStart != null && item.attendedAt != null) {
          final startDay =
              DateTime(queryStart.year, queryStart.month, queryStart.day);
          if (item.attendedAt!.isBefore(startDay)) return false;
        }
        if (queryEnd != null && item.attendedAt != null) {
          final endDay =
              DateTime(queryEnd.year, queryEnd.month, queryEnd.day, 23, 59, 59);
          if (item.attendedAt!.isAfter(endDay)) return false;
        }
        return true;
      }).toList();

      if (!mounted) return;

      state = state.copyWith(
        isLoading: false,
        items: filteredList,
        totalTidakMemenuhi: filteredList.length,
        targetHarianMenit: targetMenit,
      );
    } catch (e) {
      if (!mounted) return;
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Gagal memuat riwayat tidak memenuhi: $e',
      );
    }
  }

  void setFilterRange(DateTime? start, DateTime? end) {
    fetchData(start: start, end: end);
  }

  void clearFilter() {
    state = state.copyWith(clearDates: true);
    fetchData(start: null, end: null);
  }

  Future<void> refresh() => fetchData();
}

final riwayatTidakMemenuhiProvider = StateNotifierProvider<
    RiwayatTidakMemenuhiNotifier, RiwayatTidakMemenuhiState>((ref) {
  return RiwayatTidakMemenuhiNotifier(ref);
});
