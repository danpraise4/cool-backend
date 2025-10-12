"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const materials_services_1 = require("../../materials/materials.services");
const blobstorage_service_1 = require("../../../shared/services/azure/blobstorage.service");
const uuid_1 = require("uuid");
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const client_1 = require("@prisma/client");
const wallet_services_1 = require("../../wallet/wallet.services");
const helper_1 = require("../../../shared/helper/helper");
class MarketUserService {
    materialService;
    walletService;
    constructor() {
        this.materialService = new materials_services_1.MaterialsService();
        this.walletService = new wallet_services_1.WalletService();
    }
    async createProduct(_config, user) {
        // check if material exists
        const _uploads = [];
        const material = await _config.material.toString();
        // upload images :
        if (_config.media != null && _config.media.length > 0) {
            // Upload each image and collect responses
            for (const image of _config.media) {
                const _file = (0, uuid_1.v4)();
                const _upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${_file}-${_uploads.length}`, "image/png");
                _uploads.push(_upload.url);
            }
        }
        const currency = user.cityOfResidence === "Lagos" ? client_1.Currency.NGN : client_1.Currency.EUR;
        const product = await connect_1.default.product.create({
            data: {
                title: _config.title,
                description: _config.description,
                material: material,
                images: _uploads,
                userId: user.id,
                currency: currency,
                type: _config.type || client_1.ProductType.SALES_PRODUCT,
                ...(_config.price ? { price: _config.price } : {}),
            },
        });
        return product;
    }
    // Get all available market products (excluding user's own products)
    async getAvailableProducts(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const products = await connect_1.default.product.findMany({
            where: {
                status: client_1.Status.PUBLISHED,
                isSold: false,
                NOT: {
                    userId: userId,
                },
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                        phone: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
        });
        // Get all materials in parallel
        const materialPromises = products.map((product) => this.materialService.getMaterialsById(product.material));
        const materials = await Promise.all(materialPromises);
        // Map materials back to products
        const productsWithMaterials = products.map((product, index) => ({
            ...product,
            material: materials[index].payload,
        }));
        const total = await connect_1.default.product.count({
            where: {
                status: client_1.Status.PUBLISHED,
                isSold: false,
                NOT: {
                    userId: userId,
                },
            },
        });
        console.log("productsWithMaterials", productsWithMaterials);
        return {
            products: productsWithMaterials,
            meta: {
                currentPage: page,
                pageSize: limit,
                totalPosts: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Get user's products
    async getUserProducts(userId, page = 1, limit = 10, type, status) {
        const skip = (page - 1) * limit;
        const products = await connect_1.default.product.findMany({
            where: {
                userId: userId,
                type: type,
                isSold: status === "isSold" ? true : false,
            },
            include: {
                soldTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
        });
        // Get all materials in parallel
        const materialPromises = products.map((product) => this.materialService.getMaterialsById(product.material));
        const materials = await Promise.all(materialPromises);
        // Map materials back to products
        const productsWithMaterials = products.map((product, index) => ({
            ...product,
            material: materials[index].payload,
        }));
        const total = await connect_1.default.product.count({
            where: {
                userId: userId,
            },
        });
        return {
            products: productsWithMaterials,
            meta: {
                currentPage: page,
                pageSize: limit,
                totalPosts: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Get purchased products
    async getPurchasedProducts(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const products = await connect_1.default.product.findMany({
            where: {
                soldToId: userId,
                isSold: true,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                        phone: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {
                soldAt: "desc",
            },
        });
        // Get all materials in parallel
        const materialPromises = products.map((product) => this.materialService.getMaterialsById(product.material));
        const materials = await Promise.all(materialPromises);
        // Map materials back to products
        const productsWithMaterials = products.map((product, index) => ({
            ...product,
            material: materials[index].payload,
        }));
        const total = await connect_1.default.product.count({
            where: {
                soldToId: userId,
                isSold: true,
            },
        });
        return {
            products: productsWithMaterials,
            meta: {
                currentPage: page,
                pageSize: limit,
                totalPosts: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Get single product
    async getProductById(productId) {
        const product = await connect_1.default.product.findUnique({
            where: {
                id: productId,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                        phone: true,
                    },
                },
                soldTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                    },
                },
            },
        });
        if (!product) {
            throw new Error("Product not found");
        }
        // Get material details
        const material = await this.materialService.getMaterialsById(product.material);
        return {
            ...product,
            material: material.payload,
        };
    }
    // Get order by reference
    async getOrderById(orderId) {
        const order = await connect_1.default.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                    },
                },
                product: {
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                image: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });
        return order;
    }
    // Get Order by reference
    async getOrderByReference(reference) {
        const order = await connect_1.default.order.findFirst({
            where: {
                reference: reference,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                    },
                },
                product: {
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                image: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });
        return order;
    }
    // Update product
    async updateProduct(productId, userId, _config) {
        const product = await connect_1.default.product.findFirst({
            where: {
                id: productId,
                userId: userId,
            },
        });
        if (!product) {
            throw new Error("Product not found or unauthorized");
        }
        if (product.isSold) {
            throw new Error("Cannot update sold product");
        }
        const _uploads = [...product.images];
        // Handle new images if any
        if (_config.newImages && _config.newImages.length > 0) {
            for (const image of _config.newImages) {
                const _file = (0, uuid_1.v4)();
                const _upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${_file}-${_uploads.length}`, "image/png");
                _uploads.push(_upload.url);
            }
        }
        // Remove images if specified
        if (_config.removeImages && _config.removeImages.length > 0) {
            for (const imageUrl of _config.removeImages) {
                const index = _uploads.indexOf(imageUrl);
                if (index > -1) {
                    _uploads.splice(index, 1);
                    // Optionally delete from storage
                    await blobstorage_service_1.AzureBlobService.instance.deleteImage(imageUrl);
                }
            }
        }
        return await connect_1.default.product.update({
            where: {
                id: productId,
            },
            data: {
                title: _config.title,
                description: _config.body,
                price: _config.price,
                images: _uploads,
                status: _config.status,
            },
        });
    }
    // Delete product
    async deleteProduct(productId, userId) {
        const product = await connect_1.default.product.findFirst({
            where: {
                id: productId,
                userId: userId,
            },
        });
        if (!product) {
            throw new Error("Product not found or unauthorized");
        }
        //check if product has requests
        const requests = await connect_1.default.charityProductRequest.findMany({
            where: {
                productId: productId,
            },
        });
        if (requests.length > 0) {
            throw new Error("Cannot delete product with requests");
        }
        if (product.isSold) {
            throw new Error("Cannot delete sold product");
        }
        await connect_1.default.product.delete({
            where: {
                id: productId,
            },
        });
    }
    // Mark product as sold
    async markAsSold(productId, buyerId) {
        return await connect_1.default.product.update({
            where: {
                id: productId,
            },
            data: {
                isSold: true,
                soldAt: new Date(),
                soldToId: buyerId,
                status: client_1.Status.COMPLETED,
            },
        });
    }
    // Request charity product
    async requestCharityProduct(productId, userId) {
        const product = await this.getProductById(productId);
        if (product.type !== client_1.ProductType.CHARITY_PRODUCT) {
            throw new Error("Product is not a charity product");
        }
        if (product.isSold) {
            throw new Error("Product is already sold");
        }
        if (product.status !== client_1.Status.PUBLISHED) {
            throw new Error("Product is not published");
        }
        if (product.userId === userId) {
            throw new Error("Cannot request your own charity product");
        }
        // check if user has already requested this product
        const existingRequest = await connect_1.default.charityProductRequest.findFirst({
            where: {
                productId: productId,
                userId: userId,
            },
        });
        if (existingRequest) {
            throw new Error("You have already requested this product");
        }
        const charityProductRequest = await connect_1.default.charityProductRequest.create({
            data: {
                productId: productId,
                userId: userId,
            },
        });
        return charityProductRequest;
    }
    // add toggle Products to cart
    async toggleProductToCart(productId, userId) {
        const product = await this.getProductById(productId);
        if (product.type === client_1.ProductType.CHARITY_PRODUCT) {
            throw new Error("Cannot add charity product to cart");
        }
        if (product.isSold) {
            throw new Error("Product is already sold");
        }
        if (product.status !== client_1.Status.PUBLISHED) {
            throw new Error("Product is not published");
        }
        const charityProduct = await connect_1.default.chartProduct.findFirst({
            where: {
                productId: productId,
                userId: userId,
            },
        });
        if (charityProduct) {
            await connect_1.default.chartProduct.delete({
                where: { id: charityProduct.id },
            });
            return { message: "Product removed from cart" };
        }
        else {
            await connect_1.default.chartProduct.create({
                data: {
                    productId: productId,
                    userId: userId,
                },
            });
            return { message: "Product added to cart" };
        }
    }
    // Get user's cart
    async getUserCart(userId) {
        const cart = await connect_1.default.chartProduct.findMany({
            where: { userId: userId },
            select: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        description: true,
                        price: true,
                        material: true,
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                image: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });
        return cart;
    }
    // Check if product is in cart
    async checkIfProductInCart(productId, userId) {
        const cart = await connect_1.default.chartProduct.findFirst({
            where: { productId: productId, userId: userId },
        });
        return cart ? true : false;
    }
    // Get charity product requests
    async getProductRequests(requestId) {
        const request = await connect_1.default.charityProductRequest.findUnique({
            where: {
                id: requestId,
            },
        });
        if (!request) {
            throw new Error("Request not found");
        }
        return request;
    }
    // Get charity products history that are sold or donated
    async getCharityProductsHistory(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const total = await connect_1.default.product.count({
            where: {
                type: client_1.ProductType.CHARITY_PRODUCT,
                createdBy: {
                    id: userId,
                },
                isSold: true,
                OR: [
                    {
                        status: client_1.Status.COMPLETED,
                    },
                ],
            },
        });
        const products = await connect_1.default.product.findMany({
            where: {
                type: client_1.ProductType.CHARITY_PRODUCT,
                isSold: true,
                createdBy: {
                    id: userId,
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
        });
        return {
            products,
            meta: {
                currentPage: page,
                pageSize: limit,
                totalPosts: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Get charity products for all users
    async getCharityProductsForAllUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const total = await connect_1.default.product.count({
            where: {
                type: client_1.ProductType.CHARITY_PRODUCT,
                isSold: false,
                status: client_1.Status.PUBLISHED,
            },
        });
        const products = await connect_1.default.product.findMany({
            where: {
                type: client_1.ProductType.CHARITY_PRODUCT,
                isSold: false,
                status: client_1.Status.PUBLISHED,
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
        });
        return {
            products,
            meta: {
                currentPage: page,
                pageSize: limit,
                totalPosts: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Approve charity product request
    async approveCharityProductRequest(requestId, userId, // Id of the user who is approving the request
    status) {
        const request = await this.getProductRequests(requestId);
        if (request.status === client_1.Status.APPROVED) {
            throw new Error("Request is already approved");
        }
        const product = await this.getProductById(request.productId);
        // Validate product eligibility
        const validations = [
            {
                condition: product.isSold,
                message: "Product is already sold",
            },
            {
                condition: product.status !== client_1.Status.PUBLISHED,
                message: "Product is not published",
            },
            {
                condition: product.type !== client_1.ProductType.CHARITY_PRODUCT,
                message: "Product is not a charity product",
            },
            {
                condition: product.userId === request.userId,
                message: "Cannot approve your own charity product",
            },
        ];
        for (const validation of validations) {
            if (validation.condition) {
                throw new Error(validation.message);
            }
        }
        if (status === "APPROVED") {
            await connect_1.default.product.update({
                where: { id: product.id },
                data: {
                    status: status === "APPROVED" ? client_1.Status.APPROVED : client_1.Status.REJECTED,
                    isSold: true,
                    soldAt: new Date(),
                    soldToId: request.userId,
                },
            });
        }
        console.log(product.userId);
        console.log(userId);
        if (product.userId !== userId) {
            throw new Error("You are not authorized to respond to this request");
        }
        const updateRequest = await connect_1.default.charityProductRequest.update({
            where: { id: requestId },
            data: {
                status: status,
            },
        });
        return updateRequest;
    }
    // Get all charity product requests
    async getCharityProductRequests(userId) {
        const products = await connect_1.default.product.findMany({
            where: {
                type: client_1.ProductType.CHARITY_PRODUCT,
                createdBy: {
                    id: userId,
                },
                charityProductRequest: {
                    some: {
                        status: client_1.Status.PENDING,
                    }, // Has any requests
                },
            },
            include: {
                charityProductRequest: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        userId: true,
                        productId: true,
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                image: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });
        return products.map((product) => ({
            product: {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
                images: product.images,
                status: product.status,
                createdAt: product.createdAt,
            },
            requests: product.charityProductRequest,
        }));
    }
    createOrder = async (productId, userId, address) => {
        const product = await this.getProductById(productId);
        const wallet = await this.walletService.getWallet(userId);
        if (wallet.balance < product.price) {
            throw new Error("Insufficient funds");
        }
        if (!product) {
            throw new Error("Product not found");
        }
        if (product.isSold) {
            throw new Error("Product is already sold");
        }
        if (product.status !== client_1.Status.PUBLISHED) {
            throw new Error("Product is not published");
        }
        // check if user has already ordered this product
        const existingOrder = await connect_1.default.order.findFirst({
            where: { productId: productId, userId: userId },
        });
        if (existingOrder) {
            throw new Error("You have already ordered this product");
        }
        await this.walletService.chargeWallet(userId, "Market Order", product.price, productId, client_1.TransactionType.WITHDRAWAL);
        const reference = helper_1.Helper.generateOrderReference();
        const order = await connect_1.default.order.create({
            data: {
                reference: reference,
                product: {
                    connect: {
                        id: productId,
                    },
                },
                user: {
                    connect: {
                        id: userId,
                    },
                },
                address: address,
                status: client_1.Status.PENDING,
            },
        });
        return order;
    };
    confirmOrder = async (orderId, userId) => {
        // Validate inputs
        if (!orderId || !userId) {
            throw new Error("Order ID and User ID are required");
        }
        const order = await this.getOrderById(orderId);
        // Validate order existence and permissions
        this.validateOrderForConfirmation(order, userId);
        try {
            // Use transaction to ensure data consistency
            const result = await connect_1.default.$transaction(async (tx) => {
                // Credit the seller's wallet
                await this.walletService.creditWallet(order.product.createdBy.id, order.product.price, "Market Order", order.id);
                // Update order status
                const updatedOrder = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: client_1.Status.COMPLETED,
                    },
                });
                // Mark product as sold
                await tx.product.update({
                    where: { id: order.product.id },
                    data: {
                        isSold: true,
                        soldAt: new Date(),
                        soldToId: userId,
                    },
                });
                return updatedOrder;
            });
            // Handle pending orders refund (outside transaction to avoid deadlocks)
            await this.refundPendingOrders(order.product.id, order.product.price);
            return result;
        }
        catch (error) {
            throw new Error(`Failed to confirm order: ${error.message}`);
        }
    };
    validateOrderForConfirmation(order, userId) {
        if (!order) {
            throw new Error("Order not found");
        }
        if (order.status !== client_1.Status.PENDING) {
            throw new Error("Order is not pending");
        }
        if (order.user.id !== userId) {
            throw new Error("You are not authorized to confirm this order");
        }
        if (order.product.isSold) {
            throw new Error("Product is already confirmed");
        }
    }
    async refundPendingOrders(productId, productPrice) {
        const pendingOrders = await connect_1.default.order.findMany({
            where: {
                productId: productId,
                status: client_1.Status.PENDING
            },
        });
        // Process refunds in parallel for better performance
        const refundPromises = pendingOrders.map(async (pendingOrder) => {
            try {
                await this.walletService.creditWallet(pendingOrder.userId, productPrice, "(Refund) Order Rejected", pendingOrder.id);
                await connect_1.default.order.update({
                    where: { id: pendingOrder.id },
                    data: {
                        status: client_1.Status.REJECTED,
                    },
                });
            }
            catch (error) {
                console.error(`Failed to refund order ${pendingOrder.id}:`, error);
                // Consider implementing a retry mechanism or dead letter queue here
            }
        });
        await Promise.allSettled(refundPromises);
    }
    // Get user's orders
    async getOrders(_userId) {
        const orders = await connect_1.default.order.findMany({
            where: { user: { id: _userId } },
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        price: true,
                        images: true,
                        createdAt: true,
                        updatedAt: true,
                        material: true,
                        createdBy: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                image: true,
                                phone: true,
                            },
                        },
                        soldTo: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
        return orders;
    }
}
exports.default = MarketUserService;
