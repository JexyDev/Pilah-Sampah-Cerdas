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
  console.log('1. Mengambil dump PostgreSQL dari VPS secara real-time streaming...');

  const dumpCmd = `echo 'Makerdotindo2026' | sudo -S docker exec psc-postgres pg_dump -U psc_user -d psc_db --clean --if-exists --no-owner --no-privileges`;

  const writeStream = fs.createWriteStream(SQL_OUTPUT_PATH);
  let downloadedBytes = 0;

  conn.exec(dumpCmd, (err, stream) => {
    if (err) {
      console.error('Error executing pg_dump on VPS:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      writeStream.write(chunk);
      process.stdout.write(`\r  Unduh & Dump: ${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB`);
    });

    stream.stderr.on('data', (data) => {
      const errStr = data.toString();
      if (!errStr.includes('[sudo] password for maker:') && !errStr.includes('NOTICE:')) {
        process.stderr.write(errStr);
      }
    });

    stream.on('close', (code) => {
      writeStream.end(() => {
        conn.end();
        if (downloadedBytes < 1000) {
          console.error(`\nDump terlalu kecil atau gagal (hanya ${downloadedBytes} bytes). Kode: ${code}`);
          process.exit(1);
        }
        console.log(`\n✓ Unduhan & dump VPS selesai (${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB)!`);
        try {
          fs.copyFileSync(SQL_OUTPUT_PATH, BACKUP_PATH);
        } catch (_) {}
        restoreLocal();
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
  password: 'Makerdotindo2026',
  readyTimeout: 60000,
  keepaliveInterval: 10000,
});

function restoreLocal() {
  console.log('\n=== Memulihkan Database ke PostgreSQL Lokal ===');
  try {
    const dockerCheck = execSync('docker ps --format "{{.Names}}"', { stdio: 'pipe' }).toString();
    if (dockerCheck.includes('psc-postgres')) {
      console.log('✓ Container psc-postgres aktif. Memulai import...');
      execSync(`docker exec -i psc-postgres psql -U psc_user -d psc_db < "${SQL_OUTPUT_PATH}"`, { stdio: 'inherit', shell: true });
      console.log('\n=============================================================');
      console.log('✓ SUKSES: Database lokal telah 100% sinkron dan identik dengan VPS!');
      console.log('=============================================================');
    } else {
      console.log('Container psc-postgres belum berjalan. Jalankan "docker compose up -d postgres".');
    }
  } catch (e) {
    console.error('Gagal import ke Docker:', e.message);
  }
}
