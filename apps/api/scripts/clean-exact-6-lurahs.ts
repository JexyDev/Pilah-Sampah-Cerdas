import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lurahRole = await prisma.role.findFirst({ where: { name: "LURAH" } });
  if (!lurahRole) return;

  const validLurahs = [
    { name: "Ida, A.KS.", phone: "+6281210000001", address: "Kelurahan Cipaganti, Kec. Coblong" },
    { name: "Jusni Giri Susilowati, S.Sos., M.Si.", phone: "+6281200991001", address: "Kelurahan Dago, Kec. Coblong" },
    { name: "Usman Adireja, S.Sos.", phone: "+6281210000003", address: "Kelurahan Lebakgede, Kec. Coblong" },
    { name: "Budi Rukmana, S.Sos., M.Si.", phone: "+6281210000004", address: "Kelurahan Lebaksiliwangi, Kec. Coblong" },
    { name: "Leny Mariana, S.Sos., M.AP.", phone: "+6281210000005", address: "Kelurahan Sadangserang, Kec. Coblong" },
    { name: "Tirta Gumelar, S.STP.", phone: "+6281200991021", address: "Kelurahan Sekeloa, Kec. Coblong" },
  ];

  const existingLurahs = await prisma.user.findMany({
    where: { roleId: lurahRole.id },
  });

  const validPhones = validLurahs.map((v) => v.phone);

  for (const existing of existingLurahs) {
    if (!validPhones.includes(existing.phone)) {
      // Clean child relations first
      await prisma.refreshToken.deleteMany({ where: { userId: existing.id } });
      await prisma.notification.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } }).catch((e) => console.log("Skip delete:", e.message));
    }
  }

  // Ensure all 6 exact lurahs are updated / created
  for (const l of validLurahs) {
    const existing = await prisma.user.findFirst({
      where: { roleId: lurahRole.id, phone: l.phone },
    });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: l.name,
          address: l.address,
        },
      });
      console.log(`Updated Lurah: ${l.name}`);
    } else {
      await prisma.user.create({
        data: {
          name: l.name,
          phone: l.phone,
          password: "$2b$10$e.eX4H5n0y5T3...dummy",
          roleId: lurahRole.id,
          status: "Aktif",
          address: l.address,
          fotoProfil: `https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=256&h=256&q=80`,
        },
      });
      console.log(`Created Lurah: ${l.name}`);
    }
  }

  console.log("✅ EXACT 6 CLEAN LURAHS CONSOLIDATED!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
