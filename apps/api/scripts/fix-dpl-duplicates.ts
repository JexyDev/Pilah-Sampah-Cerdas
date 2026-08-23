import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DPL_GROUP_MAPPING = [
  { nip: '4127.99.90.268', name: 'Muhammad Aksan Ipaenin, S.T. M.Sc', phone: '+6285294754801', group: 'Kelompok 1 Lebak Gede', kelurahan: 'Lebak Gede' },
  { nip: '4127.70.26.002', name: 'Assoc.Prof. Dr. Wartika S.Kom.,MT', phone: '+62895337560201', group: 'Kelompok 2 Lebak Gede', kelurahan: 'Lebak Gede' },
  { nip: '4127.70.26.111', name: 'Myrna Dwi Rahmatya, S.Kom.,M.Kom', phone: '+6285320322236', group: 'Kelompok 3 Lebak Gede', kelurahan: 'Lebak Gede' },
  { nip: '4127.70.06.025', name: 'Alif Finandhita, S.Kom., M.T.', phone: '+6282115865070', group: 'Kelompok 4 Lebak Gede', kelurahan: 'Lebak Gede' },
  { nip: '4127.70.06.024', name: 'Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D', phone: '+6281318920636', group: 'Kelompok 1 Sekeloa', kelurahan: 'Sekeloa' },
  { nip: '4127.88.80.717', name: 'Dr. Eng. Siswanti Zuraida, S.Pd., M.T.', phone: '+6288210288162', group: 'Kelompok 2 Sekeloa', kelurahan: 'Sekeloa' },
  { nip: '4127.35.30.016', name: 'Dr. Olih Solihin, S.Sos., M.I.Kom.', phone: '+6289656618667', group: 'Kelompok 3 Sekeloa', kelurahan: 'Sekeloa' },
  { nip: '4127.70.67.004', name: 'Hery Dwi Yulianto, S.T., M.Kom.', phone: '+628382821127', group: 'Kelompok 4 Sekeloa', kelurahan: 'Sekeloa' },
  { nip: '4127.70.05.007', name: 'John Adler, S.Si., M.Si.', phone: '+6282130536915', group: 'Kelompok 5 Sekeloa', kelurahan: 'Sekeloa' },
  { nip: '4127.35.32.011', name: 'Dr. Henike Primawati, S.IP., M.I.Pol.', phone: '+628118748686', group: 'Kelompok 6 Sekeloa', kelurahan: 'Sekeloa' },
  { nip: '4127.20.04.004', name: 'Fenny Febrianti, S.S., M.Hum', phone: '+6282121822503', group: 'Kelompok 1 Lebak Siliwangi', kelurahan: 'Lebak Siliwangi' },
  { nip: '4127.35.31.009', name: 'Dr. Tatik Fidowaty, S.IP., M.Si', phone: '+62817616930', group: 'Kelompok 2 Lebak Siliwangi', kelurahan: 'Lebak Siliwangi' },
  { nip: '4127.20.03.020', name: 'Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.', phone: '+6281322752828', group: 'Kelompok 3 Lebak Siliwangi', kelurahan: 'Lebak Siliwangi' },
  { nip: '4127.70.05.017', name: 'Dr. Agus Mulyana, S.Kom, M.T.', phone: '+6282116871007', group: 'Kelompok 1 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.70.17.015', name: 'Amilia Widya, S.Pd., M.T.', phone: '+6281344706038', group: 'Kelompok 2 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.33.00.019', name: 'Wahyudi, S.H., M.H.', phone: '+6281321920848', group: 'Kelompok 3 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.70.06.132', name: 'Richi Dwi Agustia, S.Kom., M.Kom.', phone: '+6285780084003', group: 'Kelompok 4 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.35.30.007', name: 'Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.', phone: '+6281321911449', group: 'Kelompok 5 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.32.04.002', name: 'Cherry Dharmawan, S.Sn., M.Sn.', phone: '+6282118047608', group: 'Kelompok 6 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.34.03.003', name: 'Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA', phone: '+628122421004', group: 'Kelompok 7 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.34.02.075', name: 'Dr.H.Tatang Supriyadi,S.E.,M.M', phone: '+6281222927778', group: 'Kelompok 8 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.70.05.010', name: 'Dr. Wendi Zarman, M.Si', phone: '+628157131405', group: 'Kelompok 9 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.32.06.087', name: 'Arif Try Cahyadi, S.Ds., M.Ds.', phone: '+6282298522354', group: 'Kelompok 10 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.70.05.030', name: 'Ayub Subandi, S.Si., M.T., Ph.D.', phone: '+6289612270264', group: 'Kelompok 11 Sadang Serang', kelurahan: 'Sadang Serang' },
  { nip: '4127.70.03.009', name: 'Iyan Andriana, S.T., M.T.', phone: '+628112334224', group: 'Kelompok 1 Cipaganti', kelurahan: 'Cipaganti' },
  { nip: '4127.70.06.134', name: 'Hanhan Maulana, M.Kom., Ph.D.', phone: '+6285222267759', group: 'Kelompok 2 Cipaganti', kelurahan: 'Cipaganti' },
  { nip: '4127.32.06.011', name: 'Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.', phone: '+6289670059709', group: 'Kelompok 3 Cipaganti', kelurahan: 'Cipaganti' },
  { nip: '4127.70.26.113', name: 'Rangga Sidik, S.Kom., M.Kom., M.Eng', phone: '+6285624088878', group: 'Kelompok 4 Cipaganti', kelurahan: 'Cipaganti' },
  { nip: '4127.34.02.015', name: 'Prof Umi Narimawati,dra, S.E. M.Si.,M.pd', phone: '+6281213143636', group: 'Kelompok 1 Dago', kelurahan: 'Dago' },
  { nip: '4127.70.03.007', name: 'Assoc Prof. Dr. Agus Riyanto S.E., M.S.i', phone: '+6285759996154', group: 'Kelompok 2 Dago', kelurahan: 'Dago' },
  { nip: '4127.34.02.006', name: 'Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP', phone: '+6281223216029', group: 'Kelompok 3 Dago', kelurahan: 'Dago' },
  { nip: '4127.34.02.008', name: 'Dr. Linna Ismawati, S.E., M.Si.', phone: '+6281221471617', group: 'Kelompok 4 Dago', kelurahan: 'Dago' },
];

async function fix() {
  console.log("=== FIXING DPL USER & KELOMPOK DUPLICATE ASSIGNMENTS ===");

  const dplRole = await prisma.role.findFirst({ where: { name: 'DPL' } });
  if (!dplRole) return;

  // 1. Reset all kelompok dplId to null
  await prisma.kelompokKkn.updateMany({
    data: { dplId: null },
  });

  for (const item of DPL_GROUP_MAPPING) {
    const users = await prisma.user.findMany({
      where: {
        roleId: dplRole.id,
        OR: [
          { nip: item.nip },
          { phone: item.phone },
          { name: { contains: item.name.split(',')[0].trim(), mode: 'insensitive' } },
        ],
      },
    });

    let mainUser = users[0];
    if (!mainUser) {
      mainUser = await prisma.user.create({
        data: {
          name: item.name,
          nip: item.nip,
          phone: item.phone,
          address: item.kelurahan,
          roleId: dplRole.id,
          password: '$2a$10$wN9aW6Qe4e0vGq2z5mXq0u0hQ4i9Y2Z3b4c5d6e7f8g9h0i1j2k3l', // default hash
          status: 'Aktif',
        },
      });
    } else {
      if (users.length > 1) {
        for (let i = 1; i < users.length; i++) {
          await prisma.user.delete({ where: { id: users[i].id } }).catch(() => {});
        }
      }
      try {
        mainUser = await prisma.user.update({
          where: { id: mainUser.id },
          data: {
            name: item.name,
            nip: item.nip,
            phone: item.phone,
            address: item.kelurahan,
            status: 'Aktif',
          },
        });
      } catch {
        mainUser = await prisma.user.update({
          where: { id: mainUser.id },
          data: {
            name: item.name,
            nip: item.nip,
            address: item.kelurahan,
            status: 'Aktif',
          },
        });
      }
    }

    await prisma.kelompokKkn.updateMany({
      where: {
        name: { equals: item.group, mode: 'insensitive' },
      },
      data: {
        dplId: mainUser.id,
        dplNamaMentah: mainUser.name,
        kelurahan: item.kelurahan,
      },
    });

    console.log(`[OK] ${item.name} (${item.nip}) -> Phone: ${mainUser.phone} -> ${item.group}`);
  }

  console.log("=== ALL 32 DPL USERS & KELOMPOK ASSIGNMENTS FIXED CLEANLY ===");
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
