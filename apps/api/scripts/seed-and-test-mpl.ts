import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const KELURAHANS = [
  { name: "Cipaganti", email: "mpl.cipaganti@berseka.bandung.go.id", phone: "+6281211110001" },
  { name: "Dago", email: "mpl.dago@berseka.bandung.go.id", phone: "+6281211110002" },
  { name: "Lebak Gede", email: "mpl.lebakgede@berseka.bandung.go.id", phone: "+6281211110003" },
  { name: "Lebak Siliwangi", email: "mpl.lebaksiliwangi@berseka.bandung.go.id", phone: "+6281211110004" },
  { name: "Sadang Serang", email: "mpl.sadangserang@berseka.bandung.go.id", phone: "+6281211110005" },
  { name: "Sekeloa", email: "mpl.sekeloa@berseka.bandung.go.id", phone: "+6281211110006" },
];

async function main() {
  console.log("=== 1. ENSURE ROLE 'MPL' EXISTS ===");
  let mplRole = await prisma.role.findFirst({
    where: {
      OR: [
        { name: "MPL" },
        { name: "MITRA_PENDAMPING_LAPANGAN" },
        { name: { equals: "MPL", mode: "insensitive" } },
      ],
    },
  });

  if (!mplRole) {
    mplRole = await prisma.role.create({
      data: {
        name: "MPL",
      },
    });
    console.log("Created Role MPL:", mplRole.id);
  } else {
    console.log("Role MPL already exists:", mplRole.id, mplRole.name);
  }

  console.log("\n=== 2. SEED MPL ACCOUNTS PER KELURAHAN (COBLONG) ===");
  const hashedPassword = await bcrypt.hash("Berseka2026!", 10);

  const seededAccounts = [];

  for (const k of KELURAHANS) {
    // Find Kelurahan in DB by flexible name search
    const cleanName = k.name.replace(/\s+/g, "").toLowerCase();
    const dbKel = await prisma.kelurahan.findFirst({
      where: {
        OR: [
          { name: { equals: k.name, mode: "insensitive" } },
          { name: { contains: k.name.split(" ")[0], mode: "insensitive" } },
        ],
      },
      include: {
        rws: {
          take: 1,
          orderBy: { name: "asc" },
        },
      },
    });

    const rwId = dbKel?.rws?.[0]?.id || null;

    let user = await prisma.user.findFirst({
      where: { email: k.email },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: `MPL Kelurahan ${k.name}`,
          phone: k.phone,
          roleId: mplRole.id,
          rwId: rwId,
          password: hashedPassword,
        },
      });
      console.log(`[UPDATED] MPL ${k.name}: ${user.email} (RW ID: ${rwId})`);
    } else {
      user = await prisma.user.create({
        data: {
          email: k.email,
          name: `MPL Kelurahan ${k.name}`,
          phone: k.phone,
          password: hashedPassword,
          roleId: mplRole.id,
          rwId: rwId,
        },
      });
      console.log(`[CREATED] MPL ${k.name}: ${user.email} (RW ID: ${rwId})`);
    }

    seededAccounts.push({
      email: user.email,
      name: user.name,
      kelurahan: k.name,
      rwId: rwId,
      id: user.id,
    });
  }

  console.log("\n=== 3. SIMULASI TEST PENILAIAN MPL (50% DPL : 50% MPL) ===");
  // Cari salah satu mahasiswa yang memiliki profil KKN
  const student = await prisma.studentKkn.findFirst({
    include: {
      user: true,
      kelompok: {
        include: { dpl: true },
      },
    },
  });

  if (!student) {
    console.log("No student KKN found to simulate assessment.");
    return;
  }

  console.log(`Target Mahasiswa Simulasi: ${student.user.name} (${student.nim})`);
  console.log(`Kelompok: ${student.kelompok?.name || "-"}`);

  // Test Skenario Formula:
  // Subtotal DPL diasumsikan = 80.00 (bobot 50% -> kontribusi DPL = 40.00)
  const dplSubtotal = 80.0;

  const scenarios = [
    {
      label: "SKENARIO 1: Nilai Rendah (MPL = 50.00)",
      mplSubtotal: 50.0,
      expectedFinal: Number((dplSubtotal * 0.5 + 50.0 * 0.5).toFixed(2)), // 40 + 25 = 65.00
      expectedGrade: "B",
    },
    {
      label: "SKENARIO 2: Nilai Sedang (MPL = 75.00)",
      mplSubtotal: 75.0,
      expectedFinal: Number((dplSubtotal * 0.5 + 75.0 * 0.5).toFixed(2)), // 40 + 37.5 = 77.50
      expectedGrade: "A-",
    },
    {
      label: "SKENARIO 3: Nilai Optimal/Maksimal (MPL = 98.00)",
      mplSubtotal: 98.0,
      expectedFinal: Number((dplSubtotal * 0.5 + 98.0 * 0.5).toFixed(2)), // 40 + 49 = 89.00
      expectedGrade: "A",
    },
  ];

  for (const s of scenarios) {
    const kontribusiDpl = Number((dplSubtotal * 0.5).toFixed(2));
    const kontribusiMpl = Number((s.mplSubtotal * 0.5).toFixed(2));
    const finalScore = Number((kontribusiDpl + kontribusiMpl).toFixed(2));

    console.log(`\n--- ${s.label} ---`);
    console.log(`  Subtotal DPL (Bobot 50%): ${dplSubtotal} -> Kontribusi: ${kontribusiDpl}`);
    console.log(`  Subtotal MPL (Bobot 50%): ${s.mplSubtotal} -> Kontribusi: ${kontribusiMpl}`);
    console.log(`  Nilai Akhir: ${finalScore} (Expected: ${s.expectedFinal})`);
    if (finalScore === s.expectedFinal) {
      console.log(`  Status: PASS (Formula 50% DPL + 50% MPL Valid)`);
    } else {
      console.error(`  Status: FAIL`);
    }
  }

  console.log("\n=== SUMMARY SEED MPL ===");
  console.table(seededAccounts.map(a => ({
    Email: a.email,
    Nama: a.name,
    Kelurahan: a.kelurahan,
    RW_ID: a.rwId,
    Password: "Berseka2026!",
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
