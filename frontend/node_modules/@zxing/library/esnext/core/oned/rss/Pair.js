import DataCharacter from './DataCharacter';
export default class Pair extends DataCharacter {
    finderPattern;
    count = 0;
    constructor(value, checksumPortion, finderPattern) {
        super(value, checksumPortion);
        this.finderPattern = finderPattern;
    }
    getFinderPattern() {
        return this.finderPattern;
    }
    getCount() {
        return this.count;
    }
    incrementCount() {
        this.count++;
    }
}
