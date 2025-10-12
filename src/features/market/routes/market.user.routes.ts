import { Router } from "express";
import { marketUserController } from "../../../infastructure/https/controller/controller.module";
import { isUserAuthenticated } from "../../../infastructure/https/middlewares/auth.user.middleware";
import validate from "../../../infastructure/https/validation/app.validate";
import {
  createProductValidator,
  deleteProductValidator,
  productValidator,
  respondToCharityProductRequestValidator,
  updateProductValidator,
} from "../market.validator";

const router = Router({
  strict: true,
});

// Get user's orders
router
  .route("/orders")
  .get(isUserAuthenticated, marketUserController.getOrders);

// Get user's cart
router
  .route("/carts")
  .get(isUserAuthenticated, marketUserController.getUserCart);

// Check if product is in cart
router
  .route("/carts/:id/check")
  .get(isUserAuthenticated, marketUserController.checkIfProductInCart);

// Get user's orders
router
  .route("/")
  .post(
    validate(createProductValidator),
    isUserAuthenticated,
    marketUserController.createProduct
  );

// Get available products
router
  .route("/")
  .get(isUserAuthenticated, marketUserController.getAvailableProducts);

// Get user's products
router
  .route("/i")
  .get(isUserAuthenticated, marketUserController.getUserProducts);

// Get charity product requests for auth user
router
  .route("/i/charity/history")
  .get(isUserAuthenticated, marketUserController.getCharityProducts);

// Get charity product requests for auth user
router
  .route("/i/charity/requests")
  .get(isUserAuthenticated, marketUserController.getCharityProductRequests);

// Get charity products for auth user
router
  .route("/i/charity")
  .get(isUserAuthenticated, marketUserController.getCharityProducts);

// Request charity product
router
  .route("/charity/:id/request")
  .post(isUserAuthenticated, marketUserController.requestCharityProduct);

// Respond to charity product request
router
  .route("/i/charity/:id/respond")
  .post(
    isUserAuthenticated,
    validate(respondToCharityProductRequestValidator),
    marketUserController.respondToCharityProductRequest
  );

// Get charity products for all users
router
  .route("/charity")
  .get(isUserAuthenticated, marketUserController.getCharityProductsForAllUsers);

// Get product by id
router
  .route("/:id")
  .get(
    validate(productValidator),
    isUserAuthenticated,
    marketUserController.getProduct
  );

// Update product
router
  .route("/update/:id")
  .post(
    validate(updateProductValidator),
    isUserAuthenticated,
    marketUserController.updateProduct
  );

// Toggle product to cart
router
  .route("/:id/toggle-cart")
  .post(isUserAuthenticated, marketUserController.toggleProductToCart);

// Delete product
router
  .route("/:id")
  .delete(
    validate(deleteProductValidator),
    isUserAuthenticated,
    marketUserController.deleteProduct
  );

router
  .route("/order/confirm")
  .post(isUserAuthenticated, marketUserController.confirmOrder);

router
  .route("/order")
  .post(isUserAuthenticated, marketUserController.createOrder);

export default router;
