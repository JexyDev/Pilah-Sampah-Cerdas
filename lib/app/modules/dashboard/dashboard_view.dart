import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/values/app_assets.dart';
import '../../core/values/app_colors.dart';
import '../../core/values/app_dimensions.dart';
import '../../core/utils/responsive_utils.dart';
import '../shared/controllers/connectivity_controller.dart';
import '../shared/widgets/offline_banner.dart';
import '../beranda/beranda_view.dart';
import '../riwayat/views/riwayat_view.dart';
import '../poin/poin_view.dart';
import '../profil/profil_view.dart';
import '../mahasiswa/views/monitoring_warga_view.dart';
import '../mahasiswa/views/riwayat_kkn_view.dart';
import '../auth/controllers/auth_controller.dart';
import '../mahasiswa/views/mahasiswa_view.dart';
import '../../data/models/user_entity.dart';
import '../../core/utils/scan_guard.dart';
import '../petugas_residu/views/petugas_residu_main_navigation_view.dart';
import '../petugas_residu/views/riwayat_petugas_residu_view.dart';

/// Shell utama — Bottom Nav: Home, History, FAB QR hijau, Profile, Poin.
/// Sesuai desain: FAB bulat hijau di tengah.
class DashboardView extends ConsumerStatefulWidget {
  const DashboardView({super.key});

  @override
  ConsumerState<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends ConsumerState<DashboardView> {
  int _selectedIndex = 0;

  List<Widget> _getScreens(UserRole role) => [
    role == UserRole.mahasiswaKkn 
        ? const MahasiswaView() 
        : (role == UserRole.petugasResidu 
            ? const PetugasResiduMainNavigationView() 
            : BerandaView(onNavigateToHistory: () => _onTabTap(1))),
    role == UserRole.mahasiswaKkn 
        ? const RiwayatKknView() 
        : (role == UserRole.petugasResidu 
            ? const PetugasResiduMainNavigationView() 
            : const RiwayatView()),
    const SizedBox.shrink(),
    role == UserRole.mahasiswaKkn 
        ? const MonitoringWargaView() 
        : const PoinView(),
    const ProfilView(),
  ];

  void _onTabTap(int index) {
    if (index == 2) {
      ScanGuard.handleScanNavigation(context, ref);
      return;
    }
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    // Dengarkan perubahan status koneksi untuk notifikasi "Internet kembali pulih"
    ref.listen<bool>(isOnlineProvider, (prev, next) {
      if (prev == false && next == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Internet kembali pulih'),
            backgroundColor: AppColors.primaryGreen,
            duration: Duration(seconds: 3),
          ),
        );
      }
    });

    final bool isOnline = ref.watch(isOnlineProvider);
    final user = ref.watch(authProvider).user;
    final role = user?.role ?? UserRole.warga;

    return ResponsiveLayout(
      mobile: _buildMobileShell(isOnline, role),
      tablet: _buildTabletShell(isOnline, role),
    );
  }

  Widget _buildMobileShell(bool isOnline, UserRole role) {
    final screens = _getScreens(role);
    final bool showFab = role == UserRole.warga;
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: screens[_selectedIndex]),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(role),
      floatingActionButton: showFab ? _buildFab(isOnline) : null,
      floatingActionButtonLocation: showFab ? FloatingActionButtonLocation.centerDocked : null,
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
              ? () => ScanGuard.handleScanNavigation(context, ref)
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

  BottomAppBar _buildBottomBar(UserRole role) {
    final bool isWarga = role == UserRole.warga;
    return BottomAppBar(
      shape: isWarga ? const CircularNotchedRectangle() : null,
      notchMargin: isWarga ? 8 : 0,
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
            if (isWarga) const SizedBox(width: 60),
            _navItem(
              3,
              role == UserRole.mahasiswaKkn ? Icons.analytics_rounded : 
              role == UserRole.petugasResidu ? Icons.map_rounded : Icons.stars_rounded,
              role == UserRole.mahasiswaKkn ? Icons.analytics_outlined : 
              role == UserRole.petugasResidu ? Icons.map_outlined : Icons.stars_outlined,
              role == UserRole.mahasiswaKkn ? 'Monitoring' : 
              role == UserRole.petugasResidu ? 'Peta' : 'Poin',
            ),
            _navItem(
              4,
              Icons.person_rounded,
              Icons.person_outline_rounded,
              'Profile',
            ),
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
  Widget _buildTabletShell(bool isOnline, UserRole role) {
    final screens = _getScreens(role);
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: Row(
              children: [
                _buildNavigationRail(isOnline, role),
                const VerticalDivider(width: 1),
                Expanded(
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 800),
                      child: screens[_selectedIndex],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationRail(bool isOnline, UserRole role) {
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
                  ? () => ScanGuard.handleScanNavigation(context, ref)
                  : null,
              backgroundColor: isOnline
                  ? AppColors.primaryGreen
                  : AppColors.textHint,
              child: const Icon(Icons.qr_code_scanner_rounded, size: 18),
            ),
          ],
        ),
      ),
      destinations: [
        const NavigationRailDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded),
          label: Text('Home'),
        ),
        const NavigationRailDestination(
          icon: Icon(Icons.history_outlined),
          selectedIcon: Icon(Icons.history_rounded),
          label: Text('History'),
        ),
        NavigationRailDestination(
          icon: Icon(role == UserRole.mahasiswaKkn ? Icons.analytics_outlined : 
                     role == UserRole.petugasResidu ? Icons.map_outlined : Icons.stars_outlined),
          selectedIcon: Icon(role == UserRole.mahasiswaKkn ? Icons.analytics_rounded : 
                             role == UserRole.petugasResidu ? Icons.map_rounded : Icons.stars_rounded),
          label: Text(role == UserRole.mahasiswaKkn ? 'Monitoring' : 
                      role == UserRole.petugasResidu ? 'Peta' : 'Poin'),
        ),
        const NavigationRailDestination(
          icon: Icon(Icons.person_outline_rounded),
          selectedIcon: Icon(Icons.person_rounded),
          label: Text('Profile'),
        ),
      ],
    );
  }
}


