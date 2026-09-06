import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/hashUtils.js";

const prisma = new PrismaClient();

const rwNamesPool = [
  "Bpk. Asep Hendra", "Bpk. Budi Santoso", "Bpk. Cecep Hidayat", "Bpk. Dadang Suherman",
  "Bpk. Eko Kurniawan", "Bpk. Firman Utina", "Bpk. Gunawan Hidayat", "Bpk. Hendra Setiawan",
  "Bpk. Irwan Wijaya", "Bpk. Joko Widodo", "Bpk. Kosasih", "Bpk. Lukman Hakim",
  "Bpk. Maman Abdurrahman", "Bpk. Nana Sumarna", "Bpk. Oman Sukmana", "Bpk. Popon Sutarman",
  "Bpk. Rahmat Hidayat", "Bpk. Suryana", "Bpk. Tatang Sutarman", "Bpk. Ujang Koswara",
  "Bpk. Wahyu Hidayat", "Bpk. Yayan Ruhian", "Bpk. Zainal Abidin"
];

const rtNamesPool = [
  "Bpk. Agum Gumelar", "Bpk. Bambang Pamungkas", "Bpk. Caca Handika", "Bpk. Dedi Mulyadi",
  "Bpk. Engkus Kusnadi", "Bpk. Farid Husain", "Bpk. Ganjar Pranowo", "Bpk. Haji Oding",
  "Bpk. Indra Sjafri", "Bpk. Jajang C. Noer", "Bpk. Kiki Syahnakri", "Bpk. Leman Abidin",
  "Bpk. Mulyadi", "Bpk. Nuryadi", "Bpk. Otong Lalo", "Bpk. Pamungkas",
  "Bpk. Ridwan Kamil", "Bpk. Syafruddin", "Bpk. Tono Suratman", "Bpk. Utut Adianto",
  "Bpk. Wawan Hermawan", "Bpk. Yudi Guntara", "Bpk. Zulkifli"
];

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

  const kelurahanCenterMap: Record<string, { lat: number; lng: number }> = {
    "Dago": { lat: -6.8850, lng: 107.6140 },
    "Sadang Serang": { lat: -6.8930, lng: 107.6250 },
    "Sekeloa": { lat: -6.8910, lng: 107.6180 },
    "Lebak Gede": { lat: -6.8890, lng: 107.6100 },
    "Lebak Siliwangi": { lat: -6.8870, lng: 107.6060 },
    "Cipaganti": { lat: -6.8950, lng: 107.6030 },
  };

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

    const center = kelurahanCenterMap[kelData.name] || { lat: -6.8903, lng: 107.6110 };

    for (let i = 1; i <= kelData.rwCount; i++) {
      const rwCode = `RW ${i < 10 ? "0" + i : i}`;
      const fullName = `${rwCode} (${kel.name})`;

      // Calculate spread-out GPS coordinates around Kelurahan center
      const angle = (i / kelData.rwCount) * 2 * Math.PI;
      const radiusOffset = 0.002 + (i % 3) * 0.001; // ~200m - 500m radius
      const rwLat = Number((center.lat + Math.sin(angle) * radiusOffset).toFixed(7));
      const rwLng = Number((center.lng + Math.cos(angle) * radiusOffset).toFixed(7));

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
            latitude: rwLat,
            longitude: rwLng,
          },
        });
        totalRwCreated++;
      } else if (!area.latitude || !area.longitude) {
        area = await prisma.rtRwArea.update({
          where: { id: area.id },
          data: {
            latitude: rwLat,
            longitude: rwLng,
          },
        });
      }

      if (!fallbackOfficialAreaId) {
        fallbackOfficialAreaId = area.id;
      }

      // Seed RW Account for first 3 RWs of each Kelurahan as real representation
      if (i <= 3) {
        const rwPhone = getNextPhone();
        const rwHumanName = rwNamesPool[totalRwCreated % rwNamesPool.length];
        await prisma.user.upsert({
          where: { phone: rwPhone },
          update: { rtRwId: area.id, roleId: roleMap["RW"] },
          create: {
            name: rwHumanName,
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
        const rtHumanName = rtNamesPool[totalRwCreated % rtNamesPool.length];
        await prisma.user.upsert({
          where: { phone: rtPhone },
          update: { rtRwId: area.id, roleId: roleMap["RT"] },
          create: {
            name: rtHumanName,
            phone: rtPhone,
            password: DEFAULT_PASSWORD_HASH,
            roleId: roleMap["RT"],
            rtRwId: area.id,
            address: `RT 01 / ${rwCode}, Kel. ${kel.name}, Coblong`,
            status: "Aktif",
          },
        });

        // Seed Dedicated Petugas Residu Account connected 1-to-1 to this RW area
        const petugasPhone = getNextPhone();
        const petugasUser = await prisma.user.upsert({
          where: { phone: petugasPhone },
          update: { rtRwId: area.id, roleId: roleMap["PETUGAS_RESIDU"] },
          create: {
            name: `Petugas Residu ${rwCode} ${kel.name}`,
            phone: petugasPhone,
            password: DEFAULT_PASSWORD_HASH,
            roleId: roleMap["PETUGAS_RESIDU"],
            rtRwId: area.id,
            address: `Pos Residu ${rwCode}, Kel. ${kel.name}, Coblong`,
            status: "Aktif",
          },
        });

        await prisma.rtRwArea.update({
          where: { id: area.id },
          data: { petugasResiduId: petugasUser.id },
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
