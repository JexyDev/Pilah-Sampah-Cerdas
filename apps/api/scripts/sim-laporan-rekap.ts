import { Client } from "ssh2";

const config = {
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: process.env.VPS_PASSWORD || "Makerdotindo2026",
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
  conn
    .on("ready", async () => {
      const script = `
        cd /home/maker/Pilah-Sampah-Cerdas-new/apps/api &&
        node -r dotenv/config -e '
          const { PrismaClient } = require("@prisma/client");
          const prisma = new PrismaClient();

          async function run() {
            const student = await prisma.studentKkn.findFirst({
              where: { nim: "41724012" },
              include: { user: true }
            });

            // Simulasi getLaporanPresensi allSummaryRecords
            const records = await prisma.activityAttendance.findMany({
              where: {
                studentId: student.userId,
                attendedAt: {
                  gte: new Date("2026-08-26T00:00:00+07:00"),
                  lte: new Date("2026-09-18T23:59:59.999+07:00")
                }
              }
            });

            console.log("RECORDS_COUNT:", records.length);
            let hadirMemenuhi = 0;
            let hadirKurang = 0;
            for (const r of records) {
              const st = String(r.status || "").toUpperCase();
              let mins = Math.min(480, Math.max(0, r.actualInZoneMinutes ?? 0));
              const isFinishedSummary = Boolean(r.checkOutAt) || ["HADIR_MEMENUHI", "HADIR_TIDAK_MEMENUHI", "HADIR", "SELESAI", "SELESAI_TELAT"].includes(st);
              if (isFinishedSummary) {
                if (st === "SELESAI_TELAT" || mins < 240) {
                  hadirKurang++;
                  console.log("KURANG:", r.attendedAt.toISOString(), "mins:", mins, "st:", st);
                } else {
                  hadirMemenuhi++;
                  console.log("MEMENUHI:", r.attendedAt.toISOString(), "mins:", mins, "st:", st);
                }
              }
            }
            console.log("FINAL: hadirMemenuhi=" + hadirMemenuhi + ", hadirKurang=" + hadirKurang);
          }

          run().catch(console.error).finally(() => prisma.$disconnect());
        '
      `;

      const res = await execCommand(conn, script);
      console.log(res.output);
      if (res.error) console.error("Error:\n", res.error);
      conn.end();
    })
    .connect(config);
}

main().catch(console.error);
