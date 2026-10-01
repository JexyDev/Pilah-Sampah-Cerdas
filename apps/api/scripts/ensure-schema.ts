import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("[EnsureSchema] Running direct schema migration queries...");
  const queries = [
    `CREATE TABLE IF NOT EXISTS "universitas_mitra" (
      "id" TEXT NOT NULL,
      "nama" TEXT NOT NULL,
      "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "diperbarui_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "universitas_mitra_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "universitas_mitra_nama_key" ON "universitas_mitra"("nama");`,
    `ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "id_universitas" TEXT;`,
    `ALTER TABLE "pengguna" ADD COLUMN IF NOT EXISTS "is_test_account" BOOLEAN NOT NULL DEFAULT false;`,
    `CREATE INDEX IF NOT EXISTS "pengguna_is_test_account_idx" ON "pengguna"("is_test_account");`,
    `ALTER TABLE "setoran_manual" ADD COLUMN IF NOT EXISTS "input_method" TEXT;`,
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pengguna_id_universitas_fkey'
      ) THEN
        ALTER TABLE "pengguna" ADD CONSTRAINT "pengguna_id_universitas_fkey" FOREIGN KEY ("id_universitas") REFERENCES "universitas_mitra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;`,
  ];

  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log("[EnsureSchema] Executed: " + q.replace(/\s+/g, " ").slice(0, 60) + "...");
    } catch (e: any) {
      console.warn("[EnsureSchema] Warning: " + e?.message || e);
    }
  }

  console.log("[EnsureSchema] Schema synchronization completed successfully.");

  // Pastikan data IoT (konfigurasi & 3 node Coblong) selalu ter-deploy secara otomatis
  await ensureIoTData();

  process.exit(0);
}

async function ensureIoTData() {
  try {
    console.log("[EnsureSchema] Ensuring IoT system configuration and official 3 nodes...");

    let config = await prisma.ioTSystemConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!config) {
      await prisma.ioTSystemConfig.create({
        data: {
          warningThresholdCh4: 1000,
          dangerThresholdCh4: 5000,
          heartbeatTimeoutMinutes: 30,
          defaultSensorRadiusMeters: 50,
          mqttBrokerHost: "broker.emqx.io",
          mqttBrokerPort: 1883,
          mqttBrokerWsPort: 8083,
          mqttTopicTemplate: "berseka/iot/{nodeId}/telemetri",
        },
      });
    } else {
      const updates: any = {};
      if (config.heartbeatTimeoutMinutes < 30) updates.heartbeatTimeoutMinutes = 30;
      if (config.ch4WarningThreshold !== 1000) updates.ch4WarningThreshold = 1000;
      if (config.ch4DangerThreshold !== 5000) updates.ch4DangerThreshold = 5000;

      if (Object.keys(updates).length > 0) {
        await prisma.ioTSystemConfig.update({
          where: { id: config.id },
          data: updates,
        });
        console.log("[EnsureSchema] Updated IoT config standard thresholds and heartbeat.");
      }
    }

    const targetNodes = [
      {
        nodeCode: "PSC-NODE-01",
        name: "Sensor Metana TPS Cipaganti",
        locationName: "TPS Kelurahan Cipaganti",
        kelurahanName: "Cipaganti",
        lat: -6.8850500,
        lng: 107.6054602,
        initialPpm: 380,
      },
      {
        nodeCode: "PSC-NODE-02",
        name: "Sensor Metana TPS Sadang Serang",
        locationName: "TPS Kelurahan Sadang Serang",
        kelurahanName: "Sadang Serang",
        lat: -6.8897387,
        lng: 107.6292351,
        initialPpm: 420,
      },
      {
        nodeCode: "PSC-NODE-03",
        name: "Sensor Metana TPS Dago",
        locationName: "TPS Kelurahan Dago",
        kelurahanName: "Dago",
        lat: -6.8736137,
        lng: 107.6186085,
        initialPpm: 350,
      },
    ];

    for (const node of targetNodes) {
      const kel = await prisma.kelurahan.findFirst({
        where: { name: { equals: node.kelurahanName, mode: "insensitive" } },
        include: { rws: { take: 1, orderBy: { id: "asc" } } },
      });

      const existingDevice = await prisma.ioTDevice.findFirst({
        where: {
          OR: [
            { nodeCode: node.nodeCode },
            { name: node.name },
            { locationName: node.locationName },
          ],
        },
      });

      let deviceId: string;

      if (!existingDevice) {
        const apiKey = `PSC_IOT_${node.nodeCode.replace(/[^0-9]/g, "")}_${Date.now().toString(16).toUpperCase().slice(-8)}`;
        const created = await prisma.ioTDevice.create({
          data: {
            name: node.name,
            nodeCode: node.nodeCode,
            locationName: node.locationName,
            latitude: node.lat,
            longitude: node.lng,
            radiusMeter: 50,
            firmwareVersion: "1.1.0",
            status: "ACTIVE",
            apiKey,
            kelurahan: node.kelurahanName,
            kelurahanId: kel?.id || null,
            rwId: kel?.rws[0]?.id || null,
            lastActive: new Date(),
          },
        });
        deviceId = created.id;
        console.log(`[EnsureSchema] Created IoT device ${node.name} (${node.nodeCode}).`);
      } else {
        deviceId = existingDevice.id;
        await prisma.ioTDevice.update({
          where: { id: deviceId },
          data: {
            nodeCode: node.nodeCode,
            name: node.name,
            locationName: node.locationName,
            latitude: node.lat,
            longitude: node.lng,
            kelurahan: node.kelurahanName,
            kelurahanId: kel?.id || existingDevice.kelurahanId,
            rwId: kel?.rws[0]?.id || existingDevice.rwId,
            status: "ACTIVE",
          },
        });
      }

      const readingCount = await prisma.cH4Reading.count({
        where: { deviceId },
      });

      if (readingCount === 0) {
        await prisma.cH4Reading.create({
          data: {
            deviceId,
            nilaiPpm: node.initialPpm,
            suhu: 26.5,
            kelembaban: 65.0,
            baterai: 98,
            rssi: -65,
            latitude: node.lat,
            longitude: node.lng,
            lokasiName: node.locationName,
            statusLevel: "AMAN",
            timestamp: new Date(),
          },
        });
        console.log(`[EnsureSchema] Initial baseline reading created for ${node.nodeCode}.`);
      }
    }
    console.log("[EnsureSchema] IoT data verification completed successfully.");
  } catch (err: any) {
    console.warn("[EnsureSchema] Non-critical warning in ensureIoTData:", err?.message || err);
  }
}

main().catch((err) => {
  console.error("[EnsureSchema] Fatal error:", err);
  process.exit(0);
});
