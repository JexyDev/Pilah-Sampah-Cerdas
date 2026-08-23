import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/notification_entity.dart';
import '../../../data/providers/repository_providers.dart';
import '../../auth/controllers/auth_controller.dart';

import '../../../data/services/firebase_notification_service.dart';
import '../../../data/services/local_notification_cache_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

final Set<String> _mhsShownNotifIds = {};

bool _isMahasiswaNotification(NotificationEntity notif) {
  final type = notif.type.toUpperCase();
  final title = notif.title.toUpperCase();
  final desc = notif.desc.toUpperCase();

  // Keyword & Tipe yang DILARANG untuk Mahasiswa KKN (Milik Warga / Petugas)
  final isForbidden = type.contains('TIMBANGAN_PEMILAHAN') ||
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
  final isMahasiswaTopic = type.contains('PEMANFAATAN') ||
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
final mahasiswaNotificationsProvider = FutureProvider<List<NotificationEntity>>((ref) async {
  final repo = ref.watch(notificationRepositoryProvider);
  final user = ref.watch(authProvider).user;
  if (user == null) return [];

  final userId = user.id;
  final role = user.role.name;
  List<NotificationEntity> list = [];
  try {
    list = await repo.getNotifications();
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
        if (ph.points != 0) {
          final notifId = 'point_${ph.id}';
        final isRead = readSet.contains(notifId) || 
            ph.createdAt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(userId, role, notifId, ph.createdAt);
            
        final isPunishment = ph.points < 0;
            
        list.add(NotificationEntity(
          id: notifId,
          type: isPunishment ? 'PUNISHMENT' : 'POIN_KKN',
          title: isPunishment ? 'Penalti Poin KKN' : 'Poin KKN Bertambah!',
          desc: ph.description.isNotEmpty ? ph.description : (isPunishment ? 'Poin KKN Anda dikurangi ${ph.points}.' : 'Anda mendapatkan +${ph.points} poin.'),
          isRead: isRead,
          time: ph.createdAt.toLocal().toIso8601String().substring(0, 16).replaceAll('T', ' '),
          icon: isPunishment ? 'warning' : 'star',
        ));
      }
    }
  } catch (_) {}

  // Tambahkan notifikasi persetujuan/penolakan Izin dari DPL
  try {
    final kknRepo = ref.read(kknRepositoryProvider);
    final izinList = await kknRepo.getPengajuanIzin();
    for (final izin in izinList) {
      final status = izin['status']?.toString().toUpperCase();
      if (status == 'APPROVED' || status == 'REJECTED') {
        final isApproved = status == 'APPROVED';
        final kategori = izin['kategori']?.toString() ?? 'Izin';
        final timestamp = izin['reviewedAt']?.toString() ?? izin['createdAt']?.toString() ?? DateTime.now().toIso8601String();
        final dt = DateTime.tryParse(timestamp) ?? DateTime.now();
        
        final notifId = 'izin_${izin['id']}';
        final isRead = readSet.contains(notifId) || 
            dt.millisecondsSinceEpoch <= markAllTimestamp ||
            LocalNotificationCacheService().isRead(userId, role, notifId, dt);
            
        list.add(NotificationEntity(
          id: notifId,
          type: 'IZIN',
          title: isApproved ? 'Pengajuan Izin Disetujui' : 'Pengajuan Izin Ditolak',
          desc: isApproved ? 'DPL telah menyetujui pengajuan $kategori Anda.' : 'DPL menolak pengajuan $kategori Anda. ${izin['rejectionReason'] ?? ''}',
          isRead: isRead,
          time: dt.toLocal().toIso8601String().substring(0, 16).replaceAll('T', ' '),
          icon: isApproved ? 'check_circle' : 'cancel',
        ));
      }
    }
  } catch (_) {}

  final List<NotificationEntity> result = [];

  for (final notif in list) {
    if (!_isMahasiswaNotification(notif)) continue;
    
    // Deduplikasi berdasar ID atau kesamaan persis (Title + Desc + Type)
    if (result.any((n) => n.id == notif.id || (n.title == notif.title && n.desc == notif.desc && n.type == notif.type))) continue;

    // Pastikan konversi waktu ke lokal jika formatnya UTC (ada 'Z')
    NotificationEntity finalNotif = notif;
    if (notif.time.endsWith('Z')) {
      final dt = DateTime.tryParse(notif.time);
      if (dt != null) {
        finalNotif = notif.copyWith(time: dt.toLocal().toIso8601String().substring(0, 16).replaceAll('T', ' '));
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
    final firebaseNotifs = await FirebaseNotificationService().getNotifications(userId, role);
    for (final fn in firebaseNotifs) {
      if (result.any((n) => n.id == fn.id || (n.title == fn.title && n.desc == fn.desc && n.type == fn.type))) {
        continue;
      }
      if (!_isMahasiswaNotification(fn)) continue;
      
      result.add(fn);
    }
  } catch (_) {}

    final deleteAllTimestamp = prefs.getInt('delete_all_notifs_${userId}_$role') ?? 0;
  
  final List<NotificationEntity> finalResult = [];
  for (int i = 0; i < result.length; i++) {
    final dt = DateTime.tryParse(result[i].time) ?? DateTime(2000);
    
    // Skip if deleted
    if (dt.millisecondsSinceEpoch <= deleteAllTimestamp) {
      continue;
    }
    
    var item = result[i];
    final isReadLocally = readSet.contains(item.id) || 
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
  return notifAsync.when(skipLoadingOnReload: true, data: (list) => list.where((n) => !n.isRead).length,
    loading: () => 0,
    error: (_, __) => 0,
  );
});




