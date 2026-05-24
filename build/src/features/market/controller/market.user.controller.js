"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
class MarketController {
    marketUserService;
    constructor(marketUserService) {
        this.marketUserService = marketUserService;
    }
    createProduct = async (req, res, next) => {
        try {
            const product = await this.marketUserService.createProduct(req.body, req.user);
            return res.status(http_status_1.default.CREATED).json({ status: "success", data: product });
        }
        catch (error) {
            return next(error);
        }
    };
    getAvailableProducts = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.marketUserService.getAvailableProducts(req.user.id, page, limit);
            return res.status(http_status_1.default.OK).json({ status: "success", data: result.products, meta: result.meta });
        }
        catch (error) {
            return next(error);
        }
    };
    getUserProducts = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const isSold = req.query.isSold;
            const result = await this.marketUserService.getUserProducts(req.user.id, page, limit, client_1.ProductType.SALES_PRODUCT, isSold);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "User products fetched successfully", data: result.products, meta: result.meta });
        }
        catch (error) {
            return next(error);
        }
    };
    getCharityProducts = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            if (req.query.type === "history") {
                const result = await this.marketUserService.getCharityProductsHistory(req.user.id, page, limit);
                return res.status(http_status_1.default.OK).json({ status: "success", message: "Charity products fetched successfully", data: result });
            }
            const result = await this.marketUserService.getUserProducts(req.user.id, page, limit, client_1.ProductType.CHARITY_PRODUCT, "isNotSold");
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Charity products fetched successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    getCharityProductsForAllUsers = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.marketUserService.getCharityProductsForAllUsers(page, limit);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Charity products fetched successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    requestCharityProduct = async (req, res, next) => {
        try {
            const result = await this.marketUserService.requestCharityProduct(req.params.id, req.user.id);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Charity product requested successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    respondToCharityProductRequest = async (req, res, next) => {
        try {
            const result = await this.marketUserService.approveCharityProductRequest(req.params.id, req.user.id, req.body.status);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Charity product request responded successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    getCharityProductRequests = async (req, res, next) => {
        try {
            const result = await this.marketUserService.getCharityProductRequests(req.user.id);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Charity product requests fetched successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    getPurchasedProducts = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.marketUserService.getPurchasedProducts(req.user.id, page, limit);
            return res.status(http_status_1.default.OK).json({ status: "success", data: result.products, meta: result.meta });
        }
        catch (error) {
            return next(error);
        }
    };
    getProduct = async (req, res, next) => {
        try {
            const product = await this.marketUserService.getProductById(req.params.productId);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Product fetched successfully", data: product });
        }
        catch (error) {
            return next(error);
        }
    };
    toggleProductToCart = async (req, res, next) => {
        try {
            const result = await this.marketUserService.toggleProductToCart(req.params.id, req.user.id);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Product toggled to cart successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    getUserCart = async (req, res, next) => {
        try {
            const result = await this.marketUserService.getUserCart(req.user.id);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "User cart fetched successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    checkIfProductInCart = async (req, res, next) => {
        try {
            const result = await this.marketUserService.checkIfProductInCart(req.params.id, req.user.id);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Product is in cart", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    updateProduct = async (req, res, next) => {
        try {
            const updatedProduct = await this.marketUserService.updateProduct(req.params.id, req.user.id, req.body);
            return res.status(http_status_1.default.OK).json({ status: "success", data: updatedProduct });
        }
        catch (error) {
            return next(error);
        }
    };
    deleteProduct = async (req, res, next) => {
        try {
            await this.marketUserService.deleteProduct(req.params.id, req.user.id);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Product deleted successfully" });
        }
        catch (error) {
            return next(error);
        }
    };
    confirmOrder = async (req, res, next) => {
        try {
            const result = await this.marketUserService.confirmOrder(req.body.order, req.user.id);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Order confirmed successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    createOrder = async (req, res, next) => {
        try {
            const result = await this.marketUserService.createOrder(req.body.productId, req.user.id, req.body.address);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Order created successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
    getOrders = async (req, res, next) => {
        try {
            const result = await this.marketUserService.getOrders(req.user.id);
            return res.status(http_status_1.default.OK).json({ status: "success", message: "Orders fetched successfully", data: result });
        }
        catch (error) {
            return next(error);
        }
    };
}
exports.MarketController = MarketController;
