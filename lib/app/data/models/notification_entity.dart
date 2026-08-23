import 'package:equatable/equatable.dart';

/// Entitas notifikasi — sesuai response GET /api/v1/notifications.
class NotificationEntity extends Equatable {
  const NotificationEntity({
    required this.id,
    required this.type,
    required this.title,
    required this.desc,
    required this.isRead,
    required this.time,
    required this.icon,
    required this.createdAt,
  });

  final String id;

  /// Tipe notifikasi: POIN_BERTAMBAH, TONG_PENUH, PENGAJUAN_PENGOSONGAN,
  /// PENGAJUAN_DISETUJUI, PENGAJUAN_DITOLAK, INFO
  final String type;

  final String title;
  final String desc;
  final bool isRead;

  /// Waktu relatif sudah diformat backend: "2 jam lalu", "Baru saja", dll.
  final String time;

  /// Nama icon Material (star, warning, delete_sweep, check_circle, info).
  final String icon;

  /// Raw sortable timestamp.
  final DateTime createdAt;

  NotificationEntity copyWith({bool? isRead, String? time, DateTime? createdAt}) {
    return NotificationEntity(
      id: id,
      type: type,
      title: title,
      desc: desc,
      isRead: isRead ?? this.isRead,
      time: time ?? this.time,
      icon: icon,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [id, isRead];
}
