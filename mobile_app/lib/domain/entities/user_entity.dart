import 'package:equatable/equatable.dart';

/// Entitas pengguna — sesuai sdd.md §2 tabel `users` & §11 RBAC matrix.
class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.name,
    required this.nik,
    required this.role,
    required this.kelurahan,
    required this.rtRw,
    this.fcmToken,
  });

  final String id;
  final String name;
  final String nik;
  final UserRole role;
  final String kelurahan;
  final String rtRw;
  final String? fcmToken;

  @override
  List<Object?> get props => [id, nik, role];
}

/// 5 role RBAC sesuai sdd.md §11 dan task_breakdown.md §1.2.
enum UserRole { admin, petugasKelurahan, petugasRw, petugasRt, warga }

extension UserRoleExtension on UserRole {
  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'Admin Kecamatan';
      case UserRole.petugasKelurahan:
        return 'Petugas Kelurahan';
      case UserRole.petugasRw:
        return 'Petugas RW';
      case UserRole.petugasRt:
        return 'Petugas RT';
      case UserRole.warga:
        return 'Warga';
    }
  }

  String get apiValue {
    switch (this) {
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.petugasKelurahan:
        return 'PETUGAS_KELURAHAN';
      case UserRole.petugasRw:
        return 'PETUGAS_RW';
      case UserRole.petugasRt:
        return 'PETUGAS_RT';
      case UserRole.warga:
        return 'WARGA';
    }
  }
}
