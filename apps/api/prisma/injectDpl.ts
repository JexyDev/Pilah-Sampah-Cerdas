import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function normalizePhone(raw: string): string {
  let cleaned = raw.trim().replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+62")) return cleaned;
  if (cleaned.startsWith("62")) return "+" + cleaned;
  if (cleaned.startsWith("0")) return "+62" + cleaned.slice(1);
  if (cleaned.startsWith("8")) return "+62" + cleaned;
  return "+62" + cleaned;
}

const dplData = [
  { no: 1, name: "Muhammad Aksan Ipaenin, S.T. M.Sc", rawPhone: "085294754801", nip: "4127.99.90.268", prodi: "S1 Teknik Sipil", kelompok: "Kel 1 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 2, name: "Assoc.Prof. Dr. Wartika S.Kom.,MT", rawPhone: "0895337560201", nip: "4127.70.26.002", prodi: "S1 Sistem Informasi", kelompok: "Kel 2 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 3, name: "Myrna Dwi Rahmatya, S.Kom.,M.Kom", rawPhone: "085320322236", nip: "4127.70.26.111", prodi: "D3 Manajemen Informatika", kelompok: "Kel 3 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 4, name: "Alif Finandhita, S.Kom., M.T.", rawPhone: "082115865070", nip: "4127.70.06.025", prodi: "S1 Teknik Informatika", kelompok: "Kel 4 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 5, name: "Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D", rawPhone: "081318920636", nip: "4127.70.06.024", prodi: "S1 Teknik Informatika", kelompok: "Kel 1 Sekeloa", kelurahan: "Sekeloa" },
  { no: 6, name: "Dr. Eng. Siswanti Zuraida, S.Pd., M.T.", rawPhone: "088210288162", nip: "4127.88.80.717", prodi: "S1 Teknik Arsitektur", kelompok: "Kel 2 Sekeloa", kelurahan: "Sekeloa" },
  { no: 7, name: "Dr. Olih Solihin, S.Sos., M.I.Kom.", rawPhone: "089656618667", nip: "4127.35.30.016", prodi: "S1 Ilmu Komunikasi", kelompok: "Kel 3 Sekeloa", kelurahan: "Sekeloa" },
  { no: 8, name: "Hery Dwi Yulianto, S.T., M.Kom.", rawPhone: "08382821127", nip: "4127.70.67.004", prodi: "D3 Komputerisasi Akuntansi", kelompok: "Kel 4 Sekeloa", kelurahan: "Sekeloa" },
  { no: 9, name: "John Adler, S.Si., M.Si.", rawPhone: "082130536915", nip: "4127.70.05.007", prodi: "D3 Teknik Komputer", kelompok: "Kel 5 Sekeloa", kelurahan: "Sekeloa" },
  { no: 10, name: "Dr. Henike Primawati, S.IP., M.I.Pol.", rawPhone: "08118748686", nip: "4127.35.32.011", prodi: "S1 Hubungan Internasional", kelompok: "Kel 6 Sekeloa", kelurahan: "Sekeloa" },
  { no: 11, name: "Fenny Febrianti, S.S.,M.Hum", rawPhone: "082121822503", nip: "4127.20.04.004", prodi: "S1 Sastra Jepang", kelompok: "Kel 1 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 12, name: "Dr. Tatik Fidowaty, S.IP., M.Si", rawPhone: "0817616930", nip: "4127.35.31.009", prodi: "S1 Ilmu Pemerintahan", kelompok: "Kel 2 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 13, name: "Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.", rawPhone: "081322752828", nip: "4127.20.03.020", prodi: "S1 Sastra Inggris", kelompok: "Kel 3 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 14, name: "Dr. Agus Mulyana, S.Kom, M.T.", rawPhone: "82116871007", nip: "4127.70.05.017", prodi: "D3 Teknik Komputer", kelompok: "Sadang Serang 1", kelurahan: "Sadang Serang" },
  { no: 15, name: "Amilia Widya, S.Pd., M.T.", rawPhone: "081344706038", nip: "4127.70.17.015", prodi: "S1 Teknik Perencanaan Wilayah dan Kota", kelompok: "Sadang Serang 2", kelurahan: "Sadang Serang" },
  { no: 16, name: "Wahyudi, S.H., M.H.", rawPhone: "081321920848", nip: "4127.33.00.019", prodi: "S1 Ilmu Hukum", kelompok: "Sadang Serang 3", kelurahan: "Sadang Serang" },
  { no: 17, name: "Richi Dwi Agustia, S.Kom., M.Kom.", rawPhone: "085780084003", nip: "4127.70.06.132", prodi: "S1 Teknik Informatika", kelompok: "Sadang Serang 4", kelurahan: "Sadang Serang" },
  { no: 18, name: "Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.", rawPhone: "081321911449", nip: "4127.35.30.007", prodi: "S1 Ilmu Komunikasi", kelompok: "Sadang Serang 5", kelurahan: "Sadang Serang" },
  { no: 19, name: "Cherry Dharmawan, S.Sn., M.Sn.", rawPhone: "082118047608", nip: "4127.32.04.002", prodi: "S1 Desain Interior", kelompok: "Sadang Serang 6", kelurahan: "Sadang Serang" },
  { no: 20, name: "Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA", rawPhone: "08122421004", nip: "4127.34.03.003", prodi: "S1 Akuntansi", kelompok: "Sadang Serang 7", kelurahan: "Sadang Serang" },
  { no: 21, name: "Dr.H.Tatang Supriyadi,S.E.,M.M", rawPhone: "081222927778", nip: "4127.34.02.075", prodi: "D3 Manajemen Pemasaran", kelompok: "Sadang Serang 8", kelurahan: "Sadang Serang" },
  { no: 22, name: "Dr. Wendi Zaman,M.Si", rawPhone: "08157131405", nip: "4127.70.05.010", prodi: "S1 Sistem Komputer", kelompok: "Sadang Serang 9", kelurahan: "Sadang Serang" },
  { no: 23, name: "Arif Try Cahyadi, S.Ds., M.Ds.", rawPhone: "082298522354", nip: "4127.32.06.087", prodi: "S1 Desain Komunikasi Visual", kelompok: "Sadang Serang 10", kelurahan: "Sadang Serang" },
  { no: 24, name: "Ayub Subandi, S.Si., M.T., Ph.D.", rawPhone: "089612270264", nip: "4127.70.05.030", prodi: "S1 Teknik Elektro", kelompok: "Sadang Serang 11", kelurahan: "Sadang Serang" },
  { no: 25, name: "Iyan Andriana, S.T., M.T.", rawPhone: "08112334224", nip: "4127.70.03.009", prodi: "S1 Teknik Industri", kelompok: "Cipaganti 1", kelurahan: "Cipaganti" },
  { no: 26, name: "Hanhan Maulana, M.Kom., Ph.D.", rawPhone: "085222267759", nip: "4127.70.06.134", prodi: "S1 Teknik Informatika", kelompok: "Cipaganti 2", kelurahan: "Cipaganti" },
  { no: 27, name: "Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.", rawPhone: "089670059709", nip: "4127.32.06.011", prodi: "D3 Desain Grafis", kelompok: "Cipaganti 3", kelurahan: "Cipaganti" },
  { no: 28, name: "Rangga Sidik, S.Kom., M.Kom., M.Eng", rawPhone: "085624088878", nip: "4127.70.26.113", prodi: "S1 Sistem Informasi", kelompok: "Cipaganti 4", kelurahan: "Cipaganti" },
  { no: 29, name: "Prof Umi Narimawati,dra, S.E. M.Si.,M.pd", rawPhone: "081213143636", nip: "4127.34.02.015", prodi: "S1 Manajemen", kelompok: "Dago 1", kelurahan: "Dago" },
  { no: 30, name: "Assoc Prof. Dr. Agus Riyanto S.E., M.S.i", rawPhone: "085759996154", nip: "4127.70.03.007", prodi: "S1 Manajemen", kelompok: "Dago 2", kelurahan: "Dago" },
  { no: 31, name: "Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP", rawPhone: "81223216029", nip: "4127.34.02.006", prodi: "S1 Manajemen", kelompok: "Dago 3", kelurahan: "Dago" },
  { no: 32, name: "Dr. Linna Ismawati, S.E., M.Si.", rawPhone: "81221471617", nip: "4127.34.02.008", prodi: "S1 Manajemen", kelompok: "Dago 4", kelurahan: "Dago" },
];

async function run() {
  console.log("🚀 Injection Data NIP & Profil DPL Unikom dimulai...\n");

  const dplRole = await prisma.role.upsert({
    where: { name: "DPL" },
    update: {},
    create: { name: "DPL" },
  });

  const defaultPassword = await bcrypt.hash("password123", 10);
  let countCreated = 0;

  for (const item of dplData) {
    const phone = normalizePhone(item.rawPhone);

    // Create or update User DPL with NIP, Institusi, and ProgramStudi
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        name: item.name,
        nip: item.nip,
        institusi: "Universitas Komputer Indonesia",
        programStudi: item.prodi,
        roleId: dplRole.id,
        status: "Aktif",
      },
      create: {
        name: item.name,
        phone,
        nip: item.nip,
        institusi: "Universitas Komputer Indonesia",
        programStudi: item.prodi,
        password: defaultPassword,
        roleId: dplRole.id,
        status: "Aktif",
      },
    });

    // Create or update KelompokKkn
    await prisma.kelompokKkn.upsert({
      where: { name: item.kelompok },
      update: {
        kelurahan: item.kelurahan,
        dplId: user.id,
        dplNamaMentah: user.name,
      },
      create: {
        name: item.kelompok,
        kelurahan: item.kelurahan,
        dplId: user.id,
        dplNamaMentah: user.name,
      },
    });

    countCreated++;
    console.log(`[${item.no}/32] ✅ ${item.name} | NIP: ${item.nip} | Prodi: ${item.prodi} (${phone}) ➔ ${item.kelompok}`);
  }

  console.log(`\n🎉 Selesai! Berhasil meng-inject NIP, Institusi, & Program Studi ke ${countCreated} akun DPL di Database.`);
}

run()
  .catch((e) => {
    console.error("❌ Error injection DPL:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
