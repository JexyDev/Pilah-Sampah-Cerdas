import AI01decoder from './AI01decoder';
export default class AI01weightDecoder extends AI01decoder {
    constructor(information) {
        super(information);
    }
    encodeCompressedWeight(buf, currentPos, weightSize) {
        let originalWeightNumeric = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos, weightSize);
        this.addWeightCode(buf, originalWeightNumeric);
        const weightNumeric /* int */ = this.checkWeight(originalWeightNumeric);
        let currentDivisor = 100000;
        // Pad with leading zeroes.
        for (let i = 0; i < 5; ++i) {
            if (weightNumeric < currentDivisor) {
                buf.append('0');
            }
            currentDivisor = Math.trunc(currentDivisor / 10);
        }
        buf.append('' + weightNumeric);
    }
}
