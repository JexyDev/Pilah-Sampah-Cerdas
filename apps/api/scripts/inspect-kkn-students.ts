import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const names = ["Dani Nurhalim", "Najwa Intan Putri", "Chandra Nur Mulyani"];
  
  console.log("=== CHECKING STUDENTS ===");
  const students = await prisma.user.findMany({
    where: {
      OR: [
        { name: { in: names, mode: "insensitive" } },
        { name: { contains: "Dani", mode: "insensitive" } },
        { name: { contains: "Najwa", mode: "insensitive" } },
        { name: { contains: "Chandra", mode: "insensitive" } },
      ],
    },
    include: {
      role: true,
      studentProfile: {
        include: {
          kelompok: {
            include: {
              poskoKkn: true,
              dpl: true,
            },
          },
          assignedRw: {
            include: {
              kelurahan: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${students.length} matching users:`);
  for (const s of students) {
    console.log(JSON.stringify({
      id: s.id,
      name: s.name,
      phone: s.phone,
      role: s.role.name,
      kkn: s.studentProfile ? {
        id: s.studentProfile.id,
        nim: s.studentProfile.nim,
        jurusan: s.studentProfile.jurusan,
        kelompok: s.studentProfile.kelompok?.name,
        kelompokId: s.studentProfile.kelompokId,
        dpl: s.studentProfile.kelompok?.dpl?.name,
        rw: s.studentProfile.assignedRw?.name,
        kelurahan: s.studentProfile.assignedRw?.kelurahan?.name,
        posko: s.studentProfile.kelompok?.poskoKkn,
      } : null,
    }, null, 2));
  }

  // Check schedules
  console.log("\n=== CHECKING SCHEDULES / TIMELINES ===");
  const kelompokIds = students.map(s => s.studentProfile?.kelompokId).filter(Boolean) as string[];
  const schedules = await prisma.schedule.findMany({
    where: {
      kelompokId: { in: kelompokIds },
    },
  });
  console.log("Schedules for their kelompok:", JSON.stringify(schedules, null, 2));

  // Check Presensi Mandiri today
  console.log("\n=== CHECKING EXISTING PRESENSI MANDIRI ===");
  const presensi = await prisma.presensiMandiri.findMany({
    where: {
      studentId: { in: students.map(s => s.id) },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("Recent Presensi Mandiri:", JSON.stringify(presensi, null, 2));

  // Check ActivityAttendance
  console.log("\n=== CHECKING ACTIVITY ATTENDANCE ===");
  const activityAttendance = await prisma.activityAttendance.findMany({
    where: {
      studentId: { in: students.map(s => s.id) },
    },
    orderBy: { attendedAt: "desc" },
    take: 10,
  });
  console.log("Recent Activity Attendance:", JSON.stringify(activityAttendance, null, 2));

  // Check LogbookKkn
  console.log("\n=== CHECKING LOGBOOK KKN ===");
  const logbooks = await prisma.logbookKkn.findMany({
    where: {
      penulisId: { in: students.map(s => s.id) },
    },
    orderBy: { tanggalKegiatan: "desc" },
    take: 10,
  });
  console.log("Recent Logbooks:", JSON.stringify(logbooks, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
