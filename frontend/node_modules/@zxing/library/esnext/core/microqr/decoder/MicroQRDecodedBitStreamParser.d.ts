import DecoderResult from '../../common/DecoderResult';
import DecodeHintType from '../../DecodeHintType';
import MicroQRVersion from './MicroQRVersion';
/**
 * Decodes Micro QR Code codeword bytes to text.
 *
 * Modes and character count bits by version (ISO 18004:2006, Annex E):
 *
 *            M1  M2  M3  M4
 * Numeric     3   4   5   6
 * Alpha       -   3   4   5
 * Byte        -   -   4   5
 * Kanji       -   -   3   4
 *
 * Mode indicator bits: 0 (M1), 1 (M2), 2 (M3), 3 (M4)
 * Terminator: 3 bits (M1), 5 bits (M2-M4)
 *
 * The terminator is detected when count==0 after reading a mode indicator.
 * For M1 (no mode indicator), it's detected when count==0.
 */
export default class MicroQRDecodedBitStreamParser {
    private static readonly ALPHANUMERIC_CHARS;
    private static readonly MODE_NUMERIC;
    private static readonly MODE_ALPHA;
    private static readonly MODE_BYTE;
    private static readonly MODE_KANJI;
    static decode(bytes: Uint8Array, version: MicroQRVersion, hints: Map<DecodeHintType, any> | null): DecoderResult;
    /**
     * Decode mode indicator bits.
     * M2 (1 bit):  0=Numeric, 1=Alpha
     * M3 (2 bits): 00=Numeric, 01=Alpha, 10=Byte, 11=Kanji
     * M4 (3 bits): 000=Numeric, 001=Alpha, 010=Byte, 100=Kanji
     */
    private static decodeMode;
    /**
     * Character count bit widths by mode and version:
     *
     *            M1  M2  M3  M4
     * Numeric     3   4   5   6     → versionNumber + 2
     * Alpha       -   3   4   5     → versionNumber + 1
     * Byte        -   -   4   5     → versionNumber + 1  (M3=4, M4=5)
     * Kanji       -   -   3   4     → versionNumber      (M3=3, M4=4)
     */
    private static charCountBits;
    private static decodeNumeric;
    private static decodeAlphanumeric;
    private static decodeByte;
    private static decodeKanji;
    private static toChar;
    private static toAlphaNum;
}
