import { Router } from "express";
import validate from "../../infastructure/https/validation/app.validate";
import { devController } from "./dev.controller";
import { sendTestEmailValidator } from "./dev.validator";

const router = Router();

router
  .route("/test-email")
  .post(validate(sendTestEmailValidator), devController.sendTestEmail);

export default router;
