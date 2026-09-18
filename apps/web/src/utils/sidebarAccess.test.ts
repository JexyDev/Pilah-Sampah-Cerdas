import { describe, it, expect } from "vitest";
import { canAccessSidebarRoute, normalizeUserRole } from "./sidebarAccess";
import type { User } from "../store/useAuthStore";

function createMockUser(peran: string): User {
  return {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    peran: peran as any,
    wilayah: "Bandung",
    avatar: "TU",
    avatarBg: "bg-blue-100",
    avatarColor: "text-blue-700",
  };
}

describe("sidebarAccess utility", () => {
  it("normalizes roles correctly", () => {
    expect(normalizeUserRole("PEMIMPIN")).toBe("PIMPINAN");
    expect(normalizeUserRole("PIMPINAN")).toBe("PIMPINAN");
    expect(normalizeUserRole("DEVELOPER")).toBe("DEVELOPER");
    expect(normalizeUserRole("SUPER_USER")).toBe("SUPER_USER");
  });

  it("blocks PIMPINAN from Wilayah RW and Operasional and Leaderboard", () => {
    const pimpinan = createMockUser("PIMPINAN");
    const mockCan = (resource: string) => false;

    // Lokasi Terdaftar (RW)
    expect(canAccessSidebarRoute("/wilayah/rw", pimpinan, mockCan)).toBe(false);
    expect(canAccessSidebarRoute("/master-data/rukun-warga", pimpinan, mockCan)).toBe(false);

    // Total Pemilahan (Rekapitulasi Setoran)
    expect(
      canAccessSidebarRoute("/monitoring-pemilahan/rekapitulasi-setoran", pimpinan, mockCan)
    ).toBe(false);

    // Total Poin (Peringkat / Leaderboard)
    expect(canAccessSidebarRoute("/peringkat?system=system1&tab=citizens", pimpinan, mockCan)).toBe(
      false
    );

    // Tempat Sampah Teraktivasi
    expect(
      canAccessSidebarRoute(
        "/monitoring-pengelolaan/tempat-sampah?tab=teraktivasi",
        pimpinan,
        mockCan
      )
    ).toBe(false);
  });

  it("allows PIMPINAN to access their legitimate executive modules", () => {
    const pimpinan = createMockUser("PIMPINAN");
    const mockCan = (resource: string) => resource === "monitoring_sampah";

    expect(canAccessSidebarRoute("/dasbor", pimpinan, mockCan)).toBe(true);
    expect(
      canAccessSidebarRoute("/analisis-sistem/tata-kelola-sampah", pimpinan, mockCan)
    ).toBe(true);
    expect(canAccessSidebarRoute("/monitoring-wilayah", pimpinan, mockCan)).toBe(true);
    expect(canAccessSidebarRoute("/pelaksanaan/kelompok", pimpinan, mockCan)).toBe(true);
    expect(canAccessSidebarRoute("/monitoring-kegiatan/presensi", pimpinan, mockCan)).toBe(true);
  });

  it("allows DEVELOPER and SUPER_USER full access", () => {
    const dev = createMockUser("DEVELOPER");
    expect(canAccessSidebarRoute("/wilayah/rw", dev)).toBe(true);
    expect(canAccessSidebarRoute("/monitoring-pemilahan/rekapitulasi-setoran", dev)).toBe(true);
    expect(canAccessSidebarRoute("/peringkat", dev)).toBe(true);
    expect(canAccessSidebarRoute("/monitoring-pengelolaan/tempat-sampah", dev)).toBe(true);
  });
});
