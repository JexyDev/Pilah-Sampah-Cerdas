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
            const facilities = await prisma.facility.findMany({
              where: { jenis: "posko_kkn" },
              include: {
                kelompok: true,
                rw: { include: { kelurahan: true } }
              }
            });

            console.log("Found " + facilities.length + " posko facilities in database.");

            for (const f of facilities) {
              const kelName = f.kelompok?.kelurahan || "Dago";
              console.log("\\n==================================================");
              console.log("Posko: " + f.nama);
              console.log("Kelompok: " + f.kelompok?.name + " (Kelurahan: " + kelName + ", cakupanRw: " + JSON.stringify(f.kelompok?.cakupanRw) + ")");
              console.log("Current RW: ID " + f.rwId + " -> " + f.rw?.name + " (Kelurahan: " + f.rw?.kelurahan?.name + ")");

              // Extract intended RW number from cakupanRw
              let targetRwNum = "01";
              if (f.kelompok?.cakupanRw) {
                try {
                  const parsed = typeof f.kelompok.cakupanRw === "string" ? JSON.parse(f.kelompok.cakupanRw) : f.kelompok.cakupanRw;
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    targetRwNum = String(parsed[0]).padStart(2, "0");
                  }
                } catch (_) {}
              }

              // Also check if current rw.name has an RW number e.g. "RW 08" or "RW 04"
              let currentRwNum = "";
              if (f.rw?.name) {
                const match = f.rw.name.match(/(\\d+)/);
                if (match) currentRwNum = match[1].padStart(2, "0");
              }

              const numToSearch = currentRwNum || targetRwNum;

              // Find matching RW in the correct kelurahan
              let matchingRw = await prisma.rw.findFirst({
                where: {
                  kelurahan: { name: { equals: kelName, mode: "insensitive" } },
                  OR: [
                    { name: { contains: "RW " + numToSearch, mode: "insensitive" } },
                    { name: { contains: "RW " + parseInt(numToSearch, 10), mode: "insensitive" } },
                    { name: { contains: numToSearch, mode: "insensitive" } }
                  ]
                },
                include: { kelurahan: true }
              });

              if (!matchingRw) {
                // Try targetRwNum
                matchingRw = await prisma.rw.findFirst({
                  where: {
                    kelurahan: { name: { equals: kelName, mode: "insensitive" } },
                    OR: [
                      { name: { contains: "RW " + targetRwNum, mode: "insensitive" } },
                      { name: { contains: "RW " + parseInt(targetRwNum, 10), mode: "insensitive" } },
                      { name: { contains: targetRwNum, mode: "insensitive" } }
                    ]
                  },
                  include: { kelurahan: true }
                });
              }

              if (matchingRw) {
                console.log("-> MATCHED RW IN " + kelName + ": ID " + matchingRw.id + " -> " + matchingRw.name + " (" + matchingRw.kelurahan.name + ")");
                if (f.rwId !== matchingRw.id) {
                  await prisma.facility.update({
                    where: { id: f.id },
                    data: { rwId: matchingRw.id }
                  });
                  console.log("   *** UPDATED facility.rwId from " + f.rwId + " to " + matchingRw.id + " ***");
                } else {
                  console.log("   (Already matching)");
                }
              } else {
                console.log("-> WARNING: Could not find matching RW in " + kelName + ", finding first RW of " + kelName);
                const firstKelRw = await prisma.rw.findFirst({
                  where: { kelurahan: { name: { equals: kelName, mode: "insensitive" } } },
                  include: { kelurahan: true }
                });
                if (firstKelRw && f.rwId !== firstKelRw.id) {
                  await prisma.facility.update({
                    where: { id: f.id },
                    data: { rwId: firstKelRw.id }
                  });
                  console.log("   *** FALLBACK UPDATED facility.rwId to " + firstKelRw.id + " (" + firstKelRw.name + ") ***");
                }
              }
            }

            console.log("\\n==================================================");
            console.log("Verification of Poskos after fix:");
            const verified = await prisma.facility.findMany({
              where: { jenis: "posko_kkn" },
              include: {
                kelompok: true,
                rw: { include: { kelurahan: true } }
              },
              orderBy: { createdAt: "desc" }
            });

            console.log(JSON.stringify(verified.map(v => ({
              nama: v.nama,
              kelompok: v.kelompok?.name,
              kelompokKelurahan: v.kelompok?.kelurahan,
              rwId: v.rwId,
              rwName: v.rw?.name,
              rwKelurahan: v.rw?.kelurahan?.name
            })), null, 2));
          }

          run().catch(console.error).finally(() => prisma.$disconnect());
        '
      `;

      const res = await execCommand(conn, script);
      console.log("OUTPUT:\n", res.output);
      if (res.error) console.error("ERROR:\n", res.error);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err);
    })
    .connect(config);
}

main();
