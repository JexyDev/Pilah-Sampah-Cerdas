import 'package:equatable/equatable.dart';

class PetugasEntity extends Equatable {
  const PetugasEntity({
    required this.id,
    required this.name,
    this.fotoProfil,
  });

  final String id;
  final String name;
  final String? fotoProfil;

  factory PetugasEntity.fromJson(Map<String, dynamic> json) {
    return PetugasEntity(
      id: json['id'] as String? ?? '',
      name: json['name'] ?? json['nama'] as String? ?? '',
      fotoProfil: json['fotoProfil'] ?? json['foto'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'fotoProfil': fotoProfil,
    };
  }

  @override
  List<Object?> get props => [id, name, fotoProfil];
}
