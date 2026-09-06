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
            const studentIds = [
              "9263ae0e-f853-4768-b8e8-1968bf783b39", // Fitri Najla Salsabila
              "38e85ad6-1a15-4cd2-a154-943b451ca232", // Muhamad Nauval Pamungkas
              "3d6de368-4bf6-43f0-872c-89250f60aa15", // Putri Andini
              "2be6f7c8-6344-4835-89ba-3cb4117c6e22", // Aulia Zahwa Putri
              "0786efdb-daf8-49fe-9401-14cbc2550d91", // Irfan Putra Hendari
              "2a6007b9-e0a9-4a23-885f-ca3d2a3f81e6"  // Iqbal Hapidin Febrian
            ];

            const attendances = await prisma.activityAttendance.findMany({
              where: { studentId: { in: studentIds } },
              include: {
                student: true,
                schedule: true
              },
              orderBy: { attendedAt: "desc" }
            });

            console.log("=== FULL ANALYSIS OF ATTENDANCES FOR KELOMPOK 1 LEBAK SILIWANGI ===");
            for (const a of attendances) {
              console.log("==================================================================");
              console.log("NAMA:", a.student.name);
              console.log("NIM:", a.student.nip || a.student.address);
              console.log("JADWAL:", a.schedule?.title);
              console.log("STATUS:", a.status);
              console.log("ATTENDED_AT (UTC):", a.attendedAt);
              console.log("CHECKOUT_AT (UTC):", a.checkOutAt);
              console.log("ACTUAL_IN_ZONE_MINUTES:", a.actualInZoneMinutes);
              console.log("JEDA_LOGS_COUNT:", (a.jedaLogs || []).length);
              console.log("JEDA_LOGS:", JSON.stringify(a.jedaLogs, null, 2));
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
