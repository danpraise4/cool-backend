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
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
class EncryptionService {
    async hashPassword(password) {
        const encryptedPassword = await bcrypt_1.default.hash(password, 14);
        return encryptedPassword;
    }
    async comparePassword(password, storedPassword) {
        const _checkPassword = await bcrypt_1.default.compare(storedPassword, password);
        return _checkPassword;
    }
    async hashString(string) {
        const hashedString = (0, node_crypto_1.createHash)("sha512").update(string).digest("hex");
        return hashedString;
    }
    // Function to derive an AES key from a password using Node.js crypto module
    deriveKey(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256"); // 32 bytes = 256 bits
    }
    // Function to ensure key is 32 bytes (padding if necessary)
    ensureKeyLength(key) {
        if (key.length > KEY_LENGTH) {
            return Buffer.from(key.slice(0, KEY_LENGTH), "utf8");
        }
        else if (key.length < KEY_LENGTH) {
            return Buffer.concat([
                Buffer.from(key, "utf8"),
                Buffer.alloc(KEY_LENGTH - key.length),
            ]);
        }
        return Buffer.from(key, "utf8");
    }
    // Function to generate a random key
    generateKey() {
        return crypto.randomBytes(KEY_LENGTH);
    }
    // Function to encrypt text with a password and public key
    encodeString(text, key) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const keyBuffer = this.ensureKeyLength(key);
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        const encryptedText = iv.toString("hex") + ":" + encrypted;
        return encryptedText;
    }
    // Function to decrypt text with a password and private key
    decodeString(encryptedText, key) {
        const textParts = encryptedText.split(":");
        const iv = Buffer.from(textParts.shift(), "hex");
        const encrypted = textParts.join(":");
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
        const encrypted = cipher.output;
        return forge.util.encode64(encrypted.getBytes());
    }
}
exports.default = EncryptionService;
