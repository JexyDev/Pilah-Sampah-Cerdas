import BitMatrix from '../../common/BitMatrix';
import ECBlocks from '../../qrcode/decoder/ECBlocks';
/**
 * Micro QR Code version data.
 *
 * ISO 18004:2006 Annex E.
 * Versions M1–M4: dimensions 11, 13, 15, 17.
 *
 * The versionIndicator (3 bits) encodes both symbol version and EC level:
 *   0 → M1 (no EC / detection only)
 *   1 → M2-L
 *   2 → M2-M
 *   3 → M3-L
 *   4 → M3-M
 *   5 → M4-L
 *   6 → M4-M
 *   7 → M4-Q
 */
export default class MicroQRVersion {
    private readonly versionNumber;
    private readonly versionIndicator;
    private readonly ecBlocks;
    /** Maps versionIndicator (0-7) to [versionNumber, ecLevelLabel] */
    private static readonly VERSION_INFO;
    /**
     * ECBlocks indexed by versionIndicator (0-7).
     * ECBlocks(ecCodewordsPerBlock, ECB(count, dataCodewords))
     * Total codewords = ecCodewordsPerBlock*count + count*dataCodewords
     *
     * From ISO 18004:2006, Table E.1:
     *   M1:   3 data + 2 EC = 5 total
     *   M2-L: 5 data + 5 EC = 10 total
     *   M2-M: 4 data + 6 EC = 10 total
     *   M3-L: 11 data + 6 EC = 17 total
     *   M3-M: 9 data + 8 EC = 17 total
     *   M4-L: 16 data + 8 EC = 24 total
     *   M4-M: 14 data + 10 EC = 24 total
     *   M4-Q: 10 data + 14 EC = 24 total
     */
    private static readonly EC_BLOCKS;
    /**
     * Number of mode indicator bits for versions M1-M4.
     * M1: 0 (only Numeric), M2: 1, M3: 2, M4: 3.
     */
    private static readonly MODE_INDICATOR_BITS;
    private readonly totalCodewords;
    private constructor();
    getVersionNumber(): number;
    /** Combined version+EC indicator (0-7). */
    getVersionIndicator(): number;
    /** Dimension of the symbol: 9 + 2*versionNumber. */
    getDimensionForVersion(): number;
    getTotalCodewords(): number;
    getNumDataCodewords(): number;
    getNumECCodewords(): number;
    getECBlocks(): ECBlocks;
    /** EC level label: 'L', 'M', 'Q', or null for M1. */
    getECLevelLabel(): string | null;
    /** Number of mode indicator bits (0 for M1, 1 for M2, 2 for M3, 3 for M4). */
    getModeIndicatorBits(): number;
    /**
     * Build the function pattern BitMatrix for this version.
     * Marks: 9×9 upper-left area (finder + separator + format info),
     * and timing strips on row 0 (cols 9+) and col 0 (rows 9+).
     */
    buildFunctionPattern(): BitMatrix;
    /**
     * Get a MicroQRVersion by its version indicator (0-7).
     */
    static getVersionForIndicator(versionIndicator: number): MicroQRVersion;
    /**
     * Get a MicroQRVersion from the symbol dimension (11, 13, 15, or 17).
     * Returns version M1-M4; EC level unknown (use version indicator 0 for each).
     */
    static getVersionForDimension(dimension: number): MicroQRVersion;
    toString(): string;
}
