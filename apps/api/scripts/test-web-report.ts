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
          const { KknAttendanceService } = require("./dist/services/kknAttendanceService.js");
          const { PrismaClient } = require("@prisma/client");
          const prisma = new PrismaClient();

          async function run() {
            const kelompok = await prisma.kelompokKkn.findFirst({
              where: { name: { contains: "Kelompok 1 Sadang Serang" } }
            });
            console.log("KELOMPOK_ID:", kelompok?.id, kelompok?.name);

            const service = new KknAttendanceService();
            const report = await service.getLaporanPresensi({
              kelompokId: kelompok.id,
              startDate: "2026-08-26",
              endDate: "2026-09-18",
              page: 1,
              limit: 50
            });

            console.log("=== REPORT STUDENT AGGREGATES (26 Aug - 18 Sep) ===");
            for (const s of report.studentAggregates) {
              console.log(JSON.stringify({
                nim: s.nim,
                name: s.namaMahasiswa,
                totalSessions: s.totalSessions,
                hadirMemenuhi: s.hadirMemenuhi,
                hadirKurang: s.hadirKurang
              }));
            }
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
