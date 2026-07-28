/*
 * Copyright 2011 ZXing authors
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
import GenericGF from '../../common/reedsolomon/GenericGF';
import ReedSolomonDecoder from '../../common/reedsolomon/ReedSolomonDecoder';
import ReedSolomonException from '../../ReedSolomonException';
import ChecksumException from '../../ChecksumException';
import FormatException from '../../FormatException';
import BitMatrixParser from './BitMatrixParser';
import DecodedBitStreamParser from './DecodedBitStreamParser';
/**
 * <p>The main class which implements MaxiCode decoding -- as opposed to locating and extracting
 * the MaxiCode from an image.</p>
 *
 * @author Manuel Kasten
 */
var Decoder = /** @class */ (function () {
    function Decoder() {
        this.rsDecoder = new ReedSolomonDecoder(GenericGF.MAXICODE_FIELD_64);
    }
    Decoder.prototype.decode = function (bits, hints) {
        var parser = new BitMatrixParser(bits);
        var codewords = parser.readCodewords();
        var errorsCorrected = this.correctErrors(codewords, 0, 10, 10, Decoder.ALL);
        var mode = codewords[0] & 0x0F;
        var datawords;
        switch (mode) {
            case 2:
            case 3:
            case 4:
                errorsCorrected += this.correctErrors(codewords, 20, 84, 40, Decoder.EVEN);
                errorsCorrected += this.correctErrors(codewords, 20, 84, 40, Decoder.ODD);
                datawords = new Uint8Array(94);
                break;
            case 5:
                errorsCorrected += this.correctErrors(codewords, 20, 68, 56, Decoder.EVEN);
                errorsCorrected += this.correctErrors(codewords, 20, 68, 56, Decoder.ODD);
                datawords = new Uint8Array(78);
                break;
            default:
                throw FormatException.getFormatInstance();
        }
        for (var i = 0; i < 10; i++) {
            datawords[i] = codewords[i];
        }
        for (var i = 0; i < datawords.length - 10; i++) {
            datawords[i + 10] = codewords[i + 20];
        }
        var result = DecodedBitStreamParser.decode(datawords, mode);
        result.setErrorsCorrected(errorsCorrected);
        return result;
    };
    Decoder.prototype.correctErrors = function (codewordBytes, start, dataCodewords, ecCodewords, mode) {
        var codewords = dataCodewords + ecCodewords;
        // in EVEN or ODD mode only half the codewords
        var divisor = mode === Decoder.ALL ? 1 : 2;
        // First read into an array of ints
        var codewordsInts = new Int32Array(Math.floor(codewords / divisor));
        for (var i = 0; i < codewords; i++) {
            if ((mode === Decoder.ALL) || (i % 2 === (mode - 1))) {
                codewordsInts[Math.floor(i / divisor)] = codewordBytes[i + start] & 0xFF;
            }
        }
        var errorsCorrected = 0;
        try {
            errorsCorrected = this.rsDecoder.decodeWithECCount(codewordsInts, Math.floor(ecCodewords / divisor));
        }
        catch (ex) {
            if (ex instanceof ReedSolomonException) {
                throw ChecksumException.getChecksumInstance();
            }
            throw ex;
        }
        // Copy back into array of bytes -- only need to worry about the bytes that were data
        // We don't care about errors in the error-correction codewords
        for (var i = 0; i < dataCodewords; i++) {
            if ((mode === Decoder.ALL) || (i % 2 === (mode - 1))) {
                codewordBytes[i + start] = codewordsInts[Math.floor(i / divisor)];
            }
        }
        return errorsCorrected;
    };
    Decoder.ALL = 0;
    Decoder.EVEN = 1;
    Decoder.ODD = 2;
    return Decoder;
}());
export default Decoder;
