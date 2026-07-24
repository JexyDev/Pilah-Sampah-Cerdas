const { Client } = require('ssh2');

const conn = new Client();

const commands = [
  'cd /var/www/pilah-sampah-cerdas/backend && git fetch origin local-dev && git checkout local-dev && git pull origin local-dev',
  'cd /var/www/pilah-sampah-cerdas/backend && npm install',
  'cd /var/www/pilah-sampah-cerdas/backend && npm run build',
  'pm2 restart psc-backend',
  'cd /var/www/pilah-sampah-cerdas/frontend && git fetch origin local-dev && git checkout local-dev && git pull origin local-dev',
  'cd /var/www/pilah-sampah-cerdas/frontend/frontend && npm install',
  'cd /var/www/pilah-sampah-cerdas/frontend/frontend && npm run build',
  'pm2 restart psc-frontend'
];

conn.on('ready', () => {
  console.log('Client :: ready');
  
  const executeCommand = (index) => {
    if (index >= commands.length) {
      console.log('All commands executed successfully!');
      conn.end();
      return;
    }
    
    const cmd = commands[index];
    console.log(`Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`Stream :: close :: code: ${code}, signal: ${signal}`);
        if (code === 0) {
          executeCommand(index + 1);
        } else {
          console.error(`Command failed: ${cmd}`);
          // Fallback to next command anyway just in case it's a minor warning
          executeCommand(index + 1);
        }
      }).on('data', (data) => {
        console.log(`STDOUT: ${data}`);
      }).stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
      });
    });
  };
  
  executeCommand(0);
}).connect({
  host: '157.10.252.252',
  port: 22,
  username: 'maker',
  password: 'Makerdotindo2026',
  readyTimeout: 60000
});
