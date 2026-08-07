import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Data 6 Kelurahan di Kecamatan Coblong beserta jumlah RW resminya
const coblongHierarchy = [
  { name: "Dago", code: "01", rwCount: 13 },
  { name: "Sekeloa", code: "02", rwCount: 15 },
  { name: "Lebak Gede", code: "03", rwCount: 13 },
  { name: "Lebak Siliwangi", code: "04", rwCount: 7 },
  { name: "Sadang Serang", code: "05", rwCount: 21 },
  { name: "Cipaganti", code: "06", rwCount: 10 },
];

export async function seedAllCoblongRws() {
  console.log("==================================================");
  console.log("🏙️ SEEDING MASTER WILAYAH & 79 AKUN RW SE-COBLONG");
  console.log("==================================================\n");

  // 1. Roles
  let rwRole = await prisma.role.findUnique({ where: { name: "RW" } });
  if (!rwRole) rwRole = await prisma.role.create({ data: { name: "RW" } });

  let coblongKec = await prisma.kecamatan.findFirst({ where: { name: "Coblong" } });

  let createdRwCount = 0;
  let createdUserCount = 0;

  for (const kel of coblongHierarchy) {
    let kelurahan = await prisma.kelurahan.findFirst({ where: { name: kel.name } });
    if (!kelurahan) {
      kelurahan = await prisma.kelurahan.create({
        data: {
          name: kel.name,
          kecamatanId: coblongKec?.id || undefined,
        },
      });
    }

    console.log(`📌 Kelurahan ${kel.name} (${kel.rwCount} RW):`);

    for (let i = 1; i <= kel.rwCount; i++) {
      const rwPadded = String(i).padStart(2, "0");
      const rwName = `RW ${rwPadded}`;

      // 1. Upsert model Rw
      let rwRecord = await prisma.rw.findFirst({
        where: {
          kelurahanId: kelurahan.id,
          name: { contains: `RW ${i}`, mode: "insensitive" },
        },
      });

      const rwNamesList = [
        "H. Bambang Suherman, S.T.", "Drs. H. M. Yasin", "H. Asep Sunandar", "Ir. Dadang Iskandar",
        "Hj. Ratna Juwita", "Deden Supriatna", "H. Cecep Hidayat", "Endang Sutisna",
        "H. Budi Santoso", "Eko Prasetyo", "Drs. H. Rahmat Hidayat", "H. Agus Suhendar",
        "Tedi Setiadi", "H. Mulyadi Usman", "Hj. Siti Maryam"
      ];
      const personName = rwNamesList[(i - 1) % rwNamesList.length];
      const baseLat = -6.8900 + (i * 0.0008);
      const baseLng = 107.6150 + (i * 0.0009);

      if (!rwRecord) {
        rwRecord = await prisma.rw.create({
          data: {
            kelurahanId: kelurahan.id,
            name: rwName,
            latitude: baseLat as any,
            longitude: baseLng as any,
          },
        });
        createdRwCount++;
      }

      // 2. Format Phone Standar Wilayah: +6282200[KelCode][RwPadded]
      const rwPhone = `+6282200${kel.code}${rwPadded}`;
      const defaultPass = await bcrypt.hash(`rw${rwPadded}${kel.name.toLowerCase().replace(/\s+/g, "")}`, 10);

      let rwUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: rwPhone },
            {
              AND: [
                { rwId: rwRecord.id },
                { roleId: rwRole.id },
              ],
            },
          ],
        },
      });

      if (!rwUser) {
        rwUser = await prisma.user.create({
          data: {
            name: personName,
            phone: rwPhone,
            password: defaultPass,
            roleId: rwRole.id,
            rwId: rwRecord.id,
            status: "Aktif",
            mustChangePassword: false,
            address: `${rwName}, Kel. ${kel.name}, Kec. Coblong`,
          } as any,
        });
        createdUserCount++;
      } else {
        // Ensure rwId relation is connected & name updated
        rwUser = await prisma.user.update({
          where: { id: rwUser.id },
          data: {
            name: personName,
            rwId: rwRecord.id,
            roleId: rwRole.id,
            address: `${rwName}, Kel. ${kel.name}, Kec. Coblong`,
          },
        });
      }
    }
    console.log(`   -> Total ${kel.rwCount} RW & Akun terhubung.`);
  }

  console.log("\n==================================================");
  console.log("🎉 SEED MASTER WILAYAH COBLONG SELESAI!");
  console.log("==================================================");
  console.log(` • Total Entri RW DB Created/Linked : 79 RW`);
  console.log(` • Total Akun Pengurus RW          : 79 User (Role RW)`);
  console.log(` • Format No HP RW Standar        : +6282200[KelCode][RWNum]`);
  console.log(` • Password Default               : rw[nomor][namakelurahan] (cth: rw06dago)`);
  console.log("==================================================\n");
}

if (process.argv[1]?.includes("seed-master-coblong-rws")) {
  seedAllCoblongRws()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
