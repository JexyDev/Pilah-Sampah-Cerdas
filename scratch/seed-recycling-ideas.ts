import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RECYCLING_TITLES = [
  "Pot Tanaman dari Botol Plastik Bekas",
  "Penyaring Air Sederhana dari Pasir dan Arang",
  "Kompos Organik Cair Rumah Tangga",
  "Kerajinan Tas Belanja dari Kemasan Kopi",
  "Celengan Kreatif dari Kaleng Susu Bekas",
  "Lampu Hias Kamar dari Kardus Bekas",
  "Eco-enzyme Multi-purpose Cleaner dari Sisa Kulit Jeruk",
  "Mainan Edukasi Anak dari Tutup Botol Warna-warni"
];

const MATERIALS = [
  "Botol plastik bekas, gunting, cat warna, tanah, tanaman",
  "Pipa PVC, pasir bersih, batu kerikil, arang aktif, sabut kelapa",
  "Sisa sayuran, air cucian beras, gula merah, wadah ember tertutup",
  "Bungkus plastik kopi instan, mesin jahit atau lem, benang, gunting",
  "Kaleng susu bekas, kertas kado, lem kertas, cutter",
  "Kardus bekas mie instan, lampu bohlam kecil, kabel, cutter, penggaris",
  "Kulit jeruk/buah, air, gula jawa/tetes tebu, botol plastik besar",
  "Tutup botol bekas aneka warna, lem tembak, papan kayu bekas"
];

const PHOTOS = [
  "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1605600611281-9b1b702ec945?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1595278069441-2cf29f8db058?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1595278069441-2cf29f8db058?auto=format&fit=crop&q=80&w=400"
];

async function run() {
  console.log("Seeding 8 realistic recycling ideas...");

  // Get warga users
  const roleWarga = await prisma.role.findUnique({ where: { name: "WARGA" } });
  if (!roleWarga) {
    console.error("Warga role not found!");
    return;
  }
  const wargas = await prisma.user.findMany({
    where: { roleId: roleWarga.id },
    take: 5
  });
  if (wargas.length === 0) {
    console.error("No Warga users found to assign recycling ideas!");
    return;
  }

  // Get admin to approve some ideas
  const roleAdmin = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  const admin = await prisma.user.findFirst({
    where: { roleId: roleAdmin?.id }
  });
  const adminId = admin ? admin.id : null;

  // Clear existing recycling ideas to start clean
  await prisma.ideDaurUlang.deleteMany({});

  for (let i = 0; i < 8; i++) {
    const warga = wargas[i % wargas.length];
    const statusVal = i % 3 === 0 ? "APPROVED" : i % 3 === 1 ? "PENDING" : "REJECTED";

    await prisma.ideDaurUlang.create({
      data: {
        userId: warga.id,
        judul: RECYCLING_TITLES[i],
        foto: PHOTOS[i],
        material: MATERIALS[i],
        statusApproval: statusVal,
        approvedBy: statusVal !== "PENDING" ? adminId : null
      }
    });

    console.log(`Created recycling idea "${RECYCLING_TITLES[i]}" by ${warga.name} with status ${statusVal}`);
  }

  console.log("Recycling ideas seeding completed!");
}

run().finally(() => prisma.$disconnect());
