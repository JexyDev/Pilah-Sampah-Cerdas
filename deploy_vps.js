const { Client } = require("ssh2");

const conn = new Client();

const commands = [
  "pwd",
  "ls -la",
  "pm2 status || true",
  "docker ps || true",
  "find /home/maker -maxdepth 3 2>/dev/null",
  "find /var/www -maxdepth 3 2>/dev/null"
];

const cmdStr = commands.join(" && echo '===CMD_SEP===' && ");

conn.on("ready", () => {
  console.log("Connected to SSH VPS (157.10.252.252)");
  conn.exec(cmdStr, (err, stream) => {
    if (err) {
      console.error("Exec error:", err);
      conn.end();
      return;
    }
    let output = "";
    stream.on("close", (code, signal) => {
      console.log("=== OUTPUT START ===");
      console.log(output);
      console.log("=== OUTPUT END ===");
      conn.end();
    }).on("data", (data) => {
      output += data;
    }).stderr.on("data", (data) => {
      output += "[STDERR] " + data;
    });
  });
}).connect({
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
  readyTimeout: 30000
});
