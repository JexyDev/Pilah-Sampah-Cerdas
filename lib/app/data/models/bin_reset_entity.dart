import 'package:equatable/equatable.dart';

/// Entitas pengajuan tempat sampah penuh (`pengajuan_tempat_sampah`) — A.6
class BinResetEntity extends Equatable {
  const BinResetEntity({
    required this.id,
    required this.binId,
    required this.userId,
    required this.rwId,
    required this.status,
    required this.createdAt,
    this.evidencePhotoUrl,
    this.reviewedBy,
    this.rejectReason,
    this.catatanRw,
    this.reviewedAt,
  });

  final String id;
  final String binId;
  final String userId;
  final String rwId;
  final BinResetStatus status;
  final DateTime createdAt;
  final String? evidencePhotoUrl;
  final String? reviewedBy;
  final String? rejectReason;
  final String? catatanRw;
  final DateTime? reviewedAt;

  @override
  List<Object?> get props => [id];
}

/// Status pengajuan tempat sampah penuh
enum BinResetStatus { pending, approved, rejected }

extension BinResetStatusExtension on BinResetStatus {
  String get displayName {
    switch (this) {
      case BinResetStatus.pending:
        return 'Menunggu Persetujuan';
      case BinResetStatus.approved:
        return 'Disetujui';
      case BinResetStatus.rejected:
        return 'Ditolak';
    }
  }
}
