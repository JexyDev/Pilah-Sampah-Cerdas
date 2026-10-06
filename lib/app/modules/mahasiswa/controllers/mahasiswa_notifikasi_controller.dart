import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/firebase_notification_service.dart';
import '../../../data/services/local_notification_cache_service.dart';

import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/utils/input_sanitizer.dart';

final Set<String> _mhsShownNotifIds = {};

bool _isMahasiswaNotification(NotificationEntity notif) {
  final type = notif.type.toUpperCase();
  final title = notif.title.toUpperCase();
  final desc = notif.desc.toUpperCase();

  // Keyword & Tipe yang DILARANG untuk Mahasiswa KKN (Milik Warga / Petugas)
  final isForbidden =
      type.contains('TIMBANGAN_PEMILAHAN') ||
      type.contains('JADWAL') ||
      type.contains('JEMPUT') ||
      type.contains('PENGANGKUTAN') ||
      type.contains('SETORAN') ||
      title.contains('JADWAL') ||
      title.contains('JEMPUT') ||
      title.contains('SETORAN') ||
      desc.contains('JEMPUT');

  if (isForbidden) return false;

  // Wajib cocok dengan salah satu kategori Mahasiswa KKN
  // ponytail: substring match covers backend enum types; upgrade to explicit enum mapping if payload schema diverges.
  final isMahasiswaTopic =
      type.contains('KEGIATAN') ||
      type.contains('LOGBOOK') ||
      type.contains('REVISI') ||
      type.contains('SETUJU') ||
      type.contains('PEMANFAATAN') ||
      type.contains('AI') ||
      type.contains('LAPORAN') ||
      type.contains('AKTIVASI') ||
      type.contains('PRESENSI') ||
      type.contains('GPS') ||
      type.contains('IZIN') ||
      type.contains('SAKIT') ||
      type.contains('DPL') ||
      type.contains('POIN') ||
      type.contains('KKN') ||
      type.contains('KELOMPOK') ||
      type.contains('PROGRAM') ||
      type.contains('PROKER') ||
      type.contains('FASILITAS') ||
      type.contains('INOVASI') ||
      type.contains('PERSETUJUAN') ||
      type.contains('APPROVE') ||
      type.contains('TOLAK') ||
      type.contains('REJECT') ||
      type.contains('TEMPAT_SAMPAH_PENUH') ||
      type.contains('PENGAJUAN_RESET_BIN') ||
      type.contains('KRITIS') ||
      type.contains('KAPASITAS') ||
      type.contains('RESET_BIN') ||
      title.contains('KEGIATAN') ||
      title.contains('LOGBOOK') ||
      title.contains('REVISI') ||
      title.contains('PEMANFAATAN') ||
      title.contains('AI') ||
      title.contains('AKTIVASI') ||
      title.contains('PRESENSI') ||
      title.contains('IZIN') ||
      title.contains('SAKIT') ||
      title.contains('KRITIS') ||
      title.contains('KAPASITAS') ||
      title.contains('PENGOSONGAN') ||
      title.contains('DPL') ||
      title.contains('POIN') ||
      title.contains('KKN') ||
      title.contains('PELANGGARAN') ||
      title.contains('GEOFENCE') ||
      title.contains('PENALTI') ||
      desc.contains('KKN') ||
      desc.contains('PEMANFAATAN') ||
      desc.contains('DPL') ||
      desc.contains('POIN') ||
      desc.contains('PENGOSONGAN') ||
      desc.contains('KAPASITAS') ||
      desc.contains('PELANGGARAN') ||
      desc.contains('GEOFENCE');

  if (!isMahasiswaTopic) return false;

  // Hapus seed notifikasi palsu / dummy lama
  if (notif.id == 'seed-notif-1' || desc.contains('ORG004520')) {
    return false;
  }
  return true;
}

/// Provider khusus daftar notifikasi Mahasiswa KKN
final mahasiswaNotificationsProvider = FutureProvider<List<NotificationEntity>>((
  ref,
) async {
  final repo = ref.watch(notificationRepositoryProvider);
  final user = ref.watch(authProvider).user;
  if (user == null) return [];

  final userId = user.id;
  final role = user.role.name;
  List<NotificationEntity> list = [];
  try {
    final raw = await repo.getNotifications();
    // ponytail: backend treats MAHASISWA_KKN as admin/petugas and returns
    // area-scoped BinResetRequests (req-*) and critical bins (crit-bin-*)
    // shared across all users in the same RW. Filter them out to prevent
    // cross-account notification leak. Upgrade: fix backend to scope per-user.
    list = raw.where((n) =>
        !n.id.startsWith('req-') && !n.id.startsWith('crit-bin-')).toList();
  } catch (_) {
    list = [];
  }

  final prefs = await SharedPreferences.getInstance();
  final readList = prefs.getStringList('read_notifs_${userId}_$role') ?? [];
  final readSet = readList.toSet();
  final markAllTimestamp = prefs.getInt('mark_all_notifs_${userId}_$role') ?? 0;

  // ponytail: Notifikasi murni dari backend API & FCM & LocalNotificationCacheService.
  // Tidak lagi mem-polling 4 endpoint domain (pemanfaatan, izin, proker, laporan akhir)
  // yang menyebabkan lag dan freeze parah akibat 5 HTTP calls beruntun.
  final List<NotificationEntity> result = [];

  for (final notif in list) {
    if (!_isMahasiswaNotification(notif)) continue;

    // Filter notifikasi dinamis "palsu" dari backend lama agar tidak redundan 
    // karena notifikasi yang asli (Push Notification) sudah tersimpan di database
    if (notif.id.startsWith('leave-mhs-') || notif.id.startsWith('proker-')) {
      continue;
    }

    // Bersihkan metadata sistem seperti [ReportID:xxxx] dari judul dan deskripsi
    final sanitizedTitle = InputSanitizer.cleanSystemMessage(notif.title);
    final sanitizedDesc = InputSanitizer.cleanSystemMessage(notif.desc);

    String formattedTitle = sanitizedTitle;
    String formattedDesc = sanitizedDesc;
    if (formattedTitle.contains('Program Kerja') &&
        (formattedDesc.contains('Program [') || formattedDesc.toUpperCase().contains('LAPORAN_AKHIR'))) {
      formattedTitle = formattedTitle.replaceAll('Program Kerja', 'Laporan Akhir');
      formattedDesc = formattedDesc.replaceFirst('Program [', 'Laporan Akhir [');
    }

    // Deduplikasi berdasar ID atau kesamaan persis (Title + Desc)
    if (result.any(
      (n) =>
          n.id == notif.id ||
          (n.title == formattedTitle && n.desc == formattedDesc),
    )) {
      continue;
    }

    // Pastikan konversi waktu ke lokal jika formatnya UTC (ada 'Z')
    NotificationEntity finalNotif = notif.copyWith(
      title: formattedTitle,
      desc: formattedDesc,
    );
    if (notif.time.endsWith('Z')) {
      final dt = DateTime.tryParse(notif.time);
      if (dt != null) {
        finalNotif = finalNotif.copyWith(
          time: dt
              .toLocal()
              .toIso8601String()
              .substring(0, 16)
              .replaceAll('T', ' '),
        );
      }
    }

    result.add(finalNotif);

    final notifKey = 'mhs_${userId}_${finalNotif.id}';
    if (!notif.isRead && !_mhsShownNotifIds.contains(notifKey)) {
      _mhsShownNotifIds.add(notifKey);
    }
  }

  // Ambil notifikasi dari Firebase local storage
  try {
    final firebaseNotifs = await FirebaseNotificationService().getNotifications(
      userId,
      role,
    );
    for (final fn in firebaseNotifs) {
      String fnTitle = InputSanitizer.cleanSystemMessage(fn.title);
      String fnDesc = InputSanitizer.cleanSystemMessage(fn.desc);
      if (fnTitle.contains('Program Kerja') &&
          (fnDesc.contains('Program [') || fnDesc.toUpperCase().contains('LAPORAN_AKHIR'))) {
        fnTitle = fnTitle.replaceAll('Program Kerja', 'Laporan Akhir');
        fnDesc = fnDesc.replaceFirst('Program [', 'Laporan Akhir [');
      }

      if (result.any(
        (n) =>
            n.id == fn.id ||
            (n.title == fnTitle && n.desc == fnDesc),
      )) {
        continue;
      }
      if (!_isMahasiswaNotification(fn)) continue;

      result.add(fn.copyWith(title: fnTitle, desc: fnDesc));
    }
  } catch (_) {}

  // Gabungkan notifikasi dari LocalNotificationCacheService (submit form feedback)
  final localNotifs = LocalNotificationCacheService().getNotifications(
    userId,
    role,
  );
  for (final ln in localNotifs) {
    // Abaikan duplikasi jika notifikasi izin lokal sudah ada di server
    if ((ln.type == 'IZIN_DIAJUKAN' || ln.type == 'IZIN') &&
        result.any((n) => n.type == 'IZIN')) {
      continue;
    }
    String lnTitle = InputSanitizer.cleanSystemMessage(ln.title);
    String lnDesc = InputSanitizer.cleanSystemMessage(ln.desc);
    if (lnTitle.contains('Program Kerja') &&
        (lnDesc.contains('Program [') || lnDesc.toUpperCase().contains('LAPORAN_AKHIR'))) {
      lnTitle = lnTitle.replaceAll('Program Kerja', 'Laporan Akhir');
      lnDesc = lnDesc.replaceFirst('Program [', 'Laporan Akhir [');
    }

    if (result.any(
      (n) =>
          n.id == ln.id ||
          (n.title == lnTitle && n.desc == lnDesc),
    )) {
      continue;
    }
    if (!_isMahasiswaNotification(ln)) continue;
    result.add(ln.copyWith(title: lnTitle, desc: lnDesc));
  }

  final deleteAllTimestamp =
      prefs.getInt('delete_all_notifs_${userId}_$role') ?? 0;

  final List<NotificationEntity> finalResult = [];
  for (int i = 0; i < result.length; i++) {
    final dt = result[i].createdAt.toLocal();

    // Skip if deleted
    if (dt.millisecondsSinceEpoch <= deleteAllTimestamp) {
      continue;
    }

    var item = result[i];
    final isReadLocally =
        readSet.contains(item.id) ||
        dt.millisecondsSinceEpoch <= markAllTimestamp ||
        LocalNotificationCacheService().isRead(userId, role, item.id, dt);

    if (isReadLocally && !item.isRead) {
      item = item.copyWith(isRead: true);
    }
    finalResult.add(item);
  }

  // Urutkan: terbaru di atas
  finalResult.sort((a, b) => b.createdAt.compareTo(a.createdAt));

  return finalResult;
});

/// Provider jumlah notifikasi belum dibaca untuk Mahasiswa KKN
final mahasiswaUnreadNotificationCountProvider = Provider<int>((ref) {
  final notifAsync = ref.watch(mahasiswaNotificationsProvider);
  return notifAsync.when(
    skipLoadingOnReload: true,
    data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});
