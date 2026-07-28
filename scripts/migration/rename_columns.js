import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "pengguna" RENAME COLUMN "phone" TO "no_telepon"`);
    console.log("Renamed phone to no_telepon");
  } catch (e) {
    console.log("Error renaming phone", e.message);
  }
  
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "pengguna" RENAME COLUMN "address" TO "alamat"`);
    console.log("Renamed address to alamat");
  } catch (e) {
    console.log("Error renaming address", e.message);
  }
  
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "pengguna" RENAME COLUMN "warga_subtype" TO "subtipe_warga"`);
    console.log("Renamed warga_subtype to subtipe_warga");
  } catch (e) {
    console.log("Error renaming warga_subtype", e.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
