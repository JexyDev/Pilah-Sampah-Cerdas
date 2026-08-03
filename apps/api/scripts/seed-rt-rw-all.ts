import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🌱 SEEDING SELURUH KELURAHAN & RW KECAMATAN COBLONG");
  console.log("==================================================\n");

  const kelurahans = [
    "Dago",
    "Sadang Serang",
    "Sekeloa",
    "Lebak Gede",
    "Lebak Siliwangi",
    "Cipaganti",
  ];

  let totalRwCreated = 0;

  for (const kelName of kelurahans) {
    const kel = await prisma.kelurahan.upsert({
      where: { name: kelName },
      update: {},
      create: { name: kelName },
    });

    console.log(`📍 Kelurahan: ${kel.name}`);

    // Create RW 01 to RW 15 for each Kelurahan if not exist
    for (let i = 1; i <= 15; i++) {
      const rwName = `RW ${i < 10 ? "0" + i : i}`;
      const fullName = `${rwName} (${kel.name})`;

      const existing = await prisma.rtRwArea.findFirst({
        where: {
          kelurahanId: kel.id,
          name: { contains: rwName },
        },
      });

      if (!existing) {
        await prisma.rtRwArea.create({
          data: {
            kelurahanId: kel.id,
            name: fullName,
          },
        });
        totalRwCreated++;
      }
    }
  }

  const totalRtRwInDb = await prisma.rtRwArea.count();
  console.log(`\n==================================================`);
  console.log(`✅ SEED SELESAI: ${totalRwCreated} RW Baru Dibuat.`);
  console.log(`📊 TOTAL RT/RW TERDAFTAR DI DATABASE: ${totalRtRwInDb} Wilayah`);
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
