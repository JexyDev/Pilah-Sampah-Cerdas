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

      const script = `
        cd /home/maker/Pilah-Sampah-Cerdas-new/apps/api &&
        node -r dotenv/config -e '
          const { PrismaClient } = require("@prisma/client");
          const prisma = new PrismaClient();

          async function run() {
            const studentIds = [
              "266e9630-be32-48bb-9aa8-40fdfd92e476",
              "d2bbbb93-3d73-49ac-ab44-2183dbdcd0cd",
              "d38fe3be-b1fe-4f02-bcc1-a5afefcc4254"
            ];

            console.log("==================================================");
            console.log("📊 VERIFIKASI DATA PRESENSI & LOGBOOK DI DATABASE VPS");
            console.log("==================================================");

            const att = await prisma.activityAttendance.findMany({
              where: { studentId: { in: studentIds } },
              include: { student: { select: { name: true, phone: true } }, schedule: { select: { title: true, time: true } } }
            });
            console.log("\\n1. KEHADIRAN KEGIATAN (ActivityAttendance):");
            att.forEach((a, i) => {
              console.log(\`  [\${i+1}] \${a.student.name} | Status: \${a.status} | Masuk: \${a.attendedAt.toISOString()} | Keluar: \${a.checkOutAt.toISOString()} | Durasi: \${a.actualInZoneMinutes} menit | Kegiatan: \${a.deskripsiKegiatan}\`);
            });

            const pres = await prisma.presensiMandiri.findMany({
              where: { studentId: { in: studentIds } },
              include: { student: { select: { name: true } }, kelompok: { select: { name: true } } }
            });
            console.log("\\n2. PRESENSI MANDIRI (PresensiMandiri):");
            pres.forEach((p, i) => {
              console.log(\`  [\${i+1}] \${p.student.name} | Status: \${p.status} | CheckIn: \${p.checkInAt.toISOString()} | CheckOut: \${p.checkOutAt.toISOString()} | Durasi: \${p.durasiMenit} menit | Kelompok: \${p.kelompok.name}\`);
            });

            const logs = await prisma.logbookKkn.findMany({
              where: { penulisId: { in: studentIds } },
              include: { penulis: { select: { name: true } }, kelompok: { select: { name: true } } }
            });
            console.log("\\n3. LOGBOOK KKN (LogbookKkn):");
            logs.forEach((l, i) => {
              console.log(\`  [\${i+1}] \${l.penulis.name} | Tanggal: \${l.tanggalKegiatan.toISOString().slice(0,10)} | Jam: \${l.waktuMulai}-\${l.waktuSelesai} | Tempat: \${l.tempat} | Status: \${l.statusApproval}\`);
              console.log(\`      Deskripsi: \${l.deskripsi}\`);
            });

            console.log("\\n==================================================");
          }

          run().catch(console.error).finally(() => prisma.$disconnect());
        '
      `;

      const res = await execCommand(conn, script);
      console.log(res.output);
      if (res.error) console.error("Error:\n", res.error);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
    })
    .connect(config);
}

main().catch(console.error);
