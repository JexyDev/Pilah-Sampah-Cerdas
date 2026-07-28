import ExpandedPair from './ExpandedPair';
export default class ExpandedRow {
    constructor(pairs, rowNumber) {
        this.pairs = [...pairs];
        this.rowNumber = rowNumber;
    }
    getPairs() {
        return this.pairs;
    }
    getRowNumber() {
        return this.rowNumber;
    }
    isEquivalent(otherPairs) {
        return ExpandedRow.listEquals(this.getPairs(), otherPairs);
    }
    toString() {
        return '{ ' + this.pairs + ' }';
    }
    /**
     * Two rows are equal if they contain the same pairs in the same order.
     */
    // @Override
    static equals(o1, o2) {
        if (o1 === null)
            return o2 === null;
        if (!(o2 instanceof ExpandedRow)) {
            return false;
        }
        return ExpandedRow.listEquals(o1.pairs, o2.getPairs());
    }
    static listEquals(pairs1, pairs2) {
        if (pairs1.length !== pairs2.length)
            return false;
        return pairs1.every((pair1, index) => {
            const pair2 = pairs2[index];
            return ExpandedPair.equals(pair1, pair2);
        });
    }
}
