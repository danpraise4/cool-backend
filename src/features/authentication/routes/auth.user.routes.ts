import { Router } from "express";
import { authUserController } from "../../../infastructure/https/controller/controller.module";
import validate from "../../../infastructure/https/validation/app.validate";
import {
  loginValidator,
  verifyOtpValidator,
  registerCompleteValidator,
  updatePasswordValidator,
  googleAuthValidator,
  getCititiesfromLatLongValidator,
  resendOtpValidator,
  resetPasswordValidator,
  verifyResetPasswordValidator,
  resetPasswordUpdateValidator,
  checkUserValidator,
} from "../validators/auth.validator";
import { isUserAuthenticated } from "../../../infastructure/https/middlewares/auth.user.middleware";
import appInvalidateCatchMiddleware from "../../../infastructure/https/middlewares/app.inalidate.catch.middleware";

const router = Router();

// Create new User Profile
router.route("/login").post(validate(loginValidator), authUserController.login);

// Register User
router
  .route("/register")
  .post(validate(registerCompleteValidator), authUserController.register);


router
  .route("/validate-email")
  .post(validate(checkUserValidator), authUserController.checkUser);

// Verify OTP
router
  .route("/verify-otp")
  .post(validate(verifyOtpValidator), authUserController.verifyOtp);

// Resend OTP
router
  .route("/resend-otp")
  .post(validate(resendOtpValidator), authUserController.resendOtp);

router
  .route("/update-password")
  .post(
    isUserAuthenticated,
    validate(updatePasswordValidator),
    authUserController.updatePassword
  );

// Reset password
router
  .route("/reset-password")
  .post(validate(resetPasswordValidator), authUserController.resetPassword);

router
  .route("/verify-reset-password")
  .post(validate(verifyResetPasswordValidator), authUserController.verifyResetPassword);

router
  .route("/reset-password-update")
  .post(
    validate(resetPasswordUpdateValidator),
    authUserController.resetPasswordUpdate
  );

router
  .route("/google-auth")
  .post(validate(googleAuthValidator), authUserController.googleAuth);

router
  .route("/get-location")
  .get(
    appInvalidateCatchMiddleware,
    validate(getCititiesfromLatLongValidator),
    authUserController.getLocation
  );

export default router;
