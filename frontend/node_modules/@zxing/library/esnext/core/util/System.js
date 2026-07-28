export default class System {
    // public static void arraycopy(Object src, int srcPos, Object dest, int destPos, int length)
    /**
     * Makes a copy of a array.
     */
    static arraycopy(src, srcPos, dest, destPos, length) {
        if (src === dest && srcPos < destPos) {
            // Copy backwards to avoid writing into indices we're about to read from.
            destPos += length - 1;
            srcPos += length - 1;
            while (length--) {
                dest[destPos--] = src[srcPos--];
            }
        }
        else {
            // TODO: better use split or set?
            while (length--) {
                dest[destPos++] = src[srcPos++];
            }
        }
    }
    /**
     * Returns the current time in milliseconds.
     */
    static currentTimeMillis() {
        return Date.now();
    }
}
