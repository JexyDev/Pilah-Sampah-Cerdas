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
import Result from '../Result';
import BarcodeFormat from '../BarcodeFormat';
import DecodeHintType from '../DecodeHintType';
import ResultMetadataType from '../ResultMetadataType';
import System from '../util/System';
import MicroQRDecoder from './decoder/MicroQRDecoder';
import MicroQRDetector from './detector/MicroQRDetector';
/**
 * Detects and decodes Micro QR Codes in images.
 */
var MicroQRCodeReader = /** @class */ (function () {
    function MicroQRCodeReader() {
        this.decoder = new MicroQRDecoder();
    }
    MicroQRCodeReader.prototype.decode = function (image, hints) {
        var decoderResult;
        var points;
        if (hints != null && hints.get(DecodeHintType.PURE_BARCODE) !== undefined) {
            // Pure barcode path: image is already the bit matrix
            var bits = image.getBlackMatrix();
            decoderResult = this.decoder.decodeBitMatrix(bits, hints !== null && hints !== void 0 ? hints : undefined);
            points = [];
        }
        else {
            var detector = new MicroQRDetector(image.getBlackMatrix());
            var detectorResult = detector.detect(hints !== null && hints !== void 0 ? hints : undefined);
            points = detectorResult.getPoints();
            decoderResult = this.decoder.decodeBitMatrix(detectorResult.getBits(), hints !== null && hints !== void 0 ? hints : undefined);
        }
        var result = new Result(decoderResult.getText(), decoderResult.getRawBytes(), decoderResult.getNumBits(), points, BarcodeFormat.MICRO_QR_CODE, System.currentTimeMillis());
        var byteSegments = decoderResult.getByteSegments();
        if (byteSegments !== null) {
            result.putMetadata(ResultMetadataType.BYTE_SEGMENTS, byteSegments);
        }
        var ecLevel = decoderResult.getECLevel();
        if (ecLevel !== null) {
            result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
        }
        return result;
    };
    MicroQRCodeReader.prototype.reset = function () {
        // nothing to reset
    };
    return MicroQRCodeReader;
}());
export default MicroQRCodeReader;
