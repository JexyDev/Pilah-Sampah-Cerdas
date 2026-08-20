import { prisma } from './apps/api/src/lib/prisma';
async function test() {
  try {
    const student = await prisma.studentKkn.findFirst({
      include: { kelompok: true }
    });
    console.log("Student:", student?.userId);
    
    if (student) {
      const proker = await prisma.programKerjaKkn.create({
        data: {
          kelompokId: student.kelompok.id,
          kategori: "FISIK",
          deskripsi: "**Judul**\n\nDeskripsi",
          kebutuhanBiaya: 5000,
          status: "BELUM_DISETUJUI",
          sumber: "MAHASISWA",
        }
      });
      console.log("Success:", proker.id);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
