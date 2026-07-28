"use strict";
/*
 * Copyright 2009 ZXing authors
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var DecodeHintType_1 = __importDefault(require("./DecodeHintType"));
var BarcodeFormat_1 = __importDefault(require("./BarcodeFormat"));
var QRCodeReader_1 = __importDefault(require("./qrcode/QRCodeReader"));
var MicroQRCodeReader_1 = __importDefault(require("./microqr/MicroQRCodeReader"));
var AztecReader_1 = __importDefault(require("./aztec/AztecReader"));
var MultiFormatOneDReader_1 = __importDefault(require("./oned/MultiFormatOneDReader"));
var DataMatrixReader_1 = __importDefault(require("./datamatrix/DataMatrixReader"));
var MaxiCodeReader_1 = __importDefault(require("./maxicode/MaxiCodeReader"));
var NotFoundException_1 = __importDefault(require("./NotFoundException"));
var PDF417Reader_1 = __importDefault(require("./pdf417/PDF417Reader"));
var ReaderException_1 = __importDefault(require("./ReaderException"));
/*namespace com.google.zxing {*/
/**
 * MultiFormatReader is a convenience class and the main entry point into the library for most uses.
 * By default it attempts to decode all barcode formats that the library supports. Optionally, you
 * can provide a hints object to request different behavior, for example only decoding QR codes.
 *
 * @author Sean Owen
 * @author dswitkin@google.com (Daniel Switkin)
 */
var MultiFormatReader = /** @class */ (function () {
    function MultiFormatReader() {
    }
    /**
     * This version of decode honors the intent of Reader.decode(BinaryBitmap) in that it
     * passes null as a hint to the decoders. However, that makes it inefficient to call repeatedly.
     * Use setHints() followed by decodeWithState() for continuous scan applications.
     *
     * @param image The pixel data to decode
     * @return The contents of the image
     *
     * @throws NotFoundException Any errors which occurred
     */
    /*@Override*/
    // public decode(image: BinaryBitmap): Result {
    //   setHints(null)
    //   return decodeInternal(image)
    // }
    /**
     * Decode an image using the hints provided. Does not honor existing state.
     *
     * @param image The pixel data to decode
     * @param hints The hints to use, clearing the previous state.
     * @return The contents of the image
     *
     * @throws NotFoundException Any errors which occurred
     */
    /*@Override*/
    MultiFormatReader.prototype.decode = function (image, hints) {
        if (this.hints !== hints) {
            this.setHints(hints);
        }
        return this.decodeInternal(image);
    };
    /**
     * Decode an image using the state set up by calling setHints() previously. Continuous scan
     * clients will get a <b>large</b> speed increase by using this instead of decode().
     *
     * @param image The pixel data to decode
     * @return The contents of the image
     *
     * @throws NotFoundException Any errors which occurred
     */
    MultiFormatReader.prototype.decodeWithState = function (image) {
        // Make sure to set up the default state so we don't crash
        if (this.readers === null || this.readers === undefined) {
            this.setHints(null);
        }
        return this.decodeInternal(image);
    };
    /**
     * This method adds state to the MultiFormatReader. By setting the hints once, subsequent calls
     * to decodeWithState(image) can reuse the same set of readers without reallocating memory. This
     * is important for performance in continuous scan clients.
     *
     * @param hints The set of hints to use for subsequent calls to decode(image)
     */
    MultiFormatReader.prototype.setHints = function (hints) {
        this.hints = hints;
        var tryHarder = hints !== null && hints !== undefined && undefined !== hints.get(DecodeHintType_1.default.TRY_HARDER);
        /*@SuppressWarnings("unchecked")*/
        var formats = hints === null || hints === undefined ? null : hints.get(DecodeHintType_1.default.POSSIBLE_FORMATS);
        var readers = new Array();
        if (formats !== null && formats !== undefined) {
            var addOneDReader = formats.some(function (f) {
                return f === BarcodeFormat_1.default.UPC_A ||
                    f === BarcodeFormat_1.default.UPC_E ||
                    f === BarcodeFormat_1.default.EAN_13 ||
                    f === BarcodeFormat_1.default.EAN_8 ||
                    f === BarcodeFormat_1.default.CODABAR ||
                    f === BarcodeFormat_1.default.CODE_39 ||
                    f === BarcodeFormat_1.default.CODE_93 ||
                    f === BarcodeFormat_1.default.CODE_128 ||
                    f === BarcodeFormat_1.default.ITF ||
                    f === BarcodeFormat_1.default.RSS_14 ||
                    f === BarcodeFormat_1.default.RSS_EXPANDED;
            });
            // Put 1D readers upfront in "normal" mode
            // TYPESCRIPTPORT: TODO: uncomment below as they are ported
            if (addOneDReader && !tryHarder) {
                readers.push(new MultiFormatOneDReader_1.default(hints));
            }
            if (formats.includes(BarcodeFormat_1.default.QR_CODE)) {
                readers.push(new QRCodeReader_1.default());
            }
            if (formats.includes(BarcodeFormat_1.default.MICRO_QR_CODE)) {
                readers.push(new MicroQRCodeReader_1.default());
            }
            if (formats.includes(BarcodeFormat_1.default.DATA_MATRIX)) {
                readers.push(new DataMatrixReader_1.default());
            }
            if (formats.includes(BarcodeFormat_1.default.AZTEC)) {
                readers.push(new AztecReader_1.default());
            }
            if (formats.includes(BarcodeFormat_1.default.PDF_417)) {
                readers.push(new PDF417Reader_1.default());
            }
            if (formats.includes(BarcodeFormat_1.default.MAXICODE)) {
                readers.push(new MaxiCodeReader_1.default());
            }
            // At end in "try harder" mode
            if (addOneDReader && tryHarder) {
                readers.push(new MultiFormatOneDReader_1.default(hints));
            }
        }
        if (readers.length === 0) {
            if (!tryHarder) {
                readers.push(new MultiFormatOneDReader_1.default(hints));
            }
            readers.push(new QRCodeReader_1.default());
            readers.push(new MicroQRCodeReader_1.default());
            readers.push(new DataMatrixReader_1.default());
            readers.push(new AztecReader_1.default());
            readers.push(new PDF417Reader_1.default());
            readers.push(new MaxiCodeReader_1.default());
            if (tryHarder) {
                readers.push(new MultiFormatOneDReader_1.default(hints));
            }
        }
        this.readers = readers; // .toArray(new Reader[readers.size()])
    };
    /*@Override*/
    MultiFormatReader.prototype.reset = function () {
        var e_1, _a;
        if (this.readers !== null) {
            try {
                for (var _b = __values(this.readers), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var reader = _c.value;
                    reader.reset();
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    /**
     * @throws NotFoundException
     */
    MultiFormatReader.prototype.decodeInternal = function (image) {
        var e_2, _a;
        if (this.readers === null) {
            throw new ReaderException_1.default('No readers where selected, nothing can be read.');
        }
        try {
            for (var _b = __values(this.readers), _c = _b.next(); !_c.done; _c = _b.next()) {
                var reader = _c.value;
                try {
                    return reader.decode(image, this.hints);
                }
                catch (ex) {
                    if (ex instanceof ReaderException_1.default) {
                        continue;
                    }
                    // Log non-reader exceptions for debugging but continue trying other readers
                    console.warn('MultiFormatReader: non-ReaderException from reader:', ex);
                    continue;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        throw new NotFoundException_1.default('No MultiFormat Readers were able to detect the code.');
    };
    return MultiFormatReader;
}());
exports.default = MultiFormatReader;
