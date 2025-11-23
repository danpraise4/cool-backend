"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const app_config_1 = __importDefault(require("../config/app.config"));
class RedisService {
    static instance;
    client;
    constructor() {
        this.client = new ioredis_1.default({
            host: app_config_1.default.REDIS.host,
            port: app_config_1.default.REDIS.port,
            password: app_config_1.default.REDIS.password,
            username: app_config_1.default.REDIS.username,
            maxRetriesPerRequest: null,
        });
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new RedisService();
        }
        return this.instance;
    }
    getClient() {
        return this.client;
    }
    async checkConnection() {
        console.log("Checking Redis connection");
        let isConnected = false;
        try {
            await this.client.ping();
            isConnected = true;
        }
        catch (error) {
            isConnected = false;
        }
        console.log("Redis connection status", isConnected);
    }
    async set(key, value, ttl) {
        if (ttl) {
            return await this.client.set(key, value, "EX", ttl);
        }
        return await this.client.set(key, value);
    }
    async getUserSocket(userId) {
        const socket = await this.client.get(userId);
        if (socket) {
            return socket;
        }
        return null;
    }
    async delete(key) {
        return await this.client.del(key);
    }
    async exists(key) {
        return await this.client.exists(key);
    }
    async get(key) {
        return await this.client.get(key);
    }
    async quit() {
        await this.client.quit();
    }
}
exports.default = RedisService;
