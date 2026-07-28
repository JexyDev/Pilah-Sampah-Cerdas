import { CustomError } from 'ts-custom-error';
/**
 * Custom Error class of type Exception.
 */
export default class Exception extends CustomError {
    message;
    /**
     * It's typed as string so it can be extended and overriden.
     */
    static kind = 'Exception';
    /**
     * Allows Exception to be constructed directly
     * with some message and prototype definition.
     */
    constructor(message = undefined) {
        super(message);
        this.message = message;
    }
    getKind() {
        const ex = this.constructor;
        return ex.kind;
    }
}
