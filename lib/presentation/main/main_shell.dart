/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_assets.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimensions.dart';
import '../../core/utils/responsive_utils.dart';
import '../../core/router/app_router.dart';
import '../providers/connectivity_provider.dart';
import '../shared/widgets/offline_banner.dart';
import '../beranda/beranda_screen.dart';
import '../riwayat/riwayat_screen.dart';
import '../poin/poin_screen.dart';
import '../profil/profil_screen.dart';

/// Shell utama — Bottom Nav: Home, History, FAB QR hijau, Profile, Poin.
/// Sesuai desain: FAB bulat hijau di tengah.
class MainShell extends ConsumerStatefulWidget {
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _selectedIndex = 0;

  List<Widget> get _screens => [
    BerandaScreen(onNavigateToHistory: () => _onTabTap(1)),
    const RiwayatScreen(),
    const SizedBox.shrink(),
    const ProfilScreen(),
    const PoinScreen(),
  ];

  void _onTabTap(int index) {
    if (index == 2) {
      Navigator.of(context).pushNamed(AppRoutes.scan);
      return;
    }
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final bool isOnline = ref.watch(isOnlineProvider);

    return ResponsiveLayout(
      mobile: _buildMobileShell(isOnline),
      tablet: _buildTabletShell(isOnline),
    );
  }

  Widget _buildMobileShell(bool isOnline) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: _screens[_selectedIndex]),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
      floatingActionButton: _buildFab(isOnline),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }

  Widget _buildFab(bool isOnline) {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: isOnline ? AppColors.primaryGreen : AppColors.textHint,
        shape: BoxShape.circle,
        boxShadow: isOnline
            ? [
                BoxShadow(
                  color: AppColors.primaryGreen.withValues(alpha: 0.4),
                  blurRadius: 12,
                  spreadRadius: 2,
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: isOnline
              ? () => Navigator.of(context).pushNamed(AppRoutes.scan)
              : null,
          child: const Icon(
            Icons.qr_code_scanner_rounded,
            color: Colors.white,
            size: 26,
          ),
        ),
      ),
    );
  }

  BottomAppBar _buildBottomBar() {
    return BottomAppBar(
      shape: const CircularNotchedRectangle(),
      notchMargin: 8,
      color: Colors.white,
      elevation: 8,
      child: SizedBox(
        height: AppDimensions.bottomNavHeight,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _navItem(0, Icons.home_rounded, Icons.home_outlined, 'Home'),
            _navItem(
              1,
              Icons.history_rounded,
              Icons.history_outlined,
              'History',
            ),
            const SizedBox(width: 60),
            _navItem(
              3,
              Icons.person_rounded,
              Icons.person_outline_rounded,
              'Profile',
            ),
            _navItem(4, Icons.stars_rounded, Icons.stars_outlined, 'Poin'),
          ],
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData active, IconData inactive, String label) {
    final bool sel = _selectedIndex == index;
    return InkWell(
      onTap: () => _onTabTap(index),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              sel ? active : inactive,
              color: sel ? AppColors.primaryGreen : AppColors.textHint,
              size: 22,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: sel ? FontWeight.w600 : FontWeight.w400,
                color: sel ? AppColors.primaryGreen : AppColors.textHint,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Tablet (NavigationRail) ──────────────────────────────────────────────
  Widget _buildTabletShell(bool isOnline) {
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: Row(
              children: [
                _buildNavigationRail(isOnline),
                const VerticalDivider(width: 1),
                Expanded(child: _screens[_selectedIndex]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationRail(bool isOnline) {
    final int railIndex = _selectedIndex > 2
        ? _selectedIndex - 1
        : _selectedIndex;
    return NavigationRail(
      backgroundColor: Colors.white,
      selectedIndex: railIndex.clamp(0, 3),
      onDestinationSelected: (i) =>
          setState(() => _selectedIndex = i >= 2 ? i + 1 : i),
      labelType: NavigationRailLabelType.all,
      selectedIconTheme: const IconThemeData(color: AppColors.primaryGreen),
      selectedLabelTextStyle: const TextStyle(
        color: AppColors.primaryGreen,
        fontWeight: FontWeight.w600,
        fontSize: 12,
      ),
      unselectedIconTheme: const IconThemeData(color: AppColors.textHint),
      unselectedLabelTextStyle: const TextStyle(
        color: AppColors.textHint,
        fontSize: 12,
      ),
      leading: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(shape: BoxShape.circle),
              clipBehavior: Clip.antiAlias,
              child: Image.asset(
                AppAssets.logo,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  decoration: const BoxDecoration(
                    color: AppColors.primaryGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.eco_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            FloatingActionButton.small(
              onPressed: isOnline
                  ? () => Navigator.of(context).pushNamed(AppRoutes.scan)
                  : null,
              backgroundColor: isOnline
                  ? AppColors.primaryGreen
                  : AppColors.textHint,
              child: const Icon(Icons.qr_code_scanner_rounded, size: 18),
            ),
          ],
        ),
      ),
      destinations: const [
        NavigationRailDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded),
          label: Text('Home'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.history_outlined),
          selectedIcon: Icon(Icons.history_rounded),
          label: Text('History'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.person_outline_rounded),
          selectedIcon: Icon(Icons.person_rounded),
          label: Text('Profile'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.stars_outlined),
          selectedIcon: Icon(Icons.stars_rounded),
          label: Text('Poin'),
        ),
      ],
    );
  }
}
