import BitMatrix from '../../common/BitMatrix';
import DecoderResult from '../../common/DecoderResult';
import DecodeHintType from '../../DecodeHintType';
/**
 * <p>The main class which implements MaxiCode decoding -- as opposed to locating and extracting
 * the MaxiCode from an image.</p>
 *
 * @author Manuel Kasten
 */
export default class Decoder {
    private static readonly ALL;
    private static readonly EVEN;
    private static readonly ODD;
    private rsDecoder;
    constructor();
    decode(bits: BitMatrix, hints?: Map<DecodeHintType, any> | null): DecoderResult;
    private correctErrors;
}
