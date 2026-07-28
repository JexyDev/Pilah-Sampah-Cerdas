import DecoderResult from '../../common/DecoderResult';
/**
 * <p>MaxiCodes can encode text or structured information as bits in one of several modes,
 * with multiple character sets in one code. This class decodes the bits back into text.</p>
 *
 * @author mike32767
 * @author Manuel Kasten
 */
export default class DecodedBitStreamParser {
    private static readonly SHIFTA;
    private static readonly SHIFTB;
    private static readonly SHIFTC;
    private static readonly SHIFTD;
    private static readonly SHIFTE;
    private static readonly TWOSHIFTA;
    private static readonly THREESHIFTA;
    private static readonly LATCHA;
    private static readonly LATCHB;
    private static readonly LOCK;
    private static readonly ECI;
    private static readonly NS;
    private static readonly PAD;
    private static readonly FS;
    private static readonly GS;
    private static readonly RS;
    private static readonly COUNTRY_BYTES;
    private static readonly SERVICE_CLASS_BYTES;
    private static readonly POSTCODE_2_LENGTH_BYTES;
    private static readonly POSTCODE_2_BYTES;
    private static readonly POSTCODE_3_BYTES;
    private static readonly SETS;
    private constructor();
    static decode(bytes: Uint8Array, mode: number): DecoderResult;
    private static getBit;
    private static getInt;
    private static getCountry;
    private static getServiceClass;
    private static getPostCode2Length;
    private static getPostCode2;
    private static getPostCode3;
    private static getMessage;
}
