import Redis from "ioredis";
import config from "../config/app.config";
import logger from "./logger";

export default class RedisService {
  public static instance: RedisService;
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.REDIS.host,
      port: config.REDIS.port,
      password:  config.REDIS.password,
      username: config.REDIS.username,
      maxRetriesPerRequest: null,
    });
  }

  public static getInstance(): RedisService {
    if (!this.instance) {
      this.instance = new RedisService();
    }
    return this.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  async checkConnection() {
    try {
      await this.client.ping();
      logger.info("Redis connection OK");
    } catch (error) {
      logger.error({ err: error }, "Redis connection failed");
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    if (ttl) {
      return await this.client.set(key, value, "EX", ttl);
    }
    return await this.client.set(key, value);
  }

  async getUserSocket(userId: string): Promise<string | null> {
    const socket = await this.client.get(userId);
    if (socket) {
      return socket;
    }
    return null;
  }

  async delete(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async quit(): Promise<void> {
    await this.client.quit();
  }
}
