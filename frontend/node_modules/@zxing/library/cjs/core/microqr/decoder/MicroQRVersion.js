"use strict";
/*
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var BitMatrix_1 = __importDefault(require("../../common/BitMatrix"));
var ECBlocks_1 = __importDefault(require("../../qrcode/decoder/ECBlocks"));
var ECB_1 = __importDefault(require("../../qrcode/decoder/ECB"));
var FormatException_1 = __importDefault(require("../../FormatException"));
/**
 * Micro QR Code version data.
 *
 * ISO 18004:2006 Annex E.
 * Versions M1–M4: dimensions 11, 13, 15, 17.
 *
 * The versionIndicator (3 bits) encodes both symbol version and EC level:
 *   0 → M1 (no EC / detection only)
 *   1 → M2-L
 *   2 → M2-M
 *   3 → M3-L
 *   4 → M3-M
 *   5 → M4-L
 *   6 → M4-M
 *   7 → M4-Q
 */
var MicroQRVersion = /** @class */ (function () {
    function MicroQRVersion(versionNumber, // 1-4
    versionIndicator, // 0-7
    ecBlocks) {
        this.versionNumber = versionNumber;
        this.versionIndicator = versionIndicator;
        this.ecBlocks = ecBlocks;
        var ec = ecBlocks;
        var ecb = ec.getECBlocks()[0];
        this.totalCodewords = ecb.getCount() * (ecb.getDataCodewords() + ec.getECCodewordsPerBlock());
    }
    MicroQRVersion.prototype.getVersionNumber = function () {
        return this.versionNumber;
    };
    /** Combined version+EC indicator (0-7). */
    MicroQRVersion.prototype.getVersionIndicator = function () {
        return this.versionIndicator;
    };
    /** Dimension of the symbol: 9 + 2*versionNumber. */
    MicroQRVersion.prototype.getDimensionForVersion = function () {
        return 9 + 2 * this.versionNumber;
    };
    MicroQRVersion.prototype.getTotalCodewords = function () {
        return this.totalCodewords;
    };
    MicroQRVersion.prototype.getNumDataCodewords = function () {
        return this.ecBlocks.getECBlocks()[0].getDataCodewords();
    };
    MicroQRVersion.prototype.getNumECCodewords = function () {
        return this.totalCodewords - this.getNumDataCodewords();
    };
    MicroQRVersion.prototype.getECBlocks = function () {
        return this.ecBlocks;
    };
    /** EC level label: 'L', 'M', 'Q', or null for M1. */
    MicroQRVersion.prototype.getECLevelLabel = function () {
        return MicroQRVersion.VERSION_INFO[this.versionIndicator][1];
    };
    /** Number of mode indicator bits (0 for M1, 1 for M2, 2 for M3, 3 for M4). */
    MicroQRVersion.prototype.getModeIndicatorBits = function () {
        return MicroQRVersion.MODE_INDICATOR_BITS[this.versionNumber - 1];
    };
    /**
     * Build the function pattern BitMatrix for this version.
     * Marks: 9×9 upper-left area (finder + separator + format info),
     * and timing strips on row 0 (cols 9+) and col 0 (rows 9+).
     */
    MicroQRVersion.prototype.buildFunctionPattern = function () {
        var dimension = this.getDimensionForVersion();
        var bitMatrix = new BitMatrix_1.default(dimension);
        // Upper-left 9×9: finder (7×7) + separator + format info area + dark module
        bitMatrix.setRegion(0, 0, 9, 9);
        // Timing strip: row 0, cols 9 to dim-1
        if (dimension > 9) {
            bitMatrix.setRegion(9, 0, dimension - 9, 1);
            // Timing strip: col 0, rows 9 to dim-1
            bitMatrix.setRegion(0, 9, 1, dimension - 9);
        }
        return bitMatrix;
    };
    /**
     * Get a MicroQRVersion by its version indicator (0-7).
     */
    MicroQRVersion.getVersionForIndicator = function (versionIndicator) {
        if (versionIndicator < 0 || versionIndicator > 7) {
            throw new FormatException_1.default();
        }
        var _a = __read(MicroQRVersion.VERSION_INFO[versionIndicator], 1), versionNumber = _a[0];
        return new MicroQRVersion(versionNumber, versionIndicator, MicroQRVersion.EC_BLOCKS[versionIndicator]);
    };
    /**
     * Get a MicroQRVersion from the symbol dimension (11, 13, 15, or 17).
     * Returns version M1-M4; EC level unknown (use version indicator 0 for each).
     */
    MicroQRVersion.getVersionForDimension = function (dimension) {
        switch (dimension) {
            case 11: return MicroQRVersion.getVersionForIndicator(0); // M1
            case 13: return MicroQRVersion.getVersionForIndicator(1); // M2-L (placeholder)
            case 15: return MicroQRVersion.getVersionForIndicator(3); // M3-L (placeholder)
            case 17: return MicroQRVersion.getVersionForIndicator(5); // M4-L (placeholder)
            default: throw new FormatException_1.default();
        }
    };
    MicroQRVersion.prototype.toString = function () {
        return 'M' + this.versionNumber;
    };
    /** Maps versionIndicator (0-7) to [versionNumber, ecLevelLabel] */
    MicroQRVersion.VERSION_INFO = [
        [1, null], // 0: M1, no EC
        [2, 'L'], // 1: M2-L
        [2, 'M'], // 2: M2-M
        [3, 'L'], // 3: M3-L
        [3, 'M'], // 4: M3-M
        [4, 'L'], // 5: M4-L
        [4, 'M'], // 6: M4-M
        [4, 'Q'], // 7: M4-Q
    ];
    /**
     * ECBlocks indexed by versionIndicator (0-7).
     * ECBlocks(ecCodewordsPerBlock, ECB(count, dataCodewords))
     * Total codewords = ecCodewordsPerBlock*count + count*dataCodewords
     *
     * From ISO 18004:2006, Table E.1:
     *   M1:   3 data + 2 EC = 5 total
     *   M2-L: 5 data + 5 EC = 10 total
     *   M2-M: 4 data + 6 EC = 10 total
     *   M3-L: 11 data + 6 EC = 17 total
     *   M3-M: 9 data + 8 EC = 17 total
     *   M4-L: 16 data + 8 EC = 24 total
     *   M4-M: 14 data + 10 EC = 24 total
     *   M4-Q: 10 data + 14 EC = 24 total
     */
    MicroQRVersion.EC_BLOCKS = [
        new ECBlocks_1.default(2, new ECB_1.default(1, 3)), // 0: M1
        new ECBlocks_1.default(5, new ECB_1.default(1, 5)), // 1: M2-L
        new ECBlocks_1.default(6, new ECB_1.default(1, 4)), // 2: M2-M
        new ECBlocks_1.default(6, new ECB_1.default(1, 11)), // 3: M3-L
        new ECBlocks_1.default(8, new ECB_1.default(1, 9)), // 4: M3-M
        new ECBlocks_1.default(8, new ECB_1.default(1, 16)), // 5: M4-L
        new ECBlocks_1.default(10, new ECB_1.default(1, 14)), // 6: M4-M
        new ECBlocks_1.default(14, new ECB_1.default(1, 10)), // 7: M4-Q
    ];
    /**
     * Number of mode indicator bits for versions M1-M4.
     * M1: 0 (only Numeric), M2: 1, M3: 2, M4: 3.
     */
    MicroQRVersion.MODE_INDICATOR_BITS = [0, 1, 2, 3];
    return MicroQRVersion;
}());
exports.default = MicroQRVersion;
