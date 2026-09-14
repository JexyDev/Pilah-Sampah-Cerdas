import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app_sampah/app/data/models/user_entity.dart';
import 'package:mobile_app_sampah/app/data/models/bin_entity.dart';
import 'package:mobile_app_sampah/app/data/models/waste_log_entity.dart';
import 'package:mobile_app_sampah/app/modules/auth/controllers/auth_controller.dart';
import 'package:mobile_app_sampah/app/modules/dashboard/dashboard_view.dart';
import 'package:mobile_app_sampah/app/modules/scan/controllers/scan_controller.dart';
import 'package:mobile_app_sampah/app/modules/riwayat/controllers/riwayat_controller.dart';
import 'package:mobile_app_sampah/app/modules/shared/controllers/connectivity_controller.dart';
import 'package:mobile_app_sampah/app/modules/notifikasi/controllers/warga_notifikasi_controller.dart';
import 'package:mobile_app_sampah/app/modules/shared/controllers/user_location_controller.dart';

void main() {
  testWidgets('New registered user on BerandaView', (tester) async {
    const newUser = UserEntity(
      id: 'test-user-id',
      name: 'User Baru',
      role: UserRole.warga,
      lifecycleState: WargaLifecycle.registered,
      householdId: null,
      rw: '',
      kelurahan: '',
      kecamatan: '',
      kota: '',
      provinsi: '',
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => MockAuthNotifier(newUser)),
          totalPointsProvider.overrideWith((ref) => Future.value(0)),
          dailyPointsProvider.overrideWith((ref) => Future.value(0)),
          userLeaderboardRankProvider.overrideWith((ref) => Future.value('-')),
          binsProvider.overrideWith((ref) => Future.value(<BinEntity>[])),
          wasteLogsProvider.overrideWith(() => MockWasteLogsNotifier()),
          isOnlineProvider.overrideWith((ref) => true),
          wargaUnreadNotificationCountProvider.overrideWith((ref) => 0),
          userLocationProvider.overrideWith((ref) => MockUserLocationNotifier()),
        ],
        child: const MaterialApp(
          home: DashboardView(),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('User Baru'), findsOneWidget);
    expect(find.text('Belum Bergabung Komunitas'), findsOneWidget);
    expect(find.text('Gabung Komunitas Berseka'), findsOneWidget);
    expect(find.text('Tempat Sampah Belum Terpasang'), findsNothing);
    expect(find.text('Aksi Cepat'), findsNothing);
  });

  testWidgets('New user without role (unknown) on BerandaView', (tester) async {
    const unassignedUser = UserEntity(
      id: 'test-user-id-2',
      name: 'User Tanpa Role',
      role: UserRole.unknown,
      lifecycleState: WargaLifecycle.registered,
      householdId: null,
      rw: '',
      kelurahan: '',
      kecamatan: '',
      kota: '',
      provinsi: '',
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => MockAuthNotifier(unassignedUser)),
          totalPointsProvider.overrideWith((ref) => Future.value(0)),
          dailyPointsProvider.overrideWith((ref) => Future.value(0)),
          userLeaderboardRankProvider.overrideWith((ref) => Future.value('-')),
          binsProvider.overrideWith((ref) => Future.value(<BinEntity>[])),
          wasteLogsProvider.overrideWith(() => MockWasteLogsNotifier()),
          isOnlineProvider.overrideWith((ref) => true),
          wargaUnreadNotificationCountProvider.overrideWith((ref) => 0),
          userLocationProvider.overrideWith((ref) => MockUserLocationNotifier()),
        ],
        child: const MaterialApp(
          home: DashboardView(),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('User Tanpa Role'), findsOneWidget);
    expect(find.text('Belum Bergabung Komunitas'), findsOneWidget);
    expect(find.text('Gabung Komunitas Berseka'), findsOneWidget);
    expect(find.text('Tempat Sampah Belum Terpasang'), findsNothing);
    expect(find.text('Aksi Cepat'), findsNothing);
  });
}

class MockAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  MockAuthNotifier(UserEntity user) : super(AuthState(user: user));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockWasteLogsNotifier extends WasteLogsNotifier {
  @override
  Future<List<WasteLogEntity>> build() async => [];
}

class MockUserLocationNotifier extends StateNotifier<UserLocationState>
    implements UserLocationNotifier {
  MockUserLocationNotifier() : super(const UserLocationState());

  @override
  Future<void> refreshLocation({BuildContext? context, String? role}) async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
