import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const kelurahans = await prisma.kelurahan.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const kelompoks = await prisma.kelompokKkn.findMany({
    include: {
      dpl: { select: { id: true, name: true, phone: true } },
      students: {
        include: {
          user: { select: { id: true, name: true, phone: true } },
          assignedRw: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const dpls = await prisma.user.findMany({
    where: { role: { name: 'DPL' } },
    select: { id: true, name: true, phone: true },
  });

  const totalStudents = await prisma.studentKkn.count();
  const totalKetua = await prisma.studentKkn.count({ where: { isKetua: true } });

  console.log(`\n==================================================`);
  console.log(`📊 LAPORAN VERIFIKASI DATA REAL DATABASE TRASHCARE`);
  console.log(`==================================================`);
  console.log(` • Total Kelurahan di DB       : ${kelurahans.length} (${kelurahans.map((k) => k.name).join(', ')})`);
  console.log(` • Total DPL Terdaftar         : ${dpls.length} Dosen Pembimbing`);
  console.log(` • Total Kelompok KKN          : ${kelompoks.length} Kelompok`);
  console.log(` • Total Mahasiswa KKN di DB   : ${totalStudents} Mahasiswa`);
  console.log(` • Total Ketua Kelompok (👑)   : ${totalKetua} Ketua`);
  console.log(`==================================================\n`);

  console.log(`--------------------------------------------------`);
  console.log(`📋 SAMPLE DPL & KELOMPOK KKN TERHUBUNG (5 KELOMPOK PERTAMA):`);
  console.log(`--------------------------------------------------`);
  kelompoks.slice(0, 5).forEach((k, i) => {
    const ketua = k.students.find((s) => s.isKetua);
    console.log(`[${i + 1}] ${k.name} | Kelurahan: ${k.kelurahan || '-'}`);
    console.log(`    DPL           : ${k.dpl?.name || k.dplNamaMentah || 'Belum terhubung'}`);
    console.log(`    Ketua         : ${ketua ? ketua.user.name : '(Tidak ada)'}`);
    console.log(`    Cakupan RW    : ${JSON.stringify(k.cakupanRw)}`);
    console.log(`    Jumlah Anggota: ${k.students.length} Mahasiswa\n`);
  });
}

main().finally(() => prisma.$disconnect());
