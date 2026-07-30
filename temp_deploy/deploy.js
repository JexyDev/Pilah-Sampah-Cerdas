const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  console.log('Client :: ready'); 
  const cmd = `bash -c "cd /home/maker/Pilah-Sampah-Cerdas && git stash && git fetch origin && git reset --hard origin/main && cd apps/api && npm install && npx prisma db push && npm run build && cd ../web && npm install && npm run build && pm2 restart all || true && pm2 status"`;
  conn.exec(cmd, (err, stream) => { 
    if (err) throw err;
    stream.on('close', () => {
      console.log('DEPLOYMENT COMPLETE!');
      conn.end();
    }).on('data', d => console.log('STDOUT: ' + d)).stderr.on('data', d => console.log('STDERR: ' + d)); 
  }); 
}).connect({ host: '157.10.252.252', port: 22, username: 'maker', password: 'Makerdotindo2026' });
