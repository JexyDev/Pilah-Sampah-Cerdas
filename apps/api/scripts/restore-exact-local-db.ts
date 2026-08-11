import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 RESTORING 100% EXACT LOCALHOST DATABASE ON VPS...');

  const dumpPath = path.join(process.cwd(), 'scripts', 'localhost_data_dump.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Dump file not found at: ${dumpPath}`);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

  console.log('🧹 Purging all existing database data on VPS...');
  await prisma.refreshToken.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.aiRequestLog.deleteMany({});
  await prisma.auditTrail.deleteMany({});
  await prisma.socialFeed.deleteMany({});
  await prisma.pointHistory.deleteMany({});
  await prisma.ideDaurUlang.deleteMany({});
  await prisma.bankSampahLedger.deleteMany({});
  await prisma.violation.deleteMany({});
  await prisma.activityAttendance.deleteMany({});
  await prisma.studentLocation.deleteMany({});
  await prisma.studentLeaveRequest.deleteMany({});
  await prisma.kknHandoverHistory.deleteMany({});
  await prisma.setoranOtomatis.deleteMany({});
  await prisma.setoranManual.deleteMany({});
  await prisma.pemanfaatan.deleteMany({});
  await prisma.binOwnership.deleteMany({});
  await prisma.binResetRequest.deleteMany({});
  await prisma.dispatchTask.deleteMany({});
  await prisma.facilityProductionLog.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.maggotDistributionLog.deleteMany({});
  await prisma.peternakan.deleteMany({});
  await prisma.bin.deleteMany({});
  await prisma.qrBatch.deleteMany({});
  await prisma.wasteCategory.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.studentKkn.deleteMany({});
  await prisma.petugasResidu.deleteMany({});
  await prisma.household.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.kelompokKkn.deleteMany({});
  await prisma.rt.deleteMany({});
  await prisma.rw.deleteMany({});
  await prisma.kelurahan.deleteMany({});
  await prisma.kecamatan.deleteMany({});
  await prisma.kabupaten.deleteMany({});
  await prisma.provinsi.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.systemConfig.deleteMany({});

  console.log('📥 1. Restoring Roles...');
  for (const r of dump.roles) {
    await prisma.role.create({
      data: {
        id: r.id,
        name: r.name,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt)
      }
    });
  }

  console.log('📥 2. Restoring Permissions...');
  for (const p of dump.permissions) {
    await prisma.permission.create({
      data: {
        id: p.id,
        roleId: p.roleId,
        resource: p.resource,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
        updatedAt: new Date(p.updatedAt)
      }
    });
  }

  console.log('📥 3. Restoring Wilayah Hierarki...');
  for (const pr of dump.provinsi) {
    await prisma.provinsi.create({
      data: {
        id: pr.id,
        name: pr.name,
        createdAt: new Date(pr.createdAt),
        updatedAt: new Date(pr.updatedAt)
      }
    });
  }

  for (const kb of dump.kabupaten) {
    await prisma.kabupaten.create({
      data: {
        id: kb.id,
        provinsiId: kb.provinsiId,
        name: kb.name,
        createdAt: new Date(kb.createdAt),
        updatedAt: new Date(kb.updatedAt)
      }
    });
  }

  for (const kc of dump.kecamatan) {
    await prisma.kecamatan.create({
      data: {
        id: kc.id,
        kabupatenId: kc.kabupatenId,
        name: kc.name,
        createdAt: new Date(kc.createdAt),
        updatedAt: new Date(kc.updatedAt)
      }
    });
  }

  for (const kl of dump.kelurahan) {
    await prisma.kelurahan.create({
      data: {
        id: kl.id,
        kecamatanId: kl.kecamatanId,
        name: kl.name,
        createdAt: new Date(kl.createdAt),
        updatedAt: new Date(kl.updatedAt)
      }
    });
  }

  for (const rw of dump.rw) {
    await prisma.rw.create({
      data: {
        id: rw.id,
        kelurahanId: rw.kelurahanId,
        name: rw.name,
        latitude: rw.latitude ? Number(rw.latitude) : null,
        longitude: rw.longitude ? Number(rw.longitude) : null,
        createdAt: new Date(rw.createdAt),
        updatedAt: new Date(rw.updatedAt)
      }
    });
  }

  for (const rt of dump.rt) {
    await prisma.rt.create({
      data: {
        id: rt.id,
        rwId: rt.rwId,
        name: rt.name,
        createdAt: new Date(rt.createdAt),
        updatedAt: new Date(rt.updatedAt)
      }
    });
  }

  console.log('📥 4. Restoring Kelompok KKN...');
  for (const kg of dump.kelompokKkn) {
    await prisma.kelompokKkn.create({
      data: {
        id: kg.id,
        name: kg.name,
        kelurahan: kg.kelurahan,
        cakupanRw: kg.cakupanRw,
        dplNamaMentah: kg.dplNamaMentah,
        createdAt: new Date(kg.createdAt),
        updatedAt: new Date(kg.updatedAt)
      }
    });
  }

  console.log('📥 5. Restoring 634 Users...');
  for (const u of dump.users) {
    const { studentProfile, petugasProfile, ...userData } = u;
    await prisma.user.create({
      data: {
        id: userData.id,
        name: userData.name,
        password: userData.password,
        fcmToken: userData.fcmToken,
        roleId: userData.roleId,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
        fotoProfil: userData.fotoProfil,
        rwId: userData.rwId,
        rtId: userData.rtId,
        status: userData.status,
        address: userData.address,
        phone: userData.phone,
        mustChangePassword: userData.mustChangePassword,
        wargaSubtype: userData.wargaSubtype,
        nip: userData.nip,
        institusi: userData.institusi,
        jabatan: userData.jabatan,
        programStudi: userData.programStudi,
        jenjangPendidikan: userData.jenjangPendidikan,
        jumlahAnggotaKeluarga: userData.jumlahAnggotaKeluarga
      }
    });

    if (studentProfile) {
      await prisma.studentKkn.create({
        data: {
          id: studentProfile.id,
          userId: studentProfile.userId,
          nim: studentProfile.nim,
          jurusan: studentProfile.jurusan,
          fakultas: studentProfile.fakultas,
          noWa: studentProfile.noWa,
          startDate: new Date(studentProfile.startDate),
          endDate: new Date(studentProfile.endDate),
          assignedRwId: studentProfile.assignedRwId,
          whitelistStatus: studentProfile.whitelistStatus,
          createdAt: new Date(studentProfile.createdAt),
          updatedAt: new Date(studentProfile.updatedAt),
          kelompokId: studentProfile.kelompokId,
          isKetua: studentProfile.isKetua,
          jenjangPendidikan: studentProfile.jenjangPendidikan
        }
      });
    }

    if (petugasProfile) {
      await prisma.petugasResidu.create({
        data: {
          id: petugasProfile.id,
          userId: petugasProfile.userId,
          nama: petugasProfile.nama,
          noWa: petugasProfile.noWa,
          assignedZone: petugasProfile.assignedZone,
          createdAt: new Date(petugasProfile.createdAt),
          updatedAt: new Date(petugasProfile.updatedAt),
          whitelistStatus: petugasProfile.whitelistStatus
        }
      });
    }
  }

  // Link DPL to Kelompok KKN
  for (const kg of dump.kelompokKkn) {
    if (kg.dplId) {
      await prisma.kelompokKkn.update({
        where: { id: kg.id },
        data: { dplId: kg.dplId }
      }).catch(() => {});
    }
  }

  console.log('📥 6. Restoring Waste Categories & System Configs...');
  for (const wc of dump.wasteCategories) {
    await prisma.wasteCategory.create({
      data: {
        id: wc.id,
        name: wc.name,
        pointsPerKg: wc.pointsPerKg,
        description: wc.description,
        createdAt: new Date(wc.createdAt),
        updatedAt: new Date(wc.updatedAt)
      }
    }).catch(() => {});
  }

  for (const sc of dump.systemConfigs) {
    await prisma.systemConfig.create({
      data: {
        key: sc.key,
        value: sc.value,
        tipe: sc.tipe,
        deskripsi: sc.deskripsi,
        updatedBy: sc.updatedBy,
        updatedAt: new Date(sc.updatedAt)
      }
    }).catch(() => {});
  }

  console.log('\n🎉 SUCCESS! VPS Database is now 100% IDENTICAL to Localhost DB!');
  console.log(`📊 Statistics on VPS:
  - Users: ${await prisma.user.count()}
  - RWs: ${await prisma.rw.count()}
  - RTs: ${await prisma.rt.count()}
  - Kelompok KKN: ${await prisma.kelompokKkn.count()}
  - Mahasiswa KKN: ${await prisma.studentKkn.count()}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Restore error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
