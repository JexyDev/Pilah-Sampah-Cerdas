import { PrismaClient } from "@prisma/client";

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
  console.log("🔧 FIX RT & RW HUMAN NAMES IN DATABASE");
  console.log("==================================================\n");

  const rtRole = await prisma.role.findFirst({ where: { name: "RT" } });
  const rwRole = await prisma.role.findFirst({ where: { name: "RW" } });

  if (!rtRole || !rwRole) {
    console.error("❌ Role RT or RW not found in database!");
    process.exit(1);
  }

  // Find all users with RT or RW role OR names starting with Ketua RT/RW
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { roleId: rtRole.id },
        { roleId: rwRole.id },
        { name: { contains: "Ketua RT" } },
        { name: { contains: "Ketua RW" } },
        { name: { startsWith: "RW " } },
        { name: { startsWith: "RT " } },
        { name: { startsWith: "Asep RW" } },
        { name: { startsWith: "Bambang RT" } },
      ]
    },
    include: { role: true, rtRw: true }
  });

  console.log(`Found ${users.length} RT/RW user accounts in DB.`);

  let rwIdx = 0;
  let rtIdx = 0;
  let updatedCount = 0;

  for (const user of users) {
    const isRt = user.role?.name === "RT" || user.name.toLowerCase().includes("rt");
    const isRw = !isRt;

    let newName = user.name;
    if (user.name.includes("Ketua") || user.name.startsWith("RW ") || user.name.startsWith("RT ") || user.name.startsWith("Asep RW") || user.name.startsWith("Bambang RT")) {
      if (isRt) {
        newName = rtNamesPool[rtIdx % rtNamesPool.length];
        rtIdx++;
      } else {
        newName = rwNamesPool[rwIdx % rwNamesPool.length];
        rwIdx++;
      }
    }

    const targetRoleId = isRt ? rtRole.id : rwRole.id;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: newName,
        roleId: targetRoleId,
      }
    });

    console.log(`✅ ID ${user.id}: "${user.name}" ➔ "${newName}" | Role: ${isRt ? "RT" : "RW"} | Wilayah: ${user.rtRw?.name || "Unassigned"}`);
    updatedCount++;
  }

  console.log(`\n==================================================`);
  console.log(`🎉 SUKSES DIPERBAIKI ${updatedCount} NAMA AKUN RT & RW!`);
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
