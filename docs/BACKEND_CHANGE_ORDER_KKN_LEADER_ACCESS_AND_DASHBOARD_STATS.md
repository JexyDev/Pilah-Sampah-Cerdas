# BACKEND CHANGE SPECIFICATION: KKN LEADER AUTHORIZATION & DASHBOARD STATS SYNCHRONIZATION

- Target Service: `apps/api` (Backend Express, Prisma ORM, PostgreSQL)
- Originating Team: BERSEKA Mobile Engineering Team
- Target Folder: `docs/`
- Status: PROPOSED SPECIFICATION
- Priority: HIGH / FIELD BLOCKER

---

## 1. Executive Summary & Problem Statement

### 1.1 Field Incident
1. **Reassign Action Locked for Group Leaders:**
   In the mobile app screen `Monitoring Warga Dampingan`, KKN group leaders encounter a disabled "Alihkan" button displaying a lock icon (`Icons.lock_outline`). Tapping the button produces the snackbar:
   `"Akses Terbatas: Hanya Ketua Kelompok KKN yang berwenang mengalihkan mahasiswa pendamping"`.
   Backend rejects any direct API call with error `ONLY_KETUA_CAN_REASSIGN`.
2. **Zero Metrics in Dashboard ("Statistik Aktivitas"):**
   Even when citizens exist within the assigned group RW and have physical trash bins installed, the home screen dashboard displays `0` for:
   - "Rumah / Warga Binaan" (`0 Teraktivasi`)
   - "Tempat Sampah Fisik" (`0 Unit`, `0 Rumah`)

### 1.2 Root Cause Analysis

#### A. KKN Group Leader Authorization Flag (`is_ketua`)
- In `apps/api/prisma/schema.prisma`, model `StudentKkn` defines `isKetua Boolean @default(false) @map("is_ketua")`.
- Most student records currently retain `is_ketua = false` in PostgreSQL.
- Furthermore, `authService.formatUserResponse` and `/auth/me` do not expose `isKetua` directly at top-level user object, causing client-side permission evaluation in `monitoring_warga_view.dart` to evaluate to `false` when group member lists are not yet hydrated.

#### B. Dashboard Query Desynchronization in `kknService.getDashboardStats`
- In `apps/api/src/services/kknService.ts:183-188`:
  ```ts
  const totalRegistered = isSuperOrAdmin
    ? await prisma.bin.count({ where: { status: "ACTIVE_BOUND" } })
    : await prisma.bin.count({
        where: {
          status: "ACTIVE_BOUND",
          registeredByStudentId: userId,
        },
      });
  ```
- In `apps/api/src/services/kknService.ts:320-334`:
  ```ts
  const wargaDampingan = await prisma.user.findMany({
    where: {
      role: { name: "WARGA" },
      OR: [
        { bins: { some: { registeredByStudentId: { in: studentIds } } } },
        { binOwnerships: { some: { bin: { registeredByStudentId: { in: studentIds } } } } },
      ],
    },
  });
  ```
- **Flaw:** Following the migration `20261013140000_direct_citizen_mentor_relationship`, citizen mentorship is directly anchored via `User.pendampingStudentId` (`id_mahasiswa_pendamping`).
- `getDashboardStats()` still relies exclusively on `registeredByStudentId` on physical bins. Citizens claimed, reassigned, or paired without direct on-site scan by that specific student ID are completely omitted from the dashboard metrics, returning zeroes.

---

## 2. Technical Specifications & Required Changes

### 2.1 Database & Data Alignment: Ensure Group Leader Flag
Ensure that every KKN group has their assigned leader flagged in `mahasiswa_kkn`:
```sql
-- Verify and update leaders based on Kelompok role / assignment
UPDATE "mahasiswa_kkn"
SET "is_ketua" = TRUE
WHERE "user_id" IN (
  -- Target leader user IDs
);
```

### 2.2 Expose `isKetua` in Auth Payloads (`authService.ts`)
File: `apps/api/src/services/authService.ts`

In `formatUserResponse`:
Ensure `isKetua` is returned at both root user profile and studentProfile payload:
```ts
return {
  id: user.id,
  name: user.name,
  phone: user.phone,
  role: roleName,
  isKetua: Boolean(studentProfile?.isKetua),
  studentProfile: studentProfile ? {
    ...studentProfile,
    isKetua: Boolean(studentProfile.isKetua),
  } : null,
  // ... other fields
};
```

### 2.3 Harmonize Reassignment (`reassignPendamping`) with Bin Ownership
File: `apps/api/src/services/kknService.ts` (`reassignPendamping`)

Confirm that when `reassignPendamping` executes:
1. `User.pendampingStudentId` is set to `targetStudent.userId`.
2. `User.kelompokKknId` is set to `targetStudent.kelompokId`.
3. All existing physical bins belonging to that citizen update `registeredByStudentId = targetStudent.userId` and `kelompokId = targetStudent.kelompokId`.
*(Note: Existing implementation in lines 6727-6758 already performs this update).*

### 2.4 Update Dashboard Stats Aggregation (`kknService.ts:getDashboardStats`)
File: `apps/api/src/services/kknService.ts`

Update `getDashboardStats` to reflect the direct mentorship architecture:

```ts
// 1. Warga Dampingan query: include pendampingStudentId
const studentIds = [userId, student?.id].filter(Boolean) as string[];

const wargaDampingan = await prisma.user.findMany({
  where: {
    role: { name: "WARGA" },
    OR: [
      { pendampingStudentId: { in: studentIds } },
      { bins: { some: { registeredByStudentId: { in: studentIds } } } },
      { binOwnerships: { some: { bin: { registeredByStudentId: { in: studentIds } } } } },
    ],
  },
  include: {
    bins: { select: { id: true, status: true } },
    binOwnerships: { select: { bin: { select: { id: true, status: true } } } },
  },
});

totalWargaDampingan = wargaDampingan.length;

wargaDampinganBinAktif = wargaDampingan.filter((w) => {
  const allBins = [
    ...(w.bins || []),
    ...(w.binOwnerships?.map((bo: any) => bo.bin) || []),
  ];
  return allBins.some((b) => b && (b.status === "ACTIVE_BOUND" || b.status === "ACTIVE"));
}).length;

// 2. Total registered physical bins: include bins registered by student OR owned by assisted citizens
const totalRegistered = isSuperOrAdmin
  ? await prisma.bin.count({ where: { status: "ACTIVE_BOUND" } })
  : await prisma.bin.count({
      where: {
        status: "ACTIVE_BOUND",
        OR: [
          { registeredByStudentId: userId },
          { user: { pendampingStudentId: userId } },
          { binOwnerships: { some: { user: { pendampingStudentId: userId } } } },
        ],
      },
    });
```

---

## 3. Verification & Acceptance Criteria

| ID | Test Scenario | Expected Outcome |
|---|---|---|
| TC-01 | Login as KKN Group Leader | `/auth/me` returns `isKetua: true`. Mobile UI shows green horizontal swap icon (`Icons.swap_horiz_rounded`) without lock icon. |
| TC-02 | Execute Reassignment via Mobile / API | `PUT /api/v1/kkn/warga/:wargaId/reassign-pendamping` returns HTTP 200 without `ONLY_KETUA_CAN_REASSIGN`. |
| TC-03 | Database Audit after Reassignment | `pengguna.id_mahasiswa_pendamping` matches target student. `tempat_sampah.id_mahasiswa_pendaftar` updates to target student. |
| TC-04 | Home Screen Dashboard Refresh | `GET /api/v1/kkn/dashboard` returns non-zero `totalRegisteredBins`, `totalWargaDampingan`, and `wargaDampinganBinAktif`. |
