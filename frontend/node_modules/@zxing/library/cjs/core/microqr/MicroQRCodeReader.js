"use strict";
/*
 * Copyright 2010 ZXing authors
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
var Result_1 = __importDefault(require("../Result"));
var BarcodeFormat_1 = __importDefault(require("../BarcodeFormat"));
var DecodeHintType_1 = __importDefault(require("../DecodeHintType"));
var ResultMetadataType_1 = __importDefault(require("../ResultMetadataType"));
var System_1 = __importDefault(require("../util/System"));
var MicroQRDecoder_1 = __importDefault(require("./decoder/MicroQRDecoder"));
var MicroQRDetector_1 = __importDefault(require("./detector/MicroQRDetector"));
/**
 * Detects and decodes Micro QR Codes in images.
 */
var MicroQRCodeReader = /** @class */ (function () {
    function MicroQRCodeReader() {
        this.decoder = new MicroQRDecoder_1.default();
    }
    MicroQRCodeReader.prototype.decode = function (image, hints) {
        var decoderResult;
        var points;
        if (hints != null && hints.get(DecodeHintType_1.default.PURE_BARCODE) !== undefined) {
            // Pure barcode path: image is already the bit matrix
            var bits = image.getBlackMatrix();
            decoderResult = this.decoder.decodeBitMatrix(bits, hints !== null && hints !== void 0 ? hints : undefined);
            points = [];
        }
        else {
            var detector = new MicroQRDetector_1.default(image.getBlackMatrix());
            var detectorResult = detector.detect(hints !== null && hints !== void 0 ? hints : undefined);
            points = detectorResult.getPoints();
            decoderResult = this.decoder.decodeBitMatrix(detectorResult.getBits(), hints !== null && hints !== void 0 ? hints : undefined);
        }
        var result = new Result_1.default(decoderResult.getText(), decoderResult.getRawBytes(), decoderResult.getNumBits(), points, BarcodeFormat_1.default.MICRO_QR_CODE, System_1.default.currentTimeMillis());
        var byteSegments = decoderResult.getByteSegments();
        if (byteSegments !== null) {
            result.putMetadata(ResultMetadataType_1.default.BYTE_SEGMENTS, byteSegments);
        }
        var ecLevel = decoderResult.getECLevel();
        if (ecLevel !== null) {
            result.putMetadata(ResultMetadataType_1.default.ERROR_CORRECTION_LEVEL, ecLevel);
        }
        return result;
    };
    MicroQRCodeReader.prototype.reset = function () {
        // nothing to reset
    };
    return MicroQRCodeReader;
}());
exports.default = MicroQRCodeReader;
