import 'package:equatable/equatable.dart';

/// Entitas pengguna â€” sesuai schema backend tabel `users`.
/// Backend menggunakan email sebagai identifier login (bukan NIK).
class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.name,
    required this.role,
    this.phone = '',
    this.address = '',
    this.kelurahan = '',
    this.rw = '',
    this.householdId,
    this.fcmToken,
    this.fotoProfil,
    this.email,
    this.nim = '',
    this.jurusan = '',
    this.prodi = '',
    this.fakultas = '',
    this.universitas = '',
    this.kecamatan = 'Coblong',
    this.pendampingName,
    this.familySize = 1,
  });

  final String id;
  final String name;
  final String phone;
  final String address;
  final UserRole role;
  final String kecamatan;
  final String kelurahan;
  final String rw;
  final String? householdId; // diisi setelah GET /households/me
  final String? fcmToken;
  final String? fotoProfil;
  final String? email;
  final String nim;
  final String jurusan;
  final String prodi;
  final String fakultas;
  final String universitas;
  final String? pendampingName;
  final int familySize;



  UserEntity copyWith({
    String? id,
    String? name,
    String? phone,
    String? address,
    UserRole? role,
    String? kecamatan,
    String? kelurahan,
    String? rw,
    String? householdId,
    String? fcmToken,
    String? fotoProfil,
    String? email,
    String? nim,
    String? jurusan,
    String? prodi,
    String? fakultas,
    String? universitas,
    String? pendampingName,
  }) {
    return UserEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      role: role ?? this.role,
      kecamatan: kecamatan ?? this.kecamatan,
      kelurahan: kelurahan ?? this.kelurahan,
      rw: rw ?? this.rw,
      householdId: householdId ?? this.householdId,
      fcmToken: fcmToken ?? this.fcmToken,
      fotoProfil: fotoProfil ?? this.fotoProfil,
      email: email ?? this.email,
      nim: nim ?? this.nim,
      jurusan: jurusan ?? this.jurusan,
      prodi: prodi ?? this.prodi,
      fakultas: fakultas ?? this.fakultas,
      universitas: universitas ?? this.universitas,
      pendampingName: pendampingName ?? this.pendampingName,
    );
  }

  @override
  List<Object?> get props => [id, phone, address, role, nim, jurusan, prodi, fakultas, kecamatan, kelurahan, rw, pendampingName];
}

/// 5 role RBAC sesuai backend tabel `roles`.
enum UserRole { admin, petugasKelurahan, petugasRw, petugasRt, warga, mahasiswaKkn, petugasPemilahan }

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
      case UserRole.mahasiswaKkn:
        return 'Mahasiswa KKN';
      case UserRole.petugasPemilahan:
        return 'Petugas Pemilahan';
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
      case UserRole.mahasiswaKkn:
        return 'MAHASISWA_KKN';
      case UserRole.petugasPemilahan:
        return 'PETUGAS_PEMILAHAN';
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
      case 'MAHASISWA_KKN':
        return UserRole.mahasiswaKkn;
      case 'PETUGAS_PEMILAHAN':
        return UserRole.petugasPemilahan;
      default:
        return UserRole.warga;
    }
  }
}

