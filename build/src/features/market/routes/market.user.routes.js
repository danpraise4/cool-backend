"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_module_1 = require("../../../infastructure/https/controller/controller.module");
const auth_user_middleware_1 = require("../../../infastructure/https/middlewares/auth.user.middleware");
const app_validate_1 = __importDefault(require("../../../infastructure/https/validation/app.validate"));
const market_validator_1 = require("../market.validator");
const router = (0, express_1.Router)({
    strict: true,
});
// Get user's orders
router
    .route("/orders")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getOrders);
// Get user's cart
router
    .route("/carts")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getUserCart);
// Check if product is in cart
router
    .route("/carts/:id/check")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.checkIfProductInCart);
// Get user's orders
router
    .route("/")
    .post((0, app_validate_1.default)(market_validator_1.createProductValidator), auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.createProduct);
// Get available products
router
    .route("/")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getAvailableProducts);
// Get user's products
router
    .route("/i")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getUserProducts);
// Get charity product requests for auth user
router
    .route("/i/charity/history")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getCharityProducts);
// Get charity product requests for auth user
router
    .route("/i/charity/requests")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getCharityProductRequests);
// Get charity products for auth user
router
    .route("/i/charity")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getCharityProducts);
// Request charity product
router
    .route("/charity/:id/request")
    .post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.requestCharityProduct);
// Respond to charity product request
router
    .route("/i/charity/:id/respond")
    .post(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(market_validator_1.respondToCharityProductRequestValidator), controller_module_1.marketUserController.respondToCharityProductRequest);
// Get charity products for all users
router
    .route("/charity")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getCharityProductsForAllUsers);
// Get product by id
router
    .route("/:id")
    .get((0, app_validate_1.default)(market_validator_1.productValidator), auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.getProduct);
// Update product
router
    .route("/update/:id")
    .post((0, app_validate_1.default)(market_validator_1.updateProductValidator), auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.updateProduct);
// Toggle product to cart
router
    .route("/:id/toggle-cart")
    .post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.toggleProductToCart);
// Delete product
router
    .route("/:id")
    .delete((0, app_validate_1.default)(market_validator_1.deleteProductValidator), auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.deleteProduct);
router
    .route("/order/confirm")
    .post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.confirmOrder);
router
    .route("/order")
    .post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.marketUserController.createOrder);
exports.default = router;
