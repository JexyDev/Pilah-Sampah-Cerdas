import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/hashUtils.js";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🌱 MASTER SEEDING: KECAMATAN COBLONG & HIERARKI PERAN");
  console.log("==================================================\n");

  const DEFAULT_PASSWORD_HASH = await hashPassword("password123");

  // 1. Ensure Roles exist
  const roles = [
    "SUPER_ADMIN",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "DPL",
    "MAHASISWA_KKN",
    "PETUGAS_RESIDU",
    "WARGA",
  ];

  const roleMap: Record<string, number> = {};
  for (const roleName of roles) {
    const roleRecord = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleMap[roleName] = roleRecord.id;
  }
  console.log("✅ 10 Peran (Roles) terverifikasi.");

  // 2. Define 6 Kelurahan & RW Counts in Kecamatan Coblong
  const kelurahanMaster = [
    { name: "Dago", rwCount: 13 },
    { name: "Sadang Serang", rwCount: 9 },
    { name: "Sekeloa", rwCount: 15 },
    { name: "Lebak Gede", rwCount: 13 },
    { name: "Lebak Siliwangi", rwCount: 7 },
    { name: "Cipaganti", rwCount: 11 },
  ];

  let totalRwCreated = 0;
  let phoneCounter = 1000;

  const getNextPhone = () => {
    phoneCounter++;
    return `+62812999${phoneCounter}`;
  };

  // 3. Seed Camat & Admin DLH Accounts
  await prisma.user.upsert({
    where: { phone: "+6281200000001" },
    update: { roleId: roleMap["CAMAT"], password: DEFAULT_PASSWORD_HASH },
    create: {
      name: "Drs. H. Ahmad Sudrajat, M.Si (Camat Coblong)",
      phone: "+6281200000001",
      password: DEFAULT_PASSWORD_HASH,
      roleId: roleMap["CAMAT"],
      address: "Kantor Kecamatan Coblong, Jl. Ir. H. Juanda No. 154, Bandung",
      status: "Aktif",
    },
  });

  await prisma.user.upsert({
    where: { phone: "+6281200000002" },
    update: { roleId: roleMap["ADMIN_DLH"], password: DEFAULT_PASSWORD_HASH },
    create: {
      name: "Ir. Bambang Triyono (Admin DLH Kota Bandung)",
      phone: "+6281200000002",
      password: DEFAULT_PASSWORD_HASH,
      roleId: roleMap["ADMIN_DLH"],
      address: "Dinas Lingkungan Hidup Kota Bandung, Jl. Sadang Serang",
      status: "Aktif",
    },
  });

  console.log("✅ Akun Camat & Admin DLH siap.");

  // 4. Seed Kelurahan, Lurah Accounts, RWs & RW Accounts
  let fallbackOfficialAreaId: number | null = null;

  for (const kelData of kelurahanMaster) {
    const kel = await prisma.kelurahan.upsert({
      where: { name: kelData.name },
      update: {},
      create: { name: kelData.name },
    });

    // Seed Lurah Account
    const lurahPhone = getNextPhone();
    await prisma.user.upsert({
      where: { phone: `+6281200${lurahPhone.slice(-6)}` },
      update: { roleId: roleMap["LURAH"] },
      create: {
        name: `Lurah ${kel.name} (Bpk. M. Ridwan)`,
        phone: `+6281200${lurahPhone.slice(-6)}`,
        password: DEFAULT_PASSWORD_HASH,
        roleId: roleMap["LURAH"],
        address: `Kantor Kelurahan ${kel.name}, Coblong`,
        status: "Aktif",
      },
    });

    console.log(`📍 Kelurahan: ${kel.name} (${kelData.rwCount} RW)`);

    for (let i = 1; i <= kelData.rwCount; i++) {
      const rwCode = `RW ${i < 10 ? "0" + i : i}`;
      const fullName = `${rwCode} (${kel.name})`;

      let area = await prisma.rtRwArea.findFirst({
        where: {
          kelurahanId: kel.id,
          name: fullName,
        },
      });

      if (!area) {
        area = await prisma.rtRwArea.create({
          data: {
            kelurahanId: kel.id,
            name: fullName,
          },
        });
        totalRwCreated++;
      }

      if (!fallbackOfficialAreaId) {
        fallbackOfficialAreaId = area.id;
      }

      // Seed RW Account for first 3 RWs of each Kelurahan as real representation
      if (i <= 3) {
        const rwPhone = getNextPhone();
        await prisma.user.upsert({
          where: { phone: rwPhone },
          update: { rtRwId: area.id, roleId: roleMap["RW"] },
          create: {
            name: `Ketua ${rwCode} ${kel.name}`,
            phone: rwPhone,
            password: DEFAULT_PASSWORD_HASH,
            roleId: roleMap["RW"],
            rtRwId: area.id,
            address: `Jl. Wilayah ${rwCode}, Kel. ${kel.name}, Coblong`,
            status: "Aktif",
          },
        });

        // Seed RT Account connected to this RW area
        const rtPhone = getNextPhone();
        await prisma.user.upsert({
          where: { phone: rtPhone },
          update: { rtRwId: area.id, roleId: roleMap["RT"] },
          create: {
            name: `Ketua RT 01 / ${rwCode} ${kel.name}`,
            phone: rtPhone,
            password: DEFAULT_PASSWORD_HASH,
            roleId: roleMap["RT"],
            rtRwId: area.id,
            address: `RT 01 / ${rwCode}, Kel. ${kel.name}, Coblong`,
            status: "Aktif",
          },
        });
      }
    }
  }

  // 5. Clean dirty RT/RW areas cleanly after official areas are created
  const allCurrentAreas = await prisma.rtRwArea.findMany();
  const dirtyAreas = allCurrentAreas.filter(
    (a) => !a.name.match(/^RW \d{2} \(.+\)$/) && !a.name.match(/^RT \d{2} \/ RW \d{2} \(.+\)$/)
  );

  if (dirtyAreas.length > 0 && fallbackOfficialAreaId) {
    console.log(`🧹 Membersihkan ${dirtyAreas.length} data RT/RW acak/dirty...`);
    const dirtyIds = dirtyAreas.map((a) => a.id);

    // Re-link connected records to fallback official area
    await prisma.user.updateMany({
      where: { rtRwId: { in: dirtyIds } },
      data: { rtRwId: fallbackOfficialAreaId },
    });

    await prisma.household.updateMany({
      where: { rtRwId: { in: dirtyIds } },
      data: { rtRwId: fallbackOfficialAreaId },
    });

    await prisma.bin.updateMany({
      where: { rtRwId: { in: dirtyIds } },
      data: { rtRwId: fallbackOfficialAreaId },
    });

    await prisma.facility.updateMany({
      where: { rtRwId: { in: dirtyIds } },
      data: { rtRwId: fallbackOfficialAreaId },
    });

    await prisma.studentKkn.updateMany({
      where: { assignedPolygonId: { in: dirtyIds } },
      data: { assignedPolygonId: fallbackOfficialAreaId },
    });

    await prisma.pemanfaatan.updateMany({
      where: { rwId: { in: dirtyIds } },
      data: { rwId: fallbackOfficialAreaId },
    });

    await prisma.kknHandoverHistory.updateMany({
      where: { rtRwId: { in: dirtyIds } },
      data: { rtRwId: fallbackOfficialAreaId },
    });

    await prisma.rtRwArea.deleteMany({
      where: { id: { in: dirtyIds } },
    });
    console.log("✅ Data RT/RW acak berhasil re-link & dibersihkan dari DB.");
  }

  const totalRtRwInDb = await prisma.rtRwArea.count();
  const totalUsersInDb = await prisma.user.count();

  console.log(`\n==================================================`);
  console.log(`✅ SEEDER BERHASIL EKSEKUSI:`);
  console.log(`📍 RW Resmi Baru Dibuat: ${totalRwCreated}`);
  console.log(`📊 Total RW Terdaftar di DB: ${totalRtRwInDb}`);
  console.log(`👥 Total Akun Pengguna Terdaftar: ${totalUsersInDb}`);
  console.log(`🔐 Password Default Seluruh Akun: password123`);
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
