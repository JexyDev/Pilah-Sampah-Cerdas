const { Client } = require("ssh2");

const conn = new Client();

const script = `
cat << 'EOF' > test_find.js
import { AuthRepository } from './dist/repositories/authRepository.js';
async function main() {
  const repo = new AuthRepository();
  const inputs = ["0812001004", "petugas@psc.id", "budi.petugas@psc.id", "petugas", "08111111117", "08111111111", "budi", "Kang Maman", "0812001010"];
  for (const inp of inputs) {
    const res = await repo.findUserByPhone(inp);
    console.log("Input: '" + inp + "' -> " + (res ? res.name + " (" + res.role.name + ")" : "NULL"));
  }
}
main().catch(console.error);
EOF
node test_find.js
rm test_find.js
`;

conn.on("ready", () => {
  conn.exec(`cd /home/maker/Pilah-Sampah-Cerdas/apps/api && ${script}`, (err, stream) => {
    if (err) {
      console.error("Exec error:", err);
      conn.end();
      return;
    }
    let output = "";
    stream.on("close", () => {
      console.log(output);
      conn.end();
    }).on("data", (d) => output += d).stderr.on("data", (d) => output += "[STDERR] " + d);
  });
}).connect({
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
  readyTimeout: 30000
});
