import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app_sampah/app/data/models/user_entity.dart';
import 'package:mobile_app_sampah/app/data/repositories/kkn_repository.dart';
import 'package:mobile_app_sampah/app/data/providers/repository_providers.dart';
import 'package:mobile_app_sampah/app/data/services/firebase_notification_service.dart';
import 'package:mobile_app_sampah/app/data/services/local_notification_cache_service.dart';
import 'package:mobile_app_sampah/app/modules/auth/controllers/auth_controller.dart';
import 'package:mobile_app_sampah/app/modules/mahasiswa/controllers/mahasiswa_notifikasi_controller.dart';
import 'package:mobile_app_sampah/app/modules/mahasiswa/controllers/riwayat_kkn_controller.dart';
import 'package:mobile_app_sampah/app/modules/mahasiswa/views/riwayat_kkn_view.dart';

class FakeKknRepository extends Fake implements KknRepository {
  List<Map<String, dynamic>> mockProkerList = [];

  @override
  Future<List<Map<String, dynamic>>> getProgramKerja() async => mockProkerList;

  @override
  Future<List<dynamic>> getPengajuanIzin() async => [];
}

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier(UserEntity user) : super(AuthState(user: user));

  @override
  Future<void> fetchProfile() async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FakeKknRepository fakeKknRepo;
  const testUser = UserEntity(
    id: 'mhs-acef',
    name: 'Acef Testing',
    role: UserRole.mahasiswaKkn,
  );

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    LocalNotificationCacheService().clear();
    fakeKknRepo = FakeKknRepository();
  });

  test('Notifikasi Laporan Akhir diformat judul & deskripsinya dan tidak terduplikasi dari FCM', () async {
    // Simulasikan notifikasi push dari FCM
    await FirebaseNotificationService().saveNotification(
      userId: testUser.id,
      role: testUser.role.name,
      title: 'Pengajuan Program Kerja ✅',
      desc: 'Program [Acef Testing] Isksndkd berhasil diajukan dan sedang direview oleh DPL.',
      type: 'INFO',
      id: 'fcm_1',
    );

    // Simulasikan juga notifikasi kedua (redundan) dengan title & desc sama tapi ID beda
    await FirebaseNotificationService().saveNotification(
      userId: testUser.id,
      role: testUser.role.name,
      title: 'Pengajuan Program Kerja ✅',
      desc: 'Program [Acef Testing] Isksndkd berhasil diajukan dan sedang direview oleh DPL.',
      type: '',
      id: 'fcm_2',
    );

    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith((ref) => FakeAuthNotifier(testUser)),
        kknRepositoryProvider.overrideWithValue(fakeKknRepo),
      ],
    );
    addTearDown(container.dispose);

    final notifications = await container.read(mahasiswaNotificationsProvider.future);

    // Harus berhasil terdeduplikasi menjadi 1 entri saja
    expect(notifications.length, 1);
    final notif = notifications.first;
    expect(notif.title, 'Pengajuan Laporan Akhir ✅');
    expect(
      notif.desc,
      'Laporan Akhir [Acef Testing] Isksndkd berhasil diajukan dan sedang direview oleh DPL.',
    );
  });

  test('RiwayatKknNotifier memasukkan Laporan Akhir sebagai KknHistoryType.laporan', () async {
    fakeKknRepo.mockProkerList = [
      {
        'id': 'laporan-1',
        'judul': '[Acef Testing] Isksndkd',
        'kategori': 'LAPORAN_AKHIR',
        'status': 'BELUM_DISETUJUI',
        'statusUsulan': 'BELUM_DISETUJUI',
        'createdAt': DateTime.now().toIso8601String(),
      }
    ];

    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith((ref) => FakeAuthNotifier(testUser)),
        kknRepositoryProvider.overrideWithValue(fakeKknRepo),
      ],
    );
    addTearDown(container.dispose);

    final notifier = container.read(riwayatKknControllerProvider.notifier);
    await notifier.fetchHistory();

    final logs = container.read(riwayatKknControllerProvider).logs;
    final laporanLogs = logs.where((l) => l.type == KknHistoryType.laporan).toList();

    expect(laporanLogs.length, 1);
    expect(laporanLogs.first.title, '[Acef Testing] Isksndkd');
    expect(laporanLogs.first.subtitle, 'Laporan Akhir Diajukan (Menunggu Review DPL)');
  });
}
