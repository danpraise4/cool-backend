import { Router } from "express";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import validate from "../../infastructure/https/validation/app.validate";
import { supportController } from "./support.controller";
import { supportContactValidator } from "./support.validator";

const router = Router();

router
  .route("/contact")
  .post(
    isUserAuthenticated,
    validate(supportContactValidator),
    supportController.submitContact
  );

export default router;
