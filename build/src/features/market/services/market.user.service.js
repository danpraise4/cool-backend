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
const app_exception_1 = __importDefault(require("../../../infastructure/https/exception/app.exception"));
const http_status_1 = __importDefault(require("http-status"));
const region_1 = require("../../../shared/config/region");
const email_notification_service_1 = require("../../../shared/services/email/email-notification.service");
const notification_service_1 = require("../../../shared/services/notification/notification.service");
const market_order_utils_1 = require("../market.order.utils");
const market_charity_utils_1 = require("../market.charity.utils");
class MarketUserService {
    materialService;
    walletService;
    constructor() {
        this.materialService = new materials_services_1.MaterialsService();
        this.walletService = new wallet_services_1.WalletService();
    }
    async createProduct(config, user) {
        const uploads = [];
        if (config.media?.length) {
            for (const image of config.media) {
                const upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${(0, uuid_1.v4)()}-${uploads.length}`, "image/png");
                uploads.push(upload.url);
            }
        }
        const currency = (0, region_1.getCurrencyForCity)(user.cityOfResidence);
        const product = await connect_1.default.product.create({
            data: {
                title: config.title,
                description: config.description,
                material: config.material.toString(),
                images: uploads,
                userId: user.id,
                currency,
                type: config.type || client_1.ProductType.SALES_PRODUCT,
                ...(config.price ? { price: config.price } : {}),
            },
        });
        email_notification_service_1.emailNotificationService.notifyUser(user.id, email_notification_service_1.EmailNotificationType.PRODUCT_UPLOADED, {
            firstName: user.firstName,
            productTitle: product.title,
        });
        void notification_service_1.notificationService.createAndSend(user.id, {
            title: "Product listed",
            body: `Your product "${product.title}" was uploaded successfully.`,
            link: "/market",
            type: "PRODUCT_UPLOADED",
            data: {
                type: "PRODUCT_UPLOADED",
                productId: product.id,
            },
        });
        return product;
    }
    async getAvailableProducts(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = {
            status: client_1.Status.PUBLISHED,
            isSold: false,
            NOT: { userId },
        };
        const [products, total] = await Promise.all([
            connect_1.default.product.findMany({
                where,
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true, image: true, phone: true },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            connect_1.default.product.count({ where }),
        ]);
        const materials = await Promise.all(products.map((p) => this.materialService.getMaterialsById(p.material)));
        return {
            products: products.map((p, i) => ({ ...p, material: materials[i].payload })),
            meta: {
                currentPage: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getUserProducts(userId, page = 1, limit = 10, type, status) {
        const skip = (page - 1) * limit;
        const where = {
            userId,
            type,
            isSold: status === "isSold",
        };
        const [products, total] = await Promise.all([
            connect_1.default.product.findMany({
                where,
                include: {
                    soldTo: {
                        select: { id: true, firstName: true, lastName: true, image: true },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            connect_1.default.product.count({ where: { userId } }),
        ]);
        const materials = await Promise.all(products.map((p) => this.materialService.getMaterialsById(p.material)));
        return {
            products: products.map((p, i) => ({ ...p, material: materials[i].payload })),
            meta: {
                currentPage: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getPurchasedProducts(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = { soldToId: userId, isSold: true };
        const [products, total] = await Promise.all([
            connect_1.default.product.findMany({
                where,
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true, image: true, phone: true },
                    },
                },
                skip,
                take: limit,
                orderBy: { soldAt: "desc" },
            }),
            connect_1.default.product.count({ where }),
        ]);
        const materials = await Promise.all(products.map((p) => this.materialService.getMaterialsById(p.material)));
        return {
            products: products.map((p, i) => ({ ...p, material: materials[i].payload })),
            meta: {
                currentPage: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getProductById(productId) {
        const product = await connect_1.default.product.findUnique({
            where: { id: productId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                        phone: true,
                        address: true,
                        city: true,
                    },
                },
                soldTo: {
                    select: { id: true, firstName: true, lastName: true, image: true },
                },
            },
        });
        if (!product) {
            throw new app_exception_1.default("Product not found", http_status_1.default.NOT_FOUND);
        }
        const resolvedMaterial = await this.resolveMaterialById(product.material);
        return (0, market_order_utils_1.enrichOrderProduct)(product, resolvedMaterial);
    }
    async getOrderById(orderId) {
        return connect_1.default.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, image: true },
                },
                product: {
                    include: {
                        createdBy: {
                            select: { id: true, firstName: true, lastName: true, image: true, phone: true },
                        },
                    },
                },
            },
        });
    }
    async getOrderByReference(reference) {
        return connect_1.default.order.findFirst({
            where: { reference },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, image: true },
                },
                product: {
                    include: {
                        createdBy: {
                            select: { id: true, firstName: true, lastName: true, image: true, phone: true },
                        },
                    },
                },
            },
        });
    }
    async updateProduct(productId, userId, config) {
        const product = await connect_1.default.product.findFirst({
            where: { id: productId, userId },
        });
        if (!product) {
            throw new app_exception_1.default("Product not found or unauthorized", http_status_1.default.NOT_FOUND);
        }
        if (product.isSold) {
            throw new app_exception_1.default("Cannot update a sold product", http_status_1.default.BAD_REQUEST);
        }
        let images = [...product.images];
        if (config.newImages?.length) {
            const newUrls = await Promise.all(config.newImages.map(async (image) => {
                const upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${(0, uuid_1.v4)()}-${images.length}`, "image/png");
                return upload.url;
            }));
            images = [...images, ...newUrls];
        }
        if (config.removeImages?.length) {
            for (const url of config.removeImages) {
                const idx = images.indexOf(url);
                if (idx > -1) {
                    images.splice(idx, 1);
                    await blobstorage_service_1.AzureBlobService.instance.deleteImage(url);
                }
            }
        }
        return connect_1.default.product.update({
            where: { id: productId },
            data: {
                title: config.title,
                description: config.body,
                price: config.price,
                images,
                status: config.status,
            },
        });
    }
    async deleteProduct(productId, userId) {
        const product = await connect_1.default.product.findFirst({
            where: { id: productId, userId },
        });
        if (!product) {
            throw new app_exception_1.default("Product not found or unauthorized", http_status_1.default.NOT_FOUND);
        }
        if (product.isSold) {
            throw new app_exception_1.default("Cannot delete a sold product", http_status_1.default.BAD_REQUEST);
        }
        const requests = await connect_1.default.charityProductRequest.count({
            where: { productId },
        });
        if (requests > 0) {
            throw new app_exception_1.default("Cannot delete a product with pending requests", http_status_1.default.BAD_REQUEST);
        }
        await connect_1.default.product.delete({ where: { id: productId } });
    }
    async markAsSold(productId, buyerId) {
        const product = await connect_1.default.product.update({
            where: { id: productId },
            data: {
                isSold: true,
                soldAt: new Date(),
                soldToId: buyerId,
                status: client_1.Status.COMPLETED,
            },
        });
        await this.removeProductFromAllCarts(productId);
        return product;
    }
    async removeProductFromAllCarts(productId) {
        await connect_1.default.chartProduct.deleteMany({ where: { productId } });
    }
    async requestCharityProduct(productId, userId) {
        const product = await this.getProductById(productId);
        if (product.type !== client_1.ProductType.CHARITY_PRODUCT) {
            throw new app_exception_1.default("Product is not a charity product", http_status_1.default.BAD_REQUEST);
        }
        if (product.isSold) {
            throw new app_exception_1.default("Product is already sold", http_status_1.default.BAD_REQUEST);
        }
        if (product.status !== client_1.Status.PUBLISHED) {
            throw new app_exception_1.default("Product is not available", http_status_1.default.BAD_REQUEST);
        }
        if (product.userId === userId) {
            throw new app_exception_1.default("Cannot request your own product", http_status_1.default.BAD_REQUEST);
        }
        const existingRequest = await connect_1.default.charityProductRequest.findFirst({
            where: { productId, userId },
        });
        if (existingRequest) {
            throw new app_exception_1.default("You have already requested this product", http_status_1.default.CONFLICT);
        }
        const request = await connect_1.default.charityProductRequest.create({
            data: { productId, userId },
        });
        const requester = await connect_1.default.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true },
        });
        email_notification_service_1.emailNotificationService.notifyUser(product.userId, email_notification_service_1.EmailNotificationType.CHARITY_REQUEST_RECEIVED, {
            productTitle: product.title,
            requesterName: requester
                ? `${requester.firstName} ${requester.lastName}`.trim()
                : "A user",
        });
        void notification_service_1.notificationService.createAndSend(product.userId, {
            title: "Charity request received",
            body: `${requester ? `${requester.firstName} ${requester.lastName}`.trim() : "Someone"} requested your charity item "${product.title}".`,
            link: "/market/charity",
            type: "CHARITY_REQUEST_RECEIVED",
            data: {
                type: "CHARITY_REQUEST_RECEIVED",
                productId,
                requestId: request.id,
            },
        });
        return request;
    }
    async toggleProductToCart(productId, userId) {
        const product = await this.getProductById(productId);
        if (product.type === client_1.ProductType.CHARITY_PRODUCT) {
            throw new app_exception_1.default("Cannot add charity products to cart", http_status_1.default.BAD_REQUEST);
        }
        if (product.isSold) {
            throw new app_exception_1.default("Product is already sold", http_status_1.default.BAD_REQUEST);
        }
        if (product.status !== client_1.Status.PUBLISHED) {
            throw new app_exception_1.default("Product is not available", http_status_1.default.BAD_REQUEST);
        }
        const existing = await connect_1.default.chartProduct.findFirst({
            where: { productId, userId },
        });
        if (existing) {
            await connect_1.default.chartProduct.delete({ where: { id: existing.id } });
            return {
                message: "Product removed from cart",
                inCart: false,
                productId,
            };
        }
        const cartItem = await connect_1.default.chartProduct.create({
            data: { productId, userId },
            select: { id: true, createdAt: true },
        });
        return {
            message: "Product added to cart",
            inCart: true,
            id: cartItem.id,
            createdAt: cartItem.createdAt,
            productId,
            product,
        };
    }
    cartProductSelect() {
        return {
            id: true,
            title: true,
            description: true,
            price: true,
            currency: true,
            images: true,
            material: true,
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    image: true,
                    phone: true,
                    address: true,
                    city: true,
                },
            },
        };
    }
    mapCartItems(items, materialMap) {
        return items.map((item) => {
            if (!item.product) {
                throw new app_exception_1.default(`Cart item ${item.id} is missing product data`, http_status_1.default.INTERNAL_SERVER_ERROR);
            }
            return {
                id: item.id,
                createdAt: item.createdAt,
                product: (0, market_order_utils_1.enrichOrderProduct)(item.product, materialMap.get(item.product.material) ?? null),
            };
        });
    }
    async getUserCart(userId) {
        const cartItems = await connect_1.default.chartProduct.findMany({
            where: { userId },
            select: {
                id: true,
                createdAt: true,
                product: {
                    select: this.cartProductSelect(),
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const materialMap = await this.resolveMaterialsByIds(cartItems
            .map((item) => item.product?.material)
            .filter((id) => Boolean(id)));
        return this.mapCartItems(cartItems, materialMap);
    }
    async checkIfProductInCart(productId, userId) {
        const item = await connect_1.default.chartProduct.findFirst({
            where: { productId, userId },
            select: {
                id: true,
                createdAt: true,
                product: {
                    select: this.cartProductSelect(),
                },
            },
        });
        if (!item) {
            return { inCart: false, productId };
        }
        const materialMap = await this.resolveMaterialsByIds(item.product?.material ? [item.product.material] : []);
        const [mapped] = this.mapCartItems([item], materialMap);
        return {
            inCart: true,
            productId: mapped.product.id,
            id: mapped.id,
            createdAt: mapped.createdAt,
            product: mapped.product,
        };
    }
    async getProductRequests(requestId) {
        const request = await connect_1.default.charityProductRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new app_exception_1.default("Request not found", http_status_1.default.NOT_FOUND);
        }
        return request;
    }
    async getCharityHistory(userId, scopeInput) {
        const scope = (0, market_charity_utils_1.parseCharityHistoryScope)(scopeInput);
        const completedCharityWhere = {
            type: client_1.ProductType.CHARITY_PRODUCT,
            isSold: true,
            status: client_1.Status.APPROVED,
            charityProductRequest: { some: { status: client_1.Status.APPROVED } },
        };
        const productInclude = {
            createdBy: {
                select: { id: true, firstName: true, lastName: true, image: true },
            },
            soldTo: {
                select: { id: true, firstName: true, lastName: true, image: true },
            },
        };
        const [donatedProducts, receivedProducts] = await Promise.all([
            scope === "received"
                ? Promise.resolve([])
                : connect_1.default.product.findMany({
                    where: { ...completedCharityWhere, userId },
                    include: productInclude,
                }),
            scope === "donated"
                ? Promise.resolve([])
                : connect_1.default.product.findMany({
                    where: { ...completedCharityWhere, soldToId: userId },
                    include: productInclude,
                }),
        ]);
        const materialMap = await this.resolveMaterialsByIds([...donatedProducts, ...receivedProducts]
            .map((product) => product.material)
            .filter(Boolean));
        const donated = (0, market_charity_utils_1.sortCharityHistoryItems)(donatedProducts.map((product) => (0, market_charity_utils_1.mapCharityHistoryItem)(product, "DONATED", materialMap.get(product.material) ?? null)));
        const received = (0, market_charity_utils_1.sortCharityHistoryItems)(receivedProducts.map((product) => (0, market_charity_utils_1.mapCharityHistoryItem)(product, "RECEIVED", materialMap.get(product.material) ?? null)));
        return { donated, received };
    }
    /** @deprecated Use getCharityHistory instead */
    async getCharityProductsHistory(userId, page = 1, limit = 10) {
        const history = await this.getCharityHistory(userId, "donated");
        const products = history.donated.slice((page - 1) * limit, page * limit);
        return {
            products,
            meta: {
                currentPage: page,
                pageSize: limit,
                total: history.donated.length,
                totalPages: Math.ceil(history.donated.length / limit),
            },
        };
    }
    async getCharityProductsForAllUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = {
            type: client_1.ProductType.CHARITY_PRODUCT,
            isSold: false,
            status: client_1.Status.PUBLISHED,
        };
        const [products, total] = await Promise.all([
            connect_1.default.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
            connect_1.default.product.count({ where }),
        ]);
        return {
            products,
            meta: {
                currentPage: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Approve or reject a charity product request.
     * Authorization check happens BEFORE any write operations.
     */
    async approveCharityProductRequest(requestId, userId, status) {
        const normalizedStatus = this.normalizeCharityRequestStatus(status);
        const request = await this.getProductRequests(requestId);
        const product = await this.getProductById(request.productId);
        // Authorization: only the product owner can respond
        if (product.userId !== userId) {
            throw new app_exception_1.default("You are not authorized to respond to this request", http_status_1.default.FORBIDDEN);
        }
        if (request.status === client_1.Status.APPROVED) {
            throw new app_exception_1.default("Request is already approved", http_status_1.default.CONFLICT);
        }
        if (product.isSold) {
            throw new app_exception_1.default("Product is already sold", http_status_1.default.BAD_REQUEST);
        }
        if (product.status !== client_1.Status.PUBLISHED) {
            throw new app_exception_1.default("Product is not available", http_status_1.default.BAD_REQUEST);
        }
        if (product.type !== client_1.ProductType.CHARITY_PRODUCT) {
            throw new app_exception_1.default("Product is not a charity product", http_status_1.default.BAD_REQUEST);
        }
        if (normalizedStatus === client_1.Status.APPROVED) {
            await connect_1.default.$transaction([
                connect_1.default.product.update({
                    where: { id: product.id },
                    data: {
                        status: client_1.Status.APPROVED,
                        isSold: true,
                        soldAt: new Date(),
                        confirmedAt: new Date(),
                        soldToId: request.userId,
                    },
                }),
                connect_1.default.chartProduct.deleteMany({ where: { productId: product.id } }),
            ]);
            email_notification_service_1.emailNotificationService.notifyUser(request.userId, email_notification_service_1.EmailNotificationType.CHARITY_REQUEST_ACCEPTED, { productTitle: product.title });
            void notification_service_1.notificationService.createAndSend(request.userId, {
                title: "Charity request accepted",
                body: `Your request for "${product.title}" was accepted.`,
                link: "/market/charity",
                type: "CHARITY_REQUEST_ACCEPTED",
                data: {
                    type: "CHARITY_REQUEST_ACCEPTED",
                    productId: product.id,
                    requestId,
                },
            });
        }
        else if (normalizedStatus === client_1.Status.REJECTED) {
            email_notification_service_1.emailNotificationService.notifyUser(request.userId, email_notification_service_1.EmailNotificationType.CHARITY_REQUEST_REJECTED, { productTitle: product.title });
            void notification_service_1.notificationService.createAndSend(request.userId, {
                title: "Charity request declined",
                body: `Your request for "${product.title}" was declined.`,
                link: "/market/charity",
                type: "CHARITY_REQUEST_REJECTED",
                data: {
                    type: "CHARITY_REQUEST_REJECTED",
                    productId: product.id,
                    requestId,
                },
            });
        }
        return connect_1.default.charityProductRequest.update({
            where: { id: requestId },
            data: { status: normalizedStatus },
        });
    }
    normalizeCharityRequestStatus(status) {
        const value = status.trim().toUpperCase();
        if (value === "ACCEPTED" || value === "APPROVED") {
            return client_1.Status.APPROVED;
        }
        if (value === "REJECTED") {
            return client_1.Status.REJECTED;
        }
        throw new app_exception_1.default("Invalid status. Use ACCEPTED or REJECTED", http_status_1.default.BAD_REQUEST);
    }
    async getCharityProductRequests(userId) {
        const products = await connect_1.default.product.findMany({
            where: {
                type: client_1.ProductType.CHARITY_PRODUCT,
                createdBy: { id: userId },
                charityProductRequest: { some: { status: client_1.Status.PENDING } },
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
                            select: { id: true, firstName: true, lastName: true, image: true, phone: true },
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
        if (!product) {
            throw new app_exception_1.default("Product not found", http_status_1.default.NOT_FOUND);
        }
        if (product.isSold) {
            throw new app_exception_1.default("Product is already sold", http_status_1.default.BAD_REQUEST);
        }
        if (product.status !== client_1.Status.PUBLISHED) {
            throw new app_exception_1.default("Product is not available", http_status_1.default.BAD_REQUEST);
        }
        const wallet = await this.walletService.getWallet(userId);
        if (wallet.balance < product.price) {
            throw new app_exception_1.default("Insufficient funds", http_status_1.default.BAD_REQUEST);
        }
        const existingOrder = await connect_1.default.order.findFirst({
            where: { productId, userId },
        });
        if (existingOrder) {
            throw new app_exception_1.default("You have already placed an order for this product", http_status_1.default.CONFLICT);
        }
        await this.walletService.chargeWallet(userId, "Market Order", product.price, productId, client_1.TransactionType.WITHDRAWAL);
        const order = await connect_1.default.order.create({
            data: {
                reference: helper_1.Helper.generateOrderReference(),
                product: { connect: { id: productId } },
                user: { connect: { id: userId } },
                address,
                status: client_1.Status.PENDING,
            },
        });
        email_notification_service_1.emailNotificationService.notifyUser(userId, email_notification_service_1.EmailNotificationType.ORDER_PLACED, {
            productTitle: product.title,
            amount: product.price,
            currency: product.currency,
            reference: order.reference,
        });
        void notification_service_1.notificationService.createAndSend(userId, {
            title: "Order placed",
            body: `Your order for ${product.title} was placed successfully.`,
            link: "/orders",
            data: {
                type: "ORDER_PLACED",
                orderId: order.id,
                reference: order.reference,
            },
        });
        const buyer = await connect_1.default.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true },
        });
        email_notification_service_1.emailNotificationService.notifyUser(product.userId, email_notification_service_1.EmailNotificationType.ORDER_RECEIVED, {
            productTitle: product.title,
            amount: product.price,
            currency: product.currency,
            reference: order.reference,
            buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : "A buyer",
        });
        void notification_service_1.notificationService.createAndSend(product.userId, {
            title: "New order received",
            body: `${buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : "A buyer"} placed an order for ${product.title}.`,
            link: "/orders",
            data: {
                type: "ORDER_RECEIVED",
                orderId: order.id,
                reference: order.reference,
            },
        });
        return order;
    };
    confirmOrder = async (orderId, userId) => {
        if (!orderId || !userId) {
            throw new app_exception_1.default("Order ID and user ID are required", http_status_1.default.BAD_REQUEST);
        }
        const order = await this.getOrderById(orderId);
        if (!order) {
            throw new app_exception_1.default("Order not found", http_status_1.default.NOT_FOUND);
        }
        if (order.status !== client_1.Status.PENDING) {
            throw new app_exception_1.default("Order is not pending", http_status_1.default.BAD_REQUEST);
        }
        if (order.user.id !== userId) {
            throw new app_exception_1.default("You are not authorized to confirm this order", http_status_1.default.FORBIDDEN);
        }
        // Credit seller and update order + product atomically.
        // walletService.creditWallet is called OUTSIDE the transaction to avoid
        // nesting Prisma interactive transactions (not supported).
        await this.walletService.creditWallet(order.product.createdBy.id, order.product.price, "Market Order", order.id);
        const updatedOrder = await connect_1.default.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id: orderId },
                data: { status: client_1.Status.COMPLETED },
            });
            await tx.product.update({
                where: { id: order.product.id },
                data: { isSold: true, soldAt: new Date(), soldToId: userId },
            });
            await tx.chartProduct.deleteMany({
                where: { productId: order.product.id },
            });
            return updated;
        });
        // Refund competing pending orders outside the main transaction
        await this.refundPendingOrders(order.product.id, order.product.price);
        email_notification_service_1.emailNotificationService.notifyUser(order.product.createdBy.id, email_notification_service_1.EmailNotificationType.ORDER_CONFIRMED, {
            productTitle: order.product.title,
            amount: order.product.price,
            currency: order.product.currency,
            buyerName: `${order.user.firstName} ${order.user.lastName}`.trim(),
        });
        void notification_service_1.notificationService.createAndSend(order.product.createdBy.id, {
            title: "Order confirmed",
            body: `${order.user.firstName} ${order.user.lastName} confirmed the order for ${order.product.title}.`,
            link: "/orders",
            data: {
                type: "ORDER_CONFIRMED",
                orderId: updatedOrder.id,
                reference: order.reference,
            },
        });
        return updatedOrder;
    };
    async refundPendingOrders(productId, productPrice) {
        const pendingOrders = await connect_1.default.order.findMany({
            where: { productId, status: client_1.Status.PENDING },
        });
        await Promise.allSettled(pendingOrders.map(async (pending) => {
            await this.walletService.creditWallet(pending.userId, productPrice, "(Refund) Order rejected", pending.id);
            await connect_1.default.order.update({
                where: { id: pending.id },
                data: { status: client_1.Status.REJECTED },
            });
        }));
    }
    async resolveMaterialById(materialId) {
        try {
            const result = await this.materialService.getMaterialsById(materialId);
            if (result?.payload) {
                return (0, market_order_utils_1.mapAdminMaterialPayload)(result.payload);
            }
        }
        catch {
            // Fall through to local DB / ID fallback.
        }
        try {
            const local = await connect_1.default.material.findUnique({ where: { id: materialId } });
            if (local) {
                return {
                    id: local.id,
                    title: local.category,
                    category: local.category,
                    icon: local.icon,
                };
            }
        }
        catch {
            // Fall through to ID fallback in enrichOrderProduct.
        }
        return null;
    }
    async resolveMaterialsByIds(materialIds) {
        const uniqueIds = [...new Set(materialIds.filter(Boolean))];
        const entries = await Promise.all(uniqueIds.map(async (id) => [id, await this.resolveMaterialById(id)]));
        return new Map(entries);
    }
    async getOrders(userId) {
        const orders = await connect_1.default.order.findMany({
            where: { user: { id: userId } },
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
                            select: { id: true, firstName: true, lastName: true, image: true, phone: true },
                        },
                        soldTo: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const materialMap = await this.resolveMaterialsByIds(orders.map((order) => order.product?.material).filter((id) => Boolean(id)));
        return orders.map((order) => {
            (0, market_order_utils_1.assertOrderProductPresent)(order.product, order.id);
            const resolvedMaterial = materialMap.get(order.product.material) ?? null;
            return {
                ...order,
                product: (0, market_order_utils_1.enrichOrderProduct)(order.product, resolvedMaterial),
            };
        });
    }
}
exports.default = MarketUserService;
