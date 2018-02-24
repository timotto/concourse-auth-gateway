import {Inject, Service} from "typedi";
import * as redis from 'redis';
import {RedisClient} from 'redis';
import * as crypto from 'crypto';
const {promisify} = require('util');

const cipherAlgorithm = 'aes256';
const cipherPlaintextEncoding = 'utf8';
const cipherCryptoEncoding = 'hex';

@Service()
export class CredentialRepository {
    private online = false;
    private fakeRedis = {};
    private hset;
    private hget;
    private hkeys;
    constructor(@Inject("redisUrl") private redisUrl: string,
                @Inject("secret") private secret: string) {
        if (redisUrl !== '') {
            const redisClient = redis.createClient(redisUrl);
            this.hset = promisify(redisClient.hset).bind(redisClient);
            this.hget = promisify(redisClient.hget).bind(redisClient);
            this.hkeys = promisify(redisClient.hkeys).bind(redisClient);
            this.online = true;
        }
    }

    public get(group: string, id: string): Promise<any> {
        if (!this.online) {
            const result = this.fakeRedis[group] === undefined
                ? undefined
                : this.fakeRedis[group][id];

            return Promise.resolve(result);
        }
        const decipher = crypto.createDecipher(cipherAlgorithm, this.secret);
        return this.hget(group, id)
            .then(encrypted => decipher.update(encrypted, cipherCryptoEncoding, cipherPlaintextEncoding)
                + decipher.final(cipherPlaintextEncoding))
            .then(JSON.parse);
    }

    public set(group: string, id: string, value: any): Promise<void> {
        if (!this.online) {
            if (this.fakeRedis[group] === undefined) this.fakeRedis[group] = {};
            this.fakeRedis[group][id] = value;
            return Promise.resolve();
        }
        const stringValue = JSON.stringify(value);

        const cipher = crypto.createCipher(cipherAlgorithm, this.secret);
        const encryptedValue
            = cipher.update(stringValue, cipherPlaintextEncoding, cipherCryptoEncoding)
            + cipher.final(cipherCryptoEncoding);

        return this.hset(group, id, encryptedValue);
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
