import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '157.10.252.252',
  port: 22,
  username: 'maker',
  password: 'Makerdotindo2026'
};

const COMMANDS = `cd /var/www/pilah-sampah-cerdas/backend && git stash && git pull origin local-dev --rebase && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 delete all || true && echo "Makerdotindo2026" | sudo -S pm2 restart all && echo "DEPLOYMENT_DONE"`;

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(COMMANDS, (err: any, stream: any) => {
    if (err) throw err;
    stream.on('close', (code: any, signal: any) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data: any) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data: any) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err: any) => {
    console.error("SSH Error:", err);
}).connect(config);
