import { prisma } from "../lib/prisma.js";

async function main() {
  const k6 = await prisma.kelompokKkn.findFirst({
    where: { name: { contains: "Sadang Serang", mode: "insensitive" } },
    include: {
      poskoKkn: true,
      students: { include: { user: true } },
      dpl: true,
      facilities: true,
    }
  });

  console.log("=== KELOMPOK 6 SADANG SERANG ===");
  console.log("ID:", k6?.id);
  console.log("Name:", k6?.name);
  console.log("Kelurahan:", k6?.kelurahan);
  console.log("Cakupan RW:", JSON.stringify(k6?.cakupanRw));
  console.log("Posko KKN Utama:", k6?.poskoKkn);
  console.log("Auto Polygon:", k6?.autoPolygon);
  console.log("Total Mahasiswa:", k6?.students?.length);
  
  const allK = await prisma.kelompokKkn.findMany({
    where: { name: { contains: "Sadang Serang", mode: "insensitive" } },
    select: { id: true, name: true, cakupanRw: true, poskoKkn: true }
  });
  console.log("=== ALL SADANG SERANG KELOMPOK ===");
  allK.forEach(k => console.log(k.name, "RW:", JSON.stringify(k.cakupanRw), "Posko:", k.poskoKkn ? k.poskoKkn.nama : "NONE"));

  const multis = await (prisma as any).poskoKknMulti.findMany();
  console.log("=== ALL MULTI POSKOS IN DB ===", multis.length);
  multis.forEach((m: any) => console.log(m));

  const sadangRws = await prisma.rw.findMany({
    where: { kelurahan: { name: { contains: "Sadang", mode: "insensitive" } } },
    orderBy: { name: "asc" }
  });
  console.log("=== SADANG SERANG RWS IN DB (" + sadangRws.length + ") ===");
  sadangRws.forEach(r => console.log(`${r.name}: id=${r.id}, lat=${r.latitude}, lng=${r.longitude}`));

  console.log("=== MAHASISWA DI KELOMPOK 6 ===");
  k6?.students?.forEach(s => {
    console.log(`- ${s.user?.name} | NIM: ${s.nim} | Ketua: ${s.isKetua} | Phone: ${s.user?.phone}`);
  });

  const mutiara = await prisma.studentKkn.findMany({
    where: { user: { name: { contains: "Mutiara", mode: "insensitive" } } },
    include: { user: true, kelompok: true }
  });
  console.log("=== USER MUTIARA ===");
  mutiara.forEach(s => console.log(s.user?.name, "Kelompok:", s.kelompok?.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
