import BitMatrix from '../../common/BitMatrix';
import MicroQRFormatInformation from './MicroQRFormatInformation';
/**
 * Reads format information and codewords from a sampled Micro QR Code BitMatrix.
 */
export default class MicroQRBitMatrixParser {
    private readonly bitMatrix;
    private parsedFormatInfo;
    private parsedVersion;
    constructor(bitMatrix: BitMatrix);
    /**
     * Read the 15-bit format information from the single format info location.
     *
     * Format info modules (1-indexed in the symbol):
     *   row 8, col 1..8 → bits 14..7 (8 bits)
     *   col 8, row 7..1 → bits 6..0  (7 bits)
     */
    readFormatInformation(): MicroQRFormatInformation;
    private copyBit;
    /**
     * Read all codewords from the Micro QR BitMatrix.
     * Applies data mask before reading.
     *
     * For M1 (versionNumber=1) and M3 (versionNumber=3), the last DATA codeword
     * is only 4 bits (half-codeword). The bit stream layout is:
     *   [numDataCodewords-1 full 8-bit data CWs][4-bit half data CW][numECCodewords full 8-bit EC CWs]
     */
    readCodewords(): Uint8Array;
}
