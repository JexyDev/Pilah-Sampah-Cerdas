import DecodedInformation from './DecodedInformation';
export default class BlockParsedResult {
    private readonly decodedInformation;
    private readonly finished;
    constructor(decodedInformation?: DecodedInformation | null, finished?: boolean);
    getDecodedInformation(): DecodedInformation | null;
    isFinished(): boolean;
}
