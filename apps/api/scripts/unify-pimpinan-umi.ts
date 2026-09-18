/**
 * Project: BERSEKA
 * Script: Unifikasi Akun Prof. Umi Narimawati (Pimpinan Eksekutif & DPL Kelompok 1 Dago)
 * 
 * Menggabungkan akun Pimpinan dan DPL Prof. Umi ke satu akun utama (No. HP DPL: +6281213143636)
 * dengan peran utama PEMIMPIN dan peran sekunder DPL di pengguna_peran (UserRole).
 */

import { PrismaClient } from "@prisma/client";
import { assertNotProduction } from "../src/utils/vpsSafetyGuard.js";

const prisma = new PrismaClient();

async function main() {
  assertNotProduction("unify-pimpinan-umi");

  console.log("=== UNIFIKASI AKUN PROF. UMI NARIMAWATI (PIMPINAN & DPL) ===");

  const dplRole = await prisma.role.findFirst({ where: { name: "DPL" } });
  const pimpinanRole = await prisma.role.findFirst({ where: { name: { in: ["PEMIMPIN", "PIMPINAN"] } } });

  if (!dplRole || !pimpinanRole) {
    throw new Error("Role DPL atau PEMIMPIN tidak ditemukan di database");
  }

  // 1. Temukan akun utama (nomor DPL: +6281213143636)
  const targetUser = await prisma.user.findFirst({
    where: { phone: { in: ["+6281213143636", "081213143636"] } },
    include: { dplKelompok: true }
  });

  if (!targetUser) {
    throw new Error("Akun target Prof. Umi dengan nomor +6281213143636 tidak ditemukan!");
  }

  console.log(`Ditemukan akun target: ${targetUser.id} (${targetUser.name})`);

  // 2. Update akun utama menjadi PEMIMPIN (Pimpinan Eksekutif) dengan jabatan Wakil Rektor 1
  await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      roleId: pimpinanRole.id,
      name: "Prof. Dr. Hj. Umi Narimawati, Dra., S.E., M.Si., M.Pd.",
      jabatan: "Wakil Rektor 1",
      institusi: "Universitas Komputer Indonesia",
      nip: "4127.34.02.015",
      address: "Kel. Cipaganti"
    }
  });

  console.log("Akun utama berhasil diset role primary ke PEMIMPIN (Pimpinan Eksekutif)");

  // 3. Tambahkan peran sekunder DPL di pengguna_peran (UserRole)
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: targetUser.id,
        roleId: dplRole.id
      }
    },
    create: {
      userId: targetUser.id,
      roleId: dplRole.id
    },
    update: {}
  });

  console.log("Peran sekunder DPL berhasil ditautkan di tabel pengguna_peran (UserRole)");

  // 4. Pastikan Kelompok 1 Dago terikat ke targetUser.id
  const kelompok = await prisma.kelompokKkn.findFirst({
    where: { name: { contains: "1 Dago", mode: "insensitive" } }
  });

  if (kelompok) {
    await prisma.kelompokKkn.update({
      where: { id: kelompok.id },
      data: { dplId: targetUser.id }
    });
    console.log(`Kelompok bimbingan "${kelompok.name}" terikat ke user ID ${targetUser.id}`);
  }

  // 5. Nonaktifkan akun duplikat pimpinan lama (+6281222218910) jika masih ada
  const duplicatePimpinan = await prisma.user.findFirst({
    where: {
      phone: { in: ["+6281222218910", "081222218910"] },
      id: { not: targetUser.id }
    }
  });

  if (duplicatePimpinan) {
    await prisma.user.update({
      where: { id: duplicatePimpinan.id },
      data: {
        status: "INACTIVE",
        phone: `${duplicatePimpinan.phone}_merged_inactive`
      }
    });
    console.log(`Akun duplikat ${duplicatePimpinan.id} telah dinonaktifkan`);
  }

  console.log("\n=== HASIL AKHIR AKUN PROF. UMI ===");
  const finalUser = await prisma.user.findUnique({
    where: { id: targetUser.id },
    include: {
      role: true,
      userRoles: { include: { role: true } },
      dplKelompok: true
    }
  });

  console.log({
    id: finalUser?.id,
    name: finalUser?.name,
    phone: finalUser?.phone,
    primaryRole: finalUser?.role.name,
    secondaryRoles: finalUser?.userRoles.map((ur) => ur.role.name),
    kelompokBimbingan: finalUser?.dplKelompok.map((k) => k.name)
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
