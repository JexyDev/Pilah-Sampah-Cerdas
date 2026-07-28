import Exception from './Exception';
/**
 * Custom Error class of type Exception.
 */
class FormatException extends Exception {
    static getFormatInstance() {
        return new FormatException();
    }
}
FormatException.kind = 'FormatException';
export default FormatException;
