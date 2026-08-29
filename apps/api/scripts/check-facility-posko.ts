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
            const kelompokId = "c795ec26-571b-459f-9a6c-03e107987ae4"; // Kelompok 4 Lebak Gede

            // Check facility table for posko_kkn
            const facilities = await prisma.facility.findMany({
              where: { jenis: "posko_kkn" },
              include: { kelompok: true, rw: true }
            });
            console.log("=== ALL FACILITY POSKO_KKN COUNT ===", facilities.length);
            console.log("Facilities for Kelompok 4 Lebak Gede:");
            const kel4Facilities = facilities.filter(f => f.kelompokId === kelompokId);
            console.log(JSON.stringify(kel4Facilities, null, 2));

            // Check poskoKkn table
            const poskos = await prisma.poskoKkn.findMany({
              where: { kelompokId },
              include: { kelompok: true }
            });
            console.log("=== POSKO KKN TABLE FOR KELOMPOK 4 ===");
            console.log(JSON.stringify(poskos, null, 2));
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
