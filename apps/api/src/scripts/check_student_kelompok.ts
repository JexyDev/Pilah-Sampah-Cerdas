import { prisma } from "../lib/prisma.js";


async function checkStudents() {
  console.log("=== DIAGNOSTIK MAHASISWA & KELOMPOK KKN ===");

  const totalMahasiswaUsers = await prisma.user.count({
    where: { role: { name: "MAHASISWA_KKN" } },
  });

  const totalStudentKkn = await prisma.studentKkn.count();

  const unlinkedStudents = await prisma.studentKkn.count({
    where: { kelompokId: null },
  });

  console.log(`Total User Role MAHASISWA_KKN: ${totalMahasiswaUsers}`);
  console.log(`Total Record StudentKkn: ${totalStudentKkn}`);
  console.log(`StudentKkn Tanpa Kelompok (kelompokId null): ${unlinkedStudents}`);

  const kelompoks = await prisma.kelompokKkn.findMany({
    select: {
      id: true,
      name: true,
      dpl: { select: { name: true } },
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });

  console.log("\n=== SEBARAN MAHASISWA PER KELOMPOK (32 KELOMPOK) ===");
  let totalInKelompok = 0;
  kelompoks.forEach((k, idx) => {
    totalInKelompok += k._count.students;
    console.log(`${idx + 1}. ${k.name} | DPL: ${k.dpl?.name || "-"} | Total Mahasiswa: ${k._count.students}`);
  });
  console.log(`Total Mahasiswa Terdaftar di Kelompok: ${totalInKelompok}`);

  // Find any orphan StudentKkn whose kelompokId does not exist in KelompokKkn table
  const validKelompokIds = (await prisma.kelompokKkn.findMany({ select: { id: true } })).map((k) => k.id);
  const orphanStudents = await prisma.studentKkn.findMany({
    where: {
      NOT: { kelompokId: { in: validKelompokIds } },
    },
    select: { id: true, nim: true, kelompokId: true, user: { select: { name: true } } },
  });

  console.log(`\nMahasiswa dengan kelompokId tidak valid/orphan: ${orphanStudents.length}`);
  if (orphanStudents.length > 0) {
    orphanStudents.forEach((s) => {
      console.log(` - NIM: ${s.nim} | Nama: ${s.user?.name} | kelompokId: ${s.kelompokId}`);
    });
  }
}

checkStudents()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
