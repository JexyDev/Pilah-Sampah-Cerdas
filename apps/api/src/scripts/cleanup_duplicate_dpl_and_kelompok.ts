/**
 * Cleanup Script: De-duplicate DPL Users and Kelompok KKN in PostgreSQL
 * Ensures EXACTLY 32 Real DPL Users and EXACTLY 32 Real Kelompok KKN exist.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OFFICIAL_32 = [
  { no: 1, name: "Muhammad Aksan Ipaenin, S.T. M.Sc", phone: "+6285294754801", kelompok: "Kel 1 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 2, name: "Assoc.Prof. Dr. Wartika S.Kom.,MT", phone: "+62895337560201", kelompok: "Kel 2 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 3, name: "Myrna Dwi Rahmatya, S.Kom.,M.Kom", phone: "+6285320322236", kelompok: "Kel 3 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 4, name: "Alif Finandhita, S.Kom., M.T.", phone: "+6282115865070", kelompok: "Kel 4 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 5, name: "Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D", phone: "+6281318920636", kelompok: "Kel 1 Sekeloa", kelurahan: "Sekeloa" },
  { no: 6, name: "Dr. Eng. Siswanti Zuraida, S.Pd., M.T.", phone: "+6288210288162", kelompok: "Kel 2 Sekeloa", kelurahan: "Sekeloa" },
  { no: 7, name: "Dr. Olih Solihin, S.Sos., M.I.Kom.", phone: "+6289656618667", kelompok: "Kel 3 Sekeloa", kelurahan: "Sekeloa" },
  { no: 8, name: "Hery Dwi Yulianto, S.T., M.Kom.", phone: "+628382821127", kelompok: "Kel 4 Sekeloa", kelurahan: "Sekeloa" },
  { no: 9, name: "John Adler, S.Si., M.Si.", phone: "+6282130536915", kelompok: "Kel 5 Sekeloa", kelurahan: "Sekeloa" },
  { no: 10, name: "Dr. Henike Primawati, S.IP., M.I.Pol.", phone: "+628118748686", kelompok: "Kel 6 Sekeloa", kelurahan: "Sekeloa" },
  { no: 11, name: "Fenny Febrianti, S.S.,M.Hum", phone: "+6282121822503", kelompok: "Kel 1 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 12, name: "Dr. Tatik Fidowaty, S.IP., M.Si", phone: "+62817616930", kelompok: "Kel 2 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 13, name: "Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.", phone: "+6281322752828", kelompok: "Kel 3 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 14, name: "Dr. Agus Mulyana, S.Kom, M.T.", phone: "+6282116871007", kelompok: "Sadang Serang 1", kelurahan: "Sadang Serang" },
  { no: 15, name: "Amilia Widya, S.Pd., M.T.", phone: "+6281344706038", kelompok: "Sadang Serang 2", kelurahan: "Sadang Serang" },
  { no: 16, name: "Wahyudi, S.H., M.H.", phone: "+6281321920848", kelompok: "Sadang Serang 3", kelurahan: "Sadang Serang" },
  { no: 17, name: "Richi Dwi Agustia, S.Kom., M.Kom.", phone: "+6285780084003", kelompok: "Sadang Serang 4", kelurahan: "Sadang Serang" },
  { no: 18, name: "Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.", phone: "+6281321911449", kelompok: "Sadang Serang 5", kelurahan: "Sadang Serang" },
  { no: 19, name: "Cherry Dharmawan, S.Sn., M.Sn.", phone: "+6282118047608", kelompok: "Sadang Serang 6", kelurahan: "Sadang Serang" },
  { no: 20, name: "Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA", phone: "+628122421004", kelompok: "Sadang Serang 7", kelurahan: "Sadang Serang" },
  { no: 21, name: "Dr.H.Tatang Supriyadi,S.E.,M.M", phone: "+6281222927778", kelompok: "Sadang Serang 8", kelurahan: "Sadang Serang" },
  { no: 22, name: "Dr. Wendi Zaman,M.Si", phone: "+628157131405", kelompok: "Sadang Serang 9", kelurahan: "Sadang Serang" },
  { no: 23, name: "Arif Try Cahyadi, S.Ds., M.Ds.", phone: "+6282298522354", kelompok: "Sadang Serang 10", kelurahan: "Sadang Serang" },
  { no: 24, name: "Ayub Subandi, S.Si., M.T., Ph.D.", phone: "+6289612270264", kelompok: "Sadang Serang 11", kelurahan: "Sadang Serang" },
  { no: 25, name: "Iyan Andriana, S.T., M.T.", phone: "+628112334224", kelompok: "Cipaganti 1", kelurahan: "Cipaganti" },
  { no: 26, name: "Hanhan Maulana, M.Kom., Ph.D.", phone: "+6285222267759", kelompok: "Cipaganti 2", kelurahan: "Cipaganti" },
  { no: 27, name: "Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.", phone: "+6289670059709", kelompok: "Cipaganti 3", kelurahan: "Cipaganti" },
  { no: 28, name: "Rangga Sidik, S.Kom., M.Kom., M.Eng", phone: "+6285624088878", kelompok: "Cipaganti 4", kelurahan: "Cipaganti" },
  { no: 29, name: "Prof Umi Narimawati,dra, S.E. M.Si.,M.pd", phone: "+6281213143636", kelompok: "Dago 1", kelurahan: "Dago" },
  { no: 30, name: "Assoc Prof. Dr. Agus Riyanto S.E., M.S.i", phone: "+6285759996154", kelompok: "Dago 2", kelurahan: "Dago" },
  { no: 31, name: "Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP", phone: "+6281223216029", kelompok: "Dago 3", kelurahan: "Dago" },
  { no: 32, name: "Dr. Linna Ismawati, S.E., M.Si.", phone: "+6281221471617", kelompok: "Dago 4", kelurahan: "Dago" },
];

async function cleanup() {
  console.log("=== START CLEANUP DUPLICATE DPL & KELOMPOK ===");

  const validPhones = OFFICIAL_32.map((item) => item.phone);
  const validKelompokNames = OFFICIAL_32.map((item) => item.kelompok);

  // Delete all refresh tokens for stale users
  const dplRole = await prisma.role.findUnique({ where: { name: "DPL" } });
  if (dplRole) {
    const allDpls = await prisma.user.findMany({
      where: { roleId: dplRole.id },
    });

    for (const u of allDpls) {
      if (!validPhones.includes(u.phone)) {
        await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
        await prisma.kelompokKkn.updateMany({
          where: { dplId: u.id },
          data: { dplId: null },
        });
        try {
          await prisma.user.delete({ where: { id: u.id } });
          console.log(`[DELETED STALE DPL USER] ${u.name} (${u.phone})`);
        } catch (err: any) {
          console.warn(`Could not delete user ${u.name}: ${err.message}`);
        }
      }
    }
  }

  // Delete any stale kelompok
  const allKelompoks = await prisma.kelompokKkn.findMany({
    include: { students: true },
  });

  for (const kel of allKelompoks) {
    if (!validKelompokNames.includes(kel.name)) {
      try {
        await prisma.kelompokKkn.delete({ where: { id: kel.id } });
        console.log(`[DELETED STALE KELOMPOK] ${kel.name}`);
      } catch (err: any) {
        console.warn(`Could not delete stale kelompok ${kel.name}: ${err.message}`);
      }
    }
  }

  const finalDpls = await prisma.user.count({ where: { role: { name: "DPL" } } });
  const finalKelompok = await prisma.kelompokKkn.count();

  console.log(`\n✅ CLEANUP COMPLETE!`);
  console.log(`Final DPL Users Count: ${finalDpls} (Expected: 32)`);
  console.log(`Final Kelompok KKN Count: ${finalKelompok} (Expected: 32)`);
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
