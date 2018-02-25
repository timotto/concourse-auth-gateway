import {CredentialRepository} from "./credential-repository";
import * as redis from 'redis';
import {RedisClient} from 'redis';
import * as crypto from 'crypto';
import any = jasmine.any;
import {CryptoThen} from "./crypto-then";

const cipherAlgorithm = 'aes256';
const testRedisUrl = 'test-redis-url';
const testSecret = 'test secret value';
const testSalt = 'test salt value';
const testIterations = 100000;
const testDigest = 'sha512';

describe('CredentialRepository', () => {
    let unitUnderTest: CredentialRepository;
    let mockRedisClient: RedisClient;
    let cipher: crypto.Cipher;
    beforeEach(() => {
        cipher = crypto.createCipher(cipherAlgorithm, testSecret);

        mockRedisClient = jasmine.createSpyObj<RedisClient>(
            'RedisClient', ['hget', 'hset', 'hkeys']);

        spyOn(redis, 'createClient')
            .and.returnValue(mockRedisClient);
    });
    describe('with defined redis url', () => {
        beforeEach(async () => {
            unitUnderTest = new CredentialRepository(testRedisUrl, testSecret, testSalt, testIterations, testDigest);
            await unitUnderTest.start();
        });
        describe('constructor', () => {
            it('creates a new RedisClient', () => {
                expect(redis.createClient)
                    .toHaveBeenCalled();
            });
        });
        describe('start', () => {
            it('creates a key using PBKDF2', async () => {
                spyOn(crypto, 'pbkdf2')
                    .and.callThrough();

                // when
                await unitUnderTest.start();

                // then
                expect(crypto.pbkdf2)
                    .toHaveBeenCalledWith(testSecret, testSalt, testIterations, 32, testDigest, any(Function))
            });
        });
        describe('get(group,id,value)',  () => {
            it('reads the value from redis at group-key, decrypts it and returns the parsed JSON result', async () => {
                // given
                const givenGroup = 'given group';
                const givenId = 'given id';
                const expectedJsonValue = {given:'value'};
                const key = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, 32, testDigest);
                const givenRedisValue = await CryptoThen.encrypt(JSON.stringify(expectedJsonValue), key, cipherAlgorithm);

                mockRedisClient.hget
                    .and.callFake((hk,k,cb)=>cb(undefined, givenRedisValue));
                // when
                const actualResult = await unitUnderTest.get(givenGroup, givenId);

                // then
                expect(mockRedisClient.hget)
                    .toHaveBeenCalledWith(givenGroup, givenId, any(Function));
                expect(actualResult).toEqual(expectedJsonValue);
            });
            it('returns undefined if the decrypts fails', async () => {
                // given
                const givenGroup = 'given group';
                const givenId = 'given id';
                const expectedJsonValue = {given:'value'};
                const differentKey = await CryptoThen.pbkdf2('different' + testSecret, testSalt, testIterations, 32, testDigest);
                const givenRedisValue = await CryptoThen.encrypt(JSON.stringify(expectedJsonValue), differentKey, cipherAlgorithm);

                mockRedisClient.hget
                    .and.callFake((hk,k,cb)=>cb(undefined, givenRedisValue));
                // when
                const actualResult = await unitUnderTest.get(givenGroup, givenId);

                // then
                expect(actualResult).toBeUndefined();
            });
        });
        describe('set(group,id,value)',  () => {
            it('turns value into a JSON string, encrypts it, then writes that to redis at group-key', async () => {

                // random must be the same on test crypto op and reference crypto op
                const predictedRandom = crypto.randomBytes(16);
                spyOn(crypto, 'randomBytes').and.returnValue(predictedRandom);

                mockRedisClient.hset
                    .and.callFake((hk,k,v,cb) => cb());

                // given
                const givenGroup = 'given group';
                const givenId = 'given id';
                const givenJsonValue = {given:'value'};
                const key = await CryptoThen.pbkdf2(testSecret, testSalt, testIterations, 32, testDigest);
                const expectedRedisValue = await CryptoThen.encrypt(JSON.stringify(givenJsonValue), key, cipherAlgorithm);

                // when
                await unitUnderTest.set(givenGroup, givenId, givenJsonValue);

                // then
                expect(mockRedisClient.hset)
                    .toHaveBeenCalledWith(givenGroup, givenId, expectedRedisValue, any(Function));
            });
        });
        describe('keys', () => {
            it('returns the result of the corresponding hkeys redis command', async () => {
                // given
                const givenGroup = 'given group';
                const givenRedisResult = ['key1', 'key2'];
                mockRedisClient.hkeys
                    .and.callFake((hk,cb)=>cb(undefined, givenRedisResult));

                // when
                const actualResult = await unitUnderTest.keys(givenGroup);

                // then
                expect(actualResult).toEqual(givenRedisResult);
            });
        });
    });
    describe('with empty redis url', () => {
        beforeEach(() => {
            unitUnderTest = new CredentialRepository('', testSecret, testSalt, testIterations, testDigest);
        });
        describe('constructor', () => {
            it('does not create a RedisClient', () => {
                expect(redis.createClient)
                    .toHaveBeenCalledTimes(0);
            });
        });
        describe('start', () => {
            it('does nothing', async () => {
                spyOn(crypto, 'pbkdf2')
                    .and.callThrough();

                // when
                await unitUnderTest.start();

                // then
                expect(crypto.pbkdf2)
                    .toHaveBeenCalledTimes(0);
            });
        });
        describe('get(group,id,value)',  () => {
            it('reads the value from the in-memory map', async () => {
                // given
                const givenGroup = 'given group';
                const givenId = 'given id';
                const expectedJsonValue = {given:'value'};
                await unitUnderTest.set(givenGroup, givenId, expectedJsonValue);

                // when
                const actualResult = await unitUnderTest.get(givenGroup, givenId);

                // then
                expect(actualResult).toEqual(expectedJsonValue);
            });
            it('returns undefined if the group does not exist', async () =>
                expect(await unitUnderTest.get('does not exist', 'something'))
                    .toBeUndefined());
        });
        describe('set(group,id,value)',  () => {
            it('stores the value in the in-memory map', async () => {
                // given
                const givenGroup = 'given group';
                const givenId = 'given id';
                const givenJsonValue = {given:'value'};

                // when
                await unitUnderTest.set(givenGroup, givenId, givenJsonValue);

                // then
                expect(await unitUnderTest.get(givenGroup, givenId))
                    .toEqual(givenJsonValue);
            });
        });
        describe('keys', () => {
            it('returns the keys from the in-memory map', async () => {
                // given
                const givenGroup = 'given group';
                const givenKeys = ['key1', 'key2'];
                await Promise.all(givenKeys.map(k => unitUnderTest.set(givenGroup, k, 'something')));

                // when
                const actualResult = await unitUnderTest.keys(givenGroup);

                // then
                expect(actualResult).toEqual(givenKeys);
            });
            it('returns an empty array if the group does not exist', async () =>
                expect(await unitUnderTest.keys('does not exist'))
                    .toEqual([]));
        });
    });
});