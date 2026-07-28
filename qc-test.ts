import { PrismaClient } from '@prisma/client';
import { polygonService } from './src/services/polygonService.js';
import { cronService } from './src/services/cronService.js';
import { isPointInPolygon } from './src/utils/geoUtils.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function runQC() {
  console.log("=== STARTING QC TEST ===");

  try {
    // 1. Create a University
    const uni = await prisma.university.create({
      data: { name: `Universitas QC ${uuidv4().slice(0,4)}` }
    });
    console.log("Created University:", uni.id);

    const kelurahan = await prisma.kelurahan.findFirst();
    if (!kelurahan) throw new Error("No Kelurahan found to test");

    // 2. Create RT/RW Area with Polygon
    const rtRw = await prisma.rtRwArea.create({
      data: {
        kelurahanId: kelurahan.id,
        name: `RT QC ${uuidv4().slice(0,4)}`,
        polygon: [
          { lat: -6.9000, lng: 107.6000 },
          { lat: -6.9000, lng: 107.6100 },
          { lat: -6.9100, lng: 107.6100 },
          { lat: -6.9100, lng: 107.6000 }
        ]
      }
    });
    console.log("Created RtRwArea:", rtRw.id);

    // 3. Create KKN Group
    const kknGroup = await prisma.kknGroup.create({
      data: {
        name: "Kelompok QC",
        university: { connect: { id: uni.id } },
        rtRwArea: { connect: { id: rtRw.id } },
        dpl: {
          create: {
            university: { connect: { id: uni.id } },
            user: {
              create: {
                name: "DPL QC",
                phone: "08123456789",
                password: "password",
                roleId: 2, // Assume Role 2 is valid for DPL
                status: "ACTIVE"
              }
            }
          }
        }
      }
    });
    console.log("Created KKN Group:", kknGroup.id);

    // 4. Test Point in Polygon
    const pointInside = { lat: -6.9050, lng: 107.6050 };
    const pointOutside = { lat: -6.9200, lng: 107.6200 };
    
    console.log("Point Inside check:", isPointInPolygon(pointInside, rtRw.polygon as any));
    console.log("Point Outside check:", isPointInPolygon(pointOutside, rtRw.polygon as any));

    // 5. Cleanup
    await prisma.kknGroup.delete({ where: { id: kknGroup.id } });
    await prisma.dosenPembimbing.deleteMany({ where: { universityId: uni.id } });
    await prisma.university.delete({ where: { id: uni.id } });
    await prisma.rtRwArea.delete({ where: { id: rtRw.id } });

    console.log("=== QC TEST PASSED AMAN ===");
  } catch (error) {
    console.error("QC TEST FAILED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runQC();
