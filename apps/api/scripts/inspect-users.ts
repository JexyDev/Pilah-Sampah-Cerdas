import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const names = ["Dani Nurhalim", "Najwa Intan Putri", "Chandra Nur Mulyani"];
  
  const users = await prisma.user.findMany({
    where: {
      OR: names.map(name => ({ name: { contains: name.split(" ")[0], mode: "insensitive" } })),
    },
    include: {
      role: true,
      studentProfile: {
        include: {
          kelompok: {
            include: {
              poskoKkn: true,
              dpl: true,
            },
          },
          assignedRw: {
            include: {
              kelurahan: true,
            },
          },
        },
      },
    },
  });

  console.log("=== USERS MATCHED ===");
  for (const u of users) {
    console.log(`User: ${u.name} (ID: ${u.id}, Phone: ${u.phone}, Role: ${u.role.name})`);
    if (u.studentProfile) {
      console.log(`  NIM: ${u.studentProfile.nim}`);
      console.log(`  Jurusan: ${u.studentProfile.jurusan} / ${u.studentProfile.fakultas}`);
      console.log(`  Kelompok: ${u.studentProfile.kelompok?.name} (ID: ${u.studentProfile.kelompokId})`);
      console.log(`  DPL: ${u.studentProfile.kelompok?.dpl?.name}`);
      console.log(`  RW Ditugaskan: ${u.studentProfile.assignedRw?.name} (${u.studentProfile.assignedRw?.kelurahan?.name})`);
      console.log(`  Posko: ${u.studentProfile.kelompok?.poskoKkn?.nama} - ${u.studentProfile.kelompok?.poskoKkn?.alamat} (${u.studentProfile.kelompok?.poskoKkn?.latitude}, ${u.studentProfile.kelompok?.poskoKkn?.longitude})`);
    } else {
      console.log("  No student profile!");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
