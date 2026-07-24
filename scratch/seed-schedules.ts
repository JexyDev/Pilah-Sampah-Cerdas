import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding schedules into database...");

  // Clean existing schedules
  await prisma.schedule.deleteMany({});

  const schedules = [
    {
      title: "Uji Nyata Absensi Radius KKN",
      category: "Monitoring",
      location: "PT Makerindo Prima Solusi",
      date: new Date(), // Hari ini
      time: "08:00 - 18:00 WIB",
      latitude: -6.974052,
      longitude: 107.663588,
      radius: 100,
    },
    {
      title: "Penyuluhan Kompos Rumah Tangga",
      category: "Edukasi",
      location: "Bale RW 06 Kelurahan Dago",
      date: new Date("2026-07-25T09:00:00.000Z"),
      time: "09:00 - 11:30 WIB",
    },
    {
      title: "Penjemputan Residu TPA Mingguan",
      category: "Operasional",
      location: "Sektor Dago Coblong",
      date: new Date("2026-07-27T06:00:00.000Z"),
      time: "06:00 - 08:00 WIB",
    },
    {
      title: "Flash Drop Challenge: Pilah Cerdas",
      category: "Event",
      location: "Taman Dago Park",
      date: new Date("2026-07-28T15:00:00.000Z"),
      time: "15:00 - 17:00 WIB",
    },
    {
      title: "Evaluasi KKN & RW Pendampingan",
      category: "Monitoring",
      location: "Kantor Kelurahan Dago",
      date: new Date("2026-07-30T13:00:00.000Z"),
      time: "13:00 - 15:00 WIB",
    },
    {
      title: "Distribusi Pakan Maggot Sektor 1",
      category: "Fasilitas",
      location: "Rumah Maggot Dago Giri",
      date: new Date("2026-08-01T08:00:00.000Z"),
      time: "08:00 - 10:00 WIB",
    },
    {
      title: "Sosialisasi Pembuatan Loseda Mandiri",
      category: "Edukasi",
      location: "RT 02 / RW 06 Dago",
      date: new Date("2026-08-03T10:00:00.000Z"),
      time: "10:00 - 12:00 WIB",
    },
    {
      title: "Audit Diskrepansi AI DLH Bandung",
      category: "Monitoring",
      location: "Balaikota Bandung",
      date: new Date("2026-08-05T09:00:00.000Z"),
      time: "09:00 - 12:00 WIB",
    },
    {
      title: "Penyaluran Hasil Panen Maggot KKN",
      category: "Operasional",
      location: "Budidaya Lele RT 01",
      date: new Date("2026-08-07T14:00:00.000Z"),
      time: "14:00 - 16:00 WIB",
    },
  ];

  for (const s of schedules) {
    const created = await prisma.schedule.create({
      data: s,
    });
    console.log(`Created schedule: ${created.title} (${created.category})`);
  }

  console.log("Successfully seeded 8 schedules!");
}

main()
  .catch((e) => {
    console.error("Failed seeding schedules:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
