/**
 * Unit Test for Bin Presets (Tabung & Kotak)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { binController } from "./binController.js";
import {
  PRESET_TEMPAT_SAMPAH_TABUNG,
  PRESET_TEMPAT_SAMPAH_KOTAK,
} from "../constants/binPresets.js";

describe("BinController - Presets Ukuran Tempat Sampah", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { userId: "user-test-123", role: "WARGA" },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("GET /api/v1/bins/presets/tabung", () => {
    it("harus mengembalikan HTTP 200 dan 4 item preset tabung", async () => {
      await binController.getPresetsTabung(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Berhasil mengambil preset tempat sampah tabung",
        data: PRESET_TEMPAT_SAMPAH_TABUNG,
      });

      const data = res.json.mock.calls[0][0].data;
      expect(data).toHaveLength(4);
      expect(data[0]).toEqual({
        id: "preset-t-1",
        label: "Kecil",
        capacity: 10.0,
        diameter: 23,
        tinggi: 24,
      });
      expect(data[3]).toEqual({
        id: "preset-t-4",
        label: "Jumbo",
        capacity: 60.0,
        diameter: 40,
        tinggi: 48,
      });
    });
  });

  describe("GET /api/v1/bins/presets/kotak", () => {
    it("harus mengembalikan HTTP 200 dan 4 item preset kotak", async () => {
      await binController.getPresetsKotak(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Berhasil mengambil preset tempat sampah kotak",
        data: PRESET_TEMPAT_SAMPAH_KOTAK,
      });

      const data = res.json.mock.calls[0][0].data;
      expect(data).toHaveLength(4);
      expect(data[0]).toEqual({
        id: "preset-k-1",
        label: "Kecil",
        capacity: 12.0,
        panjang: 25,
        lebar: 20,
        tinggi: 24,
      });
      expect(data[3]).toEqual({
        id: "preset-k-4",
        label: "Jumbo",
        capacity: 70.0,
        panjang: 45,
        lebar: 35,
        tinggi: 45,
      });
    });
  });
});
