import { prisma } from "../lib/prisma.js";
import { smartZoneService } from "../services/smartZoneService.js";

async function executeFix() {
  console.log("=== EKSEKUSI PEMBAHARUAN ZONA KELOMPOK 4 SADANG SERANG ===");

  const k4 = await prisma.kelompokKkn.findFirst({
    where: { name: "Kelompok 4 Sadang Serang" },
    include: { poskoKkn: true }
  });

  if (!k4) {
    throw new Error("Kelompok 4 Sadang Serang tidak ditemukan di database!");
  }

  const kelompokId = k4.id;
  console.log(`Kelompok ID: ${kelompokId}, Nama: ${k4.name}`);

  // 1. Pastikan Cakupan RW adalah ["9", "10", "11"]
  await prisma.kelompokKkn.update({
    where: { id: kelompokId },
    data: { cakupanRw: ["9", "10", "11"] }
  });
  console.log("✓ Cakupan RW dipastikan [9, 10, 11]");

  // 2. Daftar Titik Posko untuk RW 09, RW 10, RW 11 Sadang Serang
  const poskoTargets = [
    {
      nama: "Balai RW 10 Sadang Serang",
      alamat: "Gang Puyuh Dalam III, Sadang Serang, Kecamatan Coblong",
      latitude: -6.896811,
      longitude: 107.62427,
      radius: 500,
      keterangan: "Posko Kegiatan Resmi Balai RW 10 Sadang Serang"
    },
    {
      nama: "Lapang Putar Sadang Serang",
      alamat: "Lapangan Puter, Sadang Serang, Kecamatan Coblong",
      latitude: -6.898042,
      longitude: 107.622719,
      radius: 500,
      keterangan: "Posko Lapangan Kegiatan Sadang Serang"
    },
    {
      nama: "Wilayah Binaan RW 09 Sadang Serang",
      alamat: "Wilayah Binaan RW 09, Kelurahan Sadang Serang, Kecamatan Coblong",
      latitude: -6.896200,
      longitude: 107.623500,
      radius: 500,
      keterangan: "Titik Geofence Resmi RW 09 Sadang Serang"
    },
    {
      nama: "Wilayah Binaan RW 11 Sadang Serang",
      alamat: "Wilayah Binaan RW 11, Kelurahan Sadang Serang, Kecamatan Coblong",
      latitude: -6.897500,
      longitude: 107.625500,
      radius: 500,
      keterangan: "Titik Geofence Resmi RW 11 Sadang Serang"
    },
    {
      nama: "Kegiatan Gaslah RW 10 (Penguburan Sampah RW 15)",
      alamat: "Lapangan Parkir Jl. Belakang Pasar, RT 10 / RW 15, Kel. Sadang Serang, Kec. Coblong",
      latitude: -6.89225459,
      longitude: 107.62492542,
      radius: 500,
      keterangan: "Lokasi kegiatan penggalian & penguburan sampah organik Gaslah RW 10 di RW 15 Sadang Serang"
    }
  ];

  // Hapus posko multi kampus UNIKOM dan duplikat lama untuk kelompok 4
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
    console.log(`✓ Multi-Posko Terdaftar: ${created.nama} (Lat: ${created.latitude}, Lng: ${created.longitude}, Radius: ${created.radius}m)`);
  }

  // 3. Update / Pastikan Posko Utama memiliki radius memadai dan mengarah ke Sadang Serang
  if (k4.poskoKkn) {
    await prisma.poskoKkn.update({
      where: { id: k4.poskoKkn.id },
      data: {
        nama: "Posko KKN Kelompok 4 Sadang Serang",
        alamat: "Jl. Caladi Dalam No.10-8, Sadang Serang, Kecamatan Coblong, Kota Bandung, Jawa Barat 40133",
        latitude: -6.89688437,
        longitude: 107.62287534,
        radius: 500
      }
    });
    console.log("✓ Posko Utama diperbarui ke Jl. Caladi Dalam No.10-8 (Radius 500m)");
  }

  // 4. Update Smart Zone autoPolygon
  await smartZoneService.updateGroupAutoPolygon(kelompokId);
  console.log("✓ Smart Zone Auto-Polygon berhasil dihitung ulang");

  // 5. Normalisasi Judul dan Lokasi Jadwal Hari Ini agar presensi langsung sinkron ke Sadang Serang
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const updatedScheds = await prisma.schedule.updateMany({
    where: {
      kelompokId,
      date: { gte: startOfDay, lte: endOfDay }
    },
    data: {
      title: "Kegiatan Harian Posko KKN Kelompok 4 Sadang Serang",
      location: "Posko KKN Kelompok 4 Sadang Serang (Jl. Caladi / Balai RW 10)",
      latitude: -6.89688437,
      longitude: 107.62287534,
      radius: 600
    }
  });
  console.log(`✓ Sinkronisasi jadwal hari ini: ${updatedScheds.count} jadwal dinormalisasi`);

  // 6. Verifikasi Akhir
  const allPoskos = await (prisma as any).poskoKknMulti.findMany({
    where: { kelompokId }
  });
  console.log(`\n🎉 SELESAI: Total ${allPoskos.length} Multi-Posko aktif untuk Kelompok 4 Sadang Serang.`);
}

executeFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
