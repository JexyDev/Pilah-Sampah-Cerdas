import { Client } from "ssh2";
import fs from "fs";
import path from "path";

const config = {
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
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
      console.log(`📥 Downloading SFTP: ${remotePath} -> ${localPath}...`);
      sftp.fastGet(
        remotePath,
        localPath,
        {
          step: (transferred, chunk, total) => {
            const pct = ((transferred / total) * 100).toFixed(1);
            if (transferred % (1024 * 1024) < chunk) {
              console.log(`   Progress: ${pct}% (${(transferred / 1024 / 1024).toFixed(2)} MB / ${(total / 1024 / 1024).toFixed(2)} MB)`);
            }
          },
        },
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  });
}

async function main() {
  const conn = new Client();
  console.log("🔌 Connecting to VPS 157.10.252.252...");

  conn
    .on("ready", async () => {
      console.log("✅ SSH Connected.");

      // 1. Inspect Docker & PM2
      const dockerRes = await execCommand(conn, "docker ps -a 2>&1");
      console.log("\n📦 Running Docker Containers:\n", dockerRes.output);

      const pm2Res = await execCommand(conn, "pm2 status 2>&1");
      console.log("\n⚡ Running PM2 Services:\n", pm2Res.output);

      // 2. Dump Databases
      console.log("\n💾 Dumping Database & Environment Variables...");
      const dumpScript = `
        mkdir -p /tmp/trashcare_dump &&
        cd /tmp/trashcare_dump &&
        
        # Dump Postgres from Docker container if present
        POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)
        if [ -n "$POSTGRES_CONTAINER" ]; then
          echo "Dumping Postgres container $POSTGRES_CONTAINER..."
          docker exec $POSTGRES_CONTAINER pg_dumpall -U postgres > postgres_full_dump.sql 2>/dev/null || true
        fi

        # Dump local Postgres if present
        if command -v pg_dumpall >/dev/null 2>&1; then
          pg_dumpall -U postgres > postgres_host_dump.sql 2>/dev/null || true
        fi

        # Copy all .env files
        find /home/maker /var/www -name '.env*' -exec cp --parents {} . \\; 2>/dev/null || true
      `;
      await execCommand(conn, dumpScript);

      // 3. Compress /home/maker and /var/www excluding node_modules & build artifacts
      console.log("\n📦 Creating compressed archive (excluding node_modules)...");
      const compressCmd = `
        tar -czf /tmp/trashcare_vps_backup.tar.gz \
          --exclude='node_modules' \
          --exclude='.next' \
          --exclude='dist' \
          --exclude='.git' \
          /home/maker/Pilah-Sampah-Cerdas \
          /home/maker/uploads \
          /var/www/pilah-sampah-cerdas \
          /tmp/trashcare_dump \
          2>/dev/null || true
        ls -lh /tmp/trashcare_vps_backup.tar.gz
      `;

      const compressRes = await execCommand(conn, compressCmd);
      console.log("📦 Archive Output:", compressRes.output);

      // 4. Download file
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const localFile = path.join(localBackupDir, `trashcare_vps_backup_${timestamp}.tar.gz`);

      await downloadFile(conn, "/tmp/trashcare_vps_backup.tar.gz", localFile);
      console.log(`\n🎉 BACKUP SUCCESSFUL! Local path: ${localFile}`);

      // Clean up remote tmp
      await execCommand(conn, "rm -rf /tmp/trashcare_dump /tmp/trashcare_vps_backup.tar.gz");
      conn.end();
    })
    .on("error", (err) => {
      console.error("❌ SSH Error:", err.message);
    })
    .connect(config);
}

main();
