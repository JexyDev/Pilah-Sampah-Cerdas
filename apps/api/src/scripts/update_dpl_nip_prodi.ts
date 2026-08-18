import { prisma } from "../lib/prisma.js";
/**
 * Script Pembaruan NIP & Program Studi untuk 32 DPL Real UNIKOM
 * Berdasarkan dokumen resmi "DATA DOSEN PEMBIMBING LAPANGAN (DPL) KKN".
 */


const DPL_NIP_PRODI_DATA = [
  { phone: "+6285294754801", name: "Muhammad Aksan Ipaenin, S.T. M.Sc", nip: "4127.99.90.268", prodi: "S1 Teknik Sipil" },
  { phone: "+62895337560201", name: "Assoc.Prof. Dr. Wartika S.Kom.,MT", nip: "4127.70.26.002", prodi: "S1 Sistem Informasi" },
  { phone: "+6285320322236", name: "Myrna Dwi Rahmatya, S.Kom.,M.Kom", nip: "4127.70.26.111", prodi: "D3 Manajemen Informatika" },
  { phone: "+6282115865070", name: "Alif Finandhita, S.Kom., M.T.", nip: "4127.70.06.025", prodi: "S1 Teknik Informatika" },
  { phone: "+6281318920636", name: "Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D", nip: "4127.70.06.024", prodi: "S1 Teknik Informatika" },
  { phone: "+6288210288162", name: "Dr. Eng. Siswanti Zuraida, S.Pd., M.T.", nip: "4127.88.80.717", prodi: "S1 Teknik Arsitektur" },
  { phone: "+6289656618667", name: "Dr. Olih Solihin, S.Sos., M.I.Kom.", nip: "4127.35.30.016", prodi: "S1 Ilmu Komunikasi" },
  { phone: "+628382821127", name: "Hery Dwi Yulianto, S.T., M.Kom.", nip: "4127.70.67.004", prodi: "D3 Komputerisasi Akuntansi" },
  { phone: "+6282130536915", name: "John Adler, S.Si., M.Si.", nip: "4127.70.05.007", prodi: "D3 Teknik Komputer" },
  { phone: "+628118748686", name: "Dr. Henike Primawati, S.IP., M.I.Pol.", nip: "4127.35.32.011", prodi: "S1 Hubungan Internasional" },
  { phone: "+6282121822503", name: "Fenny Febrianti, S.S., M.Hum", nip: "4127.20.04.004", prodi: "S1 Sastra Jepang" },
  { phone: "+62817616930", name: "Dr. Tatik Fidowaty, S.IP., M.Si", nip: "4127.35.31.009", prodi: "S1 Ilmu Pemerintahan" },
  { phone: "+6281322752828", name: "Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.", nip: "4127.20.03.020", prodi: "S1 Sastra Inggris" },
  { phone: "+6282116871007", name: "Dr. Agus Mulyana, S.Kom, M.T.", nip: "4127.70.05.017", prodi: "D3 Teknik Komputer" },
  { phone: "+6281344706038", name: "Amilia Widya, S.Pd., M.T.", nip: "4127.70.17.015", prodi: "S1 Teknik Perencanaan Wilayah dan Kota" },
  { phone: "+6281321920848", name: "Wahyudi, S.H., M.H.", nip: "4127.33.00.019", prodi: "S1 Ilmu Hukum" },
  { phone: "+6285780084003", name: "Richi Dwi Agustia, S.Kom., M.Kom.", nip: "4127.70.06.132", prodi: "S1 Teknik Informatika" },
  { phone: "+6281321911449", name: "Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.", nip: "4127.35.30.007", prodi: "S1 Ilmu Komunikasi" },
  { phone: "+6282118047608", name: "Cherry Dharmawan, S.Sn., M.Sn.", nip: "4127.32.04.002", prodi: "S1 Desain Interior" },
  { phone: "+628122421004", name: "Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA", nip: "4127.34.03.003", prodi: "S1 Akuntansi" },
  { phone: "+6281222927778", name: "Dr.H.Tatang Supriyadi,S.E.,M.M", nip: "4127.34.02.075", prodi: "D3 Manajemen Pemasaran" },
  { phone: "+628157131405", name: "Dr. Wendi Zarman, M.Si", nip: "4127.70.05.010", prodi: "S1 Sistem Komputer" },
  { phone: "+6282298522354", name: "Arif Try Cahyadi, S.Ds., M.Ds.", nip: "4127.32.06.087", prodi: "S1 Desain Komunikasi Visual" },
  { phone: "+6289612270264", name: "Ayub Subandi, S.Si., M.T., Ph.D.", nip: "4127.70.05.030", prodi: "S1 Teknik Elektro" },
  { phone: "+628112334224", name: "Iyan Andriana, S.T., M.T.", nip: "4127.70.03.009", prodi: "S1 Teknik Industri" },
  { phone: "+6285222267759", name: "Hanhan Maulana, M.Kom., Ph.D.", nip: "4127.70.06.134", prodi: "S1 Teknik Informatika" },
  { phone: "+6289670059709", name: "Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.", nip: "4127.32.06.011", prodi: "D3 Desain Grafis" },
  { phone: "+6285624088878", name: "Rangga Sidik, S.Kom., M.Kom., M.Eng", nip: "4127.70.26.113", prodi: "S1 Sistem Informasi" },
  { phone: "+6281213143636", name: "Prof Umi Narimawati,dra, S.E. M.Si.,M.pd", nip: "4127.34.02.015", prodi: "S1 Manajemen" },
  { phone: "+6285759996154", name: "Assoc Prof. Dr. Agus Riyanto S.E., M.S.i", nip: "4127.70.03.007", prodi: "S1 Manajemen" },
  { phone: "+6281223216029", name: "Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP", nip: "4127.34.02.006", prodi: "S1 Manajemen" },
  { phone: "+6281221471617", name: "Dr. Linna Ismawati, S.E., M.Si.", nip: "4127.34.02.008", prodi: "S1 Manajemen" },
];

async function updateDplNipProdi() {
  console.log("=== PEMBARUAN PRESISI NIP & PROGRAM STUDI 32 DPL REAL ===");

  const dplRole = await prisma.role.findUnique({ where: { name: "DPL" } });
  if (!dplRole) {
    console.error("Role DPL tidak ditemukan.");
    return;
  }

  for (const item of DPL_NIP_PRODI_DATA) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: item.phone },
          { name: { contains: item.name.split(",")[0].split(".")[0], mode: "insensitive" } },
        ],
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: item.name,
          nip: item.nip,
          programStudi: item.prodi,
          roleId: dplRole.id,
          status: "Aktif",
          institusi: "Universitas Komputer Indonesia",
        },
      });
      console.log(`[UPDATED] ${item.name} | NIP: ${item.nip} | Prodi: ${item.prodi}`);
    } else {
      console.warn(`[NOT FOUND] ${item.name}`);
    }
  }

  console.log("=== PEMBARUAN NIP & PRODI SELESAI ===");
}

updateDplNipProdi()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
