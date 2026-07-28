import DecodedObject from './DecodedObject';
export default class DecodedInformation extends DecodedObject {
    constructor(newPosition, newString, remainingValue) {
        super(newPosition);
        this.newString = newString;
        if (remainingValue === undefined) {
            this.remaining = false;
            this.remainingValue = 0;
        }
        else {
            this.remaining = true;
            this.remainingValue = remainingValue;
        }
    }
    getNewString() {
        return this.newString;
    }
    isRemaining() {
        return this.remaining;
    }
    getRemainingValue() {
        return this.remainingValue;
    }
}
