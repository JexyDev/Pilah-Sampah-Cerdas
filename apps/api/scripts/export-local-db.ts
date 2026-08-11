import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Exporting 100% Exact Localhost Database Dump...');

  const dumpData = {
    roles: await prisma.role.findMany(),
    permissions: await prisma.permission.findMany(),
    provinsi: await prisma.provinsi.findMany(),
    kabupaten: await prisma.kabupaten.findMany(),
    kecamatan: await prisma.kecamatan.findMany(),
    kelurahan: await prisma.kelurahan.findMany(),
    rw: await prisma.rw.findMany(),
    rt: await prisma.rt.findMany(),
    kelompokKkn: await prisma.kelompokKkn.findMany(),
    users: await prisma.user.findMany({
      include: {
        studentProfile: true,
        petugasProfile: true
      }
    }),
    wasteCategories: await prisma.wasteCategory.findMany(),
    systemConfigs: await prisma.systemConfig.findMany()
  };

  const dumpPath = path.join(process.cwd(), 'scripts', 'localhost_data_dump.json');
  fs.writeFileSync(dumpPath, JSON.stringify(dumpData, null, 2), 'utf-8');

  console.log(`✅ Database dump created at: ${dumpPath}`);
  console.log(`📊 Statistics:
  - Roles: ${dumpData.roles.length}
  - Users: ${dumpData.users.length}
  - RWs: ${dumpData.rw.length}
  - RTs: ${dumpData.rt.length}
  - Kelompok KKN: ${dumpData.kelompokKkn.length}
  - Mahasiswa KKN: ${dumpData.users.filter(u => u.studentProfile).length}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Export failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
