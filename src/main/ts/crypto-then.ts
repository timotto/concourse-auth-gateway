import * as crypto from 'crypto';

export class CryptoThen {
    public static pbkdf2(password: string | Buffer, salt: string | Buffer, iterations: number, keylen: number, digest: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) =>
            crypto.pbkdf2(password, salt, iterations, keylen, digest, (err: Error, derivedKey: Buffer) =>
                err
                    ? reject(err)
                    : resolve(derivedKey)));
    }

    public static encrypt(plaintext: string, key: Buffer, algo: string): Promise<string> {
        const iv = new Buffer(crypto.randomBytes(16));
        const cipher = crypto.createCipheriv(algo, key, iv);

        const cipherText = [
            cipher.update(plaintext, 'utf8', 'hex'),
            cipher.final('hex')
            ].join('');

        const result = [
            iv.toString('hex'),
            cipherText
        ].join('.');

        return Promise.resolve(result);
    }

    public static decrypt(ciphertextAndIv: string, key: Buffer, algo: string): Promise<string> {
        const parts = ciphertextAndIv.split('.');
        if (parts.length !== 2) return Promise.reject('invalid ciphertextAndIv');

        try {
            const iv = new Buffer(parts[0], 'hex');
            const decipher = crypto.createDecipheriv(algo, key, iv);

            const plaintext = [
                decipher.update(parts[1], 'hex', 'utf8'),
                decipher.final('utf8')
            ].join('');

            return Promise.resolve(plaintext);
        } catch (e) {
            return Promise.reject(e);
        }
    }
}
