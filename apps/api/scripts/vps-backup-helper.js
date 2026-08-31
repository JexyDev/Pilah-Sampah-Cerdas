import { Client } from "ssh2";
import fs from "fs";
import path from "path";

const config = {
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "",
};

const localBackupDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\scratch\\pilahsampah-id\\vps_backup";

if (!fs.existsSync(localBackupDir)) {
  fs.mkdirSync(localBackupDir, { recursive: true });
}

function execCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = "";
      let error = "";
      stream
        .on("close", (code, signal) => {
          resolve({ code, output, error });
        })
        .on("data", (data) => {
          output += data.toString();
        })
        .stderr.on("data", (data) => {
          error += data.toString();
        });
    });
  });
}

function downloadFile(conn, remotePath, localPath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`Downloading ${remotePath} -> ${localPath}...`);
      sftp.fastGet(remotePath, localPath, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

async function main() {
  const conn = new Client();
  console.log(" Connecting to VPS 157.10.252.252...");

  conn
    .on("ready", async () => {
      console.log(" SSH Connection established successfully.");

      // 1. Inspect VPS home directory & running containers / processes
      console.log("\n Inspecting VPS files & databases...");
      const inspectRes = await execCommand(
        conn,
        "ls -la /home/maker && which docker pg_dump mysqldump pm2 2>&1"
      );
      console.log("VPS Overview:\n", inspectRes.output);

      // 2. Locate project dir
      const findRes = await execCommand(
        conn,
        "find /home/maker /var/www /opt -maxdepth 3 -name '.env' -o -name 'package.json' 2>/dev/null"
      );
      console.log(" Found Project Files / .env:\n", findRes.output);

      // 3. Create comprehensive archive of /home/maker and database dump
      console.log("\n Creating remote backup archive...");
      const tarCmd = `
        mkdir -p /tmp/trashcare_backup &&
        cd /tmp/trashcare_backup &&
        (pg_dumpall -U postgres > db_postgres_dump.sql 2>/dev/null || pg_dump -U postgres trashcare > db_postgres_dump.sql 2>/dev/null || mysqldump --all-databases > db_mysql_dump.sql 2>/dev/null || echo "No direct DB dump tool") &&
        tar -czf /tmp/vps_full_backup.tar.gz -C /home/maker . -C /tmp/trashcare_backup . 2>/dev/null &&
        ls -lh /tmp/vps_full_backup.tar.gz
      `;

      const tarRes = await execCommand(conn, tarCmd);
      console.log(" Archive Status:\n", tarRes.output);

      // 4. Download backup archive to local host
      const localFile = path.join(localBackupDir, `vps_backup_${Date.now()}.tar.gz`);
      await downloadFile(conn, "/tmp/vps_full_backup.tar.gz", localFile);
      console.log(`\n Backup download COMPLETE! Saved to: ${localFile}`);

      // Clean up remote tmp
      await execCommand(conn, "rm -rf /tmp/trashcare_backup /tmp/vps_full_backup.tar.gz");
      conn.end();
    })
    .on("error", (err) => {
      console.error(" SSH Error:", err.message);
    })
    .connect(config);
}

main();
