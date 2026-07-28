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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ChecksumException_1 = __importDefault(require("../../ChecksumException"));
var GenericGF_1 = __importDefault(require("../../common/reedsolomon/GenericGF"));
var ReedSolomonDecoder_1 = __importDefault(require("../../common/reedsolomon/ReedSolomonDecoder"));
var MicroQRBitMatrixParser_1 = __importDefault(require("./MicroQRBitMatrixParser"));
var MicroQRDecodedBitStreamParser_1 = __importDefault(require("./MicroQRDecodedBitStreamParser"));
var MicroQRVersion_1 = __importDefault(require("./MicroQRVersion"));
/**
 * Orchestrates Micro QR Code decoding:
 *   1. Parse format info and codewords from the bit matrix
 *   2. Reed-Solomon error correction (RS for M2-M4; skip for M1)
 *   3. Decode bit stream to text
 */
var MicroQRDecoder = /** @class */ (function () {
    function MicroQRDecoder() {
        this.rsDecoder = new ReedSolomonDecoder_1.default(GenericGF_1.default.QR_CODE_FIELD_256);
    }
    MicroQRDecoder.prototype.decodeBitMatrix = function (bits, hints) {
        var parser = new MicroQRBitMatrixParser_1.default(bits);
        var formatInfo = parser.readFormatInformation();
        var version = MicroQRVersion_1.default.getVersionForIndicator(formatInfo.getVersionIndicator());
        // Read raw codewords (format info parsed, data mask removed)
        var codewords = parser.readCodewords();
        var numDataCodewords = version.getNumDataCodewords();
        var numECCodewords = version.getNumECCodewords();
        if (version.getVersionNumber() === 1) {
            // M1: error detection only — no RS correction, just pass data through.
            // The 2 "EC" codewords are BCH-type detection codewords; we skip full correction.
            return MicroQRDecodedBitStreamParser_1.default.decode(codewords.subarray(0, numDataCodewords), version, hints !== null && hints !== void 0 ? hints : null);
        }
        // M2-M4: RS error correction using GF(256), same as QR code
        this.correctErrors(codewords, numDataCodewords);
        return MicroQRDecodedBitStreamParser_1.default.decode(codewords.subarray(0, numDataCodewords), version, hints !== null && hints !== void 0 ? hints : null);
    };
    MicroQRDecoder.prototype.correctErrors = function (codewords, numDataCodewords) {
        var codewordsInts = new Int32Array(codewords);
        try {
            this.rsDecoder.decode(codewordsInts, codewords.length - numDataCodewords);
        }
        catch (e) {
            throw new ChecksumException_1.default();
        }
        // Write corrected bytes back
        for (var i = 0; i < numDataCodewords; i++) {
            codewords[i] = codewordsInts[i] & 0xFF;
        }
    };
    return MicroQRDecoder;
}());
exports.default = MicroQRDecoder;
