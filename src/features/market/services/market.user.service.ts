import { IMarketCreateProduct, IMarketUpdateProduct } from "../market.interface";
import { MaterialsService } from "../../materials/materials.services";
import { AzureBlobService } from "../../../shared/services/azure/blobstorage.service";
import { v4 } from "uuid";
import prisma from "../../../infastructure/database/postgreSQL/connect";
import {
  Order,
  Product,
  ProductType,
  Status,
  TransactionType,
  User,
} from "@prisma/client";
import { WalletService } from "../../wallet/wallet.services";
import { Helper } from "../../../shared/helper/helper";
import AppException from "../../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import { getCurrencyForCity } from "../../../shared/config/region";
import {
  emailNotificationService,
  EmailNotificationType,
} from "../../../shared/services/email/email-notification.service";
import { notificationService } from "../../../shared/services/notification/notification.service";
import {
  assertOrderProductPresent,
  enrichOrderProduct,
  mapAdminMaterialPayload,
  ResolvedMaterial,
} from "../market.order.utils";
import { formatUserRating } from "../../user/rating.service";
import {
  mapCharityHistoryItem,
  parseCharityHistoryScope,
  sortCharityHistoryItems,
} from "../market.charity.utils";

class MarketUserService {
  private readonly materialService: MaterialsService;
  private readonly walletService: WalletService;

  constructor() {
    this.materialService = new MaterialsService();
    this.walletService = new WalletService();
  }

  async createProduct(config: IMarketCreateProduct, user: User): Promise<Product> {
    const uploads: string[] = [];

    if (config.media?.length) {
      for (const image of config.media) {
        const upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          `${v4()}-${uploads.length}`,
          "image/png"
        );
        uploads.push(upload.url);
      }
    }

    const currency = getCurrencyForCity(user.cityOfResidence);

    const product = await prisma.product.create({
      data: {
        title: config.title,
        description: config.description,
        material: config.material.toString(),
        images: uploads,
        userId: user.id,
        currency,
        type: config.type || ProductType.SALES_PRODUCT,
        ...(config.price ? { price: config.price } : {}),
      },
    });

    emailNotificationService.notifyUser(user.id, EmailNotificationType.PRODUCT_UPLOADED, {
      firstName: user.firstName,
      productTitle: product.title,
    });

    void notificationService.createAndSend(user.id, {
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

  async getAvailableProducts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      status: Status.PUBLISHED,
      isSold: false,
      NOT: { userId },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
      prisma.product.count({ where }),
    ]);

    const materials = await Promise.all(
      products.map((p) => this.materialService.getMaterialsById(p.material))
    );

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

  async getUserProducts(
    userId: string,
    page = 1,
    limit = 10,
    type: ProductType,
    status: "isSold" | "isNotSold"
  ) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      type,
      isSold: status === "isSold",
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
      prisma.product.count({ where: { userId } }),
    ]);

    const materials = await Promise.all(
      products.map((p) => this.materialService.getMaterialsById(p.material))
    );

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

  async getPurchasedProducts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { soldToId: userId, isSold: true };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
      prisma.product.count({ where }),
    ]);

    const materials = await Promise.all(
      products.map((p) => this.materialService.getMaterialsById(p.material))
    );

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

  async getProductById(productId: string) {
    const product = await prisma.product.findUnique({
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
            averageRating: true,
            ratingCount: true,
          },
        },
        soldTo: {
          select: { id: true, firstName: true, lastName: true, image: true },
        },
      },
    });

    if (!product) {
      throw new AppException("Product not found", httpStatus.NOT_FOUND);
    }

    const resolvedMaterial = await this.resolveMaterialById(product.material);
    const enriched = enrichOrderProduct(product, resolvedMaterial);

    return {
      ...enriched,
      createdBy: product.createdBy
        ? {
            ...product.createdBy,
            ...formatUserRating(product.createdBy),
          }
        : null,
    };
  }

  async getOrderById(orderId: string) {
    return prisma.order.findUnique({
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

  async getOrderByReference(reference: string): Promise<Order> {
    return prisma.order.findFirst({
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

  async updateProduct(
    productId: string,
    userId: string,
    config: IMarketUpdateProduct
  ): Promise<Product> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new AppException("Product not found or unauthorized", httpStatus.NOT_FOUND);
    }

    if (product.isSold) {
      throw new AppException("Cannot update a sold product", httpStatus.BAD_REQUEST);
    }

    let images = [...product.images];

    if (config.newImages?.length) {
      const newUrls = await Promise.all(
        config.newImages.map(async (image) => {
          const upload = await AzureBlobService.instance.uploadBase64Image(
            image,
            `${v4()}-${images.length}`,
            "image/png"
          );
          return upload.url;
        })
      );
      images = [...images, ...newUrls];
    }

    if (config.removeImages?.length) {
      for (const url of config.removeImages) {
        const idx = images.indexOf(url);
        if (idx > -1) {
          images.splice(idx, 1);
          await AzureBlobService.instance.deleteImage(url);
        }
      }
    }

    return prisma.product.update({
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

  async deleteProduct(productId: string, userId: string): Promise<void> {
    const product = await prisma.product.findFirst({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new AppException("Product not found or unauthorized", httpStatus.NOT_FOUND);
    }

    if (product.isSold) {
      throw new AppException("Cannot delete a sold product", httpStatus.BAD_REQUEST);
    }

    const requests = await prisma.charityProductRequest.count({
      where: { productId },
    });

    if (requests > 0) {
      throw new AppException(
        "Cannot delete a product with pending requests",
        httpStatus.BAD_REQUEST
      );
    }

    await prisma.product.delete({ where: { id: productId } });
  }

  async markAsSold(productId: string, buyerId: string): Promise<Product> {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        isSold: true,
        soldAt: new Date(),
        soldToId: buyerId,
        status: Status.COMPLETED,
      },
    });

    await this.removeProductFromAllCarts(productId);
    return product;
  }

  private async removeProductFromAllCarts(productId: string): Promise<void> {
    await prisma.chartProduct.deleteMany({ where: { productId } });
  }

  async requestCharityProduct(productId: string, userId: string) {
    const product = await this.getProductById(productId);

    if (product.type !== ProductType.CHARITY_PRODUCT) {
      throw new AppException("Product is not a charity product", httpStatus.BAD_REQUEST);
    }
    if (product.isSold) {
      throw new AppException("Product is already sold", httpStatus.BAD_REQUEST);
    }
    if (product.status !== Status.PUBLISHED) {
      throw new AppException("Product is not available", httpStatus.BAD_REQUEST);
    }
    if (product.userId === userId) {
      throw new AppException(
        "Cannot request your own product",
        httpStatus.BAD_REQUEST
      );
    }

    const existingRequest = await prisma.charityProductRequest.findFirst({
      where: { productId, userId },
    });

    if (existingRequest) {
      throw new AppException("You have already requested this product", httpStatus.CONFLICT);
    }

    const request = await prisma.charityProductRequest.create({
      data: { productId, userId },
    });

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    emailNotificationService.notifyUser(product.userId, EmailNotificationType.CHARITY_REQUEST_RECEIVED, {
      productTitle: product.title,
      requesterName: requester
        ? `${requester.firstName} ${requester.lastName}`.trim()
        : "A user",
    });

    void notificationService.createAndSend(product.userId, {
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

  async toggleProductToCart(productId: string, userId: string) {
    const product = await this.getProductById(productId);

    if (product.type === ProductType.CHARITY_PRODUCT) {
      throw new AppException(
        "Cannot add charity products to cart",
        httpStatus.BAD_REQUEST
      );
    }
    if (product.isSold) {
      throw new AppException("Product is already sold", httpStatus.BAD_REQUEST);
    }
    if (product.status !== Status.PUBLISHED) {
      throw new AppException("Product is not available", httpStatus.BAD_REQUEST);
    }

    const existing = await prisma.chartProduct.findFirst({
      where: { productId, userId },
    });

    if (existing) {
      await prisma.chartProduct.delete({ where: { id: existing.id } });
      return {
        message: "Product removed from cart",
        inCart: false,
        productId,
      };
    }

    const cartItem = await prisma.chartProduct.create({
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

  private cartProductSelect() {
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

  private mapCartItems<
    T extends {
      id: string;
      createdAt: Date;
      product: {
        id: string;
        title: string;
        material: string;
        images?: string[] | null;
        [key: string]: unknown;
      } | null;
    },
  >(items: T[], materialMap: Map<string, ResolvedMaterial | null>) {
    return items.map((item) => {
      if (!item.product) {
        throw new AppException(
          `Cart item ${item.id} is missing product data`,
          httpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        id: item.id,
        createdAt: item.createdAt,
        product: enrichOrderProduct(
          item.product,
          materialMap.get(item.product.material) ?? null
        ),
      };
    });
  }

  async getUserCart(userId: string) {
    const cartItems = await prisma.chartProduct.findMany({
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

    const materialMap = await this.resolveMaterialsByIds(
      cartItems
        .map((item) => item.product?.material)
        .filter((id): id is string => Boolean(id))
    );

    return this.mapCartItems(cartItems, materialMap);
  }

  async checkIfProductInCart(productId: string, userId: string) {
    const item = await prisma.chartProduct.findFirst({
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

    const materialMap = await this.resolveMaterialsByIds(
      item.product?.material ? [item.product.material] : []
    );

    const [mapped] = this.mapCartItems([item], materialMap);

    return {
      inCart: true,
      productId: mapped.product.id,
      id: mapped.id,
      createdAt: mapped.createdAt,
      product: mapped.product,
    };
  }

  async getProductRequests(requestId: string) {
    const request = await prisma.charityProductRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppException("Request not found", httpStatus.NOT_FOUND);
    }

    return request;
  }

  async getCharityHistory(userId: string, scopeInput?: string) {
    const scope = parseCharityHistoryScope(scopeInput);
    const completedCharityWhere = {
      type: ProductType.CHARITY_PRODUCT,
      isSold: true,
      status: Status.APPROVED,
      charityProductRequest: { some: { status: Status.APPROVED } },
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
        : prisma.product.findMany({
            where: { ...completedCharityWhere, userId },
            include: productInclude,
          }),
      scope === "donated"
        ? Promise.resolve([])
        : prisma.product.findMany({
            where: { ...completedCharityWhere, soldToId: userId },
            include: productInclude,
          }),
    ]);

    const materialMap = await this.resolveMaterialsByIds(
      [...donatedProducts, ...receivedProducts]
        .map((product) => product.material)
        .filter(Boolean)
    );

    const donated = sortCharityHistoryItems(
      donatedProducts.map((product) =>
        mapCharityHistoryItem(
          product,
          "DONATED",
          materialMap.get(product.material) ?? null
        )
      )
    );

    const received = sortCharityHistoryItems(
      receivedProducts.map((product) =>
        mapCharityHistoryItem(
          product,
          "RECEIVED",
          materialMap.get(product.material) ?? null
        )
      )
    );

    return { donated, received };
  }

  /** @deprecated Use getCharityHistory instead */
  async getCharityProductsHistory(userId: string, page = 1, limit = 10) {
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
      type: ProductType.CHARITY_PRODUCT,
      isSold: false,
      status: Status.PUBLISHED,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
              averageRating: true,
              ratingCount: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((product) => ({
        ...product,
        createdBy: product.createdBy
          ? {
              ...product.createdBy,
              ...formatUserRating(product.createdBy),
            }
          : null,
      })),
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
  async approveCharityProductRequest(
    requestId: string,
    userId: string,
    status: string
  ) {
    const normalizedStatus = this.normalizeCharityRequestStatus(status);
    const request = await this.getProductRequests(requestId);
    const product = await this.getProductById(request.productId);

    // Authorization: only the product owner can respond
    if (product.userId !== userId) {
      throw new AppException(
        "You are not authorized to respond to this request",
        httpStatus.FORBIDDEN
      );
    }

    if (request.status === Status.APPROVED) {
      throw new AppException("Request is already approved", httpStatus.CONFLICT);
    }
    if (product.isSold) {
      throw new AppException("Product is already sold", httpStatus.BAD_REQUEST);
    }
    if (product.status !== Status.PUBLISHED) {
      throw new AppException("Product is not available", httpStatus.BAD_REQUEST);
    }
    if (product.type !== ProductType.CHARITY_PRODUCT) {
      throw new AppException("Product is not a charity product", httpStatus.BAD_REQUEST);
    }

    if (normalizedStatus === Status.APPROVED) {
      await prisma.$transaction([
        prisma.product.update({
          where: { id: product.id },
          data: {
            status: Status.APPROVED,
            isSold: true,
            soldAt: new Date(),
            confirmedAt: new Date(),
            soldToId: request.userId,
          },
        }),
        prisma.chartProduct.deleteMany({ where: { productId: product.id } }),
      ]);

      emailNotificationService.notifyUser(
        request.userId,
        EmailNotificationType.CHARITY_REQUEST_ACCEPTED,
        { productTitle: product.title }
      );

      void notificationService.createAndSend(request.userId, {
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
    } else if (normalizedStatus === Status.REJECTED) {
      emailNotificationService.notifyUser(
        request.userId,
        EmailNotificationType.CHARITY_REQUEST_REJECTED,
        { productTitle: product.title }
      );

      void notificationService.createAndSend(request.userId, {
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

    return prisma.charityProductRequest.update({
      where: { id: requestId },
      data: { status: normalizedStatus },
    });
  }

  private normalizeCharityRequestStatus(status: string): Status {
    const value = status.trim().toUpperCase();

    if (value === "ACCEPTED" || value === "APPROVED") {
      return Status.APPROVED;
    }

    if (value === "REJECTED") {
      return Status.REJECTED;
    }

    throw new AppException(
      "Invalid status. Use ACCEPTED or REJECTED",
      httpStatus.BAD_REQUEST
    );
  }

  async getCharityProductRequests(userId: string) {
    const products = await prisma.product.findMany({
      where: {
        type: ProductType.CHARITY_PRODUCT,
        createdBy: { id: userId },
        charityProductRequest: { some: { status: Status.PENDING } },
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

  createOrder = async (productId: string, userId: string, address: string) => {
    const product = await this.getProductById(productId);

    if (!product) {
      throw new AppException("Product not found", httpStatus.NOT_FOUND);
    }
    if (product.isSold) {
      throw new AppException("Product is already sold", httpStatus.BAD_REQUEST);
    }
    if (product.status !== Status.PUBLISHED) {
      throw new AppException("Product is not available", httpStatus.BAD_REQUEST);
    }

    const wallet = await this.walletService.getWallet(userId);

    if (wallet.balance < product.price) {
      throw new AppException("Insufficient funds", httpStatus.BAD_REQUEST);
    }

    const existingOrder = await prisma.order.findFirst({
      where: { productId, userId },
    });

    if (existingOrder) {
      throw new AppException(
        "You have already placed an order for this product",
        httpStatus.CONFLICT
      );
    }

    await this.walletService.chargeWallet(
      userId,
      "Market Order",
      product.price,
      productId,
      TransactionType.WITHDRAWAL
    );

    const order = await prisma.order.create({
      data: {
        reference: Helper.generateOrderReference(),
        product: { connect: { id: productId } },
        user: { connect: { id: userId } },
        address,
        status: Status.PENDING,
      },
    });

    emailNotificationService.notifyUser(userId, EmailNotificationType.ORDER_PLACED, {
      productTitle: product.title,
      amount: product.price,
      currency: product.currency,
      reference: order.reference,
    });

    void notificationService.createAndSend(userId, {
      title: "Order placed",
      body: `Your order for ${product.title} was placed successfully.`,
      link: "/orders",
      data: {
        type: "ORDER_PLACED",
        orderId: order.id,
        reference: order.reference,
      },
    });

    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    emailNotificationService.notifyUser(product.userId, EmailNotificationType.ORDER_RECEIVED, {
      productTitle: product.title,
      amount: product.price,
      currency: product.currency,
      reference: order.reference,
      buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : "A buyer",
    });

    void notificationService.createAndSend(product.userId, {
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

  confirmOrder = async (orderId: string, userId: string) => {
    if (!orderId || !userId) {
      throw new AppException("Order ID and user ID are required", httpStatus.BAD_REQUEST);
    }

    const order = await this.getOrderById(orderId);

    if (!order) {
      throw new AppException("Order not found", httpStatus.NOT_FOUND);
    }
    if (order.status !== Status.PENDING) {
      throw new AppException("Order is not pending", httpStatus.BAD_REQUEST);
    }
    if (order.user.id !== userId) {
      throw new AppException(
        "You are not authorized to confirm this order",
        httpStatus.FORBIDDEN
      );
    }

    // Credit seller and update order + product atomically.
    // walletService.creditWallet is called OUTSIDE the transaction to avoid
    // nesting Prisma interactive transactions (not supported).
    await this.walletService.creditWallet(
      order.product.createdBy.id,
      order.product.price,
      "Market Order",
      order.id
    );

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: Status.COMPLETED },
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

    emailNotificationService.notifyUser(
      order.product.createdBy.id,
      EmailNotificationType.ORDER_CONFIRMED,
      {
        productTitle: order.product.title,
        amount: order.product.price,
        currency: order.product.currency,
        buyerName: `${order.user.firstName} ${order.user.lastName}`.trim(),
      }
    );

    void notificationService.createAndSend(order.product.createdBy.id, {
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

  private async refundPendingOrders(
    productId: string,
    productPrice: number
  ): Promise<void> {
    const pendingOrders = await prisma.order.findMany({
      where: { productId, status: Status.PENDING },
    });

    await Promise.allSettled(
      pendingOrders.map(async (pending) => {
        await this.walletService.creditWallet(
          pending.userId,
          productPrice,
          "(Refund) Order rejected",
          pending.id
        );
        await prisma.order.update({
          where: { id: pending.id },
          data: { status: Status.REJECTED },
        });
      })
    );
  }

  private async resolveMaterialById(materialId: string): Promise<ResolvedMaterial | null> {
    try {
      const result = await this.materialService.getMaterialsById(materialId);
      if (result?.payload) {
        return mapAdminMaterialPayload(result.payload);
      }
    } catch {
      // Fall through to local DB / ID fallback.
    }

    try {
      const local = await prisma.material.findUnique({ where: { id: materialId } });
      if (local) {
        return {
          id: local.id,
          title: local.category,
          category: local.category,
          icon: local.icon,
        };
      }
    } catch {
      // Fall through to ID fallback in enrichOrderProduct.
    }

    return null;
  }

  private async resolveMaterialsByIds(materialIds: string[]): Promise<Map<string, ResolvedMaterial | null>> {
    const uniqueIds = [...new Set(materialIds.filter(Boolean))];
    const entries = await Promise.all(
      uniqueIds.map(async (id) => [id, await this.resolveMaterialById(id)] as const)
    );
    return new Map(entries);
  }

  async getOrders(userId: string) {
    const orders = await prisma.order.findMany({
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
            userId: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
                phone: true,
                averageRating: true,
                ratingCount: true,
              },
            },
            soldTo: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const materialMap = await this.resolveMaterialsByIds(
      orders.map((order) => order.product?.material).filter((id): id is string => Boolean(id))
    );

    return orders.map((order) => {
      assertOrderProductPresent(order.product, order.id);
      const resolvedMaterial = materialMap.get(order.product.material) ?? null;
      const seller = order.product.createdBy;
      const sellerRating = formatUserRating(seller);
      const enrichedProduct = enrichOrderProduct(order.product, resolvedMaterial);
      const sellerName = `${seller.firstName} ${seller.lastName}`.trim();

      return {
        ...order,
        sellerId: seller.id,
        soldBy: sellerName,
        createdBy: {
          ...seller,
          ...sellerRating,
        },
        product: {
          ...enrichedProduct,
          userId: seller.id,
          createdBy: {
            ...seller,
            ...sellerRating,
          },
        },
      };
    });
  }
}

export default MarketUserService;
