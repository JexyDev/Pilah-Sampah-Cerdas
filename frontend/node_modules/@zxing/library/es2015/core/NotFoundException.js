import Exception from './Exception';
/**
 * Custom Error class of type Exception.
 */
class NotFoundException extends Exception {
    static getNotFoundInstance() {
        return new NotFoundException();
    }
}
NotFoundException.kind = 'NotFoundException';
export default NotFoundException;
