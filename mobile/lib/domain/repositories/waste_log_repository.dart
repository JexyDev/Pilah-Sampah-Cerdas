/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import '../entities/waste_log_entity.dart';
import '../entities/point_history_entity.dart';

/// Interface repository riwayat & poin.
/// Implementasi: MockWasteLogRepository (data layer).
abstract class WasteLogRepository {
  /// Ambil riwayat setoran sampah milik user.
  Future<List<WasteLogEntity>> getWasteLogsByUser(String userId);

  /// Ambil riwayat poin milik user.
  Future<List<PointHistoryEntity>> getPointHistoryByUser(String userId);

  /// Ambil total poin user.
  Future<int> getTotalPointsByUser(String userId);
}
