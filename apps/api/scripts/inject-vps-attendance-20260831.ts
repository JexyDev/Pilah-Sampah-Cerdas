import { Client } from "ssh2";
import * as fs from "fs";
import * as path from "path";

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
  const sqlFilePath = path.resolve(__dirname, "insert-attendance-20260831.sql");
  if (!fs.existsSync(sqlFilePath)) {
    console.error("SQL file not found:", sqlFilePath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, "utf-8");

  const conn = new Client();
  console.log("Connecting to VPS 157.10.252.252 via SSH...");

  conn
    .on("ready", async () => {
      console.log("✅ SSH Connected.");

      // Upload SQL file to VPS /tmp/insert-attendance-20260831.sql
      console.log("Uploading SQL file to VPS /tmp/insert-attendance-20260831.sql...");

      await new Promise<void>((resolve, reject) => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);
          const writeStream = sftp.createWriteStream("/tmp/insert-attendance-20260831.sql");
          writeStream.write(sqlContent, "utf-8", () => {
            writeStream.end();
          });
          writeStream.on("finish", () => {
            console.log("✅ Uploaded SQL file to /tmp/insert-attendance-20260831.sql");
            resolve();
          });
          writeStream.on("error", reject);
        });
      });

      // Execute SQL file inside docker container or directly via psql
      console.log("Executing SQL injection inside Postgres container on VPS...");
      const execCmd = `
        POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)
        if [ -n "$POSTGRES_CONTAINER" ]; then
          echo "Found container: $POSTGRES_CONTAINER"
          docker exec -i $POSTGRES_CONTAINER psql -U psc_user -d psc_db < /tmp/insert-attendance-20260831.sql 2>&1 || docker exec -i $POSTGRES_CONTAINER psql -U postgres -d psc_db < /tmp/insert-attendance-20260831.sql 2>&1
        else
          echo "No postgres container found, trying local psql..."
          psql -U psc_user -d psc_db < /tmp/insert-attendance-20260831.sql 2>&1
        fi
      `;

      const res = await execCommand(conn, execCmd);
      console.log("Execution Output:\n", res.output);
      if (res.error) console.error("Execution Stderr:\n", res.error);

      // Verify records on VPS
      console.log("\n=== VERIFYING ATTENDANCE RECORDS ON VPS (2026-08-31) ===");
      const verifyCmd = `
        POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)
        docker exec -i $POSTGRES_CONTAINER psql -U psc_user -d psc_db -c "
          SELECT 'kehadiran_kegiatan' as tabel, count(*) FROM kehadiran_kegiatan WHERE waktu_absen >= '2026-08-31 00:00:00+00' AND waktu_absen <= '2026-08-31 23:59:59+00'
          UNION ALL
          SELECT 'presensi_mandiri' as tabel, count(*) FROM presensi_mandiri WHERE waktu_checkin >= '2026-08-31 00:00:00+00' AND waktu_checkin <= '2026-08-31 23:59:59+00'
          UNION ALL
          SELECT 'logbook_kkn' as tabel, count(*) FROM logbook_kkn WHERE tanggal_kegiatan = '2026-08-31'
          UNION ALL
          SELECT 'pengajuan_izin_mahasiswa' as tabel, count(*) FROM pengajuan_izin_mahasiswa WHERE tanggal_mulai >= '2026-08-31 00:00:00+00' AND tanggal_mulai <= '2026-08-31 23:59:59+00';
        " 2>&1
      `;
      const verifyRes = await execCommand(conn, verifyCmd);
      console.log("Verification Query Output:\n", verifyRes.output);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
      console.log("\n💡 TIPS: Untuk mengeksekusi langsung di VPS via terminal / SSH:");
      console.log("1. Salin isi file: main/apps/api/scripts/insert-attendance-20260831.sql");
      console.log("2. Jalankan perintah di VPS:");
      console.log("   docker exec -i $(docker ps -q -f name=postgres) psql -U psc_user -d psc_db < /tmp/insert-attendance-20260831.sql");
    })
    .connect(config);
}

main().catch(console.error);
