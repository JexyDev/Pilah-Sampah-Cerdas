import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up Executive, Camat, and Lurah names in DB to pure human names...");

  const users = await prisma.user.findMany({
    include: { role: true, rtRw: { include: { kelurahan: true } } },
  });

  const lurahNames: Record<string, string> = {
    Dago: "Bpk. M. Ridwan",
    "Sadang Serang": "Bpk. H. Supriatna",
    Sekeloa: "Bpk. Drs. Yudi Permana",
    "Lebak Gede": "Bpk. H. Hendra Saputra",
    "Lebak Siliwangi": "Bpk. Bambang Suherman",
    Cipaganti: "Bpk. Ahmad Yani",
  };

  for (const user of users) {
    const role = user.role?.name;
    if (!["LURAH", "CAMAT", "ADMIN_DLH", "SUPER_ADMIN"].includes(role || "")) continue;

    let targetName = user.name;

    if (role === "CAMAT") {
      targetName = "Drs. H. Ahmad Sudrajat, M.Si";
    } else if (role === "ADMIN_DLH") {
      targetName = "Ir. Bambang Triyono";
    } else if (role === "SUPER_ADMIN") {
      targetName = "Super Admin DLH";
    } else if (role === "LURAH") {
      const kelName = user.rtRw?.kelurahan?.name || "";
      targetName = lurahNames[kelName] || "Bpk. M. Ridwan";
    }

    if (targetName !== user.name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: targetName },
      });
      console.log(`Updated [${role}] user ${user.id}: "${user.name}" -> "${targetName}"`);
    }
  }

  console.log("Done updating executive human names!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
