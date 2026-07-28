import Exception from './Exception';
/**
 * Custom Error class of type Exception.
 */
class ChecksumException extends Exception {
    static getChecksumInstance() {
        return new ChecksumException();
    }
}
ChecksumException.kind = 'ChecksumException';
export default ChecksumException;
