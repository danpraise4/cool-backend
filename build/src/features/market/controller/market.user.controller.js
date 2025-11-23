"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketController = void 0;
const app_exception_1 = __importDefault(require("../../../infastructure/https/exception/app.exception"));
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
class MarketController {
    marketUserService;
    constructor(marketUserService) {
        this.marketUserService = marketUserService;
    }
    // Create new product
    createProduct = async (req, res, next) => {
        try {
            const productData = req.body;
            const user = req.user; // Assuming user is attached to request by auth middleware
            const product = await this.marketUserService.createProduct(productData, user);
            return res.status(http_status_1.default.CREATED).json({
                status: "success",
                data: product,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get all available products in marketplace
    getAvailableProducts = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const userId = req.user.id; // Assuming user is attached to request
            const result = await this.marketUserService.getAvailableProducts(userId, page, limit);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                data: result.products,
                meta: result.meta,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get user's products
    getUserProducts = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const isSold = req.query.isSold;
            const limit = parseInt(req.query.limit) || 10;
            const userId = req.user.id;
            const result = await this.marketUserService.getUserProducts(userId, page, limit, client_1.ProductType.SALES_PRODUCT, isSold);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "User products fetched successfully",
                data: result.products,
                meta: result.meta,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get charity products for auth user
    getCharityProducts = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const userId = req.user.id;
            const requestType = req.query.type;
            if (requestType === "history") {
                const result = await this.marketUserService.getCharityProductsHistory(userId, page, limit);
                return res.status(http_status_1.default.OK).json({
                    status: "success",
                    message: "Charity products fetched successfully",
                    data: result,
                });
            }
            const result = await this.marketUserService.getUserProducts(userId, page, limit, client_1.ProductType.CHARITY_PRODUCT, "isNotSold");
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Charity products fetched successfully",
                data: result,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get charity products for all users
    getCharityProductsForAllUsers = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.marketUserService.getCharityProductsForAllUsers(page, limit);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Charity products fetched successfully",
                data: result,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Request charity product
    requestCharityProduct = async (req, res, next) => {
        try {
            const productId = req.params.id;
            const userId = req.user.id;
            const result = await this.marketUserService.requestCharityProduct(productId, userId);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Charity product requested successfully",
                data: result,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Respond to charity product request
    respondToCharityProductRequest = async (req, res, next) => {
        try {
            const requestId = req.params.id;
            const userId = req.user.id;
            const status = req.body.status;
            const result = await this.marketUserService.approveCharityProductRequest(requestId, userId, status);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Charity product request responded successfully",
                data: result,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get charity product requests
    getCharityProductRequests = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const result = await this.marketUserService.getCharityProductRequests(userId);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Charity product requests fetched successfully",
                data: result,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get user's purchased products
    getPurchasedProducts = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const userId = req.user.id;
            const result = await this.marketUserService.getPurchasedProducts(userId, page, limit);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                data: result.products,
                meta: result.meta,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get single product
    getProduct = async (req, res, next) => {
        try {
            const productId = req.params.productId;
            const product = await this.marketUserService.getProductById(productId);
            return res.status(200).json({
                status: "success",
                message: "Product fetched successfully",
                data: product,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Toggle product to cart
    toggleProductToCart = async (req, res, next) => {
        try {
            const productId = req.params.id;
            const userId = req.user.id;
            const result = await this.marketUserService.toggleProductToCart(productId, userId);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Product toggled to cart successfully",
                data: result,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get user's cart
    getUserCart = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const result = await this.marketUserService.getUserCart(userId);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "User cart fetched successfully",
                data: result,
            });
        }
        catch (error) {
            console.log(error.message);
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Check if product is in cart
    checkIfProductInCart = async (req, res, next) => {
        try {
            const productId = req.params.id;
            const userId = req.user.id;
            const result = await this.marketUserService.checkIfProductInCart(productId, userId);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Product is in cart",
                data: result,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Update product
    updateProduct = async (req, res, next) => {
        try {
            const productId = req.params.id;
            const userId = req.user.id;
            const updateData = req.body;
            const updatedProduct = await this.marketUserService.updateProduct(productId, userId, updateData);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                data: updatedProduct,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Delete product
    deleteProduct = async (req, res, next) => {
        try {
            const productId = req.params.id;
            const userId = req.user.id;
            await this.marketUserService.deleteProduct(productId, userId);
            return res.status(200).json({
                status: "success",
                message: "Product deleted successfully",
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Confirm order
    confirmOrder = async (req, res, next) => {
        try {
            const { order } = req.body;
            const userId = req.user.id;
            const result = await this.marketUserService.confirmOrder(order, userId);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Order confirmed successfully",
                data: result,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Create order
    createOrder = async (req, res, next) => {
        try {
            const { productId, address } = req.body;
            const userId = req.user.id;
            const result = await this.marketUserService.createOrder(productId, userId, address);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Order created successfully",
                data: result,
            });
        }
        catch (error) {
            console.log(error);
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Get user's orders
    getOrders = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const result = await this.marketUserService.getOrders(userId);
            return res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Orders fetched successfully",
                data: result,
            });
        }
        catch (error) {
            console.error(error);
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
}
exports.MarketController = MarketController;
