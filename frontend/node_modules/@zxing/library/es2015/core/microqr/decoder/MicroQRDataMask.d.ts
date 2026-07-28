import BitMatrix from '../../common/BitMatrix';
/**
 * Micro QR Code data mask patterns per ISO 18004:2015 Table 10.
 *
 * These differ from the QR Code mask patterns. Indices correspond to the
 * 2-bit data mask field in the format information word (binary 00–11):
 *   00 (0): i mod 2 = 0
 *   01 (1): ((i div 2) + (j div 3)) mod 2 = 0
 *   10 (2): ((i*j mod 2) + (i*j mod 3)) mod 2 = 0
 *   11 (3): ((i+j) mod 2 + i*j mod 3) mod 2 = 0
 *
 * Where i = row, j = column.
 */
export default class MicroQRDataMask {
    private readonly maskIndex;
    private readonly isMasked;
    private constructor();
    private static readonly MASKS;
    static forIndex(maskIndex: number): MicroQRDataMask;
    /**
     * Un-mask a BitMatrix (XOR mask bits).
     * Applies to the entire matrix; function modules will be ignored by the parser.
     */
    unmaskBitMatrix(bits: BitMatrix, dimension: number): void;
}
