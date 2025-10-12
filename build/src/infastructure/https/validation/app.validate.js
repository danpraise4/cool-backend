"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../exception/app.exception"));
const pick_1 = __importDefault(require("../../../shared/helper/pick"));
const validate = (schema) => (req, _res, next) => {
    const validSchema = (0, pick_1.default)(schema, ['body', 'params', 'query']);
    const object = (0, pick_1.default)(req, Object.keys(validSchema));
    const { value, error } = joi_1.default.compile(validSchema)
        .prefs({ errors: { label: 'key' } })
        .validate(object);
    if (error) {
        const errorMessage = error.details
            .map(() => error.message.replaceAll('"', ''))
            .join(', ');
        return next(new app_exception_1.default(errorMessage, http_status_1.default.UNPROCESSABLE_ENTITY));
    }
    Object.assign(req, value);
    return next();
};
exports.default = validate;
