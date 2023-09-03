import {createClient, print} from 'redis';
import {promisify} from 'util';


class RedisClient{
    constructor() {
        this.client = createClient();
        this.client.on('error', (err) => {
            console.log(err);
        });
        this.client.on('ready', () => {this.isalive = true});
    }

    isAlive() {
        return this.client.connected;
    }

    async get(key) {
        const getAsync = promisify(this.client.get).bind(this.client);
        const value = await getAsync(key);
        return value;
    }

    async set(key, value, duration) {
        this.client.set(key, value);
        this.client.expire(key, duration);
    }

    async del(key) {
        this.client.del(key);
    }
}


const redisClient = new RedisClient();
module.exports = redisClient;
