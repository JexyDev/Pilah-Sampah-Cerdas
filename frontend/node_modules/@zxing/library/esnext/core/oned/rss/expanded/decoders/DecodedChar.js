import DecodedObject from './DecodedObject';
export default class DecodedChar extends DecodedObject {
    value;
    static FNC1 = '$'; // It's not in Alphanumeric neither in ISO/IEC 646 charset
    constructor(newPosition, value) {
        super(newPosition);
        this.value = value;
    }
    getValue() {
        return this.value;
    }
    isFNC1() {
        return this.value === DecodedChar.FNC1;
    }
}
