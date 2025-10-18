import {
  IMarketCreateProduct,
  IMarketUpdateProduct,
} from "../market.interface";
import { MaterialsService } from "../../materials/materials.services";
import { AzureBlobService } from "../../../shared/services/azure/blobstorage.service";

import { v4 } from "uuid";
import prismaClient from "../../../infastructure/database/postgreSQL/connect";
import {
  Currency,
  Order,
  Product,
  ProductType,
  Status,
  TransactionType,
  User,
} from "@prisma/client";
import { WalletService } from "../../wallet/wallet.services";
import { Helper } from "../../../shared/helper/helper";

class MarketUserService {
  private readonly materialService: MaterialsService;
  private readonly walletService: WalletService;

  constructor() {
    this.materialService = new MaterialsService();
    this.walletService = new WalletService();
  }

  async createProduct(
    _config: IMarketCreateProduct,
    user: User
  ): Promise<Product | null> {
    // check if material exists

    const _uploads: string[] = [];
    const material = await _config.material.toString();

    // upload images :
    if (_config.media != null && _config.media.length > 0) {
      // Upload each image and collect responses
      for (const image of _config.media) {
        const _file = v4();
        const _upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          `${_file}-${_uploads.length}`,
          "image/png"
        );
        _uploads.push(_upload.url);
      }
    }

    const currency: Currency = user.cityOfResidence === "Lagos" ? Currency.NGN : Currency.EUR;
    const product = await prismaClient.product.create({
      data: {
        title: _config.title,
        description: _config.description,
        material: material,
        images: _uploads,
        userId: user.id,
        currency: currency,
        type: _config.type || ProductType.SALES_PRODUCT,
        ...(_config.price ? { price: _config.price } : {}),
      },
    });

    return product;
  }

  // Get all available market products (excluding user's own products)
  async getAvailableProducts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const products = await prismaClient.product.findMany({
      where: {
        status: Status.PUBLISHED,
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
    const materialPromises = products.map((product) =>
      this.materialService.getMaterialsById(product.material)
    );
    const materials = await Promise.all(materialPromises);

    // Map materials back to products
    const productsWithMaterials = products.map((product, index) => ({
      ...product,
      material: materials[index].payload,
    }));

    const total = await prismaClient.product.count({
      where: {
        status: Status.PUBLISHED,
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
  async getUserProducts(
    userId: string,
    page = 1,
    limit = 10,
    type: ProductType,
    status: "isSold" | "isNotSold"
  ) {
    const skip = (page - 1) * limit;

    const products = await prismaClient.product.findMany({
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
    const materialPromises = products.map((product) =>
      this.materialService.getMaterialsById(product.material)
    );
    const materials = await Promise.all(materialPromises);

    // Map materials back to products
    const productsWithMaterials = products.map((product, index) => ({
      ...product,
      material: materials[index].payload,
    }));

    const total = await prismaClient.product.count({
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
  async getPurchasedProducts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const products = await prismaClient.product.findMany({
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
    const materialPromises = products.map((product) =>
      this.materialService.getMaterialsById(product.material)
    );
    const materials = await Promise.all(materialPromises);

    // Map materials back to products
    const productsWithMaterials = products.map((product, index) => ({
      ...product,
      material: materials[index].payload,
    }));

    const total = await prismaClient.product.count({
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
  async getProductById(productId: string) {
    const product = await prismaClient.product.findUnique({
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
    const material = await this.materialService.getMaterialsById(
      product.material
    );

    return {
      ...product,
      material: material.payload,
    };
  }

  // Get order by reference
  async getOrderById(orderId: string) {
    const order = await prismaClient.order.findUnique({
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
  async getOrderByReference(reference: string): Promise<Order> {
    const order = await prismaClient.order.findFirst({
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
  async updateProduct(
    productId: string,
    userId: string,
    _config: IMarketUpdateProduct
  ): Promise<Product> {
    const product = await prismaClient.product.findFirst({
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

    const _uploads: string[] = [...product.images];

    // Handle new images if any
    if (_config.newImages && _config.newImages.length > 0) {
      for (const image of _config.newImages) {
        const _file = v4();
        const _upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          `${_file}-${_uploads.length}`,
          "image/png"
        );
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
          await AzureBlobService.instance.deleteImage(imageUrl);
        }
      }
    }

    return await prismaClient.product.update({
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
  async deleteProduct(productId: string, userId: string): Promise<void> {
    const product = await prismaClient.product.findFirst({
      where: {
        id: productId,
        userId: userId,
      },
    });

    if (!product) {
      throw new Error("Product not found or unauthorized");
    }
    //check if product has requests
    const requests = await prismaClient.charityProductRequest.findMany({
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

    await prismaClient.product.delete({
      where: {
        id: productId,
      },
    });
  }

  // Mark product as sold
  async markAsSold(productId: string, buyerId: string): Promise<Product> {
    return await prismaClient.product.update({
      where: {
        id: productId,
      },
      data: {
        isSold: true,
        soldAt: new Date(),
        soldToId: buyerId,
        status: Status.COMPLETED,
      },
    });
  }

  // Request charity product
  async requestCharityProduct(productId: string, userId: string) {
    const product = await this.getProductById(productId);

    if (product.type !== ProductType.CHARITY_PRODUCT) {
      throw new Error("Product is not a charity product");
    }

    if (product.isSold) {
      throw new Error("Product is already sold");
    }

    if (product.status !== Status.PUBLISHED) {
      throw new Error("Product is not published");
    }

    if (product.userId === userId) {
      throw new Error("Cannot request your own charity product");
    }
    // check if user has already requested this product
    const existingRequest = await prismaClient.charityProductRequest.findFirst({
      where: {
        productId: productId,
        userId: userId,
      },
    });

    if (existingRequest) {
      throw new Error("You have already requested this product");
    }

    const charityProductRequest =
      await prismaClient.charityProductRequest.create({
        data: {
          productId: productId,
          userId: userId,
        },
      });

    return charityProductRequest;
  }

  // add toggle Products to cart
  async toggleProductToCart(productId: string, userId: string) {
    const product = await this.getProductById(productId);

    if (product.type === ProductType.CHARITY_PRODUCT) {
      throw new Error("Cannot add charity product to cart");
    }

    if (product.isSold) {
      throw new Error("Product is already sold");
    }

    if (product.status !== Status.PUBLISHED) {
      throw new Error("Product is not published");
    }

    const charityProduct = await prismaClient.chartProduct.findFirst({
      where: {
        productId: productId,
        userId: userId,
      },
    });

    if (charityProduct) {
      await prismaClient.chartProduct.delete({
        where: { id: charityProduct.id },
      });
      return { message: "Product removed from cart" };
    } else {
      await prismaClient.chartProduct.create({
        data: {
          productId: productId,
          userId: userId,
        },
      });
      return { message: "Product added to cart" };
    }
  }

  // Get user's cart
  async getUserCart(userId: string) {
    const cart = await prismaClient.chartProduct.findMany({
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
  async checkIfProductInCart(productId: string, userId: string) {
    const cart = await prismaClient.chartProduct.findFirst({
      where: { productId: productId, userId: userId },
    });
    return cart ? true : false;
  }

  // Get charity product requests
  async getProductRequests(requestId: string) {
    const request = await prismaClient.charityProductRequest.findUnique({
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
  async getCharityProductsHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const total = await prismaClient.product.count({
      where: {
        type: ProductType.CHARITY_PRODUCT,
        createdBy: {
          id: userId,
        },
        isSold: true,
        OR: [
          {
            status: Status.COMPLETED,
          },
        ],
      },
    });

    const products = await prismaClient.product.findMany({
      where: {
        type: ProductType.CHARITY_PRODUCT,
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
    const total = await prismaClient.product.count({
      where: {
        type: ProductType.CHARITY_PRODUCT,
        isSold: false,
        status: Status.PUBLISHED,
      },
    });

    const products = await prismaClient.product.findMany({
      where: {
        type: ProductType.CHARITY_PRODUCT,
        isSold: false,
        status: Status.PUBLISHED,
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
  async approveCharityProductRequest(
    requestId: string,
    userId: string, // Id of the user who is approving the request
    status: "APPROVED" | "REJECTED"
  ) {
    const request = await this.getProductRequests(requestId);

    if (request.status === Status.APPROVED) {
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
        condition: product.status !== Status.PUBLISHED,
        message: "Product is not published",
      },
      {
        condition: product.type !== ProductType.CHARITY_PRODUCT,
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
      await prismaClient.product.update({
        where: { id: product.id },
        data: {
          status: status === "APPROVED" ? Status.APPROVED : Status.REJECTED,
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

    const updateRequest = await prismaClient.charityProductRequest.update({
      where: { id: requestId },
      data: {
        status: status,
      },
    });

    return updateRequest;
  }

  // Get all charity product requests
  async getCharityProductRequests(userId: string) {
    const products = await prismaClient.product.findMany({
      where: {
        type: ProductType.CHARITY_PRODUCT,
        createdBy: {
          id: userId,
        },
        charityProductRequest: {
          some: {
            status: Status.PENDING,
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

  createOrder = async (productId: string, userId: string, address: string) => {
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

    if (product.status !== Status.PUBLISHED) {
      throw new Error("Product is not published");
    }

    // check if user has already ordered this product
    const existingOrder = await prismaClient.order.findFirst({
      where: { productId: productId, userId: userId },
    });
    if (existingOrder) {
      throw new Error("You have already ordered this product");
    }

    await this.walletService.chargeWallet(
      userId,
      "Market Order",
      product.price,
      productId,
      TransactionType.WITHDRAWAL
    );
    const reference = Helper.generateOrderReference();
    const order = await prismaClient.order.create({
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
        status: Status.PENDING,
      },
    });



    return order;
  };
  
  confirmOrder = async (orderId: string, userId: string) => {
    // Validate inputs
    if (!orderId || !userId) {
      throw new Error("Order ID and User ID are required");
    }

    const order = await this.getOrderById(orderId);

    // Validate order existence and permissions
    this.validateOrderForConfirmation(order, userId);

    try {
      // Use transaction to ensure data consistency
      const result = await prismaClient.$transaction(async (tx) => {
        // Credit the seller's wallet
        await this.walletService.creditWallet(
          order.product.createdBy.id,
          order.product.price,
          "Market Order",
          order.id
        );

        // Update order status
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: Status.COMPLETED,
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
    } catch (error: any) {
      throw new Error(`Failed to confirm order: ${error.message}`);
    }
  };

  private validateOrderForConfirmation(order: any, userId: string): void {
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== Status.PENDING) {
      throw new Error("Order is not pending");
    }

    if (order.user.id !== userId) {
      throw new Error("You are not authorized to confirm this order");
    }

    // if (order.product.isSold) {
    //   throw new Error("Product is already confirmed");
    // }
  }

  private async refundPendingOrders(productId: string, productPrice: number): Promise<void> {
    const pendingOrders = await prismaClient.order.findMany({
      where: {
        productId: productId,
        status: Status.PENDING
      },
    });

    // Process refunds in parallel for better performance
    const refundPromises = pendingOrders.map(async (pendingOrder) => {
      try {
        await this.walletService.creditWallet(
          pendingOrder.userId,
          productPrice,
          "(Refund) Order Rejected",
          pendingOrder.id
        );

        await prismaClient.order.update({
          where: { id: pendingOrder.id },
          data: {
            status: Status.REJECTED,
          },
        });
      } catch (error) {
        console.error(`Failed to refund order ${pendingOrder.id}:`, error);
        // Consider implementing a retry mechanism or dead letter queue here
      }
    });

    await Promise.allSettled(refundPromises);
  }

  // Get user's orders
  async getOrders(_userId: string) {
    const orders = await prismaClient.order.findMany({
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

export default MarketUserService;
