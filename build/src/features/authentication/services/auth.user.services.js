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
const app_exception_1 = __importDefault(require("../../../infastructure/https/exception/app.exception"));
const http_status_1 = __importDefault(require("http-status"));
const email_notification_service_1 = require("../../../shared/services/email/email-notification.service");
const notification_service_1 = require("../../../shared/services/notification/notification.service");
exports.GOOGLE = app_config_1.default.GOOGLE;
class AuthUserService {
    otpService = new otp_service_1.OtpService();
    encryptionService = new encryption_service_1.default();
    tokenService = new token_service_1.default();
    googleClient = new google_auth_library_1.OAuth2Client({
        clientId: exports.GOOGLE.CLIENT_ID,
        clientSecret: exports.GOOGLE.CLIENT_SECRET,
    });
    async register(data) {
        const { identifier, firstName, lastName, password, confirmPassword, phone, address, cityOfResidence, latitude, longitude, token: token_id, } = data;
        const email = identifier.trim().toLowerCase();
        const existingUser = await connect_1.default.user.findFirst({ where: { email } });
        if (existingUser?.status === client_1.Status.DELETED) {
            throw new app_exception_1.default("Your account has been deleted. Please contact support.", http_status_1.default.FORBIDDEN);
        }
        if (existingUser) {
            throw new app_exception_1.default("This email is already registered", http_status_1.default.CONFLICT);
        }
        if (password !== confirmPassword) {
            throw new app_exception_1.default("Password and confirm password do not match", http_status_1.default.BAD_REQUEST);
        }
        const verifiedOtp = await this.otpService.getOtp(token_id);
        if (!verifiedOtp || verifiedOtp.expiresAt < new Date()) {
            throw new app_exception_1.default("OTP has expired", http_status_1.default.BAD_REQUEST);
        }
        if (verifiedOtp.status !== app_constants_1.STATUS.VERIFIED) {
            throw new app_exception_1.default("OTP not verified", http_status_1.default.BAD_REQUEST);
        }
        const hashedPassword = await this.encryptionService.hashPassword(password);
        const newUser = await connect_1.default.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedPassword,
                isEmailVerified: true,
                address,
                phone,
                cityOfResidence,
                isPhoneVerified: false,
                status: app_constants_1.STATUS.COMPLETED,
                latitude,
                longitude,
                locationAccuracy: client_1.LocationAccuracy.EXACT,
                settings: {
                    create: {
                        isEmailNotificationsEnabled: true,
                        isSmsNotificationsEnabled: true,
                        isPushNotificationsEnabled: true,
                    },
                },
            },
        });
        await this.otpService.deleteOtp(token_id);
        const token = await this.generateToken(newUser.id, `${newUser.firstName} ${newUser.lastName}`);
        email_notification_service_1.emailNotificationService.notifyUser(newUser.id, email_notification_service_1.EmailNotificationType.REGISTRATION, {
            firstName: newUser.firstName,
        });
        void notification_service_1.notificationService.createAndSend(newUser.id, {
            title: "Welcome to Recycool",
            body: "Your account has been created successfully.",
            link: "/home",
            data: { type: "REGISTRATION" },
        });
        return { user: newUser, token };
    }
    async checkUser(identifier) {
        const email = identifier.trim().toLowerCase();
        const user = await connect_1.default.user.findFirst({ where: { email } });
        if (user) {
            throw new app_exception_1.default("Email already in use", http_status_1.default.CONFLICT);
        }
        const otp = await this.otpService.createOtp(email);
        return otp;
    }
    async verifyOtp(identifier, otp) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);
        if (!verifiedOtp) {
            throw new app_exception_1.default("Invalid OTP", http_status_1.default.BAD_REQUEST);
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
            throw new app_exception_1.default("Invalid email or password", http_status_1.default.UNAUTHORIZED);
        }
        if (user.status === client_1.Status.DELETED) {
            throw new app_exception_1.default("Your account has been deleted. Please contact support.", http_status_1.default.FORBIDDEN);
        }
        if (user.authType === client_1.AuthType.GOOGLE) {
            throw new app_exception_1.default("Please sign in with Google", http_status_1.default.BAD_REQUEST);
        }
        const isPasswordValid = await this.encryptionService.comparePassword(user.password, password);
        if (!isPasswordValid) {
            throw new app_exception_1.default("Invalid email or password", http_status_1.default.UNAUTHORIZED);
        }
        email_notification_service_1.emailNotificationService.notifyUser(user.id, email_notification_service_1.EmailNotificationType.LOGIN, {
            firstName: user.firstName,
        });
        void notification_service_1.notificationService.createAndSend(user.id, {
            title: "New sign-in",
            body: "A new sign-in to your account was detected.",
            link: "/home",
            data: { type: "LOGIN" },
        });
        return { user };
    }
    async generateToken(id, name) {
        return this.tokenService.generateToken(id, name);
    }
    async logout(id) {
        await this.tokenService.deleteToken(id);
    }
    async updatePassword(user, newPassword, passwordConfirmation, oldPassword) {
        if (newPassword !== passwordConfirmation) {
            throw new app_exception_1.default("New password and confirmation do not match", http_status_1.default.BAD_REQUEST);
        }
        const _user = await connect_1.default.user.findUnique({ where: { id: user.id } });
        if (!_user) {
            throw new app_exception_1.default("User not found", http_status_1.default.NOT_FOUND);
        }
        const isOldPasswordValid = await this.encryptionService.comparePassword(_user.password, oldPassword);
        if (!isOldPasswordValid) {
            throw new app_exception_1.default("Current password is incorrect", http_status_1.default.BAD_REQUEST);
        }
        const isSamePassword = await this.encryptionService.comparePassword(_user.password, newPassword);
        if (isSamePassword) {
            throw new app_exception_1.default("New password cannot be the same as current password", http_status_1.default.BAD_REQUEST);
        }
        const hashedPassword = await this.encryptionService.hashPassword(newPassword);
        const updated = await connect_1.default.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        email_notification_service_1.emailNotificationService.notifyUser(user.id, email_notification_service_1.EmailNotificationType.PASSWORD_CHANGED, {
            firstName: updated.firstName,
        });
        void notification_service_1.notificationService.createAndSend(user.id, {
            title: "Password updated",
            body: "Your account password was changed.",
            link: "/settings",
            data: { type: "PASSWORD_CHANGED" },
        });
        return updated;
    }
    async googleAuth(data) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken: data.token,
            audience: exports.GOOGLE.CLIENT_ID,
        });
        const googlePayload = ticket.getPayload();
        if (!googlePayload) {
            throw new app_exception_1.default("Invalid Google token", http_status_1.default.UNAUTHORIZED);
        }
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
                    settings: {
                        create: {
                            isEmailNotificationsEnabled: true,
                            isSmsNotificationsEnabled: true,
                            isPushNotificationsEnabled: true,
                        },
                    },
                },
            });
            const _token = await this.generateToken(_user.id, `${_user.firstName} ${_user.lastName}`);
            email_notification_service_1.emailNotificationService.notifyUser(_user.id, email_notification_service_1.EmailNotificationType.REGISTRATION, {
                firstName: _user.firstName,
            });
            void notification_service_1.notificationService.createAndSend(_user.id, {
                title: "Welcome to Recycool",
                body: `Hi ${_user.firstName}, your account was created successfully.`,
                link: "/home",
                type: "REGISTRATION",
                data: { type: "REGISTRATION" },
            });
            return { isNewUser: true, user: _user, token: _token };
        }
        const _token = await this.generateToken(_user.id, `${_user.firstName} ${_user.lastName}`);
        email_notification_service_1.emailNotificationService.notifyUser(_user.id, email_notification_service_1.EmailNotificationType.LOGIN, {
            firstName: _user.firstName,
        });
        void notification_service_1.notificationService.createAndSend(_user.id, {
            title: "Welcome back",
            body: `Hi ${_user.firstName}, you signed in successfully.`,
            link: "/home",
            type: "LOGIN",
            data: { type: "LOGIN" },
        });
        return {
            isNewUser: !_user.cityOfResidence,
            user: _user,
            token: _token,
        };
    }
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
            throw new app_exception_1.default("Email not found", http_status_1.default.NOT_FOUND);
        }
        if (user.status === client_1.Status.DELETED) {
            throw new app_exception_1.default("Your account has been deleted. Please contact support.", http_status_1.default.FORBIDDEN);
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
            throw new app_exception_1.default("Email not found", http_status_1.default.NOT_FOUND);
        }
        const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);
        if (!verifiedOtp) {
            throw new app_exception_1.default("Invalid OTP", http_status_1.default.BAD_REQUEST);
        }
        return verifiedOtp;
    }
    async resetPasswordUpdate(password, passwordConfirmation, token) {
        const verifiedOtp = await this.otpService.getOtp(token);
        if (!verifiedOtp) {
            throw new app_exception_1.default("Invalid or expired token", http_status_1.default.BAD_REQUEST);
        }
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(verifiedOtp.identifier);
        const user = await connect_1.default.user.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!user) {
            throw new app_exception_1.default("User not found", http_status_1.default.NOT_FOUND);
        }
        if (password !== passwordConfirmation) {
            throw new app_exception_1.default("Password and confirmation do not match", http_status_1.default.BAD_REQUEST);
        }
        const hashedPassword = await this.encryptionService.hashPassword(password);
        const updatedUser = await connect_1.default.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        await this.otpService.deleteOtp(token);
        return updatedUser;
    }
}
exports.AuthUserService = AuthUserService;
