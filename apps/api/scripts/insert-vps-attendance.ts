import { Client } from "ssh2";

const config = {
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "",
};

function execCommand(conn: Client, cmd: string): Promise<{ code: number; output: string; error: string }> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = "";
      let error = "";
      stream
        .on("close", (code: number, signal: string) => {
          resolve({ code, output, error });
        })
        .on("data", (data: Buffer) => {
          output += data.toString();
        })
        .stderr.on("data", (data: Buffer) => {
          error += data.toString();
        });
    });
  });
}

async function main() {
  const conn = new Client();
  console.log("Connecting to VPS 157.10.252.252...");

  conn
    .on("ready", async () => {
      console.log("SSH Connected.");

      const insertScript = `
        cd /home/maker/Pilah-Sampah-Cerdas-new/apps/api &&
        node -r dotenv/config -e '
          const { PrismaClient } = require("@prisma/client");
          const prisma = new PrismaClient();

          async function run() {
            const kelompokId = "c795ec26-571b-459f-9a6c-03e107987ae4"; // Kelompok 4 Lebak Gede
            const scheduleId = "a0dcf99a-189b-4c7a-b0f2-efa3d210ec7e"; // Jadwal 28 Agustus 2026

            const students = [
              {
                id: "266e9630-be32-48bb-9aa8-40fdfd92e476",
                name: "Dani Nurhalim",
                role: "Ketua Kelompok 4 Lebak Gede",
                isKetua: true,
              },
              {
                id: "d2bbbb93-3d73-49ac-ab44-2183dbdcd0cd",
                name: "Najwa Intan Putri Permata",
                role: "Anggota Kelompok 4 Lebak Gede",
                isKetua: false,
              },
              {
                id: "d38fe3be-b1fe-4f02-bcc1-a5afefcc4254",
                name: "Chandra Nur Mulyani",
                role: "Anggota Kelompok 4 Lebak Gede",
                isKetua: false,
              }
            ];

            const lat = -6.89183666;
            const lng = 107.61909301;
            const checkIn = new Date("2026-08-28T00:00:00.000Z"); // 07:00 WIB
            const checkOut = new Date("2026-08-28T07:00:00.000Z"); // 14:00 WIB
            const durasiMenit = 420; // 7 jam

            const deskripsi = "Observasi dan sosialisasi kepada pihak ketua RW, RT, dan petugas gaslah setempat";
            const deskripsiLogbook = "Observasi wilayah dan sosialisasi kepada pihak ketua RW, RT, dan petugas gaslah setempat setelah pengurusan surat penugasan dari kelurahan.";
            const tempat = "Kelurahan Lebak Gede (Wilayah RW, RT, dan Petugas Gaslah Setempat)";

            console.log("=== MEMULAI PENAMBAHAN PRESENSI & LOGBOOK DI VPS ===");

            for (const s of students) {
              console.log("\\n-> Memproses Mahasiswa: " + s.name + " (" + s.id + ")...");

              // 1. Activity Attendance (Kehadiran Kegiatan Terjadwal)
              const existingAtt = await prisma.activityAttendance.findUnique({
                where: {
                  studentId_scheduleId: {
                    studentId: s.id,
                    scheduleId: scheduleId
                  }
                }
              });

              if (existingAtt) {
                await prisma.activityAttendance.update({
                  where: { id: existingAtt.id },
                  data: {
                    attendedAt: checkIn,
                    checkOutAt: checkOut,
                    method: "GPS_ACTIVITY",
                    latitude: lat,
                    longitude: lng,
                    status: "HADIR_MEMENUHI",
                    actualInZoneMinutes: durasiMenit,
                    deskripsiKegiatan: deskripsi,
                    platformOs: "ANDROID",
                    jedaLogs: []
                  }
                });
                console.log("  [OK] ActivityAttendance diupdate.");
              } else {
                await prisma.activityAttendance.create({
                  data: {
                    studentId: s.id,
                    scheduleId: scheduleId,
                    attendedAt: checkIn,
                    checkOutAt: checkOut,
                    method: "GPS_ACTIVITY",
                    latitude: lat,
                    longitude: lng,
                    status: "HADIR_MEMENUHI",
                    actualInZoneMinutes: durasiMenit,
                    deskripsiKegiatan: deskripsi,
                    platformOs: "ANDROID",
                    jedaLogs: []
                  }
                });
                console.log("  [OK] ActivityAttendance dibuat.");
              }

              // 2. Presensi Mandiri
              const existingPres = await prisma.presensiMandiri.findFirst({
                where: {
                  studentId: s.id,
                  checkInAt: {
                    gte: new Date("2026-08-28T00:00:00.000Z"),
                    lte: new Date("2026-08-28T23:59:59.999Z")
                  }
                }
              });

              if (existingPres) {
                await prisma.presensiMandiri.update({
                  where: { id: existingPres.id },
                  data: {
                    kelompokId: kelompokId,
                    latitude: lat,
                    longitude: lng,
                    deskripsiKegiatan: deskripsi,
                    status: "SELESAI",
                    checkInAt: checkIn,
                    checkOutAt: checkOut,
                    durasiMenit: durasiMenit,
                    platformOs: "ANDROID"
                  }
                });
                console.log("  [OK] PresensiMandiri diupdate.");
              } else {
                await prisma.presensiMandiri.create({
                  data: {
                    studentId: s.id,
                    kelompokId: kelompokId,
                    latitude: lat,
                    longitude: lng,
                    deskripsiKegiatan: deskripsi,
                    fotoUrl: "/uploads/presensi_observasi_20260828.jpg",
                    status: "SELESAI",
                    checkInAt: checkIn,
                    checkOutAt: checkOut,
                    durasiMenit: durasiMenit,
                    platformOs: "ANDROID"
                  }
                });
                console.log("  [OK] PresensiMandiri dibuat.");
              }

              // 3. Logbook KKN
              const existingLog = await prisma.logbookKkn.findFirst({
                where: {
                  penulisId: s.id,
                  tanggalKegiatan: new Date("2026-08-28T00:00:00.000Z")
                }
              });

              if (existingLog) {
                await prisma.logbookKkn.update({
                  where: { id: existingLog.id },
                  data: {
                    kelompokId: kelompokId,
                    waktuMulai: "07:00",
                    waktuSelesai: "14:00",
                    tempat: tempat,
                    deskripsi: deskripsiLogbook,
                    tipeAktivitas: "KELOMPOK",
                    statusApproval: s.isKetua ? "MENUNGGU_VERIFIKASI_DPL" : "MENUNGGU_VERIFIKASI_DPL",
                    pekanKe: 2,
                    platformOs: "ANDROID"
                  }
                });
                console.log("  [OK] LogbookKkn diupdate.");
              } else {
                await prisma.logbookKkn.create({
                  data: {
                    kelompokId: kelompokId,
                    penulisId: s.id,
                    tanggalKegiatan: new Date("2026-08-28T00:00:00.000Z"),
                    waktuMulai: "07:00",
                    waktuSelesai: "14:00",
                    tempat: tempat,
                    deskripsi: deskripsiLogbook,
                    fotoBuktiUrl: "/uploads/logbook_observasi_20260828.jpg",
                    attachmentUrls: ["/uploads/logbook_observasi_20260828.jpg"],
                    tipeAktivitas: "KELOMPOK",
                    statusApproval: "MENUNGGU_VERIFIKASI_DPL",
                    pekanKe: 2,
                    platformOs: "ANDROID"
                  }
                });
                console.log("  [OK] LogbookKkn dibuat.");
              }

              // 4. Student Location Telemetry Pings
              // Create a couple of location records across 07:00 - 14:00
              const pings = [
                new Date("2026-08-28T00:05:00.000Z"),
                new Date("2026-08-28T02:30:00.000Z"),
                new Date("2026-08-28T05:00:00.000Z"),
                new Date("2026-08-28T06:55:00.000Z")
              ];
              for (const pingTime of pings) {
                await prisma.studentLocation.create({
                  data: {
                    studentId: s.id,
                    latitude: lat + (Math.random() - 0.5) * 0.0002,
                    longitude: lng + (Math.random() - 0.5) * 0.0002,
                    recordedAt: pingTime
                  }
                });
              }
              console.log("  [OK] Telemetry lokasi berhasil dicatat.");
            }

            console.log("\\n=== SEMUA DATA PRESENSI & LOGBOOK BERHASIL DITAMBAHKAN ===");
          }

          run().catch(console.error).finally(() => prisma.$disconnect());
        '
      `;

      const res = await execCommand(conn, insertScript);
      console.log("Output:\n", res.output);
      if (res.error) console.error("Error:\n", res.error);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
    })
    .connect(config);
}

main().catch(console.error);
