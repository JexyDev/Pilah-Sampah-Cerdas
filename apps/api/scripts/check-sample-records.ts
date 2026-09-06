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
            // Check sample ActivityAttendance on 2026-08-28
            const sampleAtt = await prisma.activityAttendance.findMany({
              where: {
                attendedAt: {
                  gte: new Date("2026-08-28T00:00:00.000Z"),
                  lte: new Date("2026-08-28T23:59:59.999Z")
                }
              },
              take: 3
            });
            console.log("=== SAMPLE ACTIVITY ATTENDANCE TODAY ===");
            console.log(JSON.stringify(sampleAtt, null, 2));

            // Check sample PresensiMandiri on 2026-08-28
            const samplePres = await prisma.presensiMandiri.findMany({
              where: {
                checkInAt: {
                  gte: new Date("2026-08-28T00:00:00.000Z"),
                  lte: new Date("2026-08-28T23:59:59.999Z")
                }
              },
              take: 3
            });
            console.log("=== SAMPLE PRESENSI MANDIRI TODAY ===");
            console.log(JSON.stringify(samplePres, null, 2));

            // Check sample LogbookKkn on 2026-08-28
            const sampleLog = await prisma.logbookKkn.findMany({
              where: {
                tanggalKegiatan: {
                  gte: new Date("2026-08-28T00:00:00.000Z"),
                  lte: new Date("2026-08-28T23:59:59.999Z")
                }
              },
              take: 3
            });
            console.log("=== SAMPLE LOGBOOK TODAY ===");
            console.log(JSON.stringify(sampleLog, null, 2));

            // Check uploads directory for existing valid photo paths
            const samplePhotos = await prisma.presensiMandiri.findMany({
              where: { fotoUrl: { not: "" } },
              select: { fotoUrl: true },
              take: 5
            });
            console.log("=== SAMPLE PRESENSI PHOTOS ===");
            console.log(JSON.stringify(samplePhotos, null, 2));

            const sampleLogPhotos = await prisma.logbookKkn.findMany({
              where: { fotoBuktiUrl: { not: null } },
              select: { fotoBuktiUrl: true },
              take: 5
            });
            console.log("=== SAMPLE LOGBOOK PHOTOS ===");
            console.log(JSON.stringify(sampleLogPhotos, null, 2));
          }
          run().catch(console.error).finally(() => prisma.$disconnect());
        '
      `;

      const res = await execCommand(conn, script);
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
