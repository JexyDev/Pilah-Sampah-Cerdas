import { Client } from "ssh2";

const conn = new Client();

function execCommand(conn: Client, cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = "";
      stream
        .on("close", () => resolve(output))
        .on("data", (data: Buffer) => {
          output += data.toString();
        })
        .stderr.on("data", (data: Buffer) => {
          output += data.toString();
        });
    });
  });
}

async function main() {
  conn.on("ready", async () => {
    console.log("Connected to VPS.");
    const sql = `
      SELECT 
        k.id_kelurahan_survei,
        k.nama_kelurahan,
        p.persentase_pemilahan,
        p.tingkat_pemilahan,
        p.catatan as catatan_pemilahan,
        v.organik_kg_per_hari,
        v.anorganik_kg_per_hari,
        v.residu_kg_per_hari,
        v.total_volume_kg_per_hari,
        v.catatan as catatan_volume
      FROM survei_kelurahan k
      LEFT JOIN survei_pemilahan_sampah p ON k.id_kelurahan_survei = p.id_kelurahan_survei
      LEFT JOIN survei_volume_sampah v ON k.id_kelurahan_survei = v.id_kelurahan_survei
      ORDER BY k.id_kelurahan_survei;
    `;

    console.log("=== 1. DATA SURVEI BASELINE DI VPS ===");
    const res = await execCommand(conn, `echo 'Makerdotindo2026' | sudo -S docker exec psc-postgres psql -U psc_user -d psc_db -c "${sql}"`);
    console.log(res);

    console.log("=== GIT BRANCH ON VPS ===");
    const gitBranchRes = await execCommand(conn, "cd /home/maker/Pilah-Sampah-Cerdas-new && git branch && git log -n 1 --oneline");
    console.log(gitBranchRes);




    conn.end();
  }).connect({
    host: "157.10.252.252",
    port: 22,
    username: "maker",
    password: process.env.VPS_PASSWORD || process.env.VPS_PASS || "Makerdotindo2026",
    readyTimeout: 30000,
  });
}

main().catch(console.error);
