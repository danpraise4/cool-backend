import { Router } from "express";
import validate from "../../../infastructure/https/validation/app.validate";
import {
  loginValidator,
  verifyOtpValidator,
  registerCompleteValidator,
  updatePasswordValidator,
} from "../validators/auth.validator";
import { authAdminController } from "../../../infastructure/https/controller/controller.module";
import { isUserAuthenticated } from "../../../infastructure/https/middlewares/auth.user.middleware";
const router = Router();

// Create new User Profile
router
  .route("/login")
  .post(validate(loginValidator), authAdminController.login);

// Register User
router
  .route("/register")
  .post(validate(registerCompleteValidator), authAdminController.register);

// Verify OTP
router
  .route("/verify-otp")
  .post(validate(verifyOtpValidator), authAdminController.verifyOtp);


router
  .route("/update-password")
  .post(
    isUserAuthenticated,
    validate(updatePasswordValidator),
    authAdminController.updatePassword
  );

export default router;
