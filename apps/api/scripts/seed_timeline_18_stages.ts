import { prisma } from "../src/lib/prisma.js";
import { DEFAULT_TIMELINE_COBLONG } from "../src/services/timelineKknService.js";

async function main() {
  console.log("Menyinkronkan 18 tahapan resmi KKN Coblong 2026...");
  
  // Hapus acuan lama kelompokId = null
  await prisma.timelineKkn.deleteMany({
    where: { kelompokId: null }
  });

  for (const item of DEFAULT_TIMELINE_COBLONG) {
    await prisma.timelineKkn.create({
      data: {
        tahapMinggu: item.tahapMinggu,
        tanggal: item.tanggal,
        startDate: item.startDate,
        endDate: item.endDate,
        fase: item.fase,
        kegiatanUtama: item.kegiatanUtama,
        outputTarget: item.outputTarget,
        picKeterangan: item.picKeterangan,
        statusPelaksanaan: item.statusPelaksanaan,
        kelompokId: null
      }
    });
  }

  const count = await prisma.timelineKkn.count({ where: { kelompokId: null } });
  console.log(`Berhasil menyinkronkan ${count} tahapan resmi KKN!`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
