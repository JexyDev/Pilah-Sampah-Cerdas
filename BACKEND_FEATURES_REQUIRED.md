# BACKEND FEATURES REQUIRED — GPS Tracking & Location Ping

**Status:** CRITICAL BLOCKERS
**Priority:** P0 (Blocking mobile testing)
**Target:** `apps/api/src/services/kknAttendanceService.ts` + `apps/api/src/controllers/kknAttendanceController.ts`

---

## ISSUE SUMMARY

Mobile app sends location pings every 15 seconds, but backend returns:
```
{
  "success": false,
  "data": null,
  "message": "no message"
}
```

This causes mobile to stop tracking even though GPS is working. Root cause: **Backend does not return valid response format when schedule is missing or invalid**.

---

## FEATURE 1: Always-Valid Response Format (CRITICAL)

### Requirement
- `/location-ping` (POST `/api/v1/kkn/location-ping`) must **ALWAYS** return HTTP 200 with valid data
- Never return `success: false` just because no active schedule exists
- Response structure MUST be:
  ```typescript
  {
    success: true,
    data: {
      scheduleId: string | null,
      activeScheduleId: string | null,
      status: "BERLANGSUNG" | "DI_LUAR_ZONA" | "TIDAK_ADA_KEGIATAN",
      inZoneMinutes: number,
      actualInZoneSeconds: number,
      poskoArea: string | null,
      kelurahan: string | null,
      ...
    }
  }
  ```

### Current Bug
- Line 673-684 in `kknAttendanceService.ts`:
  - Returns `success: true` but controller may wrap it wrong
  - If `activeScheduleId === null`, response data becomes incomplete

### Fix Required
```typescript
// BEFORE: Return incomplete when no schedule
if (activeSchedules.length === 0) {
  // Currently: returns null for many fields
}

// AFTER: Return complete response even without schedule
return {
  success: true,
  data: {
    locations: savedLocations,
    scheduleId: activeScheduleId || null,  // Explicitly null, not undefined
    activeScheduleId: activeScheduleId || null,
    status: "TIDAK_ADA_KEGIATAN",  // Clear status
    inZoneMinutes: 0,
    actualInZoneSeconds: 0,
    poskoArea: null,
    kelurahan: null,
    message: activeScheduleId ? "Tracking active" : "No active schedule, but tracking continues"
  }
};
```

---

## FEATURE 2: Fallback Geofence Coordinates (CRITICAL)

### Requirement
- When schedule has **no** `latitude`, `longitude`, or `radius` → use **system default coordinates**
- Defaults must be configurable via Rule Engine or system config
- Fallback hardcoded: `-6.8915, 107.6107` (Bandung/Coblong) + radius `100m`

### Current Code (Line 704-706)
```typescript
const defaultLat = configLatStr ? parseFloat(configLatStr) : -6.8915; // Bandung / Coblong
const defaultLng = configLngStr ? parseFloat(configLngStr) : 107.6107;
const defaultRadius = configRadiusStr ? parseInt(configRadiusStr, 10) : 100;
```

### Problem
- This is in `getActivityLocation()` but NOT in `updateStudentLocationsBatch()`
- When calculating geofence in `pingLocation()` (line 270-275), default radius is hardcoded `150`
- Inconsistency: geofence check in `pingLocation` vs `getActivityLocation` have different defaults

### Fix Required
```typescript
// In updateStudentLocationsBatch() around line 600-620:

// UNIFIED GEOFENCE FALLBACK
const geofence = {
  latitude: sch.latitude ? Number(sch.latitude) : (await configService.getConfig("default_activity_latitude") || -6.8915),
  longitude: sch.longitude ? Number(sch.longitude) : (await configService.getConfig("default_activity_longitude") || 107.6107),
  radius: sch.radius ? Number(sch.radius) : (await configService.getConfig("default_activity_radius") || 100),
  polygon: sch.polygon,
};

// Use this geofence for ALL calculations (not hardcoded)
const isInsideZone = dist <= (geofence.radius + bufferMeters);
```

---

## FEATURE 3: Robust Error Handling with Offline Queue Support (HIGH)

### Requirement
- If `updateStudentLocationsBatch()` throws error → don't respond with `success: false`
- Instead: save location anyway, respond with partial data + error flag
- Mobile will queue and retry automatically

### Current Bug (Line 58-63 in controller)
```typescript
} catch (error: any) {
  console.error("[KknAttendanceController] updateLocation error:", error);
  res.status(500).json({
    success: false,  // ← Mobile stops tracking
    error: "INTERNAL_SERVER_ERROR",
    message: error.message || "Gagal memperbarui lokasi mahasiswa",
  });
}
```

### Fix Required
```typescript
} catch (error: any) {
  console.error("[KknAttendanceController] updateLocation error:", error);
  
  // Attempt to save location directly as fallback
  const { latitude, longitude } = req.body;
  try {
    if (latitude && longitude) {
      await prisma.studentLocation.create({
        data: {
          studentId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      });
    }
  } catch (_) {}
  
  // Return partial success — mobile continues tracking
  res.status(200).json({
    success: true,
    data: {
      scheduleId: null,
      status: "ERROR_SAVING_FULL_DATA_BUT_LOCATION_RECORDED",
      message: error.message,
    },
    warning: "Location recorded but attendance calc failed. Will retry.",
  });
}
```

---

## FEATURE 4: Explicit "berlangsung" Status Propagation (HIGH)

### Requirement
- When schedule is active but `activeScheduleId` is null during initial ping → set `status: "berlangsung"`
- Mobile checks `data['activeScheduleId']` to determine if tracking should continue
- If this field is missing/null, mobile stops tracking

### Current Bug
- Line 680 in `updateStudentLocationsBatch()`:
  ```typescript
  scheduleId: activeScheduleId,  // Can be null
  ```
- No explicit "berlangsung" status returned

### Fix Required
```typescript
// Add explicit attendance status
const attendanceStatus = activeScheduleId ? "BERLANGSUNG" : "MENUNGGU_SCHEDULE";

return {
  success: true,
  data: {
    locations: savedLocations,
    scheduleId: activeScheduleId,
    activeScheduleId,
    attendanceStatus,  // ← Explicit
    status: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
    inZoneMinutes,
    ...
  }
};
```

---

## FEATURE 5: Debugging Endpoint for Testing (MEDIUM)

### Requirement
- Add `/api/v1/kkn/location-ping/debug` endpoint that returns:
  - Current active schedules for user
  - Latest GPS location
  - Geofence status
  - Attendance records
- Useful for troubleshooting why pings fail

### Example Response
```typescript
{
  "userId": "...",
  "latestLocation": { lat: -6.8915, lng: 107.6107 },
  "activeSchedules": [{
    "id": "...",
    "title": "...",
    "time": "08:00 - 16:00",
    "latitude": -6.8915,
    "longitude": 107.6107,
    "radius": 150,
    "isActive": true
  }],
  "geofenceStatus": {
    "insideZone": true,
    "distance": 45.2,
    "buffer": 15
  },
  "attendance": {
    "status": "BERLANGSUNG",
    "attendedAt": "2026-08-23T20:00:00Z",
    "inZoneMinutes": 5
  }
}
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: CRITICAL (Must fix for testing to work)
- [ ] Feature 1: Always-valid response format
  - [ ] Update `updateStudentLocationsBatch()` return type
  - [ ] Update controller response wrapping
  - [ ] Test: `/location-ping` always returns 200 with data
  
- [ ] Feature 2: Unified geofence fallback
  - [ ] Extract geofence config from system settings
  - [ ] Use in both `pingLocation()` and `updateStudentLocationsBatch()`
  - [ ] Test: Geofence works with missing schedule lat/lng

### Phase 2: HIGH (Improves reliability)
- [ ] Feature 3: Error handling with fallback
  - [ ] Save location even if full calc fails
  - [ ] Return 200 OK with partial data on error
  - [ ] Test: Mobile continues tracking on backend errors

- [ ] Feature 4: Explicit berlangsung status
  - [ ] Add `attendanceStatus` field to response
  - [ ] Propagate through WebSocket broadcasts
  - [ ] Test: Mobile UI shows "berlangsung" correctly

### Phase 3: MEDIUM (Nice to have)
- [ ] Feature 5: Debug endpoint
  - [ ] Implement `/location-ping/debug`
  - [ ] Test with curl/Postman

---

## TEST CASES

### Test 1: Location ping with no schedule
```bash
curl -X POST http://localhost:3000/api/v1/kkn/location-ping \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -6.8915,
    "longitude": 107.6107
  }'
```
**Expected:** HTTP 200, `success: true`, `data.scheduleId: null`

### Test 2: Location ping outside geofence
```bash
curl -X POST http://localhost:3000/api/v1/kkn/location-ping \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -7.0,  # Different location
    "longitude": 107.0
  }'
```
**Expected:** HTTP 200, `success: true`, `status: "DI_LUAR_ZONA"`

### Test 3: Database error handling
- Simulate DB connection failure
- **Expected:** HTTP 200, `success: true`, partial data with warning

---

## RELATED MOBILE FIXES

Mobile side already handles:
- ✅ Grace period for initial GPS lock (60 seconds)
- ✅ Geofence radius increased to 200m
- ✅ Continue tracking on backend error
- ✅ Offline queue with retry
- ✅ Testing mode to bypass geofence

Backend must align with these to make it work end-to-end.

---

**Document Created:** 2026-08-23T20:57:27Z
**Author:** Kuro Agent
**Status:** READY FOR BACKEND IMPLEMENTATION
