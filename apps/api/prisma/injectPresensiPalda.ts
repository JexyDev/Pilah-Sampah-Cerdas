import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("==================================================================");
  console.log("🚀 EKSEKUSI PENYESUAIAN PRESENSI & POIN KKN (MUHAMMAD PALDA SATRIO)");
  console.log("==================================================================\n");

  // 1. Cari user Muhammad Palda Satrio berdasarkan NIM, No HP, atau Nama
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { nim: "10524144" },
        { phone: { contains: "81384336722" } },
        { phone: { contains: "81257320600" } },
        { name: { contains: "Palda", mode: "insensitive" } },
      ],
    },
    include: {
      kelompok: true,
    },
  });

  if (!user) {
    console.error("❌ ERROR: Data mahasiswa 'Muhammad Palda Satrio' tidak ditemukan di database.");
    console.log("Mohon periksa data NIM/No HP pada tabel pengguna.");
    return;
  }

  console.log(`✅ Data Mahasiswa Ditemukan:`);
  console.log(`   - ID Pengguna : ${user.id}`);
  console.log(`   - Nama        : ${user.name}`);
  console.log(`   - NIM         : ${user.nim || "-"}`);
  console.log(`   - No. HP      : ${user.phone}`);
  console.log(`   - Kelompok    : ${user.kelompok?.name || "Tidak terdaftar"}`);
  console.log(`   - Poin Saat Ini: ${user.totalPoints ?? 0} Poin\n`);

  // 2. Tentukan rentang waktu kegiatan hari Senin (31 Agustus 2026 atau tanggal hari Senin terkait)
  // Format WIB (UTC+7): 08:10 WIB (01:10 UTC) sampai 16:00 WIB (09:00 UTC)
  const targetDateStr = "2026-08-31"; // Tanggal pelaksanaan kegiatan (Senin)
  const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

  // Cari jadwal kegiatan kelompok mahasiswa pada tanggal tersebut
  let schedule = await prisma.schedule.findFirst({
    where: {
      kelompokId: user.kelompokId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Jika jadwal belum ada pada tanggal tersebut, cari jadwal aktif terakhir kelompok atau buat jadwal fallback
  if (!schedule) {
    console.log(`⚠️ Jadwal KKN khusus tanggal ${targetDateStr} belum ditemukan, mencari jadwal kelompok terkait...`);
    schedule = await prisma.schedule.findFirst({
      where: {
        kelompokId: user.kelompokId,
      },
      orderBy: { date: "desc" },
    });
  }

  // Jika masih tidak ada jadwal, buat entri jadwal resmi untuk tanggal tersebut
  if (!schedule) {
    console.log(`📝 Membuat jadwal KKN resmi untuk Kelompok 5 Sadang Serang pada ${targetDateStr}...`);
    schedule = await prisma.schedule.create({
      data: {
        title: "Penugasan KKN Tematik Coblong (Sadang Serang)",
        category: "KKN",
        date: new Date(`${targetDateStr}T00:00:00.000Z`),
        time: "08:00 - 16:00",
        location: "RW 03 & RW 04 Kelurahan Sadang Serang",
        kelompokId: user.kelompokId,
        latitude: -6.8850,
        longitude: 107.6180,
        radius: 500,
        statusKegiatan: "AKTIF",
      },
    });
  }

  console.log(`✅ Jadwal KKN Ditemukan/Diverifikasi:`);
  console.log(`   - Schedule ID: ${schedule.id}`);
  console.log(`   - Judul      : ${schedule.title}`);
  console.log(`   - Lokasi     : ${schedule.location || "-"}`);
  console.log(`   - Tanggal    : ${schedule.date.toISOString().slice(0, 10)}\n`);

  // 3. Upsert Presensi Kehadiran (Check-In & Check-Out)
  const checkInTime = new Date(`${targetDateStr}T01:10:00.000Z`); // 08.10 WIB
  const checkOutTime = new Date(`${targetDateStr}T09:00:00.000Z`); // 16.00 WIB
  const totalDurationMinutes = 470; // 08.10 - 16.00 (7 Jam 50 Menit)

  const attendance = await prisma.activityAttendance.upsert({
    where: {
      studentId_scheduleId: {
        studentId: user.id,
        scheduleId: schedule.id,
      },
    },
    update: {
      status: "HADIR",
      attendedAt: checkInTime,
      checkOutAt: checkOutTime,
      actualInZoneMinutes: totalDurationMinutes,
      method: "ADMIN_OVERRIDE",
      deskripsiKegiatan:
        "Mengikuti gaslah dalam mengambil dan mengelola sampah organik, Rapat dengan RT/RW 03 dan 04 (Koreksi Admin)",
      latitude: schedule.latitude || -6.8850,
      longitude: schedule.longitude || 107.6180,
    },
    create: {
      studentId: user.id,
      scheduleId: schedule.id,
      status: "HADIR",
      attendedAt: checkInTime,
      checkOutAt: checkOutTime,
      actualInZoneMinutes: totalDurationMinutes,
      method: "ADMIN_OVERRIDE",
      deskripsiKegiatan:
        "Mengikuti gaslah dalam mengambil dan mengelola sampah organik, Rapat dengan RT/RW 03 dan 04 (Koreksi Admin)",
      latitude: schedule.latitude || -6.8850,
      longitude: schedule.longitude || 107.6180,
    },
  });

  console.log(`✅ Status Presensi Berhasil Diperbarui:`);
  console.log(`   - ID Presensi : ${attendance.id}`);
  console.log(`   - Status      : ${attendance.status}`);
  console.log(`   - Jam Masuk   : 08.10 WIB`);
  console.log(`   - Jam Pulang  : 16.00 WIB`);
  console.log(`   - Durasi Total: ${attendance.actualInZoneMinutes} Menit\n`);

  // 4. Periksa dan Tambahkan Riwayat Poin (Check-In & Check-Out)
  // Periksa apakah poin Check-In (+10) sudah ada
  const existingCheckInPoint = await prisma.pointHistory.findFirst({
    where: {
      userId: user.id,
      description: { contains: "Check-In" },
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  // Periksa apakah poin Check-Out (+10) sudah ada
  const existingCheckOutPoint = await prisma.pointHistory.findFirst({
    where: {
      userId: user.id,
      description: { contains: "Check-Out" },
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  let addedPoints = 0;

  if (!existingCheckInPoint) {
    await prisma.pointHistory.create({
      data: {
        userId: user.id,
        points: 10,
        description: `Bonus kehadiran (Check-In) KKN: ${schedule.title} (ADMIN_OVERRIDE)`,
        kategori: "PARTISIPASI_STREAK",
        redeemable: false,
        createdAt: checkInTime,
      },
    });
    addedPoints += 10;
    console.log(`   + Menambahkan 10 poin (Bonus Check-In)`);
  }

  if (!existingCheckOutPoint) {
    await prisma.pointHistory.create({
      data: {
        userId: user.id,
        points: 10,
        description: `Bonus kepulangan (Check-Out) presensi KKN: ${schedule.title} (ADMIN_OVERRIDE)`,
        kategori: "PARTISIPASI_STREAK",
        redeemable: false,
        createdAt: checkOutTime,
      },
    });
    addedPoints += 10;
    console.log(`   + Menambahkan 10 poin (Bonus Check-Out / Selesai Kegiatan)`);
  }

  if (addedPoints > 0) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: {
          increment: addedPoints,
        },
      },
    });
    console.log(`\n🎉 Total Poin ${user.name} berhasil diperbarui dari ${user.totalPoints ?? 0} menjadi ${updatedUser.totalPoints} Poin (+${addedPoints} Poin).`);
  } else {
    console.log(`\nℹ️ Poin kehadiran untuk tanggal tersebut sudah lengkap tercatat di sistem.`);
  }

  console.log("\n==================================================================");
  console.log("✅ EKSEKUSI SELESAI DENGAN SUKSES!");
  console.log("==================================================================");
}

run()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat eksekusi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
