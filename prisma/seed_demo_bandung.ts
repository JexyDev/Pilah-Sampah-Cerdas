import { PrismaClient, BinStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding data LENGKAP untuk Demo Kota Bandung (Kec. Coblong)...');

  // Bersihkan data lama
  await prisma.activityAttendance.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.pemanfaatan.deleteMany();
  await prisma.setoranManual.deleteMany();
  await prisma.setoranOtomatis.deleteMany();
  await prisma.bin.deleteMany();
  await prisma.household.deleteMany();
  await prisma.studentKkn.deleteMany();
  await prisma.petugasResidu.deleteMany();
  await prisma.aiRequestLog.deleteMany();
  await prisma.pointHistory.deleteMany();
  await prisma.ideDaurUlang.deleteMany();

  // 1. Setup Roles
  const roles = [
    'WARGA', 'RT', 'RW', 'PETUGAS_RESIDU', 'PENGANGKUT', 
    'MAHASISWA_KKN', 'DPL', 'ADMIN_KELURAH', 'ADMIN_KECAMATAN', 'SUPER_ADMIN', 'ADMIN_DLH', 'CAMAT', 'LURAH'
  ];
  const roleMap = new Map<string, number>();
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r },
    });
    roleMap.set(r, role.id);
  }

  // 2. Setup Kategori Sampah
  const categories = [
    { name: 'Organik', pointsPerKg: 10 },
    { name: 'Anorganik', pointsPerKg: 15 },
    { name: 'Residu', pointsPerKg: 0 }
  ];
  for (const cat of categories) {
    await prisma.wasteCategory.upsert({ where: { name: cat.name }, update: {}, create: cat });
  }
  const orgCat = await prisma.wasteCategory.findUnique({ where: { name: 'Organik' } });
  const anorgCat = await prisma.wasteCategory.findUnique({ where: { name: 'Anorganik' } });

  // 3. Setup Kelurahan
  const kelurahans = ['Dago', 'Sekeloa', 'Lebak Gede'];
  const kelurahanMap = new Map<string, string>();
  for (const k of kelurahans) {
    const kel = await prisma.kelurahan.upsert({ where: { name: k }, update: {}, create: { name: k } });
    kelurahanMap.set(k, kel.id);
  }

  // 4. Setup RT/RW Areas
  const areas = [
    { kel: 'Dago', rw: '01', lat: -6.873, lng: 107.618 },
    { kel: 'Dago', rw: '02', lat: -6.875, lng: 107.619 },
    { kel: 'Sekeloa', rw: '01', lat: -6.885, lng: 107.617 },
    { kel: 'Sekeloa', rw: '02', lat: -6.887, lng: 107.618 },
    { kel: 'Lebak Gede', rw: '01', lat: -6.892, lng: 107.615 }
  ];

  const rtRwObjects: any[] = [];
  for (const area of areas) {
    for (let rt = 1; rt <= 2; rt++) {
      const name = `RW ${area.rw} / RT 0${rt}`;
      const kelId = kelurahanMap.get(area.kel)!;
      const rtRw = await prisma.rtRwArea.upsert({
        where: { kelurahanId_name: { kelurahanId: kelId, name } },
        update: {},
        create: {
          kelurahanId: kelId,
          name,
          latitude: area.lat + (Math.random() * 0.002 - 0.001),
          longitude: area.lng + (Math.random() * 0.002 - 0.001),
        }
      });
      rtRwObjects.push(rtRw);
    }
  }

  // 5. Setup Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "";
    let cleaned = phone.trim().replace(/[\s-]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "+62" + cleaned.slice(1);
    } else if (cleaned.startsWith("62")) {
      cleaned = "+" + cleaned;
    } else if (!cleaned.startsWith("+62") && cleaned.startsWith("8")) {
      cleaned = "+62" + cleaned;
    }
    return cleaned;
  };

  const createUser = async (name: string, phone: string, roleName: string, rtRwId?: number) => {
    const formattedPhone = formatPhoneNumber(phone);
    return prisma.user.upsert({
      where: { phone: formattedPhone },
      update: { rtRwId },
      create: {
        name,
        phone: formattedPhone,
        password: passwordHash,
        roleId: roleMap.get(roleName)!,
        rtRwId,
        address: rtRwId ? `Jl. ${name} No. ${Math.floor(Math.random()*100)}` : 'Jl. Pemda',
        status: 'Aktif',
      }
    });
  };

  const adminSeeds = [
    { phone: "+628111111111", name: "Super Admin TrashCare", role: "SUPER_ADMIN", rtRwId: null },
    { phone: "+628111111112", name: "Admin DLH Bandung", role: "ADMIN_DLH", rtRwId: null },
    { phone: "+628111111113", name: "Camat Coblong", role: "CAMAT", rtRwId: null },
    { phone: "+628111111114", name: "Lurah Dago", role: "LURAH", rtRwId: null },
    { phone: "+628111111115", name: "Asep RW 01", role: "RW", rtRwId: rtRwObjects.length > 0 ? rtRwObjects[0].id : null },
    { phone: "+628111111116", name: "Bambang RT 01", role: "RT", rtRwId: rtRwObjects.length > 0 ? rtRwObjects[0].id : null }
  ];

  for (const admin of adminSeeds) {
    await prisma.user.upsert({
      where: { phone: admin.phone },
      update: {},
      create: {
        name: admin.name,
        phone: admin.phone,
        password: passwordHash,
        roleId: roleMap.get(admin.role)!,
        address: 'Jl. Balai Kota',
        status: 'Aktif',
        rtRwId: admin.rtRwId
      }
    });
  }

  const normalNames = [
    'Asep Sunandar', 'Budi Santoso', 'Cecep Hidayat', 'Dadang Suherman', 'Entis Sutisna',
    'Fajar Sidiq', 'Gilang Ramadhan', 'Hendra Setiawan', 'Iwan Fals', 'Jajang Nurjaman',
    'Kosasih', 'Lukman Hakim', 'Maman Abdurrahman', 'Nana Sumarna', 'Oman Sukmana',
    'Dadan Mulyana', 'Agus Supriatna', 'Euis Julaeha', 'Neneng Sri', 'Siti Aminah',
    'Cucu Cahyati', 'Yani Maryani', 'Lilis Karlina', 'Rina Nose', 'Desy Ratnasari',
    'Tatang Sutarman', 'Ujang Koswara', 'Wahyu Hidayat', 'Zainuddin', 'Yahya Suparman'
  ];

  const mhsNames = [
    'Andi Firmansyah', 'Bella Saphira', 'Ciko Jeriko', 'Dinda Hauw', 'Egi Melgiansyah',
    'Fika Fikriah', 'Gerry Girianza', 'Hani Haryati', 'Intan Nuraini', 'Joko Anwar'
  ];

  const petugasNames = [
    'Kang Maman', 'Mang Ujang', 'Pak Oyon', 'Kang Dedi', 'Mang Koko'
  ];

  let phoneCounter = 1000;
  let nameIdx = 0;
  let mhsIdx = 0;
  let petugasIdx = 0;
  
  const allWarga = [];
  const allMhs = [];
  
  for (const rtRw of rtRwObjects) {
    for (let i=0; i<3; i++) {
        phoneCounter++;
        const currentName = normalNames[nameIdx % normalNames.length];
        nameIdx++;
        const w = await createUser(currentName, `081200${phoneCounter}`, 'WARGA', rtRw.id);
        allWarga.push({ user: w, rtRw });
    }
    
    phoneCounter++;
    const currentPetugas = petugasNames[petugasIdx % petugasNames.length];
    petugasIdx++;
    const p = await createUser(currentPetugas, `081200${phoneCounter}`, 'PETUGAS_RESIDU', rtRw.id);
    await prisma.petugasResidu.create({
        data: {
            userId: p.id,
            nama: p.name,
            noWa: p.phone,
            latitude: Number(rtRw.latitude) + (Math.random() * 0.001 - 0.0005),
            longitude: Number(rtRw.longitude) + (Math.random() * 0.001 - 0.0005),
            whitelistStatus: 'APPROVED'
        }
    });

    for (let m=0; m<2; m++) {
        phoneCounter++;
        const currentMhs = mhsNames[mhsIdx % mhsNames.length];
        mhsIdx++;
        const mhs = await createUser(currentMhs, `081200${phoneCounter}`, 'MAHASISWA_KKN', rtRw.id);
        const kkn = await prisma.studentKkn.upsert({
            where: { nim: `NIM${phoneCounter}` },
            update: {},
            create: {
                userId: mhs.id,
                nim: `NIM${phoneCounter}`,
                jurusan: 'Pembangunan',
                fakultas: 'ITB',
                noWa: mhs.phone,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30*24*60*60*1000),
                assignedPolygonId: rtRw.id,
                whitelistStatus: 'APPROVED'
            }
        });
        allMhs.push({ user: mhs, kkn });
    }
  }

  // Admin / General
  await createUser('Super Admin', '081200999999', 'SUPER_ADMIN');
  await createUser('Admin Coblong', '081200999998', 'ADMIN_KECAMATAN');

  console.log(`✅ Memproses ${allWarga.length} warga untuk koordinat dan setoran...`);
  let binCounter = 0;
  const currentYear = new Date().getFullYear();

  for (const item of allWarga) {
    const lat = Number(item.rtRw.latitude) + (Math.random() * 0.003 - 0.0015);
    const lng = Number(item.rtRw.longitude) + (Math.random() * 0.003 - 0.0015);
    
    await prisma.household.create({
      data: {
        userId: item.user.id,
        address: item.user.address!,
        rtRwId: item.rtRw.id,
        latitude: lat,
        longitude: lng,
      }
    });

    binCounter++;
    const maxVolOrg = 25.0;
    const curVolOrg = Math.random() * maxVolOrg;
    const binOrg = await prisma.bin.create({
      data: {
        qrCode: `ORG${String(binCounter).padStart(4, '0')}${currentYear}`,
        categoryId: orgCat!.id,
        rtRwId: item.rtRw.id,
        kelurahanId: item.rtRw.kelurahanId,
        latitude: lat,
        longitude: lng,
        status: 'ACTIVE_BOUND',
        userId: item.user.id,
        maxCapacityLiter: maxVolOrg,
        currentVolumeLiter: curVolOrg,
      }
    });

    binCounter++;
    const maxVolAnorg = 25.0;
    const curVolAnorg = Math.random() * maxVolAnorg;
    const binAnorg = await prisma.bin.create({
      data: {
        qrCode: `ANORG${String(binCounter).padStart(4, '0')}${currentYear}`,
        categoryId: anorgCat!.id,
        rtRwId: item.rtRw.id,
        kelurahanId: item.rtRw.kelurahanId,
        latitude: lat,
        longitude: lng,
        status: 'ACTIVE_BOUND',
        userId: item.user.id,
        maxCapacityLiter: maxVolAnorg,
        currentVolumeLiter: curVolAnorg,
      }
    });

    // Random Setoran (Waktu Pagi/Sore)
    const numSetoran = Math.floor(Math.random() * 8) + 5;
    for (let s=0; s<numSetoran; s++) {
        const isOrg = Math.random() > 0.5;
        const berat = (Math.random() * 3) + 1;
        const conf = 0.80 + (Math.random() * 0.19); // 0.80 - 0.99
        
        // Pagi: 06:00 - 08:00, Sore: 16:00 - 18:00
        const isMorning = Math.random() > 0.5;
        const hour = isMorning ? (6 + Math.random()*2) : (16 + Math.random()*2);
        
        const date = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000); // last 60 days for trend
        date.setHours(hour, 0, 0, 0);

        const point = berat * conf * (isOrg ? 10 : 15);
        
        await prisma.setoranOtomatis.create({
            data: {
                wargaId: item.user.id,
                fotoSampahUrl: `https://dummyimage.com/600x400/000/fff&text=${isOrg ? 'organik' : 'anorganik'}`,
                hasilKlasifikasiAi: isOrg ? 'organik' : 'anorganik',
                confidenceAi: conf,
                berat: berat,
                poin: point,
                qrTempatSampahId: isOrg ? binOrg.id : binAnorg.id,
                lokasiGps: `${lat},${lng}`,
                createdAt: date
            }
        });

        await prisma.pointHistory.create({
          data: {
            userId: item.user.id,
            points: Math.round(point),
            description: `Setoran sampah ${isOrg ? 'Organik' : 'Anorganik'}`,
            kategori: 'REDUKSI_TONASE',
            createdAt: date
          }
        });

        // Simulasi AI Request Log diskresi
        await prisma.aiRequestLog.create({
          data: {
            userId: item.user.id,
            requestId: uuidv4(),
            imageUrl: `https://dummyimage.com/600x400/000/fff&text=Trash`,
            resultStatus: conf < 0.9 ? 'PENDING_REVIEW' : 'SUCCESS',
            createdAt: date
          }
        });
    }

    // Ide Daur Ulang
    if (Math.random() > 0.7) {
      const isOrgIde = Math.random() > 0.5;
      await prisma.ideDaurUlang.create({
        data: {
          userId: item.user.id,
          judul: `Ide Daur Ulang ${item.user.name}`,
          material: isOrgIde ? 'Organik' : 'Anorganik',
          statusApproval: 'APPROVED'
        }
      });
    }
  }

  // Tambahkan Data Residu
  for (const rtRw of rtRwObjects) {
      const numResidu = Math.floor(Math.random() * 20) + 10;
      const petugas = await prisma.petugasResidu.findFirst({ where: { user: { rtRwId: rtRw.id } } });
      if (petugas) {
          for (let r=0; r<numResidu; r++) {
              const date = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000);
              await prisma.setoranManual.create({
                  data: {
                      petugasResiduId: petugas.userId,
                      diinputOleh: 'petugas',
                      rwId: rtRw.id,
                      fotoResiduUrl: 'https://dummyimage.com/600x400/ff0000/fff&text=Residu',
                      berat: (Math.random() * 15) + 5,
                      kategori: 'residu',
                      lokasiGps: `${Number(rtRw.latitude) + (Math.random()*0.002)},${Number(rtRw.longitude) + (Math.random()*0.002)}`,
                      createdAt: date
                  }
              });
          }
      }

      // Pemanfaatan
      await prisma.pemanfaatan.create({
        data: {
          rwId: rtRw.id,
          nomorCaraPemanfaatan: `PMF-${rtRw.id}-${Math.floor(Math.random()*1000)}`,
          program: 'Bank Sampah',
          teknologi: 'Kompos',
          bahanBaku: 'Organik',
          volumeBahanBaku: 50 + Math.random()*50,
          unitBahanBaku: 'Kg',
          hasil: 20 + Math.random()*20,
          unitHasil: 'Kg',
          fotoDokumentasiUrl: 'https://dummyimage.com/600x400/000/fff&text=Pemanfaatan',
          tanggalPencatatan: new Date()
        }
      });
  }

  // Tambahkan Jadwal Kegiatan & Absen KKN
  for (let i=0; i<5; i++) {
    const sch = await prisma.schedule.create({
      data: {
        title: `Kegiatan Sosialisasi ${i+1}`,
        date: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000),
        time: '09:00',
        category: 'Sosialisasi',
        location: 'Balai RW',
        latitude: areas[i % areas.length].lat,
        longitude: areas[i % areas.length].lng,
        radius: 100
      }
    });

    for (const m of allMhs) {
      if (Math.random() > 0.3) {
        await prisma.activityAttendance.create({
          data: {
            studentId: m.user.id,
            scheduleId: sch.id,
            method: 'GPS',
            latitude: Number(sch.latitude) + (Math.random()*0.0001),
            longitude: Number(sch.longitude) + (Math.random()*0.0001),
            status: 'DALAM_RADIUS'
          }
        });
      }
    }
  }

  console.log('🎉 Seeding LENGKAP Selesai! Data siap untuk di-dump.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
