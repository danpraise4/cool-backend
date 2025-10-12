"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthAdminService = exports.GOOGLE = void 0;
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const app_constants_1 = require("../../../shared/config/app.constants");
const encryption_service_1 = __importDefault(require("../../../shared/services/encryption.service"));
const token_service_1 = __importDefault(require("../../../shared/services/token.service"));
const otp_service_1 = require("../../otp/otp.service");
const app_config_1 = __importDefault(require("../../../shared/config/app.config"));
const auth_utils_1 = require("../auth.utils");
exports.GOOGLE = app_config_1.default.GOOGLE;
class AuthAdminService {
    constructor() { }
    otpService = new otp_service_1.OtpService();
    encryptionService = new encryption_service_1.default();
    tokenService = new token_service_1.default();
    async register(indentifer) {
        try {
            const identifierData = (0, auth_utils_1.sanitizeIdentifier)(indentifer);
            // Check for existing verified user
            const existingUser = await connect_1.default.admin.findFirst({
                where: {
                    [identifierData.type]: identifierData.value,
                    status: app_constants_1.STATUS.VERIFIED,
                },
            });
            if (existingUser) {
                throw new Error("This phone number is already registered");
            }
            // Check for unverified user
            const unverifiedUser = await connect_1.default.admin.findFirst({
                where: {
                    [identifierData.type]: identifierData.value,
                    status: app_constants_1.STATUS.PENDING,
                },
            });
            if (unverifiedUser) {
                const token_sent = await this.otpService.createOtp(identifierData.value);
                return { user: unverifiedUser, token: token_sent };
            }
            // Create new user
            const newUser = await connect_1.default.admin.create({
                data: {
                    [identifierData.type]: identifierData.value,
                    firstName: "",
                    lastName: "",
                },
                select: {
                    id: true,
                    [identifierData.type]: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                },
            });
            const token_sent = await this.otpService.createOtp(identifierData.value);
            return { user: newUser, token: token_sent };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`User registration failed: ${error.message}`);
            }
            throw new Error("An unexpected error occurred during registration");
        }
    }
    async verifyOtp(identifier, otp) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        console.log(identifierData);
        const user = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!user) {
            throw new Error("Admin not found");
        }
        const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);
        if (!verifiedOtp) {
            throw new Error("Invalid OTP");
        }
        const updatedAdmin = await connect_1.default.admin.update({
            where: { id: user.id },
            data: {
                status: app_constants_1.STATUS.VERIFIED,
                isEmailVerified: true,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });
        return { admin: updatedAdmin, otp: verifiedOtp };
    }
    async completeRegistration(data) {
        // check if otp is valid
        const otp = await this.otpService.getOtp(data.token);
        if (!otp) {
            throw Error("Invalid OTP");
        }
        // check if user exists
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(otp.identifier);
        const user = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!user) {
            throw Error("User not found");
        }
        console.log(user);
        console.log(identifierData);
        // check if email is already in use
        const emailUser = await connect_1.default.admin.findFirst({
            where: {
                [identifierData.type]: identifierData.value,
                password: { not: null },
            },
        });
        if (emailUser) {
            throw Error("Email already in use");
        }
        // hash password
        const hashedPassword = await this.encryptionService.hashPassword(data.password.trim());
        // create user
        const newUser = await connect_1.default.admin.update({
            where: { id: user.id },
            data: {
                [identifierData.type]: identifierData.value,
                firstName: data.firstName,
                password: hashedPassword,
                status: app_constants_1.STATUS.COMPLETED,
                lastName: data.lastName,
            },
        });
        await this.otpService.deleteOtp(otp.id);
        return newUser;
    }
    async login(identifier, password) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        const user = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!user) {
            throw Error("User not found");
        }
        if (user.status !== app_constants_1.STATUS.COMPLETED || user.password === null) {
            throw Error("User not completed registration");
        }
        console.log(`hashedPassword: ${password} :  userPassword: ${user.password}`);
        const isPasswordValid = await this.encryptionService.comparePassword(user.password, password);
        if (!isPasswordValid) {
            throw Error("Invalid password");
        }
        return user;
    }
    async generateToken(id, name) {
        const token = await this.tokenService.generateToken(id, name);
        return token;
    }
    async logout(id) {
        await this.tokenService.deleteToken(id);
    }
    async updatePassword(user, password, passwordConfirmation, oldPassword) {
        if (password !== passwordConfirmation) {
            throw Error("Password and password confirmation do not match");
        }
        const isPasswordValid = await this.encryptionService.comparePassword(oldPassword, user.password || "");
        if (!isPasswordValid) {
            throw Error("Invalid old password");
        }
        const hashedPassword = await this.encryptionService.hashPassword(password);
        const updatedUser = await connect_1.default.admin.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        });
        return updatedUser;
    }
}
exports.AuthAdminService = AuthAdminService;
