export interface CacheKvPort {
  del(...keys: string[]): Promise<number>;
  deleteByPrefix?(prefix: string): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
}

let cachePort: CacheKvPort | undefined;

/**
 * Điểm nối duy nhất của cache KV (D15): `AuthCoordinatorDO` trên Cloudflare,
 * `AuthCoordinatorEngine` chạy trong tiến trình ở dev/test (`@mindkid/local-runtime`).
 */
export function registerCachePort(port: CacheKvPort | undefined): void {
  cachePort = port;
}

export function getCachePort(): CacheKvPort | undefined {
  return cachePort;
}
