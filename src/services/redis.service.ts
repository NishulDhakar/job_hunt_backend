import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

class RedisService {
    private client: Redis | null = null;

    constructor() {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (url && token) {
            this.client = new Redis({ url, token });
        } else {
            console.warn("⚠️ Redis credentials not found. Caching will be disabled.");
        }
    }

    async set(key: string, value: any, opts?: any) {
        if (!this.client) return null;
        try {
            return await this.client.set(key, value, opts);
        } catch (error) {
            console.error(`❌ Redis SET Error (${key}):`, error);
            return null; // Fail silently
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.client) return null;
        try {
            return await this.client.get<T>(key) as T;
        } catch (error) {
            console.error(`❌ Redis GET Error (${key}):`, error);
            return null;
        }
    }
}

export default new RedisService();
