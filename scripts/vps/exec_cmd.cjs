const { Client } = require('ssh2');

const cmd = process.argv[2] || 'pwd';

function runSSH(retries = 3) {
  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH Client connected. Running:', cmd);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`Command closed with code: ${code}`);
        conn.end();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }).on('error', (err) => {
    console.error('SSH Error:', err.message);
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      setTimeout(() => runSSH(retries - 1), 2000);
    }
  }).connect({
    host: '157.10.252.252',
    port: 22,
    username: 'maker',
    password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "",
    readyTimeout: 40000,
    keepaliveInterval: 5000
  });
}

runSSH();

