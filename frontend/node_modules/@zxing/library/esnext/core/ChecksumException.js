import Exception from './Exception';
/**
 * Custom Error class of type Exception.
 */
export default class ChecksumException extends Exception {
    static kind = 'ChecksumException';
    static getChecksumInstance() {
        return new ChecksumException();
    }
}
