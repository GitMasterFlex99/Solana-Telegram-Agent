import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { decryptSecret, encryptSecret } from "./encrypted-store.js";

export type EncryptedAIStore = {
  get(userId: string): string | undefined;
  set(userId: string, apiKey: string): void;
  remove(userId: string): void;
  has(userId: string): boolean;
};

type RecordMap = Record<string, string>;

function validUserId(userId: string): boolean {
  return /^[0-9]+$/.test(userId);
}

export function createEncryptedAIStore(filePath = process.env.AI_KEY_STORE_PATH ?? "./data/ai-keys.json"): EncryptedAIStore {
  const load = (): RecordMap => {
    if (!existsSync(filePath)) return {};
    const raw = readFileSync(filePath, "utf8");
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid AI key store");
    return parsed as RecordMap;
  };

  const save = (records: RecordMap): void => {
    const directory = dirname(filePath);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const temp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    writeFileSync(temp, `${JSON.stringify(records)}\n`, { encoding: "utf8", mode: 0o600 });
    chmodSync(temp, 0o600);
    renameSync(temp, filePath);
    chmodSync(filePath, 0o600);
  };

  return {
    get(userId) {
      if (!validUserId(userId)) return undefined;
      const encrypted = load()[userId];
      return encrypted ? decryptSecret(encrypted) : undefined;
    },
    set(userId, apiKey) {
      if (!validUserId(userId)) throw new Error("Invalid user ID");
      if (!apiKey.trim()) throw new Error("API key cannot be empty");
      const records = load();
      records[userId] = encryptSecret(apiKey.trim());
      save(records);
    },
    remove(userId) {
      if (!validUserId(userId)) return;
      const records = load();
      if (userId in records) {
        delete records[userId];
        save(records);
      }
    },
    has(userId) {
      if (!validUserId(userId)) return false;
      return Boolean(load()[userId]);
    },
  };
}
