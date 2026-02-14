"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUserService = exports.GOOGLE = void 0;
const client_1 = require("@prisma/client");
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const app_constants_1 = require("../../../shared/config/app.constants");
const encryption_service_1 = __importDefault(require("../../../shared/services/encryption.service"));
const token_service_1 = __importDefault(require("../../../shared/services/token.service"));
const otp_service_1 = require("../../otp/otp.service");
const google_auth_library_1 = require("google-auth-library");
const app_config_1 = __importDefault(require("../../../shared/config/app.config"));
const auth_utils_1 = require("../auth.utils");
exports.GOOGLE = app_config_1.default.GOOGLE;
class AuthUserService {
    constructor() { }
    otpService = new otp_service_1.OtpService();
    encryptionService = new encryption_service_1.default();
    tokenService = new token_service_1.default();
    // Google OAuth client
    googleClient = new google_auth_library_1.OAuth2Client({
        clientId: exports.GOOGLE.CLIENT_ID,
        clientSecret: exports.GOOGLE.CLIENT_SECRET,
    });
    async register(data) {
        try {
            const { identifier, firstName, lastName, password, confirmPassword, phone, address, cityOfResidence, latitude, longitude, token: token_id, } = data;
            const email = identifier.trim().toLowerCase();
            // Check for existing verified user
            const existingUser = await connect_1.default.user.findFirst({
                where: {
                    email,
                },
            });
            if (existingUser) {
                throw new Error("This email is already registered");
            }
            if (existingUser?.status === client_1.Status.DELETED) {
                throw Error("Your account has been deleted. Please contact support if you believe this is an error.");
            }
            if (password !== confirmPassword) {
                throw new Error("Password and confirm password do not match");
            }
            // check the tokenn
            const verifiedOtp = await this.otpService.getOtp(token_id);
            if (!verifiedOtp) {
                throw new Error("Invalid OTP");
            }
            if (verifiedOtp.expiresAt < new Date()) {
                throw new Error("OTP expired");
            }
            if (verifiedOtp.status !== app_constants_1.STATUS.VERIFIED) {
                throw new Error("Invalid OTP");
            }
            const hashedPassword = await this.encryptionService.hashPassword(password);
            const newUser = await connect_1.default.user.create({
                data: {
                    email,
                    firstName: firstName,
                    lastName: lastName,
                    password: hashedPassword,
                    isEmailVerified: true,
                    address: address,
                    phone: phone,
                    cityOfResidence: cityOfResidence,
                    isPhoneVerified: false,
                    status: app_constants_1.STATUS.COMPLETED,
                    latitude: latitude,
                    longitude: longitude,
                    locationAccuracy: client_1.LocationAccuracy.EXACT,
                },
            });
            await this.otpService.deleteOtp(token_id);
            const token = await this.generateToken(newUser.id, `${newUser.firstName} ${newUser.lastName}`);
            return { user: newUser, token: token };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`User registration failed: ${error.message}`);
            }
            throw new Error("An unexpected error occurred during registration");
        }
    }
    async checkUser(identifier) {
        const email = identifier.trim().toLowerCase().trim();
        const user = await connect_1.default.user.findFirst({
            where: { email },
        });
        if (user) {
            throw new Error("Email already in use");
        }
        const otp = await this.otpService.createOtp(email);
        return otp;
    }
    async verifyOtp(identifier, otp) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);
        if (!verifiedOtp) {
            throw new Error("Invalid OTP");
        }
        return { otp: verifiedOtp };
    }
    async resendOtp(identifier) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        await this.otpService.deleteUserOtp(identifierData.value);
        const token_sent = await this.otpService.createOtp(identifierData.value);
        return { token: token_sent };
    }
    async login(identifier, password) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        const user = await connect_1.default.user.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!user) {
            throw Error("Please check email and password");
        }
        if (user?.status === client_1.Status.DELETED) {
            throw Error("Your account has been deleted. Please contact support if you believe this is an error.");
        }
        if (user.authType === client_1.AuthType.GOOGLE) {
            throw Error("Please login with Google");
        }
        const isPasswordValid = await this.encryptionService.comparePassword(user.password, password);
        if (!isPasswordValid) {
            throw Error("Invalid password");
        }
        return {
            status: 200,
            message: "Login successful",
            user,
        };
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
            throw Error("The new password and confirmation password do not match");
        }
        const _user = await connect_1.default.user.findUnique({
            where: { id: user.id },
        });
        const isPasswordValid = await this.encryptionService.comparePassword(_user?.password, oldPassword);
        if (!isPasswordValid) {
            throw Error("Invalid old password");
        }
        const hashedPassword = await this.encryptionService.hashPassword(password);
        if (hashedPassword == oldPassword)
            throw Error("New password can not be same as existing password");
        const updatedUser = await connect_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        });
        return updatedUser;
    }
    async googleAuth(data) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken: data.token,
            audience: exports.GOOGLE.CLIENT_ID,
        });
        const googlePayload = ticket.getPayload();
        if (!googlePayload) {
            throw Error("Invalid Google token");
        }
        console.log(googlePayload);
        let _user = await connect_1.default.user.findFirst({
            where: { email: googlePayload.email },
        });
        if (!_user) {
            _user = await connect_1.default.user.create({
                data: {
                    email: googlePayload.email,
                    firstName: googlePayload.given_name,
                    lastName: googlePayload.family_name,
                    status: app_constants_1.STATUS.VERIFIED,
                    image: googlePayload.picture,
                    isEmailVerified: true,
                    authType: client_1.AuthType.GOOGLE,
                },
            });
            const _token = await this.generateToken(_user.id, `${_user.firstName} ${_user.lastName}`);
            return {
                isNewUser: true,
                user: _user,
                token: _token,
            };
        }
        const _token = await this.generateToken(_user.id, `${_user.firstName} ${_user.lastName}`);
        return {
            isNewUser: _user.cityOfResidence ? false : true,
            user: _user,
            token: _token,
        };
    }
    // Reset password
    async resetPassword(email) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(email);
        const user = await connect_1.default.user.findFirst({
            where: { [identifierData.type]: identifierData.value },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
                status: true,
            },
        });
        if (!user) {
            throw Error("Email not found or not registered");
        }
        if (user.status === client_1.Status.DELETED) {
            throw Error("Your account has been deleted. Please contact support if you believe this is an error.");
        }
        await this.otpService.createOtp(identifierData.value);
        return { ...user };
    }
    async verifyResetPassword(email, otp) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(email);
        const user = await connect_1.default.user.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!user) {
            throw Error("Email not found or not registered");
        }
        const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);
        if (!verifiedOtp) {
            throw Error("Invalid OTP");
        }
        return verifiedOtp;
    }
    async resetPasswordUpdate(password, passwordConfirmation, token) {
        const verifiedOtp = await this.otpService.getOtp(token);
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(verifiedOtp.identifier);
        const user = await connect_1.default.user.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!user) {
            throw Error("Email not found or not registered");
        }
        if (password !== passwordConfirmation) {
            throw Error("The new password and confirmation password do not match");
        }
        if (!verifiedOtp) {
            throw Error("Invalid OTP");
        }
        const hashedPassword = await this.encryptionService.hashPassword(password);
        const updatedUser = await connect_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        });
        await this.otpService.deleteOtp(token);
        return updatedUser;
    }
}
exports.AuthUserService = AuthUserService;
