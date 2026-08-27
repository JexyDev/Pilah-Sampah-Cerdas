const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;
}

const TIMESTAMP = getTimestamp();
const BACKUP_DIR = path.resolve(__dirname, '../../backups', `backup_${TIMESTAMP}`);
const SQL_BACKUP_FILE = path.join(BACKUP_DIR, `psc_db_${TIMESTAMP}.sql`);
const UPLOADS_TAR_FILE = path.join(BACKUP_DIR, `uploads_${TIMESTAMP}.tar.gz`);

// Pastikan direktori backup lokal tersedia
fs.mkdirSync(BACKUP_DIR, { recursive: true });

console.log('===========================================================');
console.log('       PULL & BACKUP DATA LENGKAP (VPS -> LOKAL)          ');
console.log('===========================================================');
console.log(`Lokasi Backup Lokal : ${BACKUP_DIR}`);
console.log(`Waktu Backup        : ${new Date().toLocaleString('id-ID')}`);
console.log('-----------------------------------------------------------');

const conn = new Client();

conn.on('ready', () => {
  console.log('✓ [1/3] Terhubung ke VPS (157.10.252.252 via SSH)');
  console.log('⏳ [2/3] Memulai dump database PostgreSQL (psc_db)...');

  // 1. Dump Database PostgreSQL
  const dumpCmd = `echo 'Makerdotindo2026' | sudo -S docker exec psc-postgres pg_dump -U psc_user -d psc_db --clean --if-exists --no-owner --no-privileges`;
  const sqlStream = fs.createWriteStream(SQL_BACKUP_FILE);
  let dbBytes = 0;

  conn.exec(dumpCmd, (err, stream) => {
    if (err) {
      console.error('❌ Gagal menjalankan pg_dump di VPS:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('data', (chunk) => {
      dbBytes += chunk.length;
      sqlStream.write(chunk);
      process.stdout.write(`\r   Mengunduh Database: ${(dbBytes / (1024 * 1024)).toFixed(2)} MB`);
    });

    stream.stderr.on('data', (data) => {
      const errStr = data.toString();
      if (!errStr.includes('[sudo] password for maker:') && !errStr.includes('NOTICE:')) {
        // Abaikan notifikasi standar postgres
      }
    });

    stream.on('close', (code) => {
      sqlStream.end(() => {
        console.log(`\n✓ Database berhasil di-backup (${(dbBytes / (1024 * 1024)).toFixed(2)} MB) -> ${path.basename(SQL_BACKUP_FILE)}`);

        // Update database/vps_latest.sql juga untuk kemudahan restore
        try {
          const latestDbPath = path.resolve(__dirname, '../../database/vps_latest.sql');
          fs.copyFileSync(SQL_BACKUP_FILE, latestDbPath);
        } catch (_) {}

        // 2. Backup Folder Uploads (Foto, Dokumen, Logbook, Presensi, dll)
        console.log('\n⏳ [3/3] Mengarsipkan & mengunduh folder uploads (Media & Lampiran)...');
        
        // Cek path uploads di VPS (apps/api/uploads dan uploads)
        const tarCmd = `tar -czf - -C /home/maker/Pilah-Sampah-Cerdas-new/apps/api uploads 2>/dev/null || tar -czf - -C /home/maker/Pilah-Sampah-Cerdas-new uploads 2>/dev/null || echo "EMPTY"`;
        const tarStream = fs.createWriteStream(UPLOADS_TAR_FILE);
        let uploadBytes = 0;

        conn.exec(tarCmd, (tarErr, tStream) => {
          if (tarErr) {
            console.warn('⚠️ Gagal mengambil file uploads:', tarErr.message);
            finish();
            return;
          }

          tStream.on('data', (chunk) => {
            uploadBytes += chunk.length;
            tarStream.write(chunk);
            process.stdout.write(`\r   Mengunduh Uploads: ${(uploadBytes / (1024 * 1024)).toFixed(2)} MB`);
          });

          tStream.on('close', () => {
            tarStream.end(() => {
              conn.end();
              if (uploadBytes > 100) {
                console.log(`\n✓ File Uploads berhasil di-backup (${(uploadBytes / (1024 * 1024)).toFixed(2)} MB) -> ${path.basename(UPLOADS_TAR_FILE)}`);
              } else {
                console.log('\nℹ️ Folder uploads kosong atau belum ada berkas.');
              }
              finish();
            });
          });
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ Koneksi SSH gagal:', err.message);
  process.exit(1);
}).connect({
  host: '157.10.252.252',
  port: 22,
  username: 'maker',
  password: 'Makerdotindo2026',
  readyTimeout: 60000,
  keepaliveInterval: 10000,
});

function finish() {
  console.log('\n===========================================================');
  console.log('🎉 BACKUP SELESAI DENGAN SUKSES!');
  console.log(`📁 Semua file tersimpan di folder lokal:`);
  console.log(`   ${BACKUP_DIR}`);
  console.log('===========================================================');
}
