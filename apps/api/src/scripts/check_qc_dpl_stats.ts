import { prisma } from '../lib/prisma.js';

async function main() {
  const dpls = await prisma.user.findMany({
    where: { role: { name: { in: ['DPL', 'DOSEN_PEMBIMBING'] } } },
    select: { id: true, name: true, phone: true, nip: true },
  });

  const kelompoks = await prisma.kelompokKkn.findMany({
    include: {
      students: {
        select: { id: true, isKetua: true, userId: true, user: { select: { name: true } } }
      },
      dpl: {
        select: { id: true, name: true, phone: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log('=== STATISTIK DPL & KELOMPOK KKN ===');
  console.log('Total DPL Terdaftar di DB:', dpls.length);
  console.log('Total Kelompok KKN di DB:', kelompoks.length);

  let withLeader = 0;
  let withoutLeader = 0;
  let withDpl = 0;
  let withoutDpl = 0;

  const dplKelompokMap = new Map();

  kelompoks.forEach((k) => {
    const leader = k.students.find(s => s.isKetua);
    if (leader) withLeader++; else withoutLeader++;
    if (k.dplId) {
      withDpl++;
      const list = dplKelompokMap.get(k.dplId) || [];
      list.push(k.name);
      dplKelompokMap.set(k.dplId, list);
    } else {
      withoutDpl++;
    }
  });

  console.log('Kelompok dengan Ketua:', withLeader);
  console.log('Kelompok tanpa Ketua:', withoutLeader);
  console.log('Kelompok dengan DPL:', withDpl);
  console.log('Kelompok tanpa DPL:', withoutDpl);
  console.log('DPL unik yang terhubung ke Kelompok:', dplKelompokMap.size);

  console.log('\n=== RELASI DPL -> KELOMPOK ===');
  dpls.forEach((d) => {
    const assignedGroups = dplKelompokMap.get(d.id) || [];
    console.log('- DPL: ' + d.name + ' (' + (d.nip || d.phone) + ') -> Kelompok [' + assignedGroups.length + ']: ' + (assignedGroups.join(', ') || 'BELUM TERHUBUNG'));
  });

  console.log('\n=== DAFTAR KELOMPOK & KETUA ===');
  kelompoks.forEach((k) => {
    const leader = k.students.find(s => s.isKetua);
    console.log('- ' + k.name + ' | DPL: ' + (k.dpl ? k.dpl.name : 'KOSONG') + ' | Ketua: ' + (leader && leader.user ? leader.user.name : 'BELUM ADA KETUA') + ' | Total Mhs: ' + k.students.length);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
