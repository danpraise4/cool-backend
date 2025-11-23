"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdentifier = exports.sanitizeIdentifier = void 0;
const sanitizeIdentifier = (identifier) => {
    return {
        type: (0, exports.validateIdentifier)(identifier) ? "email" : "phone",
        value: identifier.toLowerCase().trim(),
    };
};
exports.sanitizeIdentifier = sanitizeIdentifier;
const validateIdentifier = (identifier) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
};
exports.validateIdentifier = validateIdentifier;
