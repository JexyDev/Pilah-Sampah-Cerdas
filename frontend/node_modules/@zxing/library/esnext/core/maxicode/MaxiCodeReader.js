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
import BarcodeFormat from '../BarcodeFormat';
import BitMatrix from '../common/BitMatrix';
import NotFoundException from '../NotFoundException';
import Result from '../Result';
import ResultMetadataType from '../ResultMetadataType';
import System from '../util/System';
import Decoder from './decoder/Decoder';
/**
 * This implementation can detect and decode a MaxiCode in an image.
 */
export default class MaxiCodeReader {
    static NO_POINTS = [];
    static MATRIX_WIDTH = 30;
    static MATRIX_HEIGHT = 33;
    decoder = new Decoder();
    decode(image, hints = null) {
        // Note that MaxiCode reader effectively always assumes PURE_BARCODE mode
        // and can't detect it in an image
        const bits = MaxiCodeReader.extractPureBits(image.getBlackMatrix());
        const decoderResult = this.decoder.decode(bits, hints);
        const result = new Result(decoderResult.getText(), decoderResult.getRawBytes(), 8 * decoderResult.getRawBytes().length, MaxiCodeReader.NO_POINTS, BarcodeFormat.MAXICODE, System.currentTimeMillis());
        result.putMetadata(ResultMetadataType.ERRORS_CORRECTED, decoderResult.getErrorsCorrected());
        const ecLevel = decoderResult.getECLevel();
        if (ecLevel != null) {
            result.putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, ecLevel);
        }
        return result;
    }
    reset() {
        // do nothing
    }
    static extractPureBits(image) {
        const enclosingRectangle = image.getEnclosingRectangle();
        if (enclosingRectangle == null) {
            throw new NotFoundException();
        }
        const left = enclosingRectangle[0];
        const top = enclosingRectangle[1];
        const width = enclosingRectangle[2];
        const height = enclosingRectangle[3];
        // Now just read off the bits
        const bits = new BitMatrix(MaxiCodeReader.MATRIX_WIDTH, MaxiCodeReader.MATRIX_HEIGHT);
        for (let y = 0; y < MaxiCodeReader.MATRIX_HEIGHT; y++) {
            const iy = top + Math.min(Math.floor((y * height + height / 2) / MaxiCodeReader.MATRIX_HEIGHT), height - 1);
            for (let x = 0; x < MaxiCodeReader.MATRIX_WIDTH; x++) {
                // srowen: I don't quite understand why the formula below is necessary, but it
                // can walk off the image if left + width = the right boundary. So cap it.
                const ix = left + Math.min(Math.floor((x * width + width / 2 + (y & 0x01) * Math.floor(width / 2)) / MaxiCodeReader.MATRIX_WIDTH), width - 1);
                if (image.get(ix, iy)) {
                    bits.set(x, y);
                }
            }
        }
        return bits;
    }
}
