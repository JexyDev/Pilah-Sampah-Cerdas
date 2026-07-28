import DecodedObject from './DecodedObject';
class DecodedChar extends DecodedObject {
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
DecodedChar.FNC1 = '$'; // It's not in Alphanumeric neither in ISO/IEC 646 charset
export default DecodedChar;
