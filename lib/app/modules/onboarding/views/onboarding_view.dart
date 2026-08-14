import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../routes/app_routes.dart';
import '../../auth/controllers/auth_controller.dart';
import '../../../data/models/user_entity.dart';
import '../../../core/values/app_colors.dart';

class OnboardingSlide {
  final String title;
  final String description;
  final Widget mockupWidget;

  OnboardingSlide({
    required this.title,
    required this.description,
    required this.mockupWidget,
  });
}

class OnboardingView extends ConsumerStatefulWidget {
  const OnboardingView({super.key});

  @override
  ConsumerState<OnboardingView> createState() => _OnboardingViewState();
}

class _OnboardingViewState extends ConsumerState<OnboardingView> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // --- MOCKUP BUILDERS ---
  
  Widget _buildMockContainer(Widget child) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double containerWidth = constraints.maxWidth > 250 ? 250 : constraints.maxWidth * 0.85;
        return Container(
          width: containerWidth,
          height: 240,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: child,
        );
      },
    );
  }

  // Warga Mocks
  Widget _buildWargaHomeMock() {
    return _buildMockContainer(
      Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('Tempat Sampahku', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildMiniBin(Icons.eco_rounded, AppColors.primaryGreen, 'Organik', '25%'),
              const SizedBox(width: 16),
              _buildMiniBin(Icons.category_rounded, AppColors.nonOrganicColor, 'Anorganik', '40%'),
            ],
          ),
        ],
      )
    );
  }

  Widget _buildMiniBin(IconData icon, Color color, String label, String volume) {
    return Container(
      width: 80, height: 110,
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.5))),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center, 
        children: [
          Icon(icon, color: color, size: 32), 
          const SizedBox(height: 8), 
          Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(8)),
            child: Text(volume, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
          )
        ]
      ),
    );
  }

  Widget _buildWargaScanMock() {
    return _buildMockContainer(
      Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: double.infinity, height: double.infinity,
            decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(14)),
            child: const Icon(Icons.qr_code_scanner_rounded, color: Colors.grey, size: 80),
          ),
          Container(
            width: 140, height: 140,
            decoration: BoxDecoration(border: Border.all(color: AppColors.primaryGreen, width: 4), borderRadius: BorderRadius.circular(12)),
          ),
          Positioned(
            bottom: 30, 
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), 
              decoration: BoxDecoration(color: AppColors.primaryGreen, borderRadius: BorderRadius.circular(16)), 
              child: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text('Organik Terdeteksi', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              )
            )
          )
        ],
      )
    );
  }

  Widget _buildWargaPoinMock() {
    return _buildMockContainer(
      Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.2), shape: BoxShape.circle),
            child: const Icon(Icons.workspace_premium_rounded, color: Colors.amber, size: 64),
          ),
          const SizedBox(height: 16),
          const Text('+150 Poin', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primaryGreen)),
          const SizedBox(height: 8),
          const Text('Scan Berhasil!', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
        ],
      )
    );
  }

  // Mahasiswa Mocks
  Widget _buildMahasiswaDaftarMock() {
    return _buildMockContainer(
      Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Warga Binaan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            _buildListTileMock('Budi Santoso', 'Belum Aktif', Colors.red),
            const SizedBox(height: 8),
            _buildListTileMock('Siti Aminah', 'Aktif', AppColors.primaryGreen),
            const SizedBox(height: 8),
            _buildListTileMock('Agus Pratama', 'Belum Aktif', Colors.red),
          ],
        ),
      )
    );
  }

  Widget _buildListTileMock(String name, String status, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)),
      child: Row(
        children: [
          CircleAvatar(radius: 12, backgroundColor: AppColors.primaryGreen.withValues(alpha: 0.2), child: const Icon(Icons.person, size: 14, color: AppColors.primaryGreen)),
          const SizedBox(width: 8),
          Expanded(child: Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
          Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)), child: Text(status, style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }

  Widget _buildMahasiswaPresensiMock() {
    return _buildMockContainer(
      Stack(
        alignment: Alignment.center,
        children: [
          Container(
            decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(14)),
            child: Center(child: Icon(Icons.map_rounded, color: Colors.blue.withValues(alpha: 0.2), size: 120)),
          ),
          const Icon(Icons.location_on_rounded, color: Colors.red, size: 48),
          Positioned(
            bottom: 20,
            child: ElevatedButton(
              onPressed: (){},
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              child: const Text('Presensi Masuk Posko', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          )
        ],
      )
    );
  }

  Widget _buildPetugasTungguMock() {
    return _buildMockContainer(
      Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.stars_rounded, color: AppColors.primaryBlue, size: 80),
          const SizedBox(height: 16),
          const Text('Skor KPI', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: AppColors.primaryBlue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.primaryBlue)),
            child: const Text('SANGAT BAIK - 93,8', style: TextStyle(color: AppColors.primaryBlue, fontSize: 12, fontWeight: FontWeight.bold)),
          )
        ],
      )
    );
  }

  Widget _buildPetugasTitikMock() {
    return _buildMockContainer(
      Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Jadwal Hari Ini', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            _buildTitikCard('RT 01 / RW 05', 'Volume Tinggi', Colors.red),
            const SizedBox(height: 8),
            _buildTitikCard('RT 02 / RW 05', 'Normal', AppColors.primaryGreen),
          ],
        ),
      )
    );
  }

  Widget _buildTitikCard(String title, String tag, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)), child: Text(tag, style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 4),
          const Row(children: [Icon(Icons.location_on, size: 10, color: Colors.grey), SizedBox(width: 4), Text('Lihat di Peta', style: TextStyle(fontSize: 10, color: Colors.grey))])
        ],
      ),
    );
  }

  Widget _buildPetugasTimbangMock() {
    return _buildMockContainer(
      Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.scale_rounded, color: AppColors.primaryGreen, size: 48),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.border)),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('4,5', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  SizedBox(width: 8),
                  Text('kg', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(color: AppColors.primaryGreen, borderRadius: BorderRadius.circular(8)),
              child: const Center(child: Text('KIRIM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
            )
          ],
        ),
      )
    );
  }


  List<OnboardingSlide> _getSlides(UserRole? role) {
    if (role == UserRole.mahasiswaKkn) {
      return [
        OnboardingSlide(
          title: 'Selamat Bertugas, Agen Perubahan!',
          description: 'Tugas Anda adalah memberdayakan warga. Buka Dasbor KKN, cari target warga binaan yang belum diaktivasi, dan datangi rumah mereka.',
          mockupWidget: _buildMahasiswaDaftarMock(),
        ),
        OnboardingSlide(
          title: 'Aktivasi & Edukasi',
          description: 'Pilih nama warga, lalu lakukan pemindaian kode QR pada tempat sampah mereka untuk melakukan aktivasi ke akun Warga.',
          mockupWidget: _buildWargaScanMock(),
        ),
        OnboardingSlide(
          title: 'Presensi & Laporan Praktis',
          description: 'Sistem akan mendeteksi koordinat GPS Anda. Lakukan presensi di lokasi Posko dan kirim laporan ke DPL.',
          mockupWidget: _buildMahasiswaPresensiMock(),
        ),
      ];
    } else if (role == UserRole.petugasPemilahan) {
      return [
        OnboardingSlide(
          title: 'Pantau KPI Kinerja Anda',
          description: 'Sistem menilai kinerja Anda secara otomatis dari ketepatan waktu pengangkutan dan akurasi data. Tingkatkan skor Anda untuk insentif maksimal!',
          mockupWidget: _buildPetugasTungguMock(),
        ),
        OnboardingSlide(
          title: 'Cek Titik Kumpul Harian',
          description: 'Buka Dasbor untuk melihat daftar titik kumpul tempat sampah pemilahan di wilayah penugasan (RT/RW) yang harus ditangani hari ini.',
          mockupWidget: _buildPetugasTitikMock(),
        ),
        OnboardingSlide(
          title: 'Timbang & Dapatkan Poin',
          description: 'Datangi titik kumpul tersebut, timbang fisik sampah pemilahannya (kg), lalu ambil foto bukti. Kirim data dan dapatkan poin insentif!',
          mockupWidget: _buildPetugasTimbangMock(),
        ),
      ];
    } else {
      // Warga
      return [
        OnboardingSlide(
          title: 'Pilah Sampah dari Rumah',
          description: 'Langkah kecil Anda berdampak besar. Mulai pisahkan sampah organik dan anorganik dari rumah Anda sekarang.',
          mockupWidget: _buildWargaHomeMock(),
        ),
        OnboardingSlide(
          title: 'Pindai Menggunakan AI',
          description: 'Buka aplikasi, tekan fitur Pindai AI, lalu ambil foto sampah Anda. Sistem akan mengenalinya secara otomatis.',
          mockupWidget: _buildWargaScanMock(),
        ),
        OnboardingSlide(
          title: 'Kumpulkan Poin & Dapatkan Imbalan!',
          description: 'Setiap sampah yang terpilah dengan benar bernilai poin. Dapatkan imbalan menarik dan tingkatkan kebersihan lingkungan Anda!',
          mockupWidget: _buildWargaPoinMock(),
        ),
      ];
    }
  }

  Future<void> _completeOnboarding() async {
    final user = ref.read(authProvider).user;
    if (user != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isFirstTime_${user.id}', false);
    }
    if (mounted) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.main);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final slides = _getSlides(authState.user?.role);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          fit: StackFit.expand,
          children: [
            Positioned.fill(
              bottom: 100,
              child: PageView.builder(
                controller: _pageController,
                itemCount: slides.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemBuilder: (context, index) {
                  final slide = slides[index];
                  return Padding(
                    padding: const EdgeInsets.all(40.0),
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          slide.mockupWidget,
                          
                          const SizedBox(height: 48),
                          Text(
                            slide.title,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            slide.description,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 16,
                              height: 1.5,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: List.generate(
                        slides.length,
                        (index) => Container(
                          margin: const EdgeInsets.only(right: 8),
                          height: 8,
                          width: _currentPage == index ? 24 : 8,
                          decoration: BoxDecoration(
                            color: _currentPage == index
                                ? AppColors.primaryGreen
                                : AppColors.border,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        if (_currentPage < slides.length - 1) {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        } else {
                          _completeOnboarding();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 16,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: Text(
                        _currentPage == slides.length - 1 ? 'Mulai' : 'Lanjut',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

