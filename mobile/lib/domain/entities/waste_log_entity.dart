/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:equatable/equatable.dart';
import 'bin_entity.dart';

/// Entitas riwayat setoran sampah — sesuai sdd.md §2 tabel `waste_logs`.
class WasteLogEntity extends Equatable {
  const WasteLogEntity({
    required this.id,
    required this.userId,
    required this.binId,
    required this.wasteType,
    required this.volumeLiter,
    required this.weightKg,
    required this.pointsAwarded,
    required this.createdAt,
    this.binQrSerial,
    this.kelurahan,
  });

  final String id;
  final String userId;
  final String binId;
  final WasteType wasteType;
  final double volumeLiter;
  final double weightKg;
  final int pointsAwarded;
  final DateTime createdAt;
  final String? binQrSerial;
  final String? kelurahan;

  @override
  List<Object?> get props => [id];
}
