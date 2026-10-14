# BACKEND SPECIFICATION: UNIFIED KKN AUTH, TERRITORY, ATTENDANCE & AGGREGATION SSOT PAYLOAD

- Target Service: `apps/api` (Backend Express.js, Prisma ORM, PostgreSQL)
- Originating Team: BERSEKA Mobile Engineering Team
- Target Path: `docs/BACKEND_SPECIFICATION_UNIFIED_KKN_AUTH_AND_METRICS_PAYLOAD.md`
- Status: ARCHITECTURAL SPECIFICATION & RFC
- Priority: CRITICAL / PRODUCTION HARDENING

---

## 1. Executive Summary & Problem Background

### 1.1 Problem Statement
The current mobile client relies on fragmented API endpoints to assemble a single screen:
1. `GET /auth/me` — Basic user identity only.
2. `GET /kkn/kelompok/me` — Group members, DPL, and client-derived leader authority.
3. `GET /kkn/dashboard` — Activity metrics and raw bin counts.
4. `GET /timesheet/summary` — Accumulated presence minutes.
5. `GET /bins/reset-request/status` — Pending trash bin reset requests.

When the mobile app undergoes Android OS Process Death, token refresh, or offline/online reconnection, secondary requests frequently fail, race, or get invalidated. This results in:
- The group leader authorization (`isKetua`) resetting to `false` (locking the "Alihkan" feature with a padlock icon).
- Territorial scope (`kelurahan`, `rw`) dropping to empty strings, breaking citizen filtering.
- Activity metrics (Citizens, Active Trash Bins, Presence minutes) dropping to `0` due to local cache overwrite from incomplete server queries.

### 1.2 Architectural Solution
Consolidate the primary state into a **Unified Single Source of Truth (SSOT) Payload** delivered during authentication (`POST /auth/login`, `POST /auth/refresh`, and `GET /auth/me`), while simultaneously hardening `GET /api/v1/kkn/dashboard` so metrics are calculated directly in PostgreSQL rather than inferred client-side.

---

## 2. Target Data Contract (Enriched `/auth/me` Response)

In `apps/api/src/services/authService.ts`, method `formatUserResponse` must return the following unified contract for role `MAHASISWA_KKN`:

```json
{
  "success": true,
  "data": {
    "id": "c1f7a0b3-9e11-482a-bc91-202610140001",
    "name": "Acef Kiki",
    "phone": "+6281234567890",
    "role": "MAHASISWA_KKN",
    "avatar": "https://staging.berseka.id/uploads/avatars/user.webp",

    "isKetua": true,

    "kknTerritory": {
      "kelompokId": "kkn-grp-06",
      "kelompokName": "Kelompok 06",
      "kecamatanId": 1,
      "kecamatan": "Coblong",
      "kelurahanId": 4,
      "kelurahan": "Sadang Serang",
      "cakupanRw": ["03", "04", "08"],
      "assignedRwId": 12,
      "assignedRw": "RW 03",
      "posko": {
        "id": "posko-uuid-01",
        "name": "Posko KKN Kelompok 06",
        "address": "Jl. Titimplik Dalam No. 12",
        "latitude": -6.88721,
        "longitude": 107.61842,
        "radiusMeter": 500
      },
      "dpl": {
        "id": "dpl-uuid-01",
        "name": "Dr. Ir. Dosen Pembimbing, M.T.",
        "phone": "+6281987654321",
        "nip": "198001012005011001"
      }
    },

    "wargaDampinganAggregation": {
      "totalWargaDampingan": 14,
      "wargaDampinganBinAktif": 12,
      "totalPhysicalBins": 24,
      "wargaLengkapDuaWadah": 10,
      "wargaMandiriRwBelumKlaim": 38,
      "totalWargaRw": 52
    },

    "todayAttendanceSummary": {
      "scheduleId": "sch-2026-10-14-01",
      "date": "2026-10-14",
      "status": "HADIR",
      "hasCheckedIn": true,
      "hasCheckedOut": false,
      "accumulatedMinutes": 215,
      "targetMinutes": 250,
      "isMemenuhiTarget": false,
      "remainingMinutes": 35,
      "activeZone": "Sadang Serang Zone 1",
      "lastPingAt": "2026-10-14T16:45:00.000+07:00"
    },

    "activeBinResetRequests": [
      {
        "requestId": "reset-req-uuid-01",
        "binId": "bin-uuid-organik",
        "qrCode": "BSK-OGN-00123",
        "status": "PENDING",
        "createdAt": "2026-10-14T14:30:00.000+07:00"
      }
    ]
  }
}
```

---

## 3. Detailed Technical Requirements

### 3.1 Database Migration & Leader Flag Verification
File: `apps/api/prisma/schema.prisma`

1. Ensure model `StudentKkn` maps `isKetua`:
```prisma
model StudentKkn {
  id           String       @id @default(uuid())
  userId       String       @unique @map("id_pengguna")
  nim          String       @unique
  isKetua      Boolean      @default(false) @map("is_ketua")
  kelompokId   String?      @map("id_kelompok")
  assignedRwId Int?         @map("id_rw_penugasan")
  // ... existing fields
}
```
2. Execute data backfill in PostgreSQL to guarantee all active group leaders are flagged:
```sql
UPDATE "mahasiswa_kkn"
SET "is_ketua" = TRUE
WHERE "user_id" IN (
  SELECT s."id_pengguna"
  FROM "mahasiswa_kkn" s
  JOIN "kelompok_kkn" k ON s."id_kelompok" = k."id"
  -- Target verified student leaders
);
```

---

### 3.2 Territory & Group Extraction (`authService.ts`)
File: `apps/api/src/services/authService.ts`

When assembling `formatUserResponse`, resolve the territory hierarchy:
1. `studentProfile.assignedRw` (specific student assignment).
2. `studentProfile.kelompok.cakupanRw` (JSON array of RWs in the cluster).
3. `studentProfile.kelompok.kelurahan` and associated `kecamatan`.
4. Attached `PoskoKkn` record with coordinates and radius.
5. Associated `Dpl` record (`kelompok.dpl`).

Ensure string representations and numeric IDs are normalized (strip leading zeros for numeric IDs, format `"RW 03"` cleanly).

---

### 3.3 Dynamic Citizen & Trash Bin Aggregation (`kknService.ts` & `authService.ts`)
Files:
- `apps/api/src/services/kknService.ts` (`getDashboardStats`)
- `apps/api/src/services/authService.ts` (`formatUserResponse`)

Replace bin-only ownership queries with direct mentorship union:
```ts
async function calculateWargaDampinganSummary(studentUserId: string, studentKknId?: string) {
  const studentIds = [studentUserId, studentKknId].filter(Boolean) as string[];

  // 1. Fetch assisted citizens by direct mentorship (SSOT) OR legacy bin scan
  const citizens = await prisma.user.findMany({
    where: {
      role: { name: "WARGA" },
      OR: [
        { pendampingStudentId: { in: studentIds } },
        { bins: { some: { registeredByStudentId: { in: studentIds } } } },
        { binOwnerships: { some: { bin: { registeredByStudentId: { in: studentIds } } } } },
      ],
    },
    include: {
      bins: {
        where: { status: "ACTIVE_BOUND" },
        include: { category: true },
      },
      binOwnerships: {
        include: {
          bin: {
            where: { status: "ACTIVE_BOUND" },
            include: { category: true },
          },
        },
      },
    },
  });

  const totalWargaDampingan = citizens.length;
  let wargaDampinganBinAktif = 0;
  let totalPhysicalBins = 0;
  let wargaLengkapDuaWadah = 0;

  for (const c of citizens) {
    const allBins = [
      ...(c.bins || []),
      ...(c.binOwnerships?.map((bo) => bo.bin).filter(Boolean) || []),
    ];
    // Deduplicate bins by ID
    const uniqueBins = Array.from(new Map(allBins.map((b) => [b.id, b])).values());
    
    if (uniqueBins.length > 0) {
      wargaDampinganBinAktif++;
      totalPhysicalBins += uniqueBins.length;
    }

    const hasOrganik = uniqueBins.some((b) => b.category?.name?.toUpperCase() === "ORGANIK");
    const hasAnorganik = uniqueBins.some((b) => b.category?.name?.toUpperCase() === "ANORGANIK");
    if (hasOrganik && hasAnorganik) {
      wargaLengkapDuaWadah++;
    }
  }

  return {
    totalWargaDampingan,
    wargaDampinganBinAktif,
    totalPhysicalBins,
    wargaLengkapDuaWadah,
  };
}
```

---

### 3.4 Live Today's Presence & Accumulated Minutes (`kknAttendanceService.ts`)
File: `apps/api/src/services/kknAttendanceService.ts`

Compute the student's real-time attendance status for current WIB calendar date:
1. Lookup today's active schedule for the student (`Schedule.date = todayWIB`).
2. Fetch `StudentAttendance` record for today.
3. Sum verified minutes from `StudentLocation` pings / timesheet logs within valid geofence zones.
4. Return:
   - `accumulatedMinutes`: Total active minutes verified by backend.
   - `targetMinutes`: 250 (official standard).
   - `isMemenuhiTarget`: `accumulatedMinutes >= 250`.
   - `remainingMinutes`: `Math.max(0, 250 - accumulatedMinutes)`.

---

### 3.5 Pending Trash Bin Reset Requests (`binService.ts`)
File: `apps/api/src/services/binService.ts`

Include any pending emptying/reset requests initiated by citizens assigned to this student or bins registered by this student:
```ts
const activeRequests = await prisma.binResetRequest.findMany({
  where: {
    status: { in: ["PENDING", "ASSIGNED"] },
    bin: {
      OR: [
        { registeredByStudentId: studentUserId },
        { user: { pendampingStudentId: studentUserId } },
      ],
    },
  },
  select: {
    id: true,
    binId: true,
    status: true,
    createdAt: true,
    bin: { select: { qrCode: true } },
  },
});
```

---

## 4. Verification & Testing Matrix

| Scenario Code | Test Action | Expected Result |
|---|---|---|
| **VERIFY-01** | `POST /api/v1/auth/login` as Group Leader | Returns HTTP 200 with `isKetua: true`, `kknTerritory`, and complete `wargaDampinganAggregation`. |
| **VERIFY-02** | `POST /api/v1/auth/refresh` after 12 hours | Returns fresh JWT token and exact same enriched payload without data loss. |
| **VERIFY-03** | Reassign citizen (`reassign-pendamping`) | `pendampingStudentId` and `registeredByStudentId` transfer cleanly. Dashboard and auth aggregation reflect new counts immediately. |
| **VERIFY-04** | Check attendance status mid-day (e.g. 15:00 WIB) | `todayAttendanceSummary.accumulatedMinutes` accurately reflects backend tracked time without relying on client device timers. |
| **VERIFY-05** | Offline reconnection test | Mobile reconnects, hits `/auth/me`, and refreshes all UI cards instantly without secondary sequential calls. |

---

## 5. Deployment Instructions for Backend Team

1. Run Prisma migration check: `npx prisma db push --skip-generate` or apply targeted migration.
2. Update `authService.ts`, `kknService.ts`, and `kknAttendanceService.ts` according to Section 3.
3. Test locally with `npm run test` or check test suites `authService.test.ts` & `kknAttendanceService.test.ts`.
4. Deploy to `staging` environment first, verify with mobile test accounts, then promote to `production`.
