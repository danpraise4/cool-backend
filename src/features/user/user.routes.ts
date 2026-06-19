import { Router } from "express";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import { userController } from "../../infastructure/https/controller/controller.module";
import validate from "../../infastructure/https/validation/app.validate";
import {
  getNotificationsQueryValidator,
  notificationIdParamValidator,
  submitRatingValidator,
  updateUserValidator,
  uploadImageValidator,
} from "./user.validator";
import { updateDeviceValidator, updateSettingsValidator } from "../authentication/validators/auth.validator";

const router = Router();

router
  .route("/ratings")
  .post(isUserAuthenticated, validate(submitRatingValidator), userController.submitRating);

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
  .get(
    isUserAuthenticated,
    validate(getNotificationsQueryValidator),
    userController.getNotifications
  );

router
  .route("/notifications/unread-count")
  .get(isUserAuthenticated, userController.getUnreadNotificationCount);

router
  .route("/mark-all-notifications-as-read")
  .patch(isUserAuthenticated, userController.markAllNotificationsAsRead);

router
  .route("/mark-notification-as-read/:id")
  .patch(
    isUserAuthenticated,
    validate(notificationIdParamValidator),
    userController.markNotificationAsRead
  );

router
  .route("/mark-notification-as-unread/:id")
  .patch(
    isUserAuthenticated,
    validate(notificationIdParamValidator),
    userController.markNotificationAsUnread
  );

router
  .route("/delete-notification/:id")
  .delete(
    isUserAuthenticated,
    validate(notificationIdParamValidator),
    userController.deleteNotification
  );

export default router;
