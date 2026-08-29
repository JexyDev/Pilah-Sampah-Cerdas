import { Client } from "ssh2";

const config = {
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
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
              "266e9630-be32-48bb-9aa8-40fdfd92e476", // Dani Nurhalim
              "d2bbbb93-3d73-49ac-ab44-2183dbdcd0cd", // Najwa Intan Putri Permata
              "d38fe3be-b1fe-4f02-bcc1-a5afefcc4254"  // Chandra Nur Mulyani
            ];

            const att = await prisma.activityAttendance.findMany({
              where: { studentId: { in: studentIds } },
              include: { student: true, schedule: true }
            });
            console.log("=== EXISTING ACTIVITY ATTENDANCE ===");
            console.log(JSON.stringify(att, null, 2));

            const pres = await prisma.presensiMandiri.findMany({
              where: { studentId: { in: studentIds } },
              include: { student: true }
            });
            console.log("=== EXISTING PRESENSI MANDIRI ===");
            console.log(JSON.stringify(pres, null, 2));

            const logs = await prisma.logbookKkn.findMany({
              where: { penulisId: { in: studentIds } },
              include: { penulis: true }
            });
            console.log("=== EXISTING LOGBOOKS ===");
            console.log(JSON.stringify(logs, null, 2));
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
