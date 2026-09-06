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
            // Check Aulia Zahwa Putri attendance record in full
            const att = await prisma.activityAttendance.findUnique({
              where: { id: "a01ab949-f180-49e2-9ced-d442485c186e" },
              include: { student: true, schedule: true }
            });
            console.log("=== AULIA ATTENDANCE FULL RECORD ===");
            console.log(JSON.stringify(att, null, 2));

            // Check audit trails if any
            const audits = await prisma.auditTrail.findMany({
              where: {
                OR: [
                  { userId: "2be6f7c8-6344-4835-89ba-3cb4117c6e22" },
                  { resourceId: "a01ab949-f180-49e2-9ced-d442485c186e" }
                ]
              },
              orderBy: { createdAt: "desc" },
              take: 20
            });
            console.log("=== AUDIT TRAILS ===");
            console.log(JSON.stringify(audits, null, 2));
          }
          run().catch(console.error).finally(() => prisma.$disconnect());
        '
      `;

      const res = await execCommand(conn, script);
      console.log("Output:\n", res.output);
      if (res.error) console.error("Error:\n", res.error);
      conn.end();
    })
    .connect(config);
}

main().catch(console.error);
