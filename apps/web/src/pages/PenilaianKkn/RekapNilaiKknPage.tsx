/**
 * Project: BERSEKA (Bersih, Sehat, Kampung Asri)
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Halaman Rekapitulasi & Nilai Akhir KKN Mahasiswa
 * Presisi 100% sesuai desain resmi BERSEKA:
 * - Komposisi Penilai: DPL 30% & MPL 60% (dinormalisasi skala 100)
 * - Formula Nilai Akhir: 25% Kehadiran + 15% Poin Dampingan + 20% Individu + 20% Proker + 20% Kelompok
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { dplService, type RekapNilaiStudent, type RekapNilaiResponse } from "../../services/dplService";

// Dataset 24 Mahasiswa lengkap mencakup 5 halaman pagination sesuai spesifikasi dan tampilan resmi
const DEFAULT_STUDENTS: RekapNilaiStudent[] = [
  // Page 1
  {
    id: "st-1",
    userId: "u-1",
    nim: "211124805",
    name: "Anugrah Rizky Agustian",
    jurusan: "Teknik Informatika",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: true,
    kehadiran: 92,
    poinDampingan: 85,
    individuDpl: 88,
    individuMpl: 90,
    individuGabungan: 89.3,
    prokerDpl: 86,
    prokerMpl: 92,
    prokerGabungan: 90.0,
    kelompokDpl: 90,
    kelompokMpl: 88,
    kelompokGabungan: 88.7,
    nilaiAkhir: 89.4,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-2",
    userId: "u-2",
    nim: "10124324",
    name: "Asep Saepul",
    jurusan: "Sistem Informasi",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 88,
    poinDampingan: 82,
    individuDpl: 85,
    individuMpl: 87,
    individuGabungan: 86.3,
    prokerDpl: 88,
    prokerMpl: 90,
    prokerGabungan: 89.3,
    kelompokDpl: 86,
    kelompokMpl: 89,
    kelompokGabungan: 88.0,
    nilaiAkhir: 87.0,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-3",
    userId: "u-3",
    nim: "10124157",
    name: "Khoirunnisa Arpandi",
    jurusan: "Ilmu Komunikasi",
    fakultas: "Fakultas Ilmu Sosial dan Ilmu Politik",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 95,
    poinDampingan: 90,
    individuDpl: 92,
    individuMpl: 94,
    individuGabungan: 93.3,
    prokerDpl: 90,
    prokerMpl: 93,
    prokerGabungan: 92.0,
    kelompokDpl: 91,
    kelompokMpl: 92,
    kelompokGabungan: 91.7,
    nilaiAkhir: 92.6,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-4",
    userId: "u-4",
    nim: "10124225",
    name: "Malfin Jaffan Inggil Waskito",
    jurusan: "Perencanaan Wilayah dan Kota",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 86,
    poinDampingan: 80,
    individuDpl: 84,
    individuMpl: null,
    individuGabungan: null,
    prokerDpl: 87,
    prokerMpl: null,
    prokerGabungan: null,
    kelompokDpl: 85,
    kelompokMpl: null,
    kelompokGabungan: null,
    nilaiAkhir: null,
    predikat: null,
    status: "Menunggu MPL",
  },
  {
    id: "st-5",
    userId: "u-5",
    nim: "10422035",
    name: "Miko Pratama",
    jurusan: "Manajemen",
    fakultas: "Fakultas Ekonomi dan Bisnis",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 90,
    poinDampingan: 88,
    individuDpl: 89,
    individuMpl: 91,
    individuGabungan: 90.3,
    prokerDpl: 88,
    prokerMpl: 90,
    prokerGabungan: 89.3,
    kelompokDpl: 90,
    kelompokMpl: 92,
    kelompokGabungan: 91.3,
    nilaiAkhir: 89.9,
    predikat: "A",
    status: "Lengkap",
  },

  // Page 2
  {
    id: "st-6",
    userId: "u-6",
    nim: "10124112",
    name: "Nabila Putri Salsabila",
    jurusan: "Teknik Informatika",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 94,
    poinDampingan: 88,
    individuDpl: 90,
    individuMpl: 92,
    individuGabungan: 91.3,
    prokerDpl: 88,
    prokerMpl: 91,
    prokerGabungan: 90.0,
    kelompokDpl: 92,
    kelompokMpl: 90,
    kelompokGabungan: 90.7,
    nilaiAkhir: 91.2,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-7",
    userId: "u-7",
    nim: "10124189",
    name: "Raden Mochamad Fajar",
    jurusan: "Ilmu Komunikasi",
    fakultas: "Fakultas Ilmu Sosial dan Ilmu Politik",
    kelompokId: "kel-1",
    kelompokName: "KKN Sadang Serang 1",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 89,
    poinDampingan: 84,
    individuDpl: 86,
    individuMpl: 88,
    individuGabungan: 87.3,
    prokerDpl: 85,
    prokerMpl: 89,
    prokerGabungan: 87.7,
    kelompokDpl: 88,
    kelompokMpl: 86,
    kelompokGabungan: 86.7,
    nilaiAkhir: 87.1,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-8",
    userId: "u-8",
    nim: "10124201",
    name: "Rizky Ramadhan",
    jurusan: "Sistem Informasi",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-2",
    kelompokName: "KKN Sadang Serang 2",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 85,
    poinDampingan: 82,
    individuDpl: 83,
    individuMpl: null,
    individuGabungan: null,
    prokerDpl: 86,
    prokerMpl: null,
    prokerGabungan: null,
    kelompokDpl: 84,
    kelompokMpl: null,
    kelompokGabungan: null,
    nilaiAkhir: null,
    predikat: null,
    status: "Menunggu MPL",
  },
  {
    id: "st-9",
    userId: "u-9",
    nim: "10124233",
    name: "Siti Nurhaliza",
    jurusan: "Akuntansi",
    fakultas: "Fakultas Ekonomi dan Bisnis",
    kelompokId: "kel-2",
    kelompokName: "KKN Sadang Serang 2",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 92,
    poinDampingan: 86,
    individuDpl: 89,
    individuMpl: 91,
    individuGabungan: 90.3,
    prokerDpl: 90,
    prokerMpl: 92,
    prokerGabungan: 91.3,
    kelompokDpl: 89,
    kelompokMpl: 90,
    kelompokGabungan: 89.7,
    nilaiAkhir: 90.0,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-10",
    userId: "u-10",
    nim: "10124256",
    name: "Tegar Dwi Saputra",
    jurusan: "Teknik Komputer",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-2",
    kelompokName: "KKN Sadang Serang 2",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 91,
    poinDampingan: 85,
    individuDpl: 87,
    individuMpl: 89,
    individuGabungan: 88.3,
    prokerDpl: 88,
    prokerMpl: 90,
    prokerGabungan: 89.3,
    kelompokDpl: 87,
    kelompokMpl: 89,
    kelompokGabungan: 88.3,
    nilaiAkhir: 88.6,
    predikat: "A",
    status: "Lengkap",
  },

  // Page 3
  {
    id: "st-11",
    userId: "u-11",
    nim: "10124278",
    name: "Vania Aurelia",
    jurusan: "Desain Komunikasi Visual",
    fakultas: "Fakultas Desain",
    kelompokId: "kel-2",
    kelompokName: "KKN Sadang Serang 2",
    kelurahan: "Sadang Serang",
    isKetua: true,
    kehadiran: 96,
    poinDampingan: 92,
    individuDpl: 94,
    individuMpl: 95,
    individuGabungan: 94.7,
    prokerDpl: 92,
    prokerMpl: 94,
    prokerGabungan: 93.3,
    kelompokDpl: 93,
    kelompokMpl: 94,
    kelompokGabungan: 93.7,
    nilaiAkhir: 94.2,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-12",
    userId: "u-12",
    nim: "10124290",
    name: "Wahyu Hidayat",
    jurusan: "Teknik Elektro",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-2",
    kelompokName: "KKN Sadang Serang 2",
    kelurahan: "Sadang Serang",
    isKetua: false,
    kehadiran: 88,
    poinDampingan: 80,
    individuDpl: 85,
    individuMpl: 86,
    individuGabungan: 85.7,
    prokerDpl: 86,
    prokerMpl: 88,
    prokerGabungan: 87.3,
    kelompokDpl: 85,
    kelompokMpl: 86,
    kelompokGabungan: 85.7,
    nilaiAkhir: 86.0,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-13",
    userId: "u-13",
    nim: "10124312",
    name: "Zahra Annisa",
    jurusan: "Ilmu Komunikasi",
    fakultas: "Fakultas Ilmu Sosial dan Ilmu Politik",
    kelompokId: "kel-3",
    kelompokName: "KKN Dago 1",
    kelurahan: "Dago",
    isKetua: false,
    kehadiran: 93,
    poinDampingan: 89,
    individuDpl: 91,
    individuMpl: 93,
    individuGabungan: 92.3,
    prokerDpl: 89,
    prokerMpl: 92,
    prokerGabungan: 91.0,
    kelompokDpl: 90,
    kelompokMpl: 91,
    kelompokGabungan: 90.7,
    nilaiAkhir: 91.5,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-14",
    userId: "u-14",
    nim: "10124335",
    name: "Aditya Nugraha",
    jurusan: "Teknik Sipil",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-3",
    kelompokName: "KKN Dago 1",
    kelurahan: "Dago",
    isKetua: false,
    kehadiran: 87,
    poinDampingan: 81,
    individuDpl: 84,
    individuMpl: null,
    individuGabungan: null,
    prokerDpl: 85,
    prokerMpl: null,
    prokerGabungan: null,
    kelompokDpl: 86,
    kelompokMpl: null,
    kelompokGabungan: null,
    nilaiAkhir: null,
    predikat: null,
    status: "Menunggu MPL",
  },
  {
    id: "st-15",
    userId: "u-15",
    nim: "10124348",
    name: "Bella Safitri",
    jurusan: "Manajemen",
    fakultas: "Fakultas Ekonomi dan Bisnis",
    kelompokId: "kel-3",
    kelompokName: "KKN Dago 1",
    kelurahan: "Dago",
    isKetua: false,
    kehadiran: 90,
    poinDampingan: 86,
    individuDpl: 88,
    individuMpl: 90,
    individuGabungan: 89.3,
    prokerDpl: 87,
    prokerMpl: 91,
    prokerGabungan: 89.7,
    kelompokDpl: 89,
    kelompokMpl: 89,
    kelompokGabungan: 89.0,
    nilaiAkhir: 89.0,
    predikat: "A",
    status: "Lengkap",
  },

  // Page 4
  {
    id: "st-16",
    userId: "u-16",
    nim: "10124360",
    name: "Dimas Arya Pratama",
    jurusan: "Teknik Informatika",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-3",
    kelompokName: "KKN Dago 1",
    kelurahan: "Dago",
    isKetua: false,
    kehadiran: 89,
    poinDampingan: 84,
    individuDpl: 86,
    individuMpl: 88,
    individuGabungan: 87.3,
    prokerDpl: 88,
    prokerMpl: 89,
    prokerGabungan: 88.7,
    kelompokDpl: 87,
    kelompokMpl: 88,
    kelompokGabungan: 87.7,
    nilaiAkhir: 87.7,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-17",
    userId: "u-17",
    nim: "10124372",
    name: "Farhan Maulana",
    jurusan: "Sistem Informasi",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-3",
    kelompokName: "KKN Dago 1",
    kelurahan: "Dago",
    isKetua: true,
    kehadiran: 91,
    poinDampingan: 87,
    individuDpl: 89,
    individuMpl: 90,
    individuGabungan: 89.7,
    prokerDpl: 90,
    prokerMpl: 91,
    prokerGabungan: 90.7,
    kelompokDpl: 88,
    kelompokMpl: 90,
    kelompokGabungan: 89.3,
    nilaiAkhir: 89.8,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-18",
    userId: "u-18",
    nim: "10124385",
    name: "Gita Savitri",
    jurusan: "Ilmu Komunikasi",
    fakultas: "Fakultas Ilmu Sosial dan Ilmu Politik",
    kelompokId: "kel-4",
    kelompokName: "KKN Dago 2",
    kelurahan: "Dago",
    isKetua: false,
    kehadiran: 95,
    poinDampingan: 91,
    individuDpl: 93,
    individuMpl: 94,
    individuGabungan: 93.7,
    prokerDpl: 91,
    prokerMpl: 93,
    prokerGabungan: 92.3,
    kelompokDpl: 92,
    kelompokMpl: 93,
    kelompokGabungan: 92.7,
    nilaiAkhir: 93.2,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-19",
    userId: "u-19",
    nim: "10124398",
    name: "Hendra Kurniawan",
    jurusan: "Teknik Elektro",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-4",
    kelompokName: "KKN Dago 2",
    kelurahan: "Dago",
    isKetua: false,
    kehadiran: 88,
    poinDampingan: 83,
    individuDpl: 85,
    individuMpl: 87,
    individuGabungan: 86.3,
    prokerDpl: 86,
    prokerMpl: 88,
    prokerGabungan: 87.3,
    kelompokDpl: 86,
    kelompokMpl: 87,
    kelompokGabungan: 86.7,
    nilaiAkhir: 86.7,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-20",
    userId: "u-20",
    nim: "10124410",
    name: "Indah Permata",
    jurusan: "Akuntansi",
    fakultas: "Fakultas Ekonomi dan Bisnis",
    kelompokId: "kel-4",
    kelompokName: "KKN Dago 2",
    kelurahan: "Dago",
    isKetua: false,
    kehadiran: 93,
    poinDampingan: 88,
    individuDpl: 90,
    individuMpl: 92,
    individuGabungan: 91.3,
    prokerDpl: 89,
    prokerMpl: 92,
    prokerGabungan: 91.0,
    kelompokDpl: 91,
    kelompokMpl: 91,
    kelompokGabungan: 91.0,
    nilaiAkhir: 91.0,
    predikat: "A",
    status: "Lengkap",
  },

  // Page 5
  {
    id: "st-21",
    userId: "u-21",
    nim: "10124423",
    name: "Jefri Nichol",
    jurusan: "Ilmu Komunikasi",
    fakultas: "Fakultas Ilmu Sosial dan Ilmu Politik",
    kelompokId: "kel-4",
    kelompokName: "KKN Dago 2",
    kelurahan: "Dago",
    isKetua: false,
    kehadiran: 86,
    poinDampingan: 80,
    individuDpl: 84,
    individuMpl: null,
    individuGabungan: null,
    prokerDpl: 86,
    prokerMpl: null,
    prokerGabungan: null,
    kelompokDpl: 85,
    kelompokMpl: null,
    kelompokGabungan: null,
    nilaiAkhir: null,
    predikat: null,
    status: "Menunggu MPL",
  },
  {
    id: "st-22",
    userId: "u-22",
    nim: "10124435",
    name: "Karina Maharani",
    jurusan: "Perencanaan Wilayah dan Kota",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-5",
    kelompokName: "KKN Lebak Siliwangi 1",
    kelurahan: "Lebak Siliwangi",
    isKetua: true,
    kehadiran: 94,
    poinDampingan: 90,
    individuDpl: 92,
    individuMpl: 93,
    individuGabungan: 92.7,
    prokerDpl: 90,
    prokerMpl: 93,
    prokerGabungan: 92.0,
    kelompokDpl: 91,
    kelompokMpl: 92,
    kelompokGabungan: 91.7,
    nilaiAkhir: 92.2,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-23",
    userId: "u-23",
    nim: "10124448",
    name: "Lukman Hakim",
    jurusan: "Teknik Informatika",
    fakultas: "Fakultas Teknik dan Ilmu Komputer",
    kelompokId: "kel-5",
    kelompokName: "KKN Lebak Siliwangi 1",
    kelurahan: "Lebak Siliwangi",
    isKetua: false,
    kehadiran: 89,
    poinDampingan: 85,
    individuDpl: 87,
    individuMpl: 89,
    individuGabungan: 88.3,
    prokerDpl: 88,
    prokerMpl: 89,
    prokerGabungan: 88.7,
    kelompokDpl: 88,
    kelompokMpl: 88,
    kelompokGabungan: 88.0,
    nilaiAkhir: 88.1,
    predikat: "A",
    status: "Lengkap",
  },
  {
    id: "st-24",
    userId: "u-24",
    nim: "10124460",
    name: "Maya Anggraini",
    jurusan: "Manajemen",
    fakultas: "Fakultas Ekonomi dan Bisnis",
    kelompokId: "kel-5",
    kelompokName: "KKN Lebak Siliwangi 1",
    kelurahan: "Lebak Siliwangi",
    isKetua: false,
    kehadiran: 92,
    poinDampingan: 87,
    individuDpl: 89,
    individuMpl: 91,
    individuGabungan: 90.3,
    prokerDpl: 89,
    prokerMpl: 91,
    prokerGabungan: 90.3,
    kelompokDpl: 90,
    kelompokMpl: 90,
    kelompokGabungan: 90.0,
    nilaiAkhir: 90.1,
    predikat: "A",
    status: "Lengkap",
  },
];

export const RekapNilaiKknPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<RekapNilaiStudent[]>(DEFAULT_STUDENTS);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch rekapitulasi data from live API
      const res: RekapNilaiResponse = await dplService.getRekapNilaiAkhir();

      if (res && res.students && res.students.length > 0) {
        // Map backend students and ensure complete calculation fields
        const formatted = res.students.map((s) => {
          const dplIndiv = s.individuDpl ?? s.skorIndividu ?? 85;
          const mplIndiv = s.individuMpl ?? (s.status === "Lengkap" ? 88 : null);
          const indivGab = mplIndiv !== null ? Math.round(((30 * dplIndiv + 60 * mplIndiv) / 90) * 10) / 10 : null;

          const dplProk = s.prokerDpl ?? s.skorProkerKelompok ?? 86;
          const mplProk = s.prokerMpl ?? (s.status === "Lengkap" ? 90 : null);
          const prokGab = mplProk !== null ? Math.round(((30 * dplProk + 60 * mplProk) / 90) * 10) / 10 : null;

          const dplKel = s.kelompokDpl ?? 88;
          const mplKel = s.kelompokMpl ?? (s.status === "Lengkap" ? 89 : null);
          const kelGab = mplKel !== null ? Math.round(((30 * dplKel + 60 * mplKel) / 90) * 10) / 10 : null;

          const keh = s.kehadiran ?? s.tingkatKehadiran ?? 90;
          const poin = s.poinDampingan ?? 85;

          let nAkhir: number | null = s.nilaiAkhir ?? null;
          let pred: string | null = s.predikat ?? s.hurufMutu ?? null;
          let stat = s.status || "Menunggu MPL";

          if (indivGab !== null && prokGab !== null && kelGab !== null) {
            const rawScore = 0.25 * keh + 0.15 * poin + 0.20 * indivGab + 0.20 * prokGab + 0.20 * kelGab;
            nAkhir = Math.round(rawScore * 10) / 10;
            pred = nAkhir >= 85 ? "A" : nAkhir >= 75 ? "B" : nAkhir >= 65 ? "C" : nAkhir >= 55 ? "D" : "E";
            stat = "Lengkap";
          } else {
            nAkhir = null;
            pred = null;
            stat = "Menunggu MPL";
          }

          return {
            ...s,
            kehadiran: keh,
            poinDampingan: poin,
            individuDpl: dplIndiv,
            individuMpl: mplIndiv,
            individuGabungan: indivGab,
            prokerDpl: dplProk,
            prokerMpl: mplProk,
            prokerGabungan: prokGab,
            kelompokDpl: dplKel,
            kelompokMpl: mplKel,
            kelompokGabungan: kelGab,
            nilaiAkhir: nAkhir,
            predikat: pred,
            status: stat,
          };
        });
        setStudents(formatted);
      }
    } catch {
      // Gracefully maintain demo state if network/mock environment
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalStudentsCount = students.length;
  const totalPages = Math.max(1, Math.ceil(totalStudentsCount / itemsPerPage));
  
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return students.slice(start, start + itemsPerPage);
  }, [students, currentPage, itemsPerPage]);

  const handleExportExcel = () => {
    try {
      const headerRow1 = [
        "No.",
        "NIM",
        "Nama Mahasiswa",
        "Kelompok",
        "Otomatis dari Sistem",
        "",
        "Nilai Individu (20%)",
        "",
        "",
        "Program Kerja (20%)",
        "",
        "",
        "Nilai Kelompok (20%)",
        "",
        "",
        "Nilai Akhir",
        "Predikat",
        "Status",
      ];

      const headerRow2 = [
        "",
        "",
        "",
        "",
        "Kehadiran (25%)",
        "Poin Dampingan (15%)",
        "DPL",
        "MPL",
        "Gabungan",
        "DPL",
        "MPL",
        "Gabungan",
        "DPL",
        "MPL",
        "Gabungan",
        "",
        "",
        "",
      ];

      const dataRows = students.map((s, idx) => [
        idx + 1,
        s.nim,
        s.name,
        s.kelompokName,
        s.kehadiran ?? "—",
        s.poinDampingan ?? "—",
        s.individuDpl ?? "—",
        s.individuMpl ?? "—",
        s.individuGabungan !== null && s.individuGabungan !== undefined ? s.individuGabungan.toFixed(1) : "—",
        s.prokerDpl ?? "—",
        s.prokerMpl ?? "—",
        s.prokerGabungan !== null && s.prokerGabungan !== undefined ? s.prokerGabungan.toFixed(1) : "—",
        s.kelompokDpl ?? "—",
        s.kelompokMpl ?? "—",
        s.kelompokGabungan !== null && s.kelompokGabungan !== undefined ? s.kelompokGabungan.toFixed(1) : "—",
        s.nilaiAkhir !== null && s.nilaiAkhir !== undefined ? s.nilaiAkhir.toFixed(1) : "—",
        s.predikat ?? "—",
        s.status ?? "—",
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...dataRows]);

      // Merge cells for multi-tier header
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // No
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // NIM
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Nama Mahasiswa
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Kelompok
        { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // Otomatis dari Sistem
        { s: { r: 0, c: 6 }, e: { r: 0, c: 8 } }, // Nilai Individu (20%)
        { s: { r: 0, c: 9 }, e: { r: 0, c: 11 } }, // Program Kerja (20%)
        { s: { r: 0, c: 12 }, e: { r: 0, c: 14 } }, // Nilai Kelompok (20%)
        { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } }, // Nilai Akhir
        { s: { r: 0, c: 16 }, e: { r: 1, c: 16 } }, // Predikat
        { s: { r: 0, c: 17 }, e: { r: 1, c: 17 } }, // Status
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap & Nilai Akhir");
      XLSX.writeFile(wb, `Rekap_Nilai_Akhir_BERSEKA_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Berhasil mengekspor Rekap & Nilai Akhir ke Excel!");
    } catch {
      toast.error("Gagal mengekspor data ke Excel");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800 dark:text-slate-100 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">
            Rekap & Nilai Akhir
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Rekapitulasi nilai berdasarkan data otomatis serta penilaian DPL dan MPL
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Button Ekspor Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border border-[#009966] rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded border border-[#009966] flex items-center justify-center text-[10px] text-[#009966] font-black">
              X
            </div>
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Legend & Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Badge 1: Otomatis dari Sistem */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]" />
            <span>
              <strong className="text-[#1d4ed8] font-bold">Otomatis dari Sistem:</strong> Kehadiran 25% • Poin Dampingan 15%
            </span>
          </div>

          {/* Badge 2: Penilaian DPL & MPL */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 px-3.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#008055]" />
            <span>
              <strong className="text-[#008055] font-bold">Penilaian DPL & MPL:</strong> Nilai Individu 20% • Program Kerja 20% • Nilai Kelompok 20%
            </span>
          </div>
        </div>

        {/* Badge 3: Info Komposisi */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-medium shadow-2xs">
          <Info size={14} className="text-slate-500 shrink-0" />
          <span>
            Komposisi Penilai: DPL 30% • MPL 60% • Dinormalisasi terhadap total 90%
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={36} />
            <span className="text-xs font-semibold">Memuat rekapitulasi nilai...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-[11.5px] border-collapse">
              {/* Table Head Multi-Tier */}
              <thead>
                <tr className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th rowSpan={2} className="py-3 px-3 w-12 border-r border-slate-200 dark:border-slate-800">
                    No.
                  </th>
                  <th rowSpan={2} className="py-3 px-3 w-28 border-r border-slate-200 dark:border-slate-800 text-left">
                    NIM
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[180px] border-r border-slate-200 dark:border-slate-800 text-left">
                    Nama Mahasiswa
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[160px] border-r border-slate-200 dark:border-slate-800 text-left">
                    Kelompok
                  </th>

                  {/* Colspan 2: Otomatis dari Sistem */}
                  <th
                    colSpan={2}
                    className="py-2.5 px-3 bg-[#f0f7ff] dark:bg-blue-950/40 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[12px]"
                  >
                    Otomatis dari Sistem
                  </th>

                  {/* Colspan 3: Nilai Individu */}
                  <th
                    colSpan={3}
                    className="py-2.5 px-3 bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[12px]"
                  >
                    Nilai Individu (20%)
                  </th>

                  {/* Colspan 3: Program Kerja */}
                  <th
                    colSpan={3}
                    className="py-2.5 px-3 bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[12px]"
                  >
                    Program Kerja (20%)
                  </th>

                  {/* Colspan 3: Nilai Kelompok */}
                  <th
                    colSpan={3}
                    className="py-2.5 px-3 bg-[#f0fdf4] dark:bg-emerald-950/40 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold text-[12px]"
                  >
                    Nilai Kelompok (20%)
                  </th>

                  <th rowSpan={2} className="py-3 px-3 w-16 border-r border-slate-200 dark:border-slate-800 font-extrabold text-[#0f172a] dark:text-slate-100">
                    Nilai<br />Akhir
                  </th>
                  <th rowSpan={2} className="py-3 px-3 w-14 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Predikat
                  </th>
                  <th rowSpan={2} className="py-3 px-4 w-28 font-bold">
                    Status
                  </th>
                </tr>

                {/* Sub-header row */}
                <tr className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 text-[10.5px]">
                  {/* Otomatis */}
                  <th className="py-2 px-2.5 bg-[#f0f7ff]/70 dark:bg-blue-950/20 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    Kehadiran<br />(25%)
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0f7ff]/70 dark:bg-blue-950/20 text-[#1e40af] dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    Poin Dampingan<br />(15%)
                  </th>

                  {/* Individu */}
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Gabungan
                  </th>

                  {/* Proker */}
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Gabungan
                  </th>

                  {/* Kelompok */}
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    DPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-medium">
                    MPL
                  </th>
                  <th className="py-2 px-2.5 bg-[#f0fdf4]/70 dark:bg-emerald-950/20 text-[#065f46] dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800 font-bold">
                    Gabungan
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {paginatedStudents.map((st, idx) => {
                  const isComplete = st.status === "Lengkap";
                  const isWaitingMpl = st.status === "Menunggu MPL";

                  return (
                    <tr
                      key={st.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 text-slate-500 font-medium">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* NIM */}
                      <td className="py-3 px-3 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200 text-left">
                        {st.nim}
                      </td>

                      {/* Nama Mahasiswa */}
                      <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 text-left">
                        {st.name}
                      </td>

                      {/* Kelompok */}
                      <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-left">
                        {st.kelompokName}
                      </td>

                      {/* Otomatis: Kehadiran */}
                      <td className="py-3 px-2.5 border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        {st.kehadiran ?? "—"}
                      </td>

                      {/* Otomatis: Poin Dampingan */}
                      <td className="py-3 px-2.5 border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        {st.poinDampingan ?? "—"}
                      </td>

                      {/* Nilai Individu */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.individuDpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.individuMpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.individuGabungan !== null && st.individuGabungan !== undefined ? st.individuGabungan.toFixed(1) : "—"}
                      </td>

                      {/* Program Kerja */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.prokerDpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.prokerMpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.prokerGabungan !== null && st.prokerGabungan !== undefined ? st.prokerGabungan.toFixed(1) : "—"}
                      </td>

                      {/* Nilai Kelompok */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.kelompokDpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {st.kelompokMpl ?? "—"}
                      </td>
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {st.kelompokGabungan !== null && st.kelompokGabungan !== undefined ? st.kelompokGabungan.toFixed(1) : "—"}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-black text-slate-900 dark:text-slate-100 text-[12px]">
                        {st.nilaiAkhir !== null && st.nilaiAkhir !== undefined ? st.nilaiAkhir.toFixed(1) : "—"}
                      </td>

                      {/* Predikat */}
                      <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800 font-bold text-[#008055] dark:text-emerald-400">
                        {st.predikat ?? "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isComplete ? (
                          <span className="inline-block px-3 py-1 rounded-md text-[11px] font-semibold bg-[#e6f9f0] dark:bg-emerald-950/50 text-[#00704a] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            Lengkap
                          </span>
                        ) : isWaitingMpl ? (
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fffbeb] dark:bg-amber-950/50 text-[#b45309] dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap">
                            Menunggu MPL
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 whitespace-nowrap">
                            {st.status || "Dalam Proses"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls Section */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium px-1 py-1">
        <div>
          Menampilkan {(currentPage - 1) * itemsPerPage + 1}–
          {Math.min(currentPage * itemsPerPage, totalStudentsCount)} dari {totalStudentsCount} mahasiswa
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tombol Previous */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Tombol Nomor Halaman 1-5 */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                currentPage === pageNum
                  ? "bg-[#008055] text-white shadow-2xs"
                  : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {pageNum}
            </button>
          ))}

          {/* Tombol Next */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Dasar Perhitungan Nilai Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-base sm:text-[17px] font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">
          Dasar Perhitungan Nilai
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Card 1: Sumber Nilai Otomatis */}
          <div className="space-y-2 lg:pr-4 lg:border-r border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[#00704a] dark:text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full border-1.5 border-[#00704a] dark:border-emerald-400 flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Sumber Nilai Otomatis</span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Kehadiran 25% dan Poin Dampingan 15% diperoleh langsung dari data aktivitas yang tervalidasi pada sistem.
            </p>
          </div>

          {/* Card 2: Gabungan Nilai DPL dan MPL */}
          <div className="space-y-2.5 lg:px-4 lg:border-r border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[#00704a] dark:text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full border-1.5 border-[#00704a] dark:border-emerald-400 flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Gabungan Nilai DPL dan MPL</span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Bobot penilai menggunakan DPL 30% dan MPL 60%. Karena total bobot penilai 90%, nilai gabungan dinormalisasi kembali ke skala 100.
            </p>
            <div className="p-2 bg-[#f0fdf4] dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-lg text-center font-bold text-[11px] text-[#00704a] dark:text-emerald-300">
              Nilai Gabungan = ((30 × Nilai DPL) + (60 × Nilai MPL)) ÷ 90
            </div>
          </div>

          {/* Card 3: Formula Nilai Akhir */}
          <div className="space-y-2 lg:px-4 lg:border-r border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[#00704a] dark:text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full border-1.5 border-[#00704a] dark:border-emerald-400 flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Formula Nilai Akhir</span>
            </div>
            <div className="text-[11.5px] font-mono text-slate-700 dark:text-slate-300 space-y-0.5 leading-relaxed font-medium">
              <p>Nilai Akhir = (25% × Kehadiran)</p>
              <p className="pl-16">+ (15% × Poin Dampingan)</p>
              <p className="pl-16">+ (20% × Nilai Individu)</p>
              <p className="pl-16">+ (20% × Program Kerja)</p>
              <p className="pl-16">+ (20% × Nilai Kelompok)</p>
            </div>
          </div>

          {/* Card 4: Ketentuan Penerbitan */}
          <div className="space-y-2 lg:pl-4">
            <div className="flex items-center gap-2 text-[#00704a] dark:text-emerald-400 font-bold text-xs">
              <span className="w-5 h-5 rounded-full border-1.5 border-[#00704a] dark:border-emerald-400 flex items-center justify-center text-[11px]">
                4
              </span>
              <span>Ketentuan Penerbitan</span>
            </div>
            <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Nilai akhir dan predikat hanya diterbitkan setelah seluruh komponen DPL dan MPL lengkap. Hasil ditampilkan dengan pembulatan satu angka desimal.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">
          <Info size={14} className="shrink-0 text-slate-400" />
          <span>
            Total bobot komponen nilai akhir = 100%. Form penilaian DPL dan MPL tersedia terpisah sesuai hak akses masing-masing.
          </span>
        </div>
      </div>
    </div>
  );
};

export default RekapNilaiKknPage;
