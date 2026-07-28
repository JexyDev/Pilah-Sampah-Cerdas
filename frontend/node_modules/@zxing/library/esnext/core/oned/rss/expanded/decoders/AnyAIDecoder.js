import StringBuilder from '../../../../util/StringBuilder';
import AbstractExpandedDecoder from './AbstractExpandedDecoder';
export default class AnyAIDecoder extends AbstractExpandedDecoder {
    static HEADER_SIZE = 2 + 1 + 2;
    constructor(information) {
        super(information);
    }
    parseInformation() {
        let buf = new StringBuilder();
        return this.getGeneralDecoder().decodeAllCodes(buf, AnyAIDecoder.HEADER_SIZE);
    }
}
