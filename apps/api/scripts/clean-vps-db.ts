import { Client } from "ssh2";

const vpsConfig = {
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
  console.log("Connecting to VPS...");

  conn
    .on("ready", async () => {
      console.log("SSH Connected.");

      // Check current duplicates
      const countBefore = await execCommand(conn, `echo Makerdotindo2026 | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -t -c "SELECT count(*) FROM jadwal;"`);
      console.log("Total schedules on VPS before cleanup:", countBefore.output.trim());

      // Use Node script on VPS or exact psql deletion query
      const deleteSql = `
        DELETE FROM jadwal j1
        USING jadwal j2
        WHERE j1.id_kelompok = j2.id_kelompok
          AND j1.date = j2.date
          AND j1.id > j2.id;
      `;
      const delRes = await execCommand(conn, `echo Makerdotindo2026 | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -c "${deleteSql}"`);
      console.log("Direct Delete Result:\n", delRes.output);

      // Now check if any different titles/times exist for same kelompok & date
      const deleteSameDaySql = `
        WITH ranked AS (
          SELECT id, id_kelompok, date::date as d_date,
                 ROW_NUMBER() OVER(PARTITION BY id_kelompok, date::date ORDER BY dibuat_pada DESC) as rn
          FROM jadwal
          WHERE id_kelompok IS NOT NULL
        )
        DELETE FROM jadwal WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
      `;
      const delSameDayRes = await execCommand(conn, `echo Makerdotindo2026 | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -c "${deleteSameDaySql}"`);
      console.log("Same Day Clean Result:\n", delSameDayRes.output);

      const countAfter = await execCommand(conn, `echo Makerdotindo2026 | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -t -c "SELECT count(*) FROM jadwal;"`);
      console.log("Total schedules on VPS after cleanup:", countAfter.output.trim());

      // Check Lebak Gede schedules
      const checkLebak = await execCommand(conn, `echo Makerdotindo2026 | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -c "
        SELECT j.id, j.title, j.date, j.location, j.latitude, j.longitude, k.nama as kelompok_nama
        FROM jadwal j
        JOIN kelompok_kkn k ON j.id_kelompok = k.id
        WHERE k.nama ILIKE '%Lebak Gede%'
        ORDER BY j.date DESC, j.dibuat_pada DESC;
      "`);
      console.log("Lebak Gede Schedules on VPS:\n", checkLebak.output);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
    })
    .connect(vpsConfig);
}

main().catch(console.error);
