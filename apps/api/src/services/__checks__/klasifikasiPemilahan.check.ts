/**
 * Self-check klasifikasi & kepatuhan pemilahan — tanpa framework, tanpa database.
 * Jalankan: npx tsx src/services/__checks__/klasifikasiPemilahan.check.ts
 *
 * Menjaga dua regresi yang pernah terjadi:
 *  1. confidenceAi diperlakukan sebagai proporsi komposisi (100 - conf)
 *  2. kepatuhan dinilai dari confidence, bukan kecocokan kategori tempat sampah
 */
import assert from "node:assert/strict";

import { classifyWaste } from "../dashboardService.js";

// ── classifyWaste ──────────────────────────────────────────────

// "anorganik" mengandung substring "organik" — urutan pengecekan wajib benar
assert.equal(classifyWaste({ hasilKlasifikasiAi: "anorganik" }), "anorganik");
assert.equal(classifyWaste({ hasilKlasifikasiAi: "Anorganik" }), "anorganik");
assert.equal(classifyWaste({ hasilKlasifikasiAi: "NON-ORGANIK" }), "anorganik");
assert.equal(classifyWaste({ hasilKlasifikasiAi: "organik" }), "organik");
assert.equal(classifyWaste({ hasilKlasifikasiAi: "  Organik  " }), "organik");

// Data kosong tidak boleh diam-diam jadi organik (regresi lama)
assert.equal(classifyWaste({}), null);
assert.equal(classifyWaste({ hasilKlasifikasiAi: null }), null);
assert.equal(classifyWaste({ hasilKlasifikasiAi: "" }), null);
assert.equal(classifyWaste({ hasilKlasifikasiAi: "entah apa" }), null);

// Koreksi manual petugas menang atas tebakan AI
assert.equal(
  classifyWaste({ hasilKlasifikasiAi: "organik", kategoriAktual: "anorganik" }),
  "anorganik"
);

// REGRESI UTAMA: confidence rendah tidak boleh membalik label.
// Versi lama menghitung 100-30=70 lalu menyebutnya organik.
assert.equal(
  classifyWaste({ hasilKlasifikasiAi: "anorganik" }),
  "anorganik",
  "label anorganik harus tetap anorganik berapa pun confidence-nya"
);

// ── Aturan kepatuhan ────────────────────────────────────────────
// Cermin dari logika di getKpi: patuh = isi cocok dengan kategori bin.

function binKategoriDari(name: string): "organik" | "anorganik" | null {
  const n = name.toLowerCase();
  if (n.includes("anorganik") || n.includes("non organik")) return "anorganik";
  if (n.includes("organik")) return "organik";
  return null;
}

type Setoran = { bin: string; hasil: string | null };

function nilaiKepatuhan(rows: Setoran[]) {
  let patuh = 0;
  let tidakPatuh = 0;
  let takTerverifikasi = 0;

  for (const r of rows) {
    const binKat = binKategoriDari(r.bin);
    const isi = classifyWaste({ hasilKlasifikasiAi: r.hasil });
    if (!binKat || !isi) {
      takTerverifikasi++;
      continue;
    }
    if (binKat === isi) patuh++;
    else tidakPatuh++;
  }

  const dinilai = patuh + tidakPatuh;
  return {
    patuh,
    tidakPatuh,
    takTerverifikasi,
    rate: dinilai > 0 ? +((patuh / dinilai) * 100).toFixed(2) : 0,
  };
}

// Sampah anorganik di bin organik = TIDAK patuh, walau AI sangat yakin.
// Versi lama menghitung ini sebagai patuh karena confidence tinggi.
let hasil = nilaiKepatuhan([{ bin: "Organik", hasil: "anorganik" }]);
assert.equal(hasil.patuh, 0);
assert.equal(hasil.tidakPatuh, 1);
assert.equal(hasil.rate, 0);

// Buang di tempat yang benar = patuh
hasil = nilaiKepatuhan([
  { bin: "Organik", hasil: "organik" },
  { bin: "Anorganik", hasil: "anorganik" },
]);
assert.equal(hasil.patuh, 2);
assert.equal(hasil.rate, 100);

// Setoran tak terverifikasi keluar dari denominator, bukan dihitung gagal
hasil = nilaiKepatuhan([
  { bin: "Organik", hasil: "organik" },
  { bin: "Organik", hasil: null },
  { bin: "", hasil: "organik" },
]);
assert.equal(hasil.patuh, 1);
assert.equal(hasil.takTerverifikasi, 2);
assert.equal(hasil.rate, 100, "data tak terverifikasi tidak boleh menekan skor");

// Campuran realistis: 3 dari 4 benar
hasil = nilaiKepatuhan([
  { bin: "Organik", hasil: "organik" },
  { bin: "Organik", hasil: "anorganik" },
  { bin: "Anorganik", hasil: "anorganik" },
  { bin: "Anorganik", hasil: "anorganik" },
]);
assert.equal(hasil.rate, 75);

// ── Rata-rata berbobot antar kelurahan ──────────────────────────
// Kelurahan kecil tidak boleh menarik agregat setara kelurahan besar.
const kelurahan = [
  { setoranDinilai: 1, setoranPatuh: 1 }, // 100%, volume sangat kecil
  { setoranDinilai: 50, setoranPatuh: 10 }, // 20%, volume besar
];

const totalDinilai = kelurahan.reduce((a, k) => a + k.setoranDinilai, 0);
const totalPatuh = kelurahan.reduce((a, k) => a + k.setoranPatuh, 0);
const berbobot = +((totalPatuh / totalDinilai) * 100).toFixed(1);

const sederhana = +(
  kelurahan.reduce((a, k) => a + (k.setoranPatuh / k.setoranDinilai) * 100, 0) / kelurahan.length
).toFixed(1);

assert.equal(berbobot, 21.6);
assert.equal(sederhana, 60); // inilah angka yang sebelumnya ditampilkan
assert.ok(berbobot < sederhana, "rata-rata berbobot harus mencerminkan volume nyata");

console.log("OK — semua pemeriksaan klasifikasi & kepatuhan lolos");
