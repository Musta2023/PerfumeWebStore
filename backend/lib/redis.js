import Redis from "ioredis"
import dotenv from 'dotenv';
dotenv.config();    

export const client = new Redis(process.env.UPSTASH_REDIS_URL);

export const redis = {
    set: async (key, value, ...args) => {
        return await client.set(key, value, ...args);   
    },
    get: async (key) => {
        return await client.get(key);
    },
    del: async (key) => {
        return await client.del(key);
    }
};  
