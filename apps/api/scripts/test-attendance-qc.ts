import { prisma } from "../src/lib/prisma.js";
import { kknAttendanceService } from "../src/services/kknAttendanceService.js";

async function runAttendanceQC() {
  console.log("=================================================");
  console.log("🚀 STARTING QC & E2E TEST: KKN ATTENDANCE FLOW");
  console.log("=================================================\n");

  // 1. Find a test student user
  const student = await prisma.studentKkn.findFirst({
    include: { user: true, kelompok: true },
  });

  if (!student) {
    console.error("❌ No student found in database to run QC test.");
    process.exit(1);
  }

  console.log(`👤 Test Student: ${student.user.name} (NIM: ${student.nim || "-"}, Kelompok: ${student.kelompok?.name || "N/A"})`);
  const studentUserId = student.userId;

  // 2. Fetch or create an active schedule
  const activeSchedules = await kknAttendanceService.getKegiatanAktif(studentUserId);
  console.log(`📋 Active Schedules Found: ${activeSchedules.length}`);

  if (activeSchedules.length === 0) {
    console.error("❌ No active schedule found for student.");
    process.exit(1);
  }

  const targetSchedule = activeSchedules[0];
  const scheduleId = targetSchedule.id;
  console.log(`🎯 Target Schedule: ${targetSchedule.namaKegiatan} (ID: ${scheduleId})`);
  console.log(`📍 Geofence: Lat ${targetSchedule.lokasi.latitude}, Lng ${targetSchedule.lokasi.longitude}, Radius: ${targetSchedule.lokasi.radiusMeter}m`);

  // Clean up any existing attendance record for this test student and schedule
  await prisma.activityAttendance.deleteMany({
    where: {
      studentId: studentUserId,
      scheduleId: scheduleId,
    },
  });

  // 3. Test Check-In / Mulai Kegiatan
  console.log("\n--- TEST 1: Check-in / Mulai Kegiatan ---");
  const startResult = await kknAttendanceService.mulaiKegiatan(studentUserId, scheduleId, {
    latitude: targetSchedule.lokasi.latitude,
    longitude: targetSchedule.lokasi.longitude,
    deviceInfo: "QC-Tester-Device",
    deskripsiKegiatan: "Mulai kegiatan sosialisasi pilah sampah",
  });

  console.log("✅ Check-in Success:", {
    sessionId: startResult.sessionId,
    statusKehadiran: startResult.statusKehadiran,
    durasiWajibMenit: startResult.durasiWajibMenit,
    actualInZoneMinutes: startResult.actualInZoneMinutes,
  });

  if (startResult.statusKehadiran !== "BERLANGSUNG") {
    throw new Error(`Expected statusKehadiran to be BERLANGSUNG, got ${startResult.statusKehadiran}`);
  }

  // 4. Test GPS Location Ping in Zone
  console.log("\n--- TEST 2: GPS Location Ping Inside Geofence ---");
  const pingResult = await kknAttendanceService.updateStudentLocationsBatch(studentUserId, [
    {
      latitude: targetSchedule.lokasi.latitude,
      longitude: targetSchedule.lokasi.longitude,
      timestamp: new Date().toISOString(),
      inZoneSeconds: 120, // 2 minutes
    },
  ]);

  console.log("✅ Ping Result Inside Zone:", {
    status: pingResult.data.status,
    attendanceStatus: pingResult.data.attendanceStatus,
    actualInZoneMinutes: pingResult.data.actualInZoneMinutes,
  });

  if (pingResult.data.status !== "LAPANGAN") {
    throw new Error(`Expected status to be LAPANGAN, got ${pingResult.data.status}`);
  }

  // 5. Test GPS Location Ping Outside Geofence (Auto-Pause check)
  console.log("\n--- TEST 3: GPS Location Ping Outside Geofence (Auto-Pause) ---");
  const pingOutsideResult = await kknAttendanceService.updateStudentLocationsBatch(studentUserId, [
    {
      latitude: targetSchedule.lokasi.latitude + 0.05, // Far outside
      longitude: targetSchedule.lokasi.longitude + 0.05,
      timestamp: new Date().toISOString(),
    },
  ]);

  console.log("✅ Ping Result Outside Zone:", {
    status: pingOutsideResult.data.status,
  });

  // Verify attendance became TERJEDA in DB
  const pausedAtt = await prisma.activityAttendance.findUnique({
    where: {
      studentId_scheduleId: {
        studentId: studentUserId,
        scheduleId: scheduleId,
      },
    },
  });

  console.log("🔍 Attendance Status after Out-of-Zone:", pausedAtt?.status);
  if (pausedAtt?.status !== "TERJEDA") {
    throw new Error(`Expected attendance status to be TERJEDA, got ${pausedAtt?.status}`);
  }

  // 6. Test Re-entry (Auto-Resume check)
  console.log("\n--- TEST 4: Re-entering Geofence (Auto-Resume) ---");
  await kknAttendanceService.updateStudentLocationsBatch(studentUserId, [
    {
      latitude: targetSchedule.lokasi.latitude,
      longitude: targetSchedule.lokasi.longitude,
      timestamp: new Date().toISOString(),
    },
  ]);

  const resumedAtt = await prisma.activityAttendance.findUnique({
    where: {
      studentId_scheduleId: {
        studentId: studentUserId,
        scheduleId: scheduleId,
      },
    },
  });

  console.log("🔍 Attendance Status after Re-entry:", resumedAtt?.status);
  if (resumedAtt?.status !== "BERLANGSUNG") {
    throw new Error(`Expected attendance status to be BERLANGSUNG, got ${resumedAtt?.status}`);
  }

  // Simulate duration for test
  await prisma.activityAttendance.update({
    where: { id: resumedAtt.id },
    data: { actualInZoneMinutes: 130 }, // 130 minutes (exceeds 120 target)
  });

  // 7. Test Check-Out / Selesai Kegiatan
  console.log("\n--- TEST 5: Selesai Kegiatan / Check-Out ---");
  const checkoutResult = await kknAttendanceService.selesaiKegiatan(studentUserId, scheduleId, {
    totalDurasiDalamZonaMenit: 130,
    deskripsiKegiatan: "Kegiatan pendataan warga RW 03 selesai dilaksanakan dengan lancar.",
    latitude: targetSchedule.lokasi.latitude,
    longitude: targetSchedule.lokasi.longitude,
  });

  console.log("✅ Checkout Result:", {
    status: checkoutResult.data.status,
    statusDisplay: checkoutResult.data.statusDisplay,
    isMemenuhiDurasi: checkoutResult.data.isMemenuhiDurasi,
    durationMinutes: checkoutResult.data.durationMinutes,
    durationFormatted: checkoutResult.data.durationFormatted,
  });

  if (checkoutResult.data.status !== "HADIR_MEMENUHI") {
    throw new Error(`Expected checkout status to be HADIR_MEMENUHI, got ${checkoutResult.data.status}`);
  }

  // 8. Test Presensi History for Mobile
  console.log("\n--- TEST 6: Presensi History for Mobile ---");
  const history = await kknAttendanceService.getPresensiHistory(studentUserId, scheduleId);
  console.log("✅ Presensi History:", {
    statusDisplay: history?.statusDisplay,
    isMemenuhiDurasi: history?.isMemenuhiDurasi,
    durasiAktualMenit: history?.durasiAktualMenit,
    durasiTargetMenit: history?.durasiTargetMenit,
    isHadir: history?.isHadir,
  });

  if (!history || history.durasiAktualMenit !== 130 || !history.isMemenuhiDurasi) {
    throw new Error("Presensi history verification failed!");
  }

  // 9. Test Laporan Presensi for Web Dashboard
  console.log("\n--- TEST 7: Laporan Rekap Presensi for Web Dashboard ---");
  const report = await kknAttendanceService.getLaporanPresensi({
    studentId: studentUserId,
    limit: 5,
  });

  console.log("✅ Laporan Summary:", report.summary);
  console.log(`✅ Items count: ${report.items.length}`);
  const targetReportItem = report.items.find((it) => it.scheduleId === scheduleId);
  if (targetReportItem) {
    console.log("✅ Target Report Item:", {
      namaMahasiswa: targetReportItem.namaMahasiswa,
      namaKegiatan: targetReportItem.namaKegiatan,
      durasiMenit: targetReportItem.durasiMenit,
      durasiFormatted: targetReportItem.durasiFormatted,
      statusDisplay: targetReportItem.statusDisplay,
      isMemenuhiDurasi: targetReportItem.isMemenuhiDurasi,
      deskripsiKegiatan: targetReportItem.deskripsiKegiatan,
    });
  }

  // 10. Test Timesheet Summary
  console.log("\n--- TEST 8: Timesheet Summary ---");
  const timesheet = await kknAttendanceService.getTimesheetSummary({
    studentId: studentUserId,
  });

  console.log("✅ Timesheet Target Rules:", timesheet.targetRules);
  const studentTimesheet = timesheet.students.find((s) => s.studentId === studentUserId);
  console.log("✅ Student Timesheet Progress:", {
    studentName: studentTimesheet?.studentName,
    totalMinutes: studentTimesheet?.totalMinutes,
    totalHours: studentTimesheet?.totalHours,
    progressPercentage: studentTimesheet?.progressPercentage,
    totalDaysAttended: studentTimesheet?.totalDaysAttended,
    fulfilledTargetDays: studentTimesheet?.fulfilledTargetDays,
  });

  console.log("\n=================================================");
  console.log("🎉 ALL ATTENDANCE QC & E2E TESTS PASSED 100%!");
  console.log("=================================================\n");
}

runAttendanceQC()
  .catch((err) => {
    console.error("❌ QC TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
