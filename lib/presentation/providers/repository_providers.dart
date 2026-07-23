/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/utils/safe_storage.dart';

import '../../domain/repositories/auth_repository.dart';
import '../../domain/repositories/bin_repository.dart';
import '../../domain/repositories/waste_log_repository.dart';

import '../../data/network/api_client.dart';
import '../../data/repositories/api_auth_repository.dart';
import '../../data/repositories/api_bin_repository.dart';
import '../../data/repositories/api_waste_log_repository.dart';

final secureStorageProvider = Provider<SafeStorage>((ref) {
  return const SafeStorage();
});

final dioProvider = Provider<Dio>((ref) {
  return Dio();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    dio: ref.read(dioProvider),
    secureStorage: ref.read(secureStorageProvider),
  );
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return ApiAuthRepository(
    apiClient: ref.read(apiClientProvider),
    secureStorage: ref.read(secureStorageProvider),
  );
});

final binRepositoryProvider = Provider<BinRepository>((ref) {
  return ApiBinRepository(
    apiClient: ref.read(apiClientProvider),
  );
});

final wasteLogRepositoryProvider = Provider<WasteLogRepository>((ref) {
  return ApiWasteLogRepository(
    apiClient: ref.read(apiClientProvider),
  );
});
