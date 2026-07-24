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
  conn.exec('echo "Makerdotindo2026" | sudo -S pm2 status', (err, stream) => {
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
