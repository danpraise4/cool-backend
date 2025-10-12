import { Router } from "express";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import { userController } from "../../infastructure/https/controller/controller.module";
import validate from "../../infastructure/https/validation/app.validate";
import { updateUserValidator, uploadImageValidator } from "./user.validator";
import { updateDeviceValidator, updateSettingsValidator } from "../authentication/validators/auth.validator";

const router = Router();

router
  .route("/")
  .get(isUserAuthenticated, userController.getUser)
  .post(
    isUserAuthenticated,
    validate(updateUserValidator),
    userController.updateUser
  );

router
  .route("/update-image")
  .put(
    isUserAuthenticated,
    validate(uploadImageValidator),
    userController.uploadImage
  );


router
  .route("/update-location")
  .patch(
    isUserAuthenticated,
    userController.updateLocation
  );

router.route("/update-device").patch(
  isUserAuthenticated,
  validate(updateDeviceValidator),
  userController.updateDeviceToken
);

router
  .route("/update-settings")
  .patch(
    isUserAuthenticated,
    validate(updateSettingsValidator),
    userController.updateSettings
  );

router.route("/get-home-charities").get(
  isUserAuthenticated,

  userController.getHomeCharities
);

router.route("/get-home-facilities").get(
  isUserAuthenticated,
  userController.getHomeFacilities
);

router.route("/get-home-heroes").get(
  isUserAuthenticated,

  userController.getHomeHeroes
);

router.route("/get-home-top-deals").get(
  isUserAuthenticated,
  userController.getHomeTopDeals
);

router.route("/delete").delete(
  isUserAuthenticated,
  userController.deleteUser
);

// Notifications
router
  .route("/get-notifications")
  .get(isUserAuthenticated, userController.getNotifications);

router
  .route("/mark-notification-as-read/:id")
  .patch(isUserAuthenticated, userController.markNotificationAsRead);

router
  .route("/mark-notification-as-unread/:id")
  .patch(isUserAuthenticated, userController.markNotificationAsUnread);

export default router;
