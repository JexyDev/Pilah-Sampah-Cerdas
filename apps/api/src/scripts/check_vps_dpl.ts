import { prisma } from "../lib/prisma.js";

async function run() {
  const dpls = await prisma.user.findMany({
    where: { role: { name: "DPL" } },
    select: { id: true, name: true, phone: true, dplKelompok: { select: { id: true, name: true } } },
    orderBy: { name: "asc" }
  });
  console.log("=== TOTAL DPL USERS:", dpls.length, "===");
  dpls.forEach(u => {
    console.log(`${u.name} | ${u.phone} | Kelompok: ${u.dplKelompok.map(k => k.name).join(", ") || "-"}`);
  });

  const kelompoks = await prisma.kelompokKkn.findMany({
    select: { id: true, name: true, dplNamaMentah: true, dpl: { select: { name: true } } },
    orderBy: { name: "asc" }
  });
  console.log("\n=== TOTAL KELOMPOK KKN:", kelompoks.length, "===");
  kelompoks.forEach(k => {
    console.log(`${k.name} | DPL: ${k.dpl?.name || k.dplNamaMentah || "-"}`);
  });
}

run().finally(() => prisma.$disconnect());
