import 'package:equatable/equatable.dart';
import 'petugas_entity.dart';

class PetugasStatusResponse extends Equatable {
  const PetugasStatusResponse({
    required this.hasDefaultPetugas,
    this.petugas,
  });

  final bool hasDefaultPetugas;
  final PetugasEntity? petugas;

  factory PetugasStatusResponse.fromJson(Map<String, dynamic> json) {
    return PetugasStatusResponse(
      hasDefaultPetugas: json['hasDefaultPetugas'] ?? false,
      petugas: json['petugas'] != null
          ? PetugasEntity.fromJson(json['petugas'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'hasDefaultPetugas': hasDefaultPetugas,
      'petugas': petugas?.toJson(),
    };
  }

  @override
  List<Object?> get props => [hasDefaultPetugas, petugas];
}
