import { Client } from "ssh2";

const conn = new Client();

const cmd = process.argv.slice(2).join(" ");
if (!cmd) {
  console.error("Please provide a command to run, e.g.: npx tsx scratch/vps-runner.ts \"ls -la\"");
  process.exit(1);
}

conn.on("ready", () => {
  console.log(`=== Connected to VPS. Executing: "${cmd}" ===`);
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error("Execution error:", err);
      conn.end();
      process.exit(1);
    }
    stream.on("close", (code, signal) => {
      console.log(`=== Connection closed. Exit code: ${code} ===`);
      conn.end();
    }).on("data", (data: Buffer) => {
      process.stdout.write(data.toString());
    }).stderr.on("data", (data: Buffer) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
  readyTimeout: 20000
});
