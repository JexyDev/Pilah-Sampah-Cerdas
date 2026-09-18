export interface WargaBersekaIdParams {
  provinsiKode?: string | null;
  kabupatenKode?: string | null;
  kecamatanKode?: string | null;
  phone?: string | null;
  sequenceNumber: number;
}

/**
 * Menghasilkan format ID Warga Berseka / ID Komunitas resmi:
 * WB-PPKKCCXXXNNNNN (contoh: WB-32730232100001)
 * PP    : 2 digit kode provinsi (Kemendagri)
 * KK    : 2 digit kode kabupaten/kota
 * CC    : 2 digit kode kecamatan
 * XXX   : 3 digit terakhir nomor telepon
 * NNNNN : 5 digit nomor urut pendaftaran di kecamatan tersebut
 */
export function generateWargaBersekaId(params: WargaBersekaIdParams): string {
  const pp = (params.provinsiKode || "32").replace(/\D/g, "").slice(-2).padStart(2, "0");
  const kk = (params.kabupatenKode || "73").replace(/\D/g, "").slice(-2).padStart(2, "0");
  const cc = (params.kecamatanKode || "02").replace(/\D/g, "").slice(-2).padStart(2, "0");

  const rawPhone = (params.phone || "").replace(/\D/g, "");
  const xxx = rawPhone.length >= 3 ? rawPhone.slice(-3) : rawPhone.padStart(3, "0");

  const seq = Math.max(1, Math.floor(params.sequenceNumber || 1));
  const nnnnn = String(seq).padStart(5, "0");

  return `WB-${pp}${kk}${cc}${xxx}${nnnnn}`;
}

export function extractWilayahCodes(rw?: any) {
  const prov = rw?.kelurahan?.kecamatan?.kabupaten?.provinsi;
  const kab = rw?.kelurahan?.kecamatan?.kabupaten;
  const kec = rw?.kelurahan?.kecamatan;

  const pp = (prov?.code || prov?.kode || "32")
    .replace(/\D/g, "")
    .slice(-2)
    .padStart(2, "0");
  const kk = (kab?.code || kab?.kode || "73")
    .replace(/\D/g, "")
    .slice(-2)
    .padStart(2, "0");
  const cc = (kec?.code || kec?.kode || "02")
    .replace(/\D/g, "")
    .slice(-2)
    .padStart(2, "0");
  return { pp, kk, cc };
}

export async function generateUniqueWargaBersekaId(
  prismaClient: any,
  phone?: string | null,
  rw?: any
): Promise<string> {
  const { pp, kk, cc } = extractWilayahCodes(rw);
  const prefix = `WB-${pp}${kk}${cc}`;
  const count = await prismaClient.user.count({
    where: {
      komunitasId: { startsWith: prefix },
    },
  });

  let seq = count + 1;
  let newId = "";
  let isUnique = false;

  while (!isUnique) {
    newId = generateWargaBersekaId({
      provinsiKode: pp,
      kabupatenKode: kk,
      kecamatanKode: cc,
      phone,
      sequenceNumber: seq,
    });
    const existing = await prismaClient.user.findUnique({ where: { komunitasId: newId } });
    if (!existing) {
      isUnique = true;
    } else {
      seq++;
    }
  }
  return newId;
}

export function generateKomunitasId(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "KOM-";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

