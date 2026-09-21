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
              where: { nim: "41724012" }, // Rizki Aditia
              include: { user: true }
            });

            const uId = student.userId;

            console.log("=== RIZKI ADITIA ATTENDANCES ===");
            const attendances = await prisma.activityAttendance.findMany({
              where: { studentId: uId },
              include: { schedule: true },
              orderBy: { attendedAt: "asc" }
            });
            for (const a of attendances) {
              console.log(JSON.stringify({
                date: a.attendedAt ? a.attendedAt.toISOString().split("T")[0] : null,
                timeIn: a.attendedAt ? a.attendedAt.toISOString() : null,
                timeOut: a.checkOutAt ? a.checkOutAt.toISOString() : null,
                minutes: a.actualInZoneMinutes,
                status: a.status,
                scheduleTitle: a.schedule?.title,
                targetMinutes: a.schedule?.targetDurationMinutes
              }));
            }

            console.log("=== RIZKI ADITIA POINT HISTORY ===");
            const points = await prisma.pointHistory.findMany({
              where: { userId: uId },
              orderBy: { createdAt: "asc" }
            });
            for (const p of points) {
              console.log(JSON.stringify({
                kategori: p.kategori,
                points: p.points,
                description: p.description,
                createdAt: p.createdAt ? p.createdAt.toISOString() : null
              }));
            }

            console.log("=== RIZKI ADITIA LOGBOOKS ===");
            const logbooks = await prisma.logbookKkn.findMany({
              where: { penulisId: uId },
              orderBy: { tanggalKegiatan: "asc" }
            });
            for (const l of logbooks) {
              console.log(JSON.stringify({
                tglKegiatan: l.tanggalKegiatan ? l.tanggalKegiatan.toISOString().split("T")[0] : null,
                createdAt: l.createdAt ? l.createdAt.toISOString().split("T")[0] : null,
                statusApproval: l.statusApproval,
                judul: l.judul || (l.deskripsi ? l.deskripsi.substring(0, 40) : "")
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
