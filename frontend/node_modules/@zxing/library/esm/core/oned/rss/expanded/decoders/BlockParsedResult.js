var BlockParsedResult = /** @class */ (function () {
    function BlockParsedResult(decodedInformation, finished) {
        this.decodedInformation = decodedInformation ? decodedInformation : null;
        this.finished = !!finished;
    }
    BlockParsedResult.prototype.getDecodedInformation = function () {
        return this.decodedInformation;
    };
    BlockParsedResult.prototype.isFinished = function () {
        return this.finished;
    };
    return BlockParsedResult;
}());
export default BlockParsedResult;
