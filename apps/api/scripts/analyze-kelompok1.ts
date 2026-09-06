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
            const nims = ["44324061", "10123022", "31624005", "41824048", "10123021", "63824024"];
            const names = [
              "Iqbal Hapidin Febrian",
              "Muhamad Nauval Pamungkas",
              "Fitri Najla Salsabila",
              "Putri Andini",
              "Irfan Putra Hendari",
              "Aulia Zahwa Putri"
            ];

            const students = await prisma.user.findMany({
              where: {
                OR: [
                  { studentProfile: { nim: { in: nims } } },
                  { name: { in: names } }
                ]
              },
              include: {
                studentProfile: {
                  include: {
                    kelompok: {
                      include: {
                        poskoKkn: true
                      }
                    },
                    assignedRw: true
                  }
                }
              }
            });

            console.log("=== 1. STUDENTS FOUND ===");
            console.log(JSON.stringify(students.map(s => ({
              id: s.id,
              name: s.name,
              nim: s.studentProfile?.nim,
              kelompok: s.studentProfile?.kelompok?.name,
              kelompokId: s.studentProfile?.kelompokId,
              rw: s.studentProfile?.assignedRw?.name,
              posko: s.studentProfile?.kelompok?.poskoKkn
            })), null, 2));

            const studentIds = students.map(s => s.id);

            // Activity Attendance (kehadiran_kegiatan)
            const attendances = await prisma.activityAttendance.findMany({
              where: { studentId: { in: studentIds } },
              include: {
                student: { select: { name: true } },
                schedule: true
              },
              orderBy: { attendedAt: "desc" }
            });
            console.log("=== 2. ACTIVITY ATTENDANCES (Count: " + attendances.length + ") ===");
            console.log(JSON.stringify(attendances, null, 2));

            // Presensi Mandiri
            const presensiMandiri = await prisma.presensiMandiri.findMany({
              where: { studentId: { in: studentIds } },
              include: {
                student: { select: { name: true } }
              },
              orderBy: { createdAt: "desc" }
            });
            console.log("=== 3. PRESENSI MANDIRI (Count: " + presensiMandiri.length + ") ===");
            console.log(JSON.stringify(presensiMandiri, null, 2));

            // Locations summary
            for (const st of students) {
              const locCount = await prisma.studentLocation.count({
                where: { studentId: st.id }
              });
              const recentLocs = await prisma.studentLocation.findMany({
                where: { studentId: st.id },
                orderBy: { recordedAt: "desc" },
                take: 3
              });
              console.log("=== LOCATIONS: " + st.name + " (" + locCount + " total) ===");
              console.log(JSON.stringify(recentLocs, null, 2));
            }
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
