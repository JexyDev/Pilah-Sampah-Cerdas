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

      const queryLebakGede = await execCommand(conn, `echo Makerdotindo2026 | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -c "
        SELECT j.id, j.title, j.date, j.dibuat_pada, j.location, j.latitude, j.longitude, j.radius, j.is_aktif, k.nama as kelompok_nama
        FROM jadwal j
        JOIN kelompok_kkn k ON j.id_kelompok = k.id
        WHERE k.nama ILIKE '%Lebak Gede%'
        ORDER BY j.date DESC, j.dibuat_pada DESC;
      "`);
      console.log("=== DETAIL SCHEDULES LEBAK GEDE ===\n", queryLebakGede.output);

      // Check if there are any presensi_kegiatan linked to any schedule
      const queryAllPresensi = await execCommand(conn, `echo Makerdotindo2026 | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -c "
        SELECT a.id, a.id_jadwal, u.nama, a.hadir_pada, a.status
        FROM presensi_kegiatan a
        JOIN pengguna u ON a.id_mahasiswa = u.id
        ORDER BY a.hadir_pada DESC
        LIMIT 20;
      "`);
      console.log("=== PRESENSI KEGIATAN ===\n", queryAllPresensi.output);

      conn.end();
    })
    .on("error", (err) => {
      console.error("SSH Error:", err.message);
    })
    .connect(config);
}

main().catch(console.error);
