import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// List of authentic Indonesian names for RW heads
const indonesianPersonNames = [
  "H. Bambang Suherman, S.T.",
  "Drs. H. M. Yasin",
  "H. Asep Sunandar",
  "Ir. Dadang Iskandar",
  "Hj. Ratna Juwita",
  "Deden Supriatna",
  "H. Cecep Hidayat",
  "Endang Sutisna",
  "H. Budi Santoso",
  "Eko Prasetyo",
  "Drs. H. Rahmat Hidayat",
  "H. Agus Suhendar",
  "Tedi Setiadi",
  "H. Mulyadi Usman",
  "Hj. Siti Maryam",
  "Wawan Hermawan",
  "H. Suryana Kusnadi",
  "Drs. Toto Warsito",
  "H. Gugun Guntara",
  "Yayat Hidayat",
  "H. Engkus Kusnadi",
  "Drs. Iman Suherman",
  "H. Nanang Kosasih",
  "Oman Abdurrahman",
  "H. Iwan Setiawan",
  "Ade Ruhiyat",
  "H. Syarif Hidayat",
  "Dedi Junaedi",
  "H. Ujang Supriatna",
  "Asep Saepulloh",
  "H. Maman Abdurrahman",
  "Budi Gunawan",
  "H. Ahmad Fauzi",
  "Dedi Kusnadi",
  "H. Usep Syaefuddin",
  "Kiki Respati",
  "H. Hendra Sulaeman",
  "Asep Kurnia",
  "H. Ridwan Kamil",
  "Drs. Agus Budiman",
  "H. Jajang Nurjaman",
  "Tatang Gunawan",
  "H. Rudi Hermawan",
  "Subagja Mulyana",
  "H. Erwin Ramdani",
  "Dody Permana",
  "H. Cepi Supriadi",
  "Agus Rahardjo",
  "H. Wildan Nurhakim",
  "Bambang Trihatmodjo",
  "H. Nurdin Supriyadi",
  "Drs. Hendri Warsito",
  "H. Yudi Rusmayadi",
  "Taufik Hidayat",
  "H. Encep Suherman",
  "Rahmat Kartolo",
  "H. Ganjar Pranowo",
  "Deden Sudrajat",
  "H. Entis Sutisna",
  "Asep Berlian",
  "H. Sony Setiadi",
  "Ferry Farhati",
  "H. Lukman Hakim",
  "Dedi Mulyadi",
  "H. Irfan Hakim",
  "Rizky Febian",
  "H. TB Hasanuddin",
  "Sulaeman Effendi",
  "H. Atalia Praratya",
  "Budi Karya",
  "H. Sandiaga Uno",
  "Erick Thohir",
  "H. Anies Baswedan",
  "Ridwan Saidi",
  "H. Mahfud MD",
  "Yusuf Mansur",
  "H. Zulkifli Hasan",
  "Prabowo Subianto",
  "H. Muhaimin Iskandar",
];

// 6 Kelurahan in Coblong + base coordinates
const coblongBaseCoords: Record<string, { lat: number; lng: number }> = {
  Dago: { lat: -6.8795, lng: 107.6178 },
  Sekeloa: { lat: -6.8902, lng: 107.6189 },
  "Lebak Gede": { lat: -6.8925, lng: 107.6145 },
  "Lebak Siliwangi": { lat: -6.8878, lng: 107.6102 },
  "Sadang Serang": { lat: -6.8955, lng: 107.6240 },
  Cipaganti: { lat: -6.8940, lng: 107.6045 },
};

async function main() {
  console.log("🔄 UPDATING RW NAMES AND MAP COORDINATES IN COBLONG...");

  // 1. Get or create Kecamatan Coblong
  let kec = await prisma.kecamatan.findFirst({ where: { name: "Coblong" } });
  if (!kec) {
    let kab = await prisma.kabupaten.findFirst();
    if (!kab) {
      let prov = await prisma.provinsi.findFirst({ where: { name: "Jawa Barat" } }) || await prisma.provinsi.create({ data: { name: "Jawa Barat" } });
      kab = await prisma.kabupaten.create({ data: { name: "Kota Bandung", provinsiId: prov.id } });
    }
    kec = await prisma.kecamatan.create({ data: { name: "Coblong", kabupatenId: kab.id } });
  }

  // 2. Fetch all RW role users
  const rwRole = await prisma.role.findUnique({ where: { name: "RW" } });
  if (!rwRole) throw new Error("Role RW not found");

  const rwUsers = await prisma.user.findMany({
    where: { roleId: rwRole.id },
    include: { rw: { include: { kelurahan: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${rwUsers.length} RW users in database.`);

  let nameIdx = 0;

  for (let i = 0; i < rwUsers.length; i++) {
    const u = rwUsers[i];
    const personName = indonesianPersonNames[nameIdx % indonesianPersonNames.length];
    nameIdx++;

    let kelName = u.rw?.kelurahan?.name;
    let rwNumberStr = "";

    // Extract RW number from u.name or u.address
    const matchRwName = u.name.match(/RW\s*(\d+)/i) || u.address?.match(/RW\s*(\d+)/i);
    if (matchRwName) {
      rwNumberStr = matchRwName[1].padStart(2, "0");
    } else {
      rwNumberStr = String((i % 15) + 1).padStart(2, "0");
    }

    // Extract Kelurahan from u.name or u.address
    if (!kelName) {
      const matchKel = u.name.match(/Kel\.?\s*([A-Za-z\s]+)/i) || u.address?.match(/Kel\.?\s*([A-Za-z\s]+)/i);
      if (matchKel && matchKel[1]) {
        kelName = matchKel[1].trim();
      }
    }

    if (!kelName) {
      const kelList = Object.keys(coblongBaseCoords);
      kelName = kelList[i % kelList.length];
    }

    // Ensure Kelurahan exists with kecamatanId
    let kelRecord = await prisma.kelurahan.findFirst({ where: { name: { contains: kelName, mode: "insensitive" } } });
    if (!kelRecord) {
      kelRecord = await prisma.kelurahan.create({
        data: {
          name: kelName,
          kecamatanId: kec.id,
        },
      });
    } else if (!kelRecord.kecamatanId) {
      await prisma.kelurahan.update({
        where: { id: kelRecord.id },
        data: { kecamatanId: kec.id },
      });
    }

    const rwLabel = `RW ${rwNumberStr}`;
    const baseCoord = coblongBaseCoords[kelName] || { lat: -6.8925, lng: 107.6145 };

    // Calculate map offset coordinates for each RW
    const rwNum = parseInt(rwNumberStr, 10) || 1;
    const latOffset = (rwNum - 5) * 0.0008;
    const lngOffset = (rwNum - 5) * 0.0009;
    const rwLat = baseCoord.lat + latOffset;
    const rwLng = baseCoord.lng + lngOffset;

    // Find or create Rw record in database
    let rwRecord = u.rw;
    if (!rwRecord) {
      rwRecord = await prisma.rw.findFirst({
        where: {
          kelurahanId: kelRecord.id,
          name: { contains: `RW ${rwNum}`, mode: "insensitive" },
        },
      });
    }

    if (!rwRecord) {
      rwRecord = await prisma.rw.create({
        data: {
          name: rwLabel,
          kelurahanId: kelRecord.id,
          latitude: rwLat as any,
          longitude: rwLng as any,
        },
      });
    } else {
      // Update coordinates
      await prisma.rw.update({
        where: { id: rwRecord.id },
        data: {
          latitude: rwLat as any,
          longitude: rwLng as any,
          kelurahanId: kelRecord.id,
        },
      });
    }

    // Update User record with person name, rwId, address
    const fullAddress = `${rwLabel}, Kel. ${kelRecord.name}, Kec. Coblong`;
    await prisma.user.update({
      where: { id: u.id },
      data: {
        name: personName,
        rwId: rwRecord.id,
        address: fullAddress,
      },
    });

    console.log(`Updated RW User [${u.id}]: Name -> "${personName}", Wilayah -> ${fullAddress} (${rwLat.toFixed(4)}, ${rwLng.toFixed(4)})`);
  }

  console.log("✅ Successfully updated all RW user names and map locations!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
