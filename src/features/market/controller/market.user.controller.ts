import { NextFunction, Response } from "express";
import MarketUserService from "../services/market.user.service";
import {
  IMarketCreateProduct,
  IMarketUpdateProduct,
} from "../market.interface";
import { RequestType } from "../../../shared/helper/helper";
import AppException from "../../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import { ProductType } from "@prisma/client";

export class MarketController {
  constructor(private readonly marketUserService: MarketUserService) {}

  // Create new product
  createProduct = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const productData: IMarketCreateProduct = req.body;
      const user = req.user; // Assuming user is attached to request by auth middleware

      const product = await this.marketUserService.createProduct(
        productData,
        user
      );

      return res.status(httpStatus.CREATED).json({
        status: "success",
        data: product,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get all available products in marketplace
  getAvailableProducts = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user.id; // Assuming user is attached to request

      const result = await this.marketUserService.getAvailableProducts(
        userId,
        page,
        limit
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        data: result.products,
        meta: result.meta,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get user's products
  getUserProducts = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const isSold: "isSold" | "isNotSold" = req.query.isSold as
        | "isSold"
        | "isNotSold";
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user.id;

      const result = await this.marketUserService.getUserProducts(
        userId,
        page,
        limit,
        ProductType.SALES_PRODUCT,
        isSold
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "User products fetched successfully",
        data: result.products,
        meta: result.meta,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get charity products for auth user
  getCharityProducts = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user.id;

      const requestType = req.query.type as string;

      if (requestType === "history") {
        const result = await this.marketUserService.getCharityProductsHistory(
          userId,
          page,
          limit
        );

        return res.status(httpStatus.OK).json({
          status: "success",
          message: "Charity products fetched successfully",
          data: result,
        });
      }

      const result = await this.marketUserService.getUserProducts(
        userId,
        page,
        limit,
        ProductType.CHARITY_PRODUCT,
        "isNotSold"
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Charity products fetched successfully",
        data: result,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get charity products for all users
  getCharityProductsForAllUsers = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.marketUserService.getCharityProductsForAllUsers(
        page,
        limit
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Charity products fetched successfully",
        data: result,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Request charity product
  requestCharityProduct = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;

      const result = await this.marketUserService.requestCharityProduct(
        productId,
        userId
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Charity product requested successfully",
        data: result,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Respond to charity product request
  respondToCharityProductRequest = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const requestId = req.params.id;
      const userId = req.user.id;
      const status = req.body.status;

      const result = await this.marketUserService.approveCharityProductRequest(
        requestId,
        userId,
        status
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Charity product request responded successfully",
        data: result,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get charity product requests
  getCharityProductRequests = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.id;
      const result = await this.marketUserService.getCharityProductRequests(
        userId
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Charity product requests fetched successfully",
        data: result,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get user's purchased products
  getPurchasedProducts = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user.id;

      const result = await this.marketUserService.getPurchasedProducts(
        userId,
        page,
        limit
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        data: result.products,
        meta: result.meta,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get single product
  getProduct = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId;
      const product = await this.marketUserService.getProductById(productId);

      return res.status(200).json({
        status: "success",
        message: "Product fetched successfully",
        data: product,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Toggle product to cart
  toggleProductToCart = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;

      const result = await this.marketUserService.toggleProductToCart(
        productId,
        userId
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Product toggled to cart successfully",
        data: result,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get user's cart
  getUserCart = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const result = await this.marketUserService.getUserCart(userId);

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "User cart fetched successfully",
        data: result,
      });
    } catch (error: any) {
      console.log(error.message);
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Check if product is in cart
  checkIfProductInCart = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;
      const result = await this.marketUserService.checkIfProductInCart(
        productId,
        userId
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Product is in cart",
        data: result,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
  

  // Update product
  updateProduct = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;
      const updateData: IMarketUpdateProduct = req.body;

      const updatedProduct = await this.marketUserService.updateProduct(
        productId,
        userId,
        updateData
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        data: updatedProduct,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Delete product
  deleteProduct = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const productId = req.params.id;
      const userId = req.user.id;

      await this.marketUserService.deleteProduct(productId, userId);

      return res.status(200).json({
        status: "success",
        message: "Product deleted successfully",
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Confirm order
  confirmOrder = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { order } = req.body;
      const userId = req.user.id;

      const result = await this.marketUserService.confirmOrder(order, userId);

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Order confirmed successfully",
        data: result,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Create order
  createOrder = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const { productId, address } = req.body;
      const userId = req.user.id;
      const result = await this.marketUserService.createOrder(
        productId,
        userId,
        address
      );

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Order created successfully",
        data: result,
      });
    } catch (error: any) {
      console.log(error);
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Get user's orders
  getOrders = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const result = await this.marketUserService.getOrders(userId);

      return res.status(httpStatus.OK).json({
        status: "success",
        message: "Orders fetched successfully",
        data: result,
      });
    } catch (error: any) {
      console.error(error);
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
