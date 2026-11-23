type Entry<T> = { value: T; expiresAt: number };
export type Cache<T> = { get(key: string): T | undefined; set(key: string, value: T): void };
export function createCache<T>(maxEntries: number, ttlMs: number): Cache<T> {
  const map = new Map<string, Entry<T>>();
  return {
    get(key) {
      const entry = map.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) { map.delete(key); return undefined; }
      map.delete(key);
      map.set(key, entry);
      return entry.value;
    },
    set(key, value) {
      map.delete(key);
      map.set(key, { value, expiresAt: Date.now() + ttlMs });
      if (map.size > maxEntries) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
    }
  };
}
