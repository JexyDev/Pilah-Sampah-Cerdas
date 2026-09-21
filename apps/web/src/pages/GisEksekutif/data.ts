// Data ilustratif GIS Eksekutif Tata Kelola Sampah — Kecamatan Coblong

export interface KelurahanData {
  id: string;
  nama: string;
  kep: number;
  org: number;
  ano: number;
  res: number;
  rw: number;
  fac: number;
  label: [number, number];
  poly: [number, number][];
  ring: [number, number][];
  labelLL: [number, number];
}

export interface FacilityType {
  id: string;
  nama: string;
  fungsi: string;
  warna: string;
  jumlah: number;
}

export interface FacilityItem {
  id: string;
  tipe: string;
  kel: string;
  rw: number;
  x: number;
  y: number;
  nama: string;
  ll: [number, number];
}

export interface SensorItem {
  id: string;
  kel: string;
  rw: number;
  lokasi: string;
  ppm: number | null;
  pos: [number, number];
  ll: [number, number];
}

export interface KepClass {
  min: number;
  max: number;
  label: string;
  ket: string;
  warna: string;
}

export interface Ch4Class {
  min: number;
  max: number;
  label: string;
  fill: string;
  stroke: string;
  area: string;
}

export interface StatsKelResult {
  org: number;
  ano: number;
  res: number;
  total: number;
  kep: number;
  fac: number;
  sensors: SensorItem[];
  share: number;
}

export interface StatsAllResult {
  org: number;
  ano: number;
  res: number;
  total: number;
  kep: number;
  fac: number;
  sensors: SensorItem[];
  baseTotal: number;
}

export const MAP_W = 1233;
export const MAP_H = 480;

// Proyeksi koordinat ilustratif → lat/lng di sekitar Kec. Coblong, Kota Bandung.
const LAT0 = -6.883;
const LNG0 = 107.613;
const SPAN_KM = 6;
export const KM_PER_UNIT = SPAN_KM / MAP_W;

export function toLL([x, y]: [number, number]): [number, number] {
  const dx = (x - MAP_W / 2) * KM_PER_UNIT;
  const dy = (y - MAP_H / 2) * KM_PER_UNIT;
  return [LAT0 - dy / 110.574, LNG0 + dx / (111.32 * Math.cos((LAT0 * Math.PI) / 180))];
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const MONTH_LONG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Total volume bulanan (m³) seluruh kelurahan, dan selisih kepatuhan terhadap September.
export const MONTHLY_TOTAL = [72, 96, 105, 122, 142, 145, 128, 107, 120, 124, 128, 135];
export const KEP_OFFSET = [-22, -18, -15, -11, -6, -4, -9, -8, 0, 2, 4, 5];
export const CURRENT = 8; // September (indeks ke-8)
export const YEAR = 2026;

const V: Record<string, [number, number]> = {
  V1: [150, 110], V2: [240, 78], V3: [312, 55], V4: [348, 105], V5: [372, 148],
  V6: [355, 205], V7: [322, 262], V8: [270, 268], V9: [232, 232], V10: [188, 200], V11: [163, 160],
  T1: [335, 15], T2: [410, 8], T3: [495, 15], T4: [550, 2], T5: [578, 22], T6: [592, 55], T7: [575, 90],
  D1: [548, 118], D2: [505, 140], D3: [455, 150], D4: [410, 125],
  E1: [590, 158], S10: [640, 222],
  L1: [610, 255], L2: [585, 300], L3: [560, 345], L4: [520, 368], L5: [470, 378], L6: [420, 366],
  L7: [375, 335], L8: [342, 300],
  S1: [650, 85], S2: [740, 58], S3: [830, 75], S4: [920, 105], S5: [945, 150], S6: [905, 185],
  S7: [860, 215], S8: [800, 232], S9: [720, 235],
  G1: [880, 262], G2: [850, 315], G3: [790, 350], G4: [735, 380], G5: [670, 412], G6: [625, 405], G7: [595, 375],
  R1: [1010, 165], R2: [1090, 200], R3: [1140, 235], R4: [1152, 262], R5: [1120, 300],
  R6: [1065, 340], R7: [1005, 362], R8: [950, 340], R9: [910, 300],
};

const P = (names: string): [number, number][] => names.split(" ").map((n) => V[n]);

interface RawKelurahan {
  id: string;
  nama: string;
  kep: number;
  org: number;
  ano: number;
  res: number;
  rw: number;
  fac: number;
  label: [number, number];
  poly: [number, number][];
}

const RAW_KELURAHAN: RawKelurahan[] = [
  { id: "dago", nama: "Dago", kep: 85, org: 12, ano: 7, res: 3, rw: 6, fac: 15, label: [483, 92],
    poly: P("V3 T1 T2 T3 T4 T5 T6 T7 D1 D2 D3 D4 V5 V4") },
  { id: "lebak-gede", nama: "Lebak Gede", kep: 72, org: 13, ano: 7, res: 4, rw: 7, fac: 15, label: [715, 300],
    poly: P("S10 S9 S8 S7 G1 G2 G3 G4 G5 G6 G7 L3 L2 L1") },
  { id: "lebak-siliwangi", nama: "Lebak Siliwangi", kep: 58, org: 9, ano: 5, res: 2, rw: 5, fac: 15, label: [433, 245],
    poly: P("V5 D4 D3 D2 D1 E1 S10 L1 L2 L3 L4 L5 L6 L7 L8 V7 V6") },
  { id: "sekeloa", nama: "Sekeloa", kep: 78, org: 12, ano: 6, res: 3, rw: 6, fac: 15, label: [780, 158],
    poly: P("T7 S1 S2 S3 S4 S5 S6 S7 S8 S9 S10 E1 D1") },
  { id: "sadang-serang", nama: "Sadang Serang", kep: 42, org: 8, ano: 5, res: 2, rw: 5, fac: 12, label: [1015, 228],
    poly: P("S5 R1 R2 R3 R4 R5 R6 R7 R8 R9 G1 S7 S6") },
  { id: "cipaganti", nama: "Cipaganti", kep: 68, org: 12, ano: 6, res: 4, rw: 6, fac: 11, label: [300, 146],
    poly: P("V1 V2 V3 V4 V5 V6 V7 V8 V9 V10 V11") },
];

export const KELURAHAN: KelurahanData[] = RAW_KELURAHAN.map((k) => ({
  ...k,
  ring: k.poly.map(toLL),
  labelLL: toLL(k.label),
}));

export const KEL_BY_ID: Record<string, KelurahanData> = Object.fromEntries(
  KELURAHAN.map((k) => [k.id, k])
);

export const TIPE: FacilityType[] = [
  { id: "bank_sampah", nama: "Bank Sampah", fungsi: "Daur ulang", warna: "#1f7aec", jumlah: 14 },
  { id: "rumah_maggot", nama: "Maggot BSF", fungsi: "Biokonversi", warna: "#7c3aed", jumlah: 8 },
  { id: "buruan_sae", nama: "Buruan SAE", fungsi: "Urban farm", warna: "#3f9b3f", jumlah: 18 },
  { id: "loseda", nama: "Loseda", fungsi: "Resapan organik", warna: "#0f8f8a", jumlah: 12 },
  { id: "bata_terawang", nama: "Bata Terawang", fungsi: "Kompos bata", warna: "#ef8a17", jumlah: 9 },
  { id: "tps", nama: "TPS / TPST", fungsi: "Penampungan", warna: "#5b6b7c", jumlah: 14 },
  { id: "poc", nama: "POC", fungsi: "Pupuk organik cair", warna: "#0aa7cc", jumlah: 8 },
];

const _entries = Object.fromEntries(TIPE.map((t) => [t.id, t]));
export const TIPE_BY_ID: Record<string, FacilityType> = {
  ..._entries,
  bank: _entries["bank_sampah"]!,
  maggot: _entries["rumah_maggot"]!,
  sae: _entries["buruan_sae"]!,
  bata: _entries["bata_terawang"]!,
};

// Sensor CH₄ (ppm). ppm = null → offline.
const RAW_SENSORS: Array<{
  id: string;
  kel: string;
  rw: number;
  lokasi: string;
  ppm: number | null;
  pos: [number, number];
}> = [
  { id: "CH₄-01", kel: "cipaganti", rw: 3, lokasi: "Bank Sampah", ppm: 2, pos: [196, 187] },
  { id: "CH₄-02", kel: "lebak-siliwangi", rw: 4, lokasi: "TPS", ppm: 12, pos: [380, 292] },
  { id: "CH₄-03", kel: "dago", rw: 5, lokasi: "Loseda", ppm: 8, pos: [545, 60] },
  { id: "CH₄-04", kel: "sekeloa", rw: 2, lokasi: "Maggot BSF", ppm: 4, pos: [767, 208] },
  { id: "CH₄-05", kel: "lebak-gede", rw: 6, lokasi: "TPST", ppm: 6, pos: [650, 330] },
  { id: "CH₄-06", kel: "sadang-serang", rw: 1, lokasi: "TPS", ppm: 18, pos: [1060, 262] },
  { id: "CH₄-07", kel: "cipaganti", rw: 5, lokasi: "Bata Terawang", ppm: null, pos: [270, 215] },
  { id: "CH₄-08", kel: "lebak-gede", rw: 3, lokasi: "Buruan SAE", ppm: null, pos: [790, 300] },
];

export const SENSORS: SensorItem[] = RAW_SENSORS.map((s) => ({
  ...s,
  ll: toLL(s.pos),
}));

// Peta dasar vektor ilustratif (dipakai bila tile daring tidak dapat dimuat)
const PL = (a: [number, number][]) => a.map(toLL);
export const BASE_LINES = {
  major: [
    PL([[-300, 300], [0, 290], [200, 300], [400, 320], [650, 262], [850, 235], [1080, 200], [1300, 255], [1600, 330]]),
    PL([[470, -200], [462, -50], [480, 100], [520, 250], [490, 400], [470, 700]]),
    PL([[905, -200], [890, 0], [930, 150], [960, 300], [935, 500], [935, 700]]),
    PL([[60, -150], [130, 20], [220, 180], [270, 320], [250, 480], [250, 700]]),
  ],
  minor: [
    PL([[-200, 120], [100, 100], [300, 120], [500, 150], [800, 110], [1000, 85], [1300, 60], [1600, 150]]),
    PL([[-200, 430], [100, 420], [300, 410], [600, 470], [900, 420], [1300, 380], [1600, 450]]),
    PL([[180, -100], [230, 100], [330, 300], [400, 600]]),
    PL([[700, -100], [690, 100], [750, 300], [720, 600]]),
    PL([[1080, -100], [1065, 120], [1115, 300], [1090, 600]]),
    PL([[-100, 220], [600, 240], [1500, 260]]),
    PL([[300, -100], [330, 250], [360, 600]]),
    PL([[820, -100], [800, 300], [790, 600]]),
    PL([[1200, -100], [1180, 300], [1170, 600]]),
  ],
  river: PL([[-300, 470], [0, 440], [280, 400], [480, 430], [640, 455], [800, 470], [1000, 410], [1200, 395], [1400, 380], [1700, 430]]),
};

const RAW_PLACES: Array<[string, number, number]> = [
  ["Sukajadi", 95, 50],
  ["Cidadap", 1040, 58],
  ["Pasteur", 78, 250],
  ["Tamansari", 198, 392],
  ["Citarum", 620, 428],
  ["Cikutra", 1170, 356],
  ["← Bandung", 72, 366],
];

export const PLACES: Array<{ nama: string; ll: [number, number] }> = RAW_PLACES.map(
  ([n, x, y]) => ({ nama: n, ll: toLL([x, y]) })
);

// ---------- Kelas warna kepatuhan ----------
export const KEP_CLASSES: KepClass[] = [
  { min: 0, max: 50, label: "0 – <50", ket: "Rendah", warna: "#ee6a6a" },
  { min: 50, max: 60, label: "50 – <60", ket: "Cukup rendah", warna: "#f7a25a" },
  { min: 60, max: 70, label: "60 – <70", ket: "Sedang", warna: "#f5c518" },
  { min: 70, max: 80, label: "70 – <80", ket: "Baik", warna: "#8fd46f" },
  { min: 80, max: 101, label: "80 – 100", ket: "Sangat baik", warna: "#2f9e5a" },
];

export const kepClass = (v: number): KepClass =>
  KEP_CLASSES.find((c) => v >= c.min && v < c.max) || KEP_CLASSES[0];

// ---------- Kelas warna metana CH4 ----------
export const CH4_CLASSES: Ch4Class[] = [
  { min: 0, max: 5, label: "0 – <5", fill: "#ffffff", stroke: "#a78bfa", area: "#e7defd" },
  { min: 5, max: 10, label: "5 – <10", fill: "#ddd6fe", stroke: "#6d28d9", area: "#b9a4f6" },
  { min: 10, max: Infinity, label: "≥10", fill: "#fbcfe8", stroke: "#be185d", area: "#e879a9" },
];

export const ch4Class = (ppm: number): Ch4Class =>
  CH4_CLASSES.find((c) => ppm >= c.min && ppm < c.max) || CH4_CLASSES[0];

// ---------- Utilitas Algoritma ----------
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10007) / 10007;
}

function inPoly([x, y]: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

const insideWithMargin = (p: [number, number], poly: [number, number][], m: number): boolean =>
  inPoly(p, poly) &&
  inPoly([p[0] + m, p[1]], poly) &&
  inPoly([p[0] - m, p[1]], poly) &&
  inPoly([p[0], p[1] + m], poly) &&
  inPoly([p[0], p[1] - m], poly);

export const pad2 = (n: number | string): string => String(n).padStart(2, "0");
export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

// ---------- Fasilitas (83 titik, posisi deterministik) ----------
export const FALLBACKS: string[] = [];

function buildFacilities(): FacilityItem[] {
  const rand = mulberry32(2026);
  const bag: string[] = TIPE.flatMap((t) => Array(t.jumlah).fill(t.id));
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  const out: FacilityItem[] = [];
  let idx = 0;

  for (const kel of KELURAHAN) {
    const xs = kel.poly.map((p) => p[0]);
    const ys = kel.poly.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];

    for (let n = 0; n < kel.fac; n++) {
      let pt: [number, number] | null = null;
      const halfW = Math.max(58, kel.nama.length * 4.6 + 22);

      for (let t = 0; t < 1200 && !pt; t++) {
        const c: [number, number] = [x0 + rand() * (x1 - x0), y0 + rand() * (y1 - y0)];
        const gap = t < 400 ? 36 : t < 700 ? 30 : t < 1000 ? 25 : 20;

        if (!insideWithMargin(c, kel.poly, 15)) continue;
        if (Math.abs(c[0] - kel.label[0]) < halfW && Math.abs(c[1] - kel.label[1]) < 38) continue;
        if (SENSORS.some((s) => c[0] - s.pos[0] > -24 && c[0] - s.pos[0] < 78 && Math.abs(c[1] - s.pos[1]) < 24)) continue;
        if (out.some((f) => Math.hypot(f.x - c[0], f.y - c[1]) < gap)) continue;

        pt = c;
      }

      if (!pt) {
        pt = [(x0 + x1) / 2 + n * 3, (y0 + y1) / 2 + n * 3];
        FALLBACKS.push(kel.id);
      }

      const tipe = bag[idx];
      const rw = n < kel.rw ? n + 1 : 1 + Math.floor(rand() * kel.rw);

      out.push({
        id: `F${pad2(idx + 1)}`,
        tipe,
        kel: kel.id,
        rw,
        x: pt[0],
        y: pt[1],
        nama: `${TIPE_BY_ID[tipe].nama} ${kel.nama} RW ${pad2(rw)}`,
        ll: toLL([pt[0], pt[1]]),
      });
      idx++;
    }
  }
  return out;
}

export const FASILITAS: FacilityItem[] = buildFacilities();

// ---------- Statistik per kelurahan / RW / periode ----------
function rwShare(kel: KelurahanData, rw: number): number {
  const w = Array.from({ length: kel.rw }, (_, i) => 0.7 + hash01(`${kel.id}-${i + 1}`) * 0.6);
  return w[rw - 1] / w.reduce((a, b) => a + b, 0);
}

function rwDelta(kel: KelurahanData, rw: number): number {
  return Math.round((hash01(`kep-${kel.id}-${rw}`) - 0.5) * 24);
}

/** rw: null → seluruh kelurahan. pi: indeks bulan. */
export function statsKel(kel: KelurahanData, rw: number | null, pi: number): StatsKelResult {
  const f = MONTHLY_TOTAL[pi] / MONTHLY_TOTAL[CURRENT];
  const share = rw ? rwShare(kel, rw) : 1;
  const org = kel.org * share * f;
  const ano = kel.ano * share * f;
  const res = kel.res * share * f;
  const kep = clamp(Math.round(kel.kep + KEP_OFFSET[pi] + (rw ? rwDelta(kel, rw) : 0)), 0, 100);
  const fac = FASILITAS.filter((x) => x.kel === kel.id && (!rw || x.rw === rw)).length;
  const sensors = SENSORS.filter((s) => s.kel === kel.id && (!rw || s.rw === rw));
  return { org, ano, res, total: org + ano + res, kep, fac, sensors, share };
}

/** Agregat untuk filter aktif. kelId null → semua kelurahan. */
export function statsAll(kelId: string | null, rw: number | null, pi: number): StatsAllResult {
  const list = kelId ? [KEL_BY_ID[kelId]] : KELURAHAN;
  const parts = list.map((k) => statsKel(k, kelId ? rw : null, pi));
  const sum = (key: "org" | "ano" | "res" | "total" | "fac") =>
    parts.reduce((a, p) => a + p[key], 0);

  const fac = sum("fac");
  const kepW = parts.reduce((a, p) => a + p.kep * p.fac, 0);
  const sensors = parts.flatMap((p) => p.sensors);
  const baseTotal = parts.reduce(
    (a, p) => a + p.total / (MONTHLY_TOTAL[pi] / MONTHLY_TOTAL[CURRENT]),
    0
  );

  return {
    org: sum("org"),
    ano: sum("ano"),
    res: sum("res"),
    total: sum("total"),
    kep: parts.length === 1 ? parts[0].kep : fac ? Math.round(kepW / fac) : 0,
    fac,
    sensors,
    baseTotal,
  };
}

export function niceScale(max: number): { step: number; top: number } {
  const steps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 60, 80, 100];
  const step = steps.find((s) => s * 3 >= max) || 120;
  return { step, top: step * 3 };
}

export const fmt = (n: number, d = 0): string =>
  Number(n).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
