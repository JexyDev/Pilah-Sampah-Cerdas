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
            // Check Kelompok 4 Lebak Gede
            const kelompok = await prisma.kelompokKkn.findFirst({
              where: { name: { contains: "Kelompok 4 Lebak Gede", mode: "insensitive" } },
              include: {
                poskoKkn: true,
                students: {
                  include: {
                    user: true
                  }
                },
                schedules: true
              }
            });

            console.log("=== KELOMPOK 4 LEBAK GEDE ===");
            console.log("ID:", kelompok?.id);
            console.log("Name:", kelompok?.name);
            console.log("Kelurahan:", kelompok?.kelurahan);
            console.log("Posko:", kelompok?.poskoKkn);
            console.log("Students count:", kelompok?.students?.length);
            console.log("Students:", kelompok?.students?.map(s => ({
              id: s.user.id,
              name: s.user.name,
              nim: s.nim,
              phone: s.user.phone,
              isKetua: s.isKetua
            })));
            console.log("Schedules:", kelompok?.schedules);

            // Also check Lebak Gede kelurahan coords / RW coords
            const kel = await prisma.kelurahan.findFirst({
              where: { name: { contains: "Lebak Gede", mode: "insensitive" } },
              include: {
                rws: {
                  include: {
                    rts: true
                  }
                }
              }
            });
            console.log("=== KELURAHAN LEBAK GEDE ===");
            console.log("Kelurahan:", kel?.name, kel?.id);
            console.log("RW count:", kel?.rws?.length);
            console.log("Sample RW coords:", kel?.rws?.slice(0, 3)?.map(r => ({
              rw: r.name,
              lat: r.latitude,
              lng: r.longitude
            })));
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
