export default class BlockParsedResult {
    constructor(decodedInformation, finished) {
        this.decodedInformation = decodedInformation ? decodedInformation : null;
        this.finished = !!finished;
    }
    getDecodedInformation() {
        return this.decodedInformation;
    }
    isFinished() {
        return this.finished;
    }
}
