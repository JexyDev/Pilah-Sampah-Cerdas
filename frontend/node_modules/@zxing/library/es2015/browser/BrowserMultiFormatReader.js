import { BrowserCodeReader } from './BrowserCodeReader';
import MultiFormatReader from '../core/MultiFormatReader';
export class BrowserMultiFormatReader extends BrowserCodeReader {
    set hints(hints) {
        this._hints = hints || null;
        // Since we don't pass the hints in `decodeBitmap` as other Browser readers do, we need to set them here.
        this.reader.setHints(hints);
    }
    constructor(hints = null, timeBetweenScansMillis = 500) {
        const reader = new MultiFormatReader();
        reader.setHints(hints);
        super(reader, timeBetweenScansMillis);
    }
    /**
     * Overwrite decodeBitmap to call decodeWithState, which will pay
     * attention to the hints set in the constructor function
     */
    decodeBitmap(binaryBitmap) {
        try {
            return this.reader.decodeWithState(binaryBitmap);
        }
        finally {
            // Readers need to be reset before being reused on another bitmap.
            this.reader.reset();
        }
    }
}
