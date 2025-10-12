"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECYCLE_REQUEST_STATUS = exports.WS_EVENT = exports.RANDOM_STRING_TYPE = exports.USER_TYPE = exports.ACCOUNT_STATUS = exports.APP_STATUS = exports.STATUS = exports.ENVIRONMENT_TYPE = void 0;
var ENVIRONMENT_TYPE;
(function (ENVIRONMENT_TYPE) {
    ENVIRONMENT_TYPE["DEVELOPMENT"] = "development";
    ENVIRONMENT_TYPE["PRODUCTION"] = "production";
    ENVIRONMENT_TYPE["STAGING"] = "staging";
})(ENVIRONMENT_TYPE || (exports.ENVIRONMENT_TYPE = ENVIRONMENT_TYPE = {}));
var STATUS;
(function (STATUS) {
    STATUS["PENDING"] = "PENDING";
    STATUS["COMPLETED"] = "COMPLETED";
    STATUS["FAILED"] = "FAILED";
    STATUS["EXPIRED"] = "EXPIRED";
    STATUS["VERIFIED"] = "VERIFIED";
})(STATUS || (exports.STATUS = STATUS = {}));
var APP_STATUS;
(function (APP_STATUS) {
    APP_STATUS["ACTIVE"] = "active";
    APP_STATUS["INACTIVE"] = "inactive";
    APP_STATUS["PENDING"] = "pending";
    APP_STATUS["BLOCKED"] = "blocked";
})(APP_STATUS || (exports.APP_STATUS = APP_STATUS = {}));
var ACCOUNT_STATUS;
(function (ACCOUNT_STATUS) {
    ACCOUNT_STATUS["ACTIVE"] = "active";
    ACCOUNT_STATUS["INACTIVE"] = "inactive";
    ACCOUNT_STATUS["PENDING"] = "pending";
    ACCOUNT_STATUS["BLOCKED"] = "blocked";
})(ACCOUNT_STATUS || (exports.ACCOUNT_STATUS = ACCOUNT_STATUS = {}));
var USER_TYPE;
(function (USER_TYPE) {
    USER_TYPE["ADMIN"] = "admin";
    USER_TYPE["USER"] = "user";
})(USER_TYPE || (exports.USER_TYPE = USER_TYPE = {}));
var RANDOM_STRING_TYPE;
(function (RANDOM_STRING_TYPE) {
    RANDOM_STRING_TYPE["NUM"] = "num";
    RANDOM_STRING_TYPE["UPPER"] = "upper";
    RANDOM_STRING_TYPE["LOWER"] = "lower";
    RANDOM_STRING_TYPE["UPPER_NUM"] = "upper-num";
    RANDOM_STRING_TYPE["LOWER_NUM"] = "lower-num";
    RANDOM_STRING_TYPE["ALPHA"] = "alpha";
    RANDOM_STRING_TYPE["ALPHA_NUM"] = "alpha-num";
})(RANDOM_STRING_TYPE || (exports.RANDOM_STRING_TYPE = RANDOM_STRING_TYPE = {}));
var WS_EVENT;
(function (WS_EVENT) {
    WS_EVENT["CONNECTION"] = "connection";
    WS_EVENT["DISCONNECTED"] = "disconnected";
    WS_EVENT["CHAT_JOIN"] = "join_chat";
    WS_EVENT["CHAT_MESSAGE"] = "chat_message";
    WS_EVENT["ROOM_JOINED"] = "room_joined";
    WS_EVENT["USER_JOINED_ROOM"] = "user_joined_room";
    WS_EVENT["USER_JOINED_CHAT"] = "user_joined_chat";
    WS_EVENT["SEND_CHAT_MESSAGE"] = "send_chat_message";
    WS_EVENT["JOIN"] = "join";
})(WS_EVENT || (exports.WS_EVENT = WS_EVENT = {}));
var RECYCLE_REQUEST_STATUS;
(function (RECYCLE_REQUEST_STATUS) {
    RECYCLE_REQUEST_STATUS[RECYCLE_REQUEST_STATUS["Pending"] = 0] = "Pending";
    RECYCLE_REQUEST_STATUS[RECYCLE_REQUEST_STATUS["Approved"] = 1] = "Approved";
    RECYCLE_REQUEST_STATUS[RECYCLE_REQUEST_STATUS["Confirmed"] = 2] = "Confirmed";
    RECYCLE_REQUEST_STATUS[RECYCLE_REQUEST_STATUS["Cancelled"] = 3] = "Cancelled";
    RECYCLE_REQUEST_STATUS[RECYCLE_REQUEST_STATUS["Rejected"] = 4] = "Rejected";
    RECYCLE_REQUEST_STATUS[RECYCLE_REQUEST_STATUS["Completed"] = 5] = "Completed";
})(RECYCLE_REQUEST_STATUS || (exports.RECYCLE_REQUEST_STATUS = RECYCLE_REQUEST_STATUS = {}));
