import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/values/app_colors.dart';
import '../timbangan_residu_view.dart';
import 'petugas_residu_dashboard_view.dart';
import 'petugas_residu_poin_view.dart';
import 'petugas_residu_profil_view.dart';

class PetugasResiduMainNavigationView extends ConsumerStatefulWidget {
  const PetugasResiduMainNavigationView({super.key});

  @override
  ConsumerState<PetugasResiduMainNavigationView> createState() =>
      _PetugasResiduMainNavigationViewState();
}

class _PetugasResiduMainNavigationViewState
    extends ConsumerState<PetugasResiduMainNavigationView> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    PetugasResiduDashboardView(),
    TimbanganResiduView(),
    PetugasResiduPoinView(),
    PetugasResiduProfilView(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.primaryGreen,
          unselectedItemColor: AppColors.textHint,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_rounded),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Beranda',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.scale_outlined),
              activeIcon: Icon(Icons.scale_rounded),
              label: 'Timbangan',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.monetization_on_outlined),
              activeIcon: Icon(Icons.monetization_on_rounded),
              label: 'Poin',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }
}
