import 'package:flutter/material.dart';
import '../../../core/values/app_colors.dart';
import '../../../core/values/app_dimensions.dart';
import '../../../data/models/bin_entity.dart';

/// Badge status kapasitas tempat sampah (Safe / Warning / Critical).
class BinStatusBadge extends StatelessWidget {
  const BinStatusBadge({super.key, required this.status});

  final BinStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.sm,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: _backgroundColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: _backgroundColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            _label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: _backgroundColor,
            ),
          ),
        ],
      ),
    );
  }

  Color get _backgroundColor {
    switch (status) {
      case BinStatus.safe:
        return AppColors.binSafe;
      case BinStatus.warning:
        return AppColors.binWarning;
      case BinStatus.critical:
        return AppColors.binCritical;
    }
  }

  String get _label {
    switch (status) {
      case BinStatus.safe:
        return 'Aman';
      case BinStatus.warning:
        return 'Hampir Penuh';
      case BinStatus.critical:
        return 'Kritis';
    }
  }
}

