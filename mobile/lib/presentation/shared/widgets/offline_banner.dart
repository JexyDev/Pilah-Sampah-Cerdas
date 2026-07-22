/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/constants/app_dimensions.dart';
import '../../providers/connectivity_provider.dart';

/// Banner merah yang muncul di bagian atas layar saat offline.
/// Sesuai ui_ux_flow.md §5.3 dan srs.md NFR-05.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool isOnline = ref.watch(isOnlineProvider);

    if (isOnline) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      height: AppDimensions.offlineBannerHeight,
      color: AppColors.offlineBanner,
      padding: const EdgeInsets.symmetric(horizontal: AppDimensions.md),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.wifi_off_rounded,
            color: AppColors.offlineBannerText,
            size: AppDimensions.iconSm,
          ),
          SizedBox(width: AppDimensions.sm),
          Flexible(
            child: Text(
              AppStrings.offlineBannerMessage,
              style: TextStyle(
                color: AppColors.offlineBannerText,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
        ],
      ),
    );
  }
}
