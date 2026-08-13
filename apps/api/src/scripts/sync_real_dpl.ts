/**
 * Script untuk menyelaraskan 32 Data Dosen Pembimbing Lapangan (DPL) Real
 * dengan nomor HP, nama lengkap, dan kelompok KKN sesuai data resmi Unikom.
 * Menggunakan EXACT MATCHING untuk mencegah bentrokan string 'Sadang Serang 1' vs 'Sadang Serang 10'.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const REAL_32_DPL = [
  { no: 1, name: "Muhammad Aksan Ipaenin, S.T. M.Sc", phone: "+6285294754801", rawPhone: "085294754801", kelompok: "Kel 1 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 2, name: "Assoc.Prof. Dr. Wartika S.Kom.,MT", phone: "+62895337560201", rawPhone: "0895337560201", kelompok: "Kel 2 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 3, name: "Myrna Dwi Rahmatya, S.Kom.,M.Kom", phone: "+6285320322236", rawPhone: "085320322236", kelompok: "Kel 3 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 4, name: "Alif Finandhita, S.Kom., M.T.", phone: "+6282115865070", rawPhone: "082115865070", kelompok: "Kel 4 Lebak Gede", kelurahan: "Lebak Gede" },
  { no: 5, name: "Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D", phone: "+6281318920636", rawPhone: "081318920636", kelompok: "Kel 1 Sekeloa", kelurahan: "Sekeloa" },
  { no: 6, name: "Dr. Eng. Siswanti Zuraida, S.Pd., M.T.", phone: "+6288210288162", rawPhone: "088210288162", kelompok: "Kel 2 Sekeloa", kelurahan: "Sekeloa" },
  { no: 7, name: "Dr. Olih Solihin, S.Sos., M.I.Kom.", phone: "+6289656618667", rawPhone: "089656618667", kelompok: "Kel 3 Sekeloa", kelurahan: "Sekeloa" },
  { no: 8, name: "Hery Dwi Yulianto, S.T., M.Kom.", phone: "+628382821127", rawPhone: "08382821127", kelompok: "Kel 4 Sekeloa", kelurahan: "Sekeloa" },
  { no: 9, name: "John Adler, S.Si., M.Si.", phone: "+6282130536915", rawPhone: "082130536915", kelompok: "Kel 5 Sekeloa", kelurahan: "Sekeloa" },
  { no: 10, name: "Dr. Henike Primawati, S.IP., M.I.Pol.", phone: "+628118748686", rawPhone: "08118748686", kelompok: "Kel 6 Sekeloa", kelurahan: "Sekeloa" },
  { no: 11, name: "Fenny Febrianti, S.S.,M.Hum", phone: "+6282121822503", rawPhone: "082121822503", kelompok: "Kel 1 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 12, name: "Dr. Tatik Fidowaty, S.IP., M.Si", phone: "+62817616930", rawPhone: "0817616930", kelompok: "Kel 2 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 13, name: "Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.", phone: "+6281322752828", rawPhone: "081322752828", kelompok: "Kel 3 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
  { no: 14, name: "Dr. Agus Mulyana, S.Kom, M.T.", phone: "+6282116871007", rawPhone: "82116871007", kelompok: "Sadang Serang 1", kelurahan: "Sadang Serang" },
  { no: 15, name: "Amilia Widya, S.Pd., M.T.", phone: "+6281344706038", rawPhone: "081344706038", kelompok: "Sadang Serang 2", kelurahan: "Sadang Serang" },
  { no: 16, name: "Wahyudi, S.H., M.H.", phone: "+6281321920848", rawPhone: "081321920848", kelompok: "Sadang Serang 3", kelurahan: "Sadang Serang" },
  { no: 17, name: "Richi Dwi Agustia, S.Kom., M.Kom.", phone: "+6285780084003", rawPhone: "085780084003", kelompok: "Sadang Serang 4", kelurahan: "Sadang Serang" },
  { no: 18, name: "Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.", phone: "+6281321911449", rawPhone: "081321911449", kelompok: "Sadang Serang 5", kelurahan: "Sadang Serang" },
  { no: 19, name: "Cherry Dharmawan, S.Sn., M.Sn.", phone: "+6282118047608", rawPhone: "082118047608", kelompok: "Sadang Serang 6", kelurahan: "Sadang Serang" },
  { no: 20, name: "Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA", phone: "+628122421004", rawPhone: "08122421004", kelompok: "Sadang Serang 7", kelurahan: "Sadang Serang" },
  { no: 21, name: "Dr.H.Tatang Supriyadi,S.E.,M.M", phone: "+6281222927778", rawPhone: "081222927778", kelompok: "Sadang Serang 8", kelurahan: "Sadang Serang" },
  { no: 22, name: "Dr. Wendi Zaman,M.Si", phone: "+628157131405", rawPhone: "08157131405", kelompok: "Sadang Serang 9", kelurahan: "Sadang Serang" },
  { no: 23, name: "Arif Try Cahyadi, S.Ds., M.Ds.", phone: "+6282298522354", rawPhone: "082298522354", kelompok: "Sadang Serang 10", kelurahan: "Sadang Serang" },
  { no: 24, name: "Ayub Subandi, S.Si., M.T., Ph.D.", phone: "+6289612270264", rawPhone: "089612270264", kelompok: "Sadang Serang 11", kelurahan: "Sadang Serang" },
  { no: 25, name: "Iyan Andriana, S.T., M.T.", phone: "+628112334224", rawPhone: "08112334224", kelompok: "Cipaganti 1", kelurahan: "Cipaganti" },
  { no: 26, name: "Hanhan Maulana, M.Kom., Ph.D.", phone: "+6285222267759", rawPhone: "085222267759", kelompok: "Cipaganti 2", kelurahan: "Cipaganti" },
  { no: 27, name: "Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.", phone: "+6289670059709", rawPhone: "089670059709", kelompok: "Cipaganti 3", kelurahan: "Cipaganti" },
  { no: 28, name: "Rangga Sidik, S.Kom., M.Kom., M.Eng", phone: "+6285624088878", rawPhone: "085624088878", kelompok: "Cipaganti 4", kelurahan: "Cipaganti" },
  { no: 29, name: "Prof Umi Narimawati,dra, S.E. M.Si.,M.pd", phone: "+6281213143636", rawPhone: "081213143636", kelompok: "Dago 1", kelurahan: "Dago" },
  { no: 30, name: "Assoc Prof. Dr. Agus Riyanto S.E., M.S.i", phone: "+6285759996154", rawPhone: "085759996154", kelompok: "Dago 2", kelurahan: "Dago" },
  { no: 31, name: "Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP", phone: "+6281223216029", rawPhone: "81223216029", kelompok: "Dago 3", kelurahan: "Dago" },
  { no: 32, name: "Dr. Linna Ismawati, S.E., M.Si.", phone: "+6281221471617", rawPhone: "81221471617", kelompok: "Dago 4", kelurahan: "Dago" },
];

async function syncDpl() {
  console.log("=== SINKRONISASI 32 DATA DPL REAL UNIKOM (EXACT MATCH) ===");

  const dplRole = await prisma.role.findUnique({ where: { name: "DPL" } });
  if (!dplRole) {
    console.error("Role DPL tidak ditemukan");
    return;
  }

  const defaultPass = await bcrypt.hash("password123", 10);

  for (const item of REAL_32_DPL) {
    // 1. Cari user berdasarkan nomor HP persis
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: item.phone },
          { phone: item.rawPhone },
          { phone: item.rawPhone.startsWith("0") ? item.rawPhone.replace(/^0/, "+62") : `+62${item.rawPhone}` },
          { phone: `+62${item.rawPhone.replace(/^0/, "")}` },
        ],
      },
    });

    if (!existingUser) {
      existingUser = await prisma.user.findFirst({
        where: {
          name: { equals: item.name, mode: "insensitive" },
        },
      });
    }

    if (existingUser) {
      existingUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: item.name,
          phone: item.phone,
          roleId: dplRole.id,
          status: "Aktif",
          institusi: "Universitas Komputer Indonesia",
        },
      });
      console.log(`[UPDATED USER #${item.no}] ${item.name} (${item.phone})`);
    } else {
      try {
        existingUser = await prisma.user.create({
          data: {
            name: item.name,
            phone: item.phone,
            password: defaultPass,
            roleId: dplRole.id,
            status: "Aktif",
            institusi: "Universitas Komputer Indonesia",
          },
        });
        console.log(`[CREATED USER #${item.no}] ${item.name} (${item.phone})`);
      } catch (err) {
        console.warn(`[SKIP CREATE USER #${item.no}] Phone constraint: ${item.phone}`);
        continue;
      }
    }

    // 2. Hubungkan atau buat Kelompok KKN dengan EXACT NAME MATCH ONLY
    if (existingUser) {
      let existingKel = await prisma.kelompokKkn.findFirst({
        where: {
          name: { equals: item.kelompok, mode: "insensitive" },
        },
      });

      if (existingKel) {
        await prisma.kelompokKkn.update({
          where: { id: existingKel.id },
          data: {
            name: item.kelompok,
            dplId: existingUser.id,
            dplNamaMentah: item.name,
            kelurahan: item.kelurahan,
          },
        });
        console.log(`  └─ [LINKED KELOMPOK] ${item.kelompok} -> DPL: ${item.name}`);
      } else {
        await prisma.kelompokKkn.create({
          data: {
            name: item.kelompok,
            dplId: existingUser.id,
            dplNamaMentah: item.name,
            kelurahan: item.kelurahan,
          },
        });
        console.log(`  └─ [CREATED KELOMPOK] ${item.kelompok} -> DPL: ${item.name}`);
      }
    }
  }

  console.log("=== SINKRONISASI 32 DPL SELESAI ===");
}

syncDpl()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
