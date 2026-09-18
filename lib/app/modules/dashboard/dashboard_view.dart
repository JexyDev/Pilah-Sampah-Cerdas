import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
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
import '../../core/widgets/curved_text.dart';
import 'package:animated_bottom_navigation_bar/animated_bottom_navigation_bar.dart';

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
    role == UserRole.petugasPemilahan
        ? const PetugasPemilahanProfilView()
        : const ProfilView(),
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
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Internet kembali pulih'),
            backgroundColor: AppColors.primaryGreen,
            duration: Duration(seconds: 3),
          ),
        );
      } else if (prev == true && next == false) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
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
    final bool showFab =
        role == UserRole.warga ||
        role == UserRole.petugasPemilahan ||
        role == UserRole.mahasiswaKkn;
    return Scaffold(
      backgroundColor: AppColors.backgroundCanvas,
      resizeToAvoidBottomInset: false,
      body: Column(children: [Expanded(child: screens[_selectedIndex])]),
      bottomNavigationBar: _buildBottomBar(role),
      floatingActionButton: showFab ? _buildFab(isOnline, role) : null,
      floatingActionButtonLocation: showFab
          ? const _LoweredCenterDockedLocation()
          : null,
    );
  }

  Widget _buildFab(bool isOnline, UserRole role) {
    final fabColor = (role == UserRole.petugasPemilahan)
        ? AppColors.residuColor
        : AppColors.primaryGreen;

    final fabWidget = Container(
      width: 68,
      height: 68,
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
                    Navigator.pushNamed(
                      context,
                      AppRoutes.monitoringWarga,
                      arguments: 'aktivasi_bin',
                    );
                  } else {
                    ScanGuard.handleScanNavigation(context, ref);
                  }
                }
              : null,
          child: role == UserRole.petugasPemilahan
              ? const Icon(Icons.scale_rounded, color: Colors.white, size: 26)
              : Padding(
                  padding: const EdgeInsets.all(10.0),
                  child: SvgPicture.asset(
                    'assets/logo_aisah/SVG/AISAH-logo-white.svg',
                    width: 32,
                    height: 32,
                  ),
                ),
        ),
      ),
    );

    if (role == UserRole.petugasPemilahan) {
      return fabWidget;
    }

    return SizedBox(
      width: 68,
      height: 68,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          fabWidget,
          const Positioned(
            top: -10,
            left: -20,
            right: -20,
            child: CurvedText(
              text: 'Pindai Sampah',
              radius: 50,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                shadows: [
                  Shadow(color: Colors.white, blurRadius: 4),
                  Shadow(color: Colors.white, blurRadius: 8),
                  Shadow(color: Colors.white, blurRadius: 12),
                ],
              ),
            ),
          ),
          const Positioned(
            bottom: -20,
            left: -20,
            right: -20,
            child: Text(
              'AISAh',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                shadows: [
                  Shadow(color: Colors.white, blurRadius: 4),
                  Shadow(color: Colors.white, blurRadius: 8),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(UserRole role) {
    final bool isPetugas = role == UserRole.petugasPemilahan;
    final bool hasFab = role == UserRole.warga || isPetugas || role == UserRole.mahasiswaKkn;

    // Definisikan item-item bottom nav sesuai role
    final List<Map<String, dynamic>> navItems = [
      {
        'active': Icons.home_rounded,
        'inactive': Icons.home_outlined,
        'label': 'Beranda',
      },
      {
        'active': Icons.history_rounded,
        'inactive': Icons.history_outlined,
        'label': 'Riwayat',
      },
      // Note: Index 2 is skipped by AnimatedBottomNavigationBar if GapLocation.center is used.
      // We map builder indices: 0 -> 0, 1 -> 1, 2 -> 3, 3 -> 4
      {
        'active': isPetugas ? Icons.monetization_on_rounded : null,
        'inactive': isPetugas ? Icons.monetization_on_outlined : null,
        'label': 'Poin',
        'activeAsset': isPetugas ? null : 'assets/icons/medal_active.png',
        'inactiveAsset': isPetugas ? null : 'assets/icons/medal.png',
      },
      {
        'active': Icons.person_rounded,
        'inactive': Icons.person_outline_rounded,
        'label': 'Profil',
      },
    ];

    return AnimatedBottomNavigationBar.builder(
      itemCount: 4,
      tabBuilder: (int index, bool isActive) {
        final item = navItems[index];
        // Map builder index to actual screen index:
        // Builder index 0,1 -> Screen index 0,1
        // Builder index 2,3 -> Screen index 3,4
        final actualIndex = index < 2 ? index : index + 1;
        
        return _navItem(
          actualIndex,
          item['active'] as IconData?,
          item['inactive'] as IconData?,
          item['label'] as String,
          activeAsset: item['activeAsset'] as String?,
          inactiveAsset: item['inactiveAsset'] as String?,
        );
      },
      activeIndex: _selectedIndex < 2 ? _selectedIndex : _selectedIndex - 1,
      gapLocation: hasFab ? GapLocation.center : GapLocation.none,
      notchSmoothness: NotchSmoothness.softEdge,
      leftCornerRadius: 0,
      rightCornerRadius: 0,
      onTap: (index) {
        final actualIndex = index < 2 ? index : index + 1;
        _onTabTap(actualIndex);
      },
      backgroundColor: Colors.white,
      elevation: 8,
      height: AppDimensions.bottomNavHeight,
    );
  }

  Widget _navItem(
    int index,
    IconData? active,
    IconData? inactive,
    String label, {
    String? activeAsset,
    String? inactiveAsset,
  }) {
    final bool sel = _selectedIndex == index;
    return InkWell(
      onTap: () => _onTabTap(index),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (activeAsset != null && inactiveAsset != null)
              Image.asset(
                sel ? activeAsset : inactiveAsset,
                color: sel ? AppColors.primaryGreen : AppColors.textHint,
                width: 20,
                height: 20,
              )
            else if (active != null && inactive != null)
              Icon(
                sel ? active : inactive,
                color: sel ? AppColors.primaryGreen : AppColors.textHint,
                size: 20,
              ),
            const SizedBox(height: 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                maxLines: 1,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: sel ? FontWeight.w600 : FontWeight.w400,
                  color: sel ? AppColors.primaryGreen : AppColors.textHint,
                ),
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
          icon: Icon(
            role == UserRole.petugasPemilahan
                ? Icons.map_outlined
                : Icons.stars_outlined,
          ),
          selectedIcon: Icon(
            role == UserRole.petugasPemilahan
                ? Icons.map_rounded
                : Icons.stars_rounded,
          ),
          label: Text(role == UserRole.petugasPemilahan ? 'Peta' : 'Poin'),
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

class _LoweredCenterDockedLocation extends FloatingActionButtonLocation {
  const _LoweredCenterDockedLocation();

  @override
  Offset getOffset(ScaffoldPrelayoutGeometry scaffoldGeometry) {
    final Offset centerDockedOffset = FloatingActionButtonLocation.centerDocked
        .getOffset(scaffoldGeometry);
    // Geser ke bawah 12px agar lebih tenggelam ke dalam bottom bar
    return centerDockedOffset.translate(0, 12);
  }
}
