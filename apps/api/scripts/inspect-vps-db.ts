import { Client } from "ssh2";

const config = {
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
};

function execCommand(conn: Client, cmd: string): Promise<{ code: number; output: string; error: string }> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = "";
      let error = "";
      stream
        .on("close", (code: number, signal: string) => {
          resolve({ code, output, error });
        })
        .on("data", (data: Buffer) => {
          output += data.toString();
        })
        .stderr.on("data", (data: Buffer) => {
          error += data.toString();
        });
    });
  });
}

async function main() {
  const conn = new Client();
  console.log("Connecting to VPS 157.10.252.252...");

  conn
    .on("ready", async () => {
      console.log("SSH Connected.");
      
      // Check docker containers or pm2 on VPS
      const psRes = await execCommand(conn, "docker ps");
      console.log("Docker containers:\n", psRes.output);

      const pm2Res = await execCommand(conn, "pm2 list");
      console.log("PM2 List:\n", pm2Res.output);

      // Check where postgres or db is and query postgres inside docker or host
      // Let's find running postgres container or psql
      const checkDbCmd = `
        POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)
        if [ -n "$POSTGRES_CONTAINER" ]; then
          echo "Postgres container found: $POSTGRES_CONTAINER"
          docker exec $POSTGRES_CONTAINER psql -U postgres -d psc_db -c "SELECT id, nama, dibuat_pada FROM kelompok_kkn WHERE nama ILIKE '%Lebak Gede%';" 2>&1 || docker exec $POSTGRES_CONTAINER psql -U psc_user -d psc_db -c "SELECT id, nama, dibuat_pada FROM kelompok_kkn WHERE nama ILIKE '%Lebak Gede%';" 2>&1
        fi
      `;
      const dbRes = await execCommand(conn, checkDbCmd);
      console.log("DB Query result:\n", dbRes.output);

      // Check attendance, presensi mandiri, and logbook on VPS
      const checkRecordsCmd = `
        POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)
        if [ -n "$POSTGRES_CONTAINER" ]; then
          docker exec $POSTGRES_CONTAINER psql -U postgres -d psc_db -c "
            SELECT u.nama, p.id, p.deskripsi_kegiatan, p.waktu_checkin, p.waktu_checkout, p.status 
            FROM presensi_mandiri p 
            JOIN pengguna u ON p.id_mahasiswa = u.id 
            WHERE u.nama ILIKE '%Dani Nurhalim%' OR u.nama ILIKE '%Najwa Intan%' OR u.nama ILIKE '%Chandra Nur Mulyani%';
          " 2>&1 || docker exec $POSTGRES_CONTAINER psql -U psc_user -d psc_db -c "
            SELECT u.nama, p.id, p.deskripsi_kegiatan, p.waktu_checkin, p.waktu_checkout, p.status 
            FROM presensi_mandiri p 
            JOIN pengguna u ON p.id_mahasiswa = u.id 
            WHERE u.nama ILIKE '%Dani Nurhalim%' OR u.nama ILIKE '%Najwa Intan%' OR u.nama ILIKE '%Chandra Nur Mulyani%';
          " 2>&1
        fi
      `;
      const recordsRes = await execCommand(conn, checkRecordsCmd);
      console.log("Presensi Mandiri on VPS:\n", recordsRes.output);

      const checkLogbookCmd = `
        POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)
        if [ -n "$POSTGRES_CONTAINER" ]; then
          docker exec $POSTGRES_CONTAINER psql -U postgres -d psc_db -c "
            SELECT u.nama, l.id, l.tanggal_kegiatan, l.waktu_mulai, l.waktu_selesai, l.tempat, l.deskripsi, l.status_persetujuan 
            FROM logbook_kkn l 
            JOIN pengguna u ON l.id_penulis = u.id 
            WHERE u.nama ILIKE '%Dani Nurhalim%' OR u.nama ILIKE '%Najwa Intan%' OR u.nama ILIKE '%Chandra Nur Mulyani%';
          " 2>&1 || docker exec $POSTGRES_CONTAINER psql -U psc_user -d psc_db -c "
            SELECT u.nama, l.id, l.tanggal_kegiatan, l.waktu_mulai, l.waktu_selesai, l.tempat, l.deskripsi, l.status_persetujuan 
            FROM logbook_kkn l 
            JOIN pengguna u ON l.id_penulis = u.id 
            WHERE u.nama ILIKE '%Dani Nurhalim%' OR u.nama ILIKE '%Najwa Intan%' OR u.nama ILIKE '%Chandra Nur Mulyani%';
          " 2>&1
        fi
      `;
      const logbookRes = await execCommand(conn, checkLogbookCmd);
      console.log("Logbook on VPS:\n", logbookRes.output);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
    })
    .connect(config);
}

main().catch(console.error);
