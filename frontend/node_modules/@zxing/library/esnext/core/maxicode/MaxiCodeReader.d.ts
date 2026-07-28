import BinaryBitmap from '../BinaryBitmap';
import DecodeHintType from '../DecodeHintType';
import Reader from '../Reader';
import Result from '../Result';
/**
 * This implementation can detect and decode a MaxiCode in an image.
 */
export default class MaxiCodeReader implements Reader {
    private static readonly NO_POINTS;
    private static readonly MATRIX_WIDTH;
    private static readonly MATRIX_HEIGHT;
    private decoder;
    decode(image: BinaryBitmap, hints?: Map<DecodeHintType, any> | null): Result;
    reset(): void;
    private static extractPureBits;
}
