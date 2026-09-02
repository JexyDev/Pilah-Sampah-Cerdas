const { Client } = require('ssh2');

const deployCmd = `
set -e
echo "=== 1. Pulling latest code from development ==="
cd /home/maker/Pilah-Sampah-Cerdas-new
git stash || true
git fetch origin development
git checkout development || git checkout -b development origin/development
git reset --hard origin/development
git stash pop || true

echo "=== 2. Building Backend API ==="
cd /home/maker/Pilah-Sampah-Cerdas-new/apps/api
npx prisma generate
npm run build

echo "=== 3. Building Frontend Web (berseka.id) ==="
cd /home/maker/Pilah-Sampah-Cerdas-new/apps/web
npm run build || true

echo "=== 4. Reloading PM2 Backend (Cluster Mode Zero-Downtime) ==="
cd /home/maker/Pilah-Sampah-Cerdas-new/apps/api
pm2 reload ecosystem.config.cjs || pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
pm2 save

echo "=== 5. Checking PM2 Status ==="
pm2 status

echo "=== 6. Verifying Backend Logs ==="
sleep 3
pm2 logs psc-backend --lines 20 --nostream
`;

function runDeploy(retries = 10) {
  const conn = new Client();
  console.log(`[${new Date().toISOString()}] Attempting SSH connection to 157.10.252.252...`);
  
  conn.on('ready', () => {
    console.log('SSH Connection ESTABLISHED! Running deployment commands...');
    conn.exec(deployCmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`\nDeployment finished with exit code: ${code}`);
        conn.end();
        process.exit(code || 0);
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }).on('error', (err) => {
    console.error(`Connection failed (${err.message}). Retrying in 10 seconds... (${retries} retries left)`);
    if (retries > 0) {
      setTimeout(() => runDeploy(retries - 1), 10000);
    } else {
      process.exit(1);
    }
  }).connect({
    host: '157.10.252.252',
    port: 22,
    username: 'maker',
    password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "Makerdotindo2026",
    readyTimeout: 30000,
    keepaliveInterval: 10000
  });
}

runDeploy();
