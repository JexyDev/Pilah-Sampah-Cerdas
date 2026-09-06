import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=================================================");
  console.log("🔍 BERSEKA - Audit & Sync Orphan Bins in Database");
  console.log("=================================================\n");

  const allBins = await prisma.bin.findMany({
    include: {
      user: true,
      binOwnerships: {
        include: { user: true },
      },
      setoranOtomatis: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  console.log(`📊 Total Tempat Sampah diperiksa: ${allBins.length}`);

  let reLinkedCount = 0;
  let resetOrphanCount = 0;
  let healthyCount = 0;

  for (const bin of allBins) {
    const hasDirectUser = Boolean(bin.user);
    const validOwnership = bin.binOwnerships.find((bo) => Boolean(bo.user));

    if (hasDirectUser && validOwnership) {
      healthyCount++;
      continue;
    }

    // Kasus 1: Ada di binOwnership tapi bin.userId null
    if (!hasDirectUser && validOwnership) {
      console.log(`🔗 [RE-LINK] Bin ${bin.qrCode} dihubungkan ke User ID ${validOwnership.user.id} (${validOwnership.user.name})`);
      await prisma.bin.update({
        where: { id: bin.id },
        data: {
          userId: validOwnership.user.id,
          status: "ACTIVE_BOUND",
        },
      });
      reLinkedCount++;
      continue;
    }

    // Kasus 2: Ada userId di bin tapi tidak ada di binOwnership
    if (hasDirectUser && !validOwnership) {
      console.log(`🔗 [CREATE-OWNERSHIP] Bin ${bin.qrCode} membuat record kepemilikan untuk ${bin.user!.name}`);
      await prisma.binOwnership.create({
        data: {
          binId: bin.id,
          userId: bin.user!.id,
          type: "UTAMA",
        },
      });
      reLinkedCount++;
      continue;
    }

    // Kasus 3: Tidak punya direct user dan tidak punya binOwnership yang valid
    // Cek apakah ada riwayat setoran otomatis dengan wargaId yang masih aktif
    if (bin.setoranOtomatis && bin.setoranOtomatis.length > 0) {
      const lastWargaId = bin.setoranOtomatis[0].wargaId;
      if (lastWargaId) {
        const existingWarga = await prisma.user.findUnique({ where: { id: lastWargaId } });
        if (existingWarga) {
          console.log(`🔗 [RECOVER-SETORAN] Bin ${bin.qrCode} dipulihkan ke Warga ${existingWarga.name} dari log setoran`);
          await prisma.bin.update({
            where: { id: bin.id },
            data: {
              userId: existingWarga.id,
              status: "ACTIVE_BOUND",
            },
          });
          await prisma.binOwnership.create({
            data: {
              binId: bin.id,
              userId: existingWarga.id,
              type: "UTAMA",
            },
          });
          reLinkedCount++;
          continue;
        }
      }
    }

    // Kasus 4: Tempat sampah berstatus ACTIVE_BOUND atau memiliki sisa volume/GPS tapi pemiliknya sudah terhapus
    if (bin.status === "ACTIVE_BOUND" || Number(bin.currentVolumeLiter) > 0 || bin.latitude !== null) {
      console.log(`🧹 [RESET-ORPHAN] Bin ${bin.qrCode} (Volume: ${bin.currentVolumeLiter}L, GPS: ${bin.latitude}, ${bin.longitude}) tidak memiliki pemilik valid. Mereset ke PRINTED.`);
      await prisma.bin.update({
        where: { id: bin.id },
        data: {
          status: "PRINTED",
          userId: null,
          currentVolumeLiter: 0,
          latitude: null,
          longitude: null,
        },
      });
      resetOrphanCount++;
    } else {
      healthyCount++;
    }
  }

  console.log("\n=================================================");
  console.log("✅ HASIL SINKRONISASI TEMPAT SAMPAH:");
  console.log(`- Tempat Sampah Sehat/Normal : ${healthyCount}`);
  console.log(`- Berhasil Di-link Ulang      : ${reLinkedCount}`);
  console.log(`- Orphan Direset ke PRINTED   : ${resetOrphanCount}`);
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("❌ Error running sync script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
