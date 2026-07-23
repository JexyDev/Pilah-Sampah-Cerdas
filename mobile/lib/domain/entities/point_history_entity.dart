/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:equatable/equatable.dart';
import 'bin_entity.dart';

/// Entitas riwayat poin — sesuai sdd.md §2 tabel `point_history`.
class PointHistoryEntity extends Equatable {
  const PointHistoryEntity({
    required this.id,
    required this.userId,
    required this.points,
    required this.wasteType,
    required this.description,
    required this.createdAt,
  });

  final String id;
  final String userId;
  final int points;
  final WasteType wasteType;
  final String description;
  final DateTime createdAt;

  @override
  List<Object?> get props => [id];
}
