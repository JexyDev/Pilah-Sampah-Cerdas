import 'package:equatable/equatable.dart';

enum MarketplaceOrderStatus { pendingClaim, claimed, cancelled }

extension MarketplaceOrderStatusExt on MarketplaceOrderStatus {
  String get label {
    switch (this) {
      case MarketplaceOrderStatus.pendingClaim:
        return 'Menunggu Klaim';
      case MarketplaceOrderStatus.claimed:
        return 'Sudah Diklaim';
      case MarketplaceOrderStatus.cancelled:
        return 'Dibatalkan';
    }
  }

  String toJson() => name;
  static MarketplaceOrderStatus fromJson(String v) =>
      MarketplaceOrderStatus.values.firstWhere(
        (e) => e.name == v,
        orElse: () => MarketplaceOrderStatus.pendingClaim,
      );
}

/// Entitas resi/pesanan marketplace — disimpan persisten di SharedPreferences.
class MarketplaceOrderEntity extends Equatable {
  const MarketplaceOrderEntity({
    required this.id,
    required this.productId,
    required this.productName,
    required this.productKategori,
    required this.quantity,
    required this.pointsPerUnit,
    required this.totalPointsSpent,
    required this.claimCode,
    required this.createdAt,
    this.status = MarketplaceOrderStatus.pendingClaim,
  });

  final String id;
  final String productId;
  final String productName;
  final String productKategori;
  final int quantity;
  final int pointsPerUnit;
  final int totalPointsSpent;
  final String claimCode;
  final DateTime createdAt;
  final MarketplaceOrderStatus status;

  MarketplaceOrderEntity copyWith({
    MarketplaceOrderStatus? status,
  }) {
    return MarketplaceOrderEntity(
      id: id,
      productId: productId,
      productName: productName,
      productKategori: productKategori,
      quantity: quantity,
      pointsPerUnit: pointsPerUnit,
      totalPointsSpent: totalPointsSpent,
      claimCode: claimCode,
      createdAt: createdAt,
      status: status ?? this.status,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'productId': productId,
        'productName': productName,
        'productKategori': productKategori,
        'quantity': quantity,
        'pointsPerUnit': pointsPerUnit,
        'totalPointsSpent': totalPointsSpent,
        'claimCode': claimCode,
        'createdAt': createdAt.toIso8601String(),
        'status': status.toJson(),
      };

  factory MarketplaceOrderEntity.fromJson(Map<String, dynamic> json) =>
      MarketplaceOrderEntity(
        id: json['id'] as String,
        productId: json['productId'] as String,
        productName: json['productName'] as String,
        productKategori: json['productKategori'] as String? ?? '',
        quantity: json['quantity'] as int,
        pointsPerUnit: json['pointsPerUnit'] as int,
        totalPointsSpent: json['totalPointsSpent'] as int,
        claimCode: json['claimCode'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        status: MarketplaceOrderStatusExt.fromJson(
          json['status'] as String? ?? 'pendingClaim',
        ),
      );

  @override
  List<Object?> get props => [id];
}
