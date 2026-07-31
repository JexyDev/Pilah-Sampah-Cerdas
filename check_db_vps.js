const { Client } = require("ssh2");

const conn = new Client();

const script = `
cat << 'EOF' > query_users.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, petugasProfile: true }
  });
  console.log('=== USERS IN VPS DATABASE (' + users.length + ' users) ===');
  users.forEach(u => {
    console.log("ID: " + u.id + " | Name: " + u.name + " | Phone: '" + u.phone + "' | Role: " + u.role.name + " | Status: " + u.status);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
EOF
node query_users.js
rm query_users.js
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
