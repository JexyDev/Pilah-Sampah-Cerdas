import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_app_sampah/app/core/utils/hidden_history_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('HiddenHistoryService Tests', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      await HiddenHistoryService.ensureInitialized();
    });

    test('Default: item riwayat terlihat jika belum dibersihkan', () {
      final isVis = HiddenHistoryService.isVisibleSync(
        scope: HiddenHistoryService.scopeWargaWaste,
        id: 'item-1',
        createdAt: DateTime.now(),
      );
      expect(isVis, isTrue);
    });

    test('clearDisplay: menyembunyikan item sebelum waktu pembersihan', () async {
      final pastDate = DateTime.now().subtract(const Duration(minutes: 5));
      final futureDate = DateTime.now().add(const Duration(minutes: 5));

      await HiddenHistoryService.clearDisplay(HiddenHistoryService.scopeWargaWaste);

      final isPastVis = HiddenHistoryService.isVisibleSync(
        scope: HiddenHistoryService.scopeWargaWaste,
        id: 'item-old',
        createdAt: pastDate,
      );
      final isFutureVis = HiddenHistoryService.isVisibleSync(
        scope: HiddenHistoryService.scopeWargaWaste,
        id: 'item-new',
        createdAt: futureDate,
      );

      expect(isPastVis, isFalse);
      expect(isFutureVis, isTrue);
      expect(HiddenHistoryService.hasHiddenItemsSync(HiddenHistoryService.scopeWargaWaste), isTrue);
    });

    test('restoreDisplay: memulihkan kembali seluruh item yang disembunyikan', () async {
      final pastDate = DateTime.now().subtract(const Duration(minutes: 5));

      await HiddenHistoryService.clearDisplay(HiddenHistoryService.scopeWargaWaste);
      expect(
        HiddenHistoryService.isVisibleSync(
          scope: HiddenHistoryService.scopeWargaWaste,
          id: 'item-old',
          createdAt: pastDate,
        ),
        isFalse,
      );

      await HiddenHistoryService.restoreDisplay(HiddenHistoryService.scopeWargaWaste);

      expect(
        HiddenHistoryService.isVisibleSync(
          scope: HiddenHistoryService.scopeWargaWaste,
          id: 'item-old',
          createdAt: pastDate,
        ),
        isTrue,
      );
      expect(HiddenHistoryService.hasHiddenItemsSync(HiddenHistoryService.scopeWargaWaste), isFalse);
    });

    test('hideItem: menyembunyikan satu item spesifik berdasarkan ID', () async {
      await HiddenHistoryService.hideItem(HiddenHistoryService.scopeWargaPoints, 'target-id');

      final isTargetVis = HiddenHistoryService.isVisibleSync(
        scope: HiddenHistoryService.scopeWargaPoints,
        id: 'target-id',
        createdAt: DateTime.now(),
      );
      final isOtherVis = HiddenHistoryService.isVisibleSync(
        scope: HiddenHistoryService.scopeWargaPoints,
        id: 'other-id',
        createdAt: DateTime.now(),
      );
      expect(isTargetVis, isFalse);
      expect(isOtherVis, isTrue);
    });

    test('clearDisplay with currentItemIds: menyembunyikan item ID eksplisit terlepas dari timezone', () async {
      await HiddenHistoryService.clearDisplay(
        HiddenHistoryService.scopeWargaPoints,
        currentItemIds: ['point-1', 'point-2'],
      );

      final isPoint1Vis = HiddenHistoryService.isVisibleSync(
        scope: HiddenHistoryService.scopeWargaPoints,
        id: 'point-1',
      );
      final isPoint2Vis = HiddenHistoryService.isVisibleSync(
        scope: HiddenHistoryService.scopeWargaPoints,
        id: 'point-2',
      );
      final isPointNewVis = HiddenHistoryService.isVisibleSync(
        scope: HiddenHistoryService.scopeWargaPoints,
        id: 'point-new',
        createdAt: DateTime.now().add(const Duration(minutes: 10)),
      );

      expect(isPoint1Vis, isFalse);
      expect(isPoint2Vis, isFalse);
      expect(isPointNewVis, isTrue);
    });

    test('mapScopeToItemType: memetakan seluruh scope dengan tepat ke tabel backend', () {
      expect(HiddenHistoryService.mapScopeToItemType(HiddenHistoryService.scopeWargaPoints), 'POINT');
      expect(HiddenHistoryService.mapScopeToItemType(HiddenHistoryService.scopeMahasiswaPoints), 'POINT');
      expect(HiddenHistoryService.mapScopeToItemType(HiddenHistoryService.scopePetugasPoints), 'POINT');
      expect(HiddenHistoryService.mapScopeToItemType(HiddenHistoryService.scopeWargaWaste), 'WASTE_DEPOSIT');
      expect(HiddenHistoryService.mapScopeToItemType(HiddenHistoryService.scopeMahasiswaKkn), 'KKN_ACTIVITY');
      expect(HiddenHistoryService.mapScopeToItemType(HiddenHistoryService.scopePetugasTasks), 'PETUGAS_TASK');
      expect(HiddenHistoryService.mapScopeToItemType('unknown'), isNull);
    });

    test('hideItems: menyembunyikan kumpulan item (multi-select) sekaligus', () async {
      await HiddenHistoryService.hideItems(
        HiddenHistoryService.scopeMahasiswaKkn,
        ['kkn-1', 'kkn-2', 'kkn-3'],
      );

      expect(HiddenHistoryService.isVisibleSync(scope: HiddenHistoryService.scopeMahasiswaKkn, id: 'kkn-1'), isFalse);
      expect(HiddenHistoryService.isVisibleSync(scope: HiddenHistoryService.scopeMahasiswaKkn, id: 'kkn-2'), isFalse);
      expect(HiddenHistoryService.isVisibleSync(scope: HiddenHistoryService.scopeMahasiswaKkn, id: 'kkn-3'), isFalse);
      expect(HiddenHistoryService.isVisibleSync(scope: HiddenHistoryService.scopeMahasiswaKkn, id: 'kkn-4'), isTrue);
    });

    test('resetSession: mengosongkan seluruh memori dan preferensi saat logout', () async {
      await HiddenHistoryService.clearDisplay(HiddenHistoryService.scopeMahasiswaKkn);
      await HiddenHistoryService.hideItem(HiddenHistoryService.scopeWargaPoints, 'p-1');

      expect(HiddenHistoryService.hasHiddenItemsSync(HiddenHistoryService.scopeMahasiswaKkn), isTrue);
      expect(HiddenHistoryService.isVisibleSync(scope: HiddenHistoryService.scopeWargaPoints, id: 'p-1'), isFalse);

      await HiddenHistoryService.resetSession();

      expect(HiddenHistoryService.hasHiddenItemsSync(HiddenHistoryService.scopeMahasiswaKkn), isFalse);
      expect(HiddenHistoryService.isVisibleSync(scope: HiddenHistoryService.scopeWargaPoints, id: 'p-1'), isTrue);
    });
  });
}
