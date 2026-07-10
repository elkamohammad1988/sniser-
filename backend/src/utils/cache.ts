/**
 * Tiny in-process TTL cache with prefix invalidation. Used to memoize hot,
 * read-heavy queries (catalog listings, categories) and invalidated whenever
 * the underlying data mutates. Deliberately dependency-free.
 */
interface Entry<V> {
  value: V;
  expires: number;
}

export class TtlCache<V = unknown> {
  private store = new Map<string, Entry<V>>();

  constructor(private defaultTtlMs = 30_000, private maxEntries = 500) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V, ttlMs = this.defaultTtlMs): void {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest inserted key (Map preserves insertion order).
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }

  /** Memoize a synchronous producer. The producer's return type is preserved. */
  wrap<T extends V>(key: string, producer: () => T, ttlMs = this.defaultTtlMs): T {
    const cached = this.get(key) as T | undefined;
    if (cached !== undefined) return cached;
    const value = producer();
    this.set(key, value, ttlMs);
    return value;
  }

  /** Remove all keys beginning with `prefix` (or everything when omitted). */
  invalidate(prefix?: string): void {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

/** Shared cache instance for catalog reads. */
export const catalogCache = new TtlCache(30_000);
