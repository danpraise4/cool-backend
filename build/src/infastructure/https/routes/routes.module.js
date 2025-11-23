"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_user_routes_1 = __importDefault(require("../../../features/authentication/routes/auth.user.routes"));
const user_routes_1 = __importDefault(require("../../../features/user/user.routes"));
const community_routes_1 = __importDefault(require("../../../features/community/community.routes"));
const wallet_routes_1 = __importDefault(require("../../../features/wallet/wallet.routes"));
const news_routes_1 = __importDefault(require("../../../features/news/news.routes"));
const materials_routes_1 = __importDefault(require("../../../features/materials/materials.routes"));
const market_user_routes_1 = __importDefault(require("../../../features/market/routes/market.user.routes"));
const auth_admin_routes_1 = __importDefault(require("../../../features/authentication/routes/auth.admin.routes"));
const facilities_routes_1 = __importDefault(require("../../../features/facilities/facilities.routes"));
const recycle_routes_1 = __importDefault(require("../../../features/recycle/recycle.routes"));
const router = (0, express_1.Router)();
const defaultRoutes = [
    { path: "/user", route: user_routes_1.default },
    { path: "/news", route: news_routes_1.default },
    { path: "/wallet", route: wallet_routes_1.default },
    { path: "/market", route: market_user_routes_1.default },
    { path: "/auth/user", route: auth_user_routes_1.default },
    { path: "/auth/admin", route: auth_admin_routes_1.default },
    { path: "/materials", route: materials_routes_1.default },
    { path: "/community", route: community_routes_1.default },
    { path: "/facilities", route: facilities_routes_1.default },
    { path: "/recycle", route: recycle_routes_1.default },
];
defaultRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});
exports.default = router;
