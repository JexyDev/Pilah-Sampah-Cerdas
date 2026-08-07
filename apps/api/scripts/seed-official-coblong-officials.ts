import { PrismaClient } from "@prisma/client";
import { getRandomDefaultAvatar } from "../src/utils/avatarUtils.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 UPDATING OFFICIAL STAKEHOLDER ACCOUNTS IN REAL DATABASE...");

  // Get or Create Roles
  const roles = await prisma.role.findMany();
  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    roleMap[r.name] = r.id;
  }

  // Ensure Roles Exist
  const requiredRoles = [
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
    "WARGA",
  ];

  for (const rName of requiredRoles) {
    if (!roleMap[rName]) {
      const createdRole = await prisma.role.create({
        data: { name: rName },
      });
      roleMap[rName] = createdRole.id;
    }
  }

  // Ensure Kecamatan Coblong & Kelurahans exist
  let kecamatan = await prisma.kecamatan.findFirst({ where: { name: "Coblong" } });
  if (!kecamatan) {
    kecamatan = await prisma.kecamatan.create({
      data: { name: "Coblong", code: "32.73.06" },
    });
  }

  const kelurahanSpecs = [
    { name: "Cipaganti", lurahName: "Ida, A.KS.", rwCount: 7, phone: "+6281210000001" },
    { name: "Dago", lurahName: "Jusni Giri Susilowati, S.Sos., M.Si.", rwCount: 13, phone: "+6281210000002" },
    { name: "Lebakgede", lurahName: "Usman Adireja, S.Sos.", rwCount: 13, phone: "+6281210000003" },
    { name: "Lebaksiliwangi", lurahName: "Budi Rukmana, S.Sos., M.Si.", rwCount: 6, phone: "+6281210000004" },
    { name: "Sadangserang", lurahName: "Leny Mariana, S.Sos., M.AP.", rwCount: 21, phone: "+6281210000005" },
    { name: "Sekeloa", lurahName: "Tirta Gumelar, S.STP.", rwCount: 16, phone: "+6281210000006" },
  ];

  for (const spec of kelurahanSpecs) {
    let kel = await prisma.kelurahan.findFirst({
      where: { name: { equals: spec.name, mode: "insensitive" }, kecamatanId: kecamatan.id },
    });
    if (!kel) {
      kel = await prisma.kelurahan.create({
        data: { name: spec.name, kecamatanId: kecamatan.id },
      });
    }

    // Upsert Lurah User Account
    const existingLurah = await prisma.user.findFirst({
      where: {
        roleId: roleMap["LURAH"],
        OR: [
          { address: { contains: spec.name, mode: "insensitive" } },
          { phone: spec.phone },
        ],
      },
    });

    const lurahAvatar = getRandomDefaultAvatar(spec.lurahName);
    if (existingLurah) {
      await prisma.user.update({
        where: { id: existingLurah.id },
        data: {
          name: spec.lurahName,
          address: `Kelurahan ${spec.name}, Kec. Coblong`,
          fotoProfil: lurahAvatar,
        },
      });
      console.log(`Updated Lurah ${spec.name}: ${spec.lurahName}`);
    } else {
      await prisma.user.create({
        data: {
          name: spec.lurahName,
          phone: spec.phone,
          password: "$2b$10$e.eX4H5n0y5T3...dummy",
          roleId: roleMap["LURAH"],
          status: "Aktif",
          address: `Kelurahan ${spec.name}, Kec. Coblong`,
          fotoProfil: lurahAvatar,
        },
      });
      console.log(`Created Lurah ${spec.name}: ${spec.lurahName}`);
    }
  }

  // Update DLH: Darto, A.P., M.M.
  const dlhUser = await prisma.user.findFirst({ where: { roleId: roleMap["ADMIN_DLH"] } });
  if (dlhUser) {
    await prisma.user.update({
      where: { id: dlhUser.id },
      data: {
        name: "Darto, A.P., M.M.",
        address: "Dinas Lingkungan Hidup Kota Bandung",
        fotoProfil: getRandomDefaultAvatar("Darto, A.P., M.M."),
      },
    });
    console.log("Updated ADMIN_DLH: Darto, A.P., M.M.");
  } else {
    await prisma.user.create({
      data: {
        name: "Darto, A.P., M.M.",
        phone: "+6281200000088",
        password: "$2b$10$e.eX4H5n0y5T3...dummy",
        roleId: roleMap["ADMIN_DLH"],
        status: "Aktif",
        address: "Dinas Lingkungan Hidup Kota Bandung",
        fotoProfil: getRandomDefaultAvatar("Darto, A.P., M.M."),
      },
    });
    console.log("Created ADMIN_DLH: Darto, A.P., M.M.");
  }

  // Update Camat: Ratna Rahayu Pitriyati, S.STP., M.Si.
  const camatUser = await prisma.user.findFirst({ where: { roleId: roleMap["CAMAT"] } });
  if (camatUser) {
    await prisma.user.update({
      where: { id: camatUser.id },
      data: {
        name: "Ratna Rahayu Pitriyati, S.STP., M.Si.",
        address: "Kantor Kecamatan Coblong, Kota Bandung",
        fotoProfil: getRandomDefaultAvatar("Ratna Rahayu Pitriyati"),
      },
    });
    console.log("Updated CAMAT: Ratna Rahayu Pitriyati, S.STP., M.Si.");
  } else {
    await prisma.user.create({
      data: {
        name: "Ratna Rahayu Pitriyati, S.STP., M.Si.",
        phone: "+6281200000099",
        password: "$2b$10$e.eX4H5n0y5T3...dummy",
        roleId: roleMap["CAMAT"],
        status: "Aktif",
        address: "Kantor Kecamatan Coblong, Kota Bandung",
        fotoProfil: getRandomDefaultAvatar("Ratna Rahayu Pitriyati"),
      },
    });
    console.log("Created CAMAT: Ratna Rahayu Pitriyati, S.STP., M.Si.");
  }

  // Update Pimpinan: Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.
  const pemimpinUser = await prisma.user.findFirst({ where: { roleId: roleMap["PEMIMPIN"] } });
  if (pemimpinUser) {
    await prisma.user.update({
      where: { id: pemimpinUser.id },
      data: {
        name: "Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.",
        address: "Rektorat UNIKOM",
        fotoProfil: getRandomDefaultAvatar("Eddy Soeryanto Soegoto"),
      },
    });
    console.log("Updated PEMIMPIN: Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.");
  } else {
    await prisma.user.create({
      data: {
        name: "Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.",
        phone: "+6281200000077",
        password: "$2b$10$e.eX4H5n0y5T3...dummy",
        roleId: roleMap["PEMIMPIN"],
        status: "Aktif",
        address: "Rektorat UNIKOM",
        fotoProfil: getRandomDefaultAvatar("Eddy Soeryanto Soegoto"),
      },
    });
    console.log("Created PEMIMPIN: Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.");
  }

  // Update Task Force: Task Force
  const tfUser = await prisma.user.findFirst({ where: { roleId: roleMap["PANITIA_TASKFORCE"] } });
  if (tfUser) {
    await prisma.user.update({
      where: { id: tfUser.id },
      data: {
        name: "Task Force",
        address: "Panitia Task Force KKN UNIKOM",
        fotoProfil: getRandomDefaultAvatar("Task Force"),
      },
    });
    console.log("Updated PANITIA_TASKFORCE: Task Force");
  } else {
    await prisma.user.create({
      data: {
        name: "Task Force",
        phone: "+6281200000066",
        password: "$2b$10$e.eX4H5n0y5T3...dummy",
        roleId: roleMap["PANITIA_TASKFORCE"],
        status: "Aktif",
        address: "Panitia Task Force KKN UNIKOM",
        fotoProfil: getRandomDefaultAvatar("Task Force"),
      },
    });
    console.log("Created PANITIA_TASKFORCE: Task Force");
  }

  console.log("✅ ALL OFFICIAL STAKEHOLDER ACCOUNTS UPDATED IN REAL DATABASE!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
