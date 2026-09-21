import { Client } from "ssh2";
import fs from "fs";

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
            // Data dari spreadsheet QC
            const qcData = {
              "muhammad dafa": { nim: "10923004", cPoin: 124, dHadir: 16, ePemenuhan: 10, fLogbook: 10, hMobile: 124, diff: 0 },
              "anugrah rizki": { nim: "21124805", cPoin: 151, dHadir: 16, ePemenuhan: 13, fLogbook: 16, hMobile: 154, diff: -3 },
              "asep saepul": { nim: "10124324", cPoin: 125, dHadir: 14, ePemenuhan: 10, fLogbook: 13, hMobile: 127, diff: -2 },
              "faisal syahrul": { nim: "13024009", cPoin: 182, dHadir: 20, ePemenuhan: 17, fLogbook: 17, hMobile: 182, diff: 0 },
              "khairunisa": { nim: "10124157", cPoin: 130, dHadir: 13, ePemenuhan: 11, fLogbook: 15, hMobile: 133, diff: -3 },
              "malfin": { nim: "10124225", cPoin: 146, dHadir: 17, ePemenuhan: 14, fLogbook: 12, hMobile: 154, diff: -6 },
              "miko": { nim: "10422035", cPoin: 68, dHadir: 8, ePemenuhan: 8, fLogbook: 4, hMobile: 71, diff: -3 },
              "muhammad hafidz": { nim: "10524132", cPoin: 185, dHadir: 20, ePemenuhan: 18, fLogbook: 17, hMobile: 188, diff: -3 },
              "muhammad ihsan": { nim: "10124384", cPoin: 148, dHadir: 16, ePemenuhan: 14, fLogbook: 14, hMobile: 150, diff: -2 },
              "rizki aditia": { nim: "41724012", cPoin: 150, dHadir: 18, ePemenuhan: 10, fLogbook: 16, hMobile: 168, diff: -18 },
              "rizki saputra": { nim: "10324013", cPoin: 155, dHadir: 17, ePemenuhan: 13, fLogbook: 16, hMobile: 151, diff: -4 },
              "zhanifa": { nim: "44324071", cPoin: 111, dHadir: 12, ePemenuhan: 11, fLogbook: 10, hMobile: 114, diff: -3 }
            };

            const results = [];

            for (const [key, q] of Object.entries(qcData)) {
              const student = await prisma.studentKkn.findFirst({
                where: { nim: q.nim },
                include: { user: true, kelompok: true }
              });

              if (!student) {
                console.log("NOT FOUND: " + q.nim);
                continue;
              }

              const uId = student.userId;

              // All PointHistory
              const points = await prisma.pointHistory.findMany({
                where: { userId: uId },
                orderBy: { createdAt: "asc" }
              });

              let totalSSOT = 0;
              const excludedCategories = ["KKN_PROKER", "REDUKSI_TONASE", "BONUS_LOGIN_PERTAMA", "POIN_KKN_FINAL"];
              const categoryPts = { KKN_PRESENSI_HADIR: 0, KKN_DURASI_MEMENUHI: 0, KKN_LOGBOOK_HARIAN: 0 };
              const categoryCount = { KKN_PRESENSI_HADIR: 0, KKN_DURASI_MEMENUHI: 0, KKN_LOGBOOK_HARIAN: 0 };

              for (const p of points) {
                const isExcluded = excludedCategories.includes(p.kategori) || (p.description || "").toLowerCase().includes("[prokerid:");
                if (!isExcluded) {
                  totalSSOT += p.points;
                  if (categoryPts[p.kategori] !== undefined) {
                    categoryPts[p.kategori] += p.points;
                    categoryCount[p.kategori] += 1;
                  }
                }
              }

              // Attendances
              const attendances = await prisma.activityAttendance.findMany({
                where: { studentId: uId },
                orderBy: { attendedAt: "asc" }
              });

              // Filter attendances: Hadir vs Hadir Memenuhi
              const attHadir = attendances.filter(a => a.status === "HADIR_MEMENUHI" || a.status === "HADIR_TIDAK_MEMENUHI" || a.status === "HADIR" || a.status === "BERLANGSUNG");
              const attMemenuhi = attendances.filter(a => a.status === "HADIR_MEMENUHI");

              // Logbooks
              const logbooks = await prisma.logbookKkn.findMany({
                where: { penulisId: uId },
                orderBy: { tanggalKegiatan: "asc" }
              });

              // Distinct dates of logbooks
              const distinctDates = [...new Set(logbooks.map(l => l.tanggalKegiatan ? l.tanggalKegiatan.toISOString().split("T")[0] : null).filter(Boolean))];

              results.push({
                key,
                nim: q.nim,
                name: student.user.name,
                qc: q,
                db: {
                  totalSSOT,
                  hadirCountFromPoints: categoryCount.KKN_PRESENSI_HADIR,
                  hadirPtsFromPoints: categoryPts.KKN_PRESENSI_HADIR,
                  pemenuhanCountFromPoints: categoryCount.KKN_DURASI_MEMENUHI,
                  pemenuhanPtsFromPoints: categoryPts.KKN_DURASI_MEMENUHI,
                  logbookCountFromPoints: categoryCount.KKN_LOGBOOK_HARIAN,
                  logbookPtsFromPoints: categoryPts.KKN_LOGBOOK_HARIAN,
                  totalAttendancesInDb: attendances.length,
                  attHadirCount: attHadir.length,
                  attMemenuhiCount: attMemenuhi.length,
                  totalLogbooksInDb: logbooks.length,
                  distinctLogbookDatesCount: distinctDates.length,
                  distinctDates: distinctDates
                },
                diffAnalysis: {
                  ssotVsQcH: totalSSOT - q.hMobile,
                  ssotVsQcC: totalSSOT - q.cPoin,
                  hadirDiff: categoryCount.KKN_PRESENSI_HADIR - q.dHadir,
                  pemenuhanDiff: categoryCount.KKN_DURASI_MEMENUHI - q.ePemenuhan,
                  logbookDiff: categoryCount.KKN_LOGBOOK_HARIAN - q.fLogbook
                }
              });
            }

            console.log("JSON_RESULTS_START");
            console.log(JSON.stringify(results, null, 2));
            console.log("JSON_RESULTS_END");
          }

          run().catch(console.error).finally(() => prisma.$disconnect());
        '
      `;

      const res = await execCommand(conn, script);
      const jsonStart = res.output.indexOf("JSON_RESULTS_START");
      const jsonEnd = res.output.indexOf("JSON_RESULTS_END");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = res.output.substring(jsonStart + "JSON_RESULTS_START".length, jsonEnd).trim();
        fs.writeFileSync("kelompok1_full_audit.json", jsonStr);
        console.log("Saved kelompok1_full_audit.json successfully!");
      } else {
        console.log("Output:\n", res.output);
      }
      if (res.error) console.error("Error:\n", res.error);
      conn.end();
    })
    .connect(config);
}

main().catch(console.error);
