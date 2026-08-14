/**
 * Seed data Kritik & Saran Pemanfaatan Sampah — TrashCare
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding data Kritik & Saran Pemanfaatan...");

  // Find demo user / warga
  let warga = await prisma.user.findFirst({ where: { role: { name: "WARGA" } } });
  if (!warga) {
    warga = await prisma.user.findFirst();
  }

  if (!warga) {
    console.error("❌ User not found for feedback seed!");
    return;
  }

  const rw = await prisma.rw.findFirst();

  const feedbackData = [
    {
      wargaNama: "Budi Santoso",
      kategori: "Pengolahan Kompos",
      judul: "Fasilitas Komposter RW 03 Perlu Tambahan Bioaktivator",
      isiKritikSaran: "Pengolahan sampah organik di komposter RW 03 sangat bermanfaat, namun proses fermentasi saat ini agak lambat karena stok bioaktivator cairan em4 terbatas. Mohon dibantu pengadaan tambahan dari pihak DLH / Kelurahan.",
      rating: 4,
      status: "SELESAI",
      tanggapan: "Terima kasih Pak Budi. Tim DLH telah menyalurkan 10 liter cairan EM4 bioaktivator ke pengelola komposter RW 03.",
      ditanggapiOleh: "Darto, A.P., M.M. (Dinas Lingkungan Hidup)",
      fotoBuktiUrl: "https://dummyimage.com/600x400/009966/fff&text=Komposter+RW+03",
    },
    {
      wargaNama: "Siti Nurhaliza",
      kategori: "Bank Sampah",
      judul: "Usulan Penambahan Jadwal Penimbangan Bank Sampah Dago",
      isiKritikSaran: "Saat ini penimbangan bank sampah hanya 1x seminggu di hari Sabtu. Mengingat antusiasme warga tinggi, mohon dipertimbangkan penambahan jadwal pada hari Rabu sore.",
      rating: 5,
      status: "DALAM_PROSES",
      tanggapan: "Usulan telah didiskusikan dalam rapat pengurus RW. Penambahan jadwal hari Rabu sedang disiapkan oleh petugas.",
      ditanggapiOleh: "Ketua RW 06 Dago",
      fotoBuktiUrl: "https://dummyimage.com/600x400/0284c7/fff&text=Bank+Sampah+Dago",
    },
    {
      wargaNama: "Ahmad Hidayat",
      kategori: "Rumah Maggot BSF",
      judul: "Aroma Maggot BSF Terlalu Dekat Pemukiman RT 02",
      isiKritikSaran: "Lokasi biopond maggot BSF di dekat RT 02 menimbulkan sedikit bau kurang sedap saat musim hujan. Mohon dipasang penyaring / pembatas penutup yang lebih tertutup.",
      rating: 3,
      status: "MENUNGGU",
      tanggapan: null,
      ditanggapiOleh: null,
      fotoBuktiUrl: "https://dummyimage.com/600x400/eab308/fff&text=Lokasi+Maggot+BSF",
    },
    {
      wargaNama: "Dewi Lestari",
      kategori: "Pupuk Organik Cair (POC)",
      judul: "Kualitas Botol Kemasan POC Sangat Bagus dan Bermanfaat",
      isiKritikSaran: "Apresiasi untuk tim pengolah sampah organik, POC hasil olahan sampah Dago sangat efektif untuk tanaman hidroponik kami! Semoga terus konsisten.",
      rating: 5,
      status: "SELESAI",
      tanggapan: "Terima kasih atas apresiasinya Ibu Dewi! Tim akan terus menjaga mutu POC hasil pengolahan warga.",
      ditanggapiOleh: "Task Force Pengolahan",
      fotoBuktiUrl: "https://dummyimage.com/600x400/a855f7/fff&text=Hasil+POC+Dago",
    },
  ];

  for (const item of feedbackData) {
    await prisma.kritikSaranPemanfaatan.create({
      data: {
        userId: warga.id,
        wargaNama: item.wargaNama,
        kategori: item.kategori,
        judul: item.judul,
        isiKritikSaran: item.isiKritikSaran,
        rating: item.rating,
        status: item.status,
        tanggapan: item.tanggapan,
        ditanggapiOleh: item.ditanggapiOleh,
        ditanggapiPada: item.tanggapan ? new Date() : null,
        fotoBuktiUrl: item.fotoBuktiUrl,
        rwId: rw ? rw.id : null,
      },
    });
  }

  console.log("✅ Seed data Kritik & Saran Pemanfaatan berhasil ditambahkan!");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
