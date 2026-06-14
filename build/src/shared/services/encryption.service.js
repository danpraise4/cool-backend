"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const node_crypto_1 = require("node:crypto");
const crypto = __importStar(require("crypto"));
const forge = __importStar(require("node-forge"));
const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const BCRYPT_ROUNDS = 12;
class EncryptionService {
    async hashPassword(password) {
        return bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
    }
    /**
     * @param storedHash  - bcrypt hash retrieved from the database
     * @param plaintext   - plaintext password submitted by the user
     */
    async comparePassword(storedHash, plaintext) {
        return bcrypt_1.default.compare(plaintext, storedHash);
    }
    async hashString(input) {
        return (0, node_crypto_1.createHash)("sha512").update(input).digest("hex");
    }
    deriveKey(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
    }
    ensureKeyLength(key) {
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
    encodeString(text, key) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const keyBuffer = this.ensureKeyLength(key);
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    }
    decodeString(encryptedText, key) {
        const parts = encryptedText.split(":");
        const iv = Buffer.from(parts.shift(), "hex");
        const encrypted = parts.join(":");
        const keyBuffer = this.ensureKeyLength(key);
        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
    encryptPayload(encryptionKey, payload) {
        const text = JSON.stringify(payload);
        const cipher = forge.cipher.createCipher("3DES-ECB", forge.util.createBuffer(encryptionKey));
        cipher.start({ iv: "" });
        cipher.update(forge.util.createBuffer(text, "utf8"));
        cipher.finish();
        return forge.util.encode64(cipher.output.getBytes());
    }
}
exports.default = EncryptionService;
