/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { binService } from "./binService.js";
import { binRepository } from "../repositories/binRepository.js";
// Mock the qrGenerator
vi.mock("../utils/qrGenerator.js", () => {
    return {
        generateNextQrCode: vi.fn().mockResolvedValue("QR-NEW"),
    };
});
// Mock the binRepository
vi.mock("../repositories/binRepository.js", () => {
    return {
        binRepository: {
            findAll: vi.fn(),
            getLocations: vi.fn(),
            findByQrCode: vi.fn(),
            findById: vi.fn(),
            updateVolume: vi.fn(),
            recordScanTransaction: vi.fn(),
            createOverflowNotification: vi.fn(),
            findAreas: vi.fn(),
            findKelurahans: vi.fn(),
            createArea: vi.fn(),
            findRtRwById: vi.fn(),
            getUserRtRwId: vi.fn(),
            getUserHouseholdRtRwId: vi.fn(),
            findBinsByRtRwId: vi.fn(),
            createBin: vi.fn(),
            updateBin: vi.fn(),
            deleteBin: vi.fn(),
        },
    };
});
describe("BinService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe("getAllBins", () => {
        it("should fetch all bins", async () => {
            const mockBins = [{ id: "bin-1", qrCode: "QR-1", maxCapacityLiter: 25 }];
            vi.mocked(binRepository.findAll).mockResolvedValue(mockBins);
            const result = await binService.getAllBins();
            expect(binRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockBins);
        });
    });
    describe("getBinStatus", () => {
        it("should fetch status of a bin by id", async () => {
            const mockBin = { id: "bin-1", qrCode: "QR-1" };
            vi.mocked(binRepository.findById).mockResolvedValue(mockBin);
            const result = await binService.getBinStatus("bin-1");
            expect(binRepository.findById).toHaveBeenCalledWith("bin-1");
            expect(result).toEqual(mockBin);
        });
        it("should throw BIN_NOT_FOUND if bin does not exist", async () => {
            vi.mocked(binRepository.findById).mockResolvedValue(null);
            await expect(binService.getBinStatus("bin-not-exist")).rejects.toThrow("BIN_NOT_FOUND");
        });
    });
    describe("createBin", () => {
        it("should create a bin successfully", async () => {
            const mockBinInput = {
                qrCode: "QR-NEW",
                categoryId: "cat-1",
                rtRwId: "123",
                maxCapacityLiter: "30.0",
                latitude: "-6.123",
                longitude: "106.123",
            };
            const mockArea = { id: 123, kelurahanId: 456 };
            const mockCreatedBin = { id: "bin-new", qrCode: "QR-NEW" };
            vi.mocked(binRepository.findRtRwById).mockResolvedValue(mockArea);
            vi.mocked(binRepository.createBin).mockResolvedValue(mockCreatedBin);
            const result = await binService.createBin(mockBinInput);
            expect(binRepository.findRtRwById).toHaveBeenCalledWith(123);
            expect(binRepository.createBin).toHaveBeenCalledWith({
                qrCode: "QR-NEW",
                categoryId: "cat-1",
                rtRwId: 123,
                kelurahanId: 456,
                latitude: -6.123,
                longitude: 106.123,
                maxCapacityLiter: 30.0,
                userId: null,
            });
            expect(result).toEqual(mockCreatedBin);
        });
    });
});
