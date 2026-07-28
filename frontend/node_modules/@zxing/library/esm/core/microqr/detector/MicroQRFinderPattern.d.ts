import ResultPoint from '../../ResultPoint';
/**
 * Encapsulates a Micro QR Code finder pattern candidate.
 */
export default class MicroQRFinderPattern extends ResultPoint {
    private estimatedModuleSize;
    private count;
    constructor(posX: number, posY: number, estimatedModuleSize: number, count?: number);
    getEstimatedModuleSize(): number;
    getCount(): number;
    /**
     * Returns true if this pattern is approximately at position (i, j)
     * with the given module size.
     */
    aboutEquals(moduleSize: number, i: number, j: number): boolean;
    /**
     * Return a new pattern that is a weighted average of this pattern and a new estimate.
     */
    combineEstimate(i: number, j: number, newModuleSize: number): MicroQRFinderPattern;
}
