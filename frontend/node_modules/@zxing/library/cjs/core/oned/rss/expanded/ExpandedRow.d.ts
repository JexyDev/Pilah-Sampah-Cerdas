import ExpandedPair from './ExpandedPair';
export default class ExpandedRow {
    private readonly pairs;
    private readonly rowNumber;
    constructor(pairs: Array<ExpandedPair>, rowNumber: number);
    getPairs(): Array<ExpandedPair>;
    getRowNumber(): number;
    isEquivalent(otherPairs: Array<ExpandedPair>): boolean;
    toString(): String;
    /**
     * Two rows are equal if they contain the same pairs in the same order.
     */
    static equals(o1: ExpandedRow | null, o2: any): boolean;
    static listEquals(pairs1: Array<ExpandedPair>, pairs2: Array<ExpandedPair>): boolean;
}
