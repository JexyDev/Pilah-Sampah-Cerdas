import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app_sampah/app/data/models/user_entity.dart';
import 'package:mobile_app_sampah/app/data/repositories/kkn_repository.dart';
import 'package:mobile_app_sampah/app/data/providers/repository_providers.dart';
import 'package:mobile_app_sampah/app/data/services/local_notification_cache_service.dart';
import 'package:mobile_app_sampah/app/modules/auth/controllers/auth_controller.dart';
import 'package:mobile_app_sampah/app/modules/mahasiswa/controllers/mahasiswa_notifikasi_controller.dart';

import 'package:mobile_app_sampah/app/data/models/notification_entity.dart';
import 'package:mobile_app_sampah/app/data/repositories/notification_repository.dart';

class FakeKknRepository extends Fake implements KknRepository {
  List<dynamic> mockIzinList = [];

  @override
  Future<List<dynamic>> getPengajuanIzin() async => mockIzinList;

  @override
  Future<List<Map<String, dynamic>>> getProgramKerja() async => [];
}

class FakeNotificationRepository extends Fake implements NotificationRepository {
  List<NotificationEntity> mockNotifications = [];

  @override
  Future<List<NotificationEntity>> getNotifications() async => mockNotifications;
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
  late FakeNotificationRepository fakeNotifRepo;
  const testUser = UserEntity(
    id: 'mhs-123',
    name: 'Mahasiswa Test',
    role: UserRole.mahasiswaKkn,
  );

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    LocalNotificationCacheService().clear();
    fakeKknRepo = FakeKknRepository();
    fakeNotifRepo = FakeNotificationRepository();
  });

  test('Notifikasi pengajuan SAKIT menampilkan judul dan deskripsi yang tepat', () async {
    fakeNotifRepo.mockNotifications = [
      NotificationEntity(
        id: 'izin_pending_izin-1',
        title: 'Pengajuan Sakit Dikirim',
        desc: 'Pengajuan Sakit Anda telah terkirim dan menunggu verifikasi DPL.',
        time: '2026-10-05 10:00',
        type: 'IZIN',
        isRead: false,
        icon: 'info',
        createdAt: DateTime.parse('2026-10-05T10:00:00Z'),
      ),
    ];

    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith((ref) => FakeAuthNotifier(testUser)),
        kknRepositoryProvider.overrideWithValue(fakeKknRepo),
        notificationRepositoryProvider.overrideWithValue(fakeNotifRepo),
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
    fakeNotifRepo.mockNotifications = [
      NotificationEntity(
        id: 'izin_pending_izin-1',
        title: 'Pengajuan Sakit Terkirim ⏳',
        desc: 'Pengajuan Sakit sedang menunggu verifikasi DPL.',
        time: '2026-10-05 10:00',
        type: 'IZIN',
        isRead: false,
        icon: 'info',
        createdAt: DateTime.parse('2026-10-05T10:00:00Z'),
      ),
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
        notificationRepositoryProvider.overrideWithValue(fakeNotifRepo),
      ],
    );
    addTearDown(container.dispose);

    final notifications = await container.read(mahasiswaNotificationsProvider.future);

    // Harus tetap 1 (tidak boleh ada 2 notifikasi duplikat)
    expect(notifications.length, 1);
    expect(notifications.first.title, 'Pengajuan Sakit Terkirim ⏳');
  });
}
