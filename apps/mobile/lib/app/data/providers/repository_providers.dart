import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/utils/safe_storage.dart';

import '../repositories/auth_repository.dart';
import '../repositories/bin_repository.dart';
import '../repositories/waste_log_repository.dart';
import '../repositories/notification_repository.dart';

import 'api_client.dart';
import '../repositories/api_auth_repository.dart';
import '../repositories/api_bin_repository.dart';
import '../repositories/api_waste_log_repository.dart';
import '../repositories/api_notification_repository.dart';
import '../repositories/kkn_repository.dart';
import '../repositories/api_kkn_repository.dart';
import '../repositories/petugas_pemilahan_repository.dart';
import '../repositories/api_petugas_pemilahan_repository.dart';

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

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return ApiNotificationRepository(
    apiClient: ref.read(apiClientProvider),
  );
});

final kknRepositoryProvider = Provider<KknRepository>((ref) {
  return ApiKknRepository(
    apiClient: ref.read(apiClientProvider),
  );
});

final petugasPemilahanRepositoryProvider = Provider<PetugasPemilahanRepository>((ref) {
  return ApiPetugasPemilahanRepository(
    apiClient: ref.read(apiClientProvider),
  );
});


