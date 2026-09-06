import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dplPhoneMap: { [key: string]: string } = {
  // Kelompok 1 - 4 Lebak Gede
  "Muhammad Aksan Ipaenin, S.T., M.Sc.": "+6285294754801",
  "Assoc. Prof. Dr. Wartika S.Kom., MT.": "+62895337560201",
  "Myrna Dwi Rahmatya, S.Kom., M.Kom.": "+6285320322236",
  "Alif Finandhita, S.Kom., M.T.": "+6282115865070",

  // Kelompok 1 - 6 Sekeloa
  "Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D": "+6281318920636",
  "Dr. Eng. Siswanti Zuraida, S.Pd., M.T.": "+6288210288162",
  "Dr. Olih Solihin, S.Sos., M.I.Kom.": "+6289656618667",
  "Hery Dwi Yulianto, S.T., M.Kom.": "+628382821127",
  "John Adler, S.Si., M.Si.": "+6282130536915",
  "Dr. Henike Primawati, S.IP., M.I.Pol.": "+628118748686",

  // Kelompok 1 - 3 Lebak Siliwangi
  "Fenny Febrianty, S.S. M.Pd.": "+6282121822503",
  "Dr. Tatik Fidowaty, S.IP., M.Si.": "+62817616930",
  "Dr. Nungki Heriyati, M.A.": "+6281322752828",

  // Kelompok 1 - 11 Sadang Serang
  "Dr. Agus Mulyana, S.Kom.,M.T.": "+6282116871007",
  "Amilia Widya, S.Pd., M.T.": "+6281344706038",
  "Wahyudi, S.H., M.H.": "+6281321920848",
  "Richi Dwi Agustia, S.Kom., M.Kom.": "+6285780084003",
  "Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.": "+6281321911449",
  "Cherry Dharmawan, S.Sn., M.Sn.": "+6282118047608",
  "Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA.": "+628122421004",
  "Dr. H. Tatang Supriyadi, S.E., M.M.": "+6281222927778",
  "Dr. Wendi Zarman, M.Si": "+628157131405",
  "Arif Try Cahyadi, S.Ds., M.Ds.": "+6282298522354",
  "Ayub Subandi, S.Si., M.T., Ph.D.": "+6289612270264",

  // Kelompok 1 - 4 Cipaganti
  "Iyan Andriana, S.T., M.T.": "+628112334224",
  "Hanhan Maulana, M.Kom., Ph.D.": "+6285222267759",
  "Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.": "+6289670059709",
  "Rangga Sidik, S.Kom., M.Kom., M.Eng.": "+6285624088878",

  // Kelompok 1 - 4 Dago
  "Prof. Dr. Hj. Umi Narimawati, .Dra.,S.E., M.Si.,M.Pd.": "+6281213143636",
  "Assoc. Prof. Dr. Agus Riyanto, S.E., M.Si.CSBA.": "+6285759996154",
  "Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP.": "+6281223216029",
  "Dr. Linna Ismawati, S.E., M.Si.": "+6281221471617",
};

async function updateDplPhones() {
  console.log("=== UPDATING DPL PHONE NUMBERS ===");
  const dplUsers = await prisma.user.findMany({
    where: { role: { name: "DPL" } },
  });

  let count = 0;
  for (const user of dplUsers) {
    const phone = dplPhoneMap[user.name];
    if (phone) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phone },
      });
      console.log(`✅ Updated ${user.name} -> ${phone}`);
      count++;
    } else {
      console.warn(`⚠️ No phone map found for ${user.name}`);
    }
  }

  console.log(`\n🎉 Successfully updated ${count}/${dplUsers.length} DPL phone numbers.`);
}

updateDplPhones()
  .catch((e) => console.error("Error updating DPL phones:", e))
  .finally(() => prisma.$disconnect());
