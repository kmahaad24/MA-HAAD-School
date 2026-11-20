// Small in-memory cache for data every page reads (website content, settings, notice bar).
// A save in the dashboard clears the matching keys at once. The TTL is a safety net for hosts that
// run more than one Node process (each process keeps its own copy and refreshes within `ttl`).
const store = new Map();
const pending = new Map();

export async function cached(key, load, ttl = 60_000) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  // Many requests at once share one database read
  if (pending.has(key)) return pending.get(key);
  const promise = (async () => {
    try {
      const value = await load();
      store.set(key, { value, expires: Date.now() + ttl });
      return value;
    } finally {
      pending.delete(key);
    }
  })();
  pending.set(key, promise);
  return promise;
}

// Clears one key, or every key that starts with `prefix:` when called with a prefix ending in ':'
export function invalidate(keyOrPrefix) {
  if (keyOrPrefix.endsWith(':')) {
    for (const key of store.keys()) if (key.startsWith(keyOrPrefix)) store.delete(key);
  } else {
    store.delete(keyOrPrefix);
  }
}
