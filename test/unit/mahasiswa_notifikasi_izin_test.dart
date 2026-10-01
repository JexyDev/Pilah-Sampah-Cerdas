import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app_sampah/app/data/models/user_entity.dart';
import 'package:mobile_app_sampah/app/data/repositories/kkn_repository.dart';
import 'package:mobile_app_sampah/app/data/providers/repository_providers.dart';
import 'package:mobile_app_sampah/app/data/services/local_notification_cache_service.dart';
import 'package:mobile_app_sampah/app/modules/auth/controllers/auth_controller.dart';
import 'package:mobile_app_sampah/app/modules/mahasiswa/controllers/mahasiswa_notifikasi_controller.dart';

class FakeKknRepository extends Fake implements KknRepository {
  List<dynamic> mockIzinList = [];

  @override
  Future<List<dynamic>> getPengajuanIzin() async => mockIzinList;

  @override
  Future<List<Map<String, dynamic>>> getProgramKerja() async => [];
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
    id: 'mhs-123',
    name: 'Mahasiswa Test',
    role: UserRole.mahasiswaKkn,
  );

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    LocalNotificationCacheService().clear();
    fakeKknRepo = FakeKknRepository();
  });

  test('Notifikasi pengajuan SAKIT menampilkan judul dan deskripsi yang tepat', () async {
    fakeKknRepo.mockIzinList = [
      {
        'id': 'izin-1',
        'status': 'PENDING',
        'kategori': 'SAKIT',
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

    final notifications = await container.read(mahasiswaNotificationsProvider.future);

    expect(notifications.length, 1);
    final notif = notifications.first;
    expect(notif.title, 'Pengajuan Sakit Dikirim');
    expect(notif.desc, 'Pengajuan Sakit Anda telah terkirim dan menunggu verifikasi DPL.');
    expect(notif.type, 'IZIN');
  });

  test('LocalNotificationCacheService duplikasi IZIN_DIAJUKAN ditekan jika data server ada', () async {
    fakeKknRepo.mockIzinList = [
      {
        'id': 'izin-1',
        'status': 'PENDING',
        'kategori': 'SAKIT',
        'createdAt': DateTime.now().toIso8601String(),
      }
    ];

    // Simulasikan notifikasi lokal lama yang tersimpan di cache
    LocalNotificationCacheService().addNotification(
      userId: testUser.id,
      role: testUser.role.name,
      title: 'Pengajuan Sakit Terkirim ⏳',
      desc: 'Pengajuan Sakit sedang menunggu verifikasi DPL.',
      type: 'IZIN_DIAJUKAN',
      id: 'local_izin_12345678',
    );

    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith((ref) => FakeAuthNotifier(testUser)),
        kknRepositoryProvider.overrideWithValue(fakeKknRepo),
      ],
    );
    addTearDown(container.dispose);

    final notifications = await container.read(mahasiswaNotificationsProvider.future);

    // Harus tetap 1 (tidak boleh ada 2 notifikasi duplikat)
    expect(notifications.length, 1);
    expect(notifications.first.title, 'Pengajuan Sakit Dikirim');
    expect(notifications.first.id, 'izin_pending_izin-1');
  });
}
