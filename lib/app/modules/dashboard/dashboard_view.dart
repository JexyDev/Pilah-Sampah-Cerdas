import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/values/app_assets.dart';
import '../../core/values/app_colors.dart';
import '../../core/values/app_dimensions.dart';
import '../../core/utils/responsive_utils.dart';
import '../shared/controllers/connectivity_controller.dart';
// OfflineBanner dihapus karena diganti SnackBar
import '../beranda/beranda_view.dart';
import '../riwayat/views/riwayat_view.dart';
import '../poin/poin_view.dart';
import '../profil/profil_view.dart';
import '../mahasiswa/views/mahasiswa_view.dart';
import '../auth/controllers/auth_controller.dart';
import '../../data/models/user_entity.dart';
import '../../core/utils/scan_guard.dart';
import '../mahasiswa/views/mahasiswa_poin_view.dart';
import '../mahasiswa/views/riwayat_kkn_view.dart';
import '../petugas_pemilahan/views/petugas_pemilahan_dashboard_view.dart';
import '../petugas_pemilahan/views/riwayat_petugas_pemilahan_view.dart';
import '../petugas_pemilahan/views/petugas_pemilahan_poin_view.dart';
import '../petugas_pemilahan/views/petugas_pemilahan_profil_view.dart';
import '../../routes/app_routes.dart';
import '../../core/utils/update_checker.dart';

/// Shell utama â€” Bottom Nav: Home, History, FAB QR hijau, Profile, Poin.
/// Sesuai desain: FAB bulat hijau di tengah.
class DashboardView extends ConsumerStatefulWidget {
  const DashboardView({super.key});

  @override
  ConsumerState<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends ConsumerState<DashboardView> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      UpdateChecker.checkForUpdate(context);
    });
  }

  List<Widget> _getScreens(UserRole role) => [
    role == UserRole.mahasiswaKkn 
        ? const MahasiswaView() 
        : (role == UserRole.petugasPemilahan 
            ? const PetugasPemilahanDashboardView() 
            : BerandaView(onNavigateToHistory: () => _onTabTap(1))),
    role == UserRole.mahasiswaKkn 
        ? const RiwayatKknView() 
        : (role == UserRole.petugasPemilahan 
            ? const RiwayatPetugasPemilahanView() 
            : const RiwayatView()),
    const SizedBox.shrink(),
    role == UserRole.mahasiswaKkn 
        ? const MahasiswaPoinView() 
        : (role == UserRole.petugasPemilahan 
            ? const PetugasPemilahanPoinView() 
            : const PoinView()),
    role == UserRole.petugasPemilahan ? const PetugasPemilahanProfilView() : const ProfilView(),
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
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Internet kembali pulih'),
            backgroundColor: AppColors.primaryGreen,
            duration: Duration(seconds: 3),
          ),
        );
      } else if (prev == true && next == false) {
        ScaffoldMessenger.of(context).clearSnackBars(); ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Anda sedang offline. Koneksi internet terputus.'),
            backgroundColor: AppColors.dangerRed,
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
    final bool showFab = role == UserRole.warga || role == UserRole.petugasPemilahan || role == UserRole.mahasiswaKkn;
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      resizeToAvoidBottomInset: false,
      body: Column(
        children: [

          Expanded(child: screens[_selectedIndex]),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(role),
      floatingActionButton: showFab ? _buildFab(isOnline, role) : null,
      floatingActionButtonLocation: showFab ? FloatingActionButtonLocation.centerDocked : null,
    );
  }

  Widget _buildFab(bool isOnline, UserRole role) {
    final fabColor = (role == UserRole.petugasPemilahan) ? AppColors.dangerRed : AppColors.primaryGreen;

    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: isOnline ? fabColor : AppColors.textHint,
        shape: BoxShape.circle,
        boxShadow: isOnline
            ? [
                BoxShadow(
                  color: fabColor.withValues(alpha: 0.4),
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
              ? () {
                  if (role == UserRole.petugasPemilahan) {
                    Navigator.pushNamed(context, AppRoutes.timbanganPemilahan);
                  } else if (role == UserRole.mahasiswaKkn) {
                    Navigator.pushNamed(context, AppRoutes.monitoringWarga, arguments: 'aktivasi_bin');
                  } else {
                    ScanGuard.handleScanNavigation(context, ref);
                  }
                }
              : null,
          child: Icon(
            role == UserRole.petugasPemilahan ? Icons.scale_rounded : Icons.qr_code_scanner_rounded,
            color: Colors.white,
            size: 26,
          ),
        ),
      ),
    );
  }

  BottomAppBar _buildBottomBar(UserRole role) {
    final bool isWarga = role == UserRole.warga;
    final bool isPetugas = role == UserRole.petugasPemilahan;
    final bool isMahasiswa = role == UserRole.mahasiswaKkn;
    final bool hasFab = isWarga || isPetugas || isMahasiswa;

    return BottomAppBar(
      shape: hasFab ? const CircularNotchedRectangle() : null,
      notchMargin: hasFab ? 8 : 0,
      color: Colors.white,
      elevation: 8,
      child: SizedBox(
        height: AppDimensions.bottomNavHeight,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _navItem(
                    0, 
                    Icons.home_rounded, 
                    Icons.home_outlined, 
                    role == UserRole.petugasPemilahan ? 'Beranda' : 'Home'
                  ),
                  _navItem(
                    1,
                    Icons.history_rounded,
                    Icons.history_outlined,
                    role == UserRole.petugasPemilahan ? 'Riwayat' : 'History',
                  ),
                ],
              ),
            ),
            if (hasFab) const SizedBox(width: 64), // Perfect FAB hole
            Expanded(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _navItem(
                    3,
                    role == UserRole.mahasiswaKkn ? Icons.analytics_rounded : 
                    (role == UserRole.petugasPemilahan ? Icons.monetization_on_rounded : null),
                    role == UserRole.mahasiswaKkn ? Icons.analytics_outlined : 
                    (role == UserRole.petugasPemilahan ? Icons.monetization_on_outlined : null),
                    role == UserRole.mahasiswaKkn ? 'Monitoring' : 
                    (role == UserRole.petugasPemilahan ? 'Poin' : 'Poin'),
                    activeAsset: (role == UserRole.mahasiswaKkn || role == UserRole.petugasPemilahan) ? null : 'assets/icons/medal_active.png',
                    inactiveAsset: (role == UserRole.mahasiswaKkn || role == UserRole.petugasPemilahan) ? null : 'assets/icons/medal.png',
                  ),
                  _navItem(
                    4,
                    Icons.person_rounded,
                    Icons.person_outline_rounded,
                    role == UserRole.petugasPemilahan ? 'Profil' : 'Profile',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData? active, IconData? inactive, String label, {String? activeAsset, String? inactiveAsset}) {
    final bool sel = _selectedIndex == index;
    return InkWell(
      onTap: () => _onTabTap(index),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (activeAsset != null && inactiveAsset != null)
              Image.asset(
                sel ? activeAsset : inactiveAsset,
                color: sel ? AppColors.primaryGreen : AppColors.textHint,
                width: 22,
                height: 22,
              )
            else if (active != null && inactive != null)
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

  // â”€â”€â”€ Tablet (NavigationRail) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Widget _buildTabletShell(bool isOnline, UserRole role) {
    final screens = _getScreens(role);
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      resizeToAvoidBottomInset: false,
      body: Column(
        children: [

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
                     role == UserRole.petugasPemilahan ? Icons.map_outlined : Icons.stars_outlined),
          selectedIcon: Icon(role == UserRole.mahasiswaKkn ? Icons.analytics_rounded : 
                             role == UserRole.petugasPemilahan ? Icons.map_rounded : Icons.stars_rounded),
          label: Text(role == UserRole.mahasiswaKkn ? 'Monitoring' : 
                      role == UserRole.petugasPemilahan ? 'Peta' : 'Poin'),
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



