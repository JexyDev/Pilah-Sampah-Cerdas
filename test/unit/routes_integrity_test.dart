import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app_sampah/app/routes/app_pages.dart';
import 'package:mobile_app_sampah/app/routes/app_routes.dart';

void main() {
  test('All AppRoutes generate valid routes in AppPages without 404', () {
    final routesToTest = [
      AppRoutes.splash,
      AppRoutes.onboarding,
      AppRoutes.login,
      AppRoutes.forceChangePassword,
      AppRoutes.register,
      AppRoutes.forgotPassword,
      AppRoutes.dashboard,
      AppRoutes.pengajuanProgramKerja,
      AppRoutes.riwayatProgramKerja,
      AppRoutes.riwayatPemanfaatan,
      AppRoutes.logbookPemanfaatan,
      AppRoutes.catatPanen,
      AppRoutes.scan,
      AppRoutes.scanTrial,
      AppRoutes.aktivasiBin,
      AppRoutes.ukurKapasitas,
      AppRoutes.kelolaBin,
      AppRoutes.resetBin,
      AppRoutes.notifikasi,
      AppRoutes.detailNotifikasi,
      AppRoutes.mahasiswaNotifikasi,
      AppRoutes.petugasNotifikasi,
      AppRoutes.timbanganPemilahan,
      AppRoutes.tentang,
      AppRoutes.kknAttendance,
      AppRoutes.kknAttendanceHistory,
      AppRoutes.monitoringWarga,
      AppRoutes.mahasiswa,
      AppRoutes.kelompokKkn,
      AppRoutes.daftarWarga,
      AppRoutes.detailWarga,
      AppRoutes.aktivasiWarga,
      AppRoutes.aspirasiWarga,
      AppRoutes.wargaGantiPassword,
      AppRoutes.pemanfaatanSampah,
      AppRoutes.editProfilMahasiswa,
      AppRoutes.pengajuanIzin,
      AppRoutes.petugasPemilahan,
      AppRoutes.riwayatPetugasPemilahan,
      AppRoutes.petugasPemilahanGantiPassword,
      AppRoutes.pengajuanWarga,
      AppRoutes.aktivasiTempatSampahKomunal,
      AppRoutes.monitoringDampakKelurahan,
      AppRoutes.registerPosko,
      AppRoutes.registerFasilitas,
      AppRoutes.inputLaporanAkhir,
      AppRoutes.inputLogbookKkn,
      AppRoutes.riwayatKkn,
      AppRoutes.poin,
      AppRoutes.dataLogbookHarian,
      AppRoutes.editLogbookKkn,
      AppRoutes.dataProker,
      AppRoutes.editProgramKerja,
      AppRoutes.prokerDetail,
      AppRoutes.manajemenTempatSampah,
      AppRoutes.komunitasOnboarding,
    ];

    for (final routeName in routesToTest) {
      final route = AppPages.generateRoute(RouteSettings(name: routeName));
      expect(route, isA<MaterialPageRoute>());
      final materialRoute = route as MaterialPageRoute;
      final widget = materialRoute.builder(
        // Dummy context
        _FakeBuildContext(),
      );
      // Ensure the generated widget is NOT _NotFoundScreen
      expect(
        widget.runtimeType.toString(),
        isNot('_NotFoundScreen'),
        reason: 'Route $routeName generated _NotFoundScreen!',
      );
    }
  });
}

class _FakeBuildContext extends Fake implements BuildContext {}
