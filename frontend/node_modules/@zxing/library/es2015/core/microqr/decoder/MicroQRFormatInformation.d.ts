/**
 * Micro QR Code format information decoder.
 *
 * ISO 18004:2006 Annex E.4.4.
 *
 * The format information is 15 bits:
 *   - 5 data bits [4:2]: combined version+EC indicator (versionIndicator, 0-7)
 *   - 5 data bits [1:0]: data mask pattern (0-3)
 *   - 10 BCH parity bits (generator polynomial x^10+x^8+x^5+x^4+x^2+x+1 = 0x537)
 *
 * The stored value is XOR-masked with 0x4445.
 *
 * versionIndicator mapping:
 *   0=M1(noEC), 1=M2-L, 2=M2-M, 3=M3-L, 4=M3-M, 5=M4-L, 6=M4-M, 7=M4-Q
 */
export default class MicroQRFormatInformation {
    private static readonly FORMAT_INFO_MASK_MICRO_QR;
    /**
     * BCH generator polynomial for Micro QR format info:
     * x^10 + x^8 + x^5 + x^4 + x^2 + x + 1 = 0x537
     */
    private static readonly BCH_GENERATOR;
    /**
     * Pre-computed lookup table: 32 entries, index = 5-bit data, value = masked 15-bit format word.
     * Built at class load time.
     */
    private static readonly FORMAT_INFO_DECODE_LOOKUP;
    private readonly versionIndicator;
    private readonly dataMask;
    private constructor();
    /**
     * Compute BCH(15,5) parity and return the full 15-bit format word (before XOR mask).
     */
    private static computeBCHFormatWord;
    /**
     * Build the 32-entry lookup table: [maskedFormatWord, data5] pairs.
     */
    private static buildLookupTable;
    static numBitsDiffering(a: number, b: number): number;
    /**
     * Decode 15 format info bits (as read from the symbol, still masked).
     *
     * @param maskedFormatInfo 15 bits read directly from the symbol (XOR mask not yet removed)
     * @return MicroQRFormatInformation, or null if no match within Hamming distance 3
     */
    static decodeFormatInformation(maskedFormatInfo: number): MicroQRFormatInformation | null;
    /**
     * Combined version+EC indicator (0-7):
     *   0=M1, 1=M2-L, 2=M2-M, 3=M3-L, 4=M3-M, 5=M4-L, 6=M4-M, 7=M4-Q
     */
    getVersionIndicator(): number;
    /**
     * Data mask pattern index (0-3).
     */
    getDataMask(): number;
    /**
     * Actual version number: 1=M1, 2=M2, 3=M3, 4=M4.
     */
    getMicroQRVersionNumber(): number;
    /** EC level label: 'L', 'M', 'Q', or null for M1. */
    getECLevelLabel(): string | null;
}
