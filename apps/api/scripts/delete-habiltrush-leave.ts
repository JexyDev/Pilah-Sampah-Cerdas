import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("🔎 Mencari data riwayat izin/sakit mahasiswa 'Habiltrush'...");

  const records = await prisma.studentLeaveRequest.findMany({
    where: {
      OR: [
        { student: { name: { contains: "Habiltrush", mode: "insensitive" } } },
        { reason: { contains: "acara keluarga", mode: "insensitive" } },
      ],
    },
    include: {
      student: { select: { id: true, name: true } },
    },
  });

  if (records.length === 0) {
    console.log("⚠️ Tidak ditemukan data pengajuan izin/sakit untuk Habiltrush.");
    return;
  }

  console.log(`📋 Ditemukan ${records.length} data pengajuan izin:`);
  for (const r of records) {
    console.log(` - ID: ${r.id} | Nama: ${r.student?.name} | Tipe: ${r.type} | Alasan: ${r.reason} | Status: ${r.status}`);
  }

  const deleted = await prisma.studentLeaveRequest.deleteMany({
    where: {
      id: { in: records.map((r) => r.id) },
    },
  });

  console.log(`✅ Berhasil menghapus ${deleted.count} data riwayat izin/sakit Habiltrush dari database.`);
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat menghapus data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
