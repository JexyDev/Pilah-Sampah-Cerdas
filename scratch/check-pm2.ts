import { Client } from 'ssh2';

const conn = new Client();
const config = {
  host: '157.10.252.252',
  port: 22,
  username: 'maker',
  password: 'Makerdotindo2026'
};

conn.on('ready', () => {
  console.log('Client :: ready');
  // Kill root process on port 3000 and restart pm2
  const cmd = 'echo "Makerdotindo2026" | sudo -S kill -9 $(echo "Makerdotindo2026" | sudo -S lsof -t -i:3000) || true; sleep 2; pm2 restart psc-backend';
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect(config);
