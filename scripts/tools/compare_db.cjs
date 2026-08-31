const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const TRASHCARE_SQL = path.resolve(__dirname, '../../database/trashcare.sql');
const VPS_LATEST_SQL = path.resolve(__dirname, '../../database/vps_latest.sql');

function parseSqlCounts(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const counts = {};
  let currentTable = null;
  let count = 0;

  for (const line of content.split('\n')) {
    if (line.startsWith('COPY public.')) {
      const match = line.match(/^COPY public\.("?[a-zA-Z0-9_]+"?) /);
      if (match) {
        currentTable = match[1].replace(/"/g, '');
        count = 0;
      }
    } else if (line === '\\.' && currentTable) {
      counts[currentTable] = count;
      currentTable = null;
    } else if (currentTable) {
      count++;
    }
  }
  return counts;
}

async function runComparison() {
  console.log('=== MEMULAI ANALISIS LENGKAP PERBANDINGAN DATABASE ===\n');

  const trashcareCounts = parseSqlCounts(TRASHCARE_SQL) || {};
  const vpsLatestCounts = parseSqlCounts(VPS_LATEST_SQL) || {};

  const trashcareStat = fs.existsSync(TRASHCARE_SQL) ? fs.statSync(TRASHCARE_SQL) : null;
  const vpsLatestStat = fs.existsSync(VPS_LATEST_SQL) ? fs.statSync(VPS_LATEST_SQL) : null;

  console.log('1. [File Lokal `database/trashcare.sql`]:');
  console.log(`   - Ukuran: ${(trashcareStat.size / (1024*1024)).toFixed(2)} MB`);
  console.log(`   - Waktu Simpan: ${trashcareStat.mtime.toLocaleString('id-ID')}`);

  console.log('2. [File Lokal `database/vps_latest.sql`]:');
  console.log(`   - Ukuran: ${(vpsLatestStat.size / (1024*1024)).toFixed(2)} MB`);
  console.log(`   - Waktu Simpan: ${vpsLatestStat.mtime.toLocaleString('id-ID')}`);

  const conn = new Client();
  conn.on('ready', () => {
    console.log('\n3. [Database LIVE VPS (PostgreSQL Container `psc-postgres`)]:');
    console.log('   - Terhubung ke 157.10.252.252...');

    const countQuery = `
      SELECT table_name, 
             (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1]::text::int AS row_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC;
    `;

    const cmd = `echo "${process.env.VPS_PASSWORD || process.env.VPS_PASS || ''}" | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -t -A -F ',' -c "${countQuery.replace(/\n/g, ' ')}"`;

    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      let out = '';
      stream.on('data', d => { out += d.toString(); });
      stream.on('close', code => {
        const vpsLiveCounts = {};
        out.split('\n').filter(l => l.trim() && !l.includes('[sudo]')).forEach(l => {
          const parts = l.split(',');
          if (parts.length >= 2) {
            vpsLiveCounts[parts[0].trim()] = parseInt(parts[1].trim(), 10) || 0;
          }
        });

        console.log(`   - Total Tabel: ${Object.keys(vpsLiveCounts).length} tabel`);

        console.log('\n' + '='.repeat(85));
        console.log('| TABEL PENTING                   | DUMP TRASHCARE | DUMP VPS_LATEST | LIVE VPS (TERBARU) |');
        console.log('='.repeat(85));

        const targetTables = [
          'pengguna',
          'tempat_sampah',
          'pemanfaatan_sampah',
          'kehadiran_kegiatan',
          'mahasiswa_kkn',
          'kelompok_kkn',
          'posko_kkn',
          'program_kerja_kkn',
          'logbook_kkn',
          'logbook_dpl',
          'penilaian_kkn_mahasiswa',
          'survei_kelurahan',
          'survei_karakteristik_wilayah',
          'endline_survei_kelurahan',
          'fasilitas',
          'notifikasi',
          'lokasi_mahasiswa',
          'jejak_audit',
          'rw',
          'rt',
          'setoran_otomatis',
          'setoran_manual'
        ];

        let isLiveEqualTrashcare = true;
        let isLiveEqualVpsLatest = true;

        targetTables.forEach(t => {
          const tc = trashcareCounts[t] !== undefined ? trashcareCounts[t] : '-';
          const vl = vpsLatestCounts[t] !== undefined ? vpsLatestCounts[t] : '-';
          const live = vpsLiveCounts[t] !== undefined ? vpsLiveCounts[t] : '-';

          if (tc !== live) isLiveEqualTrashcare = false;
          if (vl !== live) isLiveEqualVpsLatest = false;

          console.log(`| ${t.padEnd(31)} | ${String(tc).padEnd(14)} | ${String(vl).padEnd(15)} | ${String(live).padEnd(18)} |`);
        });

        console.log('='.repeat(85));

        console.log('\n=== KESIMPULAN ANALISIS ===');
        console.log(`1. Database LIVE di VPS adalah sumber data PALING TERBARU & LENGKAP.`);
        console.log(`   - Total Jejak Audit Live : ${vpsLiveCounts['jejak_audit'] || 0} event.`);
        console.log(`   - Total Lokasi Mahasiswa : ${vpsLiveCounts['lokasi_mahasiswa'] || 0} titik.`);
        console.log(`   - Total Pengguna         : ${vpsLiveCounts['pengguna'] || 0} user.`);
        console.log(`   - Total Kehadiran KKN    : ${vpsLiveCounts['kehadiran_kegiatan'] || 0} sesi.`);
        console.log(`   - Total Pemanfaatan      : ${vpsLiveCounts['pemanfaatan_sampah'] || 0} program.`);

        conn.end();
      });
    });
  }).on('error', err => {
    console.error('SSH Error:', err.message);
  }).connect({
    host: '157.10.252.252',
    port: 22,
    username: 'maker',
    password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "",
    readyTimeout: 40000,
    keepaliveInterval: 5000
  });
}

runComparison();
