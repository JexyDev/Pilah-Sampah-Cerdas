import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '157.10.252.252',
  port: 22,
  username: 'maker',
  password: 'Makerdotindo2026'
};

const COMMANDS = `
ls -la /var/www
ls -la /var/www/pilah-sampah-cerdas || true
ls -la /var/www/pilah-sampah-cerdas/backend || true
`;

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(COMMANDS, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
    console.error("SSH Error:", err);
}).connect(config);
