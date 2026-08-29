import { Client } from "ssh2";
import * as fs from "fs";
import * as path from "path";

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
  console.log("Connecting to VPS 157.10.252.252 to dump database...");

  conn
    .on("ready", async () => {
      console.log("SSH Connected.");

      // 1. Run pg_dump inside psc-postgres on VPS to /tmp/psc_db_dump.sql
      console.log("Creating database dump on VPS...");
      const dumpCmd = `echo Makerdotindo2026 | sudo -S docker exec psc-postgres pg_dump -U psc_user -d psc_db > /tmp/psc_db_dump.sql`;
      const dumpRes = await execCommand(conn, dumpCmd);
      if (dumpRes.error && !dumpRes.error.includes("password")) {
        console.warn("Dump warning/error:", dumpRes.error);
      }

      // Check dump file size on VPS
      const sizeRes = await execCommand(conn, "ls -lh /tmp/psc_db_dump.sql");
      console.log("Dump file on VPS:", sizeRes.output);

      // 2. Download dump file using SFTP to local path
      const localDumpPath = path.resolve(process.cwd(), "vps_psc_db_dump.sql");
      console.log(`Downloading dump to ${localDumpPath}...`);

      conn.sftp((err, sftp) => {
        if (err) {
          console.error("SFTP Error:", err);
          conn.end();
          return;
        }

        const readStream = sftp.createReadStream("/tmp/psc_db_dump.sql");
        const writeStream = fs.createWriteStream(localDumpPath);

        readStream.pipe(writeStream);

        writeStream.on("finish", () => {
          console.log(`✅ Successfully downloaded database dump from VPS to: ${localDumpPath}`);
          const stats = fs.statSync(localDumpPath);
          console.log(`Local dump size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          conn.end();
        });

        writeStream.on("error", (wErr) => {
          console.error("Local write error:", wErr);
          conn.end();
        });
      });
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
    })
    .connect(config);
}

main().catch(console.error);
