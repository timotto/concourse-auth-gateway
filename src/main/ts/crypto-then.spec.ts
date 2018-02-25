import {CryptoThen} from "./crypto-then";
import * as crypto from 'crypto';
import any = jasmine.any;

const testSecret = 'test secret value';
const testSalt = 'test salt value';
const testIterations = 100000;
const testDigest = 'sha512';
const testKeyLength = 32;
const testAlgorithm = 'aes256';

describe('CryptoThen', () => {
    let unitUnderTest: CryptoThen;
    beforeEach(() => {
        unitUnderTest = new CryptoThen();
    });
    describe('pbkdf2', () => {
        it('calls the crypto.pbkdf2 function', async () => {
            spyOn(crypto, 'pbkdf2')
                .and.callThrough();

            // when
            await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest);

            // then
            expect(crypto.pbkdf2)
                .toHaveBeenCalledWith(testSecret, testSalt, testIterations, testKeyLength, testDigest, any(Function));
        });
        it('resolves the promise to the callback result', async () => {
            const expectedResult = new Buffer('some content');
            spyOn(crypto, 'pbkdf2')
                .and.callFake((a,b,c,d,e,cb) => cb(undefined, expectedResult));

            // when
            const actualResult = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest);

            // then
            expect(actualResult).toEqual(expectedResult);
        });
        it('rejects the promise if the callback errors', async () => {
            const expectedError = 'expected error';
            spyOn(crypto, 'pbkdf2')
                .and.callFake((a,b,c,d,e,cb) => cb(expectedError, undefined));

            // when
            await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest)
                .then(() => fail())
                // then
                .catch(e => expect(e).toEqual(expectedError));
        });
    });
    describe('encrypt', () => {
        it('creates a 128 bit IV', async () => {
            spyOn(crypto, 'randomBytes')
                .and.callThrough();
            // given
            const key = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest);

            // when
            await CryptoThen.encrypt('something', key, testAlgorithm);

            // then
            expect(crypto.randomBytes)
                .toHaveBeenCalledWith(16);
        });
        it('creates a cipher using the given algorithm & key, and the created IV', async () => {
            const expectedIv = new Buffer(crypto.randomBytes(16));
            spyOn(crypto, 'randomBytes')
                .and.returnValue(expectedIv);
            spyOn(crypto, 'createCipheriv')
                .and.callThrough();

            const key = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest);

            // when
            await CryptoThen.encrypt('something', key, testAlgorithm);

            // then
            expect(crypto.createCipheriv)
                .toHaveBeenCalledWith(testAlgorithm, key, expectedIv);
        });
        it('resolved to the cipher text with iv prepended to it', async () => {
            const givenPlaintext = 'given plain text';
            const expectedIv = new Buffer(crypto.randomBytes(16));
            spyOn(crypto, 'randomBytes')
                .and.returnValue(expectedIv);

            const key = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest);
            const cipher = crypto.createCipheriv(testAlgorithm, key, expectedIv);
            const cipherText = [
                cipher.update(givenPlaintext, 'utf8', 'hex'),
                cipher.final('hex')
            ].join('');
            const expectedResult = [
                expectedIv.toString('hex'),
                cipherText
            ].join('.');

            // when
            const actualResult = await CryptoThen.encrypt(givenPlaintext, key, testAlgorithm);

            // then
            expect(actualResult).toEqual(expectedResult);
        });
    });
    describe('decrypt', () => {
        it('rejects the promise if no IV can be extracted', async () => {
            const key = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest);

            // when
            await CryptoThen.decrypt('invalid input', key, testAlgorithm)
                .then(() => fail())
                // then
                .catch(e => expect(e).toEqual('invalid ciphertextAndIv'));
        });
        it('decrypts content encrypted by encrypt', async () => {
            // given
            const givenPlaintext = 'given plain text';
            const key = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest);
            const givenCiphertextWithIv = await CryptoThen.encrypt(givenPlaintext, key, testAlgorithm);

            // when
            const actualResult = await CryptoThen.decrypt(givenCiphertextWithIv, key, testAlgorithm);

            // then
            expect(actualResult).toEqual(givenPlaintext);
        });
        it('rejects if the password does not match', async () => {
            // given
            const givenPlaintext = 'given plain text';
            const key = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, testKeyLength, testDigest);
            const differentKey = await CryptoThen.pbkdf2('something different'+testSecret, testSalt, testIterations, testKeyLength, testDigest);
            const givenCiphertextWithIv = await CryptoThen.encrypt(givenPlaintext, key, testAlgorithm);

            // when
            await CryptoThen.decrypt(givenCiphertextWithIv, differentKey, testAlgorithm)
                .then(() => fail())
                // then
                .catch(e => expect(e).toBeDefined());
        });
    });
});
