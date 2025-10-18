import { Router } from "express";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import { recycleController } from "../../infastructure/https/controller/controller.module";
import validate from "../../infastructure/https/validation/app.validate";
import {
  createRecycleScheduleValidator,
  getRecycleSchedulesSingleValidator,
  getRecycleSchedulesValidator,
  adminChatValidator,
  updateRecycleScheduleValidator,
} from "./recycle.validator";

const router = Router();

router
  .route("/")
  .get(
    isUserAuthenticated,
    validate(getRecycleSchedulesValidator),
    recycleController.getRecycleSchedules
  );

router
  .route("/dates")
  .get(isUserAuthenticated, recycleController.getRecycleScheduleDates);

router
  .route("/chats")
  .get(isUserAuthenticated, recycleController.getRecycleChats);

router
  .route("/facility-data/:id")
  .get(isUserAuthenticated, recycleController.getRecycleFacilityData);

router.route("/admin/chats/:id").get(recycleController.getFacilityChatById);

router
  .route("/chats/initiate")
  .post(isUserAuthenticated, recycleController.initiateRecycleChat);

router
  .route("/get-schedule")
  .post(isUserAuthenticated, recycleController.getRecycleScheduleByTransactionId);

router
  .route("/admin/chats/initiate")
  .post(
    validate(adminChatValidator),
    recycleController.initiateAdminRecycleChat
  );

router
  .route("/schedule-reminders")
  .post(isUserAuthenticated, recycleController.createRecycleScheduleReminder);

router
  .route("/top-recyclers")
  .get(isUserAuthenticated, recycleController.getTopRecyclers);

router
  .route("/analytics")
  .get(isUserAuthenticated, recycleController.getUserRecyclingAnalytics);

router
  .route("/completed-schedules")
  .get(isUserAuthenticated, recycleController.getCompletedRecycleSchedules);

router
  .route("/:id")
  .get(
    isUserAuthenticated,
    validate(getRecycleSchedulesSingleValidator),
    recycleController.getRecycleSchedulesById
  );

router
  .route("/")
  .post(
    isUserAuthenticated,
    validate(createRecycleScheduleValidator),
    recycleController.createRecycleSchedule
  );

// update recycle schedule
router
  .route("/:id")
  .post(
    isUserAuthenticated,
    validate(updateRecycleScheduleValidator),
    recycleController.updateRecycleSchedule
  );

  

export default router;
