import 'package:equatable/equatable.dart';

/// Entitas produk di Marketplace. Data bersifat mock (lokal), disimpan di SharedPreferences.
class MarketplaceProductEntity extends Equatable {
  const MarketplaceProductEntity({
    required this.id,
    required this.name,
    required this.description,
    required this.pointsCost,
    required this.stock,
    required this.iconData,
    required this.kategori,
    this.isActive = true,
  });

  final String id;
  final String name;
  final String description;
  final int pointsCost;
  final int stock;
  final int iconData; // Icon.codePoint untuk serialisasi
  final String kategori;
  final bool isActive;

  bool get isAvailable => isActive && stock > 0;

  MarketplaceProductEntity copyWith({
    String? id,
    String? name,
    String? description,
    int? pointsCost,
    int? stock,
    int? iconData,
    String? kategori,
    bool? isActive,
  }) {
    return MarketplaceProductEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      pointsCost: pointsCost ?? this.pointsCost,
      stock: stock ?? this.stock,
      iconData: iconData ?? this.iconData,
      kategori: kategori ?? this.kategori,
      isActive: isActive ?? this.isActive,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'pointsCost': pointsCost,
        'stock': stock,
        'iconData': iconData,
        'kategori': kategori,
        'isActive': isActive,
      };

  factory MarketplaceProductEntity.fromJson(Map<String, dynamic> json) =>
      MarketplaceProductEntity(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String,
        pointsCost: json['pointsCost'] as int,
        stock: json['stock'] as int,
        iconData: json['iconData'] as int,
        kategori: json['kategori'] as String,
        isActive: json['isActive'] as bool? ?? true,
      );

  @override
  List<Object?> get props => [id, stock, isActive];
}
