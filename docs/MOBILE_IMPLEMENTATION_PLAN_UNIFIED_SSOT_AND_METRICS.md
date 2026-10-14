# MOBILE IMPLEMENTATION PLAN: UNIFIED SSOT ARCHITECTURE & RESILIENT METRICS

- Target Project: `mobile` (Flutter 3.22+, Riverpod, Dio HTTP Client)
- Originating Team: BERSEKA Mobile Engineering Team
- Target Path: `docs/MOBILE_IMPLEMENTATION_PLAN_UNIFIED_SSOT_AND_METRICS.md`
- Status: ARCHITECTURAL PLAN & IMPLEMENTATION SPECIFICATION
- Priority: HIGH / RESILIENCE HARDENING

---

## 1. Executive Summary & Objective

### 1.1 Objective
Eliminate mobile app fragility caused by fragmented API calls, Android OS process death, and volatile in-memory states. Adapt the mobile codebase to consume the backend's new **Unified Single Source of Truth (SSOT)** payload delivered on `/auth/login`, `/auth/refresh`, and `/auth/me`.

### 1.2 Core Architectural Principles
1. **Single Source of Truth (SSOT):** `authProvider.user` becomes the sole authoritative source for:
   - Group Leader Authority (`isKetua`)
   - Assigned KKN Territory (`kknTerritory`)
   - Citizen & Bin Summary (`wargaDampinganAggregation`)
   - Daily Presence Minutes (`todayAttendanceSummary`)
   - Active Bin Reset Requests (`activeBinResetRequests`)
2. **Elimination of Fragile Secondary Calls:** Remove sequential UI dependencies where screens wait for `GET /kkn/kelompok/me` just to decide whether to unlock leader buttons.
3. **Strict Demotion of Local Storage:** `SharedPreferences` and `SafeStorage` are demoted strictly to **Read-Only Offline Fallback Caches**. Local storage must never gate authorization or overwrite live server truth with zeros.

---

## 2. Data Model Refactoring (`lib/app/data/models/`)

### 2.1 Update `UserEntity` (`lib/app/data/models/user_entity.dart`)
Extend `UserEntity` to map the unified sub-objects directly from `/auth/me` and `/auth/login`:

```dart
class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    this.isKetua = false,
    this.kknTerritory,
    this.wargaAggregation,
    this.attendanceSummary,
    this.activeResetRequests = const [],
    // ... existing fields
  });

  final String id;
  final String name;
  final String phone;
  final String role;
  final bool isKetua;
  final KknTerritoryEntity? kknTerritory;
  final WargaDampinganAggregation? wargaAggregation;
  final TodayAttendanceSummary? attendanceSummary;
  final List<BinResetSummary> activeResetRequests;

  factory UserEntity.fromJson(Map<String, dynamic> json) {
    return UserEntity(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      isKetua: json['isKetua'] == true,
      kknTerritory: json['kknTerritory'] is Map<String, dynamic>
          ? KknTerritoryEntity.fromJson(json['kknTerritory'] as Map<String, dynamic>)
          : null,
      wargaAggregation: json['wargaDampinganAggregation'] is Map<String, dynamic>
          ? WargaDampinganAggregation.fromJson(json['wargaDampinganAggregation'] as Map<String, dynamic>)
          : null,
      attendanceSummary: json['todayAttendanceSummary'] is Map<String, dynamic>
          ? TodayAttendanceSummary.fromJson(json['todayAttendanceSummary'] as Map<String, dynamic>)
          : null,
      activeResetRequests: (json['activeBinResetRequests'] as List<dynamic>?)
              ?.map((e) => BinResetSummary.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      // ... existing field mapping
    );
  }
}
```

### 2.2 Define New Unified Value Objects (`lib/app/data/models/mahasiswa_kkn_models.dart`)
Add lightweight, immutable entities matching the backend contract:

```dart
class KknTerritoryEntity extends Equatable {
  const KknTerritoryEntity({
    required this.kelompokId,
    required this.kelompokName,
    required this.kecamatan,
    required this.kelurahan,
    required this.cakupanRw,
    this.assignedRw = '',
    this.posko,
    this.dpl,
  });

  final String kelompokId;
  final String kelompokName;
  final String kecamatan;
  final String kelurahan;
  final List<String> cakupanRw;
  final String assignedRw;
  final PoskoSummary? posko;
  final DplSummary? dpl;

  factory KknTerritoryEntity.fromJson(Map<String, dynamic> json) {
    return KknTerritoryEntity(
      kelompokId: json['kelompokId']?.toString() ?? '',
      kelompokName: json['kelompokName']?.toString() ?? '',
      kecamatan: json['kecamatan']?.toString() ?? '',
      kelurahan: json['kelurahan']?.toString() ?? '',
      cakupanRw: (json['cakupanRw'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      assignedRw: json['assignedRw']?.toString() ?? '',
      posko: json['posko'] is Map<String, dynamic> ? PoskoSummary.fromJson(json['posko']) : null,
      dpl: json['dpl'] is Map<String, dynamic> ? DplSummary.fromJson(json['dpl']) : null,
    );
  }

  @override
  List<Object?> get props => [kelompokId, kelompokName, kecamatan, kelurahan, cakupanRw, assignedRw];
}

class WargaDampinganAggregation extends Equatable {
  const WargaDampinganAggregation({
    this.totalWargaDampingan = 0,
    this.wargaDampinganBinAktif = 0,
    this.totalPhysicalBins = 0,
    this.wargaLengkapDuaWadah = 0,
    this.wargaMandiriRwBelumKlaim = 0,
    this.totalWargaRw = 0,
  });

  final int totalWargaDampingan;
  final int wargaDampinganBinAktif;
  final int totalPhysicalBins;
  final int wargaLengkapDuaWadah;
  final int wargaMandiriRwBelumKlaim;
  final int totalWargaRw;

  factory WargaDampinganAggregation.fromJson(Map<String, dynamic> json) {
    return WargaDampinganAggregation(
      totalWargaDampingan: (json['totalWargaDampingan'] as num?)?.toInt() ?? 0,
      wargaDampinganBinAktif: (json['wargaDampinganBinAktif'] as num?)?.toInt() ?? 0,
      totalPhysicalBins: (json['totalPhysicalBins'] as num?)?.toInt() ?? 0,
      wargaLengkapDuaWadah: (json['wargaLengkapDuaWadah'] as num?)?.toInt() ?? 0,
      wargaMandiriRwBelumKlaim: (json['wargaMandiriRwBelumKlaim'] as num?)?.toInt() ?? 0,
      totalWargaRw: (json['totalWargaRw'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  List<Object?> get props => [
        totalWargaDampingan,
        wargaDampinganBinAktif,
        totalPhysicalBins,
        wargaLengkapDuaWadah,
        wargaMandiriRwBelumKlaim,
        totalWargaRw,
      ];
}

class TodayAttendanceSummary extends Equatable {
  const TodayAttendanceSummary({
    this.scheduleId = '',
    this.date = '',
    this.status = 'ALPHA',
    this.hasCheckedIn = false,
    this.hasCheckedOut = false,
    this.accumulatedMinutes = 0,
    this.targetMinutes = 250,
    this.isMemenuhiTarget = false,
    this.remainingMinutes = 250,
    this.activeZone = '',
    this.lastPingAt,
  });

  final String scheduleId;
  final String date;
  final String status;
  final bool hasCheckedIn;
  final bool hasCheckedOut;
  final int accumulatedMinutes;
  final int targetMinutes;
  final bool isMemenuhiTarget;
  final int remainingMinutes;
  final String activeZone;
  final DateTime? lastPingAt;

  factory TodayAttendanceSummary.fromJson(Map<String, dynamic> json) {
    return TodayAttendanceSummary(
      scheduleId: json['scheduleId']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      status: json['status']?.toString() ?? 'ALPHA',
      hasCheckedIn: json['hasCheckedIn'] == true,
      hasCheckedOut: json['hasCheckedOut'] == true,
      accumulatedMinutes: (json['accumulatedMinutes'] as num?)?.toInt() ?? 0,
      targetMinutes: (json['targetMinutes'] as num?)?.toInt() ?? 250,
      isMemenuhiTarget: json['isMemenuhiTarget'] == true,
      remainingMinutes: (json['remainingMinutes'] as num?)?.toInt() ?? 250,
      activeZone: json['activeZone']?.toString() ?? '',
      lastPingAt: json['lastPingAt'] != null ? DateTime.tryParse(json['lastPingAt'].toString()) : null,
    );
  }

  @override
  List<Object?> get props => [
        scheduleId,
        date,
        status,
        hasCheckedIn,
        hasCheckedOut,
        accumulatedMinutes,
        targetMinutes,
        isMemenuhiTarget,
      ];
}
```

---

## 3. UI Screen Modernization

### 3.1 `MonitoringWargaView` (`lib/app/modules/mahasiswa/views/monitoring_warga_view.dart`)
Simplify the leader authorization check. Eliminate the fragile dependency on `kelompokState.kelompok?.members`:

```dart
// OLD VULNERABLE LOGIC:
// final isKetua = (user?.isKetua == true) ||
//     (kelompokState.kelompok?.members.any((m) => ...) == true);

// NEW BULLETPROOF SSOT LOGIC:
final isKetua = ref.watch(authProvider.select((s) => s.user?.isKetua == true));
```
- The "Alihkan" button immediately renders the green swap icon without depending on async calls to `/kkn/kelompok/me`.
- If `kelompokState.kelompok` is null when tapping "Alihkan", `ReassignPendampingBottomSheet.show` handles background pre-fetching internally without blocking the user.

### 3.2 `MahasiswaView` (`lib/app/modules/mahasiswa/views/mahasiswa_view.dart`)
Refactor "Statistik Aktivitas" cards to read the unified aggregation:

```dart
// Read unified aggregation directly from User Profile or fall back to live Dashboard State
final user = ref.watch(authProvider).user;
final aggregation = user?.wargaAggregation ?? mhsState.dashboard?.wargaAggregation;
final attendance = user?.attendanceSummary;

// 1. Rumah / Warga Binaan Card
final totalWarga = aggregation?.totalWargaDampingan ?? 0;
final wargaAktif = aggregation?.wargaDampinganBinAktif ?? 0;

// 2. Tempat Sampah Fisik Card
final totalBinsCount = aggregation?.totalPhysicalBins ?? 0;
final wargaLengkapCount = aggregation?.wargaLengkapDuaWadah ?? 0;

// 3. Presensi Minutes Card (replaces local device timer discrepancies)
final accumulatedMinutes = attendance?.accumulatedMinutes ?? 0;
final isTargetFulfilled = attendance?.isMemenuhiTarget ?? false;
```

---

## 4. Local Storage Hygiene & Safe Cache Protocol

### 4.1 Update `AppCacheManager` (`lib/app/core/utils/app_cache_manager.dart`)
1. **Never Clear Authentication SSOT:** Ensure keys storing `UserEntity` (`AppConfig.userDataKey`) are permanently excluded from bulk cache purges.
2. **Prevent Cache Poisoning with Zeros:**
   In `ApiKknRepository.getWargaDampingan()`:
   ```dart
   // Only overwrite local cache if incoming data from server is valid and non-empty
   if (rawList.isNotEmpty) {
     final prefs = await SharedPreferences.getInstance();
     await prefs.setString(_cacheKeyWarga, jsonEncode(rawList));
   }
   ```
   If server returns an empty array due to temporary network or indexing glitch, do not wipe out cached citizen list immediately.

---

## 5. Step-by-Step Implementation Roadmap

```
Step 1: Models & Entities
  ├── Create KknTerritoryEntity & TodayAttendanceSummary in mahasiswa_kkn_models.dart
  └── Update UserEntity to parse kknTerritory, wargaAggregation, and attendanceSummary

Step 2: Auth Repository & Controller
  ├── Verify SafeStorage writes complete UserEntity JSON without dropping new keys
  └── Update authProvider state notifier to expose reactive sub-properties

Step 3: Screen Modernization
  ├── Replace isKetua calculation in monitoring_warga_view.dart with authProvider SSOT
  ├── Update detail_warga_view.dart to use direct authProvider.user?.isKetua
  └── Update mahasiswa_view.dart Statistik Aktivitas cards to consume wargaAggregation

Step 4: Quality Control & Static Analysis
  ├── Run flutter analyze --no-fatal-warnings -> 0 Issue
  ├── Test offline flight mode -> Ensure UI cards show last known good data without 0-wiping
  └── Test app kill / resume -> Verify Alihkan button remains unlocked for leaders
```

---

## 6. Acceptance Criteria

| Criteria ID | Scenario | Verification Step |
|---|---|---|
| **AC-MOB-01** | App Fresh Launch / Login | Logging in as Group Leader immediately renders "Alihkan" button enabled with `Icons.swap_horiz_rounded`. |
| **AC-MOB-02** | OS Process Death Simulation | Minimize app, kill process via ADB (`am kill`), relaunch app. User profile hydrates from SafeStorage, keeping leader status active without padlock icon. |
| **AC-MOB-03** | Live Metrics Display | "Rumah / Warga Binaan" and "Tempat Sampah Fisik" display values matching database aggregation immediately on launch without waiting for secondary APIs. |
| **AC-MOB-04** | Offline Resilience | Disconnect Wi-Fi/Cellular. Opening dashboard renders cached metrics rather than wiping to `0 Unit` / `0 Rumah`. |
