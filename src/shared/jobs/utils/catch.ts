import RedisService from "../../services/redis.service";


const redisService = RedisService.getInstance();
export const redis = redisService.getClient();

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttl = 300
): Promise<void> {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}
