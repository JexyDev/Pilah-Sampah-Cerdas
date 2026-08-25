const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const SQL_OUTPUT_PATH = path.resolve(__dirname, '../../database/trashcare.sql');
const BACKUP_PATH = path.resolve(__dirname, '../../database/vps_latest.sql');

console.log('=== Memulai Sinkronisasi Database VPS ke Lokal ===');
console.log('Target file:', SQL_OUTPUT_PATH);

const conn = new Client();

conn.on('ready', () => {
  console.log('✓ Terhubung ke VPS (157.10.252.252) via SSH.');
  console.log('Mengambil dump database PostgreSQL (psc_db) dari container psc-postgres...');

  const dumpCmd = `echo 'Makerdotindo2026' | sudo -S docker exec psc-postgres pg_dump -U psc_user -d psc_db --clean --if-exists --no-owner --no-privileges`;

  conn.exec(dumpCmd, (err, stream) => {
    if (err) {
      console.error('Error executing pg_dump:', err);
      conn.end();
      process.exit(1);
    }

    const writeStream = fs.createWriteStream(SQL_OUTPUT_PATH);
    const backupStream = fs.createWriteStream(BACKUP_PATH);

    stream.on('data', (data) => {
      // Filter out sudo password prompt if any
      const str = data.toString();
      if (str.includes('[sudo] password for maker:')) {
        const cleaned = str.replace(/\[sudo\] password for maker:\s*/g, '');
        if (cleaned.length > 0) {
          writeStream.write(cleaned);
          backupStream.write(cleaned);
        }
      } else {
        writeStream.write(data);
        backupStream.write(data);
      }
    });

    stream.stderr.on('data', (data) => {
      const errStr = data.toString();
      if (!errStr.includes('[sudo] password for maker:')) {
        process.stderr.write(errStr);
      }
    });

    stream.on('close', (code) => {
      writeStream.end();
      backupStream.end();
      conn.end();

      if (code === 0) {
        const stats = fs.statSync(SQL_OUTPUT_PATH);
        console.log(`✓ Dump database berhasil diunduh! Ukuran: ${(stats.size / 1024).toFixed(2)} KB`);
        
        // Cek apakah Docker lokal berjalan dan pulihkan jika container psc-postgres ada
        tryRestoreLocal();
      } else {
        console.error(`Dump gagal dengan kode keluar: ${code}`);
        process.exit(1);
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
  readyTimeout: 40000,
  keepaliveInterval: 5000,
});

function tryRestoreLocal() {
  console.log('\n=== Memeriksa Database Lokal ===');
  try {
    const dockerCheck = execSync('docker ps --format "{{.Names}}"', { stdio: 'pipe' }).toString();
    if (dockerCheck.includes('psc-postgres')) {
      console.log('✓ Container psc-postgres aktif di lokal. Merestore data...');
      execSync(`docker exec -i psc-postgres psql -U psc_user -d psc_db < "${SQL_OUTPUT_PATH}"`, { stdio: 'inherit', shell: true });
      console.log('✓ Data lokal berhasil disinkronkan 100% sama dengan VPS!');
    } else if (dockerCheck) {
      console.log('Container psc-postgres belum berjalan. Jalankan "docker compose up -d postgres" untuk memuat database lokal.');
    }
  } catch (e) {
    console.log('Docker Desktop lokal sedang tidak aktif.');
    console.log(`File SQL terbaru dari VPS sudah tersimpan di "${SQL_OUTPUT_PATH}".`);
    console.log('Saat Anda menyalakan Docker ("docker compose up -d postgres"), database akan otomatis diinisialisasi dari file ini.');
  }
}
