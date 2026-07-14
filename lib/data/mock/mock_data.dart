import '../../domain/entities/user_entity.dart';
import '../../domain/entities/bin_entity.dart';
import '../../domain/entities/waste_log_entity.dart';
import '../../domain/entities/point_history_entity.dart';
import '../../domain/entities/bin_reset_entity.dart';

/// Seluruh data dummy terpusat.
/// Digunakan oleh semua MockRepository selama fase development independen.
class MockData {
  MockData._();

  // ─── USERS ───────────────────────────────────────────────────────────────

  static const UserEntity currentUser = UserEntity(
    id: 'user-habil-001',
    name: 'Muhammad Habil Putrawan',
    nik: '3273012345678901',
    role: UserRole.warga,
    kelurahan: 'Dago',
    rtRw: 'RT 04 / RW 02',
  );

  static const String mockPassword = 'password123';

  // ─── BINS ─────────────────────────────────────────────────────────────────

  static final List<BinEntity> bins = [
    const BinEntity(
      id: 'bin-001',
      qrSerial: 'PSC-DAGO-ORG-0001',
      binType: WasteType.organic,
      currentVolumeL: 8.5,
      maxCapacityL: 25.0,
      lat: -6.9034,
      lng: 107.6198,
      householdName: 'Muhammad Habil Putrawan',
      rt: 'RT 04',
      rw: 'RW 02',
      kelurahan: 'Dago',
      isActive: true,
    ),
    const BinEntity(
      id: 'bin-002',
      qrSerial: 'PSC-DAGO-NON-0001',
      binType: WasteType.nonOrganic,
      currentVolumeL: 23.5,
      maxCapacityL: 25.0,
      lat: -6.9035,
      lng: 107.6199,
      householdName: 'Muhammad Habil Putrawan',
      rt: 'RT 04',
      rw: 'RW 02',
      kelurahan: 'Dago',
      isActive: true,
    ),
  ];

  // ─── WASTE LOGS ───────────────────────────────────────────────────────────

  static final List<WasteLogEntity> wasteLogs = [
    WasteLogEntity(
      id: 'log-001',
      userId: 'user-habil-001',
      binId: 'bin-001',
      wasteType: WasteType.organic,
      volumeLiter: 3.5,
      weightKg: 1.4,
      pointsAwarded: 140,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      binQrSerial: 'PSC-DAGO-ORG-0001',
      kelurahan: 'Dago',
    ),
    WasteLogEntity(
      id: 'log-002',
      userId: 'user-habil-001',
      binId: 'bin-002',
      wasteType: WasteType.nonOrganic,
      volumeLiter: 2.0,
      weightKg: 0.4,
      pointsAwarded: 40,
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      binQrSerial: 'PSC-DAGO-NON-0001',
      kelurahan: 'Dago',
    ),
    WasteLogEntity(
      id: 'log-003',
      userId: 'user-habil-001',
      binId: 'bin-001',
      wasteType: WasteType.organic,
      volumeLiter: 5.0,
      weightKg: 2.0,
      pointsAwarded: 200,
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
      binQrSerial: 'PSC-DAGO-ORG-0001',
      kelurahan: 'Dago',
    ),
    WasteLogEntity(
      id: 'log-004',
      userId: 'user-habil-001',
      binId: 'bin-002',
      wasteType: WasteType.nonOrganic,
      volumeLiter: 3.0,
      weightKg: 0.6,
      pointsAwarded: 60,
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
      binQrSerial: 'PSC-DAGO-NON-0001',
      kelurahan: 'Dago',
    ),
    WasteLogEntity(
      id: 'log-005',
      userId: 'user-habil-001',
      binId: 'bin-001',
      wasteType: WasteType.organic,
      volumeLiter: 4.2,
      weightKg: 1.68,
      pointsAwarded: 168,
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
      binQrSerial: 'PSC-DAGO-ORG-0001',
      kelurahan: 'Dago',
    ),
  ];

  // ─── POINT HISTORY ────────────────────────────────────────────────────────

  static final List<PointHistoryEntity> pointHistory = [
    PointHistoryEntity(
      id: 'ph-001',
      userId: 'user-habil-001',
      points: 140,
      wasteType: WasteType.organic,
      description: 'Setoran sampah organik 1.4 kg',
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    PointHistoryEntity(
      id: 'ph-002',
      userId: 'user-habil-001',
      points: 40,
      wasteType: WasteType.nonOrganic,
      description: 'Setoran sampah anorganik 0.4 kg',
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
    PointHistoryEntity(
      id: 'ph-003',
      userId: 'user-habil-001',
      points: 200,
      wasteType: WasteType.organic,
      description: 'Setoran sampah organik 2.0 kg',
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
    PointHistoryEntity(
      id: 'ph-004',
      userId: 'user-habil-001',
      points: 60,
      wasteType: WasteType.nonOrganic,
      description: 'Setoran sampah anorganik 0.6 kg',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
    ),
    PointHistoryEntity(
      id: 'ph-005',
      userId: 'user-habil-001',
      points: 168,
      wasteType: WasteType.organic,
      description: 'Setoran sampah organik 1.68 kg',
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
    ),
  ];

  /// Total poin yang dihitung dari pointHistory.
  static int get totalPoints =>
      pointHistory.fold(0, (sum, p) => sum + p.points);

  // ─── BIN RESET REQUESTS ───────────────────────────────────────────────────

  static final List<BinResetEntity> resetRequests = [
    BinResetEntity(
      id: 'reset-001',
      binId: 'bin-002',
      userId: 'user-habil-001',
      status: BinResetStatus.pending,
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
    ),
  ];
}
