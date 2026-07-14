import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/app_config.dart';
import '../../domain/entities/waste_log_entity.dart';
import '../../domain/entities/point_history_entity.dart';
import 'repository_providers.dart';
import 'auth_provider.dart';

/// Provider riwayat setoran sampah milik user yang sedang login.
final wasteLogsProvider = FutureProvider<List<WasteLogEntity>>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider).user?.id ?? AppConfig.mockUserId;
  return repo.getWasteLogsByUser(userId);
});

/// Provider riwayat poin milik user yang sedang login.
final pointHistoryProvider = FutureProvider<List<PointHistoryEntity>>((
  ref,
) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider).user?.id ?? AppConfig.mockUserId;
  return repo.getPointHistoryByUser(userId);
});

/// Provider total poin user.
final totalPointsProvider = FutureProvider<int>((ref) async {
  final repo = ref.watch(wasteLogRepositoryProvider);
  final userId = ref.watch(authProvider).user?.id ?? AppConfig.mockUserId;
  return repo.getTotalPointsByUser(userId);
});
