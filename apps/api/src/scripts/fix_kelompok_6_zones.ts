import { prisma } from "../lib/prisma.js";
import { smartZoneService } from "../services/smartZoneService.js";

async function executeFix() {
  console.log("=== EKSEKUSI PEMBAHARUAN ZONA KELOMPOK 6 SADANG SERANG ===");

  const k6 = await prisma.kelompokKkn.findFirst({
    where: { name: "Kelompok 6 Sadang Serang" },
    include: { poskoKkn: true }
  });

  if (!k6) {
    throw new Error("Kelompok 6 Sadang Serang tidak ditemukan di database!");
  }

  const kelompokId = k6.id;
  console.log(`Kelompok ID: ${kelompokId}, Nama: ${k6.name}`);

  // 1. Pastikan Cakupan RW adalah [1, 2, 5]
  await prisma.kelompokKkn.update({
    where: { id: kelompokId },
    data: { cakupanRw: [1, 2, 5] }
  });
  console.log("? Cakupan RW dipastikan [1, 2, 5]");

  // 2. Daftar Titik Posko untuk RW 01, RW 02, RW 05 Sadang Serang
  const poskoTargets = [
    {
      nama: "Posko KKN RW 01 Sadang Serang (Kelompok 6)",
      alamat: "Jl. Sadang Serang, Wilayah RW 01, Kelurahan Sadang Serang, Kecamatan Coblong",
      latitude: -6.8897387,
      longitude: 107.6292351,
      radius: 500,
      keterangan: "Titik Geofence Resmi RW 01 Kelompok 6 Sadang Serang"
    },
    {
      nama: "Posko KKN RW 02 Sadang Serang (Kelompok 6)",
      alamat: "Jl. Sadang Serang, Wilayah RW 02, Kelurahan Sadang Serang, Kecamatan Coblong",
      latitude: -6.8877279,
      longitude: 107.6276316,
      radius: 600, // Radius ekstra 600m agar seluruh skala RW 02 ter-cover penuh
      keterangan: "Titik Geofence Resmi RW 02 Kelompok 6 Sadang Serang (Skala Menyeluruh)"
    },
    {
      nama: "Posko KKN RW 05 Sadang Serang (Kelompok 6)",
      alamat: "Jl. Sadang Serang, Wilayah RW 05, Kelurahan Sadang Serang, Kecamatan Coblong",
      latitude: -6.8930352,
      longitude: 107.6231782,
      radius: 500,
      keterangan: "Titik Geofence Resmi RW 05 Kelompok 6 Sadang Serang"
    }
  ];

  // Hapus posko multi lama kelompok 6 jika ada duplikat sebelumnya
  await (prisma as any).poskoKknMulti.deleteMany({
    where: { kelompokId }
  });

  for (const p of poskoTargets) {
    const created = await (prisma as any).poskoKknMulti.create({
      data: {
        kelompokId,
        nama: p.nama,
        alamat: p.alamat,
        latitude: p.latitude,
        longitude: p.longitude,
        radius: p.radius,
        isUtama: false,
        keterangan: p.keterangan
      }
    });
    console.log(`? Multi-Posko Terdaftar: ${created.nama} (Lat: ${created.latitude}, Lng: ${created.longitude}, Radius: ${created.radius}m)`);
  }

  // 3. Update / Pastikan Posko Utama memiliki radius memadai
  if (k6.poskoKkn) {
    await prisma.poskoKkn.update({
      where: { id: k6.poskoKkn.id },
      data: {
        radius: 500
      }
    });
    console.log("? Posko Utama diperbarui");
  }

  // 4. Update Smart Zone autoPolygon
  await smartZoneService.updateGroupAutoPolygon(kelompokId);
  console.log("? Smart Zone Auto-Polygon berhasil dihitung ulang");

  // 5. Update Jadwal Hari Ini agar presensi langsung sinkron
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const updatedScheds = await prisma.schedule.updateMany({
    where: {
      kelompokId,
      date: { gte: startOfDay, lte: endOfDay }
    },
    data: {
      radius: 600
    }
  });
  console.log(`? Sinkronisasi jadwal hari ini: ${updatedScheds.count} jadwal diperbarui`);

  // 6. Verifikasi Akhir
  const allPoskos = await (prisma as any).poskoKknMulti.findMany({
    where: { kelompokId }
  });
  console.log(`\n?? SELESAI: Total ${allPoskos.length} Multi-Posko aktif untuk Kelompok 6 Sadang Serang.`);
}

executeFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
