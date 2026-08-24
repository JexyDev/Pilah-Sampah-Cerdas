const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const pem = await prisma.pemanfaatan.findMany({ select: { id: true, rwId: true, program: true, teknologi: true, fotoDokumentasiUrl: true } });
  console.log("Pemanfaatan:", pem);
  const fb = await prisma.kritikSaranPemanfaatan.findMany({ select: { id: true, userId: true, judul: true, fotoBuktiUrl: true, rwId: true, kategori: true } });
  console.log("Feedback:", fb);
  const prokers = await prisma.programKerjaKkn.findMany({ select: { id: true, deskripsi: true, kategori: true, kelompok: { select: { name: true } } } });
  console.log("Prokers:", JSON.stringify(prokers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
