import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = 1;
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;
const TAG_BYTES = 16;

function getMasterKey(): Buffer {
  const raw = process.env.AI_KEY_ENCRYPTION_KEY;
  if (!raw) throw new Error("AI_KEY_ENCRYPTION_KEY is not configured");
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) throw new Error("AI_KEY_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}

export function generateEncryptionKey(): string {
  return randomBytes(KEY_BYTES).toString("base64");
}

export function encryptSecret(secret: string, masterKey = getMasterKey()): string {
  if (!secret) throw new Error("Secret cannot be empty");
  if (masterKey.length !== KEY_BYTES) throw new Error("Encryption key must be 32 bytes");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, masterKey, iv);
  cipher.setAAD(Buffer.from(`solana-telegram-agent:v${VERSION}`));
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecret(payload: string, masterKey = getMasterKey()): string {
  const [version, ivText, tagText, ciphertextText] = payload.split(".");
  if (version !== String(VERSION) || !ivText || !tagText || !ciphertextText) throw new Error("Invalid encrypted secret format");
  const iv = Buffer.from(ivText, "base64url");
  const tag = Buffer.from(tagText, "base64url");
  const ciphertext = Buffer.from(ciphertextText, "base64url");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new Error("Invalid encrypted secret parameters");
  if (masterKey.length !== KEY_BYTES) throw new Error("Encryption key must be 32 bytes");
  const decipher = createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAAD(Buffer.from(`solana-telegram-agent:v${VERSION}`));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
