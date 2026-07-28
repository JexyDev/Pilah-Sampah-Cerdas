"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var BarcodeFormat_1 = __importDefault(require("../BarcodeFormat"));
var BitMatrix_1 = __importDefault(require("../common/BitMatrix"));
var NotFoundException_1 = __importDefault(require("../NotFoundException"));
var Result_1 = __importDefault(require("../Result"));
var ResultMetadataType_1 = __importDefault(require("../ResultMetadataType"));
var System_1 = __importDefault(require("../util/System"));
var Decoder_1 = __importDefault(require("./decoder/Decoder"));
/**
 * This implementation can detect and decode a MaxiCode in an image.
 */
var MaxiCodeReader = /** @class */ (function () {
    function MaxiCodeReader() {
        this.decoder = new Decoder_1.default();
    }
    MaxiCodeReader.prototype.decode = function (image, hints) {
        if (hints === void 0) { hints = null; }
        // Note that MaxiCode reader effectively always assumes PURE_BARCODE mode
        // and can't detect it in an image
        var bits = MaxiCodeReader.extractPureBits(image.getBlackMatrix());
        var decoderResult = this.decoder.decode(bits, hints);
        var result = new Result_1.default(decoderResult.getText(), decoderResult.getRawBytes(), 8 * decoderResult.getRawBytes().length, MaxiCodeReader.NO_POINTS, BarcodeFormat_1.default.MAXICODE, System_1.default.currentTimeMillis());
        result.putMetadata(ResultMetadataType_1.default.ERRORS_CORRECTED, decoderResult.getErrorsCorrected());
        var ecLevel = decoderResult.getECLevel();
        if (ecLevel != null) {
            result.putMetadata(ResultMetadataType_1.default.ERROR_CORRECTION_LEVEL, ecLevel);
        }
        return result;
    };
    MaxiCodeReader.prototype.reset = function () {
        // do nothing
    };
    MaxiCodeReader.extractPureBits = function (image) {
        var enclosingRectangle = image.getEnclosingRectangle();
        if (enclosingRectangle == null) {
            throw new NotFoundException_1.default();
        }
        var left = enclosingRectangle[0];
        var top = enclosingRectangle[1];
        var width = enclosingRectangle[2];
        var height = enclosingRectangle[3];
        // Now just read off the bits
        var bits = new BitMatrix_1.default(MaxiCodeReader.MATRIX_WIDTH, MaxiCodeReader.MATRIX_HEIGHT);
        for (var y = 0; y < MaxiCodeReader.MATRIX_HEIGHT; y++) {
            var iy = top + Math.min(Math.floor((y * height + height / 2) / MaxiCodeReader.MATRIX_HEIGHT), height - 1);
            for (var x = 0; x < MaxiCodeReader.MATRIX_WIDTH; x++) {
                // srowen: I don't quite understand why the formula below is necessary, but it
                // can walk off the image if left + width = the right boundary. So cap it.
                var ix = left + Math.min(Math.floor((x * width + width / 2 + (y & 0x01) * Math.floor(width / 2)) / MaxiCodeReader.MATRIX_WIDTH), width - 1);
                if (image.get(ix, iy)) {
                    bits.set(x, y);
                }
            }
        }
        return bits;
    };
    MaxiCodeReader.NO_POINTS = [];
    MaxiCodeReader.MATRIX_WIDTH = 30;
    MaxiCodeReader.MATRIX_HEIGHT = 33;
    return MaxiCodeReader;
}());
exports.default = MaxiCodeReader;
