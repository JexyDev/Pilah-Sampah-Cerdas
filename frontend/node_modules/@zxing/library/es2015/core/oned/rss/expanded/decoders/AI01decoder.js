import AbstractExpandedDecoder from './AbstractExpandedDecoder';
class AI01decoder extends AbstractExpandedDecoder {
    constructor(information) {
        super(information);
    }
    encodeCompressedGtin(buf, currentPos) {
        buf.append('(01)');
        const initialPosition = buf.length();
        buf.append('9');
        this.encodeCompressedGtinWithoutAI(buf, currentPos, initialPosition);
    }
    encodeCompressedGtinWithoutAI(buf, currentPos, initialBufferPosition) {
        for (let i = 0; i < 4; ++i) {
            const currentBlock /* int */ = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos + 10 * i, 10);
            // Pad with leading zeroes.
            if (currentBlock < 100) {
                buf.append('0');
            }
            if (currentBlock < 10) {
                buf.append('0');
            }
            buf.append('' + currentBlock);
        }
        AI01decoder.appendCheckDigit(buf, initialBufferPosition);
    }
    static appendCheckDigit(buf, currentPos) {
        let checkDigit = 0;
        for (let i = 0; i < 13; i++) {
            const digit = buf.charAt(i + currentPos).charCodeAt(0) - '0'.charCodeAt(0);
            checkDigit += (i & 0x01) === 0 ? 3 * digit : digit;
        }
        checkDigit = 10 - (checkDigit % 10);
        if (checkDigit === 10) {
            checkDigit = 0;
        }
        buf.append('' + checkDigit);
    }
}
AI01decoder.GTIN_SIZE = 40;
export default AI01decoder;
