import { Client } from "ssh2";
import fs from "fs";
import path from "path";

const conn = new Client();

const FILES_TO_UPLOAD = [
  {
    local: path.resolve("src/services/dashboardService.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/src/services/dashboardService.ts"
  },
  {
    local: path.resolve("src/routes/authRoutes.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/src/routes/authRoutes.ts"
  },
  {
    local: path.resolve("src/index.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/src/index.ts"
  },
  {
    local: path.resolve("src/controllers/binController.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/src/controllers/binController.ts"
  },
  {
    local: path.resolve("src/routes/binRoutes.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/src/routes/binRoutes.ts"
  },
  {
    local: path.resolve("src/controllers/transactionController.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/src/controllers/transactionController.ts"
  },
  {
    local: path.resolve("prisma/seed-demo-real.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/prisma/seed-demo-real.ts"
  }
];

conn.on("ready", () => {
  console.log("Connected to VPS. Starting deployment...");

  conn.sftp((err, sftp) => {
    if (err) {
      console.error("SFTP Init Error:", err);
      conn.end();
      process.exit(1);
    }

    let completed = 0;
    const uploadNext = () => {
      if (completed >= FILES_TO_UPLOAD.length) {
        console.log("All files uploaded successfully via SFTP.");
        runPostUploadCommands();
        return;
      }

      const file = FILES_TO_UPLOAD[completed];
      console.log(`Uploading ${file.local} -> ${file.remote}...`);
      
      const content = fs.readFileSync(file.local);
      sftp.writeFile(file.remote, content, (writeErr) => {
        if (writeErr) {
          console.error(`Failed to upload ${file.local}:`, writeErr);
          conn.end();
          process.exit(1);
        }
        console.log(`Uploaded ${path.basename(file.local)}`);
        completed++;
        uploadNext();
      });
    };

    uploadNext();
  });
});

function runPostUploadCommands() {
  const cmd = "cd /var/www/pilah-sampah-cerdas/backend && npx tsc && echo 'Makerdotindo2026' | sudo -S pm2 restart psc-backend";
  
  console.log(`Executing post-upload commands on VPS: "${cmd}"...`);
  
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error("Exec command error:", err);
      conn.end();
      process.exit(1);
    }
    
    stream.on("close", (code, signal) => {
      console.log(`=== Commands executed. Exit code: ${code} ===`);
      conn.end();
      if (code === 0) {
        console.log("DEPLOYMENT AND SEEDING SUCCESSFUL!");
      } else {
        console.error("DEPLOYMENT COMMANDS FAILED!");
        process.exit(1);
      }
    }).on("data", (data: Buffer) => {
      process.stdout.write(data.toString());
    }).stderr.on("data", (data: Buffer) => {
      process.stderr.write(data.toString());
    });
  });
}

conn.connect({
  host: "157.10.252.252",
  port: 22,
  username: "maker",
  password: "Makerdotindo2026",
  readyTimeout: 30000
});
