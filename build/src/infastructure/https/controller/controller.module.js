"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recycleController = exports.marketUserController = exports.walletController = exports.facilitiesController = exports.materialsController = exports.newsController = exports.communityController = exports.userController = exports.authAdminController = exports.authUserController = void 0;
const auth_user_controller_1 = __importDefault(require("../../../features/authentication/controller/auth.user.controller"));
const auth_admin_controller_1 = __importDefault(require("../../../features/authentication/controller/auth.admin.controller"));
const auth_user_services_1 = require("../../../features/authentication/services/auth.user.services");
const recycle_controller_1 = require("../../../features/recycle/recycle.controller");
const recycle_services_1 = require("../../../features/recycle/recycle.services");
const user_controller_1 = require("../../../features/user/user.controller");
const user_services_1 = require("../../../features/user/user.services");
const wallet_controller_1 = __importDefault(require("../../../features/wallet/wallet.controller"));
const wallet_services_1 = require("../../../features/wallet/wallet.services");
const auth_admin_service_1 = require("../../../features/authentication/services/auth.admin.service");
const news_controller_1 = require("../../../features/news/news.controller");
const news_services_1 = require("../../../features/news/news.services");
const materials_services_1 = require("../../../features/materials/materials.services");
const materials_controller_1 = require("../../../features/materials/materials.controller");
const market_user_controller_1 = require("../../../features/market/controller/market.user.controller");
const market_user_service_1 = __importDefault(require("../../../features/market/services/market.user.service"));
const location_service_1 = __importDefault(require("../../../shared/services/location.service"));
const facilities_controller_1 = require("../../../features/facilities/facilities.controller");
const facilities_services_1 = require("../../../features/facilities/facilities.services");
const community_services_1 = require("../../../features/community/community.services");
const community_controller_1 = require("../../../features/community/community.controller");
// Auth Controller
exports.authUserController = new auth_user_controller_1.default(new auth_user_services_1.AuthUserService(), new location_service_1.default(), new user_services_1.UserService());
exports.authAdminController = new auth_admin_controller_1.default(new auth_admin_service_1.AuthAdminService());
// User Controller
exports.userController = new user_controller_1.UserController(new user_services_1.UserService());
// Community Controller
exports.communityController = new community_controller_1.CommunityController(new community_services_1.CommunityService());
// News Controller
exports.newsController = new news_controller_1.NewsController(new news_services_1.NewsService());
// Materials Controller
exports.materialsController = new materials_controller_1.MaterialsController(new materials_services_1.MaterialsService());
// Facilities Controller
exports.facilitiesController = new facilities_controller_1.FacilitiesController(new facilities_services_1.FacilitiesService());
// Wallet Controller
exports.walletController = new wallet_controller_1.default(new wallet_services_1.WalletService());
// Market User Controller
exports.marketUserController = new market_user_controller_1.MarketController(new market_user_service_1.default());
// Recycle Controller
exports.recycleController = new recycle_controller_1.RecycleController(new recycle_services_1.RecycleService());
