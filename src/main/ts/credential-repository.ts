import {Inject, Service} from "typedi";
import * as redis from 'redis';
import {RedisClient} from 'redis';
import {CryptoThen} from "./crypto-then";
const {promisify} = require('util');

const cipherAlgorithm = 'aes256';

@Service()
export class CredentialRepository {
    private online = false;
    private fakeRedis = {};
    private hset;
    private hget;
    private hkeys;
    private key: Buffer;
    constructor(@Inject("redisUrl") private redisUrl: string,
                @Inject("secret") private secret: string,
                @Inject("salt") private salt: string,
                @Inject("iterations") private iterations: number,
                @Inject("digest") private digest: string) {
        if (redisUrl !== '') {
            const redisClient = redis.createClient(redisUrl);
            this.hset = promisify(redisClient.hset).bind(redisClient);
            this.hget = promisify(redisClient.hget).bind(redisClient);
            this.hkeys = promisify(redisClient.hkeys).bind(redisClient);
            this.online = true;
        }
    }

    public start(): Promise<void> {
        return !this.online
            ? Promise.resolve()
            : CryptoThen.pbkdf2(this.secret, this.salt, this.iterations, 32, this.digest)
                .then(key => this.key = key)
                .then(() => undefined)
    }

    public get(group: string, id: string): Promise<any> {
        if (!this.online) {
            const result = this.fakeRedis[group] === undefined
                ? undefined
                : this.fakeRedis[group][id];

            return Promise.resolve(result);
        }
        return this.hget(group, id)
            .then(cipherTextAndIv =>
                CryptoThen.decrypt(cipherTextAndIv, this.key, cipherAlgorithm))
            .then(JSON.parse)
            .catch(() => undefined);
    }

    public set(group: string, id: string, value: any): Promise<void> {
        if (!this.online) {
            if (this.fakeRedis[group] === undefined) this.fakeRedis[group] = {};
            this.fakeRedis[group][id] = value;
            return Promise.resolve();
        }
        const stringValue = JSON.stringify(value);
        return CryptoThen.encrypt(stringValue, this.key, cipherAlgorithm)
            .then(ciphertext => this.hset(group, id, ciphertext));
    }

    public keys(group: string): Promise<string[]> {
        if (!this.online) {
            const result = this.fakeRedis[group] === undefined
                ? []
                : Object.keys(this.fakeRedis[group]);

            return Promise.resolve(result);
        }
        return this.hkeys(group);
    }
}
