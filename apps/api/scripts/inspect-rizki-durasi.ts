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

            const points = await prisma.pointHistory.findMany({
              where: { userId: student.userId, kategori: "KKN_DURASI_MEMENUHI" },
              orderBy: { createdAt: "asc" }
            });

            console.log("TOTAL_DURASI_ROWS: " + points.length);
            for (let i = 0; i < points.length; i++) {
              const p = points[i];
              console.log((i+1) + ". " + p.createdAt.toISOString() + " | " + p.description);
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
