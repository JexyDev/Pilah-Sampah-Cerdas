import { PrismaClient } from "@prisma/client";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const DPL_ALIASES: Record<string, string> = {
  "prof umi narimawati": "4127.34.02.015",
  "umi narimawati": "4127.34.02.015",
  "agus riyanto": "4127.70.03.007",
  "raeni dwi santy": "4127.34.02.006",
  "linna ismawati": "4127.34.02.008",
  "adam mukharil": "4127.70.06.024",
  "hanhan maulana": "4127.70.06.134",
  "alif finandhita": "4127.70.06.025",
  "richi dwi": "4127.70.06.132",
  "wartika": "4127.70.26.002",
  "rangga sidik": "4127.70.26.113",
  "wendi z": "4127.70.05.010",
  "iyan andriana": "4127.70.03.009",
  "amilia widya": "4127.70.17.015",
  "ayub subandi": "4127.70.05.030",
  "siswanti zuraida": "4127.88.80.717",
  "aksan ipaenin": "4127.99.90.268",
  "hery dwi": "4127.70.67.004",
  "myrna dwi": "4127.70.26.111",
  "john adler": "4127.70.05.007",
  "agus mulyana": "4127.70.05.017",
  "sri dewi": "4127.34.03.003",
  "tatang supriyadi": "4127.34.02.075",
  "henike primawati": "4127.35.32.011",
  "manap solihat": "4127.35.30.007",
  "olih solihin": "4127.35.30.016",
  "tatik fidowaty": "4127.35.31.009",
  "wahyudi": "4127.33.00.019",
  "arif try": "4127.32.06.087",
  "cherry dharmawan": "4127.32.04.002",
  "rini maulina": "4127.32.06.011",
  "nungki heriyati": "4127.20.03.020",
  "fenny febriant": "4127.20.04.004"
};

function matchNip(rawDpl: string): string | null {
  const clean = rawDpl.toLowerCase();
  for (const [alias, nip] of Object.entries(DPL_ALIASES)) {
    if (clean.includes(alias)) return nip;
  }
  return null;
}

export async function syncDplMaster() {
  const filePath = path.join(__dirname, "../../../docs/raw_new_data.xlsx");
  const workbook = xlsx.readFile(filePath);

  const kelompokSheet = workbook.Sheets["Data Ketua Kelompok KKN"];
  const kelompokRows: any[] = xlsx.utils.sheet_to_json(kelompokSheet);

  const dplSheet = workbook.Sheets["Data DPL KKN"];
  const dplRowsRaw: any[] = xlsx.utils.sheet_to_json(dplSheet);
  const dplRawList = dplRowsRaw.slice(1).map(r => ({
    no: r["DATA DOSEN PEMBIMBING LAPANGAN (DPL) KKN"],
    name: String(r["__EMPTY"] || "").trim(),
    nip: String(r["__EMPTY_1"] || "").trim(),
    prodi: String(r["__EMPTY_2"] || "").trim()
  })).filter(r => r.name && r.nip);

  // 1. Deduplicate Excel 33 DPL rows to 32 unique DPLs by NIP
  const dplMap = new Map<string, typeof dplRawList[0]>();
  for (const d of dplRawList) {
    const cleanNip = d.nip.replace(/\.2$/, "");
    if (!dplMap.has(cleanNip) || d.name.startsWith("Prof.")) {
      dplMap.set(cleanNip, { ...d, nip: cleanNip });
    }
  }

  const dplMasterList = Array.from(dplMap.values());
  console.log(`\n📌 Loaded ${dplMasterList.length} unique DPLs from Excel`);

  const dplRole = await prisma.role.findUnique({ where: { name: "DPL" } });
  if (!dplRole) throw new Error("Role DPL not found");

  // 2. Upsert each DPL user cleanly by NIP
  const nipToUserMap = new Map<string, string>(); // NIP -> userId

  for (const dpl of dplMasterList) {
    const cleanNip = dpl.nip;

    // Find all existing users matching this NIP
    const existingUsers = await prisma.user.findMany({
      where: {
        roleId: dplRole.id,
        OR: [
          { nip: cleanNip },
          { nip: cleanNip + ".2" },
          { phone: cleanNip },
          { phone: cleanNip + ".2" }
        ]
      }
    });

    let mainUser = existingUsers[0];

    // Merge duplicates if any
    if (existingUsers.length > 1) {
      console.log(`  Found ${existingUsers.length} duplicate users for DPL ${dpl.name}, merging...`);
      for (let i = 1; i < existingUsers.length; i++) {
        const dup = existingUsers[i];
        await prisma.kelompokKkn.updateMany({ where: { dplId: dup.id }, data: { dplId: mainUser.id } });
        await prisma.user.delete({ where: { id: dup.id } });
        console.log(`    Deleted duplicate DPL user ${dup.id} (${dup.name})`);
      }
    }

    if (mainUser) {
      mainUser = await prisma.user.update({
        where: { id: mainUser.id },
        data: {
          name: dpl.name,
          nip: cleanNip,
          programStudi: dpl.prodi,
          phone: cleanNip
        }
      });
    } else {
      mainUser = await prisma.user.create({
        data: {
          name: dpl.name,
          nip: cleanNip,
          roleId: dplRole.id,
          programStudi: dpl.prodi,
          status: "AKTIF",
          password: "$2b$10$KopbpJHMBzwKEvMXPP6y9.s0r22jDj0E8LSz9AKhpFH5jYxAzQCHG",
          phone: cleanNip
        }
      });
    }

    nipToUserMap.set(cleanNip, mainUser.id);
    console.log(`  ✅ DPL User: ${dpl.name} | NIP: ${cleanNip} | ID: ${mainUser.id}`);
  }

  // 3. Delete any extra DPL users in DB not in nipToUserMap
  const validUserIds = new Set(nipToUserMap.values());
  const allDplUsers = await prisma.user.findMany({ where: { roleId: dplRole.id } });
  const extraDuplicates = allDplUsers.filter(u => !validUserIds.has(u.id));

  if (extraDuplicates.length > 0) {
    console.log(`\nRemoving ${extraDuplicates.length} extra DPL users...`);
    for (const dup of extraDuplicates) {
      await prisma.kelompokKkn.updateMany({ where: { dplId: dup.id }, data: { dplId: null } });
      await prisma.user.delete({ where: { id: dup.id } });
      console.log(`  ❌ Deleted extra DPL: ${dup.name} (${dup.id})`);
    }
  }

  // 4. Re-link all 32 KelompokKkn to their exact 1:1 DPL user
  console.log("\n=== Re-linking 32 KelompokKkn to DPL ===");
  for (const row of kelompokRows) {
    const rawKel = String(row["Nama Kelompok"] || "");
    const rawKelurahan = String(row["Kelurahan"] || "");
    const rawDpl = String(row["Dosen Pembimbing Lapangan (DPL)"] || "");

    if (!rawKel || !rawKelurahan || !rawDpl) continue;

    const kelNum = rawKel.replace(/\D/g, "");
    const stdName = `Kelompok ${kelNum} ${rawKelurahan.trim()}`;
    const nip = matchNip(rawDpl);

    if (nip && nipToUserMap.has(nip)) {
      const userId = nipToUserMap.get(nip)!;
      const dplMasterObj = dplMasterList.find(d => d.nip === nip);
      const updated = await prisma.kelompokKkn.updateMany({
        where: {
          OR: [
            { name: stdName },
            { name: `Kelompok ${kelNum} (${rawKelurahan.trim()})` }
          ]
        },
        data: {
          dplId: userId,
          dplNamaMentah: dplMasterObj?.name || rawDpl
        }
      });
      console.log(`  🔗 ${stdName} -> Linked to ${dplMasterObj?.name} (${updated.count} rows)`);
    } else {
      console.error(`  ❌ Failed to match DPL for ${stdName}: "${rawDpl}"`);
    }
  }

  // 5. Verify final state
  console.log("\n=== FINAL DPL & KELOMPOK STATE ===");
  const finalDpls = await prisma.user.findMany({
    where: { roleId: dplRole.id },
    include: { dplKelompok: { select: { name: true } } },
    orderBy: { name: "asc" }
  });

  console.log(`Total DPL Users in DB: ${finalDpls.length}`);
  let orphanDpl = 0;
  for (const d of finalDpls) {
    const kNames = d.dplKelompok.map(k => k.name).join(", ") || "-";
    if (kNames === "-") orphanDpl++;
    console.log(`  - ${d.name} | NIP: ${d.nip} | Kelompok: ${kNames}`);
  }
  console.log(`\nDPL without Kelompok: ${orphanDpl}`);
}

if (process.argv[1] && process.argv[1].endsWith("sync-dpl-master.ts")) {
  syncDplMaster()
    .catch(e => console.error("FATAL:", e))
    .finally(() => prisma.$disconnect());
}
