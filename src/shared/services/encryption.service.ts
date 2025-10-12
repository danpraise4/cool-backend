import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import * as crypto from "crypto";
import * as forge from "node-forge";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

export default class EncryptionService {
  async hashPassword(password: string): Promise<string> {
    const encryptedPassword = await bcrypt.hash(password, 14);
    return encryptedPassword;
  }

  async comparePassword(
    password: string,
    storedPassword: string
  ): Promise<boolean> {
    const _checkPassword = await bcrypt.compare(storedPassword, password);
    return _checkPassword;
  }

  async hashString(string: string): Promise<string> {
    const hashedString = createHash("sha512").update(string).digest("hex");
    return hashedString;
  }
  
  // Function to derive an AES key from a password using Node.js crypto module
  deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256"); // 32 bytes = 256 bits
  }

  // Function to ensure key is 32 bytes (padding if necessary)
  ensureKeyLength(key: string): Buffer {
    if (key.length > KEY_LENGTH) {
      return Buffer.from(key.slice(0, KEY_LENGTH), "utf8");
    } else if (key.length < KEY_LENGTH) {
      return Buffer.concat([
        Buffer.from(key, "utf8"),
        Buffer.alloc(KEY_LENGTH - key.length),
      ]);
    }
    return Buffer.from(key, "utf8");
  }

  // Function to generate a random key
  generateKey(): Buffer {
    return crypto.randomBytes(KEY_LENGTH);
  }

  // Function to encrypt text with a password and public key
  encodeString(text: string, key: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const keyBuffer = this.ensureKeyLength(key);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const encryptedText = iv.toString("hex") + ":" + encrypted;
    return encryptedText;
  }

  // Function to decrypt text with a password and private key
  decodeString(encryptedText: string, key: string): string {
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encrypted = textParts.join(":");
    const keyBuffer = this.ensureKeyLength(key);
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  encryptPayload(encryptionKey: string, payload: any): string {
    const text = JSON.stringify(payload);
    const cipher = forge.cipher.createCipher(
      "3DES-ECB",
      forge.util.createBuffer(encryptionKey)
    );
    cipher.start({ iv: "" });
    cipher.update(forge.util.createBuffer(text, "utf8"));
    cipher.finish();
    const encrypted = cipher.output;
    return forge.util.encode64(encrypted.getBytes());
  }
}
