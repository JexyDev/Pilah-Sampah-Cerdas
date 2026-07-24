/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/hashUtils.js";

const prisma = new PrismaClient();

async function main() {
  console.log("=== INJECT DATA SKENARIO PERCOBAAN ABSEN RADIUS KKN ===");

  // 1. Dapatkan peran KKN
  const kknRole = await prisma.role.findUnique({
    where: { name: "MAHASISWA_KKN" },
  });
  if (!kknRole) {
    throw new Error("Peran 'MAHASISWA_KKN' tidak ditemukan. Harap jalankan seed standard terlebih dahulu.");
  }

  // Dapatkan area RT/RW default untuk KKN
  const defaultArea = await prisma.rtRwArea.findFirst();
  if (!defaultArea) {
    throw new Error("Data wilayah_rt_rw kosong. Harap jalankan seed standard.");
  }

  // 2. Dapatkan kegiatan "Uji Nyata Absensi Radius KKN" hari ini
  let schedule = await prisma.schedule.findFirst({
    where: {
      title: "Uji Nyata Absensi Radius KKN",
    },
  });

  if (!schedule) {
    console.log("Membuat Jadwal kegiatan KKN hari ini...");
    schedule = await prisma.schedule.create({
      data: {
        title: "Uji Nyata Absensi Radius KKN",
        category: "Monitoring",
        location: "PT Makerindo Prima Solusi",
        date: new Date(),
        time: "08:00 - 18:00 WIB",
        latitude: -6.974052,
        longitude: 107.663588,
        radius: 100,
      },
    });
  }

  console.log(`Kegiatan Uji: ${schedule.title} di (${schedule.latitude}, ${schedule.longitude}) Radius: ${schedule.radius}m`);

  // Hapus data uji lama khusus absensi/lokasi
  await prisma.activityAttendance.deleteMany({
    where: { scheduleId: schedule.id },
  });
  console.log("Membersihkan data absensi lama...");

  // 3. Setup 10 KKN Students
  const studentNames = [
    { name: "Budi ITB", nim: "10123001", email: "budi.kkn@psc.id", phone: "+628111111118" },
    { name: "Siti UNIKOM", nim: "10123002", email: "siti.kkn@psc.id", phone: "+628111111119" },
    { name: "Agus ITB", nim: "10123003", email: "agus.kkn@psc.id", phone: "+628111111120" },
    { name: "Dewi UNPAD", nim: "10123004", email: "dewi.kkn@psc.id", phone: "+628111111121" },
    { name: "Rian ITB", nim: "10123005", email: "rian.kkn@psc.id", phone: "+628111111122" },
    { name: "Sari UPI", nim: "10123006", email: "sari.kkn@psc.id", phone: "+628111111123" },
    { name: "Eko ITB", nim: "10123007", email: "eko.kkn@psc.id", phone: "+628111111124" },
    { name: "Mega UNIKOM", nim: "10123008", email: "mega.kkn@psc.id", phone: "+628111111125" },
    { name: "Joko ITB", nim: "10123009", email: "joko.kkn@psc.id", phone: "+628111111126" },
    { name: "Ani UNPAD", nim: "10123010", email: "ani.kkn@psc.id", phone: "+628111111127" },
  ];

  const studentsList = [];
  const hashedPassword = await hashPassword("password123");

  for (const s of studentNames) {
    let user = await prisma.user.findUnique({
      where: { phone: s.phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          phone: s.phone,
          password: hashedPassword,
          roleId: kknRole.id,
          rtRwId: defaultArea.id,
          status: "Aktif",
        },
      });

      await prisma.studentKkn.create({
        data: {
          userId: user.id,
          nim: s.nim,
          jurusan: "Informatika",
          fakultas: "Teknik",
          noWa: s.phone,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          whitelistStatus: "APPROVED",
          assignedPolygonId: defaultArea.id,
        },
      });
      console.log(`Membuat akun Mahasiswa KKN: ${s.name}`);
    }
    studentsList.push(user);
  }

  // 4. Bersihkan koordinat lama mahasiswa KKN ini agar tidak konflik
  const studentIds = studentsList.map(s => s.id);
  await prisma.studentLocation.deleteMany({
    where: { studentId: { in: studentIds } },
  });

  // 5. Injeksi GPS & Status Skenario
  // Center (PT Makerindo): -6.974052, 107.663588
  // Radius: 100m

  console.log("\nMenginjeksi data lokasi & riwayat absensi mahasiswa...");

  // Skenario A: Mahasiswa MASIH DI LOKASI & HADIR (Dalam Radius)
  // Jarak sekitar 15 - 50 meter dari kantor Makerindo
  const inRadiusPositions = [
    { lat: -6.974100, lng: 107.663600 }, // ~6m
    { lat: -6.973950, lng: 107.663700 }, // ~17m
    { lat: -6.974200, lng: 107.663400 }, // ~26m
    { lat: -6.974300, lng: 107.663800 }, // ~38m
  ];

  for (let i = 0; i < 4; i++) {
    const student = studentsList[i];
    const pos = inRadiusPositions[i];

    // 1. Simpan koordinat lokasi terbaru
    await prisma.studentLocation.create({
      data: {
        studentId: student.id,
        latitude: pos.lat,
        longitude: pos.lng,
        recordedAt: new Date(),
      },
    });

    // 2. Tandai Absen (2 manual, 2 otomatis)
    const method = i % 2 === 0 ? "MANUAL" : "OTOMATIS";
    await prisma.activityAttendance.create({
      data: {
        studentId: student.id,
        scheduleId: schedule.id,
        method: method,
        latitude: pos.lat,
        longitude: pos.lng,
        status: "DALAM_RADIUS",
        attendedAt: new Date(Date.now() - (i * 10 * 60 * 1000)), // beberapa menit lalu
      },
    });

    // 3. Tambah Poin KKN (+10)
    await prisma.pointHistory.create({
      data: {
        userId: student.id,
        points: 10,
        description: `Bonus kehadiran KKN: ${schedule.title} (${method})`,
        kategori: "PARTISIPASI_STREAK",
        redeemable: false,
      },
    });

    console.log(`[HADIR - DI LOKASI] ${student.name} (${method}) di posisi: ${pos.lat}, ${pos.lng}`);
  }

  // Skenario B: Mahasiswa HADIR tapi SUDAH MENINGGALKAN LOKASI (Lepas Radius)
  // Sudah absen sebelumnya, tapi GPS terbaru menunjukkan dia sudah berjarak jauh (misal di Coblong)
  const outRadiusPositions = [
    { lat: -6.891500, lng: 107.610700 }, // Coblong (~11 km jauhnya)
    { lat: -6.892000, lng: 107.610000 },
  ];

  for (let i = 4; i < 6; i++) {
    const student = studentsList[i];
    const pos = outRadiusPositions[i - 4];

    // 1. Simpan koordinat lokasi terbaru (diluar radius)
    await prisma.studentLocation.create({
      data: {
        studentId: student.id,
        latitude: pos.lat,
        longitude: pos.lng,
        recordedAt: new Date(),
      },
    });

    // 2. Tandai Absen (Sudah absen saat di lokasi tadi)
    await prisma.activityAttendance.create({
      data: {
        studentId: student.id,
        scheduleId: schedule.id,
        method: "MANUAL",
        latitude: -6.974052, // Koordinat saat dia absen di radius tadi
        longitude: 107.663588,
        status: "DALAM_RADIUS",
        attendedAt: new Date(Date.now() - (i * 15 * 60 * 1000)),
      },
    });

    // 3. Tambah Poin KKN (+10)
    await prisma.pointHistory.create({
      data: {
        userId: student.id,
        points: 10,
        description: `Bonus kehadiran KKN: ${schedule.title} (MANUAL)`,
        kategori: "PARTISIPASI_STREAK",
        redeemable: false,
      },
    });

    console.log(`[HADIR - LEPAS RADIUS] ${student.name} (Telah Absen, posisi sekarang: ${pos.lat}, ${pos.lng})`);
  }

  // Skenario C: Mahasiswa DI LOKASI tapi BELUM ABSEN (Menunggu Auto-Absen atau manual klik)
  for (let i = 6; i < 8; i++) {
    const student = studentsList[i];
    // Posisi di dalam radius tapi tidak di-insert riwayat absennya
    const pos = { lat: -6.974090, lng: 107.663510 };

    await prisma.studentLocation.create({
      data: {
        studentId: student.id,
        latitude: pos.lat,
        longitude: pos.lng,
        recordedAt: new Date(),
      },
    });

    console.log(`[AKTIF - BELUM ABSEN] ${student.name} di posisi: ${pos.lat}, ${pos.lng}`);
  }

  // Skenario D: Mahasiswa TIDAK TERDETEKSI / TIDAK HADIR
  // GPS mati (tidak ada koordinat StudentLocation dalam 24 jam terakhir)
  for (let i = 8; i < 10; i++) {
    const student = studentsList[i];
    console.log(`[TIDAK TERDETEKSI] ${student.name} (GPS off / tidak ada data)`);
  }

  console.log("\n=== BERHASIL MENGINJEKSI 10 DATA MAHASISWA DENGAN SKENARIO UJI ===");
}

main()
  .catch((e) => {
    console.error("Gagal menginjeksi data uji:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
