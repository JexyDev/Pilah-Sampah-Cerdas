const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SQL_OUTPUT_PATH = path.resolve(__dirname, '../../database/trashcare.sql');
const BACKUP_PATH = path.resolve(__dirname, '../../database/vps_latest.sql');

console.log('=== Sinkronisasi Database VPS ke Lokal ===');
console.log('Target file:', SQL_OUTPUT_PATH);

const conn = new Client();

conn.on('ready', () => {
  console.log('✓ Terhubung ke VPS (157.10.252.252).');
  console.log('1. Membuat dump PostgreSQL di server VPS...');

  const dumpCmd = `echo 'Makerdotindo2026' | sudo -S docker exec psc-postgres pg_dump -U psc_user -d psc_db --clean --if-exists --no-owner --no-privileges -f /tmp/psc_db_dump.sql && echo 'Makerdotindo2026' | sudo -S chmod 666 /tmp/psc_db_dump.sql`;

  conn.exec(dumpCmd, (err, stream) => {
    if (err) {
      console.error('Error executing pg_dump:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', (code) => {
      if (code !== 0) {
        console.error(`Dump di VPS gagal dengan code: ${code}`);
        conn.end();
        process.exit(1);
      }
      console.log('✓ Dump file di VPS berhasil dibuat (/tmp/psc_db_dump.sql).');
      console.log('2. Mengunduh dump file via SFTP Stream...');

      conn.sftp((err, sftp) => {
        if (err) {
          console.error('SFTP Error:', err);
          conn.end();
          process.exit(1);
        }

        const readStream = sftp.createReadStream('/tmp/psc_db_dump.sql');
        const writeStream = fs.createWriteStream(SQL_OUTPUT_PATH);

        let downloadedBytes = 0;
        readStream.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          process.stdout.write(`\r  Unduh: ${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB`);
        });

        readStream.on('end', () => {
          console.log('\n✓ Unduhan selesai!');
          writeStream.end();
          fs.copyFileSync(SQL_OUTPUT_PATH, BACKUP_PATH);

          // Cleanup remote dump
          conn.exec('rm -f /tmp/psc_db_dump.sql', () => {
            conn.end();
            restoreLocal();
          });
        });

        readStream.on('error', (err) => {
          console.error('\nError stream SFTP:', err);
          writeStream.end();
          conn.end();
          process.exit(1);
        });

        readStream.pipe(writeStream);
      });
    }).stderr.on('data', (data) => {
      const errStr = data.toString();
      if (!errStr.includes('[sudo] password for maker:')) {
        process.stderr.write(errStr);
      }
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({
  host: '157.10.252.252',
  port: 22,
  username: 'maker',
  password: 'Makerdotindo2026',
  readyTimeout: 60000,
  keepaliveInterval: 0,
});

function restoreLocal() {
  console.log('\n=== Memulihkan Database ke PostgreSQL Lokal ===');
  try {
    const dockerCheck = execSync('docker ps --format "{{.Names}}"', { stdio: 'pipe' }).toString();
    if (dockerCheck.includes('psc-postgres')) {
      console.log('✓ Container psc-postgres aktif. Memulai import...');
      execSync(`docker exec -i psc-postgres psql -U psc_user -d psc_db < "${SQL_OUTPUT_PATH}"`, { stdio: 'inherit', shell: true });
      console.log('\n✓ SUKSES: Database lokal telah 100% sinkron dan identik dengan database VPS!');
    } else {
      console.log('Container psc-postgres belum berjalan. Jalankan "docker compose up -d postgres".');
    }
  } catch (e) {
    console.error('Gagal import ke Docker:', e.message);
  }
}
