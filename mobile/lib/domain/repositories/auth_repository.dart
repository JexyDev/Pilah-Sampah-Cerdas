/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import '../entities/user_entity.dart';

/// Interface repository autentikasi.
abstract class AuthRepository {
  /// Login dengan NIK dan password.
  /// Returns [UserEntity] jika berhasil.
  /// Throws [AuthException] jika gagal.
  Future<UserEntity> login({required String nik, required String password});

  /// Logout — hapus token dari secure storage.
  Future<void> logout();

  /// Cek apakah user sudah login (access token tersimpan).
  Future<bool> isLoggedIn();

  /// Ambil data user yang sedang login dari local cache.
  Future<UserEntity?> getCurrentUser();

  /// Refresh access token menggunakan refresh token.
  /// Throws [AuthException] jika refresh token expired/invalid.
  Future<String> refreshAccessToken();

  /// Mengambil data profil terbaru dari server (GET /api/v1/auth/me)
  Future<UserEntity> fetchProfile();
}

/// Exception khusus untuk auth errors.
class AuthException implements Exception {
  const AuthException(this.code, [this.message]);

  final String code;
  final String? message;

  @override
  String toString() => 'AuthException($code): $message';
}
