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
  const conn = new Client();
  console.log("Connecting to VPS...");

  conn
    .on("ready", async () => {
      console.log("SSH Connected.");

      const gitStatus = await execCommand(conn, "cd /home/maker/Pilah-Sampah-Cerdas-new && git status");
      console.log("Git Status in Pilah-Sampah-Cerdas-new:\n", gitStatus.output);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
    })
    .connect(vpsConfig);
}

main().catch(console.error);
