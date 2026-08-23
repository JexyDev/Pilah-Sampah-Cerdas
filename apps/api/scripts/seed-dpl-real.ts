import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const REAL_DPL_LIST = [
  { no: 1, name: 'Muhammad Aksan Ipaenin, S.T. M.Sc', phone: '+6285294754801', rawPhone: '085294754801', nip: '4127.99.90.268', prodi: 'S1 Teknik Sipil' },
  { no: 2, name: 'Assoc.Prof. Dr. Wartika S.Kom.,MT', phone: '+62895337560201', rawPhone: '0895337560201', nip: '4127.70.26.002', prodi: 'S1 Sistem Informasi' },
  { no: 3, name: 'Myrna Dwi Rahmatya, S.Kom.,M.Kom', phone: '+6285320322236', rawPhone: '085320322236', nip: '4127.70.26.111', prodi: 'D3 Manajemen Informatika' },
  { no: 4, name: 'Alif Finandhita, S.Kom., M.T.', phone: '+6282115865070', rawPhone: '082115865070', nip: '4127.70.06.025', prodi: 'S1 Teknik Informatika' },
  { no: 5, name: 'Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D', phone: '+6281318920636', rawPhone: '081318920636', nip: '4127.70.06.024', prodi: 'S1 Teknik Informatika' },
  { no: 6, name: 'Dr. Eng. Siswanti Zuraida, S.Pd., M.T.', phone: '+6288210288162', rawPhone: '088210288162', nip: '4127.88.80.717', prodi: 'S1 Teknik Arsitektur' },
  { no: 7, name: 'Dr. Olih Solihin, S.Sos., M.I.Kom.', phone: '+6289656618667', rawPhone: '089656618667', nip: '4127.35.30.016', prodi: 'S1 Ilmu Komunikasi' },
  { no: 8, name: 'Hery Dwi Yulianto, S.T., M.Kom.', phone: '+628382821127', rawPhone: '08382821127', nip: '4127.70.67.004', prodi: 'D3 Komputerisasi Akuntansi' },
  { no: 9, name: 'John Adler, S.Si., M.Si.', phone: '+6282130536915', rawPhone: '082130536915', nip: '4127.70.05.007', prodi: 'D3 Teknik Komputer' },
  { no: 10, name: 'Dr. Henike Primawati, S.IP., M.I.Pol.', phone: '+628118748686', rawPhone: '08118748686', nip: '4127.35.32.011', prodi: 'S1 Hubungan Internasional' },
  { no: 11, name: 'Fenny Febrianti, S.S., M.Hum', phone: '+6282121822503', rawPhone: '082121822503', nip: '4127.20.04.004', prodi: 'S1 Sastra Jepang' },
  { no: 12, name: 'Dr. Tatik Fidowaty, S.IP., M.Si', phone: '+62817616930', rawPhone: '0817616930', nip: '4127.35.31.009', prodi: 'S1 Ilmu Pemerintahan' },
  { no: 13, name: 'Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.', phone: '+6281322752828', rawPhone: '081322752828', nip: '4127.20.03.020', prodi: 'S1 Sastra Inggris' },
  { no: 14, name: 'Dr. Agus Mulyana, S.Kom, M.T.', phone: '+6282116871007', rawPhone: '82116871007', nip: '4127.70.05.017', prodi: 'D3 Teknik Komputer' },
  { no: 15, name: 'Amilia Widya, S.Pd., M.T.', phone: '+6281344706038', rawPhone: '081344706038', nip: '4127.70.17.015', prodi: 'S1 Teknik Perencanaan Wilayah dan Kota' },
  { no: 16, name: 'Wahyudi, S.H., M.H.', phone: '+6281321920848', rawPhone: '081321920848', nip: '4127.33.00.019', prodi: 'S1 Ilmu Hukum' },
  { no: 17, name: 'Richi Dwi Agustia, S.Kom., M.Kom.', phone: '+6285780084003', rawPhone: '085780084003', nip: '4127.70.06.132', prodi: 'S1 Teknik Informatika' },
  { no: 18, name: 'Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.', phone: '+6281321911449', rawPhone: '081321911449', nip: '4127.35.30.007', prodi: 'S1 Ilmu Komunikasi' },
  { no: 19, name: 'Cherry Dharmawan, S.Sn., M.Sn.', phone: '+6282118047608', rawPhone: '082118047608', nip: '4127.32.04.002', prodi: 'S1 Desain Interior' },
  { no: 20, name: 'Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA', phone: '+628122421004', rawPhone: '08122421004', nip: '4127.34.03.003', prodi: 'S1 Akuntansi' },
  { no: 21, name: 'Dr.H.Tatang Supriyadi,S.E.,M.M', phone: '+6281222927778', rawPhone: '081222927778', nip: '4127.34.02.075', prodi: 'D3 Manajemen Pemasaran' },
  { no: 22, name: 'Dr. Wendi Zarman, M.Si', phone: '+628157131405', rawPhone: '08157131405', nip: '4127.70.05.010', prodi: 'S1 Sistem Komputer' },
  { no: 23, name: 'Arif Try Cahyadi, S.Ds., M.Ds.', phone: '+6282298522354', rawPhone: '082298522354', nip: '4127.32.06.087', prodi: 'S1 Desain Komunikasi Visual' },
  { no: 24, name: 'Ayub Subandi, S.Si., M.T., Ph.D.', phone: '+6289612270264', rawPhone: '089612270264', nip: '4127.70.05.030', prodi: 'S1 Teknik Elektro' },
  { no: 25, name: 'Iyan Andriana, S.T., M.T.', phone: '+628112334224', rawPhone: '08112334224', nip: '4127.70.03.009', prodi: 'S1 Teknik Industri' },
  { no: 26, name: 'Hanhan Maulana, M.Kom., Ph.D.', phone: '+6285222267759', rawPhone: '085222267759', nip: '4127.70.06.134', prodi: 'S1 Teknik Informatika' },
  { no: 27, name: 'Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.', phone: '+6289670059709', rawPhone: '089670059709', nip: '4127.32.06.011', prodi: 'D3 Desain Grafis' },
  { no: 28, name: 'Rangga Sidik, S.Kom., M.Kom., M.Eng', phone: '+6285624088878', rawPhone: '085624088878', nip: '4127.70.26.113', prodi: 'S1 Sistem Informasi' },
  { no: 29, name: 'Prof Umi Narimawati,dra, S.E. M.Si.,M.pd', phone: '+6281213143636', rawPhone: '081213143636', nip: '4127.34.02.015', prodi: 'S1 Manajemen' },
  { no: 30, name: 'Assoc Prof. Dr. Agus Riyanto S.E., M.S.i', phone: '+6285759996154', rawPhone: '085759996154', nip: '4127.70.03.007', prodi: 'S1 Manajemen' },
  { no: 31, name: 'Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP', phone: '+6281223216029', rawPhone: '81223216029', nip: '4127.34.02.006', prodi: 'S1 Manajemen' },
  { no: 32, name: 'Dr. Linna Ismawati, S.E., M.Si.', phone: '+6281221471617', rawPhone: '81221471617', nip: '4127.34.02.008', prodi: 'S1 Manajemen' },
];

async function main() {
  console.log('🔄 Cleaning old mangled DPL records...');
  
  let dplRole = await prisma.role.findFirst({ where: { name: 'DPL' } });
  if (!dplRole) {
    dplRole = await prisma.role.create({ data: { name: 'DPL' } });
  }

  // Find users with role DPL whose name looks like a NIP or phone starts with +S1 or +ProgramStudi
  const badUsers = await prisma.user.findMany({
    where: {
      roleId: dplRole.id,
      OR: [
        { name: 'NIP' },
        { name: { startsWith: '4127.' } },
        { phone: { startsWith: '+S1' } },
        { phone: { startsWith: '+D3' } },
        { phone: { startsWith: '+ProgramStudi' } },
      ],
    },
  });

  console.log(`Found ${badUsers.length} mangled DPL users to remove/fix.`);
  for (const bu of badUsers) {
    await prisma.user.delete({ where: { id: bu.id } }).catch(() => {});
  }

  const defaultPassword = await bcrypt.hash('123456', 10);
  let upsertedCount = 0;

  for (const dpl of REAL_DPL_LIST) {
    // Check if user already exists by phone, NIP, or name
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: dpl.phone },
          { nip: dpl.nip },
          { name: { contains: dpl.name.split(',')[0].trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: dpl.name,
          phone: dpl.phone,
          nip: dpl.nip,
          address: dpl.prodi,
          roleId: dplRole.id,
          status: 'Aktif',
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: dpl.name,
          phone: dpl.phone,
          nip: dpl.nip,
          address: dpl.prodi,
          roleId: dplRole.id,
          password: defaultPassword,
          status: 'Aktif',
        },
      });
    }
    upsertedCount++;

    // Link DPL user to KelompokKkn if dplNamaMentah matches
    const nameKey = dpl.name.split(',')[0].trim();
    await prisma.kelompokKkn.updateMany({
      where: {
        dplNamaMentah: { contains: nameKey, mode: 'insensitive' },
      },
      data: {
        dplId: user.id,
      },
    });
  }

  console.log(`✅ Successfully upserted ${upsertedCount} real DPL accounts in DB!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
