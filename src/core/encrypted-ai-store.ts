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

const validUserId = (userId: string) => /^[0-9]+$/.test(userId);
const validApiKey = (apiKey: string) => /^sk-[A-Za-z0-9_-]{20,}$/.test(apiKey.trim());

function readRecords(filePath: string): RecordMap {
  if (!existsSync(filePath)) return Object.create(null) as RecordMap;
  const raw = readFileSync(filePath, "utf8");
  if (!raw.trim()) return Object.create(null) as RecordMap;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid AI key store");
  const records = Object.create(null) as RecordMap;
  for (const [id, value] of Object.entries(parsed)) {
    if (!validUserId(id) || typeof value !== "string") throw new Error("Invalid AI key store record");
    records[id] = value;
  }
  return records;
}

function saveRecords(filePath: string, records: RecordMap): void {
  const directory = dirname(filePath);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  const temp = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  writeFileSync(temp, `${JSON.stringify(records)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  chmodSync(temp, 0o600);
  renameSync(temp, filePath);
  chmodSync(filePath, 0o600);
}

export function createEncryptedAIStore(filePath = process.env.AI_KEY_STORE_PATH ?? "./data/ai-keys.json"): EncryptedAIStore {
  return {
    get(userId) {
      if (!validUserId(userId)) return undefined;
      const encrypted = readRecords(filePath)[userId];
      return encrypted ? decryptSecret(encrypted) : undefined;
    },
    set(userId, apiKey) {
      if (!validUserId(userId)) throw new Error("Invalid user ID");
      if (!validApiKey(apiKey)) throw new Error("Invalid OpenAI API key format");
      const records = readRecords(filePath);
      records[userId] = encryptSecret(apiKey.trim());
      saveRecords(filePath, records);
    },
    remove(userId) {
      if (!validUserId(userId)) return;
      const records = readRecords(filePath);
      if (Object.hasOwn(records, userId)) {
        delete records[userId];
        saveRecords(filePath, records);
      }
    },
    has(userId) {
      if (!validUserId(userId)) return false;
      return Object.hasOwn(readRecords(filePath), userId);
    },
  };
}
