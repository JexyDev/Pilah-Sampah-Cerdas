import BitMatrix from '../../common/BitMatrix';
import DetectorResult from '../../common/DetectorResult';
import DecodeHintType from '../../DecodeHintType';
/**
 * Detects a Micro QR Code in an image.
 *
 * Algorithm:
 *   1. Scan rows for 1:1:3:1:1 ratio black/white/black/white/black run (finder pattern).
 *   2. Cross-check candidate vertically.
 *   3. Estimate module size from the cross-section of the finder.
 *   4. Probe timing patterns (row 0 and col 0) from the finder to determine symbol dimension.
 *   5. Build perspective transform from 3 anchor points.
 *   6. Sample the grid.
 */
export default class MicroQRDetector {
    private readonly image;
    private resultPointCallback;
    constructor(image: BitMatrix);
    detect(hints?: Map<DecodeHintType, any>): DetectorResult;
    private findFinderPattern;
    private foundPatternCross;
    private handlePossibleCenter;
    private centerFromEnd;
    private crossCheckVertical;
    private processFinderPattern;
    /**
     * Determine the Micro QR symbol dimension and orientation by probing timing patterns.
     *
     * The timing pattern in row 0 (cols 8+) and col 0 (rows 8+) each alternate dark/light.
     * From the finder center (fx, fy) the timing probes rotate with the symbol orientation:
     *
     *   orientation 0 (0°):    row probe (+5,-3)→right,  col probe (-3,+5)→down
     *   orientation 1 (90°CW): row probe (+3,+5)→down,   col probe (-5,-3)→left
     *   orientation 2 (180°):  row probe (-5,+3)→left,   col probe (+3,-5)→up
     *   orientation 3 (270°CW):row probe (-3,-5)→up,     col probe (+5,+3)→right
     */
    private determineDimension;
    private snapDimension;
    /**
     * Probe the timing pattern starting at (startX, startY), stepping by moduleSize in (dx, dy).
     * Counts dark timing modules (at even-indexed positions 8, 10, 12, ...) and stops at mismatch.
     *
     * Returns the symbol dimension, or null if no valid dimension is detected.
     */
    private probeTimingLine;
    private static createTransform;
    private static sampleGrid;
}
