# BACKEND CHANGE SPECIFICATION: DIRECT USER-TO-USER CITIZEN MENTOR RELATIONSHIP ARCHITECTURE

- Target Service: `apps/api` (Backend Express, Prisma ORM, PostgreSQL)
- Originating Team: BERSEKA Mobile Engineering Team
- Status: PROPOSED SPECIFICATION
- Priority: HIGH / ARCHITECTURAL CORRECTION

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 Field Incident
During field operations, two critical data discrepancies frequently occur:
1. **Companion Swapping:** Mahasiswa A from Kelompok A conducts on-site QR activation for Citizen X, but Citizen X's mobile profile displays Mahasiswa B from Kelompok B as their companion.
2. **Cross-District Assignment Anomaly:** Citizens are assigned to students from completely different groups operating in different Kelurahan districts.

### 1.2 Root Cause in Legacy Implementation
The legacy backend architecture does not establish a direct foreign key relationship between the citizen `User` and the student `User`. Instead, it resolves the companion using a 3-tier heuristic fallback inside `authRepository.findCitizenMentor`:
1. **Tier 1 (Bin Asset Inference):** Reads `Bin.registeredByStudentId` via `BinOwnership`. When households possess multiple bins (Organic and Inorganic), or legacy bins, the sorting order (`orderBy: { createdAt: 'desc' }`) can attach to stale or mismatched bins.
2. **Tier 2 & 3 (RegEx Fallback Over Entire Database):** If Tier 1 fails or returns unassigned, the repository searches `KelompokKkn.findMany({ select: { id: true, cakupanRw: true } })` across the entire city and matches raw substring digits (`str.includes(rwDigit)`) without scoping by `kelurahanId`.
   - Result: A citizen in RW 03 Kelurahan Sadang Serang matches Kelompok B assigned to RW 03 Kelurahan Dago. The first student found via `findFirst` is erroneously returned.

---

## 2. Target Architectural Design

### 2.1 Domain Model Separation
- **RW & Kelurahan (Territorial Scope):** Acts as the assignment boundary and filtering pool determining which unactivated citizens belong to which group's operational zone.
- **Trash Bin / `Bin` (Physical Asset):** Acts as the hardware tracking unit for RFID/QR scans, volume measurement, and AI waste sorting classification.
- **Companion Relationship (Subject Identity):** Must be a direct, single source of truth (SSOT) foreign key between `User` (Citizen) and `User` (Student).

### 2.2 Database Schema Migration (Prisma ORM)

Modify `apps/api/prisma/schema.prisma` on model `User`:

```prisma
model User {
  id                    String        @id @default(uuid())
  name                  String        @map("nama")
  roleId                Int           @map("id_peran")
  rwId                  Int?          @map("id_rw")
  
  // ── DIRECT COMPANION RELATIONSHIP (SSOT) ──────────────────────────
  pendampingStudentId   String?       @map("id_mahasiswa_pendamping")
  kelompokKknId         String?       @map("id_kelompok_kkn")

  // Relation to Student User
  pendampingStudent     User?         @relation("StudentCitizenMentorship", fields: [pendampingStudentId], references: [id], onDelete: SetNull)
  wargaDampinganList    User[]        @relation("StudentCitizenMentorship")

  // Relation to KKN Group
  kelompokKkn           KelompokKkn?  @relation("GroupCitizenMentorship", fields: [kelompokKknId], references: [id], onDelete: SetNull)

  // Indexes for high performance querying
  @@index([pendampingStudentId])
  @@index([kelompokKknId])
  @@index([roleId, rwId])
}
```

Also add the reverse relation inside model `KelompokKkn`:
```prisma
model KelompokKkn {
  // Existing fields...
  wargaBinaan           User[]        @relation("GroupCitizenMentorship")
}
```

---

## 3. Required Backend Endpoint Modifications

### 3.1 `POST /api/v1/kkn/warga/activate-by-scan`
- **Current Behavior:** Updates `Bin.registeredByStudentId = kknUserId` and `Bin.userId = wargaId`.
- **Required Update:** Within the same transaction (`prisma.$transaction`), update the citizen's `User` record directly:
  ```typescript
  await tx.user.update({
    where: { id: wargaId },
    data: {
      pendampingStudentId: kknUserId,
      kelompokKknId: studentProfile?.kelompokId || null,
    },
  });
  ```

### 3.2 `POST /api/v1/kkn/warga/activate-bin`
- **Current Behavior:** Binds dual bins (Organic and Inorganic) to the citizen.
- **Required Update:** Set `pendampingStudentId` and `kelompokKknId` directly on the citizen's `User` record to the calling student ID and their group ID.

### 3.3 `POST /api/v1/kkn/warga/:wargaId/claim`
- **Handler:** `kknService.claimWargaMandiri`
- **Current Behavior:** Updates unassigned bins with `registeredByStudentId = kknUserId`. Throws `NO_ACTIVE_BINS` if bins do not exist yet.
- **Required Update:**
  1. Allow claiming independent citizens even if they do not yet have an active bin (removes blocking barrier for paper-first or unactivated citizens).
  2. Directly mutate:
     ```typescript
     await tx.user.update({
       where: { id: wargaId },
       data: {
         pendampingStudentId: kknUserId,
         kelompokKknId: student.kelompokId || null,
       },
     });
     ```
  3. If bins exist, update `Bin.registeredByStudentId` as well.

### 3.4 `PATCH /api/v1/kkn/warga/:wargaId/reassign-pendamping`
- **Handler:** `kknService.reassignWargaPendampingUnified`
- **Current Behavior:** Executes `tx.bin.updateMany({ where: { userId: cleanWargaId }, data: { registeredByStudentId: targetStudent.userId } })`. Fails silently if citizen has no bins.
- **Required Update:**
  1. Update citizen `User` record:
     ```typescript
     await tx.user.update({
       where: { id: cleanWargaId },
       data: {
         pendampingStudentId: targetStudent.userId,
         kelompokKknId: targetStudent.kelompokId || null,
       },
     });
     ```
  2. Update any existing bins belonging to the citizen.
  3. Reassignment now succeeds regardless of physical bin status.

### 3.5 `GET /api/v1/auth/me` & `GET /api/v1/households/me`
- **Handler:** `authService.getCurrentUser` & `householdController.getMyHouseholds`
- **Current Behavior:** Calls heuristic resolver `authRepository.findCitizenMentor(userId, user.rwId)`.
- **Required Update:**
  1. Deprecate fallback regex matching across unrelated groups.
  2. Read citizen's `pendampingStudentId` directly:
     ```typescript
     let pendamping = null;
     if (user.pendampingStudentId) {
       const student = await prisma.user.findUnique({
         where: { id: user.pendampingStudentId },
         select: {
           id: true,
           name: true,
           phone: true,
           studentProfile: {
             select: {
               nim: true,
               jurusan: true,
               fakultas: true,
               kelompok: { select: { id: true, name: true } },
             },
           },
         },
       });
       if (student) {
         pendamping = {
           id: student.id,
           name: student.name,
           phone: student.phone,
           nim: student.studentProfile?.nim || null,
           jurusan: student.studentProfile?.jurusan || null,
           fakultas: student.studentProfile?.fakultas || null,
           kelompokId: student.studentProfile?.kelompok?.id || null,
           kelompokName: student.studentProfile?.kelompok?.name || null,
         };
       }
     }
     ```
  3. If `pendampingStudentId` is null, citizen is designated as `Tanpa Pendamping (Mandiri)` without guessing random students in the RW.

### 3.6 `GET /api/v1/kkn-attendance/warga-dampingan`
- **Handler:** `kknAttendanceService.getWargaDampingan`
- **Required Update:**
  - Citizen list query must include citizens whose `pendampingStudentId` matches any student in the group:
    ```typescript
    where: {
      role: { name: "WARGA" },
      OR: [
        { pendampingStudentId: { in: groupStudentIds } },
        { kelompokKknId: studentProfile.kelompokId },
        // Preserved bin-based legacy condition during migration
        { bins: { some: { registeredByStudentId: { in: groupStudentIds } } } },
      ],
    }
    ```

---

## 4. Mobile Application Readiness

The mobile application codebase has been decoupled and prepared to support this migration:
1. `ReassignPendampingBottomSheet` centralizes student reassignment and handles unactivated bin warnings gracefully.
2. `MonitoringWargaView` handles deduplication by prioritizing explicit companion fields before falling back to regional lists.
3. Once the backend fields `pendampingStudentId` and `kelompokKknId` are live, mobile models will consume them directly without requiring layout refactoring.
