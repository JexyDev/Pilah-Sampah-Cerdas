import AI01weightDecoder from './AI01weightDecoder';
import NotFoundException from '../../../../NotFoundException';
import StringBuilder from '../../../../util/StringBuilder';
export default class AI013x0x1xDecoder extends AI01weightDecoder {
    static HEADER_SIZE = 7 + 1;
    static WEIGHT_SIZE = 20;
    static DATE_SIZE = 16;
    dateCode;
    firstAIdigits;
    constructor(information, firstAIdigits, dateCode) {
        super(information);
        this.dateCode = dateCode;
        this.firstAIdigits = firstAIdigits;
    }
    parseInformation() {
        if (this.getInformation().getSize() !==
            AI013x0x1xDecoder.HEADER_SIZE +
                AI013x0x1xDecoder.GTIN_SIZE +
                AI013x0x1xDecoder.WEIGHT_SIZE +
                AI013x0x1xDecoder.DATE_SIZE) {
            throw new NotFoundException();
        }
        const buf = new StringBuilder();
        this.encodeCompressedGtin(buf, AI013x0x1xDecoder.HEADER_SIZE);
        this.encodeCompressedWeight(buf, AI013x0x1xDecoder.HEADER_SIZE + AI013x0x1xDecoder.GTIN_SIZE, AI013x0x1xDecoder.WEIGHT_SIZE);
        this.encodeCompressedDate(buf, AI013x0x1xDecoder.HEADER_SIZE +
            AI013x0x1xDecoder.GTIN_SIZE +
            AI013x0x1xDecoder.WEIGHT_SIZE);
        return buf.toString();
    }
    encodeCompressedDate(buf, currentPos) {
        let numericDate = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos, AI013x0x1xDecoder.DATE_SIZE);
        if (numericDate === 38400) {
            return;
        }
        buf.append('(');
        buf.append(this.dateCode);
        buf.append(')');
        const day /* int */ = numericDate % 32;
        numericDate = Math.trunc(numericDate / 32);
        const month /* int */ = (numericDate % 12) + 1;
        numericDate = Math.trunc(numericDate / 12);
        const year /* int */ = numericDate;
        // Division of an integer by 10 results in 0.
        // The checks exist to add a leading 0.
        if (year < 10) {
            buf.append('0');
        }
        buf.append('' + year);
        if (month < 10) {
            buf.append('0');
        }
        buf.append('' + month);
        if (day < 10) {
            buf.append('0');
        }
        buf.append('' + day);
    }
    addWeightCode(buf, weight /* int */) {
        buf.append('(');
        buf.append(this.firstAIdigits);
        buf.append('' + Math.trunc(weight / 100000));
        buf.append(')');
    }
    checkWeight(weight) {
        return weight % 100000;
    }
}
