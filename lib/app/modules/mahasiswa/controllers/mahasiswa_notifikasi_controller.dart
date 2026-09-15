import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/firebase_notification_service.dart';
import '../../../data/services/local_notification_cache_service.dart';
import '../../../data/services/notification_engine.dart';
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

  try {
    final pointRepo = ref.read(wasteLogRepositoryProvider);
    final pointHistory = await pointRepo.getPointHistoryByUser(userId);

    for (final ph in pointHistory) {
      if (ph.points > 0) {
        final descLower = ph.description.toLowerCase();
        final katLower = (ph.kategori ?? '').toLowerCase();
        // Skip aktivitas penalti/pelanggaran dan non-poin (pemanfaatan dan panen)
        if (katLower.contains('penalty') ||
            descLower.contains('penalti') ||
            descLower.contains('punishment') ||
            descLower.contains('pelanggaran')) {
          continue;
        }
        if (descLower.contains('pemanfaatan') ||
            katLower.contains('pemanfaatan') ||
            descLower.contains('panen') ||
            katLower.contains('panen')) {
          continue;
        }

        final notifId = 'point_${ph.id}';
        final isRead =
            readSet.contains(notifId) ||
            ph.createdAt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(
              userId,
              role,
              notifId,
              ph.createdAt,
            );

        final cleanDesc = InputSanitizer.cleanSystemMessage(ph.description);
        list.add(
          NotificationEntity(
            id: notifId,
            type: 'POIN_KKN',
            title: 'Poin KKN Bertambah!',
            desc: cleanDesc.isNotEmpty
                ? cleanDesc
                : 'Anda mendapatkan +${ph.points} poin.',
            isRead: isRead,
            time: ph.createdAt
                .toLocal()
                .toIso8601String()
                .substring(0, 16)
                .replaceAll('T', ' '),
            icon: 'star',
            createdAt: ph.createdAt,
          ),
        );
      }
    }
  } catch (_) {}

  // Tambahkan notifikasi laporan pemanfaatan & catat panen (Non-Poin)
  try {
    final kknRepo = ref.read(kknRepositoryProvider);
    final pemanfaatanList = await kknRepo.getPemanfaatanLogs();
    for (final item in pemanfaatanList) {
      final teknologi =
          item['teknologi']?.toString() ?? 'Pemanfaatan Sampah';
      final hasHarvest = (item['hasil'] is num && item['hasil'] > 0);
      final dateStr = item['createdAt']?.toString() ??
          item['tanggal']?.toString() ??
          DateTime.now().toIso8601String();
      final dt = DateTime.tryParse(dateStr) ?? DateTime.now();
      final id = item['id']?.toString() ?? '';

      if (hasHarvest) {
        final notifId = 'panen_$id';
        final isRead = readSet.contains(notifId) ||
            dt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(userId, role, notifId, dt);
        list.add(
          NotificationEntity(
            id: notifId,
            type: 'PANEN_HASIL',
            title: 'Catat Hasil Panen Terkirim 🌿',
            desc:
                'Aksi panen $teknologi (${item['hasil']} kg) tercatat di riwayat KKN.',
            isRead: isRead,
            time: dt
                .toLocal()
                .toIso8601String()
                .substring(0, 16)
                .replaceAll('T', ' '),
            icon: 'eco',
            createdAt: dt,
          ),
        );
      } else {
        final notifId = 'pemanfaatan_$id';
        final isRead = readSet.contains(notifId) ||
            dt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(userId, role, notifId, dt);
        list.add(
          NotificationEntity(
            id: notifId,
            type: 'PEMANFAATAN_SAMPAH',
            title: 'Laporan Pemanfaatan Terkirim ♻️',
            desc:
                'Laporan aksi pemanfaatan $teknologi berhasil tercatat di riwayat KKN.',
            isRead: isRead,
            time: dt
                .toLocal()
                .toIso8601String()
                .substring(0, 16)
                .replaceAll('T', ' '),
            icon: 'recycling',
            createdAt: dt,
          ),
        );
      }
    }
  } catch (_) {}

  // Tambahkan notifikasi persetujuan/penolakan Izin dari DPL
  try {
    final kknRepo = ref.read(kknRepositoryProvider);
    final izinList = await kknRepo.getPengajuanIzin();
    for (final izin in izinList) {
      final status = izin['status']?.toString().toUpperCase();
      if (status == 'APPROVED' || status == 'REJECTED' || status == 'PENDING') {
        final isApproved = status == 'APPROVED';
        final isPending = status == 'PENDING';
        final kategori = izin['kategori']?.toString() ?? 'Izin';
        final timestamp =
            izin['reviewedAt']?.toString() ??
            izin['createdAt']?.toString() ??
            DateTime.now().toIso8601String();
        final dt = DateTime.tryParse(timestamp) ?? DateTime.now();

        // Bedakan ID notif agar ketika status berubah jadi APPROVED/REJECTED, jadi notif baru
        final notifId = isPending
            ? 'izin_pending_${izin['id']}'
            : 'izin_${izin['id']}';
        final isRead =
            readSet.contains(notifId) ||
            dt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(userId, role, notifId, dt);

        list.add(
          NotificationEntity(
            id: notifId,
            type: 'IZIN',
            title: isPending
                ? 'Pengajuan Izin Dikirim'
                : (isApproved
                      ? 'Pengajuan Izin Disetujui'
                      : 'Pengajuan Izin Ditolak'),
            desc: isPending
                ? 'Pengajuan $kategori Anda telah terkirim dan menunggu verifikasi DPL.'
                : (isApproved
                      ? 'DPL telah menyetujui pengajuan $kategori Anda.'
                      : 'DPL menolak pengajuan $kategori Anda. ${izin['rejectionReason'] ?? ''}'),
            isRead: isRead,
            time: dt
                .toLocal()
                .toIso8601String()
                .substring(0, 16)
                .replaceAll('T', ' '),
            icon: isPending
                ? 'access_time'
                : (isApproved ? 'check_circle' : 'cancel'),
            createdAt: dt,
          ),
        );
      }
    }
  } catch (_) {}

  // Tambahkan notifikasi pembaruan Program Kerja (Proker) & Skor Kelompok
  try {
    final kknRepo = ref.read(kknRepositoryProvider);
    final prokerList = await kknRepo.getProgramKerja();
    for (final proker in prokerList) {
      final status = (proker['status'] ??
              proker['statusPelaksanaan'] ??
              proker['statusUsulan'] ??
              '')
          .toString()
          .toUpperCase();
      final judul = proker['judul']?.toString() ?? 'Program Kerja';
      final prokerId = proker['id']?.toString() ?? '';
      if (status.isNotEmpty) {
        String notifTitle = 'Program Kerja: $judul';
        String notifDesc = '';
        String notifType = 'PROKER';

        if (status == 'SELESAI') {
          notifTitle = '[Poin Kelompok] Proker Selesai! 🎉';
          notifDesc =
              'Program kerja "$judul" telah selesai (+2 PTS Poin Kelompok | Total: +6 PTS).';
          notifType = 'PROKER_SELESAI';
        } else if (status == 'SEDANG_BERJALAN' ||
            status == 'BERJALAN' ||
            status == 'BERLANGSUNG') {
          notifTitle = '[Poin Kelompok] Proker Sedang Berjalan 🏃‍♂️';
          notifDesc =
              'Program kerja "$judul" sedang dilaksanakan (+2 PTS Poin Kelompok | Total: +4 PTS).';
          notifType = 'PROKER_BERJALAN';
        } else if (status == 'DISETUJUI' || status == 'APPROVED') {
          notifTitle = '[Poin Kelompok] Proker Disetujui DPL ✅';
          notifDesc =
              'Program kerja "$judul" telah disetujui DPL (+2 PTS Poin Kelompok).';
          notifType = 'PROKER_DISETUJUI';
        } else if (status == 'DITOLAK' || status == 'REJECTED') {
          notifTitle = 'Proker Ditolak DPL ❌';
          notifDesc = 'Program kerja "$judul" ditolak oleh DPL.';
          notifType = 'PROKER_DITOLAK';
        } else {
          continue;
        }

        final dt = DateTime.tryParse(
              proker['updatedAt']?.toString() ??
                  proker['createdAt']?.toString() ??
                  '',
            ) ??
            DateTime.now();
        final notifId = 'proker_${prokerId}_$status';
        final isRead = readSet.contains(notifId) ||
            dt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(userId, role, notifId, dt);

        list.add(
          NotificationEntity(
            id: notifId,
            type: notifType,
            title: notifTitle,
            desc: notifDesc,
            isRead: isRead,
            time: dt
                .toLocal()
                .toIso8601String()
                .substring(0, 16)
                .replaceAll('T', ' '),
            icon: 'assignment_turned_in',
            createdAt: dt,
          ),
        );
      }
    }
  } catch (_) {}

  final List<NotificationEntity> result = [];

  for (final notif in list) {
    if (!_isMahasiswaNotification(notif)) continue;

    // Bersihkan metadata sistem seperti [ReportID:xxxx] dari judul dan deskripsi
    final sanitizedTitle = InputSanitizer.cleanSystemMessage(notif.title);
    final sanitizedDesc = InputSanitizer.cleanSystemMessage(notif.desc);

    // Deduplikasi berdasar ID atau kesamaan persis (Title + Desc + Type)
    if (result.any(
      (n) =>
          n.id == notif.id ||
          (n.title == sanitizedTitle &&
              n.desc == sanitizedDesc &&
              n.type == notif.type),
    )) {
      continue;
    }

    // Pastikan konversi waktu ke lokal jika formatnya UTC (ada 'Z')
    NotificationEntity finalNotif = notif.copyWith(
      title: sanitizedTitle,
      desc: sanitizedDesc,
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
      if (finalNotif.type.startsWith('PROKER_') ||
          finalNotif.type == 'IZIN' ||
          finalNotif.type == 'PEMANFAATAN_SAMPAH' ||
          finalNotif.type == 'PANEN_HASIL') {
        NotificationEngine().showGenericNotification(
          id: finalNotif.id.hashCode.remainder(100000),
          title: finalNotif.title,
          body: finalNotif.desc,
          payload: 'ROUTE_HISTORY',
        );
      }
    }
  }

  // Ambil notifikasi dari Firebase local storage
  try {
    final firebaseNotifs = await FirebaseNotificationService().getNotifications(
      userId,
      role,
    );
    for (final fn in firebaseNotifs) {
      if (result.any(
        (n) =>
            n.id == fn.id ||
            (n.title == fn.title && n.desc == fn.desc && n.type == fn.type),
      )) {
        continue;
      }
      if (!_isMahasiswaNotification(fn)) continue;

      result.add(fn);
    }
  } catch (_) {}

  // Gabungkan notifikasi dari LocalNotificationCacheService (submit form feedback)
  final localNotifs = LocalNotificationCacheService().getNotifications(
    userId,
    role,
  );
  for (final ln in localNotifs) {
    if (result.any(
      (n) =>
          n.id == ln.id ||
          (n.title == ln.title && n.desc == ln.desc && n.type == ln.type),
    )) {
      continue;
    }
    if (!_isMahasiswaNotification(ln)) continue;
    result.add(ln);
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
