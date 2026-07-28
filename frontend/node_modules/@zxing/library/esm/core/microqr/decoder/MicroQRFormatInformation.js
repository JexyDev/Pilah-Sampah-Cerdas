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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
import Integer from '../../util/Integer';
/**
 * Micro QR Code format information decoder.
 *
 * ISO 18004:2006 Annex E.4.4.
 *
 * The format information is 15 bits:
 *   - 5 data bits [4:2]: combined version+EC indicator (versionIndicator, 0-7)
 *   - 5 data bits [1:0]: data mask pattern (0-3)
 *   - 10 BCH parity bits (generator polynomial x^10+x^8+x^5+x^4+x^2+x+1 = 0x537)
 *
 * The stored value is XOR-masked with 0x4445.
 *
 * versionIndicator mapping:
 *   0=M1(noEC), 1=M2-L, 2=M2-M, 3=M3-L, 4=M3-M, 5=M4-L, 6=M4-M, 7=M4-Q
 */
var MicroQRFormatInformation = /** @class */ (function () {
    function MicroQRFormatInformation(data5) {
        this.versionIndicator = (data5 >> 2) & 0x07;
        this.dataMask = data5 & 0x03;
    }
    /**
     * Compute BCH(15,5) parity and return the full 15-bit format word (before XOR mask).
     */
    MicroQRFormatInformation.computeBCHFormatWord = function (data5) {
        var d = data5 << 10;
        for (var i = 4; i >= 0; i--) {
            if ((d >> (i + 10)) & 1) {
                d ^= (MicroQRFormatInformation.BCH_GENERATOR << i);
            }
        }
        return ((data5 << 10) | (d & 0x3FF));
    };
    /**
     * Build the 32-entry lookup table: [maskedFormatWord, data5] pairs.
     */
    MicroQRFormatInformation.buildLookupTable = function () {
        var table = [];
        for (var data5 = 0; data5 < 32; data5++) {
            var formatWord = MicroQRFormatInformation.computeBCHFormatWord(data5);
            var masked = formatWord ^ MicroQRFormatInformation.FORMAT_INFO_MASK_MICRO_QR;
            table.push([masked, data5]);
        }
        return table;
    };
    MicroQRFormatInformation.numBitsDiffering = function (a, b) {
        return Integer.bitCount(a ^ b);
    };
    /**
     * Decode 15 format info bits (as read from the symbol, still masked).
     *
     * @param maskedFormatInfo 15 bits read directly from the symbol (XOR mask not yet removed)
     * @return MicroQRFormatInformation, or null if no match within Hamming distance 3
     */
    MicroQRFormatInformation.decodeFormatInformation = function (maskedFormatInfo) {
        var e_1, _a, e_2, _b;
        try {
            // Try exact match first
            for (var _c = __values(MicroQRFormatInformation.FORMAT_INFO_DECODE_LOOKUP), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), tableEntry = _e[0], data5 = _e[1];
                if (tableEntry === maskedFormatInfo) {
                    return new MicroQRFormatInformation(data5);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // Find closest match within Hamming distance 3
        var bestDifference = Number.MAX_SAFE_INTEGER;
        var bestData5 = 0;
        try {
            for (var _f = __values(MicroQRFormatInformation.FORMAT_INFO_DECODE_LOOKUP), _g = _f.next(); !_g.done; _g = _f.next()) {
                var _h = __read(_g.value, 2), tableEntry = _h[0], data5 = _h[1];
                var bitsDiff = MicroQRFormatInformation.numBitsDiffering(maskedFormatInfo, tableEntry);
                if (bitsDiff < bestDifference) {
                    bestDifference = bitsDiff;
                    bestData5 = data5;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
            }
            finally { if (e_2) throw e_2.error; }
        }
        if (bestDifference <= 3) {
            return new MicroQRFormatInformation(bestData5);
        }
        return null;
    };
    /**
     * Combined version+EC indicator (0-7):
     *   0=M1, 1=M2-L, 2=M2-M, 3=M3-L, 4=M3-M, 5=M4-L, 6=M4-M, 7=M4-Q
     */
    MicroQRFormatInformation.prototype.getVersionIndicator = function () {
        return this.versionIndicator;
    };
    /**
     * Data mask pattern index (0-3).
     */
    MicroQRFormatInformation.prototype.getDataMask = function () {
        return this.dataMask;
    };
    /**
     * Actual version number: 1=M1, 2=M2, 3=M3, 4=M4.
     */
    MicroQRFormatInformation.prototype.getMicroQRVersionNumber = function () {
        // versionIndicator 0→M1, 1-2→M2, 3-4→M3, 5-7→M4
        if (this.versionIndicator === 0)
            return 1;
        if (this.versionIndicator <= 2)
            return 2;
        if (this.versionIndicator <= 4)
            return 3;
        return 4;
    };
    /** EC level label: 'L', 'M', 'Q', or null for M1. */
    MicroQRFormatInformation.prototype.getECLevelLabel = function () {
        switch (this.versionIndicator) {
            case 0: return null; // M1, detection only
            case 1:
            case 3:
            case 5: return 'L';
            case 2:
            case 4:
            case 6: return 'M';
            case 7: return 'Q';
            default: return null;
        }
    };
    MicroQRFormatInformation.FORMAT_INFO_MASK_MICRO_QR = 0x4445;
    /**
     * BCH generator polynomial for Micro QR format info:
     * x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 = 0x537
     */
    MicroQRFormatInformation.BCH_GENERATOR = 0x537;
    /**
     * Pre-computed lookup table: 32 entries, index = 5-bit data, value = masked 15-bit format word.
     * Built at class load time.
     */
    MicroQRFormatInformation.FORMAT_INFO_DECODE_LOOKUP = MicroQRFormatInformation.buildLookupTable();
    return MicroQRFormatInformation;
}());
export default MicroQRFormatInformation;
