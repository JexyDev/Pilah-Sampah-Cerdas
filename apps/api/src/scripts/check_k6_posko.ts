import { prisma } from "../lib/prisma.js";

async function main() {
  const k6 = await prisma.kelompokKkn.findFirst({
    where: { name: "Kelompok 6 Sadang Serang" },
    include: {
      poskoKkn: true,
      students: { include: { user: true } },
      facilities: true,
    }
  });

  console.log("=== KELOMPOK 6 SADANG SERANG DETAIL ===");
  console.log("ID:", k6?.id);
  console.log("Name:", k6?.name);
  console.log("Cakupan RW:", JSON.stringify(k6?.cakupanRw));
  console.log("Posko Utama:", k6?.poskoKkn);
  console.log("Facilities:", k6?.facilities);

  const multis = await (prisma as any).poskoKknMulti.findMany({
    where: { kelompokId: k6?.id }
  });
  console.log("Multi Poskos for Kelompok 6:", multis);

  const students = await prisma.studentKkn.findMany({
    where: { kelompokId: k6?.id },
    include: { user: true }
  });
  console.log("Students count:", students.length);
  students.forEach(s => console.log(`- ${s.user?.name} (NIM: ${s.nim}, WA: ${s.user?.phone})`));

  // Check if Mutiara exists in any student record
  const mutiara = await prisma.studentKkn.findMany({
    where: {
      user: { name: { contains: "Mutiara", mode: "insensitive" } }
    },
    include: { user: true, kelompok: true }
  });
  console.log("=== MUTIARA SEARCH ===");
  mutiara.forEach(m => console.log(`${m.user?.name} | NIM: ${m.nim} | Kelompok: ${m.kelompok?.name}`));

  // Check RW 01, RW 02, RW 05 coordinates in DB
  const rws = await prisma.rw.findMany({
    where: {
      kelurahan: { name: { contains: "Sadang", mode: "insensitive" } },
      name: { in: ["RW 01", "RW 02", "RW 05", "RW 1", "RW 2", "RW 5"] }
    }
  });
  console.log("=== SADANG SERANG RW 01, 02, 05 COORDINATES ===");
  rws.forEach(r => console.log(`${r.name}: lat=${r.latitude}, lng=${r.longitude}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
