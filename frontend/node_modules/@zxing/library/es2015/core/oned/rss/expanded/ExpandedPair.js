export default class ExpandedPair {
    constructor(leftChar, rightChar, finderPatter) {
        this.leftChar = leftChar;
        this.rightChar = rightChar;
        this.finderPattern = finderPatter;
    }
    getLeftChar() {
        return this.leftChar;
    }
    getRightChar() {
        return this.rightChar;
    }
    getFinderPattern() {
        return this.finderPattern;
    }
    mustBeLast() {
        return this.rightChar === null;
    }
    toString() {
        return '[ ' + this.leftChar + ', ' + this.rightChar + ' : ' + (this.finderPattern === null ? 'null' : this.finderPattern.getValue()) + ' ]';
    }
    static equals(o1, o2) {
        if (o2 === null)
            return o1 === null;
        if (!(o2 instanceof ExpandedPair)) {
            return false;
        }
        return (o1.leftChar === null ? o2.leftChar === null : o1.leftChar.equals(o2.leftChar)) &&
            (o1.rightChar === null ? o2.rightChar === null : o1.rightChar.equals(o2.rightChar)) &&
            (o1.finderPattern === null ? o2.finderPattern === null : o1.finderPattern.equals(o2.finderPattern));
    }
    hashCode() {
        return ExpandedPair.hashNotNull(this.leftChar) ^ ExpandedPair.hashNotNull(this.rightChar) ^ ExpandedPair.hashNotNull(this.finderPattern);
    }
    static hashNotNull(o) {
        return o === null ? 0 : o.hashCode();
    }
}
