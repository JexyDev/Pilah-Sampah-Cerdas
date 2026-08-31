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
            const nims = ["44324061", "10123022", "31624005", "41824048", "10123021", "63824024"];

            const students = await prisma.user.findMany({
              where: {
                studentProfile: { nim: { in: nims } }
              },
              include: {
                studentProfile: true
              }
            });

            const todayStart = new Date("2026-08-30T17:00:00.000Z"); // 00:00 WIB 31 Aug 2026

            for (const s of students) {
              const att = await prisma.activityAttendance.findFirst({
                where: {
                  studentId: s.id,
                  attendedAt: { gte: todayStart }
                },
                include: { schedule: true }
              });

              console.log("=== " + s.name + " (" + s.studentProfile?.nim + ") ===");
              if (!att) {
                console.log("Tidak ada presensi hari ini (31 Agustus 2026)");
              } else {
                console.log("Status Presensi:", att.status);
                console.log("Jam Masuk (UTC/WIB):", att.attendedAt, "/", new Date(new Date(att.attendedAt).getTime() + 7*3600*1000).toISOString().replace("T", " ").slice(0, 19) + " WIB");
                console.log("Jam Pulang (UTC/WIB):", att.checkOutAt ? att.checkOutAt + " / " + new Date(new Date(att.checkOutAt).getTime() + 7*3600*1000).toISOString().replace("T", " ").slice(0, 19) + " WIB" : "-");
                console.log("Durasi Tercatat (Menit):", att.actualInZoneMinutes);
                console.log("Jumlah Jeda:", (att.jedaLogs || []).length);
                console.log("Ringkasan Jeda Log:", JSON.stringify(att.jedaLogs, null, 2));
              }
              console.log("");
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
