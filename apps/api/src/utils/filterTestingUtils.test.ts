import { describe, it, expect } from "vitest";
import {
  isTestOrDummyString,
  isTestUser,
  isTestDpl,
  isTestKelompok,
  isTestStudent,
  isTestPosko,
  isTestProker,
  filterNonTestUsers,
  filterNonTestDpl,
  filterNonTestKelompok,
  filterNonTestStudents,
  filterNonTestPosko,
  filterNonTestProker,
} from "./filterTestingUtils.js";

describe("filterTestingUtils (Default Active Anti-Test Governance)", () => {
  describe("isTestOrDummyString", () => {
    it("should detect testing keywords accurately without requiring env var", () => {
      expect(isTestOrDummyString("DPL TEST")).toBe(true);
      expect(isTestOrDummyString("Kelompok Test")).toBe(true);
      expect(isTestOrDummyString("Akun Dummy")).toBe(true);
      expect(isTestOrDummyString("User Tester")).toBe(true);
      expect(isTestOrDummyString("sample user")).toBe(true);
      expect(isTestOrDummyString("percobaan 1")).toBe(true);
      expect(isTestOrDummyString("testing_account")).toBe(true);
    });

    it("should allow valid real names", () => {
      expect(isTestOrDummyString("Kelompok 1 Sadang Serang")).toBe(false);
      expect(isTestOrDummyString("Dr. Budi Santoso, M.T.")).toBe(false);
      expect(isTestOrDummyString("Rahmat Hidayat")).toBe(false);
      expect(isTestOrDummyString(null)).toBe(false);
      expect(isTestOrDummyString(undefined)).toBe(false);
      expect(isTestOrDummyString("")).toBe(false);
    });
  });

  describe("isTestUser", () => {
    it("should detect test users by name, email, nip, or dummy phone", () => {
      expect(isTestUser({ name: "Dpl Test", email: "dpl@example.com" })).toBe(true);
      expect(isTestUser({ name: "Budi", email: "test.student@gmail.com" })).toBe(true);
      expect(isTestUser({ name: "Ani", nip: "NIP-DUMMY-123" })).toBe(true);
      expect(isTestUser({ name: "Dpl Test", phone: "+62812345678900" })).toBe(true);
      expect(isTestUser({ name: "Dosen", isTestAccount: true })).toBe(true);
    });

    it("should return false for real users", () => {
      expect(isTestUser({ name: "Muhammad Aksan Ipaenin, S.T. M.Sc", email: "aksan@berseka.id", phone: "+628122334455" })).toBe(false);
      expect(isTestUser(null)).toBe(false);
    });
  });

  describe("isTestDpl", () => {
    it("should detect test DPL by various field names and dummy phones", () => {
      expect(isTestDpl({ dplName: "Dpl Test" })).toBe(true);
      expect(isTestDpl({ nama: "Dosen Penguji (Testing)" })).toBe(true);
      expect(isTestDpl({ phone: "0812345678900" })).toBe(true);
      expect(isTestDpl({ isTestAccount: true })).toBe(true);
    });

    it("should allow legitimate real DPL", () => {
      expect(isTestDpl({ name: "Dr. Budi Santoso, M.T.", email: "budi@unikom.ac.id" })).toBe(false);
      expect(isTestDpl(null)).toBe(false);
    });
  });

  describe("isTestKelompok", () => {
    it("should detect test groups by group name or assigned DPL", () => {
      expect(isTestKelompok({ name: "Kelompok TEST" })).toBe(true);
      expect(isTestKelompok({ name: "Kelompok 1", dplNamaMentah: "DPL Test" })).toBe(true);
      expect(isTestKelompok({ name: "Kelompok 2", dpl: { name: "Dpl Test" } })).toBe(true);
    });

    it("should return false for real groups", () => {
      expect(isTestKelompok({ name: "Kelompok 1 Lebak Gede", dpl: { name: "Assoc.Prof. Dr. Wartika" } })).toBe(false);
      expect(isTestKelompok(null)).toBe(false);
    });
  });

  describe("isTestStudent", () => {
    it("should detect test students by nim, name, user, or kelompok", () => {
      expect(isTestStudent({ nim: "111222333", name: "Fajar bahari" })).toBe(true);
      expect(isTestStudent({ nim: "12345678", name: "Acef Testing" })).toBe(true);
      expect(isTestStudent({ nim: "NIM-TEST-001" })).toBe(true);
      expect(isTestStudent({ name: "Mahasiswa Testing" })).toBe(true);
      expect(isTestStudent({ user: { name: "Tester Mahasiswa" } })).toBe(true);
      expect(isTestStudent({ kelompok: { name: "Kelompok TEST" } })).toBe(true);
    });

    it("should return false for real students", () => {
      expect(isTestStudent({ nim: "10121001", name: "Ahmad Fauzi", user: { name: "Ahmad Fauzi" } })).toBe(false);
      expect(isTestStudent(null)).toBe(false);
    });
  });

  describe("isTestPosko", () => {
    it("should detect test posko by posko name or linked kelompok", () => {
      expect(isTestPosko({ nama: "Posko KKN Kelompok TEST" })).toBe(true);
      expect(isTestPosko({ nama: "Posko Testing" })).toBe(true);
      expect(isTestPosko({ nama: "Posko Utama", kelompok: { name: "Kelompok TEST" } })).toBe(true);
      expect(isTestPosko({ nama: "Posko Utama", kelompokName: "Kelompok TEST" })).toBe(true);
    });

    it("should return false for real posko", () => {
      expect(isTestPosko({ nama: "Posko Kelompok 1 Dago", kelompok: { name: "Kelompok 1 Dago" } })).toBe(false);
      expect(isTestPosko(null)).toBe(false);
    });
  });

  describe("isTestProker", () => {
    it("should detect test proker by title, description, or test kelompok", () => {
      expect(isTestProker({ judul: "[Test Mahasiswa 3] Test Bad Logika" })).toBe(true);
      expect(isTestProker({ judul: "Edukasi", kelompokName: "Kelompok TEST" })).toBe(true);
      expect(isTestProker({ judul: "Program Kerja Testing" })).toBe(true);
      expect(isTestProker({ deskripsi: "percobaan program kerja" })).toBe(true);
    });

    it("should detect prokers with arbitrary titles if kelompokName or namaKelompok belongs to Kelompok TEST", () => {
      expect(isTestProker({ judul: "99", kelompokName: "Kelompok TEST" })).toBe(true);
      expect(isTestProker({ deskripsi: "Ididuel", kelompokName: "Kelompok TEST" })).toBe(true);
      expect(isTestProker({ namaProker: "hyyy", namaKelompok: "Kelompok TEST" })).toBe(true);
      expect(isTestProker({ deskripsi: "gajx", kelompok: { name: "Kelompok TEST" } })).toBe(true);
    });

    it("should return false for real proker", () => {
      expect(isTestProker({ judul: "Sosialisasi Pemilahan Sampah Organik", kelompokName: "Kelompok 1 Sadang Serang" })).toBe(false);
      expect(isTestProker(null)).toBe(false);
    });
  });

  describe("Array filter helpers", () => {
    it("should filter out test items from lists", () => {
      const users = [
        { name: "Real User 1", email: "user1@berseka.id" },
        { name: "Dpl Test", email: "dpl@test.com" },
        { name: "Real User 2", email: "user2@berseka.id" },
      ];
      expect(filterNonTestUsers(users)).toHaveLength(2);

      const groups = [
        { name: "Kelompok 1 Lebak Gede" },
        { name: "Kelompok TEST" },
      ];
      expect(filterNonTestKelompok(groups)).toHaveLength(1);

      const students = [
        { nim: "10121001", name: "Ahmad" },
        { nim: "111222333", name: "Fajar bahari" },
      ];
      expect(filterNonTestStudents(students)).toHaveLength(1);

      const poskos = [
        { nama: "Posko Kelompok 1 Dago" },
        { nama: "Posko KKN Kelompok TEST" },
      ];
      expect(filterNonTestPosko(poskos)).toHaveLength(1);

      const prokers = [
        { judul: "Sosialisasi Pengolahan Kompos", kelompokName: "Kelompok 2 Dago" },
        { judul: "Edukasi", kelompokName: "Kelompok TEST" },
      ];
      expect(filterNonTestProker(prokers)).toHaveLength(1);
    });
  });
});
