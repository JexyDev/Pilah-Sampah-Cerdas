import { Client } from "ssh2";

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
  console.log("Connecting to VPS 157.10.252.252...");

  conn
    .on("ready", async () => {
      console.log("SSH Connected.");

      // Check systemctl for postgres / redis / etc
      const svcRes = await execCommand(conn, "systemctl status postgresql redis --no-pager 2>&1 || true");
      console.log("Services:\n", svcRes.output);

      // Check psc-backend directory and .env
      const envRes = await execCommand(conn, "find /home/maker /var/www -name '.env*' -exec ls -l {} + 2>/dev/null");
      console.log("Env files on VPS:\n", envRes.output);

      // Check database connection using psql locally on VPS
      const dbCheck = await execCommand(conn, "sudo -u postgres psql -l || psql -U postgres -l || psql -U psc_user -d psc_db -l");
      console.log("Postgres databases:\n", dbCheck.output, dbCheck.error);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
    })
    .connect(config);
}

main().catch(console.error);
