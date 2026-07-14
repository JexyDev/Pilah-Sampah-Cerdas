import 'package:equatable/equatable.dart';

/// Entitas pengajuan reset tong — sesuai sdd.md §2 tabel `bin_reset_requests`.
class BinResetEntity extends Equatable {
  const BinResetEntity({
    required this.id,
    required this.binId,
    required this.userId,
    required this.status,
    required this.createdAt,
    this.evidencePhotoUrl,
    this.reviewedBy,
    this.rejectReason,
  });

  final String id;
  final String binId;
  final String userId;
  final BinResetStatus status;
  final DateTime createdAt;
  final String? evidencePhotoUrl;
  final String? reviewedBy;
  final String? rejectReason;

  @override
  List<Object?> get props => [id];
}

/// Status pengajuan reset tong sesuai sdd.md §2.
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
