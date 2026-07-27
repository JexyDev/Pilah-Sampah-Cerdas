import { Client } from "ssh2";
import fs from "fs";
import path from "path";

const conn = new Client();

conn.on("ready", () => {
  conn.sftp((err: any, sftp: any) => {
    if (err) throw err;
    const localFile = path.resolve("scratch/check-db-users.ts");
    const remoteFile = "/var/www/pilah-sampah-cerdas/backend/scratch/check-db-users.ts";
    
    console.log("Uploading check-db-users.ts...");
    sftp.writeFile(remoteFile, fs.readFileSync(localFile), (writeErr: any) => {
      if (writeErr) throw writeErr;
      
      console.log("Executing script on VPS...");
      conn.exec("cd /var/www/pilah-sampah-cerdas/backend && npx tsx scratch/check-db-users.ts", (execErr: any, stream: any) => {
        if (execErr) throw execErr;
        stream.on("close", () => {
          conn.end();
        }).on("data", (data: Buffer) => {
          process.stdout.write(data.toString());
        }).stderr.on("data", (data: Buffer) => {
          process.stderr.write(data.toString());
        });
      });
    });
  });
}).connect({
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
  readyTimeout: 30000
});
