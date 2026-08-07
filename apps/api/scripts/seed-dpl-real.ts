import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const REAL_DPL_LIST = [
  { no: 1, name: 'Prof. Dr. Hj. Umi Narimawati, .Dra.,S.E., M.Si.,M.Pd.', nip: '4127.34.02.015', prodi: 'S1 Manajemen' },
  { no: 2, name: 'Assoc. Prof. Dr. Agus Riyanto, S.E., M.Si.CSBA.', nip: '4127.70.03.007', prodi: 'S1 Manajemen' },
  { no: 3, name: 'Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP', nip: '4127.34.02.006', prodi: 'S1 Manajemen' },
  { no: 4, name: 'Dr. Linna Ismawati, S.E., M.Si.', nip: '4127.34.02.008', prodi: 'S1 Manajemen' },
  { no: 5, name: 'Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D', nip: '4127.70.06.024', prodi: 'S1 Teknik Informatika' },
  { no: 6, name: 'Hanhan Maulana, M.Kom., Ph.D.', nip: '4127.70.06.134', prodi: 'S1 Teknik Informatika' },
  { no: 7, name: 'Alif Finandhita, S.Kom., M.T.', nip: '4127.70.06.025', prodi: 'S1 Teknik Informatika' },
  { no: 8, name: 'Richi Dwi Agustia, S.Kom., M.Kom.', nip: '4127.70.06.132', prodi: 'S1 Teknik Informatika' },
  { no: 9, name: 'Assoc. Prof. Dr. Wartika S.Kom., MT.', nip: '4127.70.26.002', prodi: 'S1 Sistem Informasi' },
  { no: 10, name: 'Rangga Sidik, S.Kom., M.Kom., M.Eng.', nip: '4127.70.26.113', prodi: 'S1 Sistem Informasi' },
  { no: 11, name: 'Dr. Wendi Zarman, M.Si', nip: '4127.70.05.010', prodi: 'S1 Sistem Komputer' },
  { no: 12, name: 'Iyan Andriana, S.T., M.T.', nip: '4127.70.03.009', prodi: 'S1 Teknik Industri' },
  { no: 13, name: 'Amilia Widya, S.Pd., M.T.', nip: '4127.70.17.015', prodi: 'S1 Teknik Perencanaan Wilayah dan Kota' },
  { no: 14, name: 'Ayub Subandi, S.Si., M.T., Ph.D.', nip: '4127.70.05.030', prodi: 'S1 Teknik Elektro' },
  { no: 15, name: 'Dr. Eng. Siswanti Zuraida, S.Pd., M.T.', nip: '4127.88.80.717', prodi: 'S1 Teknik Arsitektur' },
  { no: 16, name: 'Muhammad Aksan Ipaenin, S.T., M.Sc.', nip: '4127.99.90.268', prodi: 'S1 Teknik Sipil' },
  { no: 17, name: 'Hery Dwi Yulianto, S.T., M.Kom.', nip: '4127.70.67.004', prodi: 'D3 Komputerisasi Akuntansi' },
  { no: 18, name: 'Myrna Dwi Rahmatya, S.Kom., M.Kom.', nip: '4127.70.26.111', prodi: 'D3 Manajemen Informatika' },
  { no: 19, name: 'John Adler, S.Si., M.Si.', nip: '4127.70.05.007', prodi: 'D3 Teknik Komputer' },
  { no: 20, name: 'Dr. Agus Mulyana, S.Kom.,M.T.', nip: '4127.70.05.017', prodi: 'D3 Teknik Komputer' },
  { no: 21, name: 'Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA.', nip: '4127.34.03.003', prodi: 'S1 Akuntansi' },
  { no: 22, name: 'Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP.', nip: '4127.34.02.006.2', prodi: 'S1 Manajemen' },
  { no: 23, name: 'Dr. H. Tatang Supriyadi, S.E., M.M.', nip: '4127.34.02.075', prodi: 'D3 Manajemen Pemasaran' },
  { no: 24, name: 'Dr. Henike Primawati, S.IP., M.I.Pol.', nip: '4127.35.32.011', prodi: 'S1 Hubungan Internasional' },
  { no: 25, name: 'Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.', nip: '4127.35.30.007', prodi: 'S1 Ilmu Komunikasi' },
  { no: 26, name: 'Dr. Olih Solihin, S.Sos., M.I.Kom.', nip: '4127.35.30.016', prodi: 'S1 Ilmu Komunikasi' },
  { no: 27, name: 'Dr. Tatik Fidowaty, S.IP., M.Si.', nip: '4127.35.31.009', prodi: 'S1 Ilmu Pemerintahan' },
  { no: 28, name: 'Wahyudi, S.H., M.H.', nip: '4127.33.00.019', prodi: 'S1 Ilmu Hukum' },
  { no: 29, name: 'Arif Try Cahyadi, S.Ds., M.Ds.', nip: '4127.32.06.087', prodi: 'S1 Desain Komunikasi Visual' },
  { no: 30, name: 'Cherry Dharmawan, S.Sn., M.Sn.', nip: '4127.32.04.002', prodi: 'S1 Desain Interior' },
  { no: 31, name: 'Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.', nip: '4127.32.06.011', prodi: 'D3 Desain Grafis' },
  { no: 32, name: 'Dr. Nungki Heriyati, M.A.', nip: '4127.20.03.020', prodi: 'S1 Sastra Inggris' },
  { no: 33, name: 'Fenny Febrianty, S.S. M.Pd.', nip: '4127.20.04.004', prodi: 'S1 Sastra Jepang' },
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
    // Check if user already exists by phone (NIP) or name
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: dpl.nip },
          { name: { contains: dpl.name.split(',')[0].trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: dpl.name,
          phone: dpl.nip,
          address: dpl.prodi,
          roleId: dplRole.id,
          status: 'Aktif',
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: dpl.name,
          phone: dpl.nip,
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
