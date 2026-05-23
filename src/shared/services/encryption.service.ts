import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import * as crypto from "crypto";
import * as forge from "node-forge";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const BCRYPT_ROUNDS = 12;

export default class EncryptionService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * @param storedHash  - bcrypt hash retrieved from the database
   * @param plaintext   - plaintext password submitted by the user
   */
  async comparePassword(storedHash: string, plaintext: string): Promise<boolean> {
    return bcrypt.compare(plaintext, storedHash);
  }

  async hashString(input: string): Promise<string> {
    return createHash("sha512").update(input).digest("hex");
  }

  deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
  }

  private ensureKeyLength(key: string): Buffer {
    if (key.length > KEY_LENGTH) {
      return Buffer.from(key.slice(0, KEY_LENGTH), "utf8");
    }
    if (key.length < KEY_LENGTH) {
      return Buffer.concat([
        Buffer.from(key, "utf8"),
        Buffer.alloc(KEY_LENGTH - key.length),
      ]);
    }
    return Buffer.from(key, "utf8");
  }

  encodeString(text: string, key: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const keyBuffer = this.ensureKeyLength(key);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  decodeString(encryptedText: string, key: string): string {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts.shift()!, "hex");
    const encrypted = parts.join(":");
    const keyBuffer = this.ensureKeyLength(key);
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  encryptPayload(encryptionKey: string, payload: unknown): string {
    const text = JSON.stringify(payload);
    const cipher = forge.cipher.createCipher(
      "3DES-ECB",
      forge.util.createBuffer(encryptionKey)
    );
    cipher.start({ iv: "" });
    cipher.update(forge.util.createBuffer(text, "utf8"));
    cipher.finish();
    return forge.util.encode64(cipher.output.getBytes());
  }
}
