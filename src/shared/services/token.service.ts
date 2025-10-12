/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from "jsonwebtoken";
import config from "../config/app.config";
import { join } from "path";
import { readFile } from "fs/promises";
import { createHash } from "node:crypto";
import { Helper } from "../helper/helper";
import { RANDOM_STRING_TYPE } from "../config/app.constants";

let PRIVATE_KEY = "";
(async () => {
  try {
    PRIVATE_KEY = await readFile(
      join(__dirname, "../../certs/private_key.pem"),
      "utf8"
    );
  } catch (err: any) {}
})();

let PUBLIC_KEY = "";
(async () => {
  try {
    PUBLIC_KEY = await readFile(
      join(__dirname, "../../certs/public_key.pem"),
      "utf8"
    );
  } catch (err: any) {}
})();

export default class TokenService {
  /**
   * @param uuid
   * @returns
   */

  private async _generateAccessToken(
    id: string | number,
    name: string
  ): Promise<string> {
    const token = jwt.sign({ sub: id, name, type: "access" }, PRIVATE_KEY, {
      algorithm: "RS512",
      expiresIn: config.JWT_ACCESS_TOKEN_EXPIRES,
    });

    return token;
  }

  private async _generateRefreshToken(
    id: string | number,
    name: string
  ): Promise<string> {
    // payload: string | Buffer | object,
    // secretOrPrivateKey: null,
    // options?: SignOptions & { algorithm: "none" },

    const token = jwt.sign({ sub: id, name, type: "refresh" }, PRIVATE_KEY, {
      algorithm: "RS512",
      expiresIn: config.JWT_REFRESH_TOKEN_EXPIRES,
    });

    return token;
  }

  async generateToken(
    id: string | number,
    name: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this._generateAccessToken(id, name);
    const refreshToken = await this._generateRefreshToken(id, name);
    return { accessToken, refreshToken };
  }

  /**
   * @param token refers to the token that you want to verify
   * @param next inbuilt middleware function
   * @returns
   */
  async verifyToken(token: string): Promise<string | jwt.JwtPayload> {
    try {
      const _token = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS512"] });
      return _token;
    } catch (err: any) {
      if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
        throw new Error(`Oops! your token has expired or is invalid`);
      throw new Error(err.message);
    }
  }

  // delete token
  async deleteToken(id: string) {
    await jwt.verify(id, PRIVATE_KEY, { algorithms: ["RS512"] });
  }

  /**Generate token that will be sent to the users email for verification
   * Generate random string using randomBytes from node crypto library
   */
  async TokenGenerator() {
    const Token = Helper.generateRandomString(50, RANDOM_STRING_TYPE.ALPHA_NUM);
    const hashedToken = createHash("sha512").update(Token).digest("hex");
    return { Token, hashedToken };
  }

  async generateFlutterwaveToken({
    encryptionKey,
    payload,
  }: {
    encryptionKey: string;
    payload: any;
  }) {
    try {
      const text = JSON.stringify(payload);
      const forge = require("node-forge");
      const cipher = forge.cipher.createCipher(
        "3DES-ECB",
        forge.util.createBuffer(encryptionKey)
      );
      cipher.start({ iv: "" });
      cipher.update(forge.util.createBuffer(text, "utf-8"));
      cipher.finish();
      const encrypted = cipher.output;
      return forge.util.encode64(encrypted.getBytes());
    } catch (error) {
      console.log(error);
    }
  }
}
