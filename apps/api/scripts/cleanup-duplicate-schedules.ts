import { prisma } from "../src/lib/prisma.js";
import { scheduleService } from "../src/services/scheduleService.js";
import { Client } from "ssh2";

const vpsConfig = {
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
  console.log("=== 1. RUNNING LOCAL DATABASE CLEANUP ===");
  const localClean = await scheduleService.cleanAllDuplicateSchedules();
  console.log("Local cleanup result:", localClean);

  const localSync = await scheduleService.syncDailySchedulesForToday();
  console.log("Local sync result:", localSync);

  const localCount = await prisma.schedule.count();
  console.log(`Total schedules remaining in local DB: ${localCount}`);

  console.log("\n=== 2. RUNNING VPS DATABASE CLEANUP ===");
  const conn = new Client();
  console.log("Connecting to VPS...");

  await new Promise<void>((resolve, reject) => {
    conn
      .on("ready", async () => {
        console.log("SSH Connected.");

        // Clean duplicates via SQL script on VPS psc-postgres
        const cleanVpsSql = `
          -- SQL script to deduplicate jadwal table on VPS
          WITH ranked_schedules AS (
            SELECT 
              j.id,
              j.id_kelompok,
              j.date::date as sched_date,
              j.category,
              j.dibuat_pada,
              COUNT(a.id) as att_count,
              ROW_NUMBER() OVER (
                PARTITION BY j.id_kelompok, (j.date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date, j.category
                ORDER BY COUNT(a.id) DESC, j.dibuat_pada DESC
              ) as rn
            FROM jadwal j
            LEFT JOIN presensi_kegiatan a ON a.id_jadwal = j.id
            WHERE j.id_kelompok IS NOT NULL AND j.category = 'POSKO_KKN'
            GROUP BY j.id, j.id_kelompok, j.date, j.category, j.dibuat_pada
          ),
          duplicates_to_delete AS (
            SELECT id FROM ranked_schedules WHERE rn > 1
          )
          DELETE FROM jadwal WHERE id IN (SELECT id FROM duplicates_to_delete);
        `;

        const executeCleanupCmd = `echo "${process.env.VPS_PASSWORD || process.env.VPS_PASS || ''}" | sudo -S docker exec -i psc-postgres psql -U psc_user -d psc_db << 'EOF'
${cleanVpsSql}
EOF`;

        const vpsCleanRes = await execCommand(conn, executeCleanupCmd);
        console.log("VPS Cleanup output:\n", vpsCleanRes.output);

        // Check remaining duplicates on VPS
        const checkDuplicatesCmd = `echo "${process.env.VPS_PASSWORD || process.env.VPS_PASS || ''}" | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -c "
          SELECT j.title, (j.date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date as wib_date, j.id_kelompok, k.nama as kelompok_nama, COUNT(*) as count
          FROM jadwal j
          LEFT JOIN kelompok_kkn k ON j.id_kelompok = k.id
          GROUP BY j.title, (j.date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date, j.id_kelompok, k.nama
          HAVING COUNT(*) > 1
          ORDER BY count DESC;
        "`;
        const dupCheckRes = await execCommand(conn, checkDuplicatesCmd);
        console.log("VPS Remaining Duplicates (should be 0 rows):\n", dupCheckRes.output);

        // Check Lebak Gede schedules on VPS
        const checkLebakGede = `echo "${process.env.VPS_PASSWORD || process.env.VPS_PASS || ''}" | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -c "
          SELECT j.id, j.title, (j.date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::date as wib_date, j.location, j.latitude, j.longitude, k.nama as kelompok_nama
          FROM jadwal j
          JOIN kelompok_kkn k ON j.id_kelompok = k.id
          WHERE k.nama ILIKE '%Lebak Gede%'
          ORDER BY j.date DESC, j.dibuat_pada DESC;
        "`;
        const lebakRes = await execCommand(conn, checkLebakGede);
        console.log("VPS Lebak Gede Schedules After Cleanup:\n", lebakRes.output);

        conn.end();
        resolve();
      })
      .on("error", (err) => {
        console.error("SSH Error:", err.message);
        reject(err);
      })
      .connect(vpsConfig);
  });

  console.log("\n✅ All cleanups completed successfully.");
}

main().catch(console.error);
