import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const phone = "085794774532";
  const password = "Acef123@";
  
  try {
    // Cari role DEVELOPER, jika tidak ada, gunakan SUPER_USER atau buat baru
    let devRole = await prisma.role.findFirst({
      where: { name: { in: ["DEVELOPER", "SUPER_USER"] } },
    });

    if (!devRole) {
      console.log("Role DEVELOPER tidak ditemukan. Membuat role DEVELOPER...");
      devRole = await prisma.role.create({
        data: { name: "DEVELOPER" },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { phone: phone },
      update: {
        password: hashedPassword,
        roleId: devRole.id,
        status: "Aktif",
      },
      create: {
        name: "Acef Developer",
        phone: phone,
        password: hashedPassword,
        roleId: devRole.id,
        status: "Aktif",
      },
    });

    console.log(`\n✅ Berhasil! Akun Developer berhasil dibuat/diperbarui.`);
    console.log(`📱 No. Telepon : ${user.phone}`);
    console.log(`🔑 Password    : ${password}`);
    console.log(`🛡️  Role        : ${devRole.name}`);
    
  } catch (error) {
    console.error("❌ Gagal membuat akun:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
