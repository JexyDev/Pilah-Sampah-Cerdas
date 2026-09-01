const { Client } = require("ssh2");

const conn = new Client();
conn.on("ready", () => {
  console.log("SSH Client ready.");
  const payload = JSON.stringify({ phone: "+628176695922", password: "wrongpassword123" });
  const cmd = `curl -s -i -X POST -H "Content-Type: application/json" -d '${payload}' http://localhost:3000/api/v1/auth/login`;
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let data = "";
    stream.on("data", d => data += d);
    stream.on("close", (code) => {
      console.log("LOGIN RESPONSE:\n" + data);
      conn.end();
    });
  });
}).connect({
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "",
  readyTimeout: 30000
});

