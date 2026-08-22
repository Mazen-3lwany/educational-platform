import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';

import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;

    constructor() {
        // responsible for creating a Redis client instance and handling any connection errors.
        this.client = createClient({
            url: 'redis://localhost:6379',
        });

        this.client.on('error', (error) => {
            console.error('Redis Error:', error);
        });
    }
    // responsible for connecting to the Redis server when the Nest server starts.
    async onModuleInit() {
        await this.client.connect();

        console.log('Redis connected successfully');
    }
    // responsible for disconnecting from the Redis server when the Nest server shuts down.
    async onModuleDestroy() {
        await this.client.quit();
    }
    async get(key: string) {
        return await this.client.get(key)
    }
    async set(key: string, value: string, ttl: number) {
        return await this.client.set(key, value, { EX: ttl })
    }
    async del(key: string) {
        return await this.client.del(key);
    }
    async deleteKeysByPattern(pattern: string) {
    for await (const keys of this.client.scanIterator({
        MATCH: pattern,
        COUNT: 100,
    })) {
        if (keys.length > 0) {
            await this.client.del(keys);
        }
    }
}
}