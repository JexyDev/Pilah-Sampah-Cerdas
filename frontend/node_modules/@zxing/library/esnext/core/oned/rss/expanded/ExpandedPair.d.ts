import DataCharacter from '../../rss/DataCharacter';
import FinderPattern from '../../rss/FinderPattern';
export default class ExpandedPair {
    private readonly leftChar;
    private readonly rightChar;
    private readonly finderPattern;
    constructor(leftChar: DataCharacter | null, rightChar: DataCharacter | null, finderPatter: FinderPattern | null);
    getLeftChar(): DataCharacter | null;
    getRightChar(): DataCharacter | null;
    getFinderPattern(): FinderPattern | null;
    mustBeLast(): boolean;
    toString(): String;
    static equals(o1: ExpandedPair | null, o2: any): boolean;
    hashCode(): number;
    private static hashNotNull;
}
