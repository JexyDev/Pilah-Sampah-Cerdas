import { Client } from "ssh2";
import fs from "fs";
import path from "path";

const conn = new Client();

const SEED_FILES = [
  {
    local: path.resolve("scratch/seed-more-warga.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/scratch/seed-more-warga.ts"
  },
  {
    local: path.resolve("scratch/seed-discrepancies.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/scratch/seed-discrepancies.ts"
  },
  {
    local: path.resolve("scratch/seed-recycling-ideas.ts"),
    remote: "/var/www/pilah-sampah-cerdas/backend/scratch/seed-recycling-ideas.ts"
  }
];

conn.on("ready", () => {
  console.log("=== Connected to VPS ===");

  // Step 1: Git pull & reset on both directories
  const gitCmd = `
    echo "Updating Backend..." && \
    cd /var/www/pilah-sampah-cerdas/backend && \
    git fetch origin && \
    git checkout -f local-dev && \
    git reset --hard origin/local-dev && \
    git clean -fd && \
    
    echo "Updating Frontend..." && \
    cd /var/www/pilah-sampah-cerdas/frontend && \
    git fetch origin && \
    git checkout -f local-dev && \
    git reset --hard origin/local-dev && \
    git clean -fd
  `;

  console.log("Running git pull/reset on VPS...");
  conn.exec(gitCmd, (err, stream) => {
    if (err) throw err;
    stream.on("close", (code) => {
      console.log(`Git pull completed with code ${code}`);
      if (code !== 0) {
        conn.end();
        process.exit(1);
      }
      uploadSeeds();
    }).on("data", (data: Buffer) => {
      process.stdout.write(data.toString());
    }).stderr.on("data", (data: Buffer) => {
      process.stderr.write(data.toString());
    });
  });
});

function uploadSeeds() {
  console.log("Uploading seed scripts to VPS...");
  conn.sftp((err, sftp) => {
    if (err) throw err;

    // Create scratch dir if not exist
    sftp.mkdir("/var/www/pilah-sampah-cerdas/backend/scratch", () => {
      let completed = 0;
      const uploadNext = () => {
        if (completed >= SEED_FILES.length) {
          console.log("All seed files uploaded successfully.");
          runBuildAndSeed();
          return;
        }

        const file = SEED_FILES[completed];
        console.log(`Uploading ${path.basename(file.local)} -> ${file.remote}...`);
        const content = fs.readFileSync(file.local);
        sftp.writeFile(file.remote, content, (writeErr) => {
          if (writeErr) {
            console.error("Upload failed:", writeErr);
            conn.end();
            process.exit(1);
          }
          completed++;
          uploadNext();
        });
      };
      uploadNext();
    });
  });
}

function runBuildAndSeed() {
  console.log("Building backend & seeding database on VPS...");
  
  const buildAndSeedCmd = `
    cd /var/www/pilah-sampah-cerdas/backend && \
    npm install && \
    npx prisma generate && \
    npx tsc && \
    echo "Stopping backend pm2..." && \
    (echo 'Makerdotindo2026' | sudo -S pm2 stop psc-backend || true) && \
    echo "Running primary seed..." && \
    npx prisma db seed && \
    echo "Running extra seeds..." && \
    npx tsx scratch/seed-more-warga.ts && \
    npx tsx scratch/seed-discrepancies.ts && \
    npx tsx scratch/seed-recycling-ideas.ts && \
    echo "Starting backend pm2..." && \
    echo 'Makerdotindo2026' | sudo -S pm2 start psc-backend
  `;

  conn.exec(buildAndSeedCmd, (err, stream) => {
    if (err) throw err;
    stream.on("close", (code) => {
      console.log(`Build & Seed completed with exit code: ${code}`);
      
      // Now build the frontend
      buildFrontend();
    }).on("data", (data: Buffer) => {
      process.stdout.write(data.toString());
    }).stderr.on("data", (data: Buffer) => {
      process.stderr.write(data.toString());
    });
  });
}

function buildFrontend() {
  console.log("Building frontend on VPS...");
  const frontendCmd = `
    cd /var/www/pilah-sampah-cerdas/frontend/frontend && \
    npm install && \
    npm run build
  `;
  
  conn.exec(frontendCmd, (err, stream) => {
    if (err) throw err;
    stream.on("close", (code) => {
      console.log(`Frontend build completed with exit code: ${code}`);
      conn.end();
      if (code === 0) {
        console.log("DEPLOYMENT AND DATA SYNC COMPLETED SUCCESSFULLY!");
      } else {
        console.error("DEPLOYMENT FAILED AT FRONTEND BUILD!");
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
