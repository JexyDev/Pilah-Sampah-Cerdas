/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:equatable/equatable.dart';

/// Entitas pengguna — sesuai schema backend tabel `users`.
/// Backend menggunakan email sebagai identifier login (bukan NIK).
class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.name,
    required this.email,
    this.nik,
    required this.role,
    this.kelurahan = '',
    this.rtRw = '',
    this.householdId,
    this.fcmToken,
  });

  final String id;
  final String name;
  final String email;
  final String? nik;
  final UserRole role;
  final String kelurahan;
  final String rtRw;
  final String? householdId; // diisi setelah GET /households/me
  final String? fcmToken;

  UserEntity copyWith({
    String? id,
    String? name,
    String? email,
    String? nik,
    UserRole? role,
    String? kelurahan,
    String? rtRw,
    String? householdId,
    String? fcmToken,
  }) {
    return UserEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      nik: nik ?? this.nik,
      role: role ?? this.role,
      kelurahan: kelurahan ?? this.kelurahan,
      rtRw: rtRw ?? this.rtRw,
      householdId: householdId ?? this.householdId,
      fcmToken: fcmToken ?? this.fcmToken,
    );
  }

  @override
  List<Object?> get props => [id, email, nik, role];
}

/// 5 role RBAC sesuai backend tabel `roles`.
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

  /// Parse role string dari backend response.
  static UserRole fromApi(String value) {
    switch (value.toUpperCase()) {
      case 'ADMIN':
        return UserRole.admin;
      case 'PETUGAS_KELURAHAN':
        return UserRole.petugasKelurahan;
      case 'PETUGAS_RW':
        return UserRole.petugasRw;
      case 'PETUGAS_RT':
        return UserRole.petugasRt;
      default:
        return UserRole.warga;
    }
  }
}
