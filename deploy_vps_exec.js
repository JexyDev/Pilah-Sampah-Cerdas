const { Client } = require("ssh2");

const conn = new Client();

const deployScript = `
export PATH=$PATH:/usr/local/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin
echo "=== 1. Pulling Latest Code from Git ==="
cd /home/maker/Pilah-Sampah-Cerdas
git fetch origin main
git reset --hard origin/main

echo "=== 2. Resetting Database & Seeding Real Data (apps/api) ==="
cd /home/maker/Pilah-Sampah-Cerdas/apps/api
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push --skip-generate
npx tsx scripts/seed-official-coblong-officials.ts || true
npx tsx scripts/seed-rt-rw-all.ts || true
npx tsx scripts/seed-dpl-real.ts || true
npx tsx scripts/seed-mhs-demo.ts || true
npm run build

echo "=== 3. Restarting PM2 Backend ==="
~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin/pm2 restart psc-backend || pm2 restart all || true

echo "=== 4. Building Frontend Web (apps/web) ==="
cd /home/maker/Pilah-Sampah-Cerdas/apps/web
npm install --silent
npm run build

echo "=== 5. Deploying Frontend to Web Root ==="
sudo mkdir -p /var/www/html /var/www/pilah-sampah-cerdas/frontend/dist
sudo rm -rf /var/www/html/assets /var/www/pilah-sampah-cerdas/frontend/dist/assets
sudo cp -r dist/* /var/www/html/
sudo cp -r dist/* /var/www/pilah-sampah-cerdas/frontend/dist/


echo "=== 6. Status Service ==="
pm2 status || true
`;

conn.on("ready", () => {
  console.log("Connected to VPS (157.10.252.252). Executing deployment script...");
  conn.exec(deployScript, (err, stream) => {
    if (err) {
      console.error("Exec error:", err);
      conn.end();
      return;
    }
    stream.on("close", (code, signal) => {
      console.log(`\nDeployment process finished with exit code: ${code}`);
      conn.end();
    }).on("data", (data) => {
      process.stdout.write(data);
    }).stderr.on("data", (data) => {
      process.stderr.write(data);
    });
  });
}).on("error", (err) => {
  console.error("SSH Error:", err);
}).connect({
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
  readyTimeout: 120000,
  keepaliveInterval: 10000,
});

