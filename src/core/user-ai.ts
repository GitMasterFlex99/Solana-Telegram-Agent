export type UserAIKeyStore = { get(userId: string): string | undefined; set(userId: string, apiKey: string): void; remove(userId: string): void; has(userId: string): boolean };

export function createMemoryAIKeyStore(): UserAIKeyStore {
  const keys = new Map<string, string>();
  return {
    get: (id) => keys.get(id),
    set: (id, key) => keys.set(id, key.trim()),
    remove: (id) => { keys.delete(id); },
    has: (id) => keys.has(id),
  };
}

export function maskKey(key: string | undefined): string {
  if (!key) return "not connected";
  return "connected";
}
