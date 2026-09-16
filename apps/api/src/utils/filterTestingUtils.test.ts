import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  isTestOrDummyString,
  isTestUser,
  isTestKelompok,
  isTestStudent,
  filterNonTestUsers,
  filterNonTestKelompok,
  filterNonTestStudents,
} from "./filterTestingUtils.js";

describe("filterTestingUtils", () => {
  beforeAll(() => {
    process.env.HIDE_TEST_DATA = "true";
  });

  afterAll(() => {
    delete process.env.HIDE_TEST_DATA;
  });

  describe("default behavior (HIDE_TEST_DATA not true)", () => {
    it("should not hide test data when HIDE_TEST_DATA is not true", () => {
      delete process.env.HIDE_TEST_DATA;
      expect(isTestOrDummyString("Kelompok TEST")).toBe(false);
      expect(isTestKelompok({ name: "Kelompok TEST" })).toBe(false);
      process.env.HIDE_TEST_DATA = "true";
    });
  });

  describe("isTestOrDummyString", () => {
    it("should detect testing keywords accurately", () => {
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
    it("should detect test users by name, email, or nip", () => {
      expect(isTestUser({ name: "Dpl Test", email: "dpl@example.com" })).toBe(true);
      expect(isTestUser({ name: "Budi", email: "test.student@gmail.com" })).toBe(true);
      expect(isTestUser({ name: "Ani", nip: "NIP-DUMMY-123" })).toBe(true);
    });

    it("should return false for real users", () => {
      expect(isTestUser({ name: "Muhammad Aksan Ipaenin, S.T. M.Sc", email: "aksan@berseka.id" })).toBe(false);
      expect(isTestUser(null)).toBe(false);
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
        { nim: "TEST001", name: "Tester" },
      ];
      expect(filterNonTestStudents(students)).toHaveLength(1);
    });
  });
});
