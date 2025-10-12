"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.getCache = getCache;
exports.setCache = setCache;
const redis_service_1 = __importDefault(require("../../services/redis.service"));
const redisService = redis_service_1.default.getInstance();
exports.redis = redisService.getClient();
async function getCache(key) {
    const data = await exports.redis.get(key);
    return data ? JSON.parse(data) : null;
}
async function setCache(key, value, ttl = 300) {
    await exports.redis.set(key, JSON.stringify(value), "EX", ttl);
}
