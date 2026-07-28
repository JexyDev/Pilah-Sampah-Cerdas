import Reader from '../Reader';
import Result from '../Result';
import BinaryBitmap from '../BinaryBitmap';
import DecodeHintType from '../DecodeHintType';
/**
 * Detects and decodes Micro QR Codes in images.
 */
export default class MicroQRCodeReader implements Reader {
    private readonly decoder;
    decode(image: BinaryBitmap, hints?: Map<DecodeHintType, any> | null): Result;
    reset(): void;
}
