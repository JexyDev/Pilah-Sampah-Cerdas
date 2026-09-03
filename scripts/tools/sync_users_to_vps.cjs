const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOCAL_DUMP_PATH = path.resolve(__dirname, '../../database/local_users_dump.sql');

console.error('⛔ DILARANG: Sinkronisasi/Overwrite database lokal ke VPS telah DINONAKTIFKAN secara permanen.');
console.error('Data pengguna dan mahasiswa di VPS telah dimodifikasi secara manual oleh tim dan merupakan Single Source of Truth.');
process.exit(1);

const conn = new Client();

conn.on('ready', () => {
  console.log('✓ Terhubung ke VPS (157.10.252.252) via SSH.');
  console.log('Mengunggah dan mengaplikasikan database lokal ke VPS PostgreSQL container (psc-postgres)...');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err);
      conn.end();
      process.exit(1);
    }

    const remoteTempPath = '/tmp/local_users_dump.sql';
    sftp.fastPut(LOCAL_DUMP_PATH, remoteTempPath, (err) => {
      if (err) {
        console.error('SFTP Upload Error:', err);
        conn.end();
        process.exit(1);
      }

      console.log('✓ File dump database lokal berhasil diunggah ke VPS.');
      console.log('Memulihkan data ke container psc-postgres di VPS...');

      const restoreCmd = `echo "${process.env.VPS_PASSWORD || process.env.VPS_PASS || ''}" | sudo -S docker exec -i psc-postgres psql -U psc_user -d psc_db < ${remoteTempPath} && echo "${process.env.VPS_PASSWORD || process.env.VPS_PASS || ''}" | sudo -S rm -f ${remoteTempPath}`;

      conn.exec(restoreCmd, (err, stream) => {
        if (err) {
          console.error('Restore Execution Error:', err);
          conn.end();
          process.exit(1);
        }

        stream.on('close', (code) => {
          conn.end();
          if (fs.existsSync(LOCAL_DUMP_PATH)) {
            fs.unlinkSync(LOCAL_DUMP_PATH);
          }

          if (code === 0) {
            console.log('=====================================================');
            console.log('✓ DATA PENGGUNA & PERATURAN LOKAL 100% TERINTEGRASI KE VPS!');
            console.log('  - Admin, DPL, Mahasiswa, Petugas Pemilah, Pimpinan, Developer & Master Data');
            console.log('=====================================================');
          } else {
            console.error(`Sinkronisasi VPS berakhir dengan kode exit: ${code}`);
            process.exit(1);
          }
        });

        stream.stderr.on('data', (data) => {
          const errStr = data.toString();
          if (!errStr.includes('[sudo] password for maker:') && !errStr.includes('NOTICE:')) {
            process.stderr.write(errStr);
          }
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({
  host: '157.10.252.252',
  port: 22,
  username: 'maker',
  password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "",
  readyTimeout: 40000,
  keepaliveInterval: 5000,
});
