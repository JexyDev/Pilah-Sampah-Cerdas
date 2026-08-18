import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { userRepository } from "../repositories/userRepository.js";
import { hashPassword } from "../utils/hashUtils.js";
import { formatPhoneNumber } from "../utils/phoneUtils.js";
import { getRandomDefaultAvatar } from "../utils/avatarUtils.js";


function formatTitleCaseName(name?: string): string {
  if (!name) return "";
  const degrees: Record<string, string> = {
    "s.kom.": "S.Kom.",
    "s.kom": "S.Kom.",
    "m.kom.": "M.Kom.",
    "m.kom": "M.Kom.",
    "m.eng.": "M.Eng.",
    "m.eng": "M.Eng.",
    "s.e.": "S.E.",
    "s.e": "S.E.",
    "m.si.": "M.Si.",
    "m.si": "M.Si.",
    "s.t.": "S.T.",
    "s.t": "S.T.",
    "m.t.": "M.T.",
    "m.t": "M.T.",
    "s.ds.": "S.Ds.",
    "s.ds": "S.Ds.",
    "m.ds.": "M.Ds.",
    "m.ds": "M.Ds.",
    "s.h.": "S.H.",
    "s.h": "S.H.",
    "m.h.": "M.H.",
    "m.h": "M.H.",
    "s.si.": "S.Si.",
    "s.si": "S.Si.",
    "s.pd.": "S.Pd.",
    "s.pd": "S.Pd.",
    "m.pd.": "M.Pd.",
    "m.pd": "M.Pd.",
    "s.ip.": "S.IP.",
    "s.ip": "S.IP.",
    "m.i.pol.": "M.I.Pol.",
    "m.i.pol": "M.I.Pol.",
    "m.i.kom.": "M.I.Kom.",
    "m.i.kom": "M.I.Kom.",
    "s.sos.": "S.Sos.",
    "s.sos": "S.Sos.",
    "s.stp.": "S.STP.",
    "s.stp": "S.STP.",
    "m.ap.": "M.AP.",
    "m.ap": "M.AP.",
    "a.ks.": "A.KS.",
    "a.ks": "A.KS.",
    "ph.d.": "Ph.D.",
    "ph.d": "Ph.D.",
    cima: "CIMA",
    cdmp: "CDMP",
    csba: "CSBA",
    "dr.": "Dr.",
    dr: "Dr.",
    "dra.": "Dra.",
    dra: "Dra.",
    "prof.": "Prof.",
    prof: "Prof.",
    "assoc.": "Assoc.",
    assoc: "Assoc.",
    "h.": "H.",
    "hj.": "Hj.",
    "ak.": "Ak.",
    "ca.": "CA.",
    "s.s.": "S.S.",
    "m.hum": "M.Hum.",
    "m.hum.": "M.Hum.",
  };

  return name
    .split(" ")
    .map((word) => {
      if (!word) return "";
      const wLower = word.toLowerCase();
      if (degrees[wLower]) return degrees[wLower];
      return word
        .split(/([\s\-'\.])/)
        .map((p) =>
          [" ", "-", "'", "."].includes(p)
            ? p
            : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
        )
        .join("");
    })
    .join(" ");
}

export class UserService {
  async getAllUsers(
    filters: {
      search?: string;
      roleName?: string;
      status?: string;
      rw?: string;
      rt?: string;
    },
    currentUser: { userId: string; role: string }
  ) {
    const { search, roleName, status, rw, rt } = filters;
    const { getScopingFilters } = await import("../utils/rbacScoping.js");
    const scoping = await getScopingFilters(currentUser);
    const whereClause: any = { ...scoping.userFilter };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleName) {
      if (roleName === "PENGURUS_RW_RT") {
        // Tab "Pengurus RW/RT" → tampilkan RW dan RT
        whereClause.role = { name: { in: ["RW", "RT"] } };
      } else if (roleName === "EKSEKUTIF") {
        // Tab umbrella eksekutif → tampilkan semua admin
        whereClause.role = { name: { in: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH"] } };
      } else {
        // Tab spesifik (CAMAT, LURAH, ADMIN_DLH, SUPER_USER, dll) → query persis
        whereClause.role = { name: roleName };
      }
    }

    if (status && !["Sudah Teraktivasi", "Belum Teraktivasi", "Semua"].includes(status)) {
      whereClause.status = status;
    }

    if (rw || rt) {
      const conditions: any[] = [];
      if (rw) {
        conditions.push({ name: { contains: `RW ${rw}`, mode: "insensitive" } });
      }
      if (rt) {
        conditions.push({ name: { contains: `RT ${rt}`, mode: "insensitive" } });
      }
      whereClause.OR = [
        { rw: { AND: conditions } },
        { households: { some: { rw: { AND: conditions } } } },
      ];
    }

    const users = await userRepository.findMany(whereClause);

    let petugasResiduRaw = users.filter((u: any) => u.role?.name === "PETUGAS_RESIDU");
    if (petugasResiduRaw.length === 0) {
      petugasResiduRaw = await userRepository.findMany({ role: { name: "PETUGAS_RESIDU" } });
    }

    const petugasResiduUsers = petugasResiduRaw.map((p: any) => ({
      id: p.id,
      name: formatTitleCaseName(p.name),
      fotoProfil: p.fotoProfil || null,
      phone: p.phone,
      address: p.address || "",
      kelurahan: p.rw?.kelurahan?.name || "",
      rw: p.rw?.name || "",
    }));

    const nipKelompokMap: Record<string, any[]> = {};
    users.forEach((u: any) => {
      if (u.nip && Array.isArray(u.dplKelompok) && u.dplKelompok.length > 0) {
        if (!nipKelompokMap[u.nip]) nipKelompokMap[u.nip] = [];
        u.dplKelompok.forEach((k: any) => {
          if (!nipKelompokMap[u.nip].some((item: any) => item.id === k.id)) {
            nipKelompokMap[u.nip].push(k);
          }
        });
      }
    });

    let mapped = users.map((u: any) => {
      let wilayah = "-";
      if (u.rw) {
        const rtText = u.rt?.name ? `${u.rt.name}, ` : "";
        wilayah = `${rtText}${u.rw.name} (Kel. ${u.rw.kelurahan?.name || "-"})`;
      } else if (u.households && u.households.length > 0 && u.households[0].rw) {
        const hRw = u.households[0].rw;
        wilayah = `${hRw.name} (Kel. ${hRw.kelurahan?.name || "-"})`;
      }

      let totalSetoranKg = 0;
      if (u.setoranOtomatis) {
        u.setoranOtomatis.forEach((s: any) => {
          totalSetoranKg += Number(s.berat);
        });
      }

      const totalPoin = Array.isArray(u.pointHistory)
        ? u.pointHistory.reduce((sum: number, p: any) => sum + (p.points || 0), 0)
        : 0;

      let pendampingKkn = null;
      if (u.bins && u.bins.length > 0) {
        const boundBin = u.bins.find((b: any) => b.registeredByStudent);
        if (boundBin && boundBin.registeredByStudent) {
          pendampingKkn = {
            id: boundBin.registeredByStudent.id,
            name: boundBin.registeredByStudent.name,
            phone: boundBin.registeredByStudent.phone,
          };
        }
      }

      const rwObj =
        u.rw || u.rt?.rw || u.households?.[0]?.rw || u.studentProfile?.assignedRw || u.rwOwned;
      let kelurahanName = rwObj?.kelurahan?.name || "-";
      let kecamatanName = rwObj?.kelurahan?.kecamatan?.name || "-";
      let kabupatenName = u.kabupaten || (rwObj?.kelurahan?.kecamatan as any)?.kabupaten?.name || "Kota Bandung";
      let provinsiName = u.provinsi || ((rwObj?.kelurahan?.kecamatan as any)?.kabupaten as any)?.provinsi?.name || "Jawa Barat";

      if (u.address) {
        const provMatch = u.address.match(/(?:Prov\.?|Provinsi)\s*([^,]+)/i);
        if (provMatch && provMatch[1] && !u.provinsi) {
          provinsiName = provMatch[1].trim();
        }
        const kabMatch = u.address.match(/(?:Kota|Kab\.?|Kabupaten)\s*([^,]+)/i);
        if (kabMatch && kabMatch[1] && !u.kabupaten) {
          kabupatenName = kabMatch[1].trim();
        }
        const kecMatch = u.address.match(/(?:Kecamatan|Kec\.?)\s*([^,]+)/i);
        if (kecMatch && kecMatch[1] && kecamatanName === "-") {
          const rawKec = kecMatch[1].trim().replace(/^amatan\s*/i, "").replace(/^Kecamatan\s*/i, "").trim();
          if (rawKec && rawKec !== "-") {
            kecamatanName = `Kecamatan ${rawKec}`;
          }
        }
      }
      let rwName = rwObj?.name || "-";
      let rtName = u.rt?.name || "-";

      if (u.role?.name === "CAMAT" && kecamatanName === "-") {
        if (kabupatenName.toLowerCase().includes("bandung")) {
          kecamatanName = "Kecamatan Coblong";
        }
      }

      if (kelurahanName === "-" && u.address) {
        const knownKels = [
          "Cipaganti",
          "Dago",
          "Lebak Gede",
          "Lebak Siliwangi",
          "Sadang Serang",
          "Sekeloa",
        ];
        for (const k of knownKels) {
          if (u.address.toLowerCase().includes(k.toLowerCase())) {
            kelurahanName = k;
            if (kecamatanName === "-") kecamatanName = "Kecamatan Coblong";
            break;
          }
        }
        if (kelurahanName === "-") {
          const kelMatch = u.address.match(
            /(?:Kel\.?|Kelurahan)\s*([A-Za-z\s]+?)(?:,|$|\s+Kec|\s+RW)/i
          );
          if (kelMatch && kelMatch[1]) {
            kelurahanName = kelMatch[1].trim();
          }
        }
      }

      // Enforce strict relational consistency: Coblong & its 6 kelurahans ONLY exist in Kota Bandung!
      if (!kabupatenName.toLowerCase().includes("bandung")) {
        if (kecamatanName.toLowerCase().includes("coblong")) {
          kecamatanName = "-";
        }
        const coblongKels = ["cipaganti", "dago", "lebak gede", "lebak siliwangi", "sadang serang", "sekeloa"];
        if (coblongKels.some((k) => kelurahanName.toLowerCase().includes(k))) {
          kelurahanName = "-";
        }
      }
      if (rwName === "-" && u.address) {
        const rwMatch = u.address.match(/RW\s*(\d+)/i);
        if (rwMatch) {
          rwName = `RW ${rwMatch[1].padStart(2, "0")}`;
        }
      }

      if (rwName === "-" && u.studentProfile?.kelompok) {
        const kel = u.studentProfile.kelompok;
        const cakupan = Array.isArray(kel.cakupanRw)
          ? kel.cakupanRw.join(", ")
          : typeof kel.cakupanRw === "string"
            ? kel.cakupanRw
            : "";
        if (cakupan) {
          rwName = cakupan;
        }
        if (kelurahanName === "-" && kel.kelurahan) {
          kelurahanName = kel.kelurahan;
          kecamatanName = "Kec. Coblong";
        }
      }

      const activeBinsCount =
        (u.bins || []).filter((b: any) => b.status === "ACTIVE_BOUND" || b.status === "ACTIVE")
          .length +
        (u.binOwnerships || []).filter(
          (bo: any) => bo.status === "ACTIVE_BOUND" || bo.status === "ACTIVE"
        ).length;
      const binStatus = activeBinsCount > 0 ? "Sudah Teraktivasi" : "Belum Teraktivasi";

      let userWilayah = "";
      if (u.role?.name === "ADMIN_DLH") {
        userWilayah = kabupatenName;
      } else if (u.role?.name === "CAMAT") {
        userWilayah = kecamatanName !== "-" ? kecamatanName : kabupatenName;
      } else if (u.role?.name === "MAHASISWA_KKN") {
        const kel = u.studentProfile?.kelompok;
        if (!u.studentProfile?.kelompokId || !kel) {
          userWilayah = "-";
        } else {
          let rwStr = "";
          if (kel.cakupanRw) {
            let rws: any[] = [];
            if (Array.isArray(kel.cakupanRw)) {
              rws = kel.cakupanRw;
            } else if (typeof kel.cakupanRw === "string") {
              try {
                rws = JSON.parse(kel.cakupanRw);
              } catch {
                rws = [kel.cakupanRw];
              }
            } else if (typeof kel.cakupanRw === "number") {
              rws = [kel.cakupanRw];
            }
            if (rws.length > 0) {
              rwStr = `RW ${rws
                .map((r: any) => String(r).replace(/\D/g, "").padStart(2, "0"))
                .filter(Boolean)
                .join(", RW ")}`;
            }
          }
          const kelStr = kel.kelurahan ? `Kel. ${kel.kelurahan}` : "";
          userWilayah = [rwStr, kelStr].filter(Boolean).join(" ") || "-";
        }
      } else {
        const parts = [rwName !== "-" ? rwName : "", kelurahanName !== "-" ? kelurahanName : ""].filter(Boolean);
        userWilayah = parts.length > 0 ? parts.join(", ") : u.address || "-";
      }

      let assignedPetugasObj: any = null;
      if (u.role?.name === "RW") {
        // Use the actual DB relation from Rw.petugasResidu
        if (u.rw?.petugasResidu) {
          assignedPetugasObj = {
            id: u.rw.petugasResidu.id,
            name: formatTitleCaseName(u.rw.petugasResidu.name),
            fotoProfil: u.rw.petugasResidu.fotoProfil || null,
            phone: u.rw.petugasResidu.phone,
          };
        }
      }

      let formattedAddress = (u.address && u.address !== "-") ? u.address : "";
      if (!formattedAddress) {
        if (["WARGA", "RW", "PETUGAS_RESIDU"].includes(u.role?.name)) {
          const locationParts = [
            rwName !== "-" ? rwName : "",
            kelurahanName !== "-" ? kelurahanName : "",
            kecamatanName !== "-" ? kecamatanName : "",
            kabupatenName !== "-" ? kabupatenName : ""
          ].filter(Boolean);
          formattedAddress = locationParts.length > 0 ? `Sekretariat ${locationParts.join(", ")}` : (u.address || "-");
        } else {
          formattedAddress = u.address || "-";
        }
      }

      return {
        id: u.id,
        name: formatTitleCaseName(u.name),
        email: u.phone,
        phone: u.phone,
        nip: u.nip || null,
        institusi: u.institusi || null,
        jabatan: u.jabatan || null,
        programStudi: u.programStudi || null,
        jenjangPendidikan: u.jenjangPendidikan || u.studentProfile?.jenjangPendidikan || null,
        jumlahAnggotaKeluarga: u.jumlahAnggotaKeluarga || null,
        fotoProfil: u.fotoProfil || null,
        nim: u.studentProfile?.nim || null,
        role: u.role.name,
        status: u.status,
        binStatus,
        activeBinsCount,
        provinsi: u.provinsi || provinsiName || "Jawa Barat",
        kabupaten: u.kabupaten || kabupatenName || "Kota Bandung",
        kecamatan: kecamatanName,
        kelurahan: kelurahanName,
        rw: rwName,
        address: formattedAddress,
        wilayah: userWilayah,
        setoran: parseFloat(totalSetoranKg.toFixed(1)),
        totalPoin,
        petugasResidu: assignedPetugasObj
          ? {
              id: assignedPetugasObj.id,
              name: assignedPetugasObj.name,
              fotoProfil: assignedPetugasObj.fotoProfil,
              phone: assignedPetugasObj.phone,
            }
          : u.petugasResidu || null,
        dplKelompok:
          u.dplKelompok && u.dplKelompok.length > 0
            ? u.dplKelompok
            : u.nip && nipKelompokMap[u.nip]
              ? nipKelompokMap[u.nip]
              : [],
        studentProfile: u.studentProfile
          ? {
              nim: u.studentProfile.nim,
              jenjangPendidikan: u.studentProfile.jenjangPendidikan || null,
              jurusan: u.studentProfile.jurusan,
              fakultas: u.studentProfile.fakultas,
              noWa: u.studentProfile.noWa,
              startDate: u.studentProfile.startDate,
              endDate: u.studentProfile.endDate,
              assignedRwId: u.studentProfile.assignedRwId,
              assignedPolygonName: u.studentProfile.assignedPolygon?.name,
              whitelistStatus: u.studentProfile.whitelistStatus,
              kelompok: u.studentProfile.kelompok
                ? {
                    id: u.studentProfile.kelompok.id,
                    name: u.studentProfile.kelompok.name,
                    kelurahan: u.studentProfile.kelompok.kelurahan,
                    cakupanRw: u.studentProfile.kelompok.cakupanRw,
                    dplId: u.studentProfile.kelompok.dplId,
                    dplName:
                      u.studentProfile.kelompok.dpl?.name ||
                      u.studentProfile.kelompok.dplNamaMentah ||
                      null,
                    dplFotoProfil: u.studentProfile.kelompok.dpl?.fotoProfil || null,
                    dplNip: u.studentProfile.kelompok.dpl?.nip || null,
                    dplProdi: u.studentProfile.kelompok.dpl?.programStudi || null,
                    dplPhone: u.studentProfile.kelompok.dpl?.phone || null,
                    wilayahPenugasan: u.studentProfile.kelompok.cakupanRw
                      ? `${u.studentProfile.kelompok.cakupanRw}${u.studentProfile.kelompok.kelurahan ? ` (${u.studentProfile.kelompok.kelurahan})` : ""}`
                      : u.studentProfile.kelompok.kelurahan || null,
                  }
                : null,
            }
          : null,
      };
    });

    if (status === "Sudah Teraktivasi") {
      mapped = mapped.filter((u: any) => u.binStatus === "Sudah Teraktivasi");
    } else if (status === "Belum Teraktivasi") {
      mapped = mapped.filter((u: any) => u.binStatus === "Belum Teraktivasi");
    }

    return mapped;
  }

  async createUser(data: any, currentUser?: { userId: string; role: string }) {
    const {
      name,
      password,
      phone,
      roleName,
      status,
      rwId,
      rtRwId,
      address,
      nim,
      studentProfile,
      nip,
      institusi,
      programStudi,
      jenjangPendidikan,
      jumlahAnggotaKeluarga,
    } = data;
    const effectiveRwId = rwId !== undefined && rwId !== null ? rwId : rtRwId;

    if (!phone) {
      throw new Error("PHONE_REQUIRED");
    }
    const formattedPhone = formatPhoneNumber(phone);

    const existingPhone = await prisma.user.findUnique({ where: { phone: formattedPhone } });
    if (existingPhone) {
      throw new Error("PHONE_CONFLICT");
    }

    if (
      ["ADMIN_DLH", "CAMAT", "LURAH"].includes(roleName) &&
      !["SUPER_USER", "DEVELOPER"].includes(currentUser?.role || "")
    ) {
      throw new Error("FORBIDDEN_ROLE_CREATION");
    }

    if (roleName === "DEVELOPER" && currentUser?.role !== "DEVELOPER") {
      throw new Error("FORBIDDEN_DEVELOPER_MUTATION");
    }

    if (currentUser?.role === "PANITIA_TASKFORCE" && !["MAHASISWA_KKN", "DPL"].includes(roleName)) {
      throw new Error("FORBIDDEN_ROLE_CREATION");
    }

    const role = await userRepository.findRoleByName(roleName);
    if (!role) {
      throw new Error("ROLE_NOT_FOUND");
    }

    if (roleName === "PETUGAS_RESIDU" && rwId) {
      const area = await prisma.rw.findUnique({ where: { id: parseInt(rwId) } });
      if (area) {
        const rwMatch = area.name.match(/RW\s+(\d+)/i);
        if (rwMatch) {
          const rwNumber = rwMatch[1];
          const existingPetugas = await prisma.user.findFirst({
            where: {
              role: { name: "PETUGAS_RESIDU" },
              rw: { name: { contains: `RW ${rwNumber}` } },
            },
          });
          if (existingPetugas) {
            throw new Error("RW_ALREADY_HAS_PETUGAS_RESIDU");
          }
        }
      }
    }

    let finalKabupaten = data.kabupaten || null;
    let finalProvinsi = data.provinsi || null;
    if (finalKabupaten) {
      const kabMatch = await prisma.kabupaten.findFirst({
        where: { name: { equals: finalKabupaten.trim(), mode: "insensitive" } },
        include: { provinsi: true },
      });
      if (kabMatch && kabMatch.provinsi) {
        finalProvinsi = kabMatch.provinsi.name;
      }
    } else if (finalProvinsi) {
      const provMatch = await prisma.provinsi.findFirst({
        where: { name: { equals: finalProvinsi.trim(), mode: "insensitive" } },
        include: { kabupatens: true },
      });
      if (provMatch && provMatch.kabupatens.length > 0) {
        finalKabupaten = provMatch.kabupatens[0].name;
      }
    }

    if (!password) {
      throw new Error("PASSWORD_REQUIRED");
    }
    const { isPasswordValid } = await import("../utils/passwordValidator.js");
    const passCheck = isPasswordValid(password);
    if (!passCheck.ok) {
      throw new Error("INVALID_PASSWORD: " + passCheck.reason);
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          password: passwordHash,
          phone: formattedPhone,
          roleId: role.id,
          status: status || "Aktif",
          rwId: effectiveRwId ? parseInt(effectiveRwId) : null,
          address: address || null,
          fotoProfil: data.fotoProfil || getRandomDefaultAvatar(name),
          nip: nip || null,
          institusi: institusi || null,
          jabatan: data.jabatan || null,
          programStudi: programStudi || null,
          jenjangPendidikan: jenjangPendidikan || null,
          provinsi: finalProvinsi,
          kabupaten: finalKabupaten,
          jumlahAnggotaKeluarga:
            jumlahAnggotaKeluarga !== undefined && jumlahAnggotaKeluarga !== null
              ? Number(jumlahAnggotaKeluarga)
              : null,
        },
        include: { role: { select: { name: true } } },
      });

      if (roleName === "MAHASISWA_KKN") {
        const rawNim = studentProfile?.nim || nim;
        const targetNim = rawNim && String(rawNim).trim() !== "" && rawNim !== "-" ? String(rawNim).trim() : null;

        if (targetNim) {
          const existingNim = await tx.studentKkn.findUnique({ where: { nim: targetNim } });
          if (existingNim) {
            throw new Error("NIM_CONFLICT");
          }
        }

        let targetKelompokId = studentProfile?.kelompokId || data.kelompokId;
        const targetDplId = data.dplId || studentProfile?.dplId;

        if (targetDplId) {
          const existingKelompok = await tx.kelompokKkn.findFirst({
            where: { dplId: targetDplId },
          });
          if (existingKelompok) {
            targetKelompokId = existingKelompok.id;
          } else {
            const dplUser = await tx.user.findUnique({ where: { id: targetDplId } });
            const kelName = dplUser
              ? `Kelompok ${dplUser.name}`
              : `Kelompok ${targetDplId.slice(0, 5)}`;
            const newKel = await tx.kelompokKkn.create({
              data: {
                name: kelName,
                dplId: targetDplId,
                kelurahan: data.kelurahan || "Cipaganti",
              },
            });
            targetKelompokId = newKel.id;
          }
        }

        await tx.studentKkn.create({
          data: {
            userId: u.id,
            nim: targetNim,
            jurusan: studentProfile?.jurusan || programStudi || "Teknik Informatika",
            fakultas: studentProfile?.fakultas || institusi || "UNIKOM",
            jenjangPendidikan: studentProfile?.jenjangPendidikan || jenjangPendidikan || "S1",
            noWa: studentProfile?.noWa || u.phone || "",
            startDate: studentProfile?.startDate
              ? new Date(studentProfile.startDate)
              : new Date(),
            endDate: studentProfile?.endDate
              ? new Date(studentProfile.endDate)
              : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            assignedRwId: studentProfile?.assignedRwId
              ? parseInt(studentProfile.assignedRwId)
              : u.rwId,
            kelompokId: targetKelompokId || null,
            whitelistStatus: "APPROVED",
          },
        });
      }

      if (roleName === "DPL") {
        const targetKelompokIds = data.dplKelompokIds || (data.kelompokId ? [data.kelompokId] : []);
        if (Array.isArray(targetKelompokIds) && targetKelompokIds.length > 0) {
          await tx.kelompokKkn.updateMany({
            where: { id: { in: targetKelompokIds } },
            data: { dplId: u.id },
          });
        }
      }

      // Assign Petugas Residu to the RW area when creating an RW user
      if (roleName === "RW" && data.petugasResiduId) {
        const rwAreaId = u.rwId;
        if (rwAreaId) {
          // Clear previous assignment for this petugas on other RWs
          await tx.rw.updateMany({
            where: { petugasResiduId: data.petugasResiduId },
            data: { petugasResiduId: null },
          });
          await tx.rw.update({
            where: { id: rwAreaId },
            data: { petugasResiduId: data.petugasResiduId },
          });
        }
      }

      // ── Welcome Bonus Poin ──────────────────────────────────────────────────
      // MAHASISWA_KKN mendapat +20 poin saat akun dibuat (BONUS_REGISTRASI)
      if (roleName === "MAHASISWA_KKN") {
        await tx.pointHistory.create({
          data: {
            userId: u.id,
            points: 20,
            description: "Bonus registrasi akun Mahasiswa KKN",
            kategori: "BONUS_REGISTRASI",
            redeemable: false,
          },
        });
      }

      return u;
    });


    return {
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      role: (newUser as any).role.name,
    };
  }

  async updateUser(id: string, data: any, currentUser?: { userId: string; role: string }) {
    const {
      name,
      phone,
      email,
      password,
      roleName,
      status,
      rwId: inputRwId,
      rtRwId,
      address,
      nim,
      studentProfile,
      nip,
      institusi,
      programStudi,
      jenjangPendidikan,
      jumlahAnggotaKeluarga,
      fotoProfil,
      wilayah,
      kecamatan,
      petugasResiduId,
    } = data;
    const targetRwId = inputRwId !== undefined && inputRwId !== null ? inputRwId : rtRwId;

    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (currentUser?.userId === id && status && ["Nonaktif", "INACTIVE", "NONAKTIF"].includes(status)) {
      throw new Error("CANNOT_DEACTIVATE_SELF");
    }

    // Check if target user has a restricted role or if trying to change to a restricted role
    const isRestrictedRole =
      ["ADMIN_DLH", "CAMAT", "LURAH"].includes(user.role.name) ||
      (roleName && ["ADMIN_DLH", "CAMAT", "LURAH"].includes(roleName));
    if (isRestrictedRole && !["SUPER_USER", "DEVELOPER"].includes(currentUser?.role || "")) {
      throw new Error("FORBIDDEN_ROLE_UPDATE");
    }

    if ((user.role.name === "DEVELOPER" || roleName === "DEVELOPER") && currentUser?.role !== "DEVELOPER") {
      throw new Error("FORBIDDEN_DEVELOPER_MUTATION");
    }

    if (currentUser?.role === "PANITIA_TASKFORCE" && !["MAHASISWA_KKN", "DPL"].includes(user.role.name)) {
      throw new Error("FORBIDDEN_ROLE_UPDATE");
    }

    let roleId = user.roleId;
    if (roleName) {
      const role = await userRepository.findRoleByName(roleName);
      if (!role) {
        throw new Error("ROLE_NOT_FOUND");
      }
      roleId = role.id;
    }

    const checkRoleName = roleName || user.role.name;
    const checkRtRwId = inputRwId !== undefined ? inputRwId : user.rwId;

    if (checkRoleName === "PETUGAS_RESIDU" && checkRtRwId) {
      const area = await prisma.rw.findUnique({ where: { id: parseInt(checkRtRwId) } });
      if (area) {
        const rwMatch = area.name.match(/RW\s+(\d+)/i);
        if (rwMatch) {
          const rwNumber = rwMatch[1];
          const existingPetugas = await prisma.user.findFirst({
            where: {
              id: { not: user.id },
              role: { name: "PETUGAS_RESIDU" },
              rw: { name: { contains: `RW ${rwNumber}` } },
            },
          });
          if (existingPetugas) {
            throw new Error("RW_ALREADY_HAS_PETUGAS_RESIDU");
          }
        }
      }
    }

    const updateData: any = { name };
    if (roleId && roleId !== user.roleId) {
      updateData.role = { connect: { id: roleId } };
    }
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      const existingUserWithPhone = await prisma.user.findFirst({
        where: {
          phone: formattedPhone,
          id: { not: id },
        },
      });
      if (existingUserWithPhone) {
        throw new Error("PHONE_CONFLICT");
      }
      updateData.phone = formattedPhone;
    }
    if (password) {
      const { isPasswordValid } = await import("../utils/passwordValidator.js");
      const passCheck = isPasswordValid(password);
      if (!passCheck.ok) {
        throw new Error("INVALID_PASSWORD: " + passCheck.reason);
      }
      updateData.password = await hashPassword(password);
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (targetRwId !== undefined) {
      if (targetRwId) {
        updateData.rw = { connect: { id: parseInt(targetRwId) } };
      } else {
        updateData.rw = { disconnect: true };
      }
    }
    if (address !== undefined) {
      updateData.address = address || null;
    } else if (wilayah !== undefined) {
      updateData.address = wilayah || null;
    } else if (kecamatan !== undefined) {
      updateData.address = kecamatan || null;
    }
    if (nip !== undefined) updateData.nip = nip || null;
    if (institusi !== undefined) updateData.institusi = institusi || null;
    if (data.jabatan !== undefined) updateData.jabatan = data.jabatan || null;
    if (programStudi !== undefined) updateData.programStudi = programStudi || null;
    if (jenjangPendidikan !== undefined) updateData.jenjangPendidikan = jenjangPendidikan || null;
    let updateKab = data.kabupaten !== undefined ? data.kabupaten : user.kabupaten;
    let updateProv = data.provinsi !== undefined ? data.provinsi : user.provinsi;

    if (updateKab) {
      const kabMatch = await prisma.kabupaten.findFirst({
        where: { name: { equals: String(updateKab).trim(), mode: "insensitive" } },
        include: { provinsi: true },
      });
      if (kabMatch && kabMatch.provinsi) {
        updateProv = kabMatch.provinsi.name;
      }
    } else if (updateProv) {
      const provMatch = await prisma.provinsi.findFirst({
        where: { name: { equals: String(updateProv).trim(), mode: "insensitive" } },
        include: { kabupatens: true },
      });
      if (provMatch && provMatch.kabupatens.length > 0) {
        updateKab = provMatch.kabupatens[0].name;
      }
    }

    if (data.provinsi !== undefined || data.kabupaten !== undefined) {
      updateData.provinsi = updateProv || null;
      updateData.kabupaten = updateKab || null;
    }
    if (jumlahAnggotaKeluarga !== undefined)
      updateData.jumlahAnggotaKeluarga =
        jumlahAnggotaKeluarga !== null ? Number(jumlahAnggotaKeluarga) : null;
    if (fotoProfil !== undefined) updateData.fotoProfil = fotoProfil || null;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
        include: { role: { select: { name: true } } },
      });

      const parsedRwId = targetRwId ? parseInt(targetRwId) : null;
      if (updateData.address !== undefined || targetRwId !== undefined) {
        const householdData: any = {};
        if (updateData.address !== undefined) householdData.address = updateData.address || "";
        if (parsedRwId !== null) householdData.rwId = parsedRwId;
        if (Object.keys(householdData).length > 0) {
          await tx.household.updateMany({
            where: { userId: id },
            data: householdData,
          });
        }
      }

      if (roleName === "MAHASISWA_KKN" || u.role.name === "MAHASISWA_KKN") {
        const rawNim = studentProfile?.nim !== undefined ? studentProfile.nim : nim;
        const targetNim =
          rawNim !== undefined
            ? rawNim && String(rawNim).trim() !== "" && rawNim !== "-"
              ? String(rawNim).trim()
              : null
            : undefined;

        if (targetNim) {
          const existingNim = await tx.studentKkn.findFirst({
            where: { nim: targetNim, userId: { not: id } },
          });
          if (existingNim) {
            throw new Error("NIM_CONFLICT");
          }
        }

        let targetKelompokId: string | null = null;
        if (data.kelompokId !== undefined) {
          targetKelompokId = data.kelompokId || null;
        } else if (Array.isArray(data.dplKelompokIds)) {
          targetKelompokId =
            data.dplKelompokIds.length > 0 && data.dplKelompokIds[0]
              ? data.dplKelompokIds[0]
              : null;
        } else if (studentProfile?.kelompokId !== undefined) {
          targetKelompokId = studentProfile.kelompokId || null;
        }

        const targetDplId = data.dplId !== undefined ? data.dplId || null : null;
        if (targetDplId) {
          const existingKelompok = await tx.kelompokKkn.findFirst({
            where: { dplId: targetDplId },
          });
          if (existingKelompok) {
            targetKelompokId = existingKelompok.id;
          } else if (targetKelompokId) {
            await tx.kelompokKkn.update({
              where: { id: targetKelompokId },
              data: { dplId: targetDplId },
            });
          } else {
            const dplUser = await tx.user.findUnique({ where: { id: targetDplId } });
            const kelName = dplUser
              ? `Kelompok ${dplUser.name}`
              : `Kelompok ${targetDplId.slice(0, 5)}`;
            const newKel = await tx.kelompokKkn.create({
              data: {
                name: kelName,
                dplId: targetDplId,
                kelurahan: data.kelurahan || "Cipaganti",
              },
            });
            targetKelompokId = newKel.id;
          }
        }

        if (!targetKelompokId) {
          await tx.user.update({
            where: { id },
            data: { address: null },
          });
        }

        await tx.studentKkn.upsert({
          where: { userId: id },
          create: {
            userId: id,
            nim: targetNim !== undefined ? targetNim : null,
            jurusan: studentProfile?.jurusan || programStudi || "Teknik Informatika",
            fakultas: studentProfile?.fakultas || institusi || "UNIKOM",
            jenjangPendidikan: studentProfile?.jenjangPendidikan || jenjangPendidikan || "S1",
            noWa: studentProfile?.noWa || u.phone || "",
            startDate: studentProfile?.startDate ? new Date(studentProfile.startDate) : new Date(),
            endDate: studentProfile?.endDate
              ? new Date(studentProfile.endDate)
              : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            assignedRwId: studentProfile?.assignedRwId
              ? parseInt(studentProfile.assignedRwId)
              : (parsedRwId || u.rwId),
            kelompokId: targetKelompokId,
            whitelistStatus: "APPROVED",
          },
          update: {
            ...(targetNim !== undefined && { nim: targetNim }),
            ...(studentProfile?.jurusan && { jurusan: studentProfile.jurusan }),
            ...(studentProfile?.fakultas && { fakultas: studentProfile.fakultas }),
            ...(studentProfile?.noWa && { noWa: studentProfile.noWa }),
            ...((studentProfile?.jenjangPendidikan || jenjangPendidikan) && {
              jenjangPendidikan: studentProfile?.jenjangPendidikan || jenjangPendidikan,
            }),
            kelompokId: targetKelompokId,
          },
        });
      }

      if ((u.role.name === "PETUGAS_RESIDU" || roleName === "PETUGAS_RESIDU") && status) {
        const pStatus = status === "Aktif" || status === "ACTIVE" ? "APPROVED" : "REJECTED";
        await tx.petugasResidu.updateMany({
          where: { userId: id },
          data: { whitelistStatus: pStatus },
        });
      }

      if (
        (checkRoleName === "DPL" || u.role.name === "DPL") &&
        (data.dplKelompokIds !== undefined ||
          data.kelompokId !== undefined ||
          data.selectedKelompokId !== undefined)
      ) {
        const targetKelompokIds =
          data.dplKelompokIds ||
          (data.kelompokId
            ? [data.kelompokId]
            : data.selectedKelompokId
              ? [data.selectedKelompokId]
              : []);
        await tx.kelompokKkn.updateMany({
          where: { dplId: u.id },
          data: { dplId: null },
        });
        if (Array.isArray(targetKelompokIds) && targetKelompokIds.length > 0) {
          await tx.kelompokKkn.updateMany({
            where: { id: { in: targetKelompokIds } },
            data: { dplId: u.id },
          });
        }
      }

      // Assign Petugas Residu to the RW area when editing an RW user
      if ((checkRoleName === "RW" || u.role.name === "RW") && petugasResiduId !== undefined) {
        const rwAreaId = parsedRwId || u.rwId;
        if (rwAreaId) {
          // Clear previous assignment for this petugas on other RWs
          if (petugasResiduId) {
            await tx.rw.updateMany({
              where: { petugasResiduId: petugasResiduId },
              data: { petugasResiduId: null },
            });
          }
          await tx.rw.update({
            where: { id: rwAreaId },
            data: { petugasResiduId: petugasResiduId || null },
          });
        }
      }

      return u;
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedUser.role.name,
    };
  }

  async deleteUser(id: string, currentUserId?: string, currentUserRole?: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (currentUserId === id) {
      throw new Error("DELETE_SELF");
    }

    if (user.role.name === "DEVELOPER" && currentUserRole !== "DEVELOPER") {
      throw new Error("FORBIDDEN_DEVELOPER_MUTATION");
    }

    if (currentUserRole === "PANITIA_TASKFORCE" && !["MAHASISWA_KKN", "DPL"].includes(user.role.name)) {
      throw new Error("FORBIDDEN_ROLE_DELETE");
    }

    await userRepository.delete(id);
  }

  async getOnboardingStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { households: true },
    });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const bins = await prisma.bin.findMany({
      where: {
        OR: [{ userId }, { binOwnerships: { some: { userId } } }],
        status: "ACTIVE_BOUND",
      },
      include: { category: true },
    });

    const hasOrganik = bins.some((b) => b.category?.name === "ORGANIC");
    const hasNonOrganik = bins.some((b) => b.category?.name === "NON_ORGANIC");
    const onboardingComplete = hasOrganik && hasNonOrganik;

    return {
      hasOrganik,
      hasNonOrganik,
      onboardingComplete,
    };
  }
}

export const userService = new UserService();
