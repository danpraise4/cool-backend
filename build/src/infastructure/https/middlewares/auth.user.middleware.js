"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserAuthenticated = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../exception/app.exception"));
const token_service_1 = __importDefault(require("../../../shared/services/token.service"));
const user_services_1 = require("../../../features/user/user.services");
const isUserAuthenticated = async (req, _res, next) => {
    try {
        const _noAuth = () => next(new app_exception_1.default(`Oops!, you are not authenticated, login`, http_status_1.default.UNAUTHORIZED));
        const { authorization } = req.headers;
        const _authHeader = authorization;
        if (!_authHeader)
            return _noAuth();
        const [id, token] = _authHeader.split(" ");
        if (!id || !token)
            return _noAuth();
        if (id.trim().toLowerCase() !== "bearer")
            return _noAuth();
        const decodedToken = await new token_service_1.default().verifyToken(token);
        const { sub, type } = decodedToken;
        if (type === "refresh")
            return next(new app_exception_1.default("Oops!, wrong token type", http_status_1.default.FORBIDDEN));
        const user = await new user_services_1.UserService().getUserById(sub);
        if (!user)
            return next(new app_exception_1.default("Oops!, user does not exist", http_status_1.default.NOT_FOUND));
        req.user = user;
        next();
    }
    catch (err) {
        return next(new app_exception_1.default(err.message, err.status || http_status_1.default.UNAUTHORIZED));
    }
};
exports.isUserAuthenticated = isUserAuthenticated;
