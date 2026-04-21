import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const SECRET = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
// Hash the secret to ensure it is always exactly 32 bytes
const KEY_BUFFER = crypto.createHash('sha256').update(SECRET).digest();
const IV_LENGTH = 16; 

export function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, KEY_BUFFER, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, KEY_BUFFER, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
