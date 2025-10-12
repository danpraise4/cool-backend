"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_config_1 = __importDefault(require("../config/app.config"));
const path_1 = require("path");
const promises_1 = require("fs/promises");
const node_crypto_1 = require("node:crypto");
const helper_1 = require("../helper/helper");
const app_constants_1 = require("../config/app.constants");
let PRIVATE_KEY = "";
(async () => {
    try {
        PRIVATE_KEY = await (0, promises_1.readFile)((0, path_1.join)(__dirname, "../../certs/private_key.pem"), "utf8");
    }
    catch (err) { }
})();
let PUBLIC_KEY = "";
(async () => {
    try {
        PUBLIC_KEY = await (0, promises_1.readFile)((0, path_1.join)(__dirname, "../../certs/public_key.pem"), "utf8");
    }
    catch (err) { }
})();
class TokenService {
    /**
     * @param uuid
     * @returns
     */
    async _generateAccessToken(id, name) {
        const token = jsonwebtoken_1.default.sign({ sub: id, name, type: "access" }, PRIVATE_KEY, {
            algorithm: "RS512",
            expiresIn: app_config_1.default.JWT_ACCESS_TOKEN_EXPIRES,
        });
        return token;
    }
    async _generateRefreshToken(id, name) {
        // payload: string | Buffer | object,
        // secretOrPrivateKey: null,
        // options?: SignOptions & { algorithm: "none" },
        const token = jsonwebtoken_1.default.sign({ sub: id, name, type: "refresh" }, PRIVATE_KEY, {
            algorithm: "RS512",
            expiresIn: app_config_1.default.JWT_REFRESH_TOKEN_EXPIRES,
        });
        return token;
    }
    async generateToken(id, name) {
        const accessToken = await this._generateAccessToken(id, name);
        const refreshToken = await this._generateRefreshToken(id, name);
        return { accessToken, refreshToken };
    }
    /**
     * @param token refers to the token that you want to verify
     * @param next inbuilt middleware function
     * @returns
     */
    async verifyToken(token) {
        try {
            const _token = jsonwebtoken_1.default.verify(token, PUBLIC_KEY, { algorithms: ["RS512"] });
            return _token;
        }
        catch (err) {
            if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
                throw new Error(`Oops! your token has expired or is invalid`);
            throw new Error(err.message);
        }
    }
    // delete token
    async deleteToken(id) {
        await jsonwebtoken_1.default.verify(id, PRIVATE_KEY, { algorithms: ["RS512"] });
    }
    /**Generate token that will be sent to the users email for verification
     * Generate random string using randomBytes from node crypto library
     */
    async TokenGenerator() {
        const Token = helper_1.Helper.generateRandomString(50, app_constants_1.RANDOM_STRING_TYPE.ALPHA_NUM);
        const hashedToken = (0, node_crypto_1.createHash)("sha512").update(Token).digest("hex");
        return { Token, hashedToken };
    }
    async generateFlutterwaveToken({ encryptionKey, payload, }) {
        try {
            const text = JSON.stringify(payload);
            const forge = require("node-forge");
            const cipher = forge.cipher.createCipher("3DES-ECB", forge.util.createBuffer(encryptionKey));
            cipher.start({ iv: "" });
            cipher.update(forge.util.createBuffer(text, "utf-8"));
            cipher.finish();
            const encrypted = cipher.output;
            return forge.util.encode64(encrypted.getBytes());
        }
        catch (error) {
            console.log(error);
        }
    }
}
exports.default = TokenService;
