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

      const checkCmd = `
        cd /home/maker/Pilah-Sampah-Cerdas-new/apps/api &&
        node -r dotenv/config -e '
          const { PrismaClient } = require("@prisma/client");
          const prisma = new PrismaClient();
          async function run() {
            const names = ["Dani Nurhalim", "Najwa Intan Putri", "Chandra Nur Mulyani"];
            const users = await prisma.user.findMany({
              where: {
                OR: [
                  { name: { contains: "Dani", mode: "insensitive" } },
                  { name: { contains: "Najwa", mode: "insensitive" } },
                  { name: { contains: "Chandra", mode: "insensitive" } },
                ]
              },
              include: {
                role: true,
                studentProfile: {
                  include: {
                    kelompok: {
                      include: {
                        poskoKkn: true,
                        dpl: true
                      }
                    },
                    assignedRw: {
                      include: {
                        kelurahan: true
                      }
                    }
                  }
                }
              }
            });
            console.log("=== VPS USERS MATCHED ===");
            console.log(JSON.stringify(users.map(u => ({
              id: u.id,
              name: u.name,
              nim: u.studentProfile?.nim,
              kelompok: u.studentProfile?.kelompok?.name,
              kelompokId: u.studentProfile?.kelompokId,
              dpl: u.studentProfile?.kelompok?.dpl?.name,
              rw: u.studentProfile?.assignedRw?.name,
              posko: u.studentProfile?.kelompok?.poskoKkn,
            })), null, 2));

            // Check presensi mandiri on VPS
            const presensiToday = await prisma.presensiMandiri.findMany({
              where: {
                studentId: { in: users.map(u => u.id) }
              },
              orderBy: { createdAt: "desc" },
              take: 10
            });
            console.log("=== VPS PRESENSI MANDIRI ===");
            console.log(JSON.stringify(presensiToday, null, 2));

            // Check activity attendance on VPS
            const activityToday = await prisma.activityAttendance.findMany({
              where: {
                studentId: { in: users.map(u => u.id) }
              },
              orderBy: { attendedAt: "desc" },
              take: 10
            });
            console.log("=== VPS ACTIVITY ATTENDANCE ===");
            console.log(JSON.stringify(activityToday, null, 2));

            // Check logbook on VPS
            const logbooks = await prisma.logbookKkn.findMany({
              where: {
                penulisId: { in: users.map(u => u.id) }
              },
              orderBy: { tanggalKegiatan: "desc" },
              take: 10
            });
            console.log("=== VPS LOGBOOK KKN ===");
            console.log(JSON.stringify(logbooks, null, 2));
          }
          run().catch(console.error).finally(() => prisma.$disconnect());
        '
      `;

      const res = await execCommand(conn, checkCmd);
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
