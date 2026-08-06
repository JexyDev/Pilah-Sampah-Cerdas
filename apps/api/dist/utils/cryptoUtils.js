import crypto from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY
    ? Buffer.from(process.env.ENCRYPTION_SECRET_KEY, 'hex')
    : crypto.scryptSync('trashcare-default-secret-key-32', 'salt', 32);
/**
 * Encrypt sensitive string data (e.g. phone, address) at rest using AES-256-GCM.
 */
export function encryptData(text) {
    if (!text)
        return text;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
/**
 * Decrypt sensitive string data from storage.
 */
export function decryptData(cipherText) {
    if (!cipherText || !cipherText.includes(':'))
        return cipherText;
    try {
        const parts = cipherText.split(':');
        if (parts.length !== 3)
            return cipherText;
        const [ivHex, authTagHex, encryptedText] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch {
        return cipherText;
    }
}
